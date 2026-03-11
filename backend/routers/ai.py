from fastapi import APIRouter, Depends, HTTPException, Body
from fastapi.responses import StreamingResponse
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from typing import List, Optional
import json

from backend.core.database import get_db
from backend.core.security import get_current_user
from backend.models.user import User
from backend.models.document import Document
from backend.models.loan import Loan
from backend.services.embedding_service import embedding_service
from backend.services.qdrant_service import qdrant_service
from backend.services.llm_service import llm_service

router = APIRouter(prefix="/ai", tags=["ai"])

@router.post("/query")
async def ai_query(
    question: str = Body(..., embed=True),
    top_k: int = Body(5, embed=True),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Semantic search + RAG response.
    1. Embed question
    2. Search Qdrant
    3. Fetch metadata from MySQL
    4. Stream LLM response
    """
    # 1. Embed the question
    query_vector = embedding_service.encode(question)
    
    # 2. Search Qdrant for similar documents
    hits = await qdrant_service.search_similar(query_vector, top_k=top_k)
    doc_ids = [hit["id"] for hit in hits]
    
    if not doc_ids:
        return StreamingResponse(iter(["I'm sorry, I couldn't find any relevant documents in the library."]), media_type="text/plain")

    # 3. Fetch full metadata from MySQL for context
    result = await db.execute(select(Document).where(Document.id.in_(doc_ids)))
    documents = result.scalars().all()
    
    context_docs = [
        {"title": doc.title, "summary": doc.summary}
        for doc in documents
    ]

    # 4. Stream RAG response
    async def stream_generator():
        async for token in llm_service.generate_rag_response(question, context_docs):
            yield token

    return StreamingResponse(
        stream_generator(), 
        media_type="text/plain",
        headers={"X-Matched-Docs": json.dumps(doc_ids)}
    )

@router.get("/recommendations/{user_id}")
async def get_recommendations(
    user_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Personalized recommendations based on last 5 borrowed books.
    """
    # 1. Get last 5 loans
    result = await db.execute(
        select(Loan.document_id)
        .where(Loan.user_id == user_id)
        .order_by(Loan.loan_date.desc())
        .limit(5)
    )
    borrowed_ids = [r[0] for r in result.all()]
    
    if not borrowed_ids:
        # Fallback: Just return 5 random/recent books
        res = await db.execute(select(Document).limit(5))
        return res.scalars().all()

    # 2. Search for similar docs in Qdrant (simplified: search using the most recent book's vector)
    # In a full version, we'd average vectors, but for MVP let's use the last one
    last_doc_result = await db.execute(select(Document).where(Document.id == borrowed_ids[0]))
    last_doc = last_doc_result.scalar_one()
    
    query_vector = embedding_service.encode(last_doc.summary)
    hits = await qdrant_service.search_similar(query_vector, top_k=10)
    
    # Filter out already borrowed IDs
    rec_ids = [hit["id"] for hit in hits if hit["id"] not in borrowed_ids][:5]
    
    if not rec_ids:
        res = await db.execute(select(Document).where(Document.id.notin_(borrowed_ids)).limit(5))
        return res.scalars().all()

    final_res = await db.execute(select(Document).where(Document.id.in_(rec_ids)))
    return final_res.scalars().all()

@router.post("/summary/{doc_id}")
async def generate_document_summary(
    doc_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Generates an AI insight for a specific document."""
    result = await db.execute(select(Document).where(Document.id == doc_id))
    doc = result.scalar_one_or_none()
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found")
    
    summary = await llm_service.generate_summary(doc.summary)
    return {"summary": summary}

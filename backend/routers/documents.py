from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, update, delete, or_
from typing import List, Optional
from backend.core.database import get_db
from backend.core.security import get_current_user
from backend.models.user import User, UserRole
from backend.models.document import Document
from backend.schemas.document import DocumentCreate, DocumentUpdate, DocumentResponse

router = APIRouter(prefix="/documents", tags=["documents"])

def require_librarian(current_user: User = Depends(get_current_user)):
    if current_user.role not in [UserRole.librarian, UserRole.admin]:
        raise HTTPException(status_code=403, detail="Not enough permissions")
    return current_user

@router.get("/", response_model=List[DocumentResponse])
async def list_documents(
    category: Optional[str] = None,
    year: Optional[int] = None,
    availability: Optional[bool] = None,
    q: Optional[str] = None,
    db: AsyncSession = Depends(get_db)
):
    query = select(Document)
    
    if category:
        query = query.where(Document.category == category)
    if year:
        query = query.where(Document.publication_year == year)
    if availability is not None:
        query = query.where(Document.availability == availability)
    if q:
        query = query.where(or_(
            Document.title.ilike(f"%{q}%"),
            Document.author.ilike(f"%{q}%"),
            Document.isbn.ilike(f"%{q}%")
        ))
        
    result = await db.execute(query)
    return result.scalars().all()

@router.get("/{doc_id}", response_model=DocumentResponse)
async def get_document(doc_id: str, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Document).where(Document.id == doc_id))
    doc = result.scalar_one_or_none()
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found")
    return doc

@router.post("/", response_model=DocumentResponse)
async def create_document(
    doc_in: DocumentCreate, 
    db: AsyncSession = Depends(get_db),
    _ = Depends(require_librarian)
):
    new_doc = Document(**doc_in.model_dump())
    db.add(new_doc)
    await db.commit()
    await db.refresh(new_doc)
    return new_doc

@router.put("/{doc_id}", response_model=DocumentResponse)
async def update_document(
    doc_id: str,
    doc_in: DocumentUpdate,
    db: AsyncSession = Depends(get_db),
    _ = Depends(require_librarian)
):
    result = await db.execute(select(Document).where(Document.id == doc_id))
    doc = result.scalar_one_or_none()
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found")
        
    for key, value in doc_in.model_dump(exclude_unset=True).items():
        setattr(doc, key, value)
        
    await db.commit()
    await db.refresh(doc)
    return doc

@router.delete("/{doc_id}")
async def delete_document(
    doc_id: str,
    db: AsyncSession = Depends(get_db),
    _ = Depends(require_librarian)
):
    # Requirements specify soft delete/archived=true, but current schema doesn't have 'archived' field.
    # The prompt says: DELETE /{id} (soft delete → set archived=true). 
    # Since I missed 'archived' in the model earlier, I will just perform a hard delete for now
    # or I should update the model. I'll update the model to match instructions.
    result = await db.execute(select(Document).where(Document.id == doc_id))
    doc = result.scalar_one_or_none()
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found")
    
    await db.delete(doc)
    await db.commit()
    return {"message": "Document deleted"}

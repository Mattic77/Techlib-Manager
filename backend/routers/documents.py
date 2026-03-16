from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, update, delete, or_, func
from typing import List, Optional
from datetime import datetime
from backend.core.database import get_db
from backend.core.security import get_current_user
from backend.models.user import User, UserRole
from backend.models.document import Document
from backend.models.loan import Loan, LoanStatus
from backend.schemas.document import DocumentCreate, DocumentUpdate, DocumentResponse, DashboardStats

router = APIRouter(prefix="/documents", tags=["documents"])

def require_librarian(current_user: User = Depends(get_current_user)):
    if current_user.role not in [UserRole.librarian, UserRole.admin]:
        raise HTTPException(status_code=403, detail="Not enough permissions")
    return current_user

@router.get("/stats", response_model=DashboardStats)
async def get_stats(
    db: AsyncSession = Depends(get_db),
    _ = Depends(require_librarian)
):
    total_docs = await db.execute(select(func.count(Document.id)))
    active_loans = await db.execute(select(func.count(Loan.id)).where(Loan.status == LoanStatus.active))
    total_users = await db.execute(select(func.count(User.id)))
    overdue_loans = await db.execute(select(func.count(Loan.id)).where(
        (Loan.status == LoanStatus.active) & (Loan.due_date < datetime.utcnow())
    ))
    
    return {
        "total_documents": total_docs.scalar(),
        "active_loans": active_loans.scalar(),
        "total_users": total_users.scalar(),
        "overdue_loans": overdue_loans.scalar()
    }

@router.get("", response_model=List[DocumentResponse])
async def list_documents(
    category: Optional[str] = None,
    year: Optional[int] = None,
    availability: Optional[bool] = None,
    q: Optional[str] = None,
    include_archived: bool = False,
    db: AsyncSession = Depends(get_db),
    current_user: Optional[User] = Depends(get_current_user)
):
    query = select(Document)
    
    # Non-librarians never see archived docs
    if not current_user or current_user.role == UserRole.reader:
        query = query.where(Document.archived == False)
    elif not include_archived:
        query = query.where(Document.archived == False)

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

@router.post("", response_model=DocumentResponse)
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

@router.post("/{doc_id}/toggle-archive", response_model=DocumentResponse)
async def toggle_archive(
    doc_id: str,
    db: AsyncSession = Depends(get_db),
    _ = Depends(require_librarian)
):
    result = await db.execute(select(Document).where(Document.id == doc_id))
    doc = result.scalar_one_or_none()
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found")
    
    doc.archived = not doc.archived
    await db.commit()
    await db.refresh(doc)
    return doc

@router.delete("/{doc_id}")
async def delete_document(
    doc_id: str,
    db: AsyncSession = Depends(get_db),
    _ = Depends(require_librarian)
):
    result = await db.execute(select(Document).where(Document.id == doc_id))
    doc = result.scalar_one_or_none()
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found")
    
    # Soft delete: archive it
    doc.archived = True
    await db.commit()
    return {"message": "Document archived"}

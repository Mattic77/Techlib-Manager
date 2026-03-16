from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from typing import List
from datetime import datetime
from backend.core.database import get_db
from backend.core.security import get_current_user
from backend.models.user import User, UserRole
from backend.models.document import Document
from backend.models.loan import Loan, LoanStatus
from backend.schemas.document import LoanCreate, LoanResponse

from sqlalchemy.orm import joinedload

router = APIRouter(prefix="/loans", tags=["loans"])

@router.post("", response_model=LoanResponse)
async def create_loan(
    loan_in: LoanCreate, 
    db: AsyncSession = Depends(get_db), 
    current_user: User = Depends(get_current_user)
):
    # Check if document exists and is available
    result = await db.execute(
        select(Document).where(Document.id == loan_in.document_id)
    )
    doc = result.scalar_one_or_none()
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found")
    if not doc.availability:
        raise HTTPException(status_code=400, detail="Document not available")
    
    # Create loan
    new_loan = Loan(
        document_id=loan_in.document_id,
        user_id=current_user.id,
        due_date=loan_in.due_date,
        status=LoanStatus.active
    )
    
    # Update document availability
    doc.availability = False
    
    db.add(new_loan)
    await db.commit()
    await db.refresh(new_loan)
    
    # Fetch with document for response
    result = await db.execute(
        select(Loan).options(joinedload(Loan.document)).where(Loan.id == new_loan.id)
    )
    return result.unique().scalar_one()

@router.put("/{loan_id}/return", response_model=LoanResponse)
async def return_document(
    loan_id: str, 
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    result = await db.execute(
        select(Loan).options(joinedload(Loan.document)).where(Loan.id == loan_id)
    )
    loan = result.unique().scalar_one_or_none()
    if not loan:
        raise HTTPException(status_code=404, detail="Loan not found")
    
    if loan.status == LoanStatus.returned:
        raise HTTPException(status_code=400, detail="Already returned")

    # Only librarian or the borrower can return
    if current_user.role != UserRole.librarian and loan.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized")

    loan.return_date = datetime.utcnow()
    loan.status = LoanStatus.returned
    
    # Update document availability
    loan.document.availability = True
    
    await db.commit()
    await db.refresh(loan)
    return loan

@router.get("", response_model=List[LoanResponse])
async def list_loans(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    if current_user.role not in [UserRole.librarian, UserRole.admin]:
        raise HTTPException(status_code=403, detail="Not enough permissions")
    
    result = await db.execute(
        select(Loan).options(joinedload(Loan.document))
    )
    return result.unique().scalars().all()

@router.get("/my-loans", response_model=List[LoanResponse])
async def get_my_loans(
    db: AsyncSession = Depends(get_db), 
    current_user: User = Depends(get_current_user)
):
    result = await db.execute(
        select(Loan).options(joinedload(Loan.document)).where(Loan.user_id == current_user.id)
    )
    return result.unique().scalars().all()

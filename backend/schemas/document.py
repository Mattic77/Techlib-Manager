from pydantic import BaseModel, EmailStr, Field
from typing import Optional, List
from datetime import datetime
from backend.models.user import UserRole
from backend.models.loan import LoanStatus
from backend.models.reservation import ReservationStatus

# User Schemas
class UserBase(BaseModel):
    username: str
    email: EmailStr

class UserCreate(UserBase):
    password: str

class UserUpdate(BaseModel):
    username: Optional[str] = None
    email: Optional[EmailStr] = None
    password: Optional[str] = None

class UserResponse(UserBase):
    id: str
    role: UserRole
    created_at: datetime

    class Config:
        from_attributes = True

class Token(BaseModel):
    access_token: str
    token_type: str

# Document Schemas
class DocumentBase(BaseModel):
    title: str
    author: Optional[str] = None
    isbn: Optional[str] = None
    publication_year: Optional[int] = None
    category: Optional[str] = None
    summary: Optional[str] = None
    keywords: Optional[List[str]] = []
    physical_location: Optional[str] = None
    digital_format: Optional[str] = None

class DocumentCreate(DocumentBase):
    pass

class DocumentUpdate(DocumentBase):
    title: Optional[str] = None
    availability: Optional[bool] = None

class DocumentResponse(DocumentBase):
    id: str
    availability: bool
    archived: bool
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

class DashboardStats(BaseModel):
    total_documents: int
    active_loans: int
    total_users: int
    overdue_loans: int

# Loan Schemas
class LoanBase(BaseModel):
    document_id: str
    due_date: datetime

class LoanCreate(LoanBase):
    pass

class LoanResponse(BaseModel):
    id: str
    document_id: str
    user_id: str
    loan_date: datetime
    due_date: datetime
    return_date: Optional[datetime] = None
    status: LoanStatus
    document: Optional[DocumentResponse] = None

    class Config:
        from_attributes = True

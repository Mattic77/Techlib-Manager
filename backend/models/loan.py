import enum
from sqlalchemy import Column, String, Enum, DateTime, ForeignKey, func
from backend.core.database import Base
import uuid

class LoanStatus(str, enum.Enum):
    active = 'active'
    returned = 'returned'
    overdue = 'overdue'

class Loan(Base):
    __tablename__ = "loans"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    document_id = Column(String(36), ForeignKey('documents.id'), nullable=False)
    user_id = Column(String(36), ForeignKey('users.id'), nullable=False)
    loan_date = Column(DateTime, nullable=False, default=func.now())
    due_date = Column(DateTime, nullable=False)
    return_date = Column(DateTime)
    status = Column(Enum(LoanStatus), default=LoanStatus.active)

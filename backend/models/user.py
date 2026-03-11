import enum
from sqlalchemy import Column, String, Enum, DateTime, func
from backend.core.database import Base
import uuid

class UserRole(str, enum.Enum):
    reader = 'reader'
    librarian = 'librarian'
    admin = 'admin'

class User(Base):
    __tablename__ = "users"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    username = Column(String(100), unique=True, nullable=False)
    email = Column(String(255), unique=True, nullable=False)
    password_hash = Column(String(255), nullable=False)
    role = Column(Enum(UserRole), default=UserRole.reader)
    created_at = Column(DateTime, default=func.now())

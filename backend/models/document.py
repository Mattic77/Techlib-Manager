from sqlalchemy import Column, String, Integer, Text, Boolean, DateTime, JSON, func
from backend.core.database import Base
import uuid

class Document(Base):
    __tablename__ = "documents"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    title = Column(String(255), nullable=False)
    author = Column(String(255))
    isbn = Column(String(20), unique=True)
    publication_year = Column(Integer)
    category = Column(String(100))
    summary = Column(Text)
    keywords = Column(JSON)
    physical_location = Column(String(50))
    digital_format = Column(String(10))
    availability = Column(Boolean, default=True)
    created_at = Column(DateTime, default=func.now())
    updated_at = Column(DateTime, default=func.now(), onupdate=func.now())

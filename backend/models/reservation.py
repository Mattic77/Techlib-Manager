import enum
from sqlalchemy import Column, String, Enum, DateTime, ForeignKey, func
from backend.core.database import Base
import uuid

class ReservationStatus(str, enum.Enum):
    pending = 'pending'
    fulfilled = 'fulfilled'
    cancelled = 'cancelled'

class Reservation(Base):
    __tablename__ = "reservations"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    document_id = Column(String(36), ForeignKey('documents.id'), nullable=False)
    user_id = Column(String(36), ForeignKey('users.id'), nullable=False)
    reservation_date = Column(DateTime, default=func.now())
    status = Column(Enum(ReservationStatus), default=ReservationStatus.pending)

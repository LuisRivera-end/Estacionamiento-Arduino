from datetime import datetime

from sqlalchemy import Boolean, DateTime, Enum, ForeignKey, Integer, String, func
from sqlalchemy.orm import Mapped, mapped_column

from app.models.base import Base, TimestampMixin
from app.models.enums import PaymentStatus, TicketStatus


class Ticket(Base, TimestampMixin):
    __tablename__ = "tickets"

    id: Mapped[str] = mapped_column(primary_key=True)
    code: Mapped[str] = mapped_column(String(5), unique=True, nullable=False)
    status: Mapped[TicketStatus] = mapped_column(
        Enum(TicketStatus, native_enum=False),
        nullable=False,
        default=TicketStatus.ACTIVE,
    )
    payment_status: Mapped[PaymentStatus] = mapped_column(
        Enum(PaymentStatus, native_enum=False),
        nullable=False,
        default=PaymentStatus.UNPAID,
    )
    entry_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    paid_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    exit_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    duration_minutes: Mapped[int | None] = mapped_column(Integer, nullable=True)
    calculated_amount: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    lost_ticket: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False)
    entry_device_id: Mapped[str | None] = mapped_column(ForeignKey("devices.id"), nullable=True)
    exit_device_id: Mapped[str | None] = mapped_column(ForeignKey("devices.id"), nullable=True)

from datetime import datetime

from sqlalchemy import Boolean, DateTime, Enum, Integer, String, func
from sqlalchemy.orm import Mapped, mapped_column

from app.models.base import Base
from app.models.enums import (
    ArchiveReason,
    PaymentStatus,
    TicketStatus,
    enum_values,
)


class ArchivedTicket(Base):
    __tablename__ = "archived_tickets"

    id: Mapped[str] = mapped_column(primary_key=True)
    code: Mapped[str] = mapped_column(String(6), nullable=False, index=True)
    status: Mapped[TicketStatus] = mapped_column(
        Enum(TicketStatus, native_enum=False, values_callable=enum_values),
        nullable=False,
    )
    payment_status: Mapped[PaymentStatus] = mapped_column(
        Enum(PaymentStatus, native_enum=False, values_callable=enum_values),
        nullable=False,
    )
    entry_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    paid_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    exit_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    duration_minutes: Mapped[int | None] = mapped_column(Integer, nullable=True)
    calculated_amount: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    lost_ticket: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False)
    entry_device_id: Mapped[str | None] = mapped_column(String(100), nullable=True)
    exit_device_id: Mapped[str | None] = mapped_column(String(100), nullable=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, server_default=func.now()
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, server_default=func.now()
    )

    # Archive-specific columns
    archived_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, server_default=func.now()
    )
    expired_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    archive_reason: Mapped[ArchiveReason] = mapped_column(
        Enum(ArchiveReason, native_enum=False, values_callable=enum_values),
        nullable=False,
    )

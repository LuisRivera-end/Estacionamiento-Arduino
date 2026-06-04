from datetime import datetime

from sqlalchemy import JSON, Boolean, DateTime, Integer, String, func
from sqlalchemy.orm import Mapped, mapped_column

from app.models.base import Base, TimestampMixin


class ParkingSettings(Base):
    __tablename__ = "parking_settings"

    id: Mapped[int] = mapped_column(primary_key=True, default=1)
    capacity_total: Mapped[int] = mapped_column(Integer, nullable=False)
    timezone: Mapped[str] = mapped_column(String(64), nullable=False, default="America/Mexico_City")
    currency: Mapped[str] = mapped_column(String(3), nullable=False, default="MXN")
    parking_name: Mapped[str] = mapped_column(
        String(100), nullable=False, default="Parking Ops"
    )
    ticket_expiration_minutes: Mapped[int] = mapped_column(
        Integer, nullable=False, default=1440
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        nullable=False,
        server_default=func.now(),
        onupdate=func.now(),
    )


class ParkingState(Base):
    __tablename__ = "parking_state"

    id: Mapped[int] = mapped_column(primary_key=True, default=1)
    occupied_spaces: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    active_tickets_count: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    last_entry_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    last_exit_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        nullable=False,
        server_default=func.now(),
        onupdate=func.now(),
    )


class PricingRule(Base, TimestampMixin):
    __tablename__ = "pricing_rules"

    id: Mapped[str] = mapped_column(primary_key=True)
    name: Mapped[str] = mapped_column(String(100), nullable=False)
    free_tolerance_minutes: Mapped[int] = mapped_column(Integer, nullable=False, default=5)
    block_minutes: Mapped[int] = mapped_column(Integer, nullable=False)
    block_amount: Mapped[int] = mapped_column(Integer, nullable=False)
    lost_ticket_fee: Mapped[int] = mapped_column(Integer, nullable=False)
    senior_discount_percent: Mapped[int] = mapped_column(Integer, nullable=False, default=50)
    student_discount_percent: Mapped[int] = mapped_column(Integer, nullable=False, default=50)
    student_allowed_domains: Mapped[list[str]] = mapped_column(
        JSON, nullable=False, default=lambda: [".edu", ".edu.mx"]
    )
    senior_discount_applies_to_lost_ticket: Mapped[bool] = mapped_column(
        Boolean, nullable=False, default=False
    )
    student_discount_applies_to_lost_ticket: Mapped[bool] = mapped_column(
        Boolean, nullable=False, default=False
    )
    is_active: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False)

from datetime import datetime

from sqlalchemy import JSON, DateTime, Enum, ForeignKey, Integer, String, func
from sqlalchemy.orm import Mapped, mapped_column

from app.models.base import Base
from app.models.enums import DiscountType, PaymentMethod, PaymentResult


class Payment(Base):
    __tablename__ = "payments"

    id: Mapped[str] = mapped_column(primary_key=True)
    ticket_id: Mapped[str] = mapped_column(ForeignKey("tickets.id"), nullable=False)
    amount: Mapped[int] = mapped_column(Integer, nullable=False)
    method: Mapped[PaymentMethod] = mapped_column(
        Enum(PaymentMethod, native_enum=False), nullable=False
    )
    status: Mapped[PaymentResult] = mapped_column(
        Enum(PaymentResult, native_enum=False),
        nullable=False,
        default=PaymentResult.SIMULATED,
    )
    subtotal_amount: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    discount_type: Mapped[DiscountType] = mapped_column(
        Enum(DiscountType, native_enum=False), nullable=False, default=DiscountType.NONE
    )
    discount_percent: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    discount_amount: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    simulation_reference: Mapped[str | None] = mapped_column(String(150), nullable=True)
    provider_reference: Mapped[str | None] = mapped_column(String(150), nullable=True)
    discount_evidence: Mapped[dict | None] = mapped_column(JSON, nullable=True)
    created_by: Mapped[str | None] = mapped_column(String(64), nullable=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
    )

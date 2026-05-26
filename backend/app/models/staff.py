from datetime import datetime

from sqlalchemy import DateTime, Enum, String, func
from sqlalchemy.orm import Mapped, mapped_column

from app.models.base import Base
from app.models.enums import StaffRole, StaffStatus


class StaffUser(Base):
    __tablename__ = "staff_users"

    user_id: Mapped[str] = mapped_column(primary_key=True)
    email: Mapped[str] = mapped_column(String(255), unique=True, nullable=False)
    display_name: Mapped[str | None] = mapped_column(String(255), nullable=True)
    role: Mapped[StaffRole] = mapped_column(Enum(StaffRole, native_enum=False), nullable=False)
    status: Mapped[StaffStatus] = mapped_column(
        Enum(StaffStatus, native_enum=False),
        nullable=False,
        default=StaffStatus.ACTIVE,
    )
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        onupdate=func.now(),
    )

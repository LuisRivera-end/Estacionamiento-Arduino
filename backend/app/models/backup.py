from datetime import datetime

from sqlalchemy import DateTime, Enum, String, func
from sqlalchemy.orm import Mapped, mapped_column

from app.models.base import Base
from app.models.enums import BackupStatus


class BackupExport(Base):
    __tablename__ = "backup_exports"

    id: Mapped[str] = mapped_column(primary_key=True)
    status: Mapped[BackupStatus] = mapped_column(
        Enum(BackupStatus, native_enum=False),
        nullable=False,
        default=BackupStatus.REQUESTED,
    )
    file_path: Mapped[str | None] = mapped_column(String(255), nullable=True)
    requested_by: Mapped[str | None] = mapped_column(String(64), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    completed_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)

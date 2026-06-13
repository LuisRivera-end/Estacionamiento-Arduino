from datetime import datetime

from sqlalchemy import DateTime, Integer, String, Text
from sqlalchemy.orm import Mapped, mapped_column

from app.models.base import Base


class SyncState(Base):
    """Marca de agua (watermark) por tabla para el push local -> nube.

    Solo se usa en el modo Docker local: registra hasta qué punto se ha
    sincronizado cada tabla operativa hacia Supabase, para no reenviar todo en
    cada corrida. En la nube esta tabla existe pero queda sin uso.
    """

    __tablename__ = "sync_state"

    table_name: Mapped[str] = mapped_column(String(64), primary_key=True)
    # Hasta qué timestamp (created_at/updated_at/archived_at) se ha empujado.
    last_synced_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    # Cuándo corrió el último intento (haya empujado filas o no).
    last_run_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    last_status: Mapped[str | None] = mapped_column(String(20), nullable=True)
    last_pushed_count: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    last_error: Mapped[str | None] = mapped_column(Text, nullable=True)

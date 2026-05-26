from __future__ import annotations

from sqlalchemy import Select, desc, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.backup import BackupExport
from app.models.enums import BackupStatus


class BackupRepository:
    def __init__(self, session: AsyncSession) -> None:
        self.session = session

    async def create(self, *, backup_id: str, requested_by: str) -> BackupExport:
        export = BackupExport(
            id=backup_id,
            status=BackupStatus.REQUESTED,
            requested_by=requested_by,
        )
        self.session.add(export)
        await self.session.flush()
        await self.session.refresh(export)
        return export

    async def list_recent(self, limit: int = 20) -> list[BackupExport]:
        statement: Select[tuple[BackupExport]] = (
            select(BackupExport).order_by(desc(BackupExport.created_at)).limit(limit)
        )
        return list((await self.session.execute(statement)).scalars().all())

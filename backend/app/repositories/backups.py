from __future__ import annotations

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

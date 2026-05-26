from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import require_admin_user
from app.db.session import get_session
from app.repositories.backups import BackupRepository
from app.schemas.settings import BackupExportRequest, BackupExportResponse
from app.services.backups import generate_backup_id

router = APIRouter()


@router.post("/export", response_model=BackupExportResponse)
async def create_backup_export(
    payload: BackupExportRequest,
    _: tuple = Depends(require_admin_user),
    session: AsyncSession = Depends(get_session),
) -> BackupExportResponse:
    backup_id = generate_backup_id()
    export = await BackupRepository(session).create(
        backup_id=backup_id,
        requested_by=payload.requested_by,
    )
    await session.commit()
    return BackupExportResponse(backup_id=export.id, status=export.status)

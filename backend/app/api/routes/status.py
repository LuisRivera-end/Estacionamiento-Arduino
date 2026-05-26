from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_current_staff_user
from app.db.session import get_session
from app.schemas.status import StatusResponse
from app.services.admin_reports import get_status_summary

router = APIRouter()


@router.get("/status", response_model=StatusResponse)
async def get_status(
    _: tuple = Depends(get_current_staff_user),
    session: AsyncSession = Depends(get_session),
) -> StatusResponse:
    return await get_status_summary(session)

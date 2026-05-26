from datetime import UTC, datetime

from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_current_staff_user
from app.db.session import get_session
from app.schemas.reports import SummaryReportResponse
from app.services.admin_reports import get_daily_summary

router = APIRouter()


@router.get("/summary", response_model=SummaryReportResponse)
async def report_summary(
    _: tuple = Depends(get_current_staff_user),
    session: AsyncSession = Depends(get_session),
) -> SummaryReportResponse:
    return await get_daily_summary(session, datetime.now(UTC))

from __future__ import annotations

from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_app_settings, require_admin_user
from app.core.config import Settings
from app.db.session import get_session
from app.repositories.staff import StaffRepository
from app.schemas.auth import StaffProfileResponse, StaffUserCreateRequest
from app.services.staff_users import create_staff_user as create_staff_user_service

router = APIRouter()


@router.get("", response_model=list[StaffProfileResponse])
async def list_staff_users(
    _: tuple = Depends(require_admin_user),
    session: AsyncSession = Depends(get_session),
) -> list[StaffProfileResponse]:
    repository = StaffRepository(session)
    users = await repository.get_all()
    return [StaffProfileResponse.model_validate(user) for user in users]


@router.post("", response_model=StaffProfileResponse)
async def create_staff_user(
    payload: StaffUserCreateRequest,
    _: tuple = Depends(require_admin_user),
    session: AsyncSession = Depends(get_session),
    settings: Settings = Depends(get_app_settings),
) -> StaffProfileResponse:
    profile = await create_staff_user_service(
        session=session,
        payload=payload,
        settings=settings,
    )
    return StaffProfileResponse.model_validate(profile)

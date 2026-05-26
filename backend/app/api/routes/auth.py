from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_app_settings, get_current_claims, get_current_staff_user
from app.core.config import Settings
from app.db.session import get_session
from app.schemas.auth import AuthSetupStatusResponse, BootstrapResponse, StaffProfileResponse
from app.services.auth import allow_initial_account_creation, bootstrap_staff_user

router = APIRouter()


@router.get("/setup-status", response_model=AuthSetupStatusResponse)
async def get_setup_status(
    session: AsyncSession = Depends(get_session),
) -> AuthSetupStatusResponse:
    return AuthSetupStatusResponse(
        allow_initial_account_creation=await allow_initial_account_creation(session=session)
    )


@router.post("/bootstrap", response_model=BootstrapResponse)
async def bootstrap_staff(
    claims=Depends(get_current_claims),
    settings: Settings = Depends(get_app_settings),
    session: AsyncSession = Depends(get_session),
) -> BootstrapResponse:
    profile, created = await bootstrap_staff_user(session=session, claims=claims, settings=settings)
    await session.commit()
    return BootstrapResponse(
        created=created,
        first_login=created,
        profile=StaffProfileResponse.model_validate(profile),
    )


@router.get("/me", response_model=StaffProfileResponse)
async def auth_me(staff_context: tuple = Depends(get_current_staff_user)) -> StaffProfileResponse:
    _, staff_user = staff_context
    return StaffProfileResponse.model_validate(staff_user)

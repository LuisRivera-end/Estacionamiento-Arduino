from __future__ import annotations

from functools import lru_cache

from fastapi import Depends, Header
from sqlalchemy.ext.asyncio import AsyncSession

from app.connectors.supabase_auth import SupabaseJWTVerifier
from app.core.config import Settings, get_settings
from app.core.errors import AppError
from app.core.security import extract_bearer_token, verify_device_credentials
from app.db.session import get_session
from app.models.enums import DeviceType, StaffRole, StaffStatus
from app.repositories.staff import StaffRepository
from app.schemas.auth import AuthClaims


def get_app_settings() -> Settings:
    return get_settings()


@lru_cache
def get_jwt_verifier() -> SupabaseJWTVerifier:
    return SupabaseJWTVerifier(get_settings())


async def get_current_claims(
    authorization: str | None = Header(default=None, alias="Authorization"),
    verifier: SupabaseJWTVerifier = Depends(get_jwt_verifier),
) -> AuthClaims:
    token = extract_bearer_token(authorization)
    return verifier.verify_access_token(token)


async def get_current_staff_user(
    claims: AuthClaims = Depends(get_current_claims),
    session: AsyncSession = Depends(get_session),
) -> tuple[AuthClaims, object]:
    repository = StaffRepository(session)
    staff_user = await repository.get_by_user_id(claims.sub)
    if staff_user is None:
        raise AppError(403, "staff_profile_missing", "El usuario no tiene perfil operativo")
    if staff_user.status != StaffStatus.ACTIVE:
        raise AppError(403, "staff_user_disabled", "El usuario operativo esta deshabilitado")
    return claims, staff_user


async def require_admin_user(
    staff_context: tuple[AuthClaims, object] = Depends(get_current_staff_user),
) -> tuple[AuthClaims, object]:
    claims, staff_user = staff_context
    if getattr(staff_user, "role", None) != StaffRole.ADMIN:
        raise AppError(403, "admin_required", "Se requiere rol administrativo")
    return claims, staff_user


async def require_entry_device(
    settings: Settings = Depends(get_app_settings),
    device_id: str | None = Header(default=None, alias="X-Device-Id"),
    device_token: str | None = Header(default=None, alias="X-Device-Token"),
) -> str:
    return verify_device_credentials(
        settings=settings,
        device_type=DeviceType.ENTRY,
        device_id=device_id,
        device_token=device_token,
    )


async def require_exit_device(
    settings: Settings = Depends(get_app_settings),
    device_id: str | None = Header(default=None, alias="X-Device-Id"),
    device_token: str | None = Header(default=None, alias="X-Device-Token"),
) -> str:
    return verify_device_credentials(
        settings=settings,
        device_type=DeviceType.EXIT,
        device_id=device_id,
        device_token=device_token,
    )

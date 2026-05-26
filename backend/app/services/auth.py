from __future__ import annotations

from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import Settings
from app.repositories.audit import AuditRepository
from app.repositories.staff import StaffRepository
from app.schemas.auth import AuthClaims
from app.services.auth_bootstrap import resolve_first_login_role, resolve_initial_staff_status


async def bootstrap_staff_user(
    *,
    session: AsyncSession,
    claims: AuthClaims,
    settings: Settings,
) -> tuple[object, bool]:
    staff_repository = StaffRepository(session)
    existing = await staff_repository.get_by_user_id(claims.sub)
    if existing:
        return existing, False

    existing_count = await staff_repository.count()
    display_name = None
    if claims.user_metadata:
        display_name = claims.user_metadata.get("display_name") or claims.user_metadata.get("name")

    profile = await staff_repository.create(
        user_id=claims.sub,
        email=claims.email,
        display_name=display_name,
        role=resolve_first_login_role(existing_count, settings.bootstrap_first_user_as_admin),
        status=resolve_initial_staff_status(),
    )
    await AuditRepository(session).log(
        event_type="staff_user_bootstrapped",
        actor_type="admin" if existing_count == 0 else "system",
        actor_id=claims.sub,
        payload={"role": profile.role, "email": profile.email},
    )
    return profile, True

from __future__ import annotations

from app.models.enums import StaffRole, StaffStatus


def resolve_first_login_role(
    existing_staff_count: int,
    bootstrap_first_user_as_admin: bool,
) -> StaffRole:
    if existing_staff_count == 0 and bootstrap_first_user_as_admin:
        return StaffRole.ADMIN
    return StaffRole.PANELIST


def resolve_initial_staff_status() -> StaffStatus:
    return StaffStatus.ACTIVE

from __future__ import annotations

from sqlalchemy import Select, func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.staff import StaffUser


class StaffRepository:
    def __init__(self, session: AsyncSession) -> None:
        self.session = session

    async def count(self) -> int:
        statement = select(func.count()).select_from(StaffUser)
        return int((await self.session.execute(statement)).scalar_one())

    async def get_by_user_id(self, user_id: str) -> StaffUser | None:
        statement: Select[tuple[StaffUser]] = select(StaffUser).where(StaffUser.user_id == user_id)
        return (await self.session.execute(statement)).scalar_one_or_none()

    async def get_by_email(self, email: str) -> StaffUser | None:
        statement: Select[tuple[StaffUser]] = select(StaffUser).where(StaffUser.email == email)
        return (await self.session.execute(statement)).scalar_one_or_none()

    async def get_all(self) -> list[StaffUser]:
        statement = select(StaffUser).order_by(StaffUser.created_at.desc())
        return list((await self.session.execute(statement)).scalars().all())

    async def create(
        self,
        *,
        user_id: str,
        email: str,
        display_name: str | None,
        role,
        status,
    ) -> StaffUser:
        staff_user = StaffUser(
            user_id=user_id,
            email=email,
            display_name=display_name,
            role=role,
            status=status,
        )
        self.session.add(staff_user)
        await self.session.flush()
        await self.session.refresh(staff_user)
        return staff_user

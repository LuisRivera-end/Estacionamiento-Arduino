from __future__ import annotations

from sqlalchemy import Select, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.device import Device
from app.models.enums import DeviceType


class DeviceRepository:
    def __init__(self, session: AsyncSession) -> None:
        self.session = session

    async def get_active_device(self, device_id: str, device_type: DeviceType) -> Device | None:
        statement: Select[tuple[Device]] = select(Device).where(
            Device.device_id == device_id,
            Device.device_type == device_type,
            Device.is_active.is_(True),
        )
        return (await self.session.execute(statement)).scalar_one_or_none()

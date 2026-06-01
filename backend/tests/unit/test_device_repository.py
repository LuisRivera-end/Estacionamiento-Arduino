from sqlalchemy import text

from app.models.enums import DeviceType
from app.repositories.devices import DeviceRepository


async def test_get_active_device_matches_database_enum_values(session_factory) -> None:
    async with session_factory() as session:
        await session.execute(text("delete from devices"))
        await session.execute(
            text(
                """
                insert into devices (id, device_id, device_type, display_name, is_active)
                values (:id, :device_id, :device_type, :display_name, true)
                """
            ),
            {
                "id": "33333333-3333-3333-3333-333333333333",
                "device_id": "entrada-raw",
                "device_type": "entry",
                "display_name": "Entrada raw",
            },
        )
        await session.commit()

    async with session_factory() as session:
        repository = DeviceRepository(session)

        device = await repository.get_active_device("entrada-raw", DeviceType.ENTRY)

    assert device is not None
    assert device.device_id == "entrada-raw"

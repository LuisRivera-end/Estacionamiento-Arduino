from __future__ import annotations

from collections.abc import AsyncIterator
from typing import Any

import jwt
import pytest
from fastapi.testclient import TestClient
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine

from app.api.deps import get_session
from app.core.config import get_settings
from app.main import create_app
from app.models.base import Base
from app.models.device import Device
from app.models.enums import DeviceType
from app.models.parking import ParkingSettings, ParkingState, PricingRule

TEST_JWT_SECRET = "test-jwt-secret-with-32-plus-length"


@pytest.fixture(autouse=True)
def clear_settings_cache(monkeypatch: pytest.MonkeyPatch) -> None:
    monkeypatch.setenv("SUPABASE_JWT_SECRET", TEST_JWT_SECRET)
    monkeypatch.setenv("API_DEVICE_TOKEN_ENTRY", "entry-test-token")
    monkeypatch.setenv("API_DEVICE_TOKEN_EXIT", "exit-test-token")
    monkeypatch.setenv("ALLOWED_ORIGINS", "http://localhost:3000")
    get_settings.cache_clear()


@pytest.fixture
async def session_factory() -> AsyncIterator[async_sessionmaker[AsyncSession]]:
    engine = create_async_engine("sqlite+aiosqlite:///:memory:", future=True)
    async with engine.begin() as connection:
        await connection.run_sync(Base.metadata.create_all)

    factory = async_sessionmaker(engine, expire_on_commit=False)

    async with factory() as session:
        session.add_all(
            [
                Device(
                    id="11111111-1111-1111-1111-111111111111",
                    device_id="entrada-01",
                    device_type=DeviceType.ENTRY,
                    display_name="Caseta entrada 01",
                    is_active=True,
                ),
                Device(
                    id="22222222-2222-2222-2222-222222222222",
                    device_id="salida-01",
                    device_type=DeviceType.EXIT,
                    display_name="Caseta salida 01",
                    is_active=True,
                ),
                ParkingSettings(
                    id=1,
                    capacity_total=40,
                    timezone="America/Mexico_City",
                    currency="MXN",
                ),
                ParkingState(id=1, occupied_spaces=0, active_tickets_count=0),
                PricingRule(
                    id="33333333-3333-3333-3333-333333333333",
                    name="MVP default",
                    free_tolerance_minutes=5,
                    block_minutes=30,
                    block_amount=10,
                    lost_ticket_fee=150,
                    senior_discount_percent=50,
                    student_discount_percent=50,
                    student_allowed_domains=[".edu", ".edu.mx"],
                    senior_discount_applies_to_lost_ticket=False,
                    student_discount_applies_to_lost_ticket=False,
                    is_active=True,
                ),
            ]
        )
        await session.commit()

    yield factory
    await engine.dispose()


@pytest.fixture
def client(session_factory: async_sessionmaker[AsyncSession]) -> TestClient:
    app = create_app()

    async def override_get_session() -> AsyncIterator[AsyncSession]:
        async with session_factory() as session:
            yield session

    app.dependency_overrides[get_session] = override_get_session
    return TestClient(app)


def build_access_token(
    *,
    user_id: str,
    email: str,
    user_metadata: dict[str, Any] | None = None,
) -> str:
    payload = {
        "sub": user_id,
        "email": email,
        "role": "authenticated",
        "aud": "authenticated",
        "app_metadata": {"provider": "email"},
        "user_metadata": user_metadata or {},
    }
    return jwt.encode(payload, TEST_JWT_SECRET, algorithm="HS256")

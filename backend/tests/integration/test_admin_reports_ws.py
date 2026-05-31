from contextlib import asynccontextmanager

import pytest

from app.api.routes.admin_reports import authorize_reports_ws_staff_user
from app.connectors.supabase_auth import SupabaseJWTVerifier
from app.core.config import get_settings
from app.models.enums import StaffRole, StaffStatus
from app.models.staff import StaffUser
from tests.conftest import build_access_token


def test_admin_reports_ws_pushes_realtime_events(client) -> None:
    admin_token = build_access_token(
        user_id="aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa",
        email="admin@example.com",
    )
    auth_headers = {"Authorization": f"Bearer {admin_token}"}
    client.post("/api/v1/auth/bootstrap", headers=auth_headers)

    with client.websocket_connect(f"/api/v1/admin/reports/ws?access_token={admin_token}") as ws:
        connected_payload = ws.receive_json()
        assert connected_payload["type"] == "connected"

        entry_response = client.post(
            "/api/v1/arduino/entry/tickets",
            headers={
                "X-Device-Id": "entrada-01",
                "X-Device-Token": "entry-test-token",
            },
            json={"device_id": "entrada-01"},
        )
        assert entry_response.status_code == 200
        ticket_code = entry_response.json()["ticket_code"]

        realtime_event = ws.receive_json()
        assert realtime_event["type"] == "ticket_created"
        assert realtime_event["ticket_code"] == ticket_code


@pytest.mark.asyncio
async def test_reports_ws_authorization_releases_session_before_waiting(session_factory) -> None:
    admin_token = build_access_token(
        user_id="bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb",
        email="ws-admin@example.com",
    )
    async with session_factory() as session:
        session.add(
            StaffUser(
                user_id="bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb",
                email="ws-admin@example.com",
                role=StaffRole.ADMIN,
                status=StaffStatus.ACTIVE,
            )
        )
        await session.commit()

    active_sessions = 0
    max_active_sessions = 0

    @asynccontextmanager
    async def tracked_session_context():
        nonlocal active_sessions, max_active_sessions
        active_sessions += 1
        max_active_sessions = max(max_active_sessions, active_sessions)
        try:
            async with session_factory() as session:
                yield session
        finally:
            active_sessions -= 1

    verifier = SupabaseJWTVerifier(get_settings())

    assert await authorize_reports_ws_staff_user(
        admin_token,
        verifier,
        tracked_session_context,
    )
    assert max_active_sessions == 1
    assert active_sessions == 0

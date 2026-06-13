from __future__ import annotations

from datetime import UTC, datetime

from app.api.deps import get_jwt_verifier
from app.api.routes import admin_sync
from app.core.config import get_settings
from app.core.errors import AppError
from app.services.sync_push import SyncPushReport, TableResult
from tests.conftest import build_access_token

ADMIN_ID = "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa"


def _admin_headers(client) -> dict[str, str]:
    get_settings.cache_clear()
    get_jwt_verifier.cache_clear()
    token = build_access_token(user_id=ADMIN_ID, email="admin@example.com")
    headers = {"Authorization": f"Bearer {token}"}
    client.post("/api/v1/auth/bootstrap", headers=headers)
    return headers


def test_push_returns_report(client, monkeypatch) -> None:
    headers = _admin_headers(client)
    now = datetime.now(UTC)

    async def fake_push(*, full: bool = False) -> SyncPushReport:
        return SyncPushReport(
            status="ok",
            full=full,
            started_at=now,
            finished_at=now,
            duration_ms=12,
            total_pushed=3,
            tables={
                "devices": TableResult(pushed=2, skipped=0),
                "tickets": TableResult(pushed=1, skipped=0),
            },
        )

    monkeypatch.setattr(admin_sync, "run_sync_push", fake_push)

    response = client.post("/api/v1/admin/sync/push", headers=headers, json={"full": False})

    assert response.status_code == 200
    body = response.json()
    assert body["status"] == "ok"
    assert body["total_pushed"] == 3
    assert body["tables"]["devices"]["pushed"] == 2


def test_push_remote_unreachable_returns_503(client, monkeypatch) -> None:
    headers = _admin_headers(client)

    async def fake_push(*, full: bool = False) -> SyncPushReport:
        raise AppError(503, "remote_unreachable", "sin internet")

    monkeypatch.setattr(admin_sync, "run_sync_push", fake_push)

    response = client.post("/api/v1/admin/sync/push", headers=headers, json={})

    assert response.status_code == 503
    assert response.json()["error"] == "remote_unreachable"


def test_push_in_progress_returns_409(client, monkeypatch) -> None:
    headers = _admin_headers(client)

    async def fake_push(*, full: bool = False) -> SyncPushReport:
        raise AppError(409, "sync_in_progress", "ya en curso")

    monkeypatch.setattr(admin_sync, "run_sync_push", fake_push)

    response = client.post("/api/v1/admin/sync/push", headers=headers, json={})

    assert response.status_code == 409
    assert response.json()["error"] == "sync_in_progress"


def test_push_requires_admin(client) -> None:
    # No bootstrap => no staff profile => not admin.
    get_settings.cache_clear()
    get_jwt_verifier.cache_clear()
    token = build_access_token(user_id="cccccccc-cccc-cccc-cccc-cccccccccccc", email="x@y.z")
    response = client.post(
        "/api/v1/admin/sync/push",
        headers={"Authorization": f"Bearer {token}"},
        json={},
    )
    assert response.status_code == 403


def test_status_reports_pending_and_not_configured(client) -> None:
    headers = _admin_headers(client)

    response = client.get("/api/v1/admin/sync/status", headers=headers)

    assert response.status_code == 200
    body = response.json()
    # REMOTE_DB_URL is not set in tests.
    assert body["configured"] is False
    assert body["remote_reachable"] is None
    table_names = {row["table_name"] for row in body["tables"]}
    assert {"devices", "tickets", "pricing_rules"} <= table_names
    devices = next(row for row in body["tables"] if row["table_name"] == "devices")
    # Two devices are seeded by the test fixture and never synced yet.
    assert devices["pending_estimate"] == 2

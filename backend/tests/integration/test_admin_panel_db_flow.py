from __future__ import annotations

from datetime import UTC, datetime, timedelta

from sqlalchemy import select

from app.models.ticket import Ticket
from tests.conftest import build_access_token


def test_admin_panel_reads_and_writes_database(client) -> None:
    admin_token = build_access_token(
        user_id="aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa",
        email="admin@example.com",
    )
    auth_headers = {"Authorization": f"Bearer {admin_token}"}
    client.post("/api/v1/auth/bootstrap", headers=auth_headers)

    settings_response = client.get("/api/v1/admin/settings", headers=auth_headers)
    assert settings_response.status_code == 200
    assert settings_response.json()["capacity_total"] == 40
    assert settings_response.json()["ticket_expiration_hours"] == 24

    update_settings_response = client.put(
        "/api/v1/admin/settings",
        headers=auth_headers,
        json={
            "capacity_total": 55,
            "timezone": "America/Mexico_City",
            "currency": "MXN",
            "parking_name": "Parking Ops",
            "ticket_expiration_hours": 36,
        },
    )
    assert update_settings_response.status_code == 200
    assert update_settings_response.json()["capacity_total"] == 55
    assert update_settings_response.json()["ticket_expiration_hours"] == 36

    pricing_response = client.get("/api/v1/admin/pricing", headers=auth_headers)
    assert pricing_response.status_code == 200
    assert pricing_response.json()["block_minutes"] == 30
    assert pricing_response.json()["student_allowed_domains"] == [".edu", ".edu.mx"]

    update_pricing_response = client.put(
        "/api/v1/admin/pricing",
        headers=auth_headers,
        json={
            "name": "Horario normal",
            "free_tolerance_minutes": 10,
            "block_minutes": 20,
            "block_amount": 12,
            "lost_ticket_fee": 160,
            "senior_discount_percent": 50,
            "student_discount_percent": 50,
            "student_allowed_domains": [".edu", ".edu.mx", "universidad.mx"],
            "senior_discount_applies_to_lost_ticket": False,
            "student_discount_applies_to_lost_ticket": False,
        },
    )
    assert update_pricing_response.status_code == 200
    assert update_pricing_response.json()["block_minutes"] == 20

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

    payment_response = client.post(
        "/api/v1/public/payments/simulate",
        json={
            "ticket_code": ticket_code,
            "lost_ticket": False,
            "method": "simulated_payment",
            "discount": {
                "type": "senior",
                "senior_identifier_type": "document",
                "senior_identifier_value": "INAPAM-1234",
            },
        },
    )
    assert payment_response.status_code == 200

    tickets_response = client.get("/api/v1/admin/reports/tickets", headers=auth_headers)
    assert tickets_response.status_code == 200
    tickets_body = tickets_response.json()
    assert tickets_body["total"] >= 1
    assert any(item["ticket_code"] == ticket_code for item in tickets_body["items"])

    payments_response = client.get("/api/v1/admin/reports/payments", headers=auth_headers)
    assert payments_response.status_code == 200
    payments_body = payments_response.json()
    assert payments_body["total"] >= 1
    assert any(item["ticket_code"] == ticket_code for item in payments_body["items"])
    assert any(item["discount_type"] == "senior" for item in payments_body["items"])

    events_response = client.get("/api/v1/admin/reports/events", headers=auth_headers)
    assert events_response.status_code == 200
    events_body = events_response.json()
    assert events_body["total"] >= 1
    assert any(item["ticket_code"] == ticket_code for item in events_body["items"])

    filtered_tickets_response = client.get(
        "/api/v1/admin/reports/tickets?page=1&page_size=10&status=active&payment_status=paid&lost_ticket=false",
        headers=auth_headers,
    )
    assert filtered_tickets_response.status_code == 200
    filtered_tickets_body = filtered_tickets_response.json()
    assert filtered_tickets_body["page"] == 1
    assert filtered_tickets_body["page_size"] == 10

    filtered_payments_response = client.get(
        "/api/v1/admin/reports/payments?page=1&page_size=10&method=simulated_payment&status=simulated",
        headers=auth_headers,
    )
    assert filtered_payments_response.status_code == 200
    filtered_payments_body = filtered_payments_response.json()
    assert filtered_payments_body["page"] == 1
    assert filtered_payments_body["page_size"] == 10

    filtered_events_response = client.get(
        "/api/v1/admin/reports/events?page=1&page_size=10&event_type=entry",
        headers=auth_headers,
    )
    assert filtered_events_response.status_code == 200
    filtered_events_body = filtered_events_response.json()
    assert filtered_events_body["page"] == 1
    assert filtered_events_body["page_size"] == 10

    backup_response = client.post(
        "/api/v1/admin/backups/export",
        headers=auth_headers,
        json={"scope": "full", "requested_by": "admin@example.com"},
    )
    assert backup_response.status_code == 200
    backup_id = backup_response.json()["backup_id"]

    backups_response = client.get("/api/v1/admin/backups", headers=auth_headers)
    assert backups_response.status_code == 200
    assert any(item["backup_id"] == backup_id for item in backups_response.json())


async def test_ticket_expiration_hours_apply_retroactively_to_existing_tickets(
    client, session_factory
) -> None:
    admin_token = build_access_token(
        user_id="aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa",
        email="admin@example.com",
    )
    auth_headers = {"Authorization": f"Bearer {admin_token}"}
    client.post("/api/v1/auth/bootstrap", headers=auth_headers)

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

    async with session_factory() as session:
        ticket = (
            await session.execute(select(Ticket).where(Ticket.code == ticket_code))
        ).scalar_one()
        ticket.entry_at = datetime.now(UTC) - timedelta(hours=25)
        await session.commit()

    widen_window_response = client.put(
        "/api/v1/admin/settings",
        headers=auth_headers,
        json={
            "capacity_total": 40,
            "timezone": "America/Mexico_City",
            "currency": "MXN",
            "parking_name": "Parking Ops",
            "ticket_expiration_hours": 26,
        },
    )
    assert widen_window_response.status_code == 200
    assert widen_window_response.json()["ticket_expiration_hours"] == 26

    existing_ticket_response = client.get(f"/api/v1/public/tickets/{ticket_code}")
    assert existing_ticket_response.status_code == 200
    assert existing_ticket_response.json()["ticket_code"] == ticket_code

    narrow_window_response = client.put(
        "/api/v1/admin/settings",
        headers=auth_headers,
        json={
            "capacity_total": 40,
            "timezone": "America/Mexico_City",
            "currency": "MXN",
            "parking_name": "Parking Ops",
            "ticket_expiration_hours": 24,
        },
    )
    assert narrow_window_response.status_code == 200
    assert narrow_window_response.json()["ticket_expiration_hours"] == 24

    expired_ticket_response = client.get(f"/api/v1/public/tickets/{ticket_code}")
    assert expired_ticket_response.status_code == 404

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

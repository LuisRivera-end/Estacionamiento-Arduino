from tests.conftest import build_access_token


def test_public_ticket_payment_flow_and_summary(client) -> None:
    admin_token = build_access_token(
        user_id="aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa",
        email="admin@example.com",
    )
    client.post("/api/v1/auth/bootstrap", headers={"Authorization": f"Bearer {admin_token}"})

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

    ticket_response = client.get(f"/api/v1/public/tickets/{ticket_code}")
    assert ticket_response.status_code == 200
    assert ticket_response.json()["ticket_code"] == ticket_code

    calculation_response = client.post(
        f"/api/v1/public/tickets/{ticket_code}/calculate",
        json={
            "lost_ticket": False,
            "discount": {"type": "student", "student_email": "alumno@campus.edu.mx"},
        },
    )
    assert calculation_response.status_code == 200
    calculation_body = calculation_response.json()
    assert calculation_body["discount_type"] == "student"
    assert calculation_body["subtotal_amount"] >= calculation_body["amount"]

    payment_response = client.post(
        "/api/v1/public/payments/simulate",
        json={
            "ticket_code": ticket_code,
            "lost_ticket": False,
            "method": "simulated_payment",
            "discount": {"type": "student", "student_email": "alumno@campus.edu.mx"},
        },
    )
    assert payment_response.status_code == 200
    payment_body = payment_response.json()
    assert payment_body["ticket_code"] == ticket_code
    assert payment_body["discount_type"] == "student"
    assert payment_body["simulation_reference"].startswith(f"sim_payment_{ticket_code}_")

    summary_response = client.get(
        "/api/v1/admin/reports/summary",
        headers={"Authorization": f"Bearer {admin_token}"},
    )
    assert summary_response.status_code == 200
    assert summary_response.json()["paid_tickets"] >= 1


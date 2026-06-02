from tests.conftest import build_access_token


def test_admin_can_create_and_list_staff_users(client) -> None:
    admin_token = build_access_token(
        user_id="aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa",
        email="admin@example.com",
    )
    auth_headers = {"Authorization": f"Bearer {admin_token}"}
    client.post("/api/v1/auth/bootstrap", headers=auth_headers)

    create_response = client.post(
        "/api/v1/admin/users",
        headers=auth_headers,
        json={
            "email": "nuevo-admin@example.com",
            "password": "Temporal123!",
            "display_name": "Nuevo Admin",
            "role": "admin",
        },
    )

    assert create_response.status_code == 200
    created_user = create_response.json()
    assert created_user["email"] == "nuevo-admin@example.com"
    assert created_user["display_name"] == "Nuevo Admin"
    assert created_user["role"] == "admin"
    assert created_user["status"] == "active"

    list_response = client.get("/api/v1/admin/users", headers=auth_headers)

    assert list_response.status_code == 200
    users = list_response.json()
    assert any(user["email"] == "admin@example.com" for user in users)
    assert any(user["email"] == "nuevo-admin@example.com" for user in users)


def test_admin_user_creation_rejects_short_password(client) -> None:
    admin_token = build_access_token(
        user_id="aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa",
        email="admin@example.com",
    )
    auth_headers = {"Authorization": f"Bearer {admin_token}"}
    client.post("/api/v1/auth/bootstrap", headers=auth_headers)

    response = client.post(
        "/api/v1/admin/users",
        headers=auth_headers,
        json={
            "email": "corto@example.com",
            "password": "123",
            "display_name": "Clave Corta",
            "role": "panelist",
        },
    )

    assert response.status_code == 422

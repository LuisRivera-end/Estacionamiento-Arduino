import httpx

from app.api.deps import get_jwt_verifier
from app.core.config import get_settings
from app.services import staff_users
from tests.conftest import build_access_token


def clear_auth_caches() -> None:
    get_settings.cache_clear()
    get_jwt_verifier.cache_clear()


def test_admin_can_create_and_list_staff_users(client) -> None:
    clear_auth_caches()
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
    clear_auth_caches()
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


def test_admin_can_repair_auth_user_missing_staff_profile(client, monkeypatch) -> None:
    monkeypatch.setenv("APP_ENV", "production")
    monkeypatch.setenv("SUPABASE_URL", "https://example.supabase.co")
    monkeypatch.setenv("SUPABASE_SECRET_KEY", "service-role-key")
    clear_auth_caches()

    class FakeAsyncClient:
        async def __aenter__(self):
            return self

        async def __aexit__(self, *_args) -> None:
            return None

        async def post(self, *_args, **_kwargs) -> httpx.Response:
            return httpx.Response(422, json={"message": "User already registered"})

        async def get(self, *_args, **_kwargs) -> httpx.Response:
            return httpx.Response(
                200,
                json={
                    "users": [
                        {
                            "id": "bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb",
                            "email": "orphan@example.com",
                        }
                    ]
                },
            )

    monkeypatch.setattr(staff_users.httpx, "AsyncClient", FakeAsyncClient)

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
            "email": "orphan@example.com",
            "password": "Temporal123!",
            "display_name": "Usuario Huerfano",
            "role": "admin",
        },
    )

    assert create_response.status_code == 200
    assert create_response.json()["user_id"] == "bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb"

    list_response = client.get("/api/v1/admin/users", headers=auth_headers)
    users = list_response.json()
    assert any(user["email"] == "orphan@example.com" for user in users)

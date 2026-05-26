from tests.conftest import build_access_token


def test_setup_status_allows_initial_account_creation_before_bootstrap(client) -> None:
    response = client.get("/api/v1/auth/setup-status")

    assert response.status_code == 200
    assert response.json() == {"allow_initial_account_creation": True}


def test_first_login_bootstraps_admin(client) -> None:
    token = build_access_token(
        user_id="aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa",
        email="admin@example.com",
        user_metadata={"name": "Admin Uno"},
    )

    response = client.post(
        "/api/v1/auth/bootstrap",
        headers={"Authorization": f"Bearer {token}"},
    )

    assert response.status_code == 200
    body = response.json()
    assert body["created"] is True
    assert body["first_login"] is True
    assert body["profile"]["role"] == "admin"
    assert body["profile"]["display_name"] == "Admin Uno"


def test_second_user_bootstraps_panelist(client) -> None:
    admin_token = build_access_token(
        user_id="aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa",
        email="admin@example.com",
    )
    client.post("/api/v1/auth/bootstrap", headers={"Authorization": f"Bearer {admin_token}"})

    panelist_token = build_access_token(
        user_id="bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb",
        email="panel@example.com",
    )
    response = client.post(
        "/api/v1/auth/bootstrap",
        headers={"Authorization": f"Bearer {panelist_token}"},
    )

    assert response.status_code == 200
    assert response.json()["profile"]["role"] == "panelist"


def test_setup_status_disables_initial_account_creation_after_bootstrap(client) -> None:
    token = build_access_token(
        user_id="aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa",
        email="admin@example.com",
    )
    client.post("/api/v1/auth/bootstrap", headers={"Authorization": f"Bearer {token}"})

    response = client.get("/api/v1/auth/setup-status")

    assert response.status_code == 200
    assert response.json() == {"allow_initial_account_creation": False}

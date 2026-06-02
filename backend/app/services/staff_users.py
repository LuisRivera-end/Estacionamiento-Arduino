from __future__ import annotations

import uuid
from dataclasses import dataclass

import httpx
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import Settings
from app.core.errors import AppError
from app.models.enums import StaffStatus
from app.repositories.staff import StaffRepository
from app.schemas.auth import StaffUserCreateRequest


@dataclass(frozen=True, slots=True)
class SupabaseAuthUser:
    user_id: str
    created: bool


async def create_staff_user(
    *,
    session: AsyncSession,
    payload: StaffUserCreateRequest,
    settings: Settings,
) -> object:
    repository = StaffRepository(session)
    existing = await repository.get_by_email(payload.email)
    if existing:
        raise AppError(400, "user_already_exists", "El correo ya esta registrado")

    auth_user = await create_supabase_auth_user(payload=payload, settings=settings)

    try:
        profile = await repository.create(
            user_id=auth_user.user_id,
            email=payload.email,
            display_name=payload.display_name,
            role=payload.role,
            status=StaffStatus.ACTIVE,
        )
        await session.commit()
    except Exception:
        await session.rollback()
        if auth_user.created:
            await delete_supabase_auth_user(user_id=auth_user.user_id, settings=settings)
        raise

    return profile


async def create_supabase_auth_user(
    *,
    payload: StaffUserCreateRequest,
    settings: Settings,
) -> SupabaseAuthUser:
    if not settings.supabase_url or not settings.supabase_secret_key:
        if settings.app_env == "production":
            raise AppError(
                500,
                "supabase_not_configured",
                "SUPABASE_URL y SUPABASE_SECRET_KEY son requeridos para crear usuarios",
            )
        return SupabaseAuthUser(user_id=str(uuid.uuid4()), created=True)

    supabase_url = settings.supabase_url.rstrip("/")
    headers = {
        "apikey": settings.supabase_secret_key,
        "Authorization": f"Bearer {settings.supabase_secret_key}",
        "Content-Type": "application/json",
    }
    body = {
        "email": payload.email,
        "password": payload.password,
        "email_confirm": True,
        "user_metadata": {"display_name": payload.display_name},
    }

    try:
        async with httpx.AsyncClient() as client:
            response = await client.post(
                f"{supabase_url}/auth/v1/admin/users",
                headers=headers,
                json=body,
            )

            if response.status_code != 201 and _is_existing_auth_user_response(response):
                existing_user_id = await find_supabase_auth_user_id_by_email(
                    client=client,
                    supabase_url=supabase_url,
                    headers=headers,
                    email=str(payload.email),
                )
                if existing_user_id:
                    return SupabaseAuthUser(user_id=existing_user_id, created=False)
    except httpx.HTTPError as exc:
        raise AppError(
            500,
            "supabase_connection_error",
            f"Error al conectar con Supabase: {exc}",
        ) from exc

    if response.status_code != 201:
        raise AppError(
            response.status_code,
            "supabase_creation_failed",
            f"No se pudo crear el usuario en Supabase: {_extract_supabase_error(response)}",
        )

    supabase_user = response.json()
    user_id = supabase_user.get("id")
    if not isinstance(user_id, str) or not user_id:
        raise AppError(
            502,
            "supabase_creation_failed",
            "Supabase no devolvio el identificador del usuario creado",
        )
    return SupabaseAuthUser(user_id=user_id, created=True)


async def find_supabase_auth_user_id_by_email(
    *,
    client: httpx.AsyncClient,
    supabase_url: str,
    headers: dict[str, str],
    email: str,
) -> str | None:
    response = await client.get(
        f"{supabase_url}/auth/v1/admin/users",
        headers=headers,
        params={"page": 1, "per_page": 1000},
    )
    if response.status_code != 200:
        raise AppError(
            response.status_code,
            "supabase_lookup_failed",
            f"No se pudo buscar el usuario en Supabase: {_extract_supabase_error(response)}",
        )

    normalized_email = email.lower()
    for user in _extract_supabase_users(response):
        user_email = user.get("email")
        user_id = user.get("id")
        if (
            isinstance(user_email, str)
            and user_email.lower() == normalized_email
            and isinstance(user_id, str)
            and user_id
        ):
            return user_id

    return None


async def delete_supabase_auth_user(*, user_id: str, settings: Settings) -> None:
    if not settings.supabase_url or not settings.supabase_secret_key:
        return

    supabase_url = settings.supabase_url.rstrip("/")
    headers = {
        "apikey": settings.supabase_secret_key,
        "Authorization": f"Bearer {settings.supabase_secret_key}",
    }

    try:
        async with httpx.AsyncClient() as client:
            await client.delete(f"{supabase_url}/auth/v1/admin/users/{user_id}", headers=headers)
    except httpx.HTTPError:
        return


def _is_existing_auth_user_response(response: httpx.Response) -> bool:
    if response.status_code not in {400, 409, 422}:
        return False

    message = _extract_supabase_error(response).lower()
    return "already" in message and ("registered" in message or "exists" in message)


def _extract_supabase_users(response: httpx.Response) -> list[dict]:
    data = response.json()
    if isinstance(data, list):
        return [user for user in data if isinstance(user, dict)]
    if isinstance(data, dict):
        users = data.get("users")
        if isinstance(users, list):
            return [user for user in users if isinstance(user, dict)]
    return []


def _extract_supabase_error(response: httpx.Response) -> str:
    fallback = response.text
    try:
        data = response.json()
    except ValueError:
        return fallback

    if isinstance(data, dict):
        for key in ("msg", "message", "error_description", "error"):
            value = data.get(key)
            if isinstance(value, str) and value:
                return value
    return fallback

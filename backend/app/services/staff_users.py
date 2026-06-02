from __future__ import annotations

import uuid

import httpx
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import Settings
from app.core.errors import AppError
from app.models.enums import StaffStatus
from app.repositories.staff import StaffRepository
from app.schemas.auth import StaffUserCreateRequest


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

    user_id = await create_supabase_auth_user(payload=payload, settings=settings)

    profile = await repository.create(
        user_id=user_id,
        email=payload.email,
        display_name=payload.display_name,
        role=payload.role,
        status=StaffStatus.ACTIVE,
    )
    await session.commit()
    return profile


async def create_supabase_auth_user(
    *,
    payload: StaffUserCreateRequest,
    settings: Settings,
) -> str:
    if not settings.supabase_url or not settings.supabase_secret_key:
        if settings.app_env == "production":
            raise AppError(
                500,
                "supabase_not_configured",
                "SUPABASE_URL y SUPABASE_SECRET_KEY son requeridos para crear usuarios",
            )
        return str(uuid.uuid4())

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
    return user_id


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

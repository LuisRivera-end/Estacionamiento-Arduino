from __future__ import annotations

import hmac

from app.core.config import Settings
from app.core.errors import AppError
from app.models.enums import DeviceType


def normalize_ticket_code(code: str) -> str:
    normalized = code.strip().upper()
    if len(normalized) != 6 or not normalized.isalnum():
        raise AppError(
            422,
            "invalid_ticket_code",
            "El codigo de ticket debe ser alfanumerico de 6 caracteres",
        )
    return normalized


def verify_device_credentials(
    *,
    settings: Settings,
    device_type: DeviceType,
    device_id: str | None,
    device_token: str | None,
) -> str:
    if not device_id or not device_token:
        raise AppError(401, "device_auth_required", "Faltan credenciales de dispositivo")

    expected_token = (
        settings.api_device_token_entry
        if device_type == DeviceType.ENTRY
        else settings.api_device_token_exit
    )

    if not hmac.compare_digest(device_token, expected_token):
        raise AppError(401, "invalid_device_token", "Token de dispositivo invalido")

    return device_id


def extract_bearer_token(authorization: str | None) -> str:
    if not authorization:
        raise AppError(401, "auth_required", "Falta el token de autenticacion")

    scheme, _, token = authorization.partition(" ")
    if scheme.lower() != "bearer" or not token:
        raise AppError(
            401,
            "invalid_authorization",
            "Authorization debe usar el esquema Bearer",
        )
    return token

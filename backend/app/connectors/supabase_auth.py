from __future__ import annotations

from collections.abc import Mapping
from functools import cached_property

import jwt
from jwt import PyJWKClient

from app.core.config import Settings
from app.core.errors import AppError
from app.schemas.auth import AuthClaims


class SupabaseJWTVerifier:
    def __init__(self, settings: Settings) -> None:
        self.settings = settings

    @cached_property
    def jwk_client(self) -> PyJWKClient | None:
        if not self.settings.effective_supabase_jwks_url:
            return None
        return PyJWKClient(self.settings.effective_supabase_jwks_url)

    def verify_access_token(self, token: str) -> AuthClaims:
        if self.settings.supabase_jwt_secret:
            payload = jwt.decode(
                token,
                self.settings.supabase_jwt_secret,
                algorithms=["HS256"],
                audience="authenticated",
                options={"require": ["sub", "email", "role"]},
            )
            return self._build_claims(payload)

        if not self.jwk_client:
            raise AppError(
                500,
                "auth_not_configured",
                "Supabase JWT verification is not configured",
            )

        signing_key = self.jwk_client.get_signing_key_from_jwt(token)
        issuer = (
            f"{self.settings.supabase_url.rstrip('/')}/auth/v1"
            if self.settings.supabase_url
            else None
        )
        payload = jwt.decode(
            token,
            signing_key.key,
            algorithms=["RS256", "ES256"],
            audience="authenticated",
            issuer=issuer,
            options={"require": ["sub", "email", "role"]},
        )
        return self._build_claims(payload)

    @staticmethod
    def _build_claims(payload: Mapping[str, object]) -> AuthClaims:
        try:
            return AuthClaims.model_validate(payload)
        except Exception as exc:  # pragma: no cover - defensive
            raise AppError(401, "invalid_token", "Token de autenticacion invalido") from exc

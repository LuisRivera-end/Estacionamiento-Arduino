from functools import lru_cache
from typing import Literal

from pydantic import computed_field
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=False,
        extra="ignore",
    )

    app_name: str = "parking-api"
    app_env: Literal["development", "test", "production"] = "development"
    api_v1_prefix: str = "/api/v1"
    log_level: str = "INFO"
    allowed_origins: str = "http://localhost:3000"

    supabase_url: str | None = None
    supabase_secret_key: str | None = None
    supabase_db_url: str | None = None
    supabase_jwt_secret: str | None = None
    supabase_jwks_url: str | None = None

    api_device_token_entry: str = "entry-test-token"
    api_device_token_exit: str = "exit-test-token"

    bootstrap_first_user_as_admin: bool = True

    @computed_field  # type: ignore[prop-decorator]
    @property
    def effective_supabase_jwks_url(self) -> str | None:
        if self.supabase_jwks_url:
            return self.supabase_jwks_url
        if self.supabase_url:
            return f"{self.supabase_url.rstrip('/')}/auth/v1/.well-known/jwks.json"
        return None

    @property
    def cors_origins(self) -> list[str]:
        return [item.strip() for item in self.allowed_origins.split(",") if item.strip()]

    @property
    def effective_supabase_db_url(self) -> str | None:
        if not self.supabase_db_url:
            return None
        if self.supabase_db_url.startswith("postgresql://"):
            return self.supabase_db_url.replace("postgresql://", "postgresql+asyncpg://", 1)
        return self.supabase_db_url


@lru_cache
def get_settings() -> Settings:
    return Settings()

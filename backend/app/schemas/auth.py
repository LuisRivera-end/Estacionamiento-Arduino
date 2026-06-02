from datetime import datetime

from pydantic import BaseModel, ConfigDict, EmailStr, Field

from app.models.enums import StaffRole, StaffStatus


class AuthClaims(BaseModel):
    sub: str
    email: EmailStr
    role: str
    aud: str | list[str]
    app_metadata: dict | None = None
    user_metadata: dict | None = None


class StaffProfileResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    user_id: str
    email: EmailStr
    display_name: str | None
    role: StaffRole
    status: StaffStatus
    created_at: datetime
    updated_at: datetime


class BootstrapResponse(BaseModel):
    created: bool
    first_login: bool
    profile: StaffProfileResponse


class AuthSetupStatusResponse(BaseModel):
    allow_initial_account_creation: bool


class StaffUserCreateRequest(BaseModel):
    email: EmailStr
    password: str = Field(min_length=6, max_length=128)
    display_name: str | None = None
    role: StaffRole = StaffRole.PANELIST

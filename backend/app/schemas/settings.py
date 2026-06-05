from datetime import datetime

from pydantic import BaseModel, Field, model_validator


class ParkingSettingsResponse(BaseModel):
    capacity_total: int
    timezone: str
    currency: str
    parking_name: str
    ticket_expiration_hours: int


class ParkingSettingsUpdateRequest(BaseModel):
    capacity_total: int = Field(ge=1)
    timezone: str = Field(min_length=3, max_length=64)
    currency: str = Field(min_length=3, max_length=3)
    parking_name: str = Field(default="Parking Ops", min_length=1, max_length=100)
    ticket_expiration_hours: int = Field(default=24, ge=1, le=720)
    ticket_expiration_minutes: int | None = Field(default=None, ge=1, le=43200, exclude=True)

    @model_validator(mode="before")
    @classmethod
    def normalize_legacy_expiration_payload(cls, data: object) -> object:
        if not isinstance(data, dict):
            return data

        normalized = dict(data)
        if "ticket_expiration_hours" not in normalized:
            legacy_minutes = normalized.pop("ticket_expiration_minutes", None)
            if legacy_minutes is not None:
                from app.services.ticket_expiration import expiration_minutes_to_hours

                normalized["ticket_expiration_hours"] = expiration_minutes_to_hours(
                    int(legacy_minutes)
                )

        return normalized


class PricingRuleResponse(BaseModel):
    name: str
    free_tolerance_minutes: int
    block_minutes: int
    block_amount: int
    lost_ticket_fee: int
    senior_discount_percent: int
    student_discount_percent: int
    student_allowed_domains: list[str]
    senior_discount_applies_to_lost_ticket: bool
    student_discount_applies_to_lost_ticket: bool
    is_active: bool


class PricingRuleUpdateRequest(BaseModel):
    name: str = Field(min_length=3, max_length=100)
    free_tolerance_minutes: int = Field(ge=0)
    block_minutes: int = Field(ge=1)
    block_amount: int = Field(ge=0)
    lost_ticket_fee: int = Field(ge=0)
    senior_discount_percent: int = Field(ge=0, le=100)
    student_discount_percent: int = Field(ge=0, le=100)
    student_allowed_domains: list[str] = Field(min_length=1)
    senior_discount_applies_to_lost_ticket: bool = False
    student_discount_applies_to_lost_ticket: bool = False


class BackupExportRequest(BaseModel):
    scope: str = "full"
    requested_by: str


class BackupExportResponse(BaseModel):
    backup_id: str
    status: str


class BackupItemResponse(BaseModel):
    backup_id: str
    status: str
    requested_by: str | None
    created_at: datetime

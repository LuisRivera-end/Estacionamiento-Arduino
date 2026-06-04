from datetime import datetime

from pydantic import BaseModel, Field


class ParkingSettingsResponse(BaseModel):
    capacity_total: int
    timezone: str
    currency: str
    parking_name: str
    ticket_expiration_minutes: int


class ParkingSettingsUpdateRequest(BaseModel):
    capacity_total: int = Field(ge=1)
    timezone: str = Field(min_length=3, max_length=64)
    currency: str = Field(min_length=3, max_length=3)
    parking_name: str = Field(min_length=1, max_length=100)
    ticket_expiration_minutes: int = Field(ge=1, le=43200)


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

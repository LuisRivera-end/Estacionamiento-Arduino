from datetime import datetime

from pydantic import BaseModel, Field


class ParkingSettingsResponse(BaseModel):
    capacity_total: int
    timezone: str
    currency: str


class ParkingSettingsUpdateRequest(BaseModel):
    capacity_total: int = Field(ge=1)
    timezone: str = Field(min_length=3, max_length=64)
    currency: str = Field(min_length=3, max_length=3)


class PricingRuleResponse(BaseModel):
    name: str
    free_tolerance_minutes: int
    block_minutes: int
    block_amount: int
    lost_ticket_fee: int
    is_active: bool


class PricingRuleUpdateRequest(BaseModel):
    name: str = Field(min_length=3, max_length=100)
    free_tolerance_minutes: int = Field(ge=0)
    block_minutes: int = Field(ge=1)
    block_amount: int = Field(ge=0)
    lost_ticket_fee: int = Field(ge=0)


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

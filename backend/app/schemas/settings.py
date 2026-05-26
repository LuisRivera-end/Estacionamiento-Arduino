from pydantic import BaseModel


class ParkingSettingsResponse(BaseModel):
    capacity_total: int
    timezone: str
    currency: str


class BackupExportRequest(BaseModel):
    scope: str = "full"
    requested_by: str


class BackupExportResponse(BaseModel):
    backup_id: str
    status: str

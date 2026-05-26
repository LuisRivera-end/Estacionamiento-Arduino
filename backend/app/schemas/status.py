from datetime import datetime

from pydantic import BaseModel


class StatusResponse(BaseModel):
    capacity_total: int
    occupied_spaces: int
    available_spaces: int
    active_tickets: int
    last_entry_at: datetime | None
    last_exit_at: datetime | None

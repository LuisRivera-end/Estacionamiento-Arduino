from fastapi import APIRouter

from app.api.routes import (
    admin_backups,
    admin_reports,
    admin_settings,
    arduino,
    auth,
    health,
    payments,
    public_tickets,
    status,
)

api_router = APIRouter()
api_router.include_router(health.router, tags=["health"])
api_router.include_router(status.router, tags=["status"])
api_router.include_router(arduino.router, prefix="/arduino", tags=["arduino"])
api_router.include_router(auth.router, prefix="/auth", tags=["auth"])
api_router.include_router(public_tickets.router, prefix="/public", tags=["public-tickets"])
api_router.include_router(payments.router, prefix="/public", tags=["payments"])
api_router.include_router(admin_reports.router, prefix="/admin/reports", tags=["admin-reports"])
api_router.include_router(admin_settings.router, prefix="/admin", tags=["admin-settings"])
api_router.include_router(admin_backups.router, prefix="/admin/backups", tags=["admin-backups"])

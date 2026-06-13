from fastapi import APIRouter

from app.api.routes import (
    admin_backups,
    admin_dev,
    admin_reports,
    admin_settings,
    admin_sync,
    admin_users,
    arduino,
    auth,
    health,
    payments,
    public_settings,
    public_tickets,
    status,
)

api_router = APIRouter()
api_router.include_router(health.router, tags=["health"])
api_router.include_router(status.router, tags=["status"])
api_router.include_router(arduino.router, prefix="/arduino", tags=["arduino"])
api_router.include_router(auth.router, prefix="/auth", tags=["auth"])
api_router.include_router(public_tickets.router, prefix="/public", tags=["public-tickets"])
api_router.include_router(public_settings.router, prefix="/public", tags=["public-settings"])
api_router.include_router(payments.router, prefix="/public", tags=["payments"])
api_router.include_router(admin_reports.router, prefix="/admin/reports", tags=["admin-reports"])
api_router.include_router(admin_settings.router, prefix="/admin", tags=["admin-settings"])
api_router.include_router(admin_backups.router, prefix="/admin/backups", tags=["admin-backups"])
api_router.include_router(admin_sync.router, prefix="/admin/sync", tags=["admin-sync"])
api_router.include_router(admin_users.router, prefix="/admin/users", tags=["admin-users"])
api_router.include_router(admin_dev.router, prefix="/admin", tags=["admin-dev"])

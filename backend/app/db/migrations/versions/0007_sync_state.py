"""Sync watermark state for local -> cloud push.

Revision ID: 0007_sync_state
Revises: 0006_ticket_expire_archive
Create Date: 2026-06-13
"""

import sqlalchemy as sa
from alembic import op

revision = "0007_sync_state"
down_revision = "0006_ticket_expire_archive"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        "sync_state",
        sa.Column("table_name", sa.String(64), primary_key=True),
        sa.Column("last_synced_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("last_run_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("last_status", sa.String(20), nullable=True),
        sa.Column("last_pushed_count", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("last_error", sa.Text(), nullable=True),
    )

    # Consistencia con el resto del esquema en Postgres (0001 hace lo mismo).
    bind = op.get_bind()
    if bind.dialect.name == "postgresql":
        op.execute("ALTER TABLE public.sync_state ENABLE ROW LEVEL SECURITY")
        op.execute("GRANT SELECT, INSERT, UPDATE, DELETE ON public.sync_state TO service_role")


def downgrade() -> None:
    op.drop_table("sync_state")

"""Ticket expiration, archived tickets, and parking branding.

Revision ID: 0006_ticket_expiration_and_archive
Revises: 0005_normalize_staff_enum_values
Create Date: 2026-06-04
"""

import sqlalchemy as sa
from alembic import op

revision = "0006_ticket_expire_archive"
down_revision = "0005_normalize_staff_enum_values"
branch_labels = None
depends_on = None


def upgrade() -> None:
    # --- archived_tickets table ---
    op.create_table(
        "archived_tickets",
        sa.Column("id", sa.String(), primary_key=True),
        sa.Column("code", sa.String(6), nullable=False, index=True),
        sa.Column("status", sa.String(20), nullable=False),
        sa.Column("payment_status", sa.String(20), nullable=False),
        sa.Column("entry_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("paid_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("exit_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("duration_minutes", sa.Integer(), nullable=True),
        sa.Column("calculated_amount", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("lost_ticket", sa.Boolean(), nullable=False, server_default="false"),
        sa.Column("entry_device_id", sa.String(100), nullable=True),
        sa.Column("exit_device_id", sa.String(100), nullable=True),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            nullable=False,
            server_default=sa.func.now(),
        ),
        sa.Column(
            "updated_at",
            sa.DateTime(timezone=True),
            nullable=False,
            server_default=sa.func.now(),
        ),
        sa.Column(
            "archived_at",
            sa.DateTime(timezone=True),
            nullable=False,
            server_default=sa.func.now(),
        ),
        sa.Column("expired_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("archive_reason", sa.String(30), nullable=False),
    )

    # --- parking_settings new columns ---
    op.add_column(
        "parking_settings",
        sa.Column(
            "parking_name",
            sa.String(100),
            nullable=False,
            server_default="Parking Ops",
        ),
    )
    op.add_column(
        "parking_settings",
        sa.Column(
            "ticket_expiration_minutes",
            sa.Integer(),
            nullable=False,
            server_default="1440",
        ),
    )

    # --- Change audit_logs.ticket_id FK to ON DELETE SET NULL ---
    # Drop the existing FK constraint (name from initial migration)
    op.drop_constraint(
        "audit_logs_ticket_id_fkey", "audit_logs", type_="foreignkey"
    )
    op.create_foreign_key(
        "audit_logs_ticket_id_fkey",
        "audit_logs",
        "tickets",
        ["ticket_id"],
        ["id"],
        ondelete="SET NULL",
    )


def downgrade() -> None:
    # Revert FK to restrictive
    op.drop_constraint(
        "audit_logs_ticket_id_fkey", "audit_logs", type_="foreignkey"
    )
    op.create_foreign_key(
        "audit_logs_ticket_id_fkey",
        "audit_logs",
        "tickets",
        ["ticket_id"],
        ["id"],
    )

    op.drop_column("parking_settings", "ticket_expiration_minutes")
    op.drop_column("parking_settings", "parking_name")
    op.drop_table("archived_tickets")

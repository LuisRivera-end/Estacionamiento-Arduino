"""initial parking schema

Revision ID: 0001_initial_schema
Revises:
Create Date: 2026-05-25
"""
# ruff: noqa: E501

from __future__ import annotations

import sqlalchemy as sa
from alembic import op

revision = "0001_initial_schema"
down_revision = None
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        "devices",
        sa.Column("id", sa.String(length=36), primary_key=True),
        sa.Column("device_id", sa.String(length=50), nullable=False, unique=True),
        sa.Column("device_type", sa.String(length=20), nullable=False),
        sa.Column("display_name", sa.String(length=100), nullable=False),
        sa.Column("is_active", sa.Boolean(), nullable=False, server_default=sa.true()),
    )
    op.create_table(
        "parking_settings",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("capacity_total", sa.Integer(), nullable=False),
        sa.Column("timezone", sa.String(length=64), nullable=False),
        sa.Column("currency", sa.String(length=3), nullable=False),
        sa.Column(
            "updated_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()
        ),
    )
    op.create_table(
        "parking_state",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("occupied_spaces", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("active_tickets_count", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("last_entry_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("last_exit_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column(
            "updated_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()
        ),
    )
    op.create_table(
        "pricing_rules",
        sa.Column("id", sa.String(length=36), primary_key=True),
        sa.Column("name", sa.String(length=100), nullable=False),
        sa.Column("free_tolerance_minutes", sa.Integer(), nullable=False),
        sa.Column("block_minutes", sa.Integer(), nullable=False),
        sa.Column("block_amount", sa.Integer(), nullable=False),
        sa.Column("lost_ticket_fee", sa.Integer(), nullable=False),
        sa.Column("is_active", sa.Boolean(), nullable=False, server_default=sa.false()),
        sa.Column(
            "created_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()
        ),
        sa.Column(
            "updated_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()
        ),
    )
    op.create_index(
        "pricing_rules_one_active",
        "pricing_rules",
        ["is_active"],
        unique=True,
        postgresql_where=sa.text("is_active = true"),
    )
    op.create_table(
        "tickets",
        sa.Column("id", sa.String(length=36), primary_key=True),
        sa.Column("code", sa.String(length=6), nullable=False, unique=True),
        sa.Column("status", sa.String(length=20), nullable=False),
        sa.Column("payment_status", sa.String(length=20), nullable=False),
        sa.Column(
            "entry_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()
        ),
        sa.Column("paid_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("exit_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("duration_minutes", sa.Integer(), nullable=True),
        sa.Column("calculated_amount", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("lost_ticket", sa.Boolean(), nullable=False, server_default=sa.false()),
        sa.Column(
            "entry_device_id", sa.String(length=36), sa.ForeignKey("devices.id"), nullable=True
        ),
        sa.Column(
            "exit_device_id", sa.String(length=36), sa.ForeignKey("devices.id"), nullable=True
        ),
        sa.Column(
            "created_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()
        ),
        sa.Column(
            "updated_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()
        ),
    )
    op.create_index("tickets_status_idx", "tickets", ["status"])
    op.create_index("tickets_payment_status_idx", "tickets", ["payment_status"])
    op.create_index("tickets_entry_at_idx", "tickets", ["entry_at"])
    op.create_table(
        "payments",
        sa.Column("id", sa.String(length=36), primary_key=True),
        sa.Column("ticket_id", sa.String(length=36), sa.ForeignKey("tickets.id"), nullable=False),
        sa.Column("amount", sa.Integer(), nullable=False),
        sa.Column("method", sa.String(length=30), nullable=False),
        sa.Column("status", sa.String(length=20), nullable=False),
        sa.Column("provider_reference", sa.String(length=150), nullable=True),
        sa.Column("created_by", sa.String(length=64), nullable=True),
        sa.Column(
            "created_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()
        ),
    )
    op.create_index("payments_ticket_id_idx", "payments", ["ticket_id"])
    op.create_index("payments_created_at_idx", "payments", ["created_at"])
    op.create_table(
        "audit_logs",
        sa.Column("id", sa.String(length=36), primary_key=True),
        sa.Column("event_type", sa.String(length=100), nullable=False),
        sa.Column("ticket_id", sa.String(length=36), sa.ForeignKey("tickets.id"), nullable=True),
        sa.Column("actor_type", sa.String(length=50), nullable=False),
        sa.Column("actor_id", sa.String(length=100), nullable=True),
        sa.Column("payload", sa.JSON(), nullable=False),
        sa.Column(
            "created_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()
        ),
    )
    op.create_index("audit_logs_ticket_id_idx", "audit_logs", ["ticket_id"])
    op.create_index("audit_logs_created_at_idx", "audit_logs", ["created_at"])
    op.create_table(
        "backup_exports",
        sa.Column("id", sa.String(length=36), primary_key=True),
        sa.Column("status", sa.String(length=20), nullable=False),
        sa.Column("file_path", sa.String(length=255), nullable=True),
        sa.Column("requested_by", sa.String(length=64), nullable=True),
        sa.Column(
            "created_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()
        ),
        sa.Column("completed_at", sa.DateTime(timezone=True), nullable=True),
    )
    op.create_table(
        "staff_users",
        sa.Column("user_id", sa.String(length=36), primary_key=True),
        sa.Column("email", sa.String(length=255), nullable=False, unique=True),
        sa.Column("display_name", sa.String(length=255), nullable=True),
        sa.Column("role", sa.String(length=20), nullable=False),
        sa.Column("status", sa.String(length=20), nullable=False),
        sa.Column(
            "created_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()
        ),
        sa.Column(
            "updated_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()
        ),
    )

    op.execute(
        """
        INSERT INTO devices (id, device_id, device_type, display_name, is_active) VALUES
        ('11111111-1111-1111-1111-111111111111', 'entrada-01', 'entry', 'Caseta entrada 01', true),
        ('22222222-2222-2222-2222-222222222222', 'salida-01', 'exit', 'Caseta salida 01', true)
        """
    )
    op.execute(
        """
        INSERT INTO parking_settings (id, capacity_total, timezone, currency)
        VALUES (1, 40, 'America/Mexico_City', 'MXN')
        """
    )
    op.execute(
        """
        INSERT INTO parking_state (id, occupied_spaces, active_tickets_count)
        VALUES (1, 0, 0)
        """
    )
    op.execute(
        """
        INSERT INTO pricing_rules (
          id, name, free_tolerance_minutes, block_minutes, block_amount, lost_ticket_fee, is_active
        ) VALUES (
          '33333333-3333-3333-3333-333333333333',
          'MVP default',
          5,
          30,
          10,
          150,
          true
        )
        """
    )

    bind = op.get_bind()
    if bind.dialect.name == "postgresql":
        for table_name in (
            "devices",
            "parking_settings",
            "parking_state",
            "pricing_rules",
            "tickets",
            "payments",
            "audit_logs",
            "backup_exports",
            "staff_users",
        ):
            op.execute(f"ALTER TABLE public.{table_name} ENABLE ROW LEVEL SECURITY")

        op.execute("REVOKE ALL ON ALL TABLES IN SCHEMA public FROM anon, authenticated")
        op.execute("REVOKE ALL ON ALL SEQUENCES IN SCHEMA public FROM anon, authenticated")
        op.execute("GRANT USAGE ON SCHEMA public TO service_role")
        op.execute(
            "GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO service_role"
        )


def downgrade() -> None:
    for index_name in (
        "audit_logs_created_at_idx",
        "audit_logs_ticket_id_idx",
        "payments_created_at_idx",
        "payments_ticket_id_idx",
        "tickets_entry_at_idx",
        "tickets_payment_status_idx",
        "tickets_status_idx",
        "pricing_rules_one_active",
    ):
        op.drop_index(index_name, if_exists=True)

    for table_name in (
        "staff_users",
        "backup_exports",
        "audit_logs",
        "payments",
        "tickets",
        "pricing_rules",
        "parking_state",
        "parking_settings",
        "devices",
    ):
        op.drop_table(table_name)

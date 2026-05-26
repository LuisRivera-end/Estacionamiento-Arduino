"""add explicit rls policies and foreign key indexes

Revision ID: 0002_security_and_fk_indexes
Revises: 0001_initial_schema
Create Date: 2026-05-25
"""

from __future__ import annotations

from alembic import op

revision = "0002_security_and_fk_indexes"
down_revision = "0001_initial_schema"
branch_labels = None
depends_on = None


TABLES = (
    "devices",
    "parking_settings",
    "parking_state",
    "pricing_rules",
    "tickets",
    "payments",
    "audit_logs",
    "backup_exports",
    "staff_users",
)


def upgrade() -> None:
    op.create_index(
        "tickets_entry_device_id_idx",
        "tickets",
        ["entry_device_id"],
        unique=False,
    )
    op.create_index(
        "tickets_exit_device_id_idx",
        "tickets",
        ["exit_device_id"],
        unique=False,
    )

    bind = op.get_bind()
    if bind.dialect.name == "postgresql":
        for table_name in TABLES:
            op.execute(
                f"""
                CREATE POLICY {table_name}_service_role_all
                ON public.{table_name}
                FOR ALL
                TO service_role
                USING (true)
                WITH CHECK (true)
                """
            )


def downgrade() -> None:
    bind = op.get_bind()
    if bind.dialect.name == "postgresql":
        for table_name in TABLES:
            op.execute(
                f"DROP POLICY IF EXISTS {table_name}_service_role_all ON public.{table_name}"
            )

    op.drop_index("tickets_exit_device_id_idx", table_name="tickets", if_exists=True)
    op.drop_index("tickets_entry_device_id_idx", table_name="tickets", if_exists=True)

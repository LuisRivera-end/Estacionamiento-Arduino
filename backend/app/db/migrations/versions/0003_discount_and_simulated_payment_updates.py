"""add discounts and simulated payment references

Revision ID: 0003_discount_payment_updates
Revises: 0002_security_and_fk_indexes
Create Date: 2026-05-30
"""

from __future__ import annotations

import sqlalchemy as sa
from alembic import op

revision = "0003_discount_payment_updates"
down_revision = "0002_security_and_fk_indexes"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column(
        "pricing_rules",
        sa.Column("senior_discount_percent", sa.Integer(), nullable=False, server_default="50"),
    )
    op.add_column(
        "pricing_rules",
        sa.Column("student_discount_percent", sa.Integer(), nullable=False, server_default="50"),
    )
    op.add_column(
        "pricing_rules",
        sa.Column(
            "student_allowed_domains",
            sa.JSON(),
            nullable=False,
            server_default=sa.text('\'[".edu", ".edu.mx"]\''),
        ),
    )
    op.add_column(
        "pricing_rules",
        sa.Column(
            "senior_discount_applies_to_lost_ticket",
            sa.Boolean(),
            nullable=False,
            server_default=sa.false(),
        ),
    )
    op.add_column(
        "pricing_rules",
        sa.Column(
            "student_discount_applies_to_lost_ticket",
            sa.Boolean(),
            nullable=False,
            server_default=sa.false(),
        ),
    )

    op.add_column("payments", sa.Column("subtotal_amount", sa.Integer(), nullable=True))
    op.add_column(
        "payments",
        sa.Column("discount_type", sa.String(length=20), nullable=False, server_default="none"),
    )
    op.add_column(
        "payments",
        sa.Column("discount_percent", sa.Integer(), nullable=False, server_default="0"),
    )
    op.add_column(
        "payments",
        sa.Column("discount_amount", sa.Integer(), nullable=False, server_default="0"),
    )
    op.add_column(
        "payments",
        sa.Column("simulation_reference", sa.String(length=150), nullable=True),
    )
    op.add_column("payments", sa.Column("discount_evidence", sa.JSON(), nullable=True))

    op.execute("UPDATE payments SET subtotal_amount = amount WHERE subtotal_amount IS NULL")
    op.execute(
        "UPDATE payments SET simulation_reference = provider_reference "
        "WHERE simulation_reference IS NULL"
    )
    op.alter_column("payments", "subtotal_amount", nullable=False)


def downgrade() -> None:
    op.drop_column("payments", "discount_evidence")
    op.drop_column("payments", "simulation_reference")
    op.drop_column("payments", "discount_amount")
    op.drop_column("payments", "discount_percent")
    op.drop_column("payments", "discount_type")
    op.drop_column("payments", "subtotal_amount")

    op.drop_column("pricing_rules", "student_discount_applies_to_lost_ticket")
    op.drop_column("pricing_rules", "senior_discount_applies_to_lost_ticket")
    op.drop_column("pricing_rules", "student_allowed_domains")
    op.drop_column("pricing_rules", "student_discount_percent")
    op.drop_column("pricing_rules", "senior_discount_percent")

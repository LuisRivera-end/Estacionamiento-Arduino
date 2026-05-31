"""expand ticket code length

Revision ID: 0004_expand_ticket_code_length
Revises: 0003_discount_and_simulated_payment_updates
Create Date: 2026-05-30
"""

from __future__ import annotations

import sqlalchemy as sa
from alembic import op

revision = "0004_expand_ticket_code_length"
down_revision = "0003_discount_and_simulated_payment_updates"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.alter_column(
        "tickets",
        "code",
        existing_type=sa.String(length=5),
        type_=sa.String(length=6),
        existing_nullable=False,
    )


def downgrade() -> None:
    op.alter_column(
        "tickets",
        "code",
        existing_type=sa.String(length=6),
        type_=sa.String(length=5),
        existing_nullable=False,
    )

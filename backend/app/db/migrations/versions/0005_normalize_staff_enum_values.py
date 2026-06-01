"""normalize staff enum values

Revision ID: 0005_normalize_staff_enum_values
Revises: 0004_expand_ticket_code_length
Create Date: 2026-06-01
"""

from __future__ import annotations

from alembic import op

revision = "0005_normalize_staff_enum_values"
down_revision = "0004_expand_ticket_code_length"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.execute(
        """
        UPDATE staff_users
        SET role = lower(role)
        WHERE role IN ('ADMIN', 'PANELIST')
        """
    )
    op.execute(
        """
        UPDATE staff_users
        SET status = lower(status)
        WHERE status IN ('ACTIVE', 'DISABLED')
        """
    )


def downgrade() -> None:
    op.execute(
        """
        UPDATE staff_users
        SET role = upper(role)
        WHERE role IN ('admin', 'panelist')
        """
    )
    op.execute(
        """
        UPDATE staff_users
        SET status = upper(status)
        WHERE status IN ('active', 'disabled')
        """
    )

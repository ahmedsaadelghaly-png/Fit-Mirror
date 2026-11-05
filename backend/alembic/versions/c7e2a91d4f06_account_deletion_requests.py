"""users.deletion_requested_at for account deletion with a grace period

Revision ID: c7e2a91d4f06
Revises: b3d9f7a20c15
Create Date: 2026-11-06 00:00:00.000000

"""

from collections.abc import Sequence

import sqlalchemy as sa

from alembic import op

revision: str = "c7e2a91d4f06"
down_revision: str | None = "b3d9f7a20c15"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    op.add_column(
        "users", sa.Column("deletion_requested_at", sa.DateTime(timezone=True), nullable=True)
    )


def downgrade() -> None:
    op.drop_column("users", "deletion_requested_at")

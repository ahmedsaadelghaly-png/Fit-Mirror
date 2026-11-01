"""add stores.is_suspended

Revision ID: b7e15f0c9a24
Revises: a3c9d2e41b07
Create Date: 2026-11-01 19:00:00.000000

"""

from collections.abc import Sequence

import sqlalchemy as sa
from alembic import op

revision: str = "b7e15f0c9a24"
down_revision: str | None = "a3c9d2e41b07"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    op.add_column(
        "stores",
        sa.Column("is_suspended", sa.Boolean(), server_default=sa.false(), nullable=False),
    )


def downgrade() -> None:
    op.drop_column("stores", "is_suspended")

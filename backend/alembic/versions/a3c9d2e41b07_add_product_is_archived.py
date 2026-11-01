"""add products.is_archived

Revision ID: a3c9d2e41b07
Revises: 7e46b1f0c366
Create Date: 2026-11-01 18:40:00.000000

"""

from collections.abc import Sequence

import sqlalchemy as sa
from alembic import op

revision: str = "a3c9d2e41b07"
down_revision: str | None = "7e46b1f0c366"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    op.add_column(
        "products",
        sa.Column("is_archived", sa.Boolean(), server_default=sa.false(), nullable=False),
    )


def downgrade() -> None:
    op.drop_column("products", "is_archived")

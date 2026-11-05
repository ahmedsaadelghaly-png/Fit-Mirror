"""tryon_jobs.garment_category for garments a shopper uploads

Revision ID: d4f8b13e7a52
Revises: c7e2a91d4f06
Create Date: 2026-11-06 01:30:00.000000

"""

from collections.abc import Sequence

import sqlalchemy as sa

from alembic import op

revision: str = "d4f8b13e7a52"
down_revision: str | None = "c7e2a91d4f06"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    op.add_column("tryon_jobs", sa.Column("garment_category", sa.String(20), nullable=True))


def downgrade() -> None:
    op.drop_column("tryon_jobs", "garment_category")

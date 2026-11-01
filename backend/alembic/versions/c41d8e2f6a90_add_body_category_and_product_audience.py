"""add body_profiles.body_category and products.audience

Revision ID: c41d8e2f6a90
Revises: b7e15f0c9a24
Create Date: 2026-11-01 20:00:00.000000

"""

from collections.abc import Sequence

import sqlalchemy as sa
from alembic import op

revision: str = "c41d8e2f6a90"
down_revision: str | None = "b7e15f0c9a24"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None

# SQLAlchemy persists Python enums by member *name*, matching the existing
# user_role / tryon_job_status types.
body_category = sa.Enum("WOMEN", "MEN", "GIRLS", "BOYS", name="body_category")
product_audience = sa.Enum("WOMEN", "MEN", "GIRLS", "BOYS", "UNISEX", name="product_audience")


def upgrade() -> None:
    bind = op.get_bind()
    body_category.create(bind, checkfirst=True)
    product_audience.create(bind, checkfirst=True)

    op.add_column("body_profiles", sa.Column("body_category", body_category, nullable=True))
    op.add_column(
        "products",
        sa.Column("audience", product_audience, server_default="UNISEX", nullable=False),
    )
    op.create_index(op.f("ix_products_audience"), "products", ["audience"], unique=False)


def downgrade() -> None:
    op.drop_index(op.f("ix_products_audience"), table_name="products")
    op.drop_column("products", "audience")
    op.drop_column("body_profiles", "body_category")

    bind = op.get_bind()
    product_audience.drop(bind, checkfirst=True)
    body_category.drop(bind, checkfirst=True)

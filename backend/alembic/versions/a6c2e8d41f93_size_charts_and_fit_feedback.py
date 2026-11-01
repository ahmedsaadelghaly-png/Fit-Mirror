"""per-brand size charts and shopper fit feedback

Revision ID: a6c2e8d41f93
Revises: f3a7d61c8b29
Create Date: 2026-11-02 09:00:00.000000

"""

from collections.abc import Sequence

import sqlalchemy as sa
from alembic import op
from sqlalchemy.dialects import postgresql

revision: str = "a6c2e8d41f93"
down_revision: str | None = "f3a7d61c8b29"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None

# Enum values are stored by member NAME (see the other enums in this schema).
fit_verdict = postgresql.ENUM("SMALL", "TRUE_TO_SIZE", "LARGE", name="fit_verdict", create_type=False)


def upgrade() -> None:
    fit_verdict.create(op.get_bind(), checkfirst=True)

    op.create_table(
        "size_charts",
        sa.Column("id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("store_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("category", sa.String(length=50), nullable=False),
        sa.Column("rows", sa.JSON(), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False),
        sa.ForeignKeyConstraint(["store_id"], ["stores.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("store_id", "category", name="uq_size_charts_store_cat"),
    )
    op.create_index("ix_size_charts_store_id", "size_charts", ["store_id"])

    op.create_table(
        "fit_feedback",
        sa.Column("id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("user_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("product_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("size_label", sa.String(length=50), nullable=False),
        sa.Column("fit", fit_verdict, nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["product_id"], ["products.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("user_id", "product_id", name="uq_fit_feedback_user_prod"),
    )
    op.create_index("ix_fit_feedback_product_id", "fit_feedback", ["product_id"])


def downgrade() -> None:
    op.drop_index("ix_fit_feedback_product_id", table_name="fit_feedback")
    op.drop_table("fit_feedback")
    op.drop_index("ix_size_charts_store_id", table_name="size_charts")
    op.drop_table("size_charts")
    fit_verdict.drop(op.get_bind(), checkfirst=True)

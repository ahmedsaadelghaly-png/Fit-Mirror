"""outfit suggestions and stylist feedback

Revision ID: b3d9f7a20c15
Revises: a6c2e8d41f93
Create Date: 2026-11-02 11:00:00.000000

"""

from collections.abc import Sequence

import sqlalchemy as sa
from alembic import op
from sqlalchemy.dialects import postgresql

revision: str = "b3d9f7a20c15"
down_revision: str | None = "a6c2e8d41f93"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    op.create_table(
        "outfit_suggestions",
        sa.Column("id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("user_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("item_ids", sa.JSON(), nullable=False),
        sa.Column("item_texts", sa.JSON(), nullable=False),
        sa.Column("occasion", sa.String(length=200), nullable=True),
        sa.Column("weather", sa.String(length=200), nullable=True),
        sa.Column("liked", sa.Boolean(), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_outfit_suggestions_user_id", "outfit_suggestions", ["user_id"])


def downgrade() -> None:
    op.drop_index("ix_outfit_suggestions_user_id", table_name="outfit_suggestions")
    op.drop_table("outfit_suggestions")

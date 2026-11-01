"""saved_looks table, body profile style preferences, store business info

Revision ID: d8a4f1c27e53
Revises: c41d8e2f6a90
Create Date: 2026-11-01 21:00:00.000000

"""

from collections.abc import Sequence

import sqlalchemy as sa
from alembic import op
from sqlalchemy.dialects import postgresql

revision: str = "d8a4f1c27e53"
down_revision: str | None = "c41d8e2f6a90"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    op.create_table(
        "saved_looks",
        sa.Column("id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("user_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("tryon_job_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("label", sa.String(length=255), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["tryon_job_id"], ["tryon_jobs.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("user_id", "tryon_job_id", name="uq_saved_looks_user_job"),
    )
    op.create_index("ix_saved_looks_user_id", "saved_looks", ["user_id"])

    op.add_column("body_profiles", sa.Column("preferred_fit", sa.String(20), nullable=True))
    op.add_column(
        "body_profiles",
        sa.Column("favorite_colors", sa.JSON(), server_default="[]", nullable=False),
    )
    op.add_column(
        "body_profiles",
        sa.Column("style_preferences", sa.JSON(), server_default="[]", nullable=False),
    )

    op.add_column("stores", sa.Column("category", sa.String(50), nullable=True))
    op.add_column("stores", sa.Column("description", sa.Text(), nullable=True))
    op.add_column("stores", sa.Column("website_url", sa.String(512), nullable=True))
    op.add_column("stores", sa.Column("instagram_handle", sa.String(100), nullable=True))
    op.add_column("stores", sa.Column("tiktok_handle", sa.String(100), nullable=True))


def downgrade() -> None:
    for column in ("tiktok_handle", "instagram_handle", "website_url", "description", "category"):
        op.drop_column("stores", column)
    for column in ("style_preferences", "favorite_colors", "preferred_fit"):
        op.drop_column("body_profiles", column)
    op.drop_index("ix_saved_looks_user_id", table_name="saved_looks")
    op.drop_table("saved_looks")

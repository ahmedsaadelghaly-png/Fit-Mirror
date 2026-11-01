"""family profiles: several body profiles per account, one primary

Revision ID: e5b2c9a10f47
Revises: d8a4f1c27e53
Create Date: 2026-11-02 00:00:00.000000

"""

from collections.abc import Sequence

import sqlalchemy as sa
from alembic import op

revision: str = "e5b2c9a10f47"
down_revision: str | None = "d8a4f1c27e53"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    op.drop_constraint("body_profiles_user_id_key", "body_profiles", type_="unique")
    op.create_index("ix_body_profiles_user_id", "body_profiles", ["user_id"])
    op.add_column(
        "body_profiles",
        sa.Column("name", sa.String(100), server_default="Me", nullable=False),
    )
    op.add_column(
        "body_profiles",
        sa.Column("is_primary", sa.Boolean(), server_default=sa.false(), nullable=False),
    )
    # Every existing profile was its account's only one.
    op.execute("UPDATE body_profiles SET is_primary = true")
    op.create_index(
        "uq_body_profiles_one_primary",
        "body_profiles",
        ["user_id"],
        unique=True,
        postgresql_where=sa.text("is_primary"),
    )


def downgrade() -> None:
    op.execute("DELETE FROM body_profiles WHERE NOT is_primary")
    op.drop_index("uq_body_profiles_one_primary", table_name="body_profiles")
    op.drop_column("body_profiles", "is_primary")
    op.drop_column("body_profiles", "name")
    op.drop_index("ix_body_profiles_user_id", table_name="body_profiles")
    op.create_unique_constraint("body_profiles_user_id_key", "body_profiles", ["user_id"])

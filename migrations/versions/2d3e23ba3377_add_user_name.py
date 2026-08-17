"""add user name

Revision ID: 2d3e23ba3377
Revises: 0873983c2df2
Create Date: 2026-08-11 16:39:15.189023

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = "2d3e23ba3377"
down_revision = "0873983c2df2"
branch_labels = None
depends_on = None


def _table_exists(inspector, table_name):
    return table_name in inspector.get_table_names()


def _column_exists(inspector, table_name, column_name):
    return any(
        column["name"] == column_name
        for column in inspector.get_columns(table_name)
    )


def upgrade():
    bind = op.get_bind()
    inspector = sa.inspect(bind)

    # ---------------------------------------------------------------
    # USER TOOL
    # ---------------------------------------------------------------
    if not _table_exists(inspector, "user_tool"):
        op.create_table(
            "user_tool",
            sa.Column("id", sa.Integer(), nullable=False),
            sa.Column("user_id", sa.Integer(), nullable=False),
            sa.Column("name", sa.String(length=200), nullable=False),
            sa.Column("category", sa.String(length=100), nullable=True),
            sa.Column("brand", sa.String(length=100), nullable=True),
            sa.Column("model", sa.String(length=100), nullable=True),
            sa.Column("status", sa.String(length=50), nullable=False),
            sa.Column("photo_url", sa.String(length=500), nullable=True),
            sa.Column("date_added", sa.DateTime(), nullable=False),
            sa.Column("last_used", sa.DateTime(), nullable=True),
            sa.Column("project_count", sa.Integer(), nullable=False),
            sa.Column("notes", sa.Text(), nullable=True),
            sa.ForeignKeyConstraint(["user_id"], ["user.id"]),
            sa.PrimaryKeyConstraint("id"),
        )

    # ---------------------------------------------------------------
    # PROJECT ITEM
    # ---------------------------------------------------------------
    if not _table_exists(inspector, "project_item"):
        op.create_table(
            "project_item",
            sa.Column("id", sa.Integer(), nullable=False),
            sa.Column("project_id", sa.Integer(), nullable=False),
            sa.Column("name", sa.String(length=200), nullable=False),
            sa.Column("reference", sa.String(length=100), nullable=True),
            sa.Column("quantity_total", sa.Integer(), nullable=False),
            sa.Column("quantity_used", sa.Integer(), nullable=False),
            sa.Column("status", sa.String(length=50), nullable=False),
            sa.Column("created_at", sa.DateTime(), nullable=False),
            sa.ForeignKeyConstraint(["project_id"], ["project.id"]),
            sa.PrimaryKeyConstraint("id"),
        )

    # ---------------------------------------------------------------
    # PROJECT TOOL
    # ---------------------------------------------------------------
    if not _table_exists(inspector, "project_tool"):
        op.create_table(
            "project_tool",
            sa.Column("id", sa.Integer(), nullable=False),
            sa.Column("project_id", sa.Integer(), nullable=False),
            sa.Column("user_tool_id", sa.Integer(), nullable=False),
            sa.Column("created_at", sa.DateTime(), nullable=False),
            sa.ForeignKeyConstraint(["project_id"], ["project.id"]),
            sa.ForeignKeyConstraint(["user_tool_id"], ["user_tool.id"]),
            sa.PrimaryKeyConstraint("id"),
        )

    # ---------------------------------------------------------------
    # PROJECT TRANSFORMATION
    # ---------------------------------------------------------------
    if not _table_exists(inspector, "project_transformation"):
        op.create_table(
            "project_transformation",
            sa.Column("id", sa.Integer(), nullable=False),
            sa.Column("project_id", sa.Integer(), nullable=False),
            sa.Column("from_type", sa.String(length=100), nullable=True),
            sa.Column("to_type", sa.String(length=100), nullable=True),
            sa.Column("description", sa.Text(), nullable=True),
            sa.Column("created_at", sa.DateTime(), nullable=False),
            sa.ForeignKeyConstraint(["project_id"], ["project.id"]),
            sa.PrimaryKeyConstraint("id"),
        )

    # ---------------------------------------------------------------
    # PROJECT COLUMNS
    # ---------------------------------------------------------------
    if not _column_exists(inspector, "project", "progress"):
        op.add_column(
            "project",
            sa.Column(
                "progress",
                sa.Integer(),
                nullable=False,
                server_default=sa.text("0"),
            ),
        )

    if not _column_exists(inspector, "project", "time_invested"):
        op.add_column(
            "project",
            sa.Column(
                "time_invested",
                sa.Integer(),
                nullable=False,
                server_default=sa.text("0"),
            ),
        )

    # ---------------------------------------------------------------
    # PROJECT NOTE
    # ---------------------------------------------------------------
    if not _table_exists(inspector, "project_note"):
        op.create_table(
            "project_note",
            sa.Column("id", sa.Integer(), nullable=False),
            sa.Column("project_id", sa.Integer(), nullable=False),
            sa.Column("content", sa.Text(), nullable=False),
            sa.Column("created_at", sa.DateTime(), nullable=False),
            sa.ForeignKeyConstraint(["project_id"], ["project.id"]),
            sa.PrimaryKeyConstraint("id"),
        )

    # ---------------------------------------------------------------
    # PROJECT PHOTO
    # ---------------------------------------------------------------
    if not _table_exists(inspector, "project_photo"):
        op.create_table(
            "project_photo",
            sa.Column("id", sa.Integer(), nullable=False),
            sa.Column("project_id", sa.Integer(), nullable=False),
            sa.Column("url", sa.String(length=500), nullable=False),
            sa.Column("caption", sa.String(length=300), nullable=True),
            sa.Column("created_at", sa.DateTime(), nullable=False),
            sa.ForeignKeyConstraint(["project_id"], ["project.id"]),
            sa.PrimaryKeyConstraint("id"),
        )

    # ---------------------------------------------------------------
    # PROJECT TIMELINE
    # ---------------------------------------------------------------
    if not _table_exists(inspector, "project_timeline"):
        op.create_table(
            "project_timeline",
            sa.Column("id", sa.Integer(), nullable=False),
            sa.Column("project_id", sa.Integer(), nullable=False),
            sa.Column("evento", sa.String(length=300), nullable=False),
            sa.Column("tipo", sa.String(length=50), nullable=False),
            sa.Column("created_at", sa.DateTime(), nullable=False),
            sa.ForeignKeyConstraint(["project_id"], ["project.id"]),
            sa.PrimaryKeyConstraint("id"),
        )

    # ---------------------------------------------------------------
    # USER.NAME
    # ---------------------------------------------------------------
    if not _column_exists(inspector, "user", "name"):
        op.add_column(
            "user",
            sa.Column(
                "name",
                sa.String(length=100),
                nullable=True,
            ),
        )


def downgrade():
    bind = op.get_bind()
    inspector = sa.inspect(bind)

    if _table_exists(inspector, "project_timeline"):
        op.drop_table("project_timeline")

    if _table_exists(inspector, "project_photo"):
        op.drop_table("project_photo")

    if _table_exists(inspector, "project_note"):
        op.drop_table("project_note")

    if _table_exists(inspector, "project_transformation"):
        op.drop_table("project_transformation")

    if _table_exists(inspector, "project_tool"):
        op.drop_table("project_tool")

    if _table_exists(inspector, "project_item"):
        op.drop_table("project_item")

    if _table_exists(inspector, "user_tool"):
        op.drop_table("user_tool")

    if _column_exists(inspector, "project", "time_invested"):
        op.drop_column("project", "time_invested")

    if _column_exists(inspector, "project", "progress"):
        op.drop_column("project", "progress")

    if _column_exists(inspector, "user", "name"):
        op.drop_column("user", "name")

"""add user profile

Revision ID: 0873983c2df2
Revises: c2cf896c2a39
Create Date: 2026-08-07

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = '0873983c2df2'
down_revision = 'c2cf896c2a39'
branch_labels = None
depends_on = None


def upgrade():
    # añado metadata si no existe — en mac de gene la columna puede no estar
    conn = op.get_bind()
    result = conn.execute(sa.text("SELECT column_name FROM information_schema.columns WHERE table_name='project' AND column_name='metadata'"))
    if not result.fetchone():
        op.add_column('project', sa.Column('metadata', sa.JSON(), nullable=True))

    op.create_table('user_profile',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('user_id', sa.Integer(), sa.ForeignKey('user.id'), nullable=False),
        sa.Column('experience_level', sa.String(50), nullable=True),
        sa.Column('home_type', sa.String(50), nullable=True),
        sa.Column('wall_types', sa.JSON(), nullable=True),
        sa.Column('tools_available', sa.JSON(), nullable=True),
        sa.Column('interests', sa.JSON(), nullable=True),
        sa.Column('help_style', sa.String(50), nullable=True),
        sa.Column('sector', sa.String(100), nullable=True),
        sa.Column('team_size', sa.String(50), nullable=True),
        sa.Column('created_at', sa.DateTime(), nullable=False),
        sa.Column('updated_at', sa.DateTime(), nullable=False),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('user_id')
    )


def downgrade():
    op.drop_table('user_profile')
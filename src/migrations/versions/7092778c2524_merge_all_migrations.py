"""merge all migrations

Revision ID: 7092778c2524
Revises: 26ed0774b149, 2d3e23ba3377
Create Date: 2026-08-19 17:38:17.244339

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = '7092778c2524'
down_revision = ('26ed0774b149', '2d3e23ba3377')
branch_labels = None
depends_on = None


def upgrade():
    pass


def downgrade():
    pass

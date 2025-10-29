"""Add score_category to sessions

Revision ID: 005_add_score_category
Revises: 004_update_turn_model
Create Date: 2025-10-15

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = '005_add_score_category'
down_revision = '004_update_turn_model'
branch_labels = None
depends_on = None


def upgrade():
    # Add score_category column to sessions table
    op.add_column('sessions', sa.Column('score_category', sa.String(50), nullable=True))


def downgrade():
    # Remove score_category column from sessions table
    op.drop_column('sessions', 'score_category')

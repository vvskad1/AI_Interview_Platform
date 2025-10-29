"""Add missing candidate fields

Revision ID: 002_add_missing_candidate_fields
Revises: 001_initial
Create Date: 2025-01-10 10:00:00.000000

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision = '002_add_missing_candidate_fields'
down_revision = '001_initial'
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Add only the missing columns (phone already exists)
    op.add_column('candidates', sa.Column('location', sa.String(length=200), nullable=True))
    op.add_column('candidates', sa.Column('experience_years', sa.Integer(), nullable=True))
    op.add_column('candidates', sa.Column('skills', postgresql.JSON(astext_type=sa.Text()), nullable=True))
    op.add_column('candidates', sa.Column('resume_url', sa.String(length=500), nullable=True))
    op.add_column('candidates', sa.Column('status', sa.String(length=50), nullable=True, server_default='active'))


def downgrade() -> None:
    # Remove the added columns
    op.drop_column('candidates', 'status')
    op.drop_column('candidates', 'resume_url') 
    op.drop_column('candidates', 'skills')
    op.drop_column('candidates', 'experience_years')
    op.drop_column('candidates', 'location')
"""Add missing job management fields

Revision ID: 003_add_missing_job_fields
Revises: 002_add_missing_candidate_fields
Create Date: 2025-01-10 10:45:00.000000

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision = '003_add_missing_job_fields'
down_revision = '002_add_missing_candidate_fields'
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Add only the missing job management fields that don't exist yet
    op.add_column('jobs', sa.Column('level', sa.String(length=100), nullable=True))
    op.add_column('jobs', sa.Column('department', sa.String(length=100), nullable=True))
    op.add_column('jobs', sa.Column('status', sa.String(length=50), nullable=True, server_default='active'))
    op.add_column('jobs', sa.Column('location', sa.String(length=200), nullable=True))
    op.add_column('jobs', sa.Column('salary_range', sa.String(length=100), nullable=True))
    op.add_column('jobs', sa.Column('employment_type', sa.String(length=50), nullable=True, server_default='full-time'))
    op.add_column('jobs', sa.Column('remote_allowed', sa.Boolean(), nullable=True, server_default='false'))


def downgrade() -> None:
    # Remove the added job management fields
    op.drop_column('jobs', 'remote_allowed')
    op.drop_column('jobs', 'employment_type')
    op.drop_column('jobs', 'salary_range')
    op.drop_column('jobs', 'location')
    op.drop_column('jobs', 'status')
    op.drop_column('jobs', 'department')
    op.drop_column('jobs', 'level')
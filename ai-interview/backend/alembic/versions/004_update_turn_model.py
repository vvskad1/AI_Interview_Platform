"""Add missing Turn model fields

Revision ID: 004_update_turn_model
Revises: 003_add_missing_job_fields
Create Date: 2025-01-14 04:10:00.000000

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision = '004_update_turn_model'
down_revision = '003_add_missing_job_fields'
branch_labels = None
depends_on = None


def upgrade():
    # Add missing columns to turns table
    op.add_column('turns', sa.Column('prompt', sa.Text(), nullable=True))
    op.add_column('turns', sa.Column('deadline', sa.DateTime(timezone=True), nullable=True))
    op.add_column('turns', sa.Column('start_time', sa.DateTime(timezone=True), nullable=True))
    op.add_column('turns', sa.Column('submitted_at', sa.DateTime(timezone=True), nullable=True))
    op.add_column('turns', sa.Column('status', sa.String(20), nullable=True))
    op.add_column('turns', sa.Column('answer_text', sa.Text(), nullable=True))
    op.add_column('turns', sa.Column('audio_url', sa.String(255), nullable=True))
    op.add_column('turns', sa.Column('scores_json', postgresql.JSON(astext_type=sa.Text()), nullable=True))
    op.add_column('turns', sa.Column('followup_reason', sa.Text(), nullable=True))
    op.add_column('turns', sa.Column('idx', sa.Integer(), nullable=True))
    
    # Set idx to match question_number for existing records
    op.execute("UPDATE turns SET idx = question_number WHERE idx IS NULL")
    
    # Set prompt to match question_text for existing records  
    op.execute("UPDATE turns SET prompt = question_text WHERE prompt IS NULL")
    
    # Set default status for existing records
    op.execute("UPDATE turns SET status = 'NOT_STARTED' WHERE status IS NULL")


def downgrade():
    # Remove added columns
    op.drop_column('turns', 'followup_reason')
    op.drop_column('turns', 'scores_json')
    op.drop_column('turns', 'audio_url')
    op.drop_column('turns', 'answer_text')
    op.drop_column('turns', 'status')
    op.drop_column('turns', 'submitted_at')
    op.drop_column('turns', 'start_time')
    op.drop_column('turns', 'deadline')
    op.drop_column('turns', 'prompt')
    op.drop_column('turns', 'idx')
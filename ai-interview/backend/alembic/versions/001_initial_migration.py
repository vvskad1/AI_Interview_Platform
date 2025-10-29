"""Initial migration - create all tables

Revision ID: 001_initial
Revises: 
Create Date: 2025-10-10 12:00:00.000000

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision = '001_initial'
down_revision = None
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Create candidates table
    op.create_table('candidates',
    sa.Column('id', sa.Integer(), nullable=False),
    sa.Column('email', sa.String(length=255), nullable=False),
    sa.Column('name', sa.String(length=255), nullable=True),
    sa.Column('phone', sa.String(length=20), nullable=True),
    sa.Column('created_at', sa.DateTime(), nullable=True),
    sa.Column('updated_at', sa.DateTime(), nullable=True),
    sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_candidates_email'), 'candidates', ['email'], unique=True)
    op.create_index(op.f('ix_candidates_id'), 'candidates', ['id'], unique=False)

    # Create jobs table
    op.create_table('jobs',
    sa.Column('id', sa.Integer(), nullable=False),
    sa.Column('title', sa.String(length=255), nullable=False),
    sa.Column('description', sa.Text(), nullable=True),
    sa.Column('requirements', postgresql.JSON(astext_type=sa.Text()), nullable=True),
    sa.Column('duration_minutes', sa.Integer(), nullable=True),
    sa.Column('questions_count', sa.Integer(), nullable=True),
    sa.Column('is_active', sa.Boolean(), nullable=True),
    sa.Column('created_at', sa.DateTime(), nullable=True),
    sa.Column('updated_at', sa.DateTime(), nullable=True),
    sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_jobs_id'), 'jobs', ['id'], unique=False)
    op.create_index(op.f('ix_jobs_title'), 'jobs', ['title'], unique=False)

    # Create invites table
    op.create_table('invites',
    sa.Column('id', sa.Integer(), nullable=False),
    sa.Column('candidate_id', sa.Integer(), nullable=False),
    sa.Column('job_id', sa.Integer(), nullable=False),
    sa.Column('invite_code', sa.String(length=50), nullable=False),
    sa.Column('status', sa.String(length=20), nullable=True),
    sa.Column('expires_at', sa.DateTime(), nullable=True),
    sa.Column('created_at', sa.DateTime(), nullable=True),
    sa.Column('updated_at', sa.DateTime(), nullable=True),
    sa.ForeignKeyConstraint(['candidate_id'], ['candidates.id'], ),
    sa.ForeignKeyConstraint(['job_id'], ['jobs.id'], ),
    sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_invites_id'), 'invites', ['id'], unique=False)
    op.create_index(op.f('ix_invites_invite_code'), 'invites', ['invite_code'], unique=True)

    # Create sessions table
    op.create_table('sessions',
    sa.Column('id', sa.Integer(), nullable=False),
    sa.Column('invite_id', sa.Integer(), nullable=False),
    sa.Column('session_token', sa.String(length=255), nullable=False),
    sa.Column('status', sa.String(length=20), nullable=True),
    sa.Column('started_at', sa.DateTime(), nullable=True),
    sa.Column('ended_at', sa.DateTime(), nullable=True),
    sa.Column('score', sa.Float(), nullable=True),
    sa.Column('metadata', postgresql.JSON(astext_type=sa.Text()), nullable=True),
    sa.Column('created_at', sa.DateTime(), nullable=True),
    sa.Column('updated_at', sa.DateTime(), nullable=True),
    sa.ForeignKeyConstraint(['invite_id'], ['invites.id'], ),
    sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_sessions_id'), 'sessions', ['id'], unique=False)
    op.create_index(op.f('ix_sessions_session_token'), 'sessions', ['session_token'], unique=True)

    # Create turns table
    op.create_table('turns',
    sa.Column('id', sa.Integer(), nullable=False),
    sa.Column('session_id', sa.Integer(), nullable=False),
    sa.Column('question_number', sa.Integer(), nullable=False),
    sa.Column('question_text', sa.Text(), nullable=False),
    sa.Column('audio_transcript', sa.Text(), nullable=True),
    sa.Column('ai_evaluation', postgresql.JSON(astext_type=sa.Text()), nullable=True),
    sa.Column('turn_score', sa.Float(), nullable=True),
    sa.Column('started_at', sa.DateTime(), nullable=True),
    sa.Column('ended_at', sa.DateTime(), nullable=True),
    sa.Column('created_at', sa.DateTime(), nullable=True),
    sa.Column('updated_at', sa.DateTime(), nullable=True),
    sa.ForeignKeyConstraint(['session_id'], ['sessions.id'], ),
    sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_turns_id'), 'turns', ['id'], unique=False)

    # Create proctor_events table
    op.create_table('proctor_events',
    sa.Column('id', sa.Integer(), nullable=False),
    sa.Column('session_id', sa.Integer(), nullable=False),
    sa.Column('event_type', sa.String(length=50), nullable=False),
    sa.Column('event_data', postgresql.JSON(astext_type=sa.Text()), nullable=True),
    sa.Column('severity', sa.String(length=20), nullable=True),
    sa.Column('timestamp', sa.DateTime(), nullable=True),
    sa.Column('created_at', sa.DateTime(), nullable=True),
    sa.ForeignKeyConstraint(['session_id'], ['sessions.id'], ),
    sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_proctor_events_id'), 'proctor_events', ['id'], unique=False)


def downgrade() -> None:
    # Drop tables in reverse order
    op.drop_table('proctor_events')
    op.drop_table('turns')
    op.drop_table('sessions')
    op.drop_table('invites')
    op.drop_table('jobs')
    op.drop_table('candidates')
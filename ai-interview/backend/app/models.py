from sqlalchemy import Column, Integer, String, DateTime, Text, Boolean, Float, ForeignKey, Index, JSON
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from .database import Base
import enum


class InviteStatus(enum.Enum):
    PENDING = "pending"
    USED = "used"
    EXPIRED = "expired"


class SessionStatus(enum.Enum):
    STARTED = "started"
    COMPLETED = "completed"
    ABANDONED = "abandoned"


class TurnStatus(enum.Enum):
    NOT_STARTED = "not_started"
    PENDING = "pending"
    ONTIME = "ontime"
    LATE = "late"
    TIMEOUT = "timeout"


class Candidate(Base):
    __tablename__ = "candidates"
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(255), nullable=False)
    email = Column(String(255), nullable=False, unique=True, index=True)
    phone = Column(String(20), nullable=True)
    location = Column(String(255), nullable=True)
    experience_years = Column(Integer, nullable=True)
    skills = Column(JSON, nullable=True)  # Array of skills
    resume_url = Column(String(500), nullable=True)
    resume_text = Column(Text, nullable=True)  # Full resume content for RAG processing
    status = Column(String(20), default="active")  # active, inactive, hired, rejected
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
    
    # Relationships
    invites = relationship("Invite", back_populates="candidate")


class Job(Base):
    __tablename__ = "jobs"
    
    id = Column(Integer, primary_key=True, index=True)
    title = Column(String(255), nullable=False)
    description = Column(Text, nullable=False)  # Map to jd_text for compatibility
    requirements = Column(JSON, nullable=True)
    duration_minutes = Column(Integer, nullable=True)
    questions_count = Column(Integer, nullable=True)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
    
    # Additional fields for Jobs Management (these might not exist in DB yet)
    level = Column(String(100), nullable=True)
    department = Column(String(100), nullable=True)
    status = Column(String(50), nullable=True, default="active")
    location = Column(String(200), nullable=True)
    salary_range = Column(String(100), nullable=True)
    employment_type = Column(String(50), nullable=True, default="full-time")
    remote_allowed = Column(Boolean, nullable=True, default=False)
    
    # Relationships
    invites = relationship("Invite", back_populates="job")
    
    # Property for backward compatibility
    @property
    def jd_text(self):
        return self.description
    
    @jd_text.setter
    def jd_text(self, value):
        self.description = value


class Invite(Base):
    __tablename__ = "invites"
    
    id = Column(Integer, primary_key=True, index=True)
    candidate_id = Column(Integer, ForeignKey("candidates.id"), nullable=False)
    job_id = Column(Integer, ForeignKey("jobs.id"), nullable=False)
    invite_code = Column(String(255), nullable=False)
    status = Column(String(20), default=InviteStatus.PENDING.value)
    expires_at = Column(DateTime(timezone=True), nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
    
    # Relationships
    candidate = relationship("Candidate", back_populates="invites")
    job = relationship("Job", back_populates="invites")
    sessions = relationship("Session", back_populates="invite")


class Session(Base):
    __tablename__ = "sessions"
    
    id = Column(Integer, primary_key=True, index=True)
    invite_id = Column(Integer, ForeignKey("invites.id"), nullable=False)
    started_at = Column(DateTime(timezone=True), server_default=func.now())
    ended_at = Column(DateTime(timezone=True), nullable=True)
    session_token = Column(String(255), nullable=False, unique=True)
    status = Column(String(20), default=SessionStatus.STARTED.value)
    score = Column(Float, nullable=True)
    score_category = Column(String(50), nullable=True)  # Best Fit, Good Fit, Average, Needs Improvement, Not Recommended
    session_metadata = Column("metadata", JSON, nullable=True)
    
    # Relationships
    invite = relationship("Invite", back_populates="sessions")
    turns = relationship("Turn", back_populates="session", order_by="Turn.question_number")
    proctor_events = relationship("ProctorEvent", back_populates="session")


class Turn(Base):
    __tablename__ = "turns"
    
    id = Column(Integer, primary_key=True, index=True)
    session_id = Column(Integer, ForeignKey("sessions.id"), nullable=False)
    question_number = Column(Integer, nullable=False)
    question_text = Column(Text, nullable=False)
    audio_transcript = Column(Text, nullable=True)
    ai_evaluation = Column(JSON, nullable=True)
    turn_score = Column(Float, nullable=True)
    started_at = Column(DateTime(timezone=True), nullable=True)
    ended_at = Column(DateTime(timezone=True), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
    
    # Additional fields for session management
    idx = Column(Integer, nullable=True)
    prompt = Column(Text, nullable=True)
    deadline = Column(DateTime(timezone=True), nullable=True)
    start_time = Column(DateTime(timezone=True), nullable=True)
    submitted_at = Column(DateTime(timezone=True), nullable=True)
    status = Column(String(20), nullable=True)
    answer_text = Column(Text, nullable=True)
    audio_url = Column(String(255), nullable=True)
    scores_json = Column(JSON, nullable=True)
    followup_reason = Column(Text, nullable=True)
    
    # Relationships
    session = relationship("Session", back_populates="turns")


class ProctorEvent(Base):
    __tablename__ = "proctor_events"
    
    id = Column(Integer, primary_key=True, index=True)
    session_id = Column(Integer, ForeignKey("sessions.id"), nullable=False)
    event_type = Column(String(50), nullable=False)
    event_data = Column(JSON, nullable=True)
    severity = Column(String(20), nullable=True)
    timestamp = Column(DateTime(timezone=True), server_default=func.now())
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    # Relationships
    session = relationship("Session", back_populates="proctor_events")
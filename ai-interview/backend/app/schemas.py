from pydantic import BaseModel, EmailStr, ConfigDict
from typing import Optional, List, Dict, Any, Union
from datetime import datetime
import enum


class InviteStatus(str, enum.Enum):
    PENDING = "pending"
    USED = "used"
    EXPIRED = "expired"


class SessionStatus(str, enum.Enum):
    STARTED = "started"
    COMPLETED = "completed"
    ABANDONED = "abandoned"


class TurnStatus(str, enum.Enum):
    PENDING = "pending"
    ONTIME = "ontime"
    LATE = "late"
    TIMEOUT = "timeout"


# Base schemas
class CandidateBase(BaseModel):
    name: str
    email: EmailStr


class CandidateCreate(CandidateBase):
    pass


class Candidate(CandidateBase):
    id: int
    created_at: datetime
    
    model_config = ConfigDict(from_attributes=True)


class JobBase(BaseModel):
    title: str
    level: str
    department: str
    jd_text: str


class JobCreate(JobBase):
    pass


class Job(JobBase):
    id: int
    created_at: datetime
    
    model_config = ConfigDict(from_attributes=True)


class InviteBase(BaseModel):
    candidate_id: int
    job_id: int
    strict_mode: bool = False
    window_start: datetime
    window_end: datetime


class InviteCreate(InviteBase):
    pass


class Invite(InviteBase):
    id: int
    token_id: str
    status: InviteStatus
    created_at: datetime
    
    model_config = ConfigDict(from_attributes=True)


class SessionBase(BaseModel):
    invite_id: int


class SessionCreate(SessionBase):
    pass


class Session(SessionBase):
    id: int
    started_at: datetime
    ended_at: Optional[datetime] = None
    status: SessionStatus
    proctor_risk: float = 0.0
    overall_score: Optional[float] = None
    
    model_config = ConfigDict(from_attributes=True)


class TurnBase(BaseModel):
    session_id: int
    idx: int
    prompt: str


class TurnCreate(TurnBase):
    start_time: datetime
    deadline: datetime


class Turn(TurnBase):
    id: int
    answer_text: Optional[str] = None
    audio_url: Optional[str] = None
    scores_json: Optional[Dict[str, Any]] = None
    followup_reason: Optional[str] = None
    start_time: datetime
    deadline: datetime
    submitted_at: Optional[datetime] = None
    status: TurnStatus
    
    model_config = ConfigDict(from_attributes=True)


class ProctorEventBase(BaseModel):
    session_id: int
    type: str
    payload_json: Optional[Dict[str, Any]] = None


class ProctorEventCreate(ProctorEventBase):
    pass


class ProctorEvent(ProctorEventBase):
    id: int
    ts: datetime
    
    model_config = ConfigDict(from_attributes=True)


# API Request/Response schemas
class InviteTokenResponse(BaseModel):
    invite_id: int
    strict_mode: bool
    window_start: datetime
    window_end: datetime


class OTPSendRequest(BaseModel):
    email: EmailStr
    invite_id: int


class OTPVerifyRequest(BaseModel):
    email: EmailStr
    invite_id: int
    code: str


class LivenessRequest(BaseModel):
    session_id: Optional[int] = None
    metrics: Dict[str, Any]


class SessionStartRequest(BaseModel):
    invite_id: int


class SessionStartResponse(BaseModel):
    session_id: int
    question: str
    turn_idx: int
    answer_seconds: int
    buffer_seconds: int
    deadline_utc: datetime


class SpeechSubmissionRequest(BaseModel):
    question: str
    turn_idx: int


class SpeechSubmissionResponse(BaseModel):
    transcript: str
    score: Optional[int] = None
    missing: List[str] = []
    next_question: Optional[str] = None
    next_turn_idx: Optional[int] = None
    buffer_seconds: int
    show_at_utc: Optional[datetime] = None
    answer_seconds: int
    complete: bool = False


class TimeoutRequest(BaseModel):
    turn_idx: int


class ProctorEventRequest(BaseModel):
    type: str
    present: Optional[bool] = None
    details: Optional[Dict[str, Any]] = None


class ProctorEventResponse(BaseModel):
    risk: float


class AdminStatsResponse(BaseModel):
    candidates: int
    jobs: int
    invites: int
    active_sessions: int


class CreateJobRequest(BaseModel):
    title: str
    level: str
    department: str
    jd_text: Optional[str] = None


class CreateInviteRequest(BaseModel):
    candidate_id: int
    job_id: int
    strict_mode: bool = False
    window_start: str  # ISO format
    window_end: str    # ISO format


class CreateInviteResponse(BaseModel):
    invite_id: int
    interview_url: str


# Candidate Management Schemas
class CandidateCreate(BaseModel):
    name: str
    email: EmailStr
    phone: Optional[str] = None
    location: Optional[str] = None
    experience_years: Optional[int] = None
    skills: Optional[List[str]] = None
    resume_text: Optional[str] = None
    status: Optional[str] = "active"


class CandidateUpdate(BaseModel):
    name: Optional[str] = None
    email: Optional[str] = None
    phone: Optional[str] = None
    location: Optional[str] = None
    experience_years: Optional[int] = None
    skills: Optional[Union[str, List[str]]] = None  # Accept both string and list
    status: Optional[str] = None


class CandidateResponse(BaseModel):
    id: int
    name: str
    email: str
    phone: Optional[str] = None
    location: Optional[str] = None
    experience_years: Optional[int] = None
    skills: Optional[List[str]] = None
    resume_url: Optional[str] = None
    status: str
    created_at: datetime
    updated_at: Optional[datetime] = None
    
    model_config = ConfigDict(from_attributes=True)


# Jobs Management Schemas
class JobCreate(BaseModel):
    title: str
    level: str
    department: str
    description: str
    status: Optional[str] = "active"
    requirements: Optional[List[str]] = []
    location: Optional[str] = ""
    salary_range: Optional[str] = ""
    employment_type: Optional[str] = "full-time"
    remote_allowed: Optional[bool] = False


class JobUpdate(BaseModel):
    title: Optional[str] = None
    level: Optional[str] = None
    department: Optional[str] = None
    description: Optional[str] = None
    status: Optional[str] = None
    requirements: Optional[List[str]] = None
    location: Optional[str] = None
    salary_range: Optional[str] = None
    employment_type: Optional[str] = None
    remote_allowed: Optional[bool] = None


class JobResponse(BaseModel):
    id: int
    title: str
    level: Optional[str] = None
    department: Optional[str] = None
    description: str
    status: Optional[str] = "active"
    requirements: List[str]
    location: Optional[str] = None
    salary_range: Optional[str] = None
    employment_type: Optional[str] = "full-time"
    remote_allowed: Optional[bool] = False
    created_at: datetime
    updated_at: Optional[datetime] = None
    
    model_config = ConfigDict(from_attributes=True)


class JobInviteInfo(BaseModel):
    id: int
    candidate_name: str
    candidate_email: str
    status: str
    window_start: datetime
    window_end: datetime
    created_at: datetime


class JobDetailsResponse(JobResponse):
    invites: List[JobInviteInfo]
    total_invites: int


class DepartmentStats(BaseModel):
    department: str
    count: int


class LevelStats(BaseModel):
    level: str
    count: int


class JobsStatsResponse(BaseModel):
    total_jobs: int
    active_jobs: int
    inactive_jobs: int
    departments: List[DepartmentStats]
    levels: List[LevelStats]
    recent_jobs: int


# Interview Invites Management Schemas
class InviteCreate(BaseModel):
    candidate_id: int
    job_id: int
    expires_at: Optional[datetime] = None
    send_email: Optional[bool] = True


class InviteUpdate(BaseModel):
    status: Optional[str] = None
    expires_at: Optional[datetime] = None


class InviteResponse(BaseModel):
    id: int
    candidate_id: int
    candidate_name: str
    candidate_email: str
    job_id: int
    job_title: str
    job_department: str
    invite_code: str
    status: str
    expires_at: datetime
    created_at: datetime
    updated_at: Optional[datetime] = None
    
    model_config = ConfigDict(from_attributes=True)


class InviteDetailsResponse(InviteResponse):
    candidate_phone: Optional[str] = None
    job_description: str
    interview_url: str


class JobBreakdown(BaseModel):
    job_title: str
    count: int


class InvitesStatsResponse(BaseModel):
    total_invites: int
    pending_invites: int
    used_invites: int
    expired_invites: int
    expiring_soon: int
    recent_invites: int
    jobs_breakdown: List[JobBreakdown]


# Session Management Schemas
class SessionResponse(BaseModel):
    id: int
    invite_id: int
    invite_code: str
    candidate_name: str
    candidate_email: str
    job_title: str
    job_department: str
    status: str
    started_at: Optional[datetime]
    ended_at: Optional[datetime]
    duration_minutes: Optional[float]
    score: Optional[float]
    score_category: Optional[str]  # Best Fit, Good Fit, Average, Needs Improvement, Not Recommended
    proctor_risk: float
    total_turns: int
    completed_turns: int
    risk_events_count: int
    is_active: bool
    progress_percentage: float


class TurnDetails(BaseModel):
    id: int
    idx: int
    question_text: str
    ai_response: Optional[str]
    transcript: Optional[str]
    turn_score: Optional[float]
    started_at: Optional[datetime]
    ended_at: Optional[datetime]
    status: Optional[str]


class ProctorEventDetails(BaseModel):
    id: int
    event_type: str
    risk_level: str
    description: str
    timestamp: Optional[datetime]
    metadata: dict


class SessionDetailsResponse(BaseModel):
    id: int
    invite_id: int
    invite_code: str
    candidate_name: str
    candidate_email: str
    candidate_phone: Optional[str]
    job_title: str
    job_department: str
    job_description: Optional[str]
    status: str
    started_at: Optional[datetime]
    ended_at: Optional[datetime]
    duration_minutes: Optional[float]
    score: Optional[float]
    score_category: Optional[str]  # Best Fit, Good Fit, Average, Needs Improvement, Not Recommended
    proctor_risk: float
    turns: List[TurnDetails]
    proctor_events: List[ProctorEventDetails]
    invite_expires_at: Optional[datetime]


class SessionUpdateRequest(BaseModel):
    status: Optional[str] = None
    score: Optional[float] = None
    proctor_risk: Optional[float] = None


class SessionJobBreakdown(BaseModel):
    job_title: str
    job_department: str
    session_count: int


class SessionActivityBreakdown(BaseModel):
    date: Optional[str]
    sessions_count: int


class SessionsStatsResponse(BaseModel):
    total_sessions: int
    active_sessions: int
    completed_sessions: int
    abandoned_sessions: int
    recent_sessions: int
    avg_duration_minutes: float
    completion_rate: float
    avg_score: float
    high_risk_sessions: int
    jobs_breakdown: List[SessionJobBreakdown]
    activity_breakdown: List[SessionActivityBreakdown]


# =====================
# ADMIN REPORTS SCHEMAS
# =====================

class ReportSummary(BaseModel):
    id: int
    session_id: int
    candidate_name: str
    candidate_email: str
    job_title: str
    department: str
    session_status: str
    overall_score: Optional[float] = None
    risk_score: Optional[float] = None
    risk_level: str
    started_at: Optional[datetime] = None  # Make optional since some sessions may not have started_at
    ended_at: Optional[datetime] = None
    duration_minutes: Optional[float] = None
    total_questions: int
    answered_questions: int
    completion_rate: float
    
    model_config = ConfigDict(from_attributes=True)


class ReportFilter(BaseModel):
    date_from: Optional[datetime] = None
    date_to: Optional[datetime] = None
    job_id: Optional[int] = None
    department: Optional[str] = None
    status: Optional[str] = None
    min_score: Optional[float] = None
    max_score: Optional[float] = None
    risk_level: Optional[str] = None


class ReportAnalytics(BaseModel):
    total_reports: int
    avg_completion_rate: float
    avg_overall_score: float
    avg_risk_score: float
    reports_by_status: Dict[str, int]
    reports_by_department: Dict[str, int]
    reports_by_risk_level: Dict[str, int]
    score_distribution: Dict[str, int]
    completion_trends: List[Dict[str, Any]]


class BulkReportRequest(BaseModel):
    session_ids: List[int]
    format: str = "pdf"  # pdf, csv, excel
    include_analytics: bool = True


class ReportExportResponse(BaseModel):
    success: bool
    message: str
    download_url: Optional[str] = None
    file_size: Optional[int] = None
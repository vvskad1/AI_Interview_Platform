from fastapi import APIRouter, Depends, HTTPException, Form, File, UploadFile
from sqlalchemy.orm import Session
from typing import List, Optional
import secrets
import bcrypt
from datetime import datetime, timezone
import os

from ..database import get_db
from ..models import Candidate, Job, Invite, Session as SessionModel, Turn, ProctorEvent, InviteStatus
from ..schemas import (
    Candidate as CandidateSchema, CandidateCreate, Job as JobSchema, 
    Invite as InviteSchema, CreateJobRequest, CreateInviteRequest, CreateInviteResponse,
    AdminStatsResponse
)
from ..services.resume_parser import extract_text_from_pdf, parse_resume_text
from ..services.jd_parser import extract_jd_from_pdf
from ..services.emailer import email_service
from ..services.calendar import generate_ics_file
from ..config import settings

router = APIRouter()


@router.options("/stats")
async def stats_options():
    """Handle CORS preflight for stats endpoint"""
    return {"message": "OK"}


@router.get("/stats", response_model=AdminStatsResponse)
def get_admin_stats(db: Session = Depends(get_db)):
    """Get admin dashboard statistics"""
    candidates_count = db.query(Candidate).count()
    jobs_count = db.query(Job).count()
    invites_count = db.query(Invite).count()
    active_sessions_count = db.query(SessionModel).filter(
        SessionModel.status == "started"
    ).count()
    
    return AdminStatsResponse(
        candidates=candidates_count,
        jobs=jobs_count,
        invites=invites_count,
        active_sessions=active_sessions_count
    )


@router.get("/candidates", response_model=List[CandidateSchema])
def get_candidates(db: Session = Depends(get_db)):
    """Get list of all candidates"""
    from datetime import datetime, timezone
    
    candidates = db.query(Candidate).all()
    
    # Fix any candidates with null created_at
    for candidate in candidates:
        if candidate.created_at is None:
            candidate.created_at = datetime.now(timezone.utc)
            db.commit()
    
    # Return ordered candidates
    candidates = db.query(Candidate).order_by(Candidate.created_at.desc()).all()
    return candidates


@router.post("/candidate", response_model=CandidateSchema)
def create_candidate(candidate: CandidateCreate, db: Session = Depends(get_db)):
    """Create new candidate"""
    # Check if email already exists
    existing = db.query(Candidate).filter(Candidate.email == candidate.email).first()
    if existing:
        raise HTTPException(status_code=400, detail="Email already registered")
    
    db_candidate = Candidate(**candidate.dict())
    db.add(db_candidate)
    db.commit()
    db.refresh(db_candidate)
    return db_candidate


@router.get("/jobs", response_model=List[JobSchema])
def get_jobs(db: Session = Depends(get_db)):
    """Get list of all jobs"""
    from datetime import datetime, timezone
    
    jobs = db.query(Job).all()
    
    # Fix any jobs with null created_at
    for job in jobs:
        if job.created_at is None:
            job.created_at = datetime.now(timezone.utc)
            db.commit()
    
    # Return ordered jobs
    jobs = db.query(Job).order_by(Job.created_at.desc()).all()
    return jobs


@router.options("/create-job")
async def create_job_options():
    """Handle CORS preflight for create-job endpoint"""
    return {"message": "OK"}


@router.post("/create-job")
def create_job(
    title: str = Form(...),
    level: str = Form(...),
    department: str = Form(...),
    jd_text: Optional[str] = Form(None),
    jd_pdf: Optional[UploadFile] = File(None),
    db: Session = Depends(get_db)
):
    """Create new job posting"""
    
    # Extract JD text from PDF if provided
    if jd_pdf:
        if jd_pdf.content_type != "application/pdf":
            raise HTTPException(status_code=400, detail="Only PDF files allowed")
        
        pdf_content = jd_pdf.file.read()
        jd_text = extract_jd_from_pdf(pdf_content)
    
    if not jd_text or not jd_text.strip():
        raise HTTPException(status_code=400, detail="Job description text is required")
    
    db_job = Job(
        title=title,
        level=level,
        department=department,
        jd_text=jd_text
    )
    
    db.add(db_job)
    db.commit()
    db.refresh(db_job)
    
    return {"job_id": db_job.id, "message": "Job created successfully"}


@router.options("/upload-resume")
async def upload_resume_options():
    """Handle CORS preflight for upload-resume endpoint"""
    return {"message": "OK"}


@router.post("/upload-resume")
def upload_resume(
    candidate_id: int = Form(...),
    file: UploadFile = File(...),
    db: Session = Depends(get_db)
):
    """Upload and parse resume for candidate"""
    
    # Validate candidate exists
    candidate = db.query(Candidate).filter(Candidate.id == candidate_id).first()
    if not candidate:
        raise HTTPException(status_code=404, detail="Candidate not found")
    
    # Validate file type
    if file.content_type != "application/pdf":
        raise HTTPException(status_code=400, detail="Only PDF files allowed")
    
    # Extract text from PDF
    pdf_content = file.file.read()
    resume_text = extract_text_from_pdf(pdf_content)
    
    if not resume_text.strip():
        raise HTTPException(status_code=400, detail="Could not extract text from PDF")
    
    # Parse resume
    parsed_resume = parse_resume_text(resume_text)
    
    return {
        "candidate_id": candidate_id,
        "extracted_text": resume_text[:1000] + "..." if len(resume_text) > 1000 else resume_text,
        "parsed_sections": parsed_resume,
        "message": "Resume processed successfully"
    }


@router.options("/create-invite")
async def create_invite_options():
    """Handle CORS preflight for create-invite endpoint"""
    return {"message": "OK"}


@router.post("/create-invite", response_model=CreateInviteResponse)
def create_invite(
    candidate_id: int = Form(...),
    job_id: int = Form(...),
    strict_mode: bool = Form(False),
    window_start: str = Form(...),
    window_end: str = Form(...),
    db: Session = Depends(get_db)
):
    """Create interview invite and send email"""
    
    # Validate candidate and job exist
    candidate = db.query(Candidate).filter(Candidate.id == candidate_id).first()
    if not candidate:
        raise HTTPException(status_code=404, detail="Candidate not found")
    
    job = db.query(Job).filter(Job.id == job_id).first()
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")
    
    # Parse datetime strings
    try:
        window_start_dt = datetime.fromisoformat(window_start.replace('Z', '+00:00'))
        window_end_dt = datetime.fromisoformat(window_end.replace('Z', '+00:00'))
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid datetime format")
    
    # Generate secure token
    token_id = secrets.token_urlsafe(32)
    secret = secrets.token_urlsafe(32)
    token_hash = bcrypt.hashpw(secret.encode(), bcrypt.gensalt()).decode()
    
    # Create invite
    db_invite = Invite(
        candidate_id=candidate_id,
        job_id=job_id,
        strict_mode=strict_mode,
        window_start=window_start_dt,
        window_end=window_end_dt,
        token_id=token_id,
        token_hash=token_hash
    )
    
    db.add(db_invite)
    db.commit()
    db.refresh(db_invite)
    
    # Generate interview URL
    interview_url = f"{settings.public_base_url}/i/{token_id}.{secret}"
    
    # Generate calendar file
    calendar_data = generate_ics_file(
        candidate.name, job.title, interview_url,
        window_start_dt, window_end_dt
    )
    
    # Send email invitation
    try:
        email_service.send_interview_invite(
            candidate.email,
            candidate.name,
            job.title,
            interview_url,
            window_start_dt.strftime('%Y-%m-%d %H:%M UTC'),
            window_end_dt.strftime('%Y-%m-%d %H:%M UTC'),
            calendar_data
        )
    except Exception as e:
        # TODO: Add proper logging
        print(f"Failed to send email: {e}")
    
    return CreateInviteResponse(
        invite_id=db_invite.id,
        interview_url=interview_url
    )


@router.get("/sessions")
def get_active_sessions(db: Session = Depends(get_db)):
    """Get list of active sessions for monitoring"""
    sessions = db.query(SessionModel).filter(
        SessionModel.status == "started"
    ).join(Invite).join(Candidate).join(Job).all()
    
    session_list = []
    for session in sessions:
        session_data = {
            "id": session.id,
            "candidate_name": session.invite.candidate.name,
            "candidate_email": session.invite.candidate.email,
            "job_title": session.invite.job.title,
            "started_at": session.started_at,
            "status": session.status,
            "proctor_risk": session.proctor_risk,
            "current_turn": db.query(Turn).filter(
                Turn.session_id == session.id
            ).order_by(Turn.idx.desc()).first().idx if db.query(Turn).filter(
                Turn.session_id == session.id
            ).count() > 0 else 0
        }
        session_list.append(session_data)
    
    return {"sessions": session_list}


@router.options("/invites/{invite_id}/reinvite")
async def reinvite_options(invite_id: int):
    """Handle CORS preflight for reinvite endpoint"""
    return {"message": "OK"}


@router.post("/invites/{invite_id}/reinvite", response_model=CreateInviteResponse)
def reinvite_candidate(
    invite_id: int,
    expires_at: Optional[str] = Form(None),
    db: Session = Depends(get_db)
):
    """
    Reinvite a candidate for the same job.
    Creates a new invite and archives the old one with timestamp.
    Works for expired, completed, or failed interviews.
    """
    # Get the original invite
    original_invite = db.query(Invite).filter(Invite.id == invite_id).first()
    if not original_invite:
        raise HTTPException(status_code=404, detail="Original invite not found")
    
    # Get candidate and job
    candidate = db.query(Candidate).filter(Candidate.id == original_invite.candidate_id).first()
    job = db.query(Job).filter(Job.id == original_invite.job_id).first()
    
    if not candidate or not job:
        raise HTTPException(status_code=404, detail="Candidate or job not found")
    
    # Check if invite can be reinvited (expired, completed, or failed)
    # We allow reinvite for any status to enable practice interviews
    
    # Mark old invite as "reinvited" or keep its current status
    # The old invite stays in the database for record-keeping
    
    # Parse expiry datetime
    if expires_at:
        try:
            expires_at_dt = datetime.fromisoformat(expires_at.replace('Z', '+00:00'))
        except ValueError:
            raise HTTPException(status_code=400, detail="Invalid datetime format")
    else:
        # Default to 7 days from now
        from datetime import timedelta
        expires_at_dt = datetime.now(timezone.utc) + timedelta(days=7)
    
    # Generate new invite code (simple 8-character code)
    import string
    invite_code = ''.join(secrets.choice(string.ascii_letters + string.digits) for _ in range(8))
    
    # Create new invite
    current_time = datetime.now(timezone.utc)
    new_invite = Invite(
        candidate_id=candidate.id,
        job_id=job.id,
        invite_code=invite_code,
        status=InviteStatus.PENDING.value,
        expires_at=expires_at_dt,
        created_at=current_time,
        updated_at=current_time
    )
    
    db.add(new_invite)
    db.commit()
    db.refresh(new_invite)
    
    print(f"✅ Created reinvite: ID={new_invite.id}, Code='{invite_code}', Status={new_invite.status}, Expires={expires_at_dt}")
    
    # Generate interview URL
    interview_url = f"{settings.public_base_url}/i/{invite_code}"
    print(f"🔗 Generated URL: {interview_url}")
    
    # Generate calendar file
    calendar_data = generate_ics_file(
        candidate.name,
        job.title,
        interview_url,
        datetime.now(timezone.utc),
        expires_at_dt
    )
    
    # Send email invitation
    try:
        email_service.send_interview_invite(
            candidate.email,
            candidate.name,
            job.title,
            interview_url,
            datetime.now(timezone.utc).strftime('%Y-%m-%d %H:%M UTC'),
            expires_at_dt.strftime('%Y-%m-%d %H:%M UTC'),
            calendar_data
        )
    except Exception as e:
        print(f"Failed to send reinvite email: {e}")
    
    return CreateInviteResponse(
        invite_id=new_invite.id,
        interview_url=interview_url
    )
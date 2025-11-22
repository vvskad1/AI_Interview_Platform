from fastapi import APIRouter, HTTPException, Depends, Query, status
from sqlalchemy.orm import Session
from sqlalchemy import func, and_, or_, desc
from typing import List, Optional
from datetime import datetime, timedelta
import uuid
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart

from ..database import get_db
from ..models import Invite, Candidate, Job
from ..schemas import (
    InviteCreate, InviteUpdate, InviteResponse, InvitesStatsResponse,
    InviteDetailsResponse
)
from ..services.emailer import email_service
from ..config import settings

router = APIRouter(prefix="/api/admin/invites", tags=["admin-invites"])


@router.get("/", response_model=dict)
async def get_all_invites(
    db: Session = Depends(get_db),
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=100),
    search: Optional[str] = Query(None),
    status: Optional[str] = Query(None),
    job_id: Optional[int] = Query(None),
    candidate_id: Optional[int] = Query(None)
):
    """Get all invites with filtering, pagination, and search"""
    
    # Base query with joins
    query = db.query(Invite, Candidate, Job).join(
        Candidate, Invite.candidate_id == Candidate.id
    ).join(
        Job, Invite.job_id == Job.id
    )
    
    # Apply filters
    if search:
        search_filter = or_(
            Candidate.name.ilike(f"%{search}%"),
            Candidate.email.ilike(f"%{search}%"),
            Job.title.ilike(f"%{search}%")
        )
        query = query.filter(search_filter)
    
    if status:
        query = query.filter(Invite.status == status)
    
    if job_id:
        query = query.filter(Invite.job_id == job_id)
    
    if candidate_id:
        query = query.filter(Invite.candidate_id == candidate_id)
    
    # Get total count
    total = query.count()
    
    # Apply pagination and ordering
    results = query.order_by(desc(Invite.created_at)).offset(skip).limit(limit).all()
    
    # Format response
    invites_data = []
    for invite, candidate, job in results:
        invite_dict = {
            "id": invite.id,
            "candidate_id": invite.candidate_id,
            "candidate_name": candidate.name,
            "candidate_email": candidate.email,
            "job_id": invite.job_id,
            "job_title": job.title,
            "job_department": getattr(job, 'department', ''),
            "invite_code": invite.invite_code,
            "status": invite.status,
            "expires_at": invite.expires_at.isoformat() if invite.expires_at else None,
            "created_at": invite.created_at.isoformat() if invite.created_at else None,
            "updated_at": invite.updated_at.isoformat() if invite.updated_at else None
        }
        invites_data.append(invite_dict)
    
    return {
        "invites": invites_data,
        "total": total,
        "skip": skip,
        "limit": limit
    }


@router.get("/stats", response_model=InvitesStatsResponse)
async def get_invites_statistics(db: Session = Depends(get_db)):
    """Get invite management statistics"""
    
    # Basic counts
    total_invites = db.query(func.count(Invite.id)).scalar()
    
    # Status breakdown
    pending_invites = db.query(func.count(Invite.id)).filter(Invite.status == 'pending').scalar()
    used_invites = db.query(func.count(Invite.id)).filter(Invite.status == 'used').scalar()
    expired_invites = db.query(func.count(Invite.id)).filter(Invite.status == 'expired').scalar()
    
    # Expiring soon (next 24 hours)
    tomorrow = datetime.now() + timedelta(days=1)
    expiring_soon = db.query(func.count(Invite.id)).filter(
        and_(
            Invite.status == 'pending',
            Invite.expires_at <= tomorrow,
            Invite.expires_at > datetime.now()
        )
    ).scalar()
    
    # Recent invites (last 7 days)
    week_ago = datetime.now() - timedelta(days=7)
    recent_invites = db.query(func.count(Invite.id)).filter(
        Invite.created_at >= week_ago
    ).scalar()
    
    # Job breakdown
    jobs_stats = db.query(
        Job.title,
        func.count(Invite.id).label('invite_count')
    ).join(Job, Invite.job_id == Job.id).group_by(Job.id, Job.title).all()
    
    jobs_breakdown = [
        {"job_title": title, "count": count}
        for title, count in jobs_stats
    ]
    
    return InvitesStatsResponse(
        total_invites=total_invites,
        pending_invites=pending_invites,
        used_invites=used_invites,
        expired_invites=expired_invites,
        expiring_soon=expiring_soon,
        recent_invites=recent_invites,
        jobs_breakdown=jobs_breakdown
    )


@router.post("/", response_model=InviteResponse)
async def create_invite(invite_data: InviteCreate, db: Session = Depends(get_db)):
    """Create a new interview invite"""
    
    # Check if candidate exists
    candidate = db.query(Candidate).filter(Candidate.id == invite_data.candidate_id).first()
    if not candidate:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Candidate not found"
        )
    
    # Check if job exists
    job = db.query(Job).filter(Job.id == invite_data.job_id).first()
    if not job:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Job not found"
        )
    
    # Check for existing pending invite
    existing_invite = db.query(Invite).filter(
        and_(
            Invite.candidate_id == invite_data.candidate_id,
            Invite.job_id == invite_data.job_id,
            Invite.status == 'pending'
        )
    ).first()
    
    if existing_invite:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Candidate already has a pending invite for this job"
        )
    
    try:
        # Generate unique invite code
        invite_code = str(uuid.uuid4())[:8].upper()
        
        # Calculate expiration date (default 7 days from now)
        expires_at = invite_data.expires_at or (datetime.now() + timedelta(days=7))
        
        # Create new invite
        current_time = datetime.now()
        db_invite = Invite(
            candidate_id=invite_data.candidate_id,
            job_id=invite_data.job_id,
            invite_code=invite_code,
            status='pending',
            expires_at=expires_at,
            created_at=current_time,
            updated_at=current_time
        )
        
        db.add(db_invite)
        db.commit()
        db.refresh(db_invite)
        
        # Send email invitation
        if invite_data.send_email:
            await send_invitation_email(db_invite, candidate, job)
        
        return InviteResponse(
            id=db_invite.id,
            candidate_id=db_invite.candidate_id,
            candidate_name=candidate.name,
            candidate_email=candidate.email,
            job_id=db_invite.job_id,
            job_title=job.title,
            job_department=getattr(job, 'department', ''),
            invite_code=db_invite.invite_code,
            status=db_invite.status,
            expires_at=db_invite.expires_at,
            created_at=db_invite.created_at,
            updated_at=db_invite.updated_at
        )
        
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Failed to create invite: {str(e)}"
        )


@router.get("/{invite_id}", response_model=InviteDetailsResponse)
async def get_invite_details(invite_id: int, db: Session = Depends(get_db)):
    """Get detailed invite information"""
    
    result = db.query(Invite, Candidate, Job).join(
        Candidate, Invite.candidate_id == Candidate.id
    ).join(
        Job, Invite.job_id == Job.id
    ).filter(Invite.id == invite_id).first()
    
    if not result:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Invite not found"
        )
    
    invite, candidate, job = result
    
    return InviteDetailsResponse(
        id=invite.id,
        candidate_id=invite.candidate_id,
        candidate_name=candidate.name,
        candidate_email=candidate.email,
        candidate_phone=candidate.phone,
        job_id=invite.job_id,
        job_title=job.title,
        job_department=getattr(job, 'department', ''),
        job_description=job.description,
        invite_code=invite.invite_code,
        status=invite.status,
        expires_at=invite.expires_at,
        created_at=invite.created_at,
        updated_at=invite.updated_at,
        interview_url=f"{settings.public_base_url}/i/{invite.invite_code}"
    )


@router.put("/{invite_id}", response_model=InviteResponse)
async def update_invite(invite_id: int, invite_data: InviteUpdate, db: Session = Depends(get_db)):
    """Update invite information"""
    
    invite = db.query(Invite).filter(Invite.id == invite_id).first()
    if not invite:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Invite not found"
        )
    
    try:
        # Update fields that are provided
        update_data = invite_data.model_dump(exclude_unset=True)
        
        for field, value in update_data.items():
            if hasattr(invite, field):
                setattr(invite, field, value)
        
        from datetime import datetime as dt
        invite.updated_at = dt.now()
        
        db.commit()
        db.refresh(invite)
        
        # Get related data for response
        candidate = db.query(Candidate).filter(Candidate.id == invite.candidate_id).first()
        job = db.query(Job).filter(Job.id == invite.job_id).first()
        
        # Handle null created_at for legacy records  
        created_at = invite.created_at
        if created_at is None:
            created_at = dt.now()
        
        updated_at = invite.updated_at
        if updated_at is None:
            updated_at = created_at

        return InviteResponse(
            id=invite.id,
            candidate_id=invite.candidate_id,
            candidate_name=candidate.name,
            candidate_email=candidate.email,
            job_id=invite.job_id,
            job_title=job.title,
            job_department=getattr(job, 'department', ''),
            invite_code=invite.invite_code,
            status=invite.status,
            expires_at=invite.expires_at,
            created_at=created_at,
            updated_at=updated_at
        )
        
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Failed to update invite: {str(e)}"
        )


@router.delete("/{invite_id}")
async def delete_invite(invite_id: int, db: Session = Depends(get_db)):
    """Delete an invite"""
    
    invite = db.query(Invite).filter(Invite.id == invite_id).first()
    if not invite:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Invite not found"
        )
    
    try:
        db.delete(invite)
        db.commit()
        return {"message": "Invite deleted successfully"}
        
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Failed to delete invite: {str(e)}"
        )


@router.post("/{invite_id}/resend-email")
async def resend_invitation_email(invite_id: int, db: Session = Depends(get_db)):
    """Resend invitation email"""
    
    result = db.query(Invite, Candidate, Job).join(
        Candidate, Invite.candidate_id == Candidate.id
    ).join(
        Job, Invite.job_id == Job.id
    ).filter(Invite.id == invite_id).first()
    
    if not result:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Invite not found"
        )
    
    invite, candidate, job = result
    
    if invite.status != 'pending':
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Can only resend emails for pending invites"
        )
    
    try:
        await send_invitation_email(invite, candidate, job)
        return {"message": "Invitation email sent successfully"}
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Failed to send email: {str(e)}"
        )


async def send_invitation_email(invite: Invite, candidate: Candidate, job: Job):
    """Send invitation email to candidate"""
    
    interview_url = f"{settings.public_base_url}/i/{invite.invite_code}"
    
    # Create email content
    subject = f"Interview Invitation - {job.title}"
    
    body = f"""
    Dear {candidate.name},

    You have been invited to participate in an Exatech Round 1 interview for the position of {job.title}.

    Interview Details:
    - Position: {job.title}
    - Department: {getattr(job, 'department', 'Not specified')}
    - Invite Code: {invite.invite_code}
    - Expires: {invite.expires_at.strftime('%B %d, %Y at %I:%M %p')}

    To start your interview, please click the link below:
    {interview_url}

    Instructions:
    1. Click the interview link
    2. Enter your invite code: {invite.invite_code}
    3. Follow the on-screen instructions
    4. Ensure you have a stable internet connection and working microphone

    If you have any questions or technical issues, please contact our support team.

    Best regards,
    Exatech Round 1 Interview Team
    """
    
    # Send email using the email service
    try:
        # Format window times (using expiration date as window end)
        window_start = "Available now"
        window_end = invite.expires_at.strftime('%B %d, %Y at %I:%M %p')
        
        email_service.send_interview_invite(
            email=candidate.email,
            candidate_name=candidate.name,
            job_title=job.title,
            interview_url=interview_url,
            window_start=window_start,
            window_end=window_end
        )
    except Exception as e:
        raise Exception(f"Failed to send email: {str(e)}")
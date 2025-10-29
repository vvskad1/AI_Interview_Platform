from fastapi import APIRouter, HTTPException, Depends, Query, status
from sqlalchemy.orm import Session
from sqlalchemy import func, and_, or_
from typing import List, Optional
from datetime import datetime

from ..database import get_db
from ..models import Job, Invite, Candidate
from ..schemas import (
    JobCreate, JobUpdate, JobResponse, JobsStatsResponse,
    JobDetailsResponse
)

router = APIRouter(prefix="/api/admin/jobs", tags=["admin-jobs"])


@router.get("/", response_model=dict)
@router.get("", response_model=dict)  # Also handle without trailing slash
async def get_all_jobs(
    db: Session = Depends(get_db),
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=100),
    search: Optional[str] = Query(None),
    level: Optional[str] = Query(None),
    department: Optional[str] = Query(None),
    status: Optional[str] = Query(None)
):
    """Get all jobs with filtering, pagination, and search"""
    
    # Base query
    query = db.query(Job)
    
    # Apply filters
    if search:
        search_filter = or_(
            Job.title.ilike(f"%{search}%"),
            Job.department.ilike(f"%{search}%"),
            Job.jd_text.ilike(f"%{search}%")
        )
        query = query.filter(search_filter)
    
    if level:
        query = query.filter(Job.level == level)
    
    if department:
        query = query.filter(Job.department == department)
    
    if status:
        query = query.filter(Job.status == status)
    
    # Get total count
    total = query.count()
    
    # Apply pagination
    jobs = query.offset(skip).limit(limit).all()
    
    # Add invite counts for each job
    jobs_with_stats = []
    for job in jobs:
        invite_count = db.query(func.count(Invite.id)).filter(Invite.job_id == job.id).scalar()
        job_dict = {
            "id": job.id,
            "title": job.title,
            "description": job.description,  # Added description field
            "level": job.level,
            "department": job.department,
            "status": getattr(job, 'status', 'active'),
            "requirements": getattr(job, 'requirements', []),
            "location": getattr(job, 'location', ''),
            "salary_range": getattr(job, 'salary_range', ''),
            "employment_type": getattr(job, 'employment_type', 'full-time'),
            "remote_allowed": getattr(job, 'remote_allowed', False),
            "invite_count": invite_count,
            "created_at": job.created_at,
            "updated_at": getattr(job, 'updated_at', job.created_at)
        }
        jobs_with_stats.append(job_dict)
    
    return {
        "jobs": jobs_with_stats,
        "total": total,
        "skip": skip,
        "limit": limit
    }


@router.get("/stats", response_model=JobsStatsResponse)
async def get_jobs_statistics(db: Session = Depends(get_db)):
    """Get job management statistics"""
    
    # Basic counts
    total_jobs = db.query(func.count(Job.id)).scalar()
    active_jobs = db.query(func.count(Job.id)).filter(
        getattr(Job, 'status', 'active') == 'active'
    ).scalar() or total_jobs  # Fallback if status column doesn't exist
    
    # Jobs by department
    departments_query = db.query(
        Job.department,
        func.count(Job.id).label('count')
    ).group_by(Job.department).all()
    
    departments_stats = [
        {"department": dept, "count": count} 
        for dept, count in departments_query
    ]
    
    # Jobs by level
    levels_query = db.query(
        Job.level,
        func.count(Job.id).label('count')
    ).group_by(Job.level).all()
    
    levels_stats = [
        {"level": level, "count": count}
        for level, count in levels_query
    ]
    
    # Recent activity (jobs created in last 30 days)
    thirty_days_ago = datetime.now().replace(day=1)  # Simplified for demo
    recent_jobs = db.query(func.count(Job.id)).filter(
        Job.created_at >= thirty_days_ago
    ).scalar()
    
    return JobsStatsResponse(
        total_jobs=total_jobs,
        active_jobs=active_jobs,
        inactive_jobs=total_jobs - active_jobs,
        departments=departments_stats,
        levels=levels_stats,
        recent_jobs=recent_jobs
    )


@router.options("/")
@router.options("")
async def create_job_options():
    """Handle CORS preflight for job creation"""
    return {"message": "OK"}


@router.post("/", response_model=JobResponse)
@router.post("", response_model=JobResponse)
async def create_job(job_data: JobCreate, db: Session = Depends(get_db)):
    """Create a new job posting"""
    
    # Create new job with the actual database fields
    job_dict = {
        'title': job_data.title,
        'description': job_data.description,
        'requirements': job_data.requirements or [],
    }
    
    # Add optional fields if they exist in the model and are provided
    if hasattr(Job, 'level') and job_data.level:
        job_dict['level'] = job_data.level
    if hasattr(Job, 'department') and job_data.department:
        job_dict['department'] = job_data.department
    if hasattr(Job, 'status'):
        job_dict['status'] = getattr(job_data, 'status', 'active')
    if hasattr(Job, 'location') and job_data.location:
        job_dict['location'] = job_data.location
    if hasattr(Job, 'salary_range') and job_data.salary_range:
        job_dict['salary_range'] = job_data.salary_range
    if hasattr(Job, 'employment_type') and job_data.employment_type:
        job_dict['employment_type'] = job_data.employment_type
    if hasattr(Job, 'remote_allowed'):
        job_dict['remote_allowed'] = getattr(job_data, 'remote_allowed', False)
    
    db_job = Job(**job_dict)
    
    try:
        db.add(db_job)
        db.commit()
        db.refresh(db_job)
        
        return JobResponse(
            id=db_job.id,
            title=db_job.title,
            level=getattr(db_job, 'level', ''),
            department=getattr(db_job, 'department', ''),
            description=db_job.description,
            status=getattr(db_job, 'status', 'active'),
            requirements=getattr(db_job, 'requirements', []) or [],
            location=getattr(db_job, 'location', ''),
            salary_range=getattr(db_job, 'salary_range', ''),
            employment_type=getattr(db_job, 'employment_type', 'full-time'),
            remote_allowed=getattr(db_job, 'remote_allowed', False),
            created_at=db_job.created_at or datetime.now(),
            updated_at=getattr(db_job, 'updated_at', db_job.created_at) or datetime.now()
        )
        
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Failed to create job: {str(e)}"
        )


@router.get("/{job_id}", response_model=JobDetailsResponse)
async def get_job_details(job_id: int, db: Session = Depends(get_db)):
    """Get detailed job information including related invites"""
    
    try:
        job = db.query(Job).filter(Job.id == job_id).first()
        if not job:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Job not found"
            )
        
        # Get job invites with candidate information
        invites_query = db.query(Invite, Candidate).join(
            Candidate, Invite.candidate_id == Candidate.id
        ).filter(Invite.job_id == job_id).all()
        
        invites_data = []
        for invite, candidate in invites_query:
            invites_data.append({
                "id": invite.id,
                "candidate_name": candidate.name,
                "candidate_email": candidate.email,
                "status": invite.status,
                "window_start": invite.created_at,  # Use created_at as window_start
                "window_end": invite.expires_at,     # Use expires_at as window_end
                "created_at": invite.created_at if invite.created_at else job.created_at
            })
        
        return JobDetailsResponse(
            id=job.id,
            title=job.title,
            level=getattr(job, 'level', None),
            department=getattr(job, 'department', None),
            description=job.description,  # Use description directly instead of jd_text
            status=getattr(job, 'status', 'active'),
            requirements=getattr(job, 'requirements', []),
            location=getattr(job, 'location', None),
            salary_range=getattr(job, 'salary_range', None),
            employment_type=getattr(job, 'employment_type', 'full-time'),
            remote_allowed=getattr(job, 'remote_allowed', False),
            created_at=job.created_at if job.created_at else datetime.utcnow(),
            updated_at=getattr(job, 'updated_at', job.created_at) if job.created_at else datetime.utcnow(),
            invites=invites_data,
            total_invites=len(invites_data)
        )
    except HTTPException:
        raise
    except Exception as e:
        print(f"Error in get_job_details: {str(e)}")
        import traceback
        traceback.print_exc()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error fetching job details: {str(e)}"
        )


@router.put("/{job_id}", response_model=JobResponse)
async def update_job(job_id: int, job_data: JobUpdate, db: Session = Depends(get_db)):
    """Update job information"""
    
    job = db.query(Job).filter(Job.id == job_id).first()
    if not job:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Job not found"
        )
    
    # Update fields that are provided
    update_data = job_data.model_dump(exclude_unset=True)
    
    # Handle description -> jd_text mapping
    if 'description' in update_data:
        update_data['jd_text'] = update_data.pop('description')
    
    try:
        for field, value in update_data.items():
            if hasattr(job, field):
                setattr(job, field, value)
        
        # Update timestamp if the field exists
        if hasattr(job, 'updated_at'):
            job.updated_at = func.now()
        
        db.commit()
        db.refresh(job)
        
        # Handle null created_at for legacy records
        from datetime import datetime, timezone
        created_at = job.created_at
        if created_at is None:
            created_at = datetime.now(timezone.utc)
        
        updated_at = getattr(job, 'updated_at', created_at)
        if updated_at is None:
            updated_at = created_at
        
        return JobResponse(
            id=job.id,
            title=job.title,
            level=job.level,
            department=job.department,
            description=job.jd_text,
            status=getattr(job, 'status', 'active'),
            requirements=getattr(job, 'requirements', []),
            location=getattr(job, 'location', ''),
            salary_range=getattr(job, 'salary_range', ''),
            employment_type=getattr(job, 'employment_type', 'full-time'),
            remote_allowed=getattr(job, 'remote_allowed', False),
            created_at=created_at,
            updated_at=updated_at
        )
        
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Failed to update job: {str(e)}"
        )


@router.delete("/{job_id}")
async def delete_job(job_id: int, db: Session = Depends(get_db)):
    """Delete a job (only if no invites exist)"""
    
    job = db.query(Job).filter(Job.id == job_id).first()
    if not job:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Job not found"
        )
    
    # Check if job has any invites
    invite_count = db.query(func.count(Invite.id)).filter(Invite.job_id == job_id).scalar()
    if invite_count > 0:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Cannot delete job with {invite_count} existing invites. Set status to inactive instead."
        )
    
    try:
        db.delete(job)
        db.commit()
        return {"message": "Job deleted successfully"}
        
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Failed to delete job: {str(e)}"
        )


@router.post("/{job_id}/toggle-status")
async def toggle_job_status(job_id: int, db: Session = Depends(get_db)):
    """Toggle job status between active and inactive"""
    
    job = db.query(Job).filter(Job.id == job_id).first()
    if not job:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Job not found"
        )
    
    try:
        # Toggle status if field exists, otherwise create it
        if hasattr(job, 'status'):
            current_status = job.status
            new_status = 'inactive' if current_status == 'active' else 'active'
            job.status = new_status
        else:
            # If status field doesn't exist, we'll need to handle this differently
            # For now, return the current state
            new_status = 'active'
        
        if hasattr(job, 'updated_at'):
            job.updated_at = func.now()
        
        db.commit()
        
        return {
            "message": f"Job status updated to {new_status}",
            "status": new_status
        }
        
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Failed to toggle job status: {str(e)}"
        )
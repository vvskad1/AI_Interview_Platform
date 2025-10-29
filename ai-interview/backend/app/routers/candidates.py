from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form
from sqlalchemy.orm import Session as DBSession
from typing import List, Optional
import json
import logging
from datetime import datetime

from ..database import get_db
from ..models import Candidate, Session as InterviewSession, Turn, ProctorEvent, Invite
from ..schemas import CandidateCreate, CandidateResponse, CandidateUpdate
from ..services.resume_parser import ResumeParser, parse_resume_text

# Create resume parser instance
resume_parser = ResumeParser()

async def parse_resume(content: bytes, filename: str) -> dict:
    """Parse resume file and extract candidate information"""
    try:
        # Extract text based on file type
        if filename.lower().endswith('.pdf'):
            text = resume_parser.extract_text_from_pdf(content)
        elif filename.lower().endswith(('.doc', '.docx')):
            text = resume_parser.extract_text_from_docx(content)
        else:
            # Try to decode as text
            text = content.decode('utf-8', errors='ignore')
        
        # Parse the extracted text
        return parse_resume_text(text)
        
    except Exception as e:
        logger.error(f"Error parsing resume {filename}: {str(e)}")
        return {}
from sqlalchemy import func, and_, desc

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/api/admin/candidates", tags=["Admin - Candidates"])

@router.get("/", response_model=dict)
async def get_all_candidates(
    skip: int = 0,
    limit: int = 100,
    status: Optional[str] = None,
    search: Optional[str] = None,
    db: DBSession = Depends(get_db)
):
    """Get all candidates with pagination and filtering"""
    try:
        query = db.query(Candidate)
        
        # Apply filters
        if status and status != 'all':
            query = query.filter(Candidate.status == status)
        
        if search:
            search_term = f"%{search}%"
            query = query.filter(
                (Candidate.name.ilike(search_term)) |
                (Candidate.email.ilike(search_term))
            )
        
        # Get candidates with interview statistics
        candidates_data = []
        candidates = query.offset(skip).limit(limit).all()
        
        for candidate in candidates:
            # Get interview statistics - need to join with invites first
            interview_stats = db.query(
                func.count(InterviewSession.id).label('interview_count'),
                func.avg(InterviewSession.score).label('average_score'),
                func.max(InterviewSession.started_at).label('last_interview_date')
            ).join(
                Invite, InterviewSession.invite_id == Invite.id
            ).filter(
                Invite.candidate_id == candidate.id
            ).first()
            
            # Debug logging for resume content
            logger.info(f"Candidate {candidate.id} ({candidate.name}) - Resume text length: {len(candidate.resume_text or '')}")
            if candidate.resume_text:
                logger.info(f"Resume text preview: {candidate.resume_text[:100]}...")
            
            candidate_dict = {
                "id": candidate.id,
                "name": candidate.name,
                "email": candidate.email,
                "phone": candidate.phone,
                "location": candidate.location,
                "experience_years": candidate.experience_years,
                "skills": candidate.skills or [],
                "resume_url": candidate.resume_url,
                "resume_text": candidate.resume_text,  # Include resume text in response
                "resume_text_length": len(candidate.resume_text or ''),  # Debug field
                "has_resume": bool(candidate.resume_text),  # Debug field
                "status": candidate.status or "active",
                "created_at": candidate.created_at.isoformat() if candidate.created_at else None,
                "updated_at": candidate.updated_at.isoformat() if candidate.updated_at else None,
                "interview_count": interview_stats.interview_count or 0,
                "average_score": float(interview_stats.average_score) if interview_stats.average_score else None,
                "last_interview_date": interview_stats.last_interview_date.isoformat() if interview_stats.last_interview_date else None
            }
            candidates_data.append(candidate_dict)
        
        total = query.count()
        
        return {
            "candidates": candidates_data,
            "total": total,
            "skip": skip,
            "limit": limit
        }
        
    except Exception as e:
        logger.error(f"Error fetching candidates: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to fetch candidates")

@router.post("/", response_model=dict)
async def create_candidate(
    name: str = Form(...),
    email: str = Form(...),
    phone: Optional[str] = Form(None),
    location: Optional[str] = Form(None),
    experience_years: Optional[int] = Form(None),
    skills: Optional[str] = Form(None),
    resume: Optional[UploadFile] = File(None),
    db: DBSession = Depends(get_db)
):
    """Create a new candidate with optional resume upload"""
    try:
        # Check if candidate with email already exists
        existing = db.query(Candidate).filter(Candidate.email == email).first()
        if existing:
            raise HTTPException(status_code=400, detail="Candidate with this email already exists")
        
        # Parse skills if provided
        skills_list = []
        if skills:
            try:
                skills_list = json.loads(skills) if skills.startswith('[') else [s.strip() for s in skills.split(',') if s.strip()]
            except:
                skills_list = [s.strip() for s in skills.split(',') if s.strip()]
        
        # Create candidate
        candidate_data = {
            "name": name,
            "email": email,
            "phone": phone,
            "location": location,
            "experience_years": experience_years,
            "skills": skills_list,
            "status": "active",
            "created_at": datetime.utcnow(),
            "updated_at": datetime.utcnow()
        }
        
        # Handle resume upload and parsing
        if resume:
            try:
                # Save resume file
                resume_content = await resume.read()
                resume_filename = f"resume_{email.replace('@', '_')}_{resume.filename}"
                
                # Parse resume for additional candidate information
                parsed_data = await parse_resume(resume_content, resume.filename)
                
                # Update candidate data with parsed information
                if parsed_data:
                    if parsed_data.get('name') and not candidate_data['name']:
                        candidate_data['name'] = parsed_data['name']
                    if parsed_data.get('phone') and not candidate_data['phone']:
                        candidate_data['phone'] = parsed_data['phone']
                    if parsed_data.get('location') and not candidate_data['location']:
                        candidate_data['location'] = parsed_data['location']
                    if parsed_data.get('experience_years') and not candidate_data['experience_years']:
                        candidate_data['experience_years'] = parsed_data['experience_years']
                    if parsed_data.get('skills') and not candidate_data['skills']:
                        candidate_data['skills'] = parsed_data['skills']
                
                candidate_data['resume_url'] = f"/uploads/resumes/{resume_filename}"
                
            except Exception as e:
                logger.warning(f"Resume parsing failed: {str(e)}")
                # Continue without parsed data
        
        # Create candidate in database
        db_candidate = Candidate(**candidate_data)
        db.add(db_candidate)
        db.commit()
        db.refresh(db_candidate)
        
        return {
            "message": "Candidate created successfully",
            "candidate": {
                "id": db_candidate.id,
                "name": db_candidate.name,
                "email": db_candidate.email,
                "status": db_candidate.status
            }
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error creating candidate: {str(e)}")
        db.rollback()
        raise HTTPException(status_code=500, detail="Failed to create candidate")


@router.post("/json", response_model=dict)
async def create_candidate_json(
    candidate_data: CandidateCreate,
    db: DBSession = Depends(get_db)
):
    """Create a new candidate with JSON data including resume text"""
    try:
        # Check if candidate with email already exists
        existing = db.query(Candidate).filter(Candidate.email == candidate_data.email).first()
        if existing:
            raise HTTPException(status_code=400, detail="Candidate with this email already exists")
        
        # Create candidate with resume text
        db_candidate = Candidate(
            name=candidate_data.name,
            email=candidate_data.email,
            phone=candidate_data.phone,
            location=candidate_data.location,
            experience_years=candidate_data.experience_years,
            skills=candidate_data.skills,
            resume_text=candidate_data.resume_text,
            status=candidate_data.status or "active",
            created_at=datetime.utcnow(),
            updated_at=datetime.utcnow()
        )
        
        db.add(db_candidate)
        db.commit()
        db.refresh(db_candidate)
        
        return {
            "message": "Candidate created successfully",
            "candidate": {
                "id": db_candidate.id,
                "name": db_candidate.name,
                "email": db_candidate.email,
                "status": db_candidate.status,
                "has_resume": bool(db_candidate.resume_text)
            }
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error creating candidate: {str(e)}")
        db.rollback()
        raise HTTPException(status_code=500, detail="Failed to create candidate")


@router.get("/{candidate_id}/details", response_model=dict)
async def get_candidate_details(candidate_id: int, db: DBSession = Depends(get_db)):
    """Get detailed candidate information including interview history"""
    try:
        candidate = db.query(Candidate).filter(Candidate.id == candidate_id).first()
        if not candidate:
            raise HTTPException(status_code=404, detail="Candidate not found")
        
        # Get interview history
        interviews = db.query(InterviewSession).filter(
            InterviewSession.candidate_id == candidate_id
        ).order_by(desc(InterviewSession.created_at)).all()
        
        interview_history = []
        for session in interviews:
            # Get session statistics
            total_turns = db.query(func.count(Turn.id)).filter(Turn.session_id == session.id).scalar()
            avg_turn_score = db.query(func.avg(Turn.turn_score)).filter(
                and_(Turn.session_id == session.id, Turn.turn_score.isnot(None))
            ).scalar()
            
            # Get proctoring events count
            proctor_events = db.query(func.count(ProctorEvent.id)).filter(
                ProctorEvent.session_id == session.id
            ).scalar()
            
            interview_history.append({
                "id": session.id,
                "session_token": session.session_token,
                "status": session.status,
                "started_at": session.started_at.isoformat() if session.started_at else None,
                "ended_at": session.ended_at.isoformat() if session.ended_at else None,
                "score": float(session.score) if session.score else None,
                "total_turns": total_turns or 0,
                "average_turn_score": float(avg_turn_score) if avg_turn_score else None,
                "proctor_events_count": proctor_events or 0,
                "duration_minutes": None,  # Calculate if needed
                "created_at": session.created_at.isoformat() if session.created_at else None
            })
        
        return {
            "candidate": {
                "id": candidate.id,
                "name": candidate.name,
                "email": candidate.email,
                "phone": candidate.phone,
                "location": candidate.location,
                "experience_years": candidate.experience_years,
                "skills": candidate.skills or [],
                "resume_url": candidate.resume_url,
                "status": candidate.status or "active",
                "created_at": candidate.created_at.isoformat() if candidate.created_at else None,
                "updated_at": candidate.updated_at.isoformat() if candidate.updated_at else None
            },
            "interview_history": interview_history,
            "statistics": {
                "total_interviews": len(interview_history),
                "completed_interviews": len([i for i in interview_history if i["status"] == "completed"]),
                "average_score": sum([i["score"] for i in interview_history if i["score"]]) / len([i for i in interview_history if i["score"]]) if any(i["score"] for i in interview_history) else None,
                "total_proctor_events": sum([i["proctor_events_count"] for i in interview_history])
            }
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error fetching candidate details: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to fetch candidate details")

@router.post("/{candidate_id}/parse-resume", response_model=dict)
async def parse_candidate_resume(
    candidate_id: int,
    resume: UploadFile = File(...),
    db: DBSession = Depends(get_db)
):
    """Parse and update candidate information from resume"""
    try:
        candidate = db.query(Candidate).filter(Candidate.id == candidate_id).first()
        if not candidate:
            raise HTTPException(status_code=404, detail="Candidate not found")
        
        # Parse resume
        resume_content = await resume.read()
        parsed_data = await parse_resume(resume_content, resume.filename)
        
        if not parsed_data:
            raise HTTPException(status_code=400, detail="Failed to parse resume")
        
        # Update candidate with parsed data
        updated_fields = []
        if parsed_data.get('name') and candidate.name != parsed_data['name']:
            candidate.name = parsed_data['name']
            updated_fields.append('name')
        
        if parsed_data.get('phone') and not candidate.phone:
            candidate.phone = parsed_data['phone']
            updated_fields.append('phone')
            
        if parsed_data.get('location') and not candidate.location:
            candidate.location = parsed_data['location']
            updated_fields.append('location')
            
        if parsed_data.get('experience_years') and not candidate.experience_years:
            candidate.experience_years = parsed_data['experience_years']
            updated_fields.append('experience_years')
            
        if parsed_data.get('skills'):
            # Merge skills
            existing_skills = set(candidate.skills or [])
            new_skills = set(parsed_data['skills'])
            combined_skills = list(existing_skills.union(new_skills))
            if combined_skills != candidate.skills:
                candidate.skills = combined_skills
                updated_fields.append('skills')
        
        # Save resume URL
        resume_filename = f"resume_{candidate.email.replace('@', '_')}_{resume.filename}"
        candidate.resume_url = f"/uploads/resumes/{resume_filename}"
        updated_fields.append('resume_url')
        
        candidate.updated_at = datetime.utcnow()
        
        db.commit()
        db.refresh(candidate)
        
        return {
            "message": "Resume parsed and candidate updated successfully",
            "updated_fields": updated_fields,
            "parsed_data": parsed_data
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error parsing resume: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to parse resume")

@router.put("/{candidate_id}", response_model=dict)
async def update_candidate(
    candidate_id: int,
    candidate_update: CandidateUpdate,
    db: DBSession = Depends(get_db)
):
    """Update candidate information"""
    try:
        candidate = db.query(Candidate).filter(Candidate.id == candidate_id).first()
        if not candidate:
            raise HTTPException(status_code=404, detail="Candidate not found")
        
        # Update fields
        update_data = candidate_update.dict(exclude_unset=True)
        
        for field, value in update_data.items():
            if field == 'skills' and value is not None:
                # Handle skills conversion
                if isinstance(value, str):
                    # Convert comma-separated string to list
                    skills_list = [skill.strip() for skill in value.split(',') if skill.strip()]
                    candidate.skills = skills_list
                elif isinstance(value, list):
                    candidate.skills = value
            elif hasattr(candidate, field):
                setattr(candidate, field, value)
        
        candidate.updated_at = datetime.utcnow()
        
        db.commit()
        db.refresh(candidate)
        
        return {
            "message": "Candidate updated successfully",
            "candidate": {
                "id": candidate.id,
                "name": candidate.name,
                "email": candidate.email,
                "status": candidate.status
            }
        }
        
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        logger.error(f"Error updating candidate: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to update candidate: {str(e)}")

@router.delete("/{candidate_id}", response_model=dict)
async def delete_candidate(candidate_id: int, db: DBSession = Depends(get_db)):
    """Force delete a candidate and all related data (for testing purposes)"""
    try:
        candidate = db.query(Candidate).filter(Candidate.id == candidate_id).first()
        if not candidate:
            raise HTTPException(status_code=404, detail="Candidate not found")
        
        # Get all invites for this candidate
        invites = db.query(Invite).filter(Invite.candidate_id == candidate_id).all()
        
        deleted_items = []
        
        # For each invite, delete all related sessions and their data
        for invite in invites:
            # Get all sessions for this invite
            sessions = db.query(InterviewSession).filter(InterviewSession.invite_id == invite.id).all()
            
            for session in sessions:
                # Delete all turns for this session
                db.query(Turn).filter(Turn.session_id == session.id).delete()
                deleted_items.append(f"turns for session {session.id}")
                
                # Delete all proctor events for this session
                db.query(ProctorEvent).filter(ProctorEvent.session_id == session.id).delete()
                deleted_items.append(f"proctor events for session {session.id}")
                
                # Delete the session
                db.delete(session)
                deleted_items.append(f"session {session.id}")
            
            # Delete the invite
            db.delete(invite)
            deleted_items.append(f"invite {invite.id}")
        
        # Finally, delete the candidate
        db.delete(candidate)
        deleted_items.append(f"candidate {candidate.name}")
        
        db.commit()
        
        return {
            "message": f"Candidate '{candidate.name}' and all related data deleted successfully",
            "action": "force_deleted",
            "deleted_items": deleted_items
        }
        
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        logger.error(f"Error deleting candidate: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to delete candidate: {str(e)}")

@router.delete("/all", response_model=dict)
async def delete_all_candidates(db: DBSession = Depends(get_db)):
    """Delete ALL candidates and related data (for testing purposes only)"""
    try:
        # Get all candidates
        candidates = db.query(Candidate).all()
        
        if not candidates:
            return {
                "message": "No candidates to delete",
                "action": "none",
                "deleted_count": 0
            }
        
        total_deleted = 0
        all_deleted_items = []
        
        for candidate in candidates:
            # Get all invites for this candidate
            invites = db.query(Invite).filter(Invite.candidate_id == candidate.id).all()
            
            # For each invite, delete all related sessions and their data
            for invite in invites:
                # Get all sessions for this invite
                sessions = db.query(InterviewSession).filter(InterviewSession.invite_id == invite.id).all()
                
                for session in sessions:
                    # Delete all turns for this session
                    turns_deleted = db.query(Turn).filter(Turn.session_id == session.id).delete()
                    if turns_deleted > 0:
                        all_deleted_items.append(f"{turns_deleted} turns for session {session.id}")
                    
                    # Delete all proctor events for this session
                    events_deleted = db.query(ProctorEvent).filter(ProctorEvent.session_id == session.id).delete()
                    if events_deleted > 0:
                        all_deleted_items.append(f"{events_deleted} proctor events for session {session.id}")
                    
                    # Delete the session
                    db.delete(session)
                    all_deleted_items.append(f"session {session.id}")
                
                # Delete the invite
                db.delete(invite)
                all_deleted_items.append(f"invite {invite.id}")
            
            # Delete the candidate
            db.delete(candidate)
            all_deleted_items.append(f"candidate {candidate.name}")
            total_deleted += 1
        
        db.commit()
        
        return {
            "message": f"Successfully deleted all {total_deleted} candidates and related data",
            "action": "bulk_force_deleted",
            "deleted_count": total_deleted,
            "deleted_items": all_deleted_items[:20] + ["..."] if len(all_deleted_items) > 20 else all_deleted_items
        }
        
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        logger.error(f"Error deleting all candidates: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to delete candidates: {str(e)}")

@router.get("/statistics", response_model=dict)
async def get_candidates_statistics(db: DBSession = Depends(get_db)):
    """Get candidates statistics for dashboard"""
    try:
        # Total candidates
        total_candidates = db.query(func.count(Candidate.id)).scalar()
        
        # Candidates by status
        status_stats = db.query(
            Candidate.status,
            func.count(Candidate.id).label('count')
        ).group_by(Candidate.status).all()
        
        status_counts = {status: count for status, count in status_stats}
        
        # Recent candidates (last 30 days)
        from datetime import timedelta
        thirty_days_ago = datetime.utcnow() - timedelta(days=30)
        recent_candidates = db.query(func.count(Candidate.id)).filter(
            Candidate.created_at >= thirty_days_ago
        ).scalar()
        
        # Average interview score
        avg_score = db.query(func.avg(InterviewSession.score)).filter(
            InterviewSession.score.isnot(None)
        ).scalar()
        
        return {
            "total_candidates": total_candidates or 0,
            "status_distribution": {
                "active": status_counts.get("active", 0),
                "inactive": status_counts.get("inactive", 0),
                "hired": status_counts.get("hired", 0),
                "rejected": status_counts.get("rejected", 0)
            },
            "recent_additions": recent_candidates or 0,
            "average_interview_score": float(avg_score) if avg_score else 0.0
        }
        
    except Exception as e:
        logger.error(f"Error fetching candidates statistics: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to fetch statistics")

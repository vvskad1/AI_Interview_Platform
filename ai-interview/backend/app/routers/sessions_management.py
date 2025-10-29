from fastapi import APIRouter, HTTPException, Depends, Query, status
from sqlalchemy.orm import Session as DBSession
from sqlalchemy import func, and_, or_, desc, asc
from typing import List, Optional
from datetime import datetime, timedelta
import json

from ..database import get_db
from ..models import Session, Invite, Candidate, Job, Turn, ProctorEvent
from ..schemas import (
    SessionResponse, SessionDetailsResponse, SessionsStatsResponse, 
    SessionUpdateRequest
)

router = APIRouter(prefix="/api/admin/sessions", tags=["Admin - Sessions"])

@router.get("/", response_model=dict)
async def get_all_sessions(
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=100),
    session_status: Optional[str] = Query(None),
    search: Optional[str] = Query(None),
    candidate_id: Optional[int] = Query(None),
    job_id: Optional[int] = Query(None),
    started_after: Optional[str] = Query(None),
    started_before: Optional[str] = Query(None),
    db: DBSession = Depends(get_db)
):
    """Get all interview sessions with advanced filtering and pagination"""
    
    try:
        # Build base query with joins
        query = db.query(
            Session,
            Candidate.name.label('candidate_name'),
            Candidate.email.label('candidate_email'),
            Job.title.label('job_title'),
            Job.department.label('job_department'),
            Invite.invite_code.label('invite_code')
        ).join(
            Invite, Session.invite_id == Invite.id
        ).join(
            Candidate, Invite.candidate_id == Candidate.id
        ).join(
            Job, Invite.job_id == Job.id
        )
        
        # Apply filters
        if session_status and session_status != 'all':
            query = query.filter(Session.status == session_status)
        
        if search:
            search_term = f"%{search}%"
            query = query.filter(
                or_(
                    Candidate.name.ilike(search_term),
                    Candidate.email.ilike(search_term),
                    Job.title.ilike(search_term),
                    Invite.invite_code.ilike(search_term)
                )
            )
        
        if candidate_id:
            query = query.filter(Invite.candidate_id == candidate_id)
            
        if job_id:
            query = query.filter(Invite.job_id == job_id)
        
        if started_after:
            try:
                after_date = datetime.fromisoformat(started_after.replace('Z', '+00:00'))
                query = query.filter(Session.started_at >= after_date)
            except ValueError:
                pass
                
        if started_before:
            try:
                before_date = datetime.fromisoformat(started_before.replace('Z', '+00:00'))
                query = query.filter(Session.started_at <= before_date)
            except ValueError:
                pass
        
        # Get total count
        total = query.count()
        
        # Apply pagination and ordering
        results = query.order_by(desc(Session.started_at)).offset(skip).limit(limit).all()
        
        # Format response with session details
        sessions_data = []
        for session, candidate_name, candidate_email, job_title, job_department, invite_code in results:
            # Get session duration
            duration = None
            if session.ended_at and session.started_at:
                duration = (session.ended_at - session.started_at).total_seconds() / 60  # in minutes
            elif session.started_at:
                duration = (datetime.now() - session.started_at).total_seconds() / 60  # current duration
            
            # Get turn statistics
            turn_stats = db.query(
                func.count(Turn.id).label('total_turns'),
                func.count(Turn.id).filter(Turn.turn_score.isnot(None)).label('completed_turns')
            ).filter(Turn.session_id == session.id).first()
            
            # Get proctor events count
            try:
                risk_events_count = db.query(func.count(ProctorEvent.id)).filter(
                    and_(
                        ProctorEvent.session_id == session.id,
                        ProctorEvent.severity.in_(['medium', 'high'])
                    )
                ).scalar() or 0
            except:
                risk_events_count = 0
            
            session_dict = {
                "id": session.id,
                "invite_id": session.invite_id,
                "invite_code": invite_code,
                "candidate_name": candidate_name,
                "candidate_email": candidate_email,
                "job_title": job_title,
                "job_department": job_department,
                "status": session.status,
                "started_at": session.started_at.isoformat() if session.started_at else None,
                "ended_at": session.ended_at.isoformat() if session.ended_at else None,
                "duration_minutes": round(duration, 2) if duration else None,
                "score": session.score,
                "score_category": session.score_category,  # Add score category
                "proctor_risk": 0.0,  # Default value since column doesn't exist
                "total_turns": turn_stats.total_turns or 0,
                "completed_turns": turn_stats.completed_turns or 0,
                "risk_events_count": risk_events_count,
                "is_active": session.status == 'started',
                "progress_percentage": (
                    (turn_stats.completed_turns / turn_stats.total_turns * 100) 
                    if turn_stats.total_turns and turn_stats.total_turns > 0 
                    else 0
                )
            }
            sessions_data.append(session_dict)
        
        return {
            "sessions": sessions_data,
            "total": total,
            "skip": skip,
            "limit": limit
        }
        
    except Exception as e:
        import traceback
        print(f"Sessions API Error: {str(e)}")
        print(f"Traceback: {traceback.format_exc()}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to fetch sessions: {str(e)}"
        )


@router.get("/stats", response_model=SessionsStatsResponse)
async def get_sessions_statistics(db: DBSession = Depends(get_db)):
    """Get comprehensive session statistics for dashboard"""
    
    try:
        # Basic session counts
        total_sessions = db.query(func.count(Session.id)).scalar() or 0
        active_sessions = db.query(func.count(Session.id)).filter(
            Session.status == 'started'
        ).scalar() or 0
        completed_sessions = db.query(func.count(Session.id)).filter(
            Session.status == 'completed'
        ).scalar() or 0
        abandoned_sessions = db.query(func.count(Session.id)).filter(
            Session.status == 'abandoned'
        ).scalar() or 0
        
        # Recent sessions (last 24 hours)
        yesterday = datetime.now() - timedelta(hours=24)
        recent_sessions = db.query(func.count(Session.id)).filter(
            Session.started_at >= yesterday
        ).scalar() or 0
        
        # Average session duration (completed sessions only)
        avg_duration_result = db.query(
            func.avg(
                func.extract('epoch', Session.ended_at - Session.started_at) / 60
            ).label('avg_duration_minutes')
        ).filter(
            and_(
                Session.status == 'completed',
                Session.ended_at.isnot(None),
                Session.started_at.isnot(None)
            )
        ).first()
        
        avg_duration = round(avg_duration_result.avg_duration_minutes, 2) if avg_duration_result.avg_duration_minutes else 0
        
        # Average completion rate
        completion_rate = (
            (completed_sessions / total_sessions * 100) 
            if total_sessions > 0 
            else 0
        )
        
        # Average score for completed sessions
        avg_score_result = db.query(func.avg(Session.score)).filter(
            and_(
                Session.status == 'completed',
                Session.score.isnot(None)
            )
        ).first()
        
        avg_score = round(avg_score_result[0], 2) if avg_score_result[0] else 0
        
        # High-risk sessions (placeholder since proctor_risk doesn't exist)
        high_risk_sessions = 0
        
        # Sessions by job breakdown
        job_breakdown = db.query(
            Job.title,
            Job.department,
            func.count(Session.id).label('session_count')
        ).join(
            Invite, Session.invite_id == Invite.id
        ).join(
            Job, Invite.job_id == Job.id
        ).group_by(
            Job.id, Job.title, Job.department
        ).order_by(
            desc(func.count(Session.id))
        ).limit(10).all()
        
        jobs_breakdown = [
            {
                "job_title": job.title,
                "job_department": job.department,
                "session_count": job.session_count
            }
            for job in job_breakdown
        ]
        
        # Recent activity (sessions started in last 7 days grouped by day)
        week_ago = datetime.now() - timedelta(days=7)
        daily_activity = db.query(
            func.date(Session.started_at).label('date'),
            func.count(Session.id).label('sessions_count')
        ).filter(
            Session.started_at >= week_ago
        ).group_by(
            func.date(Session.started_at)
        ).order_by(
            func.date(Session.started_at)
        ).all()
        
        activity_breakdown = [
            {
                "date": activity.date.isoformat() if activity.date else None,
                "sessions_count": activity.sessions_count
            }
            for activity in daily_activity
        ]
        
        return SessionsStatsResponse(
            total_sessions=total_sessions,
            active_sessions=active_sessions,
            completed_sessions=completed_sessions,
            abandoned_sessions=abandoned_sessions,
            recent_sessions=recent_sessions,
            avg_duration_minutes=avg_duration,
            completion_rate=round(completion_rate, 2),
            avg_score=avg_score,
            high_risk_sessions=high_risk_sessions,
            jobs_breakdown=jobs_breakdown,
            activity_breakdown=activity_breakdown
        )
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to fetch session statistics: {str(e)}"
        )


@router.get("/{session_id}", response_model=SessionDetailsResponse)
async def get_session_details(session_id: int, db: DBSession = Depends(get_db)):
    """Get detailed information about a specific session"""
    
    try:
        # Get session with related data
        session_query = db.query(
            Session,
            Candidate.name.label('candidate_name'),
            Candidate.email.label('candidate_email'),
            Candidate.phone.label('candidate_phone'),
            Job.title.label('job_title'),
            Job.department.label('job_department'),
            Job.description.label('job_description'),
            Invite.invite_code.label('invite_code'),
            Invite.expires_at.label('invite_expires_at')
        ).join(
            Invite, Session.invite_id == Invite.id
        ).join(
            Candidate, Invite.candidate_id == Candidate.id
        ).join(
            Job, Invite.job_id == Job.id
        ).filter(Session.id == session_id).first()
        
        if not session_query:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Session not found"
            )
        
        session = session_query[0]
        
        # Get all turns for this session
        # Get all turns for this session
        turns = db.query(Turn).filter(Turn.session_id == session_id).order_by(Turn.question_number).all()
        
        turns_data = []
        for turn in turns:
            turn_dict = {
                "id": turn.id,
                "idx": turn.question_number,
                "question_text": turn.question_text,
                "ai_response": turn.ai_evaluation.get('response', '') if turn.ai_evaluation else '',
                "transcript": turn.audio_transcript,
                "turn_score": turn.turn_score,
                "started_at": turn.started_at.isoformat() if turn.started_at else None,
                "ended_at": turn.ended_at.isoformat() if turn.ended_at else None,
                "status": "completed" if turn.turn_score is not None else "pending"
            }
            turns_data.append(turn_dict)
        
        # Get proctor events
        proctor_events = db.query(ProctorEvent).filter(
            ProctorEvent.session_id == session_id
        ).order_by(ProctorEvent.timestamp).all()
        
        events_data = []
        for event in proctor_events:
            event_dict = {
                "id": event.id,
                "event_type": event.event_type,
                "risk_level": event.severity or "low",
                "description": f"{event.event_type} event",
                "timestamp": event.timestamp.isoformat() if event.timestamp else None,
                "metadata": event.event_data or {}
            }
            events_data.append(event_dict)
        
        # Calculate session metrics
        duration_minutes = None
        if session.ended_at and session.started_at:
            duration_minutes = (session.ended_at - session.started_at).total_seconds() / 60
        elif session.started_at:
            duration_minutes = (datetime.now() - session.started_at).total_seconds() / 60
        
        # Detailed response
        session_details = SessionDetailsResponse(
            id=session.id,
            invite_id=session.invite_id,
            invite_code=session_query.invite_code,
            candidate_name=session_query.candidate_name,
            candidate_email=session_query.candidate_email,
            candidate_phone=session_query.candidate_phone,
            job_title=session_query.job_title,
            job_department=session_query.job_department,
            job_description=session_query.job_description,
            status=session.status,
            started_at=session.started_at,
            ended_at=session.ended_at,
            duration_minutes=round(duration_minutes, 2) if duration_minutes else None,
            score=session.score,
            score_category=session.score_category,  # Add score category
            proctor_risk=0.0,  # Default value
            turns=turns_data,
            proctor_events=events_data,
            invite_expires_at=session_query.invite_expires_at
        )
        
        return session_details
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to fetch session details: {str(e)}"
        )


@router.put("/{session_id}", response_model=dict)
async def update_session(
    session_id: int, 
    update_data: SessionUpdateRequest, 
    db: DBSession = Depends(get_db)
):
    """Update session details (admin only)"""
    
    try:
        session = db.query(Session).filter(Session.id == session_id).first()
        
        if not session:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Session not found"
            )
        
        # Update allowed fields
        if update_data.status is not None:
            session.status = update_data.status
            
            # Auto-set ended_at when marking as completed or abandoned
            if update_data.status in ['completed', 'abandoned'] and not session.ended_at:
                session.ended_at = datetime.now()
        
        if update_data.score is not None:
            session.score = update_data.score
        
        # Skip proctor_risk update since column doesn't exist
        # if update_data.proctor_risk is not None:
        #     session.proctor_risk = update_data.proctor_risk
        
        db.commit()
        db.refresh(session)
        
        return {
            "message": "Session updated successfully",
            "session_id": session.id,
            "status": session.status,
            "score": session.score,
            "proctor_risk": 0.0
        }
        
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to update session: {str(e)}"
        )


@router.delete("/{session_id}", response_model=dict)
async def delete_session(session_id: int, db: DBSession = Depends(get_db)):
    """Delete a session (admin only - use with caution)"""
    
    try:
        session = db.query(Session).filter(Session.id == session_id).first()
        
        if not session:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Session not found"
            )
        
        # Check if session has related data that prevents deletion
        turn_count = db.query(func.count(Turn.id)).filter(Turn.session_id == session_id).scalar()
        event_count = db.query(func.count(ProctorEvent.id)).filter(
            ProctorEvent.session_id == session_id
        ).scalar()
        
        if turn_count > 0 or event_count > 0:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Cannot delete session with existing data (turns: {turn_count}, events: {event_count}). Consider marking as abandoned instead."
            )
        
        db.delete(session)
        db.commit()
        
        return {
            "message": "Session deleted successfully",
            "session_id": session_id
        }
        
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to delete session: {str(e)}"
        )


@router.get("/active/monitor", response_model=dict)
async def get_active_sessions_monitor(db: DBSession = Depends(get_db)):
    """Get real-time monitoring data for active sessions"""
    
    try:
        # Get all active sessions with live data
        active_sessions = db.query(
            Session,
            Candidate.name.label('candidate_name'),
            Job.title.label('job_title'),
            Invite.invite_code.label('invite_code')
        ).join(
            Invite, Session.invite_id == Invite.id
        ).join(
            Candidate, Invite.candidate_id == Candidate.id
        ).join(
            Job, Invite.job_id == Job.id
        ).filter(
            Session.status == 'started'
        ).order_by(Session.started_at).all()
        
        monitor_data = []
        for session, candidate_name, job_title, invite_code in active_sessions:
            # Get current session metrics
            current_duration = (datetime.now() - session.started_at).total_seconds() / 60
            
            # Get turn progress
            turn_stats = db.query(
                func.count(Turn.id).label('total_turns'),
                func.count(Turn.id).filter(Turn.turn_score.isnot(None)).label('completed_turns'),
                func.max(Turn.started_at).label('last_turn_time')
            ).filter(Turn.session_id == session.id).first()
            
            # Get recent proctor events (last 5 minutes)
            recent_threshold = datetime.now() - timedelta(minutes=5)
            recent_events = db.query(func.count(ProctorEvent.id)).filter(
                and_(
                    ProctorEvent.session_id == session.id,
                    ProctorEvent.timestamp >= recent_threshold,
                    ProctorEvent.severity.in_(['medium', 'high'])
                )
            ).scalar() or 0
            
            session_monitor = {
                "session_id": session.id,
                "candidate_name": candidate_name,
                "job_title": job_title,
                "invite_code": invite_code,
                "started_at": session.started_at.isoformat(),
                "current_duration_minutes": round(current_duration, 2),
                "total_turns": turn_stats.total_turns or 0,
                "completed_turns": turn_stats.completed_turns or 0,
                "last_activity": turn_stats.last_turn_time.isoformat() if turn_stats.last_turn_time else None,
                "current_risk_level": 0.0,  # Default since proctor_risk doesn't exist
                "recent_risk_events": 0,  # Default since we can't get recent events
                "is_stalled": (
                    turn_stats.last_turn_time is None or 
                    (datetime.now() - turn_stats.last_turn_time).total_seconds() > 600  # 10 minutes
                ) if turn_stats.last_turn_time else True
            }
            monitor_data.append(session_monitor)
        
        return {
            "active_sessions": monitor_data,
            "total_active": len(monitor_data),
            "last_updated": datetime.now().isoformat()
        }
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to fetch active sessions monitor: {str(e)}"
        )
from fastapi import APIRouter, Depends, HTTPException, Query, BackgroundTasks
from fastapi.responses import StreamingResponse, FileResponse
from sqlalchemy.orm import Session, joinedload
from sqlalchemy import func, desc, asc, and_, or_, case, extract
from typing import List, Optional, Dict, Any
import io
import csv
import json
import zipfile
import tempfile
import os
from datetime import datetime, timedelta

from ..database import get_db
from ..models import Session as SessionModel, Turn, Candidate, Job, ProctorEvent, Invite
from ..schemas import (
    ReportSummary, ReportFilter, ReportAnalytics, 
    BulkReportRequest, ReportExportResponse
)
from ..services.report import report_service
from ..services.proctor_signals import proctor_signals

router = APIRouter()


@router.get("/", response_model=List[ReportSummary])
def get_all_reports(
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=100),
    search: Optional[str] = Query(None),
    sort_by: str = Query("started_at"),
    sort_order: str = Query("desc"),
    date_from: Optional[datetime] = Query(None),
    date_to: Optional[datetime] = Query(None),
    job_id: Optional[int] = Query(None),
    department: Optional[str] = Query(None),
    status: Optional[str] = Query(None),
    min_score: Optional[float] = Query(None),
    max_score: Optional[float] = Query(None),
    risk_level: Optional[str] = Query(None),
    db: Session = Depends(get_db)
):
    """Get paginated list of interview reports with filtering and search"""
    
    query = db.query(SessionModel).join(Invite).join(Candidate).join(Job)
    
    # Apply filters
    if search:
        search_term = f"%{search}%"
        query = query.filter(
            or_(
                Candidate.name.ilike(search_term),
                Candidate.email.ilike(search_term),
                Job.title.ilike(search_term),
                Job.department.ilike(search_term)
            )
        )
    
    if date_from:
        query = query.filter(SessionModel.started_at >= date_from)
    if date_to:
        query = query.filter(SessionModel.started_at <= date_to)
    if job_id:
        query = query.filter(Invite.job_id == job_id)
    if department:
        query = query.filter(Job.department == department)
    if status:
        query = query.filter(SessionModel.status == status)
    if min_score is not None:
        query = query.filter(SessionModel.overall_score >= min_score)
    if max_score is not None:
        query = query.filter(SessionModel.overall_score <= max_score)
    
    # Apply sorting
    sort_column = getattr(SessionModel, sort_by, SessionModel.started_at)
    if sort_order == "desc":
        query = query.order_by(desc(sort_column))
    else:
        query = query.order_by(asc(sort_column))
    
    # Execute query with pagination
    sessions = query.offset(skip).limit(limit).all()
    
    # Build response
    reports = []
    for session in sessions:
        # Calculate session metrics
        total_questions = db.query(Turn).filter(Turn.session_id == session.id).count()
        answered_questions = db.query(Turn).filter(
            Turn.session_id == session.id,
            Turn.answer_text.isnot(None),
            Turn.answer_text != ""
        ).count()
        
        completion_rate = (answered_questions / total_questions * 100) if total_questions > 0 else 0.0
        
        duration_minutes = None
        if session.ended_at and session.started_at:
            duration = session.ended_at - session.started_at
            duration_minutes = duration.total_seconds() / 60
        
        # Get risk assessment
        risk_assessment = proctor_signals.get_risk_assessment(session.id, db)
        
        report = ReportSummary(
            id=session.id,
            session_id=session.id,
            candidate_name=session.invite.candidate.name,
            candidate_email=session.invite.candidate.email,
            job_title=session.invite.job.title,
            department=session.invite.job.department or "Not Specified",
            session_status=session.status,
            overall_score=session.score,  # Use 'score' field from Session model
            risk_score=risk_assessment['risk_score'],
            risk_level=risk_assessment['risk_level'],
            started_at=session.started_at,
            ended_at=session.ended_at,
            duration_minutes=duration_minutes,
            total_questions=total_questions,
            answered_questions=answered_questions,
            completion_rate=completion_rate
        )
        reports.append(report)
    
    return reports


@router.options("/analytics")
async def analytics_options():
    """Handle CORS preflight for analytics endpoint"""
    return {"message": "OK"}


@router.get("/analytics", response_model=ReportAnalytics)
def get_reports_analytics(
    date_from: Optional[datetime] = Query(None),
    date_to: Optional[datetime] = Query(None),
    department: Optional[str] = Query(None),
    db: Session = Depends(get_db)
):
    """Get comprehensive analytics for interview reports"""
    
    # Base query
    query = db.query(SessionModel).join(Invite).join(Candidate).join(Job)
    
    # Apply filters
    if date_from:
        query = query.filter(SessionModel.started_at >= date_from)
    if date_to:
        query = query.filter(SessionModel.started_at <= date_to)
    if department:
        query = query.filter(Job.department == department)
    
    sessions = query.all()
    
    if not sessions:
        return ReportAnalytics(
            total_reports=0,
            avg_completion_rate=0.0,
            avg_overall_score=0.0,
            avg_risk_score=0.0,
            reports_by_status={},
            reports_by_department={},
            reports_by_risk_level={},
            score_distribution={},
            completion_trends=[]
        )
    
    # Calculate metrics
    total_reports = len(sessions)
    total_score = 0
    total_risk_score = 0
    total_completion_rate = 0
    valid_scores = 0
    
    status_counts = {}
    department_counts = {}
    risk_level_counts = {}
    score_ranges = {"0-2": 0, "2-4": 0, "4-6": 0, "6-8": 0, "8-10": 0}
    
    for session in sessions:
        # Status breakdown
        status_counts[session.status] = status_counts.get(session.status, 0) + 1
        
        # Department breakdown
        dept = session.invite.job.department or "Not Specified"
        department_counts[dept] = department_counts.get(dept, 0) + 1
        
        # Calculate completion rate
        total_questions = db.query(Turn).filter(Turn.session_id == session.id).count()
        answered_questions = db.query(Turn).filter(
            Turn.session_id == session.id,
            Turn.answer_text.isnot(None),
            Turn.answer_text != ""
        ).count()
        
        completion_rate = (answered_questions / total_questions * 100) if total_questions > 0 else 0.0
        total_completion_rate += completion_rate
        
        # Score calculations
        if session.score is not None:
            total_score += session.score
            valid_scores += 1
            
            # Score distribution
            if session.score < 2:
                score_ranges["0-2"] += 1
            elif session.score < 4:
                score_ranges["2-4"] += 1
            elif session.score < 6:
                score_ranges["4-6"] += 1
            elif session.score < 8:
                score_ranges["6-8"] += 1
            else:
                score_ranges["8-10"] += 1
        
        # Risk assessment
        risk_assessment = proctor_signals.get_risk_assessment(session.id, db)
        risk_level_counts[risk_assessment['risk_level']] = risk_level_counts.get(risk_assessment['risk_level'], 0) + 1
        total_risk_score += risk_assessment['risk_score']
    
    # Calculate averages
    avg_completion_rate = total_completion_rate / total_reports
    avg_overall_score = total_score / valid_scores if valid_scores > 0 else 0.0
    avg_risk_score = total_risk_score / total_reports
    
    # Completion trends (last 30 days by week)
    completion_trends = []
    if date_from is None:
        date_from = datetime.utcnow() - timedelta(days=30)
    
    # Group by week
    weekly_sessions = db.query(
        func.date_trunc('week', SessionModel.started_at).label('week'),
        func.count(SessionModel.id).label('count')
    ).filter(
        SessionModel.started_at >= date_from
    ).group_by(
        func.date_trunc('week', SessionModel.started_at)
    ).order_by(
        func.date_trunc('week', SessionModel.started_at)
    ).all()
    
    for week_data in weekly_sessions:
        completion_trends.append({
            "period": week_data.week.strftime("%Y-%m-%d"),
            "count": week_data.count
        })
    
    return ReportAnalytics(
        total_reports=total_reports,
        avg_completion_rate=avg_completion_rate,
        avg_overall_score=avg_overall_score,
        avg_risk_score=avg_risk_score,
        reports_by_status=status_counts,
        reports_by_department=department_counts,
        reports_by_risk_level=risk_level_counts,
        score_distribution=score_ranges,
        completion_trends=completion_trends
    )


@router.get("/{session_id}/download")
def download_report(
    session_id: int,
    format: str = Query("pdf", regex="^(pdf|json)$"),
    db: Session = Depends(get_db)
):
    """Download individual report in specified format"""
    
    # Validate session exists
    session = db.query(SessionModel).filter(SessionModel.id == session_id).first()
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
    
    try:
        if format == "pdf":
            # Generate PDF report
            pdf_bytes = report_service.generate_session_report(session_id, db)
            
            return StreamingResponse(
                io.BytesIO(pdf_bytes),
                media_type="application/pdf",
                headers={
                    "Content-Disposition": f"attachment; filename=interview_report_{session_id}.pdf"
                }
            )
            
        elif format == "json":
            # Generate JSON report
            json_data = _generate_json_report(session_id, db)
            json_str = json.dumps(json_data, indent=2, default=str)
            
            return StreamingResponse(
                io.BytesIO(json_str.encode()),
                media_type="application/json",
                headers={
                    "Content-Disposition": f"attachment; filename=interview_report_{session_id}.json"
                }
            )
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error generating report: {str(e)}")


@router.post("/bulk-export", response_model=ReportExportResponse)
def bulk_export_reports(
    request: BulkReportRequest,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db)
):
    """Export multiple reports in bulk"""
    
    if not request.session_ids:
        raise HTTPException(status_code=400, detail="No session IDs provided")
    
    # Validate all sessions exist
    sessions = db.query(SessionModel).filter(SessionModel.id.in_(request.session_ids)).all()
    if len(sessions) != len(request.session_ids):
        found_ids = [s.id for s in sessions]
        missing_ids = [sid for sid in request.session_ids if sid not in found_ids]
        raise HTTPException(status_code=400, detail=f"Sessions not found: {missing_ids}")
    
    try:
        if request.format == "pdf":
            return _bulk_export_pdf(sessions, request.include_analytics, db)
        elif request.format == "csv":
            return _bulk_export_csv(sessions, request.include_analytics, db)
        elif request.format == "excel":
            return _bulk_export_excel(sessions, request.include_analytics, db)
        else:
            raise HTTPException(status_code=400, detail="Unsupported export format")
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error creating bulk export: {str(e)}")


@router.delete("/{session_id}")
def delete_report(session_id: int, db: Session = Depends(get_db)):
    """Delete session and associated report data"""
    
    session = db.query(SessionModel).filter(SessionModel.id == session_id).first()
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
    
    try:
        # Delete associated data
        db.query(Turn).filter(Turn.session_id == session_id).delete()
        db.query(ProctorEvent).filter(ProctorEvent.session_id == session_id).delete()
        db.delete(session)
        db.commit()
        
        return {"message": f"Report for session {session_id} deleted successfully"}
    
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Error deleting report: {str(e)}")


# Helper functions
def _generate_json_report(session_id: int, db: Session) -> dict:
    """Generate comprehensive JSON report data"""
    
    session = db.query(SessionModel).options(
        joinedload(SessionModel.invite).joinedload(Invite.candidate),
        joinedload(SessionModel.invite).joinedload(Invite.job)
    ).filter(SessionModel.id == session_id).first()
    
    turns = db.query(Turn).filter(Turn.session_id == session_id).order_by(Turn.idx).all()
    risk_assessment = proctor_signals.get_risk_assessment(session_id, db)
    
    return {
        "session_info": {
            "id": session.id,
            "candidate": {
                "name": session.invite.candidate.name,
                "email": session.invite.candidate.email
            },
            "job": {
                "title": session.invite.job.title,
                "department": session.invite.job.department
            },
            "started_at": session.started_at.isoformat(),
            "ended_at": session.ended_at.isoformat() if session.ended_at else None,
            "status": session.status,
            "overall_score": session.overall_score
        },
        "interview_data": [
            {
                "question_number": turn.idx,
                "prompt": turn.prompt,
                "answer": turn.answer_text,
                "scores": turn.scores_json,
                "status": turn.status,
                "start_time": turn.start_time.isoformat(),
                "submitted_at": turn.submitted_at.isoformat() if turn.submitted_at else None
            } for turn in turns
        ],
        "proctoring": risk_assessment,
        "generated_at": datetime.utcnow().isoformat()
    }


def _bulk_export_pdf(sessions: List[SessionModel], include_analytics: bool, db: Session) -> ReportExportResponse:
    """Create bulk PDF export as ZIP file"""
    
    # Create temporary directory
    temp_dir = tempfile.mkdtemp()
    zip_path = os.path.join(temp_dir, f"interview_reports_{datetime.utcnow().strftime('%Y%m%d_%H%M%S')}.zip")
    
    try:
        with zipfile.ZipFile(zip_path, 'w') as zip_file:
            for session in sessions:
                pdf_bytes = report_service.generate_session_report(session.id, db)
                zip_file.writestr(f"interview_report_{session.id}.pdf", pdf_bytes)
            
            if include_analytics:
                analytics = get_reports_analytics(db=db)
                analytics_json = json.dumps(analytics.dict(), indent=2, default=str)
                zip_file.writestr("analytics_summary.json", analytics_json)
        
        file_size = os.path.getsize(zip_path)
        
        return ReportExportResponse(
            success=True,
            message=f"Successfully exported {len(sessions)} reports",
            download_url=f"/tmp/download/{os.path.basename(zip_path)}",
            file_size=file_size
        )
    
    except Exception as e:
        return ReportExportResponse(
            success=False,
            message=f"Error creating PDF export: {str(e)}"
        )


def _bulk_export_csv(sessions: List[SessionModel], include_analytics: bool, db: Session) -> ReportExportResponse:
    """Create bulk CSV export"""
    
    temp_dir = tempfile.mkdtemp()
    csv_path = os.path.join(temp_dir, f"interview_reports_{datetime.utcnow().strftime('%Y%m%d_%H%M%S')}.csv")
    
    try:
        with open(csv_path, 'w', newline='', encoding='utf-8') as csvfile:
            writer = csv.writer(csvfile)
            
            # Header row
            writer.writerow([
                'Session ID', 'Candidate Name', 'Candidate Email', 'Job Title', 'Department',
                'Status', 'Overall Score', 'Risk Score', 'Risk Level', 'Started At', 'Ended At',
                'Duration (minutes)', 'Total Questions', 'Answered Questions', 'Completion Rate'
            ])
            
            for session in sessions:
                # Calculate metrics
                total_questions = db.query(Turn).filter(Turn.session_id == session.id).count()
                answered_questions = db.query(Turn).filter(
                    Turn.session_id == session.id,
                    Turn.answer_text.isnot(None),
                    Turn.answer_text != ""
                ).count()
                
                completion_rate = (answered_questions / total_questions * 100) if total_questions > 0 else 0.0
                
                duration_minutes = None
                if session.ended_at and session.started_at:
                    duration = session.ended_at - session.started_at
                    duration_minutes = round(duration.total_seconds() / 60, 2)
                
                risk_assessment = proctor_signals.get_risk_assessment(session.id, db)
                
                writer.writerow([
                    session.id,
                    session.invite.candidate.name,
                    session.invite.candidate.email,
                    session.invite.job.title,
                    session.invite.job.department or "Not Specified",
                    session.status,
                    session.overall_score,
                    round(risk_assessment['risk_score'], 2),
                    risk_assessment['risk_level'],
                    session.started_at.strftime('%Y-%m-%d %H:%M:%S'),
                    session.ended_at.strftime('%Y-%m-%d %H:%M:%S') if session.ended_at else '',
                    duration_minutes,
                    total_questions,
                    answered_questions,
                    round(completion_rate, 2)
                ])
        
        file_size = os.path.getsize(csv_path)
        
        return ReportExportResponse(
            success=True,
            message=f"Successfully exported {len(sessions)} reports to CSV",
            download_url=f"/tmp/download/{os.path.basename(csv_path)}",
            file_size=file_size
        )
    
    except Exception as e:
        return ReportExportResponse(
            success=False,
            message=f"Error creating CSV export: {str(e)}"
        )


def _bulk_export_excel(sessions: List[SessionModel], include_analytics: bool, db: Session) -> ReportExportResponse:
    """Create bulk Excel export (placeholder - would need openpyxl)"""
    
    return ReportExportResponse(
        success=False,
        message="Excel export not implemented yet - use CSV format instead"
    )
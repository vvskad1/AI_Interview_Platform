from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session
import io

from ..database import get_db
from ..models import Session as SessionModel
from ..services.report import report_service

router = APIRouter()


@router.get("/{session_id}.pdf")
def download_session_report(session_id: int, db: Session = Depends(get_db)):
    """Generate and download PDF report for session"""
    
    # Validate session exists
    session = db.query(SessionModel).filter(SessionModel.id == session_id).first()
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
    
    try:
        # Generate PDF report
        pdf_bytes = report_service.generate_session_report(session_id, db)
        
        # Create response
        pdf_buffer = io.BytesIO(pdf_bytes)
        
        return StreamingResponse(
            io.BytesIO(pdf_bytes),
            media_type="application/pdf",
            headers={
                "Content-Disposition": f"attachment; filename=interview_report_{session_id}.pdf"
            }
        )
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error generating report: {str(e)}")
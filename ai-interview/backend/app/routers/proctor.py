from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from ..database import get_db
from ..models import ProctorEvent, Session as SessionModel
from ..schemas import ProctorEventRequest, ProctorEventResponse
from ..services.proctor_signals import proctor_signals

router = APIRouter()


@router.post("/{session_id}/event", response_model=ProctorEventResponse)
def record_proctor_event(
    session_id: int,
    request: ProctorEventRequest,
    db: Session = Depends(get_db)
):
    """Record proctoring event and update risk assessment"""
    
    # Validate session exists
    session = db.query(SessionModel).filter(SessionModel.id == session_id).first()
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
    
    # Create payload
    payload = {}
    if request.present is not None:
        payload['present'] = request.present
    if request.details:
        payload.update(request.details)
    
    # Create proctor event
    event = ProctorEvent(
        session_id=session_id,
        event_type=request.type,  # Use event_type field
        event_data=payload,       # Use event_data field
        severity='medium' if request.type in ['tab_hidden', 'multiple_faces'] else 'low'
    )
    db.add(event)
    db.commit()
    
    # Update risk assessment
    new_risk = proctor_signals.update_risk(session_id, request.type, payload, db)
    
    return ProctorEventResponse(risk=new_risk)
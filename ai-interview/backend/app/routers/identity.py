from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from ..database import get_db
from ..models import Invite, Candidate
from ..schemas import OTPSendRequest, OTPVerifyRequest, LivenessRequest
from ..services.emailer import email_service

router = APIRouter()


@router.post("/otp/send")
def send_otp(request: OTPSendRequest, db: Session = Depends(get_db)):
    """Send OTP code to candidate email"""
    
    # Validate invite exists
    invite = db.query(Invite).filter(Invite.id == request.invite_id).first()
    if not invite:
        raise HTTPException(status_code=404, detail="Invite not found")
    
    # Validate candidate email matches
    candidate = db.query(Candidate).filter(Candidate.id == invite.candidate_id).first()
    if not candidate or candidate.email != request.email:
        raise HTTPException(status_code=400, detail="Email does not match candidate")
    
    try:
        # Send OTP
        otp_code = email_service.send_otp(request.email, request.invite_id)
        return {"message": "OTP sent successfully", "expires_in": 600}
    
    except Exception as e:
        print(f"DEBUG: OTP sending failed: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to send OTP: {str(e)}")


@router.post("/otp/verify")
def verify_otp(request: OTPVerifyRequest, db: Session = Depends(get_db)):
    """Verify OTP code"""
    
    # Validate invite exists
    invite = db.query(Invite).filter(Invite.id == request.invite_id).first()
    if not invite:
        raise HTTPException(status_code=404, detail="Invite not found")
    
    # Validate candidate email matches
    candidate = db.query(Candidate).filter(Candidate.id == invite.candidate_id).first()
    if not candidate or candidate.email != request.email:
        raise HTTPException(status_code=400, detail="Email does not match candidate")
    
    # Verify OTP
    is_valid = email_service.verify_otp(request.email, request.invite_id, request.code)
    
    if not is_valid:
        raise HTTPException(status_code=400, detail="Invalid or expired OTP")
    
    return {"message": "OTP verified successfully", "verified": True}


@router.post("/liveness")
def verify_liveness(request: LivenessRequest, db: Session = Depends(get_db)):
    """
    Verify candidate liveness (stub implementation)
    In production, this would integrate with face detection/recognition services
    """
    
    # TODO: Implement actual liveness detection
    # For now, this is a stub that always returns success
    
    # Basic validation of metrics
    if not request.metrics:
        raise HTTPException(status_code=400, detail="Liveness metrics required")
    
    # Simulate liveness check
    confidence_score = request.metrics.get('confidence', 0.8)
    
    if confidence_score < 0.5:
        return {
            "verified": False,
            "confidence": confidence_score,
            "message": "Liveness verification failed"
        }
    
    return {
        "verified": True,
        "confidence": confidence_score,
        "message": "Liveness verified successfully"
    }
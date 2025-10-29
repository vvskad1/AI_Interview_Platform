from typing import Dict, Any, List
from sqlalchemy.orm import Session
from ..models import ProctorEvent


class ProctorSignals:
    """Handle proctoring event processing and risk assessment"""
    
    def __init__(self):
        # Risk weights for different event types
        self.risk_weights = {
            'tab_hidden': 15,
            'tab_visible': -5,
            'face_not_detected': 10,
            'face_detected': -3,
            'multiple_faces': 20,
            'audio_issues': 5,
            'network_issues': 5,
            'suspicious_activity': 25
        }
        
        # Maximum risk score
        self.max_risk = 100
    
    def update_risk(self, session_id: int, event_type: str, payload: Dict[str, Any], 
                   db: Session) -> float:
        """Update session risk based on new proctor event"""
        
        # Calculate risk delta based on event type
        risk_delta = self.risk_weights.get(event_type, 0)
        
        # Apply contextual modifiers
        if event_type == 'tab_hidden':
            # Increase risk if hidden for longer periods
            duration = payload.get('duration_seconds', 0)
            if duration > 30:
                risk_delta += min(duration // 10, 20)  # Cap additional risk
        
        elif event_type == 'face_not_detected':
            # Consider if it's just a brief moment or sustained
            confidence = payload.get('confidence', 0.5)
            if confidence < 0.3:
                risk_delta = int(risk_delta * 0.5)  # Reduce if low confidence
        
        # Calculate current risk from proctor events (since we don't store it in session)
        events = db.query(ProctorEvent).filter(ProctorEvent.session_id == session_id).all()
        high_risk_count = len([e for e in events if e.severity == 'high'])
        medium_risk_count = len([e for e in events if e.severity == 'medium'])
        current_risk = min((high_risk_count * 20 + medium_risk_count * 10), self.max_risk)
        
        # Calculate new risk
        new_risk = min(max(current_risk + risk_delta, 0), self.max_risk)
        
        # Note: We don't store risk in session model, it's calculated on-demand
        # from proctor events
        
        return new_risk
    
    def get_risk_assessment(self, session_id: int, db: Session) -> Dict[str, Any]:
        """Get comprehensive risk assessment for session"""
        
        # Get all proctor events for session
        events = db.query(ProctorEvent).filter(
            ProctorEvent.session_id == session_id
        ).order_by(ProctorEvent.timestamp).all()
        
        # Categorize events
        event_summary = {}
        for event in events:
            event_type = event.event_type
            if event_type not in event_summary:
                event_summary[event_type] = 0
            event_summary[event_type] += 1
        
        # Get current session
        from ..models import Session as SessionModel
        session = db.query(SessionModel).filter(SessionModel.id == session_id).first()
        
        # Calculate current risk based on event counts and severity
        high_risk_count = len([e for e in events if e.severity == 'high'])
        medium_risk_count = len([e for e in events if e.severity == 'medium'])
        
        # Simple risk calculation: high=20 points, medium=10 points
        current_risk = min((high_risk_count * 20 + medium_risk_count * 10), 100)
        
        # Determine risk level
        if current_risk >= 70:
            risk_level = "HIGH"
        elif current_risk >= 40:
            risk_level = "MEDIUM"
        else:
            risk_level = "LOW"
        
        # Generate flags
        flags = []
        if event_summary.get('tab_hidden', 0) > 5:
            flags.append("Frequent tab switching")
        if event_summary.get('face_not_detected', 0) > 10:
            flags.append("Face frequently not visible")
        if event_summary.get('multiple_faces', 0) > 0:
            flags.append("Multiple faces detected")
        
        return {
            'risk_score': current_risk,
            'risk_level': risk_level,
            'event_summary': event_summary,
            'flags': flags,
            'total_events': len(events)
        }
    
    def should_flag_session(self, session_id: int, db: Session) -> bool:
        """Determine if session should be flagged for review"""
        assessment = self.get_risk_assessment(session_id, db)
        return assessment['risk_score'] >= 60 or len(assessment['flags']) >= 2


# Global instance
proctor_signals = ProctorSignals()
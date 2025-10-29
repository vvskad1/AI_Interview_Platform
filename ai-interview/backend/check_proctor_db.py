#!/usr/bin/env python3
"""
Check proctor events in database
"""

import sys
import os

# Add backend to path
sys.path.insert(0, os.path.dirname(__file__))

from app.models import ProctorEvent, Session
from app.database import SessionLocal

def check_proctor_events():
    """Check proctor events in database"""
    
    db = SessionLocal()
    
    try:
        print("=" * 70)
        print("Checking Proctor Events in Database")
        print("=" * 70)
        
        # Get all proctor events
        events = db.query(ProctorEvent).order_by(ProctorEvent.timestamp.desc()).limit(20).all()
        
        if not events:
            print("\n❌ No proctor events found in database")
            print("\n💡 Tip: Start an interview and switch tabs to generate events")
            return
        
        print(f"\n📊 Found {len(events)} recent proctor events:\n")
        
        for event in events:
            session = db.query(Session).filter(Session.id == event.session_id).first()
            candidate_name = session.candidate.name if session and session.candidate else "Unknown"
            
            print(f"🔹 Event ID: {event.id}")
            print(f"   Session: {event.session_id} | Candidate: {candidate_name}")
            print(f"   Type: {event.event_type}")
            print(f"   Severity: {event.severity}")
            print(f"   Timestamp: {event.timestamp}")
            print(f"   Data: {event.event_data}")
            print()
        
        # Get risk scores per session
        print("\n" + "=" * 70)
        print("Risk Scores by Session")
        print("=" * 70)
        
        session_ids = set(event.session_id for event in events)
        
        for session_id in session_ids:
            session_events = [e for e in events if e.session_id == session_id]
            
            high_risk = sum(1 for e in session_events if e.severity == 'high')
            medium_risk = sum(1 for e in session_events if e.severity == 'medium')
            low_risk = sum(1 for e in session_events if e.severity == 'low')
            
            risk_score = min(high_risk * 20 + medium_risk * 10, 100)
            
            session = db.query(Session).filter(Session.id == session_id).first()
            candidate_name = session.candidate.name if session and session.candidate else "Unknown"
            
            print(f"\n📊 Session {session_id} ({candidate_name})")
            print(f"   Risk Score: {risk_score}/100")
            print(f"   High Severity: {high_risk} events")
            print(f"   Medium Severity: {medium_risk} events")
            print(f"   Low Severity: {low_risk} events")
        
        print("\n" + "=" * 70)
        
    finally:
        db.close()

if __name__ == "__main__":
    check_proctor_events()

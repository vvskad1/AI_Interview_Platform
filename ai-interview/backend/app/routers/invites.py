from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
import bcrypt
from datetime import datetime, timezone

from ..database import get_db
from ..models import Invite
from ..schemas import InviteTokenResponse

router = APIRouter()


@router.get("/{token}", response_model=InviteTokenResponse)
def get_invite_details(token: str, db: Session = Depends(get_db)):
    """
    Validate invite token and return invite details
    Token format: invite_code (simple 8-character code)
    """
    try:
        print(f"🔍 Validating token: '{token}' (length: {len(token)})")
        
        # Find invite by invite_code
        invite = db.query(Invite).filter(Invite.invite_code == token).first()
        if not invite:
            print(f"❌ No invite found for token: '{token}'")
            # Check if there are any invites in the database for debugging
            all_invites = db.query(Invite).all()
            print(f"📋 Available invite codes: {[inv.invite_code for inv in all_invites[-5:]]}")
            raise HTTPException(status_code=404, detail="Invite not found")
        
        print(f"✅ Found invite: ID={invite.id}, Status={invite.status}, Expires={invite.expires_at}")
        
        # Check if invite is still valid
        now = datetime.now(timezone.utc)
        
        if invite.status != "pending":
            print(f"❌ Invite status is '{invite.status}', not 'pending'")
            raise HTTPException(status_code=400, detail="Invite already used or expired")
        
        # Check if invite has expired (using expires_at field)
        # Handle timezone-aware comparison properly
        expires_at = invite.expires_at
        if expires_at.tzinfo is None:
            expires_at = expires_at.replace(tzinfo=timezone.utc)
        
        print(f"🕒 Time comparison: now={now}, expires={expires_at}")
        
        if now > expires_at:
            print(f"❌ Invite expired: {now} > {expires_at}")
            # Mark as expired
            invite.status = "expired"
            db.commit()
            raise HTTPException(status_code=400, detail="Interview window has expired")
        
        print(f"✅ Invite is valid and not expired")
        
        # Use created_at if available, otherwise use current time as fallback
        window_start = invite.created_at if invite.created_at else datetime.now(timezone.utc)
        
        return InviteTokenResponse(
            invite_id=invite.id,
            strict_mode=False,  # Default for now
            window_start=window_start,
            window_end=invite.expires_at
        )
    
    except HTTPException as he:
        print(f"❌ HTTPException during invite validation: {he.detail}")
        raise
    except Exception as e:
        print(f"❌ Unexpected error during invite validation: {str(e)}")
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=400, detail=f"Invalid token: {str(e)}")
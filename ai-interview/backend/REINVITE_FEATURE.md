# Reinvite Feature - Implementation Summary

## Overview
Added the ability to reinvite candidates for interviews, allowing them to take the interview again for practice or second chances.

## Requirements Met
1. ✅ Keep old interview data stored with timestamp
2. ✅ Added "Reinvite" button (with RefreshCw icon) in invite list
3. ✅ Allow reinvite for: expired, completed, and failed/incomplete interviews
4. ✅ No limit on number of reinvites

## Backend Changes

### 1. API Endpoint (`app/routers/admin.py`)
**New Route**: `POST /api/admin/invites/{invite_id}/reinvite`

**Features**:
- Takes original invite ID and optional `expires_at` parameter
- Creates a new invite with new invite_code
- Keeps original invite in database (for record-keeping)
- Defaults to 7 days expiry if not specified
- Sends new invitation email with calendar attachment
- Returns new invite_id and interview_url

**Code Location**: Lines 268-333

**Key Code**:
```python
@router.post("/invites/{invite_id}/reinvite", response_model=CreateInviteResponse)
def reinvite_candidate(
    invite_id: int,
    expires_at: Optional[str] = Form(None),
    db: Session = Depends(get_db)
):
    # Get original invite
    # Create new invite with new code
    # Send email
    # Return new invite details
```

### 2. Import Addition
Added `InviteStatus` to imports in `admin.py` line 10

## Frontend Changes

### 1. API Method (`frontend/src/api.ts`)
**New Method**: `reinviteCandidate(inviteId, expiresAt?)`

**Features**:
- Calls backend reinvite endpoint
- Optional expiry date parameter
- Returns new invite details

**Code Location**: Lines 221-233

### 2. UI Component (`frontend/src/components/admin/InvitesManagement.tsx`)

**New Handler Function**: `handleReinvite(invite)`
- Shows confirmation dialog
- Calculates new expiry (7 days from now)
- Calls API endpoint
- Refreshes invite list on success
- Shows alert with new invite ID

**Code Location**: Lines 212-253

**New Action Button**:
- Purple RefreshCw icon button
- Positioned between "View Details" and "Resend Email"
- Available for ALL invite statuses (pending, expired, used)
- Tooltip: "Reinvite Candidate"

**Code Location**: Lines 489-497

## User Flow

### Admin Perspective:
1. Go to Invites page in admin panel
2. Find any invite (expired, completed, or pending)
3. Click the purple RefreshCw (Reinvite) button
4. Confirm the reinvite in the dialog
5. System creates new invite and sends email
6. Success message shows new invite ID

### Candidate Perspective:
1. Receives new interview invitation email
2. New unique invite link/code
3. Can take the interview again
4. Previous interview data remains in database

## Database Behavior

### Old Invite:
- Remains in database unchanged
- Status stays as-is (expired/used/pending)
- All session data preserved
- Historical record maintained

### New Invite:
- New row in invites table
- New unique invite_code
- Status: "pending"
- Expires 7 days from creation (default)
- Links to same candidate_id and job_id

## Benefits

1. **Practice Interviews**: Candidates can retake for practice
2. **Second Chances**: Give candidates another opportunity
3. **Data Preservation**: All interview history kept for analytics
4. **Easy Workflow**: Single click to reinvite
5. **No Limits**: Unlimited reinvites supported

## Testing Checklist

- [ ] Reinvite expired invite → creates new invite
- [ ] Reinvite completed interview → creates new invite
- [ ] Reinvite pending invite → creates new invite
- [ ] Email sent successfully with new link
- [ ] Old interview data still accessible
- [ ] New interview works with new invite code
- [ ] Multiple reinvites for same candidate/job work
- [ ] Invite list refreshes after reinvite

## Notes

- Default expiry is 7 days but can be customized
- Reinvite button always visible (no status restrictions)
- Old invite data never deleted or modified
- Each reinvite generates completely new invite record
- Email service must be configured for email sending to work

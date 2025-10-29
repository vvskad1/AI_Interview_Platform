from datetime import datetime, timedelta


def generate_ics_file(candidate_name: str, job_title: str, interview_url: str, 
                     window_start: datetime, window_end: datetime) -> bytes:
    """Generate ICS calendar file for interview invitation"""
    
    # ICS file format
    ics_content = f"""BEGIN:VCALENDAR
VERSION:2.0
PRODID:-//Exatech Round 1 Interview//Interview Scheduler//EN
CALSCALE:GREGORIAN
METHOD:REQUEST
BEGIN:VEVENT
UID:{datetime.utcnow().strftime('%Y%m%d%H%M%S')}@exatech.com
DTSTAMP:{datetime.utcnow().strftime('%Y%m%dT%H%M%SZ')}
DTSTART:{window_start.strftime('%Y%m%dT%H%M%SZ')}
DTEND:{window_end.strftime('%Y%m%dT%H%M%SZ')}
SUMMARY:Exatech Round 1 Interview - {job_title}
DESCRIPTION:Exatech Round 1 Interview for {job_title} position\\n\\nCandidate: {candidate_name}\\n\\nInterview URL: {interview_url}\\n\\nPlease ensure you have a stable internet connection and test your microphone before the interview.
LOCATION:Online - {interview_url}
STATUS:CONFIRMED
TRANSP:OPAQUE
BEGIN:VALARM
TRIGGER:-PT15M
ACTION:DISPLAY
DESCRIPTION:Interview reminder - 15 minutes
END:VALARM
BEGIN:VALARM
TRIGGER:-PT1H
ACTION:DISPLAY
DESCRIPTION:Interview reminder - 1 hour
END:VALARM
END:VEVENT
END:VCALENDAR"""
    
    return ics_content.encode('utf-8')
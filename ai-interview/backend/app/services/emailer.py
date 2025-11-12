import smtplib
import ssl
import time
from email.mime.text import MIMEText as MimeText
from email.mime.multipart import MIMEMultipart as MimeMultipart
from email.mime.base import MIMEBase as MimeBase
from email import encoders
import random
import string
from typing import Optional
from ..config import settings
from ..database import get_redis


class EmailService:
    def __init__(self):
        self.smtp_host = settings.smtp_host
        self.smtp_port = settings.smtp_port
        self.smtp_user = settings.smtp_user
        self.smtp_pass = settings.smtp_pass
        self.mail_from = settings.mail_from
        self.smtp_configured = bool(self.smtp_user and self.smtp_pass)
        try:
            self.redis_client = get_redis()
        except Exception as e:
            print(f"Redis connection failed, using in-memory storage: {e}")
            self.redis_client = None
        self.memory_store = {}  # Fallback in-memory storage
    
    def _send_email(self, to_email: str, subject: str, body_html: str, attachment_data: Optional[bytes] = None, attachment_name: Optional[str] = None):
        """Send email with optional attachment"""
        if not self.smtp_configured:
            print(f"SMTP not configured - Email skipped: {subject} to {to_email}")
            return
            
        message = MimeMultipart("alternative")
        message["Subject"] = subject
        message["From"] = self.mail_from
        message["To"] = to_email
        
        # Add HTML body
        html_part = MimeText(body_html, "html")
        message.attach(html_part)
        
        # Add attachment if provided
        if attachment_data and attachment_name:
            part = MimeBase("application", "octet-stream")
            part.set_payload(attachment_data)
            encoders.encode_base64(part)
            part.add_header(
                "Content-Disposition",
                f"attachment; filename= {attachment_name}",
            )
            message.attach(part)
        
        # Send email
        context = ssl.create_default_context()
        with smtplib.SMTP(self.smtp_host, self.smtp_port) as server:
            server.starttls(context=context)
            server.login(self.smtp_user, self.smtp_pass)
            server.sendmail(self.mail_from, to_email, message.as_string())
    
    def send_otp(self, email: str, invite_id: int) -> str:
        """Send OTP code to email and store in Redis"""
        # Generate 6-digit OTP
        otp_code = ''.join(random.choices(string.digits, k=6))
        
        # Store in Redis with 10-minute expiration or fallback to memory
        redis_key = f"otp:{email}:{invite_id}"
        if self.redis_client:
            try:
                self.redis_client.setex(redis_key, 600, otp_code)
            except Exception as e:
                print(f"Redis store failed, using memory: {e}")
                self.memory_store[redis_key] = {"code": otp_code, "expires": time.time() + 600}
        else:
            self.memory_store[redis_key] = {"code": otp_code, "expires": time.time() + 600}
        
        # Send email
        subject = "Exatech Round 1 Interview - Verification Code"
        body_html = f"""
        <html>
        <body>
            <h2>Exatech Round 1 Interview</h2>
            <p>Your verification code is: <strong style="font-size: 24px; color: #007bff;">{otp_code}</strong></p>
            <p>This code will expire in 10 minutes.</p>
            <p>If you didn't request this code, please ignore this email.</p>
        </body>
        </html>
        """
        
        self._send_email(email, subject, body_html)
        return otp_code
    
    def verify_otp(self, email: str, invite_id: int, provided_code: str) -> bool:
        """Verify OTP code"""
        redis_key = f"otp:{email}:{invite_id}"
        
        if self.redis_client:
            try:
                stored_code = self.redis_client.get(redis_key)
                if stored_code and stored_code.decode() == provided_code:
                    # Clear the OTP after successful verification
                    self.redis_client.delete(redis_key)
                    return True
            except Exception as e:
                print(f"Redis verify failed, checking memory: {e}")
                # Fall through to memory check
        
        # Check memory store
        if redis_key in self.memory_store:
            stored_data = self.memory_store[redis_key]
            if time.time() < stored_data["expires"] and stored_data["code"] == provided_code:
                # Clear the OTP after successful verification
                del self.memory_store[redis_key]
                return True
            elif time.time() >= stored_data["expires"]:
                # Clean up expired OTP
                del self.memory_store[redis_key]
        
        return False
    
    def send_interview_invite(self, email: str, candidate_name: str, job_title: str, 
                            interview_url: str, window_start: str, window_end: str,
                            calendar_attachment: Optional[bytes] = None):
        """Send interview invitation with calendar attachment"""
        subject = f"Exatech Round 1 Interview Invitation - {job_title}"
        
        body_html = f"""
        <html>
        <body>
            <h2>Interview Invitation</h2>
            <p>Dear {candidate_name},</p>
            <p>You have been invited to participate in an Exatech Round 1 interview for the <strong>{job_title}</strong> position.</p>
            
            <h3>Interview Details:</h3>
            <ul>
                <li><strong>Interview Window:</strong> {window_start} to {window_end}</li>
                <li><strong>Duration:</strong> Approximately 30-45 minutes</li>
                <li><strong>Format:</strong> Voice responses to text questions</li>
            </ul>
            
            <h3>Before You Begin:</h3>
            <ul>
                <li>Ensure you have a stable internet connection</li>
                <li>Test your microphone and camera</li>
                <li>Find a quiet, well-lit space</li>
                <li>Have your resume ready for reference</li>
            </ul>
            
            <p><strong>Start Interview:</strong> <a href="{interview_url}" style="background-color: #007bff; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">Click Here</a></p>
            
            <h3>Important Notes:</h3>
            <ul>
                <li>The interview will be monitored for integrity</li>
                <li>Answer timing is enforced - prepare to think quickly</li>
                <li>You can only take the interview once during the specified window</li>
                <li>For technical support, please contact our team</li>
            </ul>
            
            <p>We look forward to learning more about you!</p>
            
            <p>Best regards,<br>Exatech Round 1 Interview Team</p>
            
            <hr>
            <small>
                <p>Privacy: Your interview data will be retained for {settings.retention_days} days as per our 
                <a href="{settings.privacy_policy_url}">Privacy Policy</a>.</p>
            </small>
        </body>
        </html>
        """
        
        attachment_name = "interview.ics" if calendar_attachment else None
        self._send_email(email, subject, body_html, calendar_attachment, attachment_name)


# Global instance
email_service = EmailService()
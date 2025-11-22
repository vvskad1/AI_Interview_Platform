from pydantic_settings import BaseSettings
from typing import Optional
import os


class Settings(BaseSettings):
    # Database
    database_url: str
    
    # GROQ API
    groq_api_key: str
    
    # URLs
    public_base_url: str = "http://localhost:5173"
    backend_base_url: str = "http://localhost:8000"
    
    # Email Configuration
    smtp_host: str = "smtp.gmail.com"
    smtp_port: int = 587
    smtp_user: str = ""
    smtp_pass: str = ""
    mail_from: str = "noreply@example.com"
    
    # Alternative names for docker-compose compatibility
    smtp_server: Optional[str] = None
    smtp_username: Optional[str] = None
    smtp_password: Optional[str] = None
    from_email: Optional[str] = None
    
    def __init__(self, **kwargs):
        super().__init__(**kwargs)
        # Map docker-compose variable names to internal names
        if self.smtp_server:
            self.smtp_host = self.smtp_server
        if self.smtp_username:
            self.smtp_user = self.smtp_username
        if self.smtp_password:
            self.smtp_pass = self.smtp_password
        if self.from_email:
            self.mail_from = self.from_email
    
    # Redis
    redis_url: str = "redis://localhost:6379/0"
    
    # JWT
    jwt_secret: str = "changeme"
    jwt_algorithm: str = "HS256"
    jwt_expiration_hours: int = 24
    
    # Privacy
    privacy_policy_url: str = "https://example.com/privacy"
    retention_days: int = 60
    
    # Timing Configuration
    answer_seconds: int = 120  # 2 minutes per question
    buffer_seconds: int = 10
    grace_seconds: int = 2
    
    # Interview Configuration
    max_questions: int = 15  # Structured 15-question interview
    max_retries: int = 5  # 5 buffer questions for failed audio
    
    # File Storage
    audio_storage_path: str = "audio_files"
    max_file_size_mb: int = 50
    
    class Config:
        env_file = ".env"
        case_sensitive = False


# Global settings instance
settings = Settings()

# Ensure audio storage directory exists
os.makedirs(settings.audio_storage_path, exist_ok=True)


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
    
    # Email Configuration - supports both naming conventions
    smtp_host: str = "smtp.gmail.com"
    smtp_server: Optional[str] = None
    smtp_port: int = 587
    smtp_user: str = ""
    smtp_username: Optional[str] = None
    smtp_pass: str = ""
    smtp_password: Optional[str] = None
    mail_from: str = "noreply@example.com"
    from_email: Optional[str] = None
    
    @property
    def effective_smtp_host(self) -> str:
        return self.smtp_server or self.smtp_host
    
    @property
    def effective_smtp_user(self) -> str:
        return self.smtp_username or self.smtp_user
    
    @property
    def effective_smtp_pass(self) -> str:
        return self.smtp_password or self.smtp_pass
    
    @property
    def effective_mail_from(self) -> str:
        return self.from_email or self.mail_from
    
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


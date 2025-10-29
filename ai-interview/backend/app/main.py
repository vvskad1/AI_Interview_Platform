from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
import os

# Import SSL configuration early to fix sentence transformers
from .services import startup_config

from .config import settings
from .database import create_tables
from .routers import admin, invites, identity, sessions, proctor, reports, candidates, jobs
from .routers import invites_management, sessions_management, reports_management

# Create FastAPI app
app = FastAPI(
    title="Exatech Round 1 Interview Platform",
    description="Automated interview platform with speech-to-text and AI evaluation",
    version="1.0.0"
)

# CORS middleware - Allow all origins and methods for development
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,  # Changed to False when using allow_origins=["*"]
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],  # Explicitly include OPTIONS
    allow_headers=["*"],      # Allow all headers
    expose_headers=["*"]      # Expose all response headers
)

# Global OPTIONS handler for CORS preflight requests
@app.options("/{path:path}")
async def handle_options(path: str):
    """Handle all OPTIONS requests for CORS preflight"""
    return {"message": "OK"}

# Include routers
app.include_router(admin.router, prefix="/api/admin", tags=["admin"])
app.include_router(candidates.router, tags=["candidates"])
app.include_router(jobs.router, tags=["jobs"])
app.include_router(invites_management.router, tags=["invites-management"])
app.include_router(sessions_management.router, tags=["sessions-management"])
app.include_router(reports_management.router, prefix="/api/admin/reports", tags=["admin-reports"])
app.include_router(invites.router, prefix="/invite", tags=["invites"])
app.include_router(identity.router, prefix="/identity", tags=["identity"])
app.include_router(sessions.router, prefix="/session", tags=["sessions"])
app.include_router(proctor.router, prefix="/proctor", tags=["proctor"])
app.include_router(reports.router, prefix="/reports", tags=["reports"])

# Serve audio files
if os.path.exists(settings.audio_storage_path):
    app.mount("/audio", StaticFiles(directory=settings.audio_storage_path), name="audio")


@app.on_event("startup")
async def startup_event():
    """Initialize database tables on startup"""
    create_tables()


@app.get("/")
async def root():
    return {
        "message": "Exatech Round 1 Interview Platform API",
        "version": "1.0.0",
        "status": "active"
    }


@app.get("/health")
async def health_check():
    return {"status": "healthy", "timestamp": "2025-01-08T12:00:00Z"}


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
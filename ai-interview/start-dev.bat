@echo off
echo ===========================================
echo AI Interview Platform - Development Setup
echo ===========================================
echo.

echo Setting up backend...
cd backend

echo Installing Python dependencies...
pip install -r requirements.txt
if errorlevel 1 (
    echo ERROR: Failed to install Python dependencies
    pause
    exit /b 1
)

echo.
echo Checking environment configuration...
if not exist .env (
    echo Creating .env from template...
    copy .env.example .env
    echo.
    echo IMPORTANT: Please edit backend/.env with your configuration:
    echo - Database URL
    echo - GROQ API key
    echo - Email SMTP settings
    echo - Redis URL
    echo.
    pause
)

echo.
echo Starting backend services...
echo Starting Redis server...
start "Redis Server" redis-server

echo Starting FastAPI server...
start "FastAPI Backend" uvicorn app.main:app --reload --host 0.0.0.0 --port 8000

cd ../frontend

echo.
echo Installing Node.js dependencies...
npm install
if errorlevel 1 (
    echo ERROR: Failed to install Node.js dependencies
    pause
    exit /b 1
)

echo.
echo Starting frontend development server...
start "React Frontend" npm run dev

echo.
echo ===========================================
echo Setup completed!
echo ===========================================
echo.
echo Backend API: http://localhost:8000
echo Frontend: http://localhost:5173
echo Admin Panel: http://localhost:5173/admin
echo API Documentation: http://localhost:8000/docs
echo.
echo Please ensure:
echo 1. PostgreSQL is running with ai_interview database
echo 2. Redis is running (should have started automatically)
echo 3. Environment variables are configured in backend/.env
echo.
echo Press any key to continue...
pause > nul
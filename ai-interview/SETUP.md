# AI Interview Platform

## Project Structure
```
ai-interview/
├── backend/           # FastAPI backend
├── frontend/          # React frontend  
├── README.md         # Complete documentation
├── start-dev.bat     # Windows startup script
└── start-dev.sh      # Linux/Mac startup script
```

## Quick Setup

### Prerequisites
- Python 3.11+
- Node.js 18+
- PostgreSQL 14+
- Redis 6+
- GROQ API Key

### Database Setup
```sql
CREATE DATABASE ai_interview;
CREATE USER interview_user WITH PASSWORD 'your_password';
GRANT ALL PRIVILEGES ON DATABASE ai_interview TO interview_user;
```

### Start Development

**Windows:**
```bash
start-dev.bat
```

**Linux/Mac:**
```bash
chmod +x start-dev.sh
./start-dev.sh
```

### Manual Setup

**Backend:**
```bash
cd backend
pip install -r requirements.txt
cp .env.example .env
# Edit .env with your configuration
uvicorn app.main:app --reload
```

**Frontend:**
```bash
cd frontend  
npm install
npm run dev
```

## Access Points

- **Frontend**: http://localhost:5173
- **Admin Panel**: http://localhost:5173/admin
- **Backend API**: http://localhost:8000
- **API Docs**: http://localhost:8000/docs

## Key Features

✅ **Complete Interview Flow** - From invite to completion
✅ **Voice Recording** - WebRTC audio capture and transcription
✅ **AI Evaluation** - GROQ API integration with LLaMA models
✅ **Real-time Proctoring** - Tab monitoring and risk assessment
✅ **Admin Interface** - Candidate, job, and session management
✅ **PDF Reports** - Comprehensive interview analysis
✅ **Email System** - OTP verification and calendar invites
✅ **Timing Controls** - Strict answer timeouts with buffers

See [README.md](README.md) for complete documentation.
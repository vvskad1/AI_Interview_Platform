# 🎤 AI Interview Platform

> **A next-generation AI-powered interview platform that revolutionizes technical recruitment with voice-based assessments, real-time proctoring, and intelligent evaluation.**

[![FastAPI](https://img.shields.io/badge/FastAPI-005571?style=for-the-badge&logo=fastapi)](https://fastapi.tiangolo.com/)
[![React](https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)](https://reactjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-316192?style=for-the-badge&logo=postgresql&logoColor=white)](https://www.postgresql.org/)
[![Python](https://img.shields.io/badge/Python-3776AB?style=for-the-badge&logo=python&logoColor=white)](https://www.python.org/)

## 📋 Overview

Transform your recruitment process with an AI-powered platform that conducts automated technical interviews through natural voice interactions. Leveraging cutting-edge AI models from Groq (Whisper for transcription, LLaMA for evaluation), this platform delivers comprehensive candidate assessments with built-in integrity monitoring and detailed analytics.

## 🎯 Features

### 🎙️ Core Interview Features
- **Voice-based Interviews**: Natural conversation - candidates answer questions by voice, questions displayed as text
- **AI-Powered Evaluation**: Groq API integration for real-time transcription (Whisper) and intelligent evaluation (LLaMA 70B)
- **Smart Question Generation**: RAG-powered system generates contextual questions from job descriptions and resumes
- **Dynamic Follow-ups**: AI generates relevant follow-up questions based on candidate responses
- **Strict Timing**: Configurable answer timeouts with automatic progression (default: 90s + 10s buffer)

### 🛡️ Security & Proctoring
- **Real-time Monitoring**: Tab switching detection, face presence tracking, activity logging
- **Risk Assessment**: Automated integrity scoring with configurable thresholds
- **Strict Mode**: Enhanced monitoring for high-stakes technical interviews
- **Complete Audit Trail**: Timestamped event logging for compliance

### 👨‍💼 Admin Dashboard
- **Candidate Management**: Bulk upload, resume parsing (PDF), profile management
- **Job Management**: Create roles with rich descriptions (text or PDF upload)
- **Interview Scheduling**: Time-windowed invites with automated calendar integration
- **Live Monitoring**: Real-time session tracking with risk indicators and progress bars
- **Analytics & Reports**: Downloadable PDF reports with scores, transcripts, and integrity data

### 🔧 Technical Highlights
- **FastAPI Backend**: High-performance async Python API with SQLAlchemy ORM
- **React + TypeScript Frontend**: Modern, responsive UI with real-time updates
- **PostgreSQL Database**: Robust relational database with proper indexing
- **Redis Integration**: Fast OTP storage and session caching
- **WebRTC Audio**: High-quality browser-based audio recording
- **Vector Search**: FAISS + Sentence Transformers for intelligent content retrieval
- **Email Automation**: OTP verification, calendar invites (.ics), automated notifications

## 🏗️ Architecture

```
ai-interview/
├── backend/                    # FastAPI Backend
│   ├── app/
│   │   ├── main.py            # FastAPI application
│   │   ├── config.py          # Environment configuration
│   │   ├── database.py        # Database setup & connections
│   │   ├── models.py          # SQLAlchemy models
│   │   ├── schemas.py         # Pydantic schemas
│   │   ├── routers/           # API endpoints
│   │   └── services/          # Business logic
│   ├── requirements.txt       # Python dependencies
│   └── .env.example          # Environment variables template
└── frontend/                  # React Frontend
    ├── src/
    │   ├── pages/            # Candidate interview flow
    │   ├── admin/            # Admin interface
    │   ├── components/       # Reusable components
    │   └── api.ts           # API client
    ├── package.json          # Node dependencies
    └── vite.config.ts       # Vite configuration
```

## 🚀 Quick Start

### Prerequisites
- **Python 3.11+**
- **Node.js 18+**
- **PostgreSQL 14+**
- **Redis 6+**
- **GROQ API Key** (sign up at groq.com)

### Backend Setup

1. **Clone and navigate to backend**:
   ```bash
   cd ai-interview/backend
   ```

2. **Create virtual environment**:
   ```bash
   python -m venv venv
   # Windows
   venv\\Scripts\\activate
   # Linux/Mac
   source venv/bin/activate
   ```

3. **Install dependencies**:
   ```bash
   pip install -r requirements.txt
   ```

4. **Configure environment**:
   ```bash
   cp .env.example .env
   # Edit .env with your configuration
   ```

5. **Set up database**:
   ```sql
   -- PostgreSQL
   CREATE DATABASE ai_interview;
   CREATE USER interview_user WITH PASSWORD 'your_password';
   GRANT ALL PRIVILEGES ON DATABASE ai_interview TO interview_user;
   ```

6. **Start services**:
   ```bash
   # Start Redis (if not running)
   redis-server
   
   # Start FastAPI
   uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
   ```

### Frontend Setup

1. **Navigate to frontend**:
   ```bash
   cd ../frontend
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Start development server**:
   ```bash
   npm run dev
   ```

### Environment Configuration

Create `backend/.env` with these variables:

```env
# Database
DATABASE_URL=postgresql+psycopg2://interview_user:your_password@localhost:5432/ai_interview

# GROQ API (get from groq.com)
GROQ_API_KEY=your_groq_api_key_here

# URLs
PUBLIC_BASE_URL=http://localhost:5173
BACKEND_BASE_URL=http://localhost:8000

# Email Configuration
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your_email@gmail.com
SMTP_PASS=your_app_password
MAIL_FROM=your_email@gmail.com

# Redis
REDIS_URL=redis://localhost:6379/0

# Security
JWT_SECRET=your_random_secret_key_here

# Configuration
PRIVACY_POLICY_URL=https://example.com/privacy
RETENTION_DAYS=60
ANSWER_SECONDS=90
BUFFER_SECONDS=10
GRACE_SECONDS=2
```

## 📖 Usage Guide

### Admin Workflow

1. **Access Admin Panel**: Navigate to `http://localhost:5173/admin`

2. **Create Candidate**:
   - Go to Candidates → Add New
   - Enter name and email
   - Optionally upload resume (PDF)

3. **Create Job Posting**:
   - Go to Jobs → Add New  
   - Enter title, level, department
   - Add job description (text or upload PDF)

4. **Send Interview Invite**:
   - Go to Invites → Create New
   - Select candidate and job
   - Set interview time window
   - Choose strict mode if needed
   - System sends email with calendar invite

5. **Monitor Sessions**:
   - Go to Sessions to see active interviews
   - Monitor risk levels in real-time
   - View candidate progress

6. **Generate Reports**:
   - Go to Reports after session completion
   - Download comprehensive PDF reports
   - Review transcripts, scores, timing, and integrity data

### Candidate Experience

1. **Receive Invite**: Candidate gets email with interview link and calendar event

2. **Start Interview**: Click link to begin interview process:
   - **Invite Landing**: Validate token and show interview window
   - **Consent**: Accept monitoring and data collection terms
   - **Environment Check**: Test microphone and camera permissions
   - **OTP Verification**: Verify email with 6-digit code
   - **Identity Verification**: Camera-based liveness check (stub)
   - **Interview**: Answer questions via voice recording

3. **Complete Interview**: Automatic progression through questions with AI-generated follow-ups

## 🔧 API Endpoints

### Admin Endpoints (`/admin`)
- `GET /admin/stats` - Dashboard statistics
- `GET /admin/candidates` - List candidates
- `POST /admin/candidate` - Create candidate
- `POST /admin/upload-resume` - Upload resume PDF
- `GET /admin/jobs` - List jobs
- `POST /admin/create-job` - Create job (with PDF support)
- `POST /admin/create-invite` - Create interview invite
- `GET /admin/sessions` - Active sessions monitoring

### Candidate Flow (`/i`, `/identity`, `/session`)
- `GET /i/{token}` - Validate invite token
- `POST /identity/otp/send` - Send OTP code
- `POST /identity/otp/verify` - Verify OTP
- `POST /identity/liveness` - Liveness verification (stub)
- `POST /session/start` - Start interview session
- `POST /session/{id}/speech` - Submit voice answer
- `POST /session/{id}/timeout` - Handle answer timeout

### Monitoring (`/proctor`)
- `POST /proctor/{session_id}/event` - Record proctoring events

### Reports (`/reports`)
- `GET /reports/{session_id}.pdf` - Download session report

## 🎛️ Configuration

### Timing Configuration
```python
ANSWER_SECONDS = 90      # Time limit per question
BUFFER_SECONDS = 10      # Delay before next question
GRACE_SECONDS = 2        # Extra time before marking "late"
```

### Proctoring Settings
- **Tab Monitoring**: Automatic detection of tab switches
- **Face Detection**: Basic presence detection (extensible)
- **Risk Scoring**: Configurable weights for different events
- **Strict Mode**: Enhanced monitoring for high-stakes interviews

### Email Templates
- **OTP Verification**: 6-digit codes with 10-minute expiration
- **Interview Invites**: Rich HTML with calendar attachments
- **Automated Reminders**: Configurable timing

## 🔒 Security & Privacy

### Data Protection
- **Retention Policy**: Configurable data retention (default: 60 days)
- **Secure Storage**: Bcrypt password hashing, encrypted tokens
- **Privacy Compliance**: GDPR-ready with clear data usage policies

### Integrity Monitoring
- **Proctoring Events**: Tab visibility, face detection, suspicious activity
- **Risk Assessment**: Real-time scoring with configurable thresholds
- **Audit Trail**: Complete session logging with timestamps

### Access Control
- **Token-based Authentication**: Secure invite validation
- **Email Verification**: OTP-based identity confirmation
- **Session Management**: Isolated interview sessions

## 🧪 Testing

### Backend Testing
```bash
cd backend
pytest tests/
```

### Frontend Testing
```bash
cd frontend
npm run test
```

### Manual Testing Flow
1. Create test candidate and job in admin panel
2. Generate invite and copy URL
3. Complete full candidate flow in incognito window
4. Verify session appears in admin monitoring
5. Download and review generated report

## 📊 Monitoring & Analytics

### Real-time Metrics
- **Active Sessions**: Live interview count
- **Risk Levels**: Per-session integrity scores  
- **Performance**: Response times, completion rates
- **System Health**: API status, database connections

### Reporting Features
- **Session Transcripts**: Complete Q&A with timing
- **Scoring Analytics**: AI evaluation breakdown
- **Integrity Reports**: Proctoring event summaries
- **Candidate Analytics**: Performance across questions

## 🚨 Troubleshooting

### Common Issues

**Database Connection Errors**:
```bash
# Check PostgreSQL status
sudo service postgresql status
# Verify connection
psql -h localhost -U interview_user -d ai_interview
```

**Redis Connection Issues**:
```bash
# Check Redis status
redis-cli ping
# Should return PONG
```

**GROQ API Errors**:
- Verify API key is correct
- Check rate limits and quotas
- Ensure model names are up to date

**Audio Recording Issues**:
- Browser must use HTTPS for microphone access (use localhost for dev)
- Check browser permissions
- Verify WebRTC support

**Email Delivery Issues**:
- Verify SMTP credentials
- Check spam folders
- Use app-specific passwords for Gmail

### Performance Optimization

**Database**:
```sql
-- Add indexes for common queries
CREATE INDEX idx_session_status ON sessions(status);
CREATE INDEX idx_invite_window ON invites(window_start, window_end);
```

**Frontend**:
- Enable gzip compression
- Implement audio compression for large files
- Add request timeout handling

## 🛣️ Roadmap

### Phase 1 (Complete)
- ✅ Core interview flow
- ✅ Basic proctoring
- ✅ Admin interface
- ✅ PDF reports

### Phase 2 (Future)
- 🔄 Advanced face detection (ML-based)
- 🔄 Multi-language support
- 🔄 Advanced analytics dashboard
- 🔄 Integration APIs (ATS systems)
- 🔄 Mobile app support
- 🔄 Live interview mode
- 🔄 Candidate practice mode

### Phase 3 (Future)
- 🔄 AI interviewer avatars
- 🔄 Advanced behavioral analysis
- 🔄 Integration with HR systems
- 🔄 White-label solutions
- 🔄 Enterprise SSO

## 🤝 Contributing

1. Fork the repository
2. Create feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open Pull Request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🙏 Acknowledgments

- **Groq** for providing fast AI inference
- **FastAPI** for the excellent web framework
- **React** & **Vite** for modern frontend tooling
- **PostgreSQL** for robust data management

## 📞 Contact & Support

- **Issues**: Report bugs via [GitHub Issues](https://github.com/vvskad1/AI_Interview_Platform/issues)
- **Discussions**: Join community discussions
- **Email**: Contact for enterprise inquiries

---

<div align="center">

**Built with ❤️ for modern, AI-powered recruiting**

⭐ Star this repo if you find it helpful!

</div>
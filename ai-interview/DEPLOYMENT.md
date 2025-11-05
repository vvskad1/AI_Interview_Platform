# AWS Deployment Guide - AI Interview Platform

This guide walks you through deploying the AI Interview Platform on AWS with the backend on EC2 and frontend on Vercel.

## Architecture Overview

- **Frontend**: Deployed on Vercel (React + Vite)
- **Backend**: Deployed on AWS EC2 (FastAPI + Docker)
- **Database**: PostgreSQL (Docker container on EC2)
- **Cache**: Redis (Docker container on EC2)
- **Reverse Proxy**: Nginx on EC2
- **SSL**: Let's Encrypt (free SSL certificates)

---

## Prerequisites

1. **AWS Account** with credentials configured
2. **Domain Name** (optional but recommended)
3. **GitHub Account** (repository already set up)
4. **Vercel Account** (free tier is sufficient)
5. **GROQ API Key** (for AI functionality)
6. **SMTP Credentials** (for email functionality)

---

## Part 1: Backend Deployment on AWS EC2

### Step 1: Launch EC2 Instance

1. **Sign in to AWS Console** → Navigate to EC2
2. **Launch Instance**:
   - **Name**: `ai-interview-backend`
   - **AMI**: Ubuntu Server 22.04 LTS
   - **Instance Type**: `t3.medium` (recommended) or `t2.medium` (minimum)
   - **Key Pair**: Create new or use existing (download .pem file)
   - **Network Settings**:
     - Allow SSH (port 22) from your IP
     - Allow HTTP (port 80) from anywhere
     - Allow HTTPS (port 443) from anywhere
     - Allow Custom TCP (port 8000) from anywhere (for initial testing)
   - **Storage**: 20 GB (minimum)
3. **Launch Instance**

### Step 2: Connect to EC2 Instance

**Windows (PowerShell):**
```powershell
# Change permissions on your .pem file
icacls "path\to\your-key.pem" /inheritance:r
icacls "path\to\your-key.pem" /grant:r "$($env:USERNAME):(R)"

# Connect via SSH
ssh -i "path\to\your-key.pem" ubuntu@your-ec2-public-ip
```

**Linux/Mac:**
```bash
chmod 400 your-key.pem
ssh -i your-key.pem ubuntu@your-ec2-public-ip
```

### Step 3: Run Deployment Script

Once connected to EC2:

```bash
# Download and run the deployment script
curl -O https://raw.githubusercontent.com/vvskad1/AI_Interview_Platform/main/ai-interview/backend/deploy-aws.sh
chmod +x deploy-aws.sh
./deploy-aws.sh
```

**The script will:**
- Install Docker and Docker Compose
- Install Git and Nginx
- Clone your repository
- Set up the backend environment

### Step 4: Configure Environment Variables

```bash
cd /home/ubuntu/AI_Interview_Platform/ai-interview/backend
nano .env
```

**Fill in your configuration:**
```env
# Database Configuration
DATABASE_URL=postgresql://interview_user:YOUR_SECURE_PASSWORD@postgres:5432/ai_interview
POSTGRES_PASSWORD=YOUR_SECURE_PASSWORD

# Redis Configuration
REDIS_URL=redis://redis:6379

# GROQ API Configuration
GROQ_API_KEY=your_groq_api_key_here

# Application URLs (update after getting domain)
PUBLIC_BASE_URL=https://your-frontend-domain.vercel.app
BACKEND_URL=https://api.yourdomain.com

# Email Configuration (example with Gmail)
SMTP_SERVER=smtp.gmail.com
SMTP_PORT=587
SMTP_USERNAME=your-email@gmail.com
SMTP_PASSWORD=your-gmail-app-password
FROM_EMAIL=your-email@gmail.com

# Application Settings
MAX_QUESTIONS=15
ANSWER_SECONDS=120
BUFFER_SECONDS=10
AUDIO_STORAGE_PATH=/app/audio_files
```

**Save**: `Ctrl+X`, then `Y`, then `Enter`

### Step 5: Start Backend Services

```bash
# Start all services (backend, postgres, redis)
sudo docker-compose up -d --build

# Check if services are running
sudo docker-compose ps

# View logs
sudo docker-compose logs -f backend

# Run database migrations
sudo docker-compose exec backend alembic upgrade head
```

### Step 6: Configure Nginx Reverse Proxy

```bash
# Copy nginx configuration
sudo cp nginx-config.conf /etc/nginx/sites-available/ai-interview

# Update the configuration with your domain
sudo nano /etc/nginx/sites-available/ai-interview
# Replace 'api.yourdomain.com' with your actual domain

# Enable the site
sudo ln -s /etc/nginx/sites-available/ai-interview /etc/nginx/sites-enabled/

# Remove default site
sudo rm /etc/nginx/sites-enabled/default

# Test configuration
sudo nginx -t

# Restart Nginx
sudo systemctl restart nginx
```

### Step 7: Set Up SSL with Let's Encrypt

```bash
# Install Certbot
sudo apt-get update
sudo apt-get install -y certbot python3-certbot-nginx

# Get SSL certificate (replace with your domain)
sudo certbot --nginx -d api.yourdomain.com

# Follow prompts:
# - Enter email address
# - Agree to terms
# - Choose to redirect HTTP to HTTPS (recommended)

# Certbot will automatically configure Nginx for HTTPS
```

### Step 8: Verify Backend is Running

```bash
# Check Docker containers
sudo docker-compose ps

# Test API (replace with your domain or EC2 IP)
curl http://your-ec2-ip:8000/docs
# or
curl https://api.yourdomain.com/docs
```

You should see the FastAPI Swagger documentation.

---

## Part 2: Frontend Deployment on Vercel

### Step 1: Prepare Frontend

Before deploying, update the production environment variable:

**Edit `frontend/.env.production`:**
```env
VITE_API_BASE_URL=https://api.yourdomain.com
```

Commit and push changes:
```bash
git add .
git commit -m "Configure production API URL"
git push origin main
```

### Step 2: Deploy to Vercel

**Option A: Using Vercel CLI**

```bash
# Install Vercel CLI
npm install -g vercel

# Navigate to frontend directory
cd frontend

# Login to Vercel
vercel login

# Deploy
vercel --prod
```

**Option B: Using Vercel Dashboard** (Recommended)

1. Go to [vercel.com](https://vercel.com) and sign in
2. Click **"Add New Project"**
3. **Import Git Repository**:
   - Select your GitHub account
   - Choose `AI_Interview_Platform` repository
4. **Configure Project**:
   - **Framework Preset**: Vite
   - **Root Directory**: `ai-interview/frontend`
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
5. **Environment Variables**:
   - Add: `VITE_API_BASE_URL` = `https://api.yourdomain.com`
6. Click **"Deploy"**

### Step 3: Configure Custom Domain (Optional)

1. In Vercel Dashboard → Your Project → **Settings** → **Domains**
2. Add your custom domain (e.g., `interview.yourdomain.com`)
3. Update DNS records as instructed by Vercel

### Step 4: Update Backend CORS

Update backend `.env` on EC2 with your Vercel domain:

```bash
# SSH into EC2
ssh -i your-key.pem ubuntu@your-ec2-ip

# Edit backend .env
cd /home/ubuntu/AI_Interview_Platform/ai-interview/backend
nano .env

# Update PUBLIC_BASE_URL
PUBLIC_BASE_URL=https://your-frontend.vercel.app

# Save and restart backend
sudo docker-compose restart backend
```

---

## Part 3: Database Setup

### Initial Database Setup

```bash
# SSH into EC2
ssh -i your-key.pem ubuntu@your-ec2-ip

# Access PostgreSQL container
cd /home/ubuntu/AI_Interview_Platform/ai-interview/backend
sudo docker-compose exec postgres psql -U interview_user -d ai_interview

# Check tables
\dt

# Exit
\q
```

### Run Migrations

```bash
# Apply all migrations
sudo docker-compose exec backend alembic upgrade head

# Check migration history
sudo docker-compose exec backend alembic history

# Rollback (if needed)
sudo docker-compose exec backend alembic downgrade -1
```

---

## Part 4: Testing Your Deployment

### 1. Test Backend API

```bash
# Health check
curl https://api.yourdomain.com/health

# API documentation
curl https://api.yourdomain.com/docs
```

### 2. Test Frontend

Open your browser and navigate to:
- `https://your-frontend.vercel.app`
- `https://your-frontend.vercel.app/admin`

### 3. Test Full Flow

1. **Create a candidate** (Admin panel)
2. **Create a job** (Admin panel)
3. **Create an invite** (Admin panel)
4. **Access invite URL** and complete interview
5. **Check proctoring events** and **download report**

---

## Part 5: Monitoring and Maintenance

### View Logs

```bash
# Backend logs
sudo docker-compose logs -f backend

# Database logs
sudo docker-compose logs -f postgres

# Redis logs
sudo docker-compose logs -f redis

# Nginx logs
sudo tail -f /var/log/nginx/access.log
sudo tail -f /var/log/nginx/error.log
```

### Restart Services

```bash
# Restart specific service
sudo docker-compose restart backend

# Restart all services
sudo docker-compose restart

# Stop all services
sudo docker-compose down

# Start all services
sudo docker-compose up -d
```

### Update Application

```bash
# SSH into EC2
cd /home/ubuntu/AI_Interview_Platform

# Pull latest changes
git pull origin main

# Rebuild and restart
cd ai-interview/backend
sudo docker-compose down
sudo docker-compose up -d --build

# Run new migrations if any
sudo docker-compose exec backend alembic upgrade head
```

### Backup Database

```bash
# Create backup
sudo docker-compose exec postgres pg_dump -U interview_user ai_interview > backup_$(date +%Y%m%d).sql

# Download backup to local machine (from your local terminal)
scp -i your-key.pem ubuntu@your-ec2-ip:/home/ubuntu/backup_*.sql ./
```

### Restore Database

```bash
# Upload backup to EC2 (from your local terminal)
scp -i your-key.pem backup_20250304.sql ubuntu@your-ec2-ip:/home/ubuntu/

# Restore (on EC2)
cat backup_20250304.sql | sudo docker-compose exec -T postgres psql -U interview_user ai_interview
```

---

## Part 6: Security Best Practices

### 1. Update Security Group (AWS Console)

- Restrict SSH (port 22) to your IP only
- Remove port 8000 access (use Nginx as reverse proxy only)

### 2. Enable Firewall

```bash
# Enable UFW
sudo ufw allow OpenSSH
sudo ufw allow 'Nginx Full'
sudo ufw enable
sudo ufw status
```

### 3. Set Up Automatic SSL Renewal

```bash
# Certbot auto-renewal is enabled by default
# Test renewal
sudo certbot renew --dry-run
```

### 4. Regular Updates

```bash
# Update system packages
sudo apt-get update
sudo apt-get upgrade -y

# Update Docker images
sudo docker-compose pull
sudo docker-compose up -d
```

---

## Troubleshooting

### Backend Not Starting

```bash
# Check logs
sudo docker-compose logs backend

# Common issues:
# - Missing environment variables: check .env file
# - Database not ready: wait a few seconds and check again
# - Port conflict: ensure port 8000 is free
```

### Database Connection Error

```bash
# Check if PostgreSQL is running
sudo docker-compose ps

# Check PostgreSQL logs
sudo docker-compose logs postgres

# Verify DATABASE_URL in .env matches PostgreSQL settings
```

### Frontend API Calls Failing

- Verify `VITE_API_BASE_URL` in Vercel environment variables
- Check CORS settings in backend
- Ensure backend is accessible from internet

### SSL Certificate Issues

```bash
# Check certificate status
sudo certbot certificates

# Renew certificate
sudo certbot renew

# Check Nginx configuration
sudo nginx -t
```

---

## Cost Estimation (AWS)

**Monthly Costs:**
- EC2 t3.medium instance: ~$30/month
- 20 GB EBS storage: ~$2/month
- Data transfer: Variable (depends on usage)
- **Total**: ~$35-50/month

**Free Tier (First 12 months):**
- t2.micro instance: 750 hours/month free
- 30 GB storage free
- 15 GB data transfer free

**Vercel**: Free for frontend (hobby plan)

---

## Support and Additional Resources

- **AWS Documentation**: https://docs.aws.amazon.com/
- **Docker Documentation**: https://docs.docker.com/
- **Vercel Documentation**: https://vercel.com/docs
- **FastAPI Documentation**: https://fastapi.tiangolo.com/
- **Let's Encrypt**: https://letsencrypt.org/

---

## Quick Command Reference

```bash
# SSH to EC2
ssh -i your-key.pem ubuntu@your-ec2-ip

# Navigate to project
cd /home/ubuntu/AI_Interview_Platform/ai-interview/backend

# View logs
sudo docker-compose logs -f backend

# Restart backend
sudo docker-compose restart backend

# Update code
git pull origin main
sudo docker-compose up -d --build

# Database migrations
sudo docker-compose exec backend alembic upgrade head

# Backup database
sudo docker-compose exec postgres pg_dump -U interview_user ai_interview > backup.sql
```

---

**Deployment Complete! 🚀**

Your AI Interview Platform is now live and ready to conduct interviews!

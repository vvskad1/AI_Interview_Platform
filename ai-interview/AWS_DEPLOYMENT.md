# AWS Full Stack Deployment Guide - AI Interview Platform

Deploy both frontend and backend on a single AWS EC2 instance.

## Architecture

- **EC2 Instance**: Ubuntu 22.04 LTS
- **Frontend**: React app served by Nginx (port 80/443)
- **Backend**: FastAPI with Docker (port 8000, proxied by Nginx)
- **Database**: PostgreSQL in Docker
- **Cache**: Redis in Docker
- **Web Server**: Nginx (reverse proxy + static file server)

---

## Quick Start

### 1. Launch EC2 Instance

**AWS Console → EC2 → Launch Instance:**
- **AMI**: Ubuntu Server 22.04 LTS
- **Instance Type**: `t3.medium` (2 vCPU, 4 GB RAM) - recommended
- **Storage**: 20-30 GB
- **Security Group**:
  - SSH (22) - Your IP only
  - HTTP (80) - Anywhere
  - HTTPS (443) - Anywhere

### 2. Connect to EC2

```bash
ssh -i your-key.pem ubuntu@your-ec2-ip
```

### 3. Run Deployment Script

```bash
curl -O https://raw.githubusercontent.com/vvskad1/AI_Interview_Platform/main/ai-interview/backend/deploy-aws.sh
chmod +x deploy-aws.sh
./deploy-aws.sh
```

### 4. Configure Environment Variables

**Backend:**
```bash
cd /home/ubuntu/AI_Interview_Platform/ai-interview/backend
nano .env
```

Fill in:
```env
DATABASE_URL=postgresql://interview_user:STRONG_PASSWORD@postgres:5432/ai_interview
POSTGRES_PASSWORD=STRONG_PASSWORD
REDIS_URL=redis://redis:6379
GROQ_API_KEY=your_groq_key_here
PUBLIC_BASE_URL=http://your-ec2-ip-or-domain
SMTP_SERVER=smtp.gmail.com
SMTP_PORT=587
SMTP_USERNAME=your-email@gmail.com
SMTP_PASSWORD=your-app-password
FROM_EMAIL=your-email@gmail.com
```

**Frontend:**
```bash
cd /home/ubuntu/AI_Interview_Platform/ai-interview/frontend
nano .env.production
```

Leave empty (same origin):
```env
VITE_API_BASE_URL=
```

### 5. Restart Services

```bash
cd /home/ubuntu/AI_Interview_Platform/ai-interview/backend
sudo docker-compose restart
```

### 6. Configure Nginx

```bash
cd /home/ubuntu/AI_Interview_Platform/ai-interview/backend
sudo cp nginx-fullstack.conf /etc/nginx/sites-available/ai-interview

# Edit with your domain or IP
sudo nano /etc/nginx/sites-available/ai-interview
# Change: server_name yourdomain.com www.yourdomain.com;
# To: server_name your-ec2-ip; (or your domain)

# Enable site
sudo ln -s /etc/nginx/sites-available/ai-interview /etc/nginx/sites-enabled/
sudo rm /etc/nginx/sites-enabled/default

# Test and restart
sudo nginx -t
sudo systemctl restart nginx
```

### 7. Setup SSL (Optional but Recommended)

```bash
sudo apt-get install -y certbot python3-certbot-nginx
sudo certbot --nginx -d yourdomain.com -d www.yourdomain.com
```

---

## Access Your Application

- **Frontend**: `http://your-ec2-ip` or `https://yourdomain.com`
- **Admin Panel**: `http://your-ec2-ip/admin`
- **API Docs**: `http://your-ec2-ip/docs`

---

## Maintenance Commands

```bash
# View logs
sudo docker-compose logs -f backend

# Restart services
sudo docker-compose restart

# Update application
cd /home/ubuntu/AI_Interview_Platform
git pull
cd ai-interview/frontend
npm install && npm run build
sudo cp -r dist/* /var/www/ai-interview/
cd ../backend
sudo docker-compose up -d --build

# Database backup
sudo docker-compose exec postgres pg_dump -U interview_user ai_interview > backup.sql

# Check Nginx status
sudo systemctl status nginx
sudo nginx -t
```

---

## Troubleshooting

**Frontend not loading:**
```bash
ls -la /var/www/ai-interview/
sudo systemctl status nginx
```

**Backend API errors:**
```bash
sudo docker-compose ps
sudo docker-compose logs backend
```

**Database connection issues:**
```bash
sudo docker-compose logs postgres
```

---

## Cost Estimate

- **t3.medium**: ~$30/month
- **Storage**: ~$2-3/month
- **Data transfer**: Variable
- **Total**: ~$35-40/month

---

## Security Checklist

- [ ] Change default passwords
- [ ] Enable SSH key authentication only
- [ ] Configure firewall (UFW)
- [ ] Set up SSL certificate
- [ ] Regular backups
- [ ] Update system packages regularly

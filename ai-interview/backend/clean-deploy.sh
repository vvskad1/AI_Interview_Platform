#!/bin/bash

# Clean Full Stack Deployment Script
# Run this on EC2 to deploy both frontend and backend from scratch

set -e

echo "================================================"
echo "🧹 CLEAN DEPLOYMENT - AI Interview Platform"
echo "================================================"

# Get EC2 public IP
PUBLIC_IP=$(curl -s http://169.254.169.254/latest/meta-data/public-ipv4)
echo "📍 Server IP: $PUBLIC_IP"

# Stop and remove all existing containers
echo ""
echo "🛑 Stopping all containers..."
cd /home/ubuntu/AI_Interview_Platform/ai-interview/backend
sudo docker-compose down -v 2>/dev/null || true

# Remove old frontend files
echo "🗑️  Removing old frontend files..."
sudo rm -rf /var/www/ai-interview

# Pull latest code from GitHub
echo ""
echo "⬇️  Pulling latest code from GitHub..."
cd /home/ubuntu/AI_Interview_Platform
git fetch --all
git reset --hard origin/main
git pull origin main

# Build Frontend
echo ""
echo "🎨 Building frontend..."
cd ai-interview/frontend

# Remove old build and dependencies
rm -rf dist node_modules package-lock.json

# Create production env file
echo "VITE_API_BASE_URL=" > .env.production

# Install and build
npm install
npm run build

# Deploy frontend to nginx
echo "📦 Deploying frontend to /var/www/ai-interview..."
sudo mkdir -p /var/www/ai-interview
sudo cp -r dist/* /var/www/ai-interview/
sudo chown -R www-data:www-data /var/www/ai-interview

echo "✅ Frontend deployed successfully"

# Setup Backend
echo ""
echo "⚙️  Setting up backend..."
cd /home/ubuntu/AI_Interview_Platform/ai-interview/backend

# Create minimal .env file
echo "Creating backend .env file..."
cat > .env << EOF
# Database
DATABASE_URL=postgresql://interview_user:interview_pass@postgres:5432/interview_db

# Redis
REDIS_URL=redis://redis:6379

# GROQ API (REQUIRED - Add your key here)
GROQ_API_KEY=your_groq_api_key_here

# Public URL
PUBLIC_BASE_URL=http://$PUBLIC_IP

# JWT Secret (change in production)
JWT_SECRET=change-this-secret-key-in-production-12345

# SMTP (Optional - will skip emails if not configured)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=
SMTP_PASS=
MAIL_FROM=noreply@example.com
EOF

echo "✅ Backend .env created"

# Clean up Docker
echo ""
echo "🐋 Cleaning Docker..."
sudo docker system prune -f

# Build and start backend
echo ""
echo "🚀 Building and starting backend services..."
sudo docker-compose build --no-cache
sudo docker-compose up -d

# Wait for services
echo ""
echo "⏳ Waiting for services to start (30 seconds)..."
sleep 30

# Check service status
echo ""
echo "📊 Service status:"
sudo docker-compose ps

# Run migrations
echo ""
echo "🗄️  Running database migrations..."
sudo docker-compose exec -T backend alembic upgrade head

# Configure Nginx
echo ""
echo "🌐 Configuring Nginx..."

# Update nginx config with current IP
sed "s/server_name [0-9.]*;/server_name $PUBLIC_IP;/" nginx-fullstack.conf | sudo tee /etc/nginx/sites-available/ai-interview > /dev/null

# Enable site
sudo ln -sf /etc/nginx/sites-available/ai-interview /etc/nginx/sites-enabled/
sudo rm -f /etc/nginx/sites-enabled/default

# Test and restart nginx
sudo nginx -t
sudo systemctl restart nginx

# Final status check
echo ""
echo "================================================"
echo "✅ DEPLOYMENT COMPLETE!"
echo "================================================"
echo ""
echo "🌐 Access your application:"
echo "   Frontend: http://$PUBLIC_IP"
echo "   Backend API Docs: http://$PUBLIC_IP/docs"
echo ""
echo "📊 Service Status:"
sudo docker-compose ps
echo ""
echo "⚠️  IMPORTANT: Edit backend/.env and add your GROQ_API_KEY"
echo "   Then restart: sudo docker-compose restart backend"
echo ""
echo "📝 View logs:"
echo "   Backend: sudo docker-compose logs -f backend"
echo "   Nginx: sudo tail -f /var/log/nginx/error.log"
echo ""

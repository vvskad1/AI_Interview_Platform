#!/bin/bash

# AWS EC2 Deployment Script for AI Interview Platform (Full Stack)
# This script sets up both backend and frontend on an Ubuntu EC2 instance

set -e

echo "======================================"
echo "AI Interview Platform - Full AWS Deployment"
echo "======================================"

# Update system
echo "Updating system packages..."
sudo apt-get update
sudo apt-get upgrade -y

# Install Docker
echo "Installing Docker..."
if ! command -v docker &> /dev/null; then
    curl -fsSL https://get.docker.com -o get-docker.sh
    sudo sh get-docker.sh
    sudo usermod -aG docker $USER
    rm get-docker.sh
else
    echo "Docker already installed"
fi

# Install Docker Compose
echo "Installing Docker Compose..."
if ! command -v docker-compose &> /dev/null; then
    sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
    sudo chmod +x /usr/local/bin/docker-compose
else
    echo "Docker Compose already installed"
fi

# Install Git
echo "Installing Git..."
sudo apt-get install -y git

# Install Node.js and npm (for frontend build)
echo "Installing Node.js..."
if ! command -v node &> /dev/null; then
    curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
    sudo apt-get install -y nodejs
else
    echo "Node.js already installed"
fi

# Install Nginx (for serving frontend and reverse proxy)
echo "Installing Nginx..."
sudo apt-get install -y nginx

# Clone repository
echo "Cloning repository..."
cd /home/ubuntu
if [ -d "AI_Interview_Platform" ]; then
    echo "Repository already exists, pulling latest changes..."
    cd AI_Interview_Platform
    git pull
else
    git clone https://github.com/vvskad1/AI_Interview_Platform.git
    cd AI_Interview_Platform
fi

# Build Frontend
echo "Building frontend..."
cd "ai-interview/frontend"

# Check if .env.production exists, if not create from example
if [ ! -f .env.production ]; then
    if [ -f .env.production.example ]; then
        cp .env.production.example .env.production
        echo "⚠️  Created .env.production from example. Please edit with your backend URL."
    fi
fi

npm install
npm run build

# Create directory for frontend files
sudo mkdir -p /var/www/ai-interview
sudo cp -r dist/* /var/www/ai-interview/
sudo chown -R www-data:www-data /var/www/ai-interview

echo "✅ Frontend built and deployed to /var/www/ai-interview"

# Setup Backend
echo "Setting up backend..."
cd /home/ubuntu/AI_Interview_Platform/ai-interview/backend

# Create .env file
echo "Setting up backend environment variables..."
if [ ! -f .env ]; then
    if [ -f .env.production.example ]; then
        cp .env.production.example .env
        echo "⚠️  Created .env from example. Please edit with your actual credentials."
    else
        echo "❌ No .env.production.example found!"
        exit 1
    fi
fi

# Start backend services with Docker Compose
echo "Starting backend services..."
sudo docker-compose down
sudo docker-compose up --build -d

# Wait for services to be ready
echo "Waiting for services to start..."
sleep 15

# Run database migrations
echo "Running database migrations..."
sudo docker-compose exec -T backend alembic upgrade head

echo "======================================"
echo "✅ Full stack deployment complete!"
echo "======================================"
echo ""
echo "Services running:"
echo "  - Backend API: http://localhost:8000"
echo "  - Frontend files: /var/www/ai-interview"
echo "  - PostgreSQL: localhost:5432"
echo "  - Redis: localhost:6379"
echo ""
echo "Public IP: $(curl -s http://169.254.169.254/latest/meta-data/public-ipv4)"
echo ""
echo "Next steps:"
echo "1. Edit backend/.env with your actual credentials"
echo "2. Edit frontend .env.production if needed and rebuild"
echo "3. Configure Nginx (see nginx-fullstack.conf)"
echo "4. Set up SSL certificate with Let's Encrypt"
echo "5. Point your domain DNS to this server"
echo ""
echo "To apply Nginx config:"
echo "  sudo cp nginx-fullstack.conf /etc/nginx/sites-available/ai-interview"
echo "  sudo ln -s /etc/nginx/sites-available/ai-interview /etc/nginx/sites-enabled/"
echo "  sudo rm /etc/nginx/sites-enabled/default"
echo "  sudo nginx -t"
echo "  sudo systemctl restart nginx"

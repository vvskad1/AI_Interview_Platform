#!/bin/bash

# AWS EC2 Deployment Script for AI Interview Platform Backend
# This script sets up the backend on an Ubuntu EC2 instance

set -e

echo "======================================"
echo "AI Interview Platform - AWS Deployment"
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

# Install Nginx (for reverse proxy)
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

# Navigate to backend directory
cd "ai-interview/backend"

# Create .env file
echo "Setting up environment variables..."
echo "Please create/edit the .env file with your configuration"
if [ ! -f .env ]; then
    cp .env.production .env
    echo "⚠️  Please edit .env file with your actual credentials before starting services"
    exit 1
fi

# Start services with Docker Compose
echo "Starting services..."
sudo docker-compose down
sudo docker-compose up --build -d

# Wait for services to be ready
echo "Waiting for services to start..."
sleep 10

# Run database migrations
echo "Running database migrations..."
sudo docker-compose exec -T backend alembic upgrade head

echo "======================================"
echo "✅ Backend deployment complete!"
echo "======================================"
echo "Backend API: http://$(curl -s http://169.254.169.254/latest/meta-data/public-ipv4):8000"
echo "API Docs: http://$(curl -s http://169.254.169.254/latest/meta-data/public-ipv4):8000/docs"
echo ""
echo "Next steps:"
echo "1. Configure Nginx reverse proxy (see nginx-config.conf)"
echo "2. Set up SSL certificate with Let's Encrypt"
echo "3. Configure your domain DNS to point to this server"
echo "4. Update frontend with backend URL"

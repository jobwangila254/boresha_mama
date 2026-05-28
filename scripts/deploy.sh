#!/bin/bash
# Boresha-Mama Deployment Script
# Target: AWS EC2 + PostgreSQL RDS

set -e

echo "🚀 Boresha-Mama Deployment Script"
echo "================================"

# Configuration
BACKEND_DIR="$HOME/boresha-mama/backend"
FACILITY_DIR="$HOME/boresha-mama/facility-dashboard"
COUNTY_DIR="$HOME/boresha-mama/county-portal"
LOG_DIR="$HOME/logs"
ENV_FILE="$BACKEND_DIR/.env"

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
NC='\033[0m'

# Check prerequisites
command -v node >/dev/null 2>&1 || { echo -e "${RED}Node.js is required${NC}"; exit 1; }
command -v npm >/dev/null 2>&1 || { echo -e "${RED}npm is required${NC}"; exit 1; }
command -v pm2 >/dev/null 2>&1 && echo "✅ PM2 found" || npm install -g pm2

# Create directories
mkdir -p $LOG_DIR
mkdir -p $BACKEND_DIR/logs
mkdir -p $BACKEND_DIR/uploads

# 1. Backend Setup
echo -e "\n📦 Setting up Backend..."
cd $BACKEND_DIR
npm install --production

# Run database migrations
echo "🗄️  Running database migrations..."
node src/migrations/run.js || echo -e "${RED}Migration failed - check database connection${NC}"
node src/migrations/seed.js || echo "Seeding skipped or already seeded"

# Start with PM2
echo "🚀 Starting backend server..."
pm2 delete boresha-mama-backend 2>/dev/null || true
pm2 start src/index.js --name "boresha-mama-backend" --log "$LOG_DIR/backend.log"
pm2 save

# 2. Facility Dashboard
echo -e "\n🏥 Deploying Facility Dashboard..."
cd $FACILITY_DIR
npm install --production
npm run build

# Serve via PM2
pm2 delete boresha-facility 2>/dev/null || true
pm2 serve build/ 3000 --name "boresha-facility" --spa --log "$LOG_DIR/facility.log"
pm2 save

# 3. County Portal
echo -e "\n🏛️  Deploying County Portal..."
cd $COUNTY_DIR
npm install --production
npm run build

pm2 delete boresha-county 2>/dev/null || true
pm2 serve build/ 3001 --name "boresha-county" --spa --log "$LOG_DIR/county.log"
pm2 save

# 4. Setup Nginx reverse proxy
echo -e "\n🔧 Configuring Nginx..."
if command -v nginx >/dev/null 2>&1; then
  cat > /tmp/boresha-mama.conf << 'NGINX'
server {
    listen 80;
    server_name api.boreshamama.go.ke;

    location / {
        proxy_pass http://127.0.0.1:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }

    client_max_body_size 10M;
}

server {
    listen 80;
    server_name facility.boreshamama.go.ke;

    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}

server {
    listen 80;
    server_name county.boreshamama.go.ke;

    location / {
        proxy_pass http://127.0.0.1:3001;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
NGINX
  sudo cp /tmp/boresha-mama.conf /etc/nginx/sites-available/boresha-mama
  sudo ln -sf /etc/nginx/sites-available/boresha-mama /etc/nginx/sites-enabled/
  sudo nginx -t && sudo systemctl reload nginx
  echo -e "${GREEN}Nginx configured${NC}"
fi

# 5. Setup SSL with certbot
if command -v certbot >/dev/null 2>&1; then
  echo "🔒 Setting up SSL certificates..."
  sudo certbot --nginx -d api.boreshamama.go.ke -d facility.boreshamama.go.ke -d county.boreshamama.go.ke --non-interactive --agree-tos --email admin@boreshamama.go.ke || true
fi

# 6. Health check
sleep 3
echo -e "\n🏥 Running health check..."
curl -s http://127.0.0.1:5000/api/health && echo -e "\n${GREEN}✅ Backend is running${NC}" || echo -e "${RED}❌ Backend health check failed${NC}"

echo -e "\n${GREEN}✅ Deployment complete!${NC}"
echo "📊 Backend API:  http://localhost:5000"
echo "🏥 Facility UI:  http://localhost:3000"
echo "🏛️  County UI:   http://localhost:3001"

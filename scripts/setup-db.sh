#!/bin/bash
# Boresha-Mama Database Setup Script

set -e

echo "🗄️  Boresha-Mama Database Setup"
echo "================================"

DB_NAME="${DB_NAME:-boresha_mama}"
DB_USER="${DB_USER:-postgres}"

# Check if PostgreSQL is running
if ! pg_isready -q 2>/dev/null; then
  echo "❌ PostgreSQL is not running. Please start it first."
  echo "   sudo systemctl start postgresql"
  exit 1
fi

echo "✅ PostgreSQL is running"

# Create database if it doesn't exist
echo "📦 Creating database: $DB_NAME"
sudo -u postgres psql -tc "SELECT 1 FROM pg_database WHERE datname='$DB_NAME'" | grep -q 1 || \
  sudo -u postgres createdb $DB_NAME

echo "✅ Database ready: $DB_NAME"

# Create .env if not exists
if [ ! -f backend/.env ]; then
  echo "📝 Creating .env file..."
  cp backend/.env.example backend/.env
  echo "⚠️  Edit backend/.env with your database credentials"
fi

# Run migrations
echo "🔄 Running migrations..."
cd backend
node src/migrations/run.js

echo "🌱 Seeding data..."
node src/migrations/seed.js

echo -e "\n✅ Database setup complete!"
echo "   Database: $DB_NAME"

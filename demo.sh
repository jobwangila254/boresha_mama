#!/usr/bin/env bash
set -e

echo "=== Boresha-Mama Demo Launcher ==="
echo ""

# ── Config ──────────────────────────────────────────────
BACKEND_DIR="$(cd "$(dirname "$0")/backend" && pwd)"
FACILITY_DIR="$(cd "$(dirname "$0")/facility-dashboard" && pwd)"
COUNTY_DIR="$(cd "$(dirname "$0")/county-portal" && pwd)"
CHV_DIR="$(cd "$(dirname "$0")/chv-app" && pwd)"
MOTHER_DIR="$(cd "$(dirname "$0")/mother-app" && pwd)"

# ── Build the backend command ──────────────────────────
# DB_HOST defaults to localhost unless running via docker
DB_HOST="${DB_HOST:-localhost}"

reset_db() {
  echo "[1/4] Resetting database schema..."
  cd "$BACKEND_DIR"
  node -e "
    const { Pool } = require('pg');
    const pool = new Pool({
      host: process.env.DB_HOST || 'localhost',
      port: parseInt(process.env.DB_PORT, 10) || 5432,
      database: process.env.DB_NAME || 'boresha_mama',
      user: process.env.DB_USER || 'postgres',
      password: process.env.DB_PASSWORD,
    });
    pool.query('DROP SCHEMA IF EXISTS public CASCADE; CREATE SCHEMA public;')
      .then(() => console.log('  Schema reset complete'))
      .catch(err => { console.error('  Reset failed:', err.message); process.exit(1); })
      .finally(() => pool.end());
  "
}

run_migrations() {
  echo "[2/4] Running migrations..."
  cd "$BACKEND_DIR"
  node src/migrations/run.js
}

seed_admin() {
  echo "[3/4] Seeding admin user..."
  cd "$BACKEND_DIR"
  node src/migrations/seed-admin.js
}

start_background() {
  local name="$1"
  local dir="$2"
  local cmd="$3"
  echo "  Starting $name..."
  cd "$dir"
  $cmd &
  # Store PID so we can kill it later
  echo $! >> /tmp/boresha_pids
}

start_servers() {
  echo "[4/4] Starting all servers..."
  > /tmp/boresha_pids

  echo "  Backend → http://localhost:5000"
  start_background "backend" "$BACKEND_DIR" "node src/index.js"

  sleep 2

  echo "  Swagger docs → http://localhost:5000/api/docs/"
  echo "  Facility Dashboard → http://localhost:3000"
  start_background "facility-dashboard" "$FACILITY_DIR" "BROWSER=none npx react-scripts start"

  echo "  County Portal → http://localhost:3001"
  start_background "county-portal" "$COUNTY_DIR" "BROWSER=none PORT=3001 npx react-scripts start"

  echo "  CHV App (web) → http://localhost:3003"
  start_background "chv-app" "$CHV_DIR" "VITE_PORT=3003 npx vite --host"

  echo "  Mother App (web) → http://localhost:3002"
  start_background "mother-app" "$MOTHER_DIR" "VITE_PORT=3002 npx vite --host"

  echo ""
  echo "=== All servers started ==="
  echo "  Admin login: +254700000000 / Admin@123"
  echo ""
  echo "  Press Ctrl+C to stop all servers"
  echo ""

  # Wait for any process to exit
  wait
}

trap 'echo ""; echo "Stopping all servers..."; while read pid; do kill $pid 2>/dev/null || true; done < /tmp/boresha_pids; wait; echo "Done."; exit 0' INT TERM

case "${1:-all}" in
  reset)
    reset_db
    run_migrations
    seed_admin
    ;;
  start)
    start_servers
    ;;
  all|*)
    reset_db
    run_migrations
    seed_admin
    start_servers
    ;;
esac

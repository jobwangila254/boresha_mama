# Boresha-Mama 🏥

> A full-stack digital health platform for maternal health, built for Trans-Nzoia County.

## What's this?

Boresha-Mama is a comprehensive maternal healthcare platform that connects CHVs (Community Health Volunteers), pregnant mothers, healthcare facilities, and county health managers. It helps track pregnancies, schedule appointments, send reminders, and monitor maternal health outcomes.

### What's Inside

- **CHV App** — React Native mobile app for community health workers to register mothers, do home visits, track referrals
- **Mother App** — React Native app for pregnant mothers to track appointments, get health tips, self-monitoring
- **County Portal** — React web dashboard for county health managers to view reports, KPIs, manage facilities
- **Facility Dashboard** — React web app for facility staff to manage pregnancies, appointments, referrals
- **Backend API** — Express REST API with JWT auth, PostgreSQL, SMS reminders via Africa's Talking

Built this because the county was using paper registers and Excel sheets. Honestly, anything was an upgrade.

## Tech Stack

- **Backend:** Node.js, Express, PostgreSQL (with pg for queries)
- **Frontend (Web):** React (CRA for the dashboards)
- **Mobile:** React Native (with react-native-web so the mobile apps also build for browser)
- **Auth:** JWT + bcryptjs (no refresh tokens, just long expiry — works for now)
- **SMS:** Africa's Talking API (daily appointment reminders via node-cron)
- **Deployment:** Render (backend), Vercel (frontend apps)
- **Other:** Helmet, compression, express-rate-limit, winston for logging, swagger for API docs

## Project Structure

```
boresha-mama/
├── backend/                # Express API server
│   ├── src/
│   │   ├── config/         # DB, logger, CORS, swagger config
│   │   ├── controllers/    # Route handlers
│   │   ├── middleware/      # Auth, validation, error handling
│   │   ├── migrations/     # SQL schema + seed scripts
│   │   ├── routes/         # Express routes
│   │   ├── services/       # Business logic (auth, SMS)
│   │   └── index.js        # App entry point
│   ├── tests/
│   └── package.json
├── chv-app/                # CHV mobile app (Vite + React Native Web)
├── mother-app/             # Mother mobile app (Vite + React Native Web)
├── county-portal/          # County admin dashboard (CRA)
├── facility-dashboard/     # Facility staff dashboard (CRA)
├── shared/                 # Shared web shims for RN modules
├── render.yaml             # Render deployment config
└── package.json            # Root scripts for convenience
```

Four frontends might seem like overkill, and honestly it kind of is. But each one targets a different user with different auth needs. Keeps things isolated. Makes deploys annoying though.

## Getting Started

### Prerequisites

- Node.js v18+
- PostgreSQL (local or hosted)
- Africa's Talking API key (for SMS — optional in dev)
- A `.env` file (see `.env.example` in each app folder)

### Installation

```bash
# 1. Clone the repo
git clone https://github.com/your-org/boresha-mama.git
cd boresha-mama

# 2. Install backend deps
cd backend && npm install && cd ..

# 3. Install frontend deps (yes, each one separately — monorepo tooling would be nice someday)
cd chv-app && npm install && cd ..
cd mother-app && npm install && cd ..
cd county-portal && npm install && cd ..
cd facility-dashboard && npm install && cd ..

# or just run npm install at root — it does a postinstall for backend
npm install
```

### Database Setup

```bash
# Create the database
createdb boresha_mama

# Run migrations (SQL files run in order)
cd backend && npm run migrate

# Seed the admin user + test data
cd backend && npm run seed

# Or just the admin if you want to start clean
npm run seed:admin
```

### Environment Variables

Each app has its own `.env` file. The backend one is the most important:

```env
# backend/.env
NODE_ENV=development
PORT=5000
DATABASE_URL=postgresql://user:pass@localhost:5432/boresha_mama
JWT_SECRET=your-secret-here
JWT_EXPIRES_IN=90d
CORS_ORIGIN=http://localhost:3000,http://localhost:3001,...
AT_API_KEY=your-africastalking-key
AT_USERNAME=sandbox
```

For the frontend apps:

```env
# chv-app/.env, mother-app/.env
VITE_API_URL=http://localhost:5000/api

# county-portal/.env, facility-dashboard/.env
REACT_APP_API_URL=http://localhost:5000/api
```

> **Note:** These `.env` files are committed to git (I know, I know — not ideal). They have dev defaults. For production, override via your hosting platform's env vars (Render dashboard, Vercel project settings). I keep meaning to fix this.

### Running Locally

```bash
# Terminal 1: Backend (with auto-reload)
npm run backend:dev

# Terminal 2: County portal
npm run county:start

# Terminal 3: Facility dashboard
npm run facility:start

# Terminal 4: CHV or Mother app (web mode)
npm run mother:web
```

The API docs are at `http://localhost:5000/api/docs` when the backend is running.

## Deployment

### Backend (Render)

The `render.yaml` has the config. Connect your GitHub repo to Render, pick the blueprint, and it should work. Key things:

- The health check endpoint is `/api/health`
- Make sure `DATABASE_URL` is set (Render managed DB works)
- `CORS_ORIGIN` needs your frontend URLs (Vercel, custom domain, whatever)

### Frontend (Vercel)

Each frontend folder has a `vercel.json` with SPA rewrites. Connect each one as a separate Vercel project. Set the environment variables (`VITE_API_URL` or `REACT_APP_API_URL`) in Vercel project settings.

> **Heads up:** Vite and CRA both bake env vars into the build. If you change the API URL, you need to redeploy. Ask me how I learned this.

## Credentials (Dev/Test)

| Role | Login | Password |
|---|---|---|
| County Admin | admin@boreshamama.go.ke | Admin@123 |
| Facility Staff | kiminini@boreshamama.go.ke | Kiminini@123 |
| CHV | +254711000001 | CHV-001 |
| Mother | +254701000001 | Mary@123 |

These are seeded users with realistic-looking data. In production, obviously change these.

## API

Swagger docs at `/api/docs` when the server is running. Major endpoints:

- `POST /api/auth/login` — Login (identifier + password)
- `POST /api/auth/register` — Create user (admin only)
- `GET /api/pregnancies` — List pregnancies
- `GET /api/reports/dashboard` — Dashboard KPIs
- `POST /api/home-visits` — Log a home visit
- `GET /api/health` — Health check (used by Render)

The auth middleware checks JWT and looks up the user in the DB on every request. Not the most performant, but keeps things simple.

## Roadmap

Things I want to add when I have time:

- [ ] Refresh tokens instead of 90-day JWTs
- [x] Auto-generated SMS reminders for appointments
- [ ] Offline support for CHV app (PouchDB/CouchDB sync)
- [ ] Better error messages (the "Invalid email/phone or password" one is getting stale)
- [ ] Proper RBAC with separate permissions per role
- [ ] File uploads (ultrasound images, etc.)
- [ ] The `FIXME` and `TODO` comments scattered everywhere — someday I'll clean those up
- [ ] Move `.env` files out of version control (seriously, I need to do this)
- [ ] Unit tests that actually cover more than the happy path

## Contributing

This is mostly a solo project (with occasional sanity checks from whoever's around), but if you find a bug or want to add something:

1. Fork the repo
2. Create a branch (`git checkout -b fix/whatever`)
3. Make your changes
4. Run the backend tests (`cd backend && npm test`)
5. Push and open a PR

That said, production data is in the Render DB, so please be careful with seed scripts — they delete and recreate data. The `seed-test-users.js` script is safer (uses `ON CONFLICT` where possible, but YMMV).

## License

MIT — use it, fork it, whatever. If you do something cool with it, let me know.

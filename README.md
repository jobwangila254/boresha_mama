# Boresha-Mama

**Mobile and Web-Based Maternal Healthcare System for Trans-Nzoia County, Kenya**

A multi-component platform connecting mothers, Community Health Volunteers (CHVs),
health facilities, and county officials to improve maternal and neonatal health outcomes.

## Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    County Portal (React.js)              │
│              KPI Monitoring · Analytics · Reports        │
└──────────────────────┬──────────────────────────────────┘
                       │ REST API
┌──────────────────────┴──────────────────────────────────┐
│              Facility Dashboard (React.js)               │
│         Patient Records · Appointments · Referrals       │
└──────────────────────┬──────────────────────────────────┘
                       │ REST API
┌──────────────────────┴──────────────────────────────────┐
│               Backend API (Node.js + Express)            │
│         Auth · Business Logic · Data Processing          │
└──┬───────────────────────┬──────────────────────────┬────┘
   │ REST API              │ REST API                  │ REST API
┌──┴──────────────┐ ┌──────┴──────────────┐ ┌──────────┴──────┐
│ Mother App      │ │ CHV App            │ │ SMS Gateway     │
│ (React Native)  │ │ (React Native)     │ │ Africa's Talking│
│ Pregnancy Track │ │ Offline Data Entry │ │ Reminders/Alerts│
│ Appointments    │ │ Vitals · Referrals │ │                 │
│ Self-Monitoring │ │ Risk Screening     │ │                 │
└─────────────────┘ └────────────────────┘ └─────────────────┘
```

## Tech Stack

- **Backend:** Node.js 20, Express.js, PostgreSQL 16
- **Mobile:** React Native (Android)
- **Web Dashboards:** React.js (CRA + Vite)
- **SMS:** Africa's Talking API
- **Auth:** JWT, Role-Based Access Control (RBAC)

## User Roles

1. **Mother** — Pregnancy tracking, appointment booking, health tips, self-monitoring
2. **CHV** — Offline home visit recording, vitals, risk screening, referrals
3. **Facility Staff** — Patient records, appointments, referral tracking, clinic reports
4. **County Admin** — KPIs, analytics, user management, aggregated reporting

## Quick Start

### Prerequisites

- Node.js 20+
- PostgreSQL 16+
- npm

### Setup

```bash
# 1. Backend
cd backend
cp .env.example .env              # edit credentials
npm install
npm run migrate
npm run dev

# 2. Web dashboards (separate terminals)
cd facility-dashboard && npm install && npm start
cd county-portal   && npm install && npm start

# 3. Mobile apps
cd mother-app && npm install && npm start
cd chv-app    && npm install && npm start
```

### Environment variables

Each app has a `.env.example` template. Copy to `.env` and fill in secrets:

| File | Key Variables |
|------|--------------|
| `backend/.env` | `DB_PASSWORD`, `JWT_SECRET`, `AT_API_KEY` |
| `chv-app/.env` | `VITE_API_URL` |
| `mother-app/.env` | `VITE_API_URL` |

## Testing

```bash
# All backend tests (60+ tests)
npm test --prefix backend

# Front-end smoke tests
npm test --prefix facility-dashboard -- --watchAll=false
npm test --prefix county-portal    -- --watchAll=false
npm test --prefix chv-app          -- --forceExit
npm test --prefix mother-app       -- --forceExit
```

## API Documentation

Interactive Swagger UI is available at `http://localhost:5000/api/docs/` when the
backend is running. It documents all endpoints, request/response schemas, and
authentication requirements.

## Code Quality

- **ESLint** — Flat config at repo root, run via `npx eslint backend/src/`
- **Pre-commit hooks** — `husky` + `lint-staged` auto-fix staged `*.js` files
- **CI/CD** — GitHub Actions runs tests + lint on every push/PR

## Project Structure

```
boresha-mama/
├── backend/             # Node.js + Express API server
│   ├── src/controllers/ # Route handlers
│   ├── src/routes/      # Express routes + validation
│   ├── src/middleware/   # Auth, error handling, validation
│   ├── src/services/    # Business logic (SMS, auth)
│   ├── src/migrations/  # DB schema + seed
│   └── tests/           # Jest test suite
├── mother-app/          # React Native app for mothers
├── chv-app/             # React Native app for CHVs
├── facility-dashboard/  # React.js web dashboard (CRA)
├── county-portal/       # React.js web portal (CRA)
├── shared/              # Shared web shims, components
├── docs/                # Training materials
└── scripts/             # Deployment utilities
```

## License

MIT

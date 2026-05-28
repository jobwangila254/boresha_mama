# Boresha-Mama API Documentation

**Base URL:** `http://localhost:5000/api` (dev) | `https://api.boreshamama.go.ke/api` (prod)

## Authentication

All endpoints except `/auth/login` and `/auth/register` require a Bearer token.

```
Authorization: Bearer <token>
```

### Register User
```
POST /auth/register
Body: {
  "phone": "+254712345678",
  "password": "secret123",
  "firstName": "Jane",
  "lastName": "Doe",
  "nationalId": "12345678",
  "role": "mother" | "chv" | "facility_staff" | "county_admin",
  "facilityId": "uuid" (required for facility_staff),
  "jobTitle": "nurse" (required for facility_staff)
}
```

### Login
```
POST /auth/login
Body: { "phone": "+254712345678", "password": "secret123" }
Response: { "token": "jwt...", "user": { "id", "phone", "role", "firstName", "lastName" } }
```

### Get Profile
```
GET /auth/profile
```

## Pregnancies

### Register Pregnancy (CHV/Facility)
```
POST /pregnancies
Body: {
  "motherId": "uuid",
  "lmpDate": "2026-01-15",
  "gravida": 2,
  "parity": 1,
  "riskFactors": ["hypertension"],
  "facilityId": "uuid"
}
```

### List Pregnancies
```
GET /pregnancies
Query: ?status=active&risk_level=high
```

### Get Pregnancy Timeline
```
GET /pregnancies/timeline/:id
Returns: { pregnancy, currentWeek, currentTrimester, appointments, homeVisits, selfMonitoring, healthTips }
```

## Appointments

### Create (Mother/Facility)
```
POST /appointments
Body: {
  "pregnancyId": "uuid",
  "motherId": "uuid",
  "facilityId": "uuid",
  "appointmentDate": "2026-06-15T09:00:00Z",
  "visitType": "antenatal"
}
```

### List
```
GET /appointments?status=scheduled&startDate=2026-01-01
```

### Update Status
```
PATCH /appointments/:id/status
Body: { "status": "completed" | "cancelled" }
```

## Home Visits (CHV)

### Record Visit
```
POST /home-visits
Body: {
  "pregnancyId": "uuid",
  "motherId": "uuid",
  "visitDate": "2026-03-10",
  "visitType": "antenatal",
  "weightKg": 65.5,
  "bpSystolic": 120,
  "bpDiastolic": 80,
  "dangerSigns": ["swelling"],
  "notes": "..."
}
```

### Sync Offline Visits
```
POST /home-visits/sync
Body: { "visits": [ ... ] }
```

## Referrals

### Create
```
POST /referrals
Body: {
  "pregnancyId": "uuid",
  "motherId": "uuid",
  "toFacilityId": "uuid",
  "referralReason": "Pre-eclampsia suspected",
  "priority": "urgent"
}
```

### Update Status
```
PATCH /referrals/:id/status
Body: { "status": "accepted", "outcome": "Admitted for observation" }
```

## Self-Monitoring (Mother)

### Record
```
POST /monitoring
Body: {
  "pregnancyId": "uuid",
  "weightKg": 66.0,
  "bpSystolic": 118,
  "bpDiastolic": 78,
  "symptoms": ["mild_headache"]
}
```

## Facilities

### List
```
GET /facilities?ward=Kiminini&type=health_center
```

### Nearby
```
GET /facilities/nearby?lat=1.0222&lng=35.0155&radius=10
```

## Reports (County/Facility)

### Dashboard Stats
```
GET /reports/dashboard
```

### KPI Data
```
GET /reports/kpi?period=monthly&startDate=2026-01-01
```

### Export
```
GET /reports/export?type=pregnancies|referrals|chv_performance&format=csv
```

## Error Responses

```json
{
  "error": "Description of error",
  "details": [{ "field": "phone", "message": "Valid phone number required" }]
}
```

| Status | Meaning |
|--------|---------|
| 200 | Success |
| 201 | Created |
| 400 | Validation error |
| 401 | Unauthorized |
| 403 | Forbidden |
| 404 | Not found |
| 409 | Conflict |
| 429 | Rate limited |
| 500 | Server error |

## Rate Limits

- General API: 100 requests per 15 min
- Auth endpoints: 10 attempts per 15 min

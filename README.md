# AlgoAliens Admin Panel — Separate Project

This is the standalone admin panel extracted from the main AlgoAliens EdTech platform.

## Project Structure

```
admin_project/
├── admin-frontend/     ← Next.js admin UI (runs on port 3000)
└── admin-backend/      ← NestJS admin API (runs on port 3002)
```

## Setup Instructions

### 1. Admin Backend

```bash
cd admin-backend
npm install
# Edit .env — fill in DB_PASSWORD and other credentials
npm run start:dev
```
Backend runs on: http://localhost:3002

### 2. Admin Frontend

```bash
cd admin-frontend
npm install
# .env.local already points to http://localhost:3002
npm run dev
```
Frontend runs on: http://localhost:3000

## How to Login as Admin

1. Make sure your user has role = 'admin' in the database:
```sql
UPDATE users SET role = 'admin' WHERE email = 'admin@algoaliens.com';
```

2. Open http://localhost:3000/admin/login
3. Enter admin email and password

## What This Project Contains

### Frontend Pages (app/admin/)
- /admin/login          — Admin login page
- /admin/dashboard      — Platform stats overview
- /admin/users          — All students with details
- /admin/courses        — Course management
- /admin/enrollments    — Enrollment monitoring
- /admin/evaluations    — Video evaluation results
- /admin/certificates   — All certificates
- /admin/projects       — Project submissions
- /admin/videos         — Video submissions
- /admin/analytics      — Charts and analytics
- /admin/modules/:id    — Module content management
- /admin/seed           — Database seed page

### Backend Routes (/api/admin/*)
All admin API routes are included. See the main project documentation for full route details.

## Notes
- This admin panel connects to the SAME database as the student project
- Both projects share the same DB — admin manages data, students consume it
- Change PORT in admin-backend .env if port 3002 is already in use

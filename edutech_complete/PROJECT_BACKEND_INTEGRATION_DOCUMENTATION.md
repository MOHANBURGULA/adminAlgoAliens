# AlgoAliens Project, Backend, and Integration Documentation

## 1. Project Overview

AlgoAliens is a learning and certification platform built with:

- Next.js App Router on the frontend
- NestJS on the backend
- PostgreSQL for persistence
- JWT for protected APIs
- Google sign-in support
- Redis for cache, metrics, rate limiting, and queue support
- S3-compatible object storage for uploads
- OpenAI Whisper and GPT for video evaluation
- Nodemailer for password reset email delivery

The current platform supports:

- manual signup and login
- Google sign-in
- course discovery and enrollment
- module documents and progress
- module quizzes and final quizzes
- project submission
- explanation video upload and evaluation
- certificate issuance and verification
- admin review and management flows

## 2. Repository Layout

### Frontend

- `../algoaliens-frontend/app`
- `../algoaliens-frontend/components`
- `../algoaliens-frontend/lib`

### Backend

- `src/app.module.ts`
- `src/auth`
- `src/users`
- `src/courses`
- `src/modules`
- `src/questions`
- `src/quiz-attempts`
- `src/final-quiz`
- `src/evaluation`
- `src/videos`
- `src/projects`
- `src/certificates`
- `src/dashboard`
- `src/admin`
- `src/redis`
- `src/s3`
- `src/openai`
- `src/mail`

## 3. Runtime Architecture

### Frontend to Backend Integration

The frontend calls the backend at `http://localhost:3001`.

Main integration points:

- `app/signup/page.tsx` -> `POST /api/auth/signup`
- `app/signin/page.tsx` -> `POST /api/auth/login`
- `app/auth/success/page.tsx` -> `POST /api/auth/google`
- `lib/api-client.ts` and `lib/axios.ts` -> request transport
- `lib/auth.ts` -> local token storage and post-auth redirect logic

Token behavior:

- JWT is stored in local storage under `token`
- protected requests send `Authorization: Bearer <token>`
- admin users are routed to `/admin/dashboard`
- learner users are routed to `/dashboard`

### Backend Core Integrations

- PostgreSQL stores all domain entities
- Redis supports caching, metrics, rate limiting, and BullMQ integration
- BullMQ handles async evaluation work and falls back to in-process evaluation if Redis is unavailable
- S3-compatible storage handles documents, ZIPs, and video uploads
- OpenAI handles transcription and evaluation scoring
- Mail service sends password reset links to the frontend

## 4. Key Database Entities

Current TypeORM entities include:

- `users`
- `user_profiles`
- `courses`
- `enrollments`
- `modules`
- `module_documents`
- `module_progress`
- `questions`
- `quiz_attempts`
- `final_quiz_attempts`
- `videos`
- `project`
- `evaluations`
- `certificate`

## 5. Existing Backend Route Inventory

### Access legend

- `Public` - no JWT required
- `Auth` - valid JWT required
- `Admin` - valid JWT plus admin guard required

### Auth

- `POST /api/auth/signup` - Public
- `POST /api/auth/login` - Public
- `GET /api/auth/change-password` - Public
- `POST /api/auth/change-password` - Auth
- `POST /api/auth/reset-password` - Public
- `POST /api/auth/google` - Public

### Users

- `POST /api/users/google-login` - Public
- `GET /api/users/me` - Auth
- `PUT /api/users/me` - Auth
- `POST /api/users/profile` - Auth
- `GET /api/users/profile` - Auth

### Learner APIs

- `GET /api/dashboard` - Auth
- `GET /api/courses` - Public
- `GET /api/courses/:id` - Public
- `GET /api/courses/:courseId/modules` - Auth
- `GET /api/courses/:courseId/modules/:moduleId/documents` - Auth
- `GET /api/courses/:courseId/modules/progress` - Auth
- `GET /api/courses/:courseId/modules/:moduleId/questions` - Auth
- `GET /api/courses/:courseId/final-quiz/questions` - Auth
- `POST /api/courses/:courseId/modules/:moduleId/quiz/submit` - Auth
- `GET /api/courses/:courseId/modules/:moduleId/quiz/attempts` - Auth
- `POST /api/courses/:courseId/final-quiz/submit` - Auth
- `GET /api/courses/:courseId/final-quiz/attempts` - Auth
- `POST /api/enroll` - Auth
- `GET /api/enroll` - Auth
- `PUT /api/enroll/:id/progress` - Auth
- `DELETE /api/enroll/:id` - Auth
- `POST /api/projects` - Auth
- `GET /api/projects/upload-url` - Auth
- `GET /api/projects` - Auth
- `POST /api/videos` - Auth
- `GET /api/videos/upload-url` - Auth
- `GET /api/videos` - Auth
- `POST /api/evaluation/submit` - Auth
- `POST /api/evaluation/:courseId/retry` - Auth
- `GET /api/evaluation/:id` - Auth
- `GET /api/evaluation/course/:courseId` - Auth
- `GET /api/certificates` - Auth
- `GET /api/certificates/:id` - Auth
- `GET /api/certificates/:id/verify` - Public
- `GET /api/leaderboard/:courseId` - Auth

### Admin

- `GET /api/admin/dashboard` - Admin
- `GET /api/admin/users` - Admin
- `GET /api/admin/users/:userId` - Admin
- `PUT /api/admin/users/:userId/role` - Admin
- `GET /api/admin/enrollments` - Admin
- `GET /api/admin/enrollments/user/:userId` - Admin
- `GET /api/admin/evaluations` - Admin
- `GET /api/admin/evaluations/user/:userId` - Admin
- `GET /api/admin/certificates` - Admin
- `GET /api/admin/course-progress/:courseId` - Admin
- `POST /api/admin/certificates/release` - Admin
- `GET /api/admin/projects` - Admin
- `PUT /api/admin/projects/:id/status` - Admin
- `GET /api/admin/videos` - Admin
- `PUT /api/admin/videos/:id/status` - Admin
- `POST /api/admin/modules` - Admin
- `PUT /api/admin/modules/:id` - Admin
- `DELETE /api/admin/modules/:id` - Admin
- `POST /api/admin/modules/documents` - Admin
- `PUT /api/admin/modules/documents/:id` - Admin
- `DELETE /api/admin/modules/documents/:id` - Admin
- `GET /api/admin/modules/documents/upload-url` - Admin
- `GET /api/admin/questions/:courseId` - Admin
- `POST /api/admin/questions` - Admin
- `PUT /api/admin/questions/:id` - Admin
- `DELETE /api/admin/questions/:id` - Admin
- `GET /api/admin/courses` - Admin
- `POST /api/admin/courses` - Admin
- `PUT /api/admin/courses/:id` - Admin
- `DELETE /api/admin/courses/:id` - Admin

## 6. Integration Documentation

### PostgreSQL

- configured in `src/app.module.ts`
- uses `TypeOrmModule.forRootAsync`
- uses env variables for host, port, username, password, and database name
- uses `autoLoadEntities: true`
- currently uses `synchronize: true` for development

### JWT

- signing is configured in `src/auth/auth.module.ts`
- additional signing for user routes is configured in `src/users/users.module.ts`
- verification is implemented in `src/auth/jwt.strategy.ts`
- protected routes use `JwtAuthGuard`

### Google Authentication

- frontend Google provider is configured in `../algoaliens-frontend/lib/next-auth.ts`
- backend token exchange is handled by `POST /api/auth/google`
- alternate Google login route also exists at `POST /api/users/google-login`
- Google-created users persist with `password = 'GOOGLE_AUTH'`

### Redis

Redis is used for:

- cache
- operational metrics
- rate limiting
- BullMQ-backed evaluation processing

Key files:

- `src/redis/redis.module.ts`
- `src/redis/redis.service.ts`
- `src/redis/redis-metrics.service.ts`
- `src/redis/redis-rate-limit.guard.ts`

### S3-Compatible Storage

Storage is handled by `src/s3/s3.service.ts`.

Used for:

- module documents
- project ZIPs
- learner videos

Capabilities:

- upload file from backend
- generate presigned upload URL
- download object
- delete object
- list objects

### OpenAI

OpenAI integration is handled by `src/openai/openai.service.ts`.

Responsibilities:

- transcribe uploaded video through Whisper
- evaluate transcript through GPT
- produce `relevanceScore`, `aiDetectionScore`, `finalScore`, and `feedback`

### Mail

Mail integration is handled by `src/mail/mail.service.ts`.

Responsibilities:

- send reset password email
- build reset link using `FRONTEND_URL`

## 7. Backend Authentication Changes Applied

Files changed:

- `src/auth/auth.service.ts`
- `src/auth/jwt.strategy.ts`
- `src/users/users.service.ts`
- `src/users/users.module.ts`

### Manual Signup

Changed behavior for `POST /api/auth/signup`:

- manual passwords are hashed with bcrypt before storage
- response now includes both `token` and `access_token`
- returned user object is sanitized

### Manual Login

Changed behavior for `POST /api/auth/login`:

- email normalization remains case-safe
- Google users with `GOOGLE_AUTH` are blocked from password login
- bcrypt comparison is used for hashed passwords
- legacy plain-text passwords are upgraded to bcrypt on first successful login
- response now includes both `token` and `access_token`

### Shared User Persistence

Changed behavior in `UsersService.create(...)` and `UsersService.updateUser(...)`:

- non-Google passwords are normalized into bcrypt hashes
- `GOOGLE_AUTH` is preserved as-is

### JWT Consistency Fix

Root cause found:

- manual auth token signing used `JWT_SECRET`
- protected route verification used a different hardcoded secret in some places
- this caused successful login to fail on protected APIs

Applied fix:

- `src/auth/jwt.strategy.ts` now reads `JWT_SECRET` through `ConfigService`
- `src/users/users.module.ts` now signs with `JWT_SECRET` through `ConfigService`

Runtime result:

- manual login token now works across protected routes like `/api/users/me`, `/api/dashboard`, `/api/enroll`, `/api/evaluation`, `/api/certificates`, and admin routes

### Validation Completed

Validated during implementation:

- backend build passed with `npm.cmd run build`
- manual signup worked on the running local server
- manual login worked on the running local server
- issued token successfully accessed `GET /api/users/me`
- Google route logic was intentionally left unchanged

## 8. Related Documentation

For PRD-based completion tracking and gap analysis, see:

- `PRD_TRACEABILITY_REPORT.md`

For setup and request walkthroughs, also see:

- `README.md`
- `POSTMAN_GUIDE.md`

## 9. Admin Work Documentation

### 9.1 Admin Access Model

Admin capabilities are protected by:

- `JwtAuthGuard`
- `AdminGuard`

This means an admin user must:

- authenticate with a valid JWT
- have `role = 'admin'`

All admin endpoints are grouped under:

- `/api/admin/*`

### 9.2 Admin Work Completed in the Current Backend

The backend currently supports the following admin work:

- view admin dashboard summary
- view all users
- inspect a single user with enrollments, evaluations, and certificates
- change user role between student and admin
- monitor all enrollments
- monitor all evaluations
- monitor all certificates
- monitor course-level learner progress
- manually issue certificates
- review and update project status
- review and update video status
- manage courses
- manage modules
- manage module documents
- manage question banks

### 9.3 Admin Dashboard and Monitoring Work

Current admin monitoring responsibilities implemented in backend:

- total students summary
- total enrollments summary
- total certificates summary
- pending evaluations summary
- pending projects summary
- pending videos summary
- total courses summary

Backend service area:

- `src/admin/admin.service.ts`

Relevant routes:

- `GET /api/admin/dashboard`
- `GET /api/admin/enrollments`
- `GET /api/admin/enrollments/user/:userId`
- `GET /api/admin/evaluations`
- `GET /api/admin/evaluations/user/:userId`
- `GET /api/admin/certificates`
- `GET /api/admin/course-progress/:courseId`

### 9.4 Admin User Management Work

Current admin user-management responsibilities:

- list all users
- inspect one user's learning footprint
- elevate or demote role

Relevant routes:

- `GET /api/admin/users`
- `GET /api/admin/users/:userId`
- `PUT /api/admin/users/:userId/role`

Notes:

- user detail currently returns enrollments, evaluations, and certificates
- password data is not exposed in admin user responses

### 9.5 Admin Review Work

Current admin review work includes:

- reviewing project submissions
- updating project status
- attaching optional project feedback
- reviewing uploaded videos
- updating video review status
- issuing certificates manually when needed

Relevant routes:

- `GET /api/admin/projects`
- `PUT /api/admin/projects/:id/status`
- `GET /api/admin/videos`
- `PUT /api/admin/videos/:id/status`
- `POST /api/admin/certificates/release`

Current review states evidenced in backend:

- projects use `pending` plus later admin-updated status values
- videos use `under_review` plus later admin-updated status values

### 9.6 Admin Content Management Work

Current admin content-management work includes:

- create course
- update course
- delete course
- create module
- update module
- delete module
- create module document
- update module document
- delete module document
- generate document upload URLs
- create question
- update question
- delete question
- fetch course questions

Relevant routes:

- `GET /api/admin/courses`
- `POST /api/admin/courses`
- `PUT /api/admin/courses/:id`
- `DELETE /api/admin/courses/:id`
- `POST /api/admin/modules`
- `PUT /api/admin/modules/:id`
- `DELETE /api/admin/modules/:id`
- `POST /api/admin/modules/documents`
- `PUT /api/admin/modules/documents/:id`
- `DELETE /api/admin/modules/documents/:id`
- `GET /api/admin/modules/documents/upload-url`
- `GET /api/admin/questions/:courseId`
- `POST /api/admin/questions`
- `PUT /api/admin/questions/:id`
- `DELETE /api/admin/questions/:id`

Important backend behavior:

- course, module, document, and question admin actions invalidate related Redis caches
- course deletion blocks when enrollments already exist
- module and question changes refresh learner-facing content caches

### 9.7 Admin Work That Is Partial or Still Missing

The backend already covers most admin basics, but these admin-oriented gaps still exist relative to the broader PRD:

- no dedicated admin workflow for reviewing typed activity-engine submissions such as `debugging`, `sql_fix`, and `analysis`
- project approval is not yet enforced as a hard prerequisite for certificate issuance
- video approval is not yet enforced as a hard prerequisite for certificate issuance
- certificate issuance is not yet fully admin-controlled because some backend flows still auto-issue certificates
- no employer feedback review workflow
- no student satisfaction review workflow

### 9.8 Recommended Next Admin Enhancements

Recommended next admin-focused improvements:

1. Make admin approval the final gate for certification if PRD alignment is required.
2. Add dedicated review queues for activity submissions, not only projects and videos.
3. Standardize admin review statuses across projects, videos, and future activity items.
4. Add admin audit logs for role changes, approvals, rejections, and certificate releases.
5. Add admin KPI reporting for authenticity rate, course completion rate, and approval turnaround time.

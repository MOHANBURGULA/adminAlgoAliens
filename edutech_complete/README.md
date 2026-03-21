# AlgoAliens EdTech Platform — Backend

NestJS + PostgreSQL backend for the AlgoAliens certification platform.

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | NestJS (Node.js) |
| Language | TypeScript |
| Database | PostgreSQL |
| ORM | TypeORM |
| Auth | JWT (passport-jwt) |
| File Storage | SeaweedFS (local) / Cloudflare R2 (production) |
| Speech-to-Text | OpenAI Whisper |
| AI Evaluation | OpenAI GPT-4o-mini |
| Password Hashing | bcrypt |

---

## Project Structure

```
src/
├── auth/              # Signup, login, JWT
├── users/             # User entity + profile setup
├── courses/           # Course listing (public)
├── modules/           # Course modules, PDF documents, progress tracking
├── questions/         # MCQ questions (module + final quiz)
├── quiz-attempts/     # Module quiz submissions (60% pass threshold)
├── final-quiz/        # Final quiz submissions (80% pass threshold)
├── evaluation/        # Video → Whisper → GPT → score → certificate
├── openai/            # OpenAI Whisper + GPT service
├── enrollments/       # Course enrollment and progress
├── certificates/      # Certificate issuance and retrieval
├── projects/          # Project submissions + S3 ZIP upload
├── videos/            # Video upload (URL or file)
├── s3/                # S3-compatible storage (SeaweedFS / R2)
├── admin/             # Admin panel — content, monitoring, cert management
├── app.module.ts      # Root module
└── main.ts            # Entry point — port 3001
```

---

## Certificate Generation Flow

```
Enroll in course
      ↓
Study module PDFs (1.1, 1.2, 1.3...)
      ↓
Pass module quiz (≥60%) × 5 modules
      ↓
Pass final quiz (≥80%)
      ↓
Record explanation video in browser
      ↓
Upload video directly to S3 (presigned URL)
      ↓
Submit S3 key to POST /api/evaluation/submit
      ↓
Backend: Whisper transcribes audio → GPT evaluates transcript
         ├── relevanceScore: covers expected topics? (0-100)
         ├── aiDetectionScore: sounds AI-generated? (0-100)
         └── finalScore = relevance × (1 - aiScore/200)
      ↓
finalScore ≥ 70 → Certificate auto-issued ✅
finalScore < 70 → Evaluation failed, retry video ❌
      ↓
Admin can also manually release certificate at any time
```

---

## Setup Instructions

### 1. Install dependencies

```bash
npm install
```

Install packages added in this update:

```bash
npm install @nestjs/passport passport passport-jwt @types/passport-jwt @nestjs/jwt
npm install @aws-sdk/client-s3 @aws-sdk/s3-request-presigner
npm install multer @types/multer
npm install uuid @types/uuid
npm install openai
```

### 2. Create your .env file

```bash
cp .env.example .env
```

Fill in your values — especially `DB_PASSWORD` and `OPENAI_API_KEY`.

### 3. Create the PostgreSQL database

```sql
CREATE DATABASE "Edtech";
```

Tables are auto-created by TypeORM on first run (`synchronize: true`).

### 4. Run the server

```bash
npm run start:dev
```

Server: `http://localhost:3001`

### 5. Seed courses

```sql
INSERT INTO courses (title, difficulty) VALUES
  ('Data Structures & Algorithms', 'intermediate'),
  ('SQL Mastery', 'beginner'),
  ('Computer Networks', 'advanced'),
  ('Operating Systems', 'advanced'),
  ('Java Programming', 'beginner'),
  ('Python for DSA', 'beginner');
```

### 6. Create your admin account

Signup normally via `POST /api/auth/signup`, then run:

```sql
UPDATE users SET role = 'admin' WHERE email = 'your-admin@example.com';
```

---

## Full API Routes

### Auth (public)
| Method | Route | Description |
|--------|-------|-------------|
| POST | /api/auth/signup | Register + get JWT token |
| POST | /api/auth/login | Login + get JWT token |

### Users (protected)
| Method | Route | Description |
|--------|-------|-------------|
| POST | /api/users/profile | Create/update profile |
| GET | /api/users/profile | Get my profile |

### Courses (public)
| Method | Route | Description |
|--------|-------|-------------|
| GET | /api/courses | List all courses |
| GET | /api/courses/:id | Get single course |

### Modules (protected)
| Method | Route | Description |
|--------|-------|-------------|
| GET | /api/courses/:id/modules | List modules for a course |
| GET | /api/courses/:id/modules/:mId/documents | Get PDFs for a module |
| GET | /api/courses/:id/modules/progress | My module completion status |

### Questions (protected)
| Method | Route | Description |
|--------|-------|-------------|
| GET | /api/courses/:id/modules/:mId/questions | Module quiz questions (shuffled) |
| GET | /api/courses/:id/final-quiz/questions | Final quiz questions (shuffled) |

### Quiz Attempts (protected)
| Method | Route | Description |
|--------|-------|-------------|
| POST | /api/courses/:id/modules/:mId/quiz/submit | Submit module quiz (60% to pass) |
| GET | /api/courses/:id/modules/:mId/quiz/attempts | My past attempts |

### Final Quiz (protected)
| Method | Route | Description |
|--------|-------|-------------|
| POST | /api/courses/:id/final-quiz/submit | Submit final quiz (80% to pass) |
| GET | /api/courses/:id/final-quiz/attempts | My past attempts |

### Evaluation (protected)
| Method | Route | Description |
|--------|-------|-------------|
| POST | /api/evaluation/submit | Submit video key for AI evaluation |
| GET | /api/evaluation/:id | Poll evaluation result |
| GET | /api/evaluation/course/:courseId | My evaluations for a course |

### Enrollments (protected)
| Method | Route | Description |
|--------|-------|-------------|
| POST | /api/enroll | Enroll in a course |
| GET | /api/enroll | My enrollments |
| PUT | /api/enroll/:id/progress | Update progress |

### Certificates (protected)
| Method | Route | Description |
|--------|-------|-------------|
| GET | /api/certificates | My certificates |

### Projects (protected)
| Method | Route | Description |
|--------|-------|-------------|
| POST | /api/projects | Submit project (optional ZIP) |
| GET | /api/projects/upload-url | Presigned S3 URL for ZIP upload |
| GET | /api/projects | My projects |

### Videos (protected)
| Method | Route | Description |
|--------|-------|-------------|
| POST | /api/videos | Upload video (URL or file) |
| GET | /api/videos/upload-url | Presigned S3 URL for video upload |
| GET | /api/videos | My videos |

### Admin (admin only)
| Method | Route | Description |
|--------|-------|-------------|
| GET | /api/admin/users | All users |
| GET | /api/admin/enrollments | All enrollments |
| GET | /api/admin/enrollments/user/:id | One student's enrollments |
| GET | /api/admin/evaluations | All video evaluations |
| GET | /api/admin/evaluations/user/:id | One student's evaluations |
| GET | /api/admin/certificates | All certificates |
| POST | /api/admin/certificates/release | Manually issue certificate |
| POST | /api/admin/modules | Create a module |
| POST | /api/admin/modules/documents | Register a PDF document |
| GET | /api/admin/modules/documents/upload-url | Presigned URL to upload PDF to S3 |
| GET | /api/admin/questions/:courseId | All questions for a course |
| POST | /api/admin/questions | Add a question |
| PUT | /api/admin/questions/:id | Update a question |
| DELETE | /api/admin/questions/:id | Delete a question |

---

## S3 Storage

| Environment | Provider | Endpoint |
|-------------|----------|---------|
| Local dev | SeaweedFS | `https://s3.algorithmaliens.com` |
| Production | Cloudflare R2 | `https://<account_id>.r2.cloudflarestorage.com` |

Switch environments by changing only the `.env` S3 variables. No code changes needed.

---

## Testing

See `POSTMAN_GUIDE.md` for complete step-by-step testing of all 26 API interactions.

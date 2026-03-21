# Postman Testing Guide — AlgoAliens Backend
## Complete Step-by-Step Guide (All Modules)

---

## Initial Postman Setup

1. Create a Collection called `AlgoAliens`
2. In the Collection → **Variables** tab, add:
   - `token` (leave empty — filled after login)
   - `courseId` (e.g. `1`)
   - `moduleId` (e.g. `1`)
   - `enrollmentId` (filled after enrolling)
   - `evaluationId` (filled after submitting video)
3. In Collection → **Authorization** tab: set Type = `Bearer Token`, Token = `{{token}}`
4. On each individual request → **Authorization** → `Inherit auth from parent`

---

## ═══ SECTION 1: AUTH ═══

### 1.1 — Signup
**POST** `http://localhost:3001/api/auth/signup`
```json
{
  "name": "Naveen",
  "email": "naveen@example.com",
  "password": "test1234"
}
```
✅ Copy `token` from response → paste into Postman collection variable `token`

---

### 1.2 — Login
**POST** `http://localhost:3001/api/auth/login`
```json
{
  "email": "naveen@example.com",
  "password": "test1234"
}
```
✅ Update `token` variable if token expired

---

### 1.3 — Create Admin User
First login or signup as admin, then run this SQL in your database:
```sql
UPDATE users SET role = 'admin' WHERE email = 'admin@example.com';
```
Then login again to get a token with `role: "admin"` in the JWT.

---

## ═══ SECTION 2: USER PROFILE ═══

### 2.1 — Create Profile
**POST** `http://localhost:3001/api/users/profile`
```json
{
  "skillLevel": "beginner",
  "interests": ["DSA", "Python", "SQL"]
}
```

### 2.2 — Get My Profile
**GET** `http://localhost:3001/api/users/profile`

---

## ═══ SECTION 3: COURSES ═══

### 3.1 — List All Courses (No Auth)
**GET** `http://localhost:3001/api/courses`

> If empty, seed the DB:
> ```sql
> INSERT INTO courses (title, difficulty) VALUES
>   ('Data Structures & Algorithms', 'intermediate'),
>   ('SQL Mastery', 'beginner'),
>   ('Computer Networks', 'advanced');
> ```

### 3.2 — Get Course by ID
**GET** `http://localhost:3001/api/courses/1`

---

## ═══ SECTION 4: ADMIN — SETUP CONTENT ═══
> Use admin token for all routes in this section.

### 4.1 — Create Modules for a Course
**POST** `http://localhost:3001/api/admin/modules`
```json
{ "courseId": 1, "title": "Arrays", "orderIndex": 1 }
```
Repeat for all 5 modules (orderIndex 1–5):
- `"Arrays"`, `"Linked Lists"`, `"Stacks & Queues"`, `"Trees"`, `"Final Concepts"`

---

### 4.2 — Upload a PDF Document (2 steps)

**Step A — Get presigned S3 URL:**
**GET** `http://localhost:3001/api/admin/modules/documents/upload-url?filename=arrays-intro.pdf`

Response:
```json
{
  "uploadUrl": "https://s3.algorithmaliens.com/algo-aliens/documents/uuid-arrays-intro.pdf?...",
  "key": "documents/uuid-arrays-intro.pdf"
}
```

**Step B — Upload PDF to S3:**
In Postman, create a new request:
- Method: **PUT**
- URL: the `uploadUrl` from Step A
- Body → **binary** → select your PDF file
- No Auth header needed (presigned URL already has credentials)

**Step C — Register the document:**
**POST** `http://localhost:3001/api/admin/modules/documents`
```json
{
  "moduleId": 1,
  "label": "1.1",
  "title": "Introduction to Arrays",
  "fileUrl": "https://s3.algorithmaliens.com/algo-aliens/documents/uuid-arrays-intro.pdf"
}
```
Repeat for 1.2, 1.3, etc.

---

### 4.3 — Add Module Quiz Questions
**POST** `http://localhost:3001/api/admin/questions`
```json
{
  "courseId": 1,
  "moduleId": 1,
  "type": "module",
  "questionText": "What is the time complexity of accessing an element in an array by index?",
  "options": ["O(n)", "O(log n)", "O(1)", "O(n²)"],
  "correctOptionIndex": 2
}
```
Add at least 3–5 questions per module (repeat for each module).

---

### 4.4 — Add Final Quiz Questions (with expectedAnswer)
**POST** `http://localhost:3001/api/admin/questions`
```json
{
  "courseId": 1,
  "moduleId": 5,
  "type": "final",
  "questionText": "Explain how binary search works and its time complexity.",
  "options": ["O(n) on sorted arrays", "O(log n) on sorted arrays", "O(1) always", "O(n²) worst case"],
  "correctOptionIndex": 1,
  "expectedAnswer": "Binary search works by repeatedly dividing a sorted array in half. It compares the middle element with the target, then searches either the left or right half. Time complexity is O(log n). It requires the array to be sorted and supports random access."
}
```
> The `expectedAnswer` is used by GPT to evaluate the student's spoken video response.

Add at least 5–10 final quiz questions per course.

---

## ═══ SECTION 5: ENROLLMENT ═══

### 5.1 — Enroll in a Course
**POST** `http://localhost:3001/api/enroll`
```json
{ "courseId": 1 }
```
✅ Save the `id` from response as collection variable `enrollmentId`

### 5.2 — View My Enrollments
**GET** `http://localhost:3001/api/enroll`

---

## ═══ SECTION 6: MODULES & DOCUMENTS ═══

### 6.1 — Get Modules for a Course
**GET** `http://localhost:3001/api/courses/1/modules`

### 6.2 — Get Documents for a Module (PDFs)
**GET** `http://localhost:3001/api/courses/1/modules/1/documents`

### 6.3 — Get My Module Progress
**GET** `http://localhost:3001/api/courses/1/modules/progress`

---

## ═══ SECTION 7: MODULE QUIZ ═══

### 7.1 — Get Module Quiz Questions (shuffled)
**GET** `http://localhost:3001/api/courses/1/modules/1/questions`

Response (correct answers hidden):
```json
[
  { "id": 1, "questionText": "...", "options": ["O(n)", "O(1)", "O(log n)", "O(n²)"] },
  { "id": 2, "questionText": "...", "options": ["..."] }
]
```
Note down each question `id` — you need them for submission.

---

### 7.2 — Submit Module Quiz
**POST** `http://localhost:3001/api/courses/1/modules/1/quiz/submit`
```json
{
  "answers": {
    "1": 2,
    "2": 0,
    "3": 1
  }
}
```
> `answers` = `{ questionId: selectedOptionIndex }`. Option index refers to the **original** position in the options array as stored in DB (0-based).

Response:
```json
{
  "score": 67,
  "passed": true,
  "correct": 2,
  "total": 3,
  "message": "Module passed with 67%"
}
```

> Repeat Steps 7.1–7.2 for all 5 modules (moduleId 1 through 5).
> After all 5 modules are passed, you unlock the Final Quiz.

### 7.3 — View My Quiz Attempts
**GET** `http://localhost:3001/api/courses/1/modules/1/quiz/attempts`

---

## ═══ SECTION 8: FINAL QUIZ ═══

### 8.1 — Get Final Quiz Questions
**GET** `http://localhost:3001/api/courses/1/final-quiz/questions`

### 8.2 — Submit Final Quiz
**POST** `http://localhost:3001/api/courses/1/final-quiz/submit`
```json
{
  "answers": {
    "10": 1,
    "11": 0,
    "12": 3,
    "13": 2,
    "14": 1
  }
}
```

Response:
```json
{
  "score": 80,
  "passed": true,
  "correct": 4,
  "total": 5,
  "message": "Final quiz passed with 80%. You may now record your explanation video."
}
```

> Score must be **≥ 80%** to proceed. If below 80%, retry.

### 8.3 — View Final Quiz Attempts
**GET** `http://localhost:3001/api/courses/1/final-quiz/attempts`

---

## ═══ SECTION 9: VIDEO EVALUATION ═══

### 9.1 — Get Presigned URL for Video Upload
**GET** `http://localhost:3001/api/videos/upload-url?filename=explanation.mp4`

Response:
```json
{
  "uploadUrl": "https://s3.algorithmaliens.com/algo-aliens/uuid-explanation.mp4?X-Amz-Signature=...",
  "key": "uuid-explanation.mp4"
}
```

### 9.2 — Upload Video to S3 (direct)
Create a new Postman request:
- Method: **PUT**
- URL: the `uploadUrl` from 9.1
- Body → **binary** → select your `.mp4` video file
- No Authorization header (presigned URL already authenticated)

### 9.3 — Submit Video for Evaluation
**POST** `http://localhost:3001/api/evaluation/submit`
```json
{
  "courseId": 1,
  "videoKey": "uuid-explanation.mp4"
}
```
> `videoKey` = the `key` from step 9.1

Response:
```json
{
  "evaluationId": 1,
  "status": "processing",
  "message": "Video received. Analysis started. Check status at GET /api/evaluation/:id"
}
```
✅ Save `evaluationId` as collection variable

---

### 9.4 — Poll Evaluation Status
**GET** `http://localhost:3001/api/evaluation/1`
*(replace 1 with your evaluationId)*

Response while processing:
```json
{ "id": 1, "status": "processing" }
```

Response when done:
```json
{
  "id": 1,
  "userId": 1,
  "courseId": 1,
  "transcript": "Binary search works by dividing the array in half each time...",
  "relevanceScore": 85,
  "aiDetectionScore": 12,
  "finalScore": 80,
  "status": "passed",
  "feedback": "Good explanation of binary search. Covered time complexity and use cases well. Speech sounds natural.",
  "createdAt": "2026-03-14T10:00:00.000Z"
}
```

> If `finalScore >= 70` and `status = "passed"`, certificate is auto-issued.

### 9.5 — View All My Evaluations for a Course
**GET** `http://localhost:3001/api/evaluation/course/1`

---

## ═══ SECTION 10: CERTIFICATES ═══

### 10.1 — View My Certificates
**GET** `http://localhost:3001/api/certificates`

```json
[
  {
    "id": 1,
    "userId": 1,
    "courseId": 1,
    "score": 80,
    "issuedAt": "2026-03-14T10:00:00.000Z"
  }
]
```

---

## ═══ SECTION 11: ADMIN — MONITORING ═══
> All routes need admin JWT token.

### 11.1 — List All Users
**GET** `http://localhost:3001/api/admin/users`

### 11.2 — All Enrollments
**GET** `http://localhost:3001/api/admin/enrollments`

### 11.3 — Enrollments for One Student
**GET** `http://localhost:3001/api/admin/enrollments/user/1`

### 11.4 — All Video Evaluations
**GET** `http://localhost:3001/api/admin/evaluations`

### 11.5 — Evaluations for One Student
**GET** `http://localhost:3001/api/admin/evaluations/user/1`

### 11.6 — All Certificates
**GET** `http://localhost:3001/api/admin/certificates`

---

## ═══ SECTION 12: ADMIN — MANUAL CERTIFICATE RELEASE ═══

### 12.1 — Manually Issue Certificate
**POST** `http://localhost:3001/api/admin/certificates/release`
```json
{
  "userId": 1,
  "courseId": 1
}
```

Response:
```json
{
  "id": 2,
  "userId": 1,
  "courseId": 1,
  "score": 100,
  "issuedAt": "2026-03-14T12:00:00.000Z"
}
```

---

## ═══ SECTION 13: PROJECTS & VIDEOS ═══

### 13.1 — Submit Project (no file)
**POST** `http://localhost:3001/api/projects`
```json
{
  "courseId": 1,
  "githubLink": "https://github.com/naveen/dsa-project",
  "description": "My DSA project implementation"
}
```

### 13.2 — Submit Project (with ZIP)
**POST** `http://localhost:3001/api/projects` → Body = **form-data**
| Key | Value | Type |
|-----|-------|------|
| courseId | 1 | Text |
| githubLink | https://github.com/naveen/project | Text |
| description | My project | Text |
| zipFile | _(select .zip file)_ | File |

### 13.3 — View My Projects
**GET** `http://localhost:3001/api/projects`

---

## Common Errors & Fixes

| Error | Cause | Fix |
|-------|-------|-----|
| `401 Unauthorized` | Token missing or expired | Re-login, update `token` variable |
| `403 Forbidden` | Not admin | Update DB: `SET role = 'admin'`, re-login |
| `400 Must complete all modules first` | Trying final quiz too early | Complete all 5 module quizzes first |
| `400 Must pass final quiz first` | Trying to submit video too early | Pass final quiz with ≥ 80% first |
| `[]` empty courses or modules | No seed data | Run SQL inserts from Section 3 & 4 |
| Evaluation stuck on `processing` | OpenAI API key missing | Add `OPENAI_API_KEY` to `.env` |
| Certificate not appearing | `finalScore < 70` | Check evaluation result, retry or admin manually releases |
| S3 upload failing | Wrong credentials | Check `.env` S3 values |

---

## Complete Flow Summary

```
Signup → Setup Profile → Browse Courses → Enroll
  → View Module 1 PDFs → Take Module 1 Quiz (≥60%)
  → View Module 2 PDFs → Take Module 2 Quiz
  → ... (all 5 modules)
  → Take Final Quiz (≥80%)
  → Upload Explanation Video to S3
  → Submit Video for Evaluation
  → Poll Status (Whisper transcribes + GPT scores)
  → If finalScore ≥ 70 → Certificate Auto-Issued
  → (Or Admin manually releases certificate)
```

# Evaluation Module

Handles the full video evaluation pipeline after a student records their explanation video.

## Pipeline

```
Student uploads video to S3 (via presigned URL from /api/videos/upload-url)
    ↓
POST /api/evaluation/submit { courseId, videoKey }
    ↓
Guard: final quiz must be passed first (hasPassed check)
    ↓
Evaluation record created with status: "processing"
    ↓
Background task starts:
    1. Download video buffer from S3
    2. Send to OpenAI Whisper → get transcript text
    3. Fetch expectedAnswers for the course from questions table
    4. Send transcript + expected answers to GPT-4o-mini
    5. GPT returns: relevanceScore, aiDetectionScore, finalScore, feedback
    6. Update evaluation record with results and status
    7. If finalScore >= 70 → auto-issue certificate
    ↓
Student polls GET /api/evaluation/:id until status changes from "processing"
```

---

## Authentication Required
All routes require a valid JWT token.

---

## Endpoints

### POST /api/evaluation/submit
Start evaluation for a submitted video.

Body:
```json
{
  "courseId": 1,
  "videoKey": "uuid-explanation.mp4"
}
```
> `videoKey` is the S3 key returned from `GET /api/videos/upload-url`

Response:
```json
{
  "evaluationId": 1,
  "status": "processing",
  "message": "Video received. Analysis started. Check status at GET /api/evaluation/:id"
}
```

---

### GET /api/evaluation/:id
Poll for evaluation result.

Response when complete:
```json
{
  "id": 1,
  "userId": 1,
  "courseId": 1,
  "transcript": "Binary search works by dividing the sorted array in half...",
  "relevanceScore": 85,
  "aiDetectionScore": 12,
  "finalScore": 80,
  "status": "passed",
  "feedback": "Strong explanation of binary search. Covered time complexity and use cases well. Speech sounds natural and unscripted.",
  "createdAt": "2026-03-14T10:00:00.000Z"
}
```

Status values: `pending` | `processing` | `passed` | `failed`

---

### GET /api/evaluation/course/:courseId
Returns all evaluation attempts for the logged-in user in a course.

---

## Scoring

| Field | Meaning |
|-------|---------|
| `relevanceScore` | 0–100: How well the student covered expected topics |
| `aiDetectionScore` | 0–100: How AI-generated/scripted the speech sounds (higher = worse) |
| `finalScore` | `relevanceScore × (1 − aiDetectionScore/200)` |
| Pass threshold | finalScore ≥ 70 |

---

## Files
| File | Purpose |
|------|---------|
| `evaluation.entity.ts` | Evaluations table |
| `evaluation.service.ts` | Pipeline orchestration: S3 download → Whisper → GPT → cert |
| `evaluation.controller.ts` | Route handlers |
| `evaluation.module.ts` | Module wiring |

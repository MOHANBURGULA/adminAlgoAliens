# Quiz Attempts Module

Handles module quiz submissions and automatic scoring. When a student passes a module quiz, that module is marked as completed.

## Authentication Required
All routes require a valid JWT token.

---

## How It Works

1. Student fetches questions: `GET /api/courses/:courseId/modules/:moduleId/questions`
2. Questions are returned shuffled — same questions every time but in a different order
3. The `correctOptionIndex` is **never sent** to the frontend
4. Student submits answers as `{ questionId: selectedOptionIndex }`
5. Backend checks answers against DB, calculates score
6. If score ≥ 60%, module is marked complete → next module unlocked

---

## Endpoints

### POST /api/courses/:courseId/modules/:moduleId/quiz/submit
Submit answers for a module quiz.

Headers:
```
Authorization: Bearer <token>
Content-Type: application/json
```
Body:
```json
{
  "answers": {
    "1": 2,
    "2": 0,
    "3": 1
  }
}
```
> `answers` = `{ questionId: selectedOptionIndex }` — index is 0-based into the **original options array** as stored in DB.

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

---

### GET /api/courses/:courseId/modules/:moduleId/quiz/attempts
Returns all previous quiz attempts for the logged-in user in this course.

---

## Pass Threshold
- **60%** required to pass a module quiz
- Failed attempts can be retried (no limit)
- Only the first passing attempt marks the module complete

## Files
| File | Purpose |
|------|---------|
| `quiz-attempt.entity.ts` | Quiz attempts table with JSONB answers |
| `quiz-attempts.service.ts` | Grading logic, calls ModulesService to mark complete |
| `quiz-attempts.controller.ts` | Route handlers |
| `quiz-attempts.module.ts` | Module wiring |

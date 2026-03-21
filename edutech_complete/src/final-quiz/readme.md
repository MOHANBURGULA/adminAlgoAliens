# Final Quiz Module

The final MCQ test a student takes after completing all 5 course modules. Requires 80% to pass and unlock video evaluation.

## Authentication Required
All routes require a valid JWT token.

---

## Guard
If the student has not completed all modules, the submission is rejected with:
```json
{ "message": "You must complete all course modules before taking the final quiz." }
```

---

## Endpoints

### GET /api/courses/:courseId/final-quiz/questions
Returns final quiz questions in shuffled order. Correct answers are hidden from the response.

---

### POST /api/courses/:courseId/final-quiz/submit
Submit final quiz answers.

Body:
```json
{
  "answers": {
    "10": 1,
    "11": 0,
    "12": 3
  }
}
```

Response (pass):
```json
{
  "score": 80,
  "passed": true,
  "correct": 4,
  "total": 5,
  "message": "Final quiz passed with 80%. You may now record your explanation video."
}
```

Response (fail):
```json
{
  "score": 60,
  "passed": false,
  "correct": 3,
  "total": 5,
  "message": "Score 60% is below the required 80%. Please retry."
}
```

---

### GET /api/courses/:courseId/final-quiz/attempts
Returns all previous final quiz attempts.

---

## Pass Threshold
**80%** required. Retries are allowed.

## Files
| File | Purpose |
|------|---------|
| `final-quiz.entity.ts` | Final quiz attempts table |
| `final-quiz.service.ts` | Grading, 80% threshold, hasPassed() check |
| `final-quiz.controller.ts` | Route handlers |
| `final-quiz.module.ts` | Module wiring |

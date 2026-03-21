# Questions Module

Stores MCQ questions for both module quizzes and the final quiz. Questions are the same for all users but served in shuffled order.

## Authentication Required
All routes require JWT.

## Endpoints

### GET /api/courses/:courseId/modules/:moduleId/questions
Returns shuffled questions for a module quiz. The `correctOptionIndex` is **never sent** to the frontend.
```json
[
  {
    "id": 1,
    "questionText": "What is the time complexity of binary search?",
    "options": ["O(n)", "O(log n)", "O(n²)", "O(1)"]
  }
]
```

### GET /api/courses/:courseId/final-quiz/questions
Returns shuffled questions for the final quiz.

## Notes
- Options within each question are also shuffled on every fetch
- The correct answer is only used server-side during quiz submission
- Admin adds questions via `POST /api/admin/questions`

## Files
| File | Purpose |
|------|---------|
| `question.entity.ts` | Questions table with options (JSONB) and correctOptionIndex |
| `questions.service.ts` | getModuleQuestions, getFinalQuizQuestions, shuffle logic |
| `questions.controller.ts` | Route handlers |

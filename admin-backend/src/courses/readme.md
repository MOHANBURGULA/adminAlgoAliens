# Courses Module

Fetches available courses. These are public routes — no login required.

## Endpoints

### GET /api/courses
Returns all courses.

**Response:**
```json
[
  { "id": 1, "title": "Data Structures & Algorithms", "difficulty": "intermediate", "createdAt": "..." },
  { "id": 2, "title": "SQL Mastery", "difficulty": "beginner", "createdAt": "..." }
]
```

---

### GET /api/courses/:id
Returns a single course by ID.

**Response:**
```json
{ "id": 1, "title": "Data Structures & Algorithms", "difficulty": "intermediate", "createdAt": "..." }
```

## Notes
- No JWT token needed for these routes
- Course data should be inserted manually in the database or via a seed script

## Files

| File | Purpose |
|------|---------|
| `course.entity.ts` | Courses table definition |
| `courses.service.ts` | getCourses, getCourseById methods |
| `courses.controller.ts` | Route handlers |
| `courses.module.ts` | Module wiring |

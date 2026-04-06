# Modules Module

Each course has 5 modules. Each module has documents (PDFs like 1.1, 1.2, 1.3) and a quiz at the end.

## Authentication Required
All routes require a valid JWT token.

## Endpoints

### GET /api/courses/:courseId/modules
Returns all modules for a course in order.
```json
[
  { "id": 1, "courseId": 1, "title": "Arrays", "orderIndex": 1 },
  { "id": 2, "courseId": 1, "title": "Linked Lists", "orderIndex": 2 }
]
```

### GET /api/courses/:courseId/modules/:moduleId/documents
Returns the PDF documents for a module.
```json
[
  { "id": 1, "moduleId": 1, "label": "1.1", "title": "Intro to Arrays", "fileUrl": "https://..." },
  { "id": 2, "moduleId": 1, "label": "1.2", "title": "Array Operations", "fileUrl": "https://..." }
]
```

### GET /api/courses/:courseId/modules/progress
Returns completion status of all modules for the logged-in user in a course.
```json
[
  { "moduleId": 1, "completed": true, "quizScore": 80 },
  { "moduleId": 2, "completed": false }
]
```

## Files
| File | Purpose |
|------|---------|
| `module.entity.ts` | Modules table |
| `module-document.entity.ts` | Module PDF documents table |
| `module-progress.entity.ts` | Tracks which modules each user completed |
| `modules.service.ts` | Business logic |
| `modules.controller.ts` | Route handlers |

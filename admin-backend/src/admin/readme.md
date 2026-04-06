# Admin Module

Admin-only routes for managing content, monitoring students, and manually releasing certificates.

## Authentication Required
All routes require JWT **AND** the user must have `role: "admin"`.

To make a user an admin, update their role directly in the database:
```sql
UPDATE users SET role = 'admin' WHERE email = 'admin@example.com';
```

## Endpoints

### USERS
| Method | Route | Description |
|--------|-------|-------------|
| GET | /api/admin/users | List all registered users |

### PROGRESS MONITORING
| Method | Route | Description |
|--------|-------|-------------|
| GET | /api/admin/enrollments | All enrollments across all students |
| GET | /api/admin/enrollments/user/:userId | All enrollments for one student |
| GET | /api/admin/evaluations | All video evaluation results |
| GET | /api/admin/evaluations/user/:userId | Video evaluations for one student |
| GET | /api/admin/certificates | All issued certificates |

### CERTIFICATE MANAGEMENT
| Method | Route | Description |
|--------|-------|-------------|
| POST | /api/admin/certificates/release | Manually issue certificate |

Body for manual release:
```json
{ "userId": 1, "courseId": 1 }
```

### MODULE & CONTENT MANAGEMENT
| Method | Route | Description |
|--------|-------|-------------|
| POST | /api/admin/modules | Create a module for a course |
| POST | /api/admin/modules/documents | Register a PDF document for a module |
| GET | /api/admin/modules/documents/upload-url?filename=x.pdf | Get presigned S3 URL to upload a PDF |

Create module body:
```json
{ "courseId": 1, "title": "Arrays", "orderIndex": 1 }
```

Register document body (after uploading PDF to S3):
```json
{
  "moduleId": 1,
  "label": "1.1",
  "title": "Introduction to Arrays",
  "fileUrl": "https://s3.algorithmaliens.com/algo-aliens/documents/uuid-arrays.pdf"
}
```

### QUESTION MANAGEMENT
| Method | Route | Description |
|--------|-------|-------------|
| GET | /api/admin/questions/:courseId | All questions for a course |
| POST | /api/admin/questions | Add a new question |
| PUT | /api/admin/questions/:id | Update a question |
| DELETE | /api/admin/questions/:id | Delete a question |

Add question body (module quiz):
```json
{
  "courseId": 1,
  "moduleId": 1,
  "type": "module",
  "questionText": "What is the time complexity of binary search?",
  "options": ["O(n)", "O(log n)", "O(n²)", "O(1)"],
  "correctOptionIndex": 1
}
```

Add question body (final quiz — includes expectedAnswer for video evaluation):
```json
{
  "courseId": 1,
  "moduleId": 1,
  "type": "final",
  "questionText": "Explain how binary search works and when to use it.",
  "options": ["Only on sorted arrays", "On any array", "On linked lists", "On graphs"],
  "correctOptionIndex": 0,
  "expectedAnswer": "Binary search works on sorted arrays by repeatedly halving the search space. Time complexity O(log n). Should be used when data is sorted and random access is available."
}
```

## Files
| File | Purpose |
|------|---------|
| `admin.guard.ts` | Checks `user.role === 'admin'` — rejects with 403 if not admin |
| `admin.service.ts` | All admin business logic |
| `admin.controller.ts` | All admin route handlers |
| `admin.module.ts` | Module wiring |

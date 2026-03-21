# Enrollments Module

Handles course enrollment and progress tracking. When progress reaches 100, a certificate is automatically issued.

## Authentication Required
All routes require a valid JWT token.

## Endpoints

### POST /api/enroll
Enrolls the logged-in user in a course.

**Headers:**
```
Authorization: Bearer <token>
```

**Request Body:**
```json
{
  "courseId": 1
}
```

**Response:**
```json
{
  "id": 1,
  "userId": 1,
  "courseId": 1,
  "progress": 0,
  "createdAt": "2026-03-14T10:00:00.000Z"
}
```

---

### GET /api/enroll
Returns all enrollments for the logged-in user.

**Headers:**
```
Authorization: Bearer <token>
```

---

### PUT /api/enroll/:id/progress
Updates progress for an enrollment. If progress reaches 100, a certificate is automatically created.

**Headers:**
```
Authorization: Bearer <token>
```

**Request Body:**
```json
{
  "progress": 100
}
```

**Response:**
```json
{
  "id": 1,
  "userId": 1,
  "courseId": 1,
  "progress": 100,
  "createdAt": "..."
}
```

> When progress is set to 100, check the certificates table — a certificate will be auto-created.

## Files

| File | Purpose |
|------|---------|
| `enrollment.entity.ts` | Enrollments table definition |
| `enrollments.service.ts` | enroll, getByUser, updateProgress (auto-issues certificate) |
| `enrollments.controller.ts` | Route handlers |
| `enrollments.module.ts` | Module wiring |

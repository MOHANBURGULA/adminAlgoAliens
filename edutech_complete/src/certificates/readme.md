# Certificates Module

Stores and retrieves certificates earned by users. Certificates are auto-issued when enrollment progress hits 100%.

## Authentication Required
All routes require a valid JWT token.

## Endpoints

### GET /api/certificates
Returns all certificates for the logged-in user.

**Headers:**
```
Authorization: Bearer <token>
```

**Response:**
```json
[
  {
    "id": 1,
    "userId": 1,
    "courseId": 1,
    "score": 100,
    "issuedAt": "2026-03-14T10:00:00.000Z"
  }
]
```

## How Certificates Are Issued
You do NOT call this route to create a certificate manually.
The flow is:
1. User enrolls in a course via `POST /api/enroll`
2. Progress is updated via `PUT /api/enroll/:id/progress` with `{ "progress": 100 }`
3. The system automatically checks if progress == 100 and creates the certificate

## Files

| File | Purpose |
|------|---------|
| `certificate.entity.ts` | Certificates table definition |
| `certificates.service.ts` | issueCertificate (auto), getCertificatesByUser |
| `certificates.controller.ts` | Route handlers |
| `certificates.module.ts` | Module wiring |

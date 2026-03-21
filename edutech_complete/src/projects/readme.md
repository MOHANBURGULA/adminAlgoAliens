# Projects Module

Handles project submissions. Students can submit GitHub links, descriptions, and optional ZIP files.

## Authentication Required
All routes require a valid JWT token.

---

## Endpoints

### POST /api/projects
Submits a project. Two options for ZIP upload:

**Option A — Backend upload (multipart/form-data):**

Headers:
```
Authorization: Bearer <token>
Content-Type: multipart/form-data
```
Form fields:
| Field | Type | Required |
|-------|------|----------|
| courseId | number | Yes |
| githubLink | string | Yes |
| description | string | Yes |
| zipFile | file (.zip) | No |

**Option B — Send JSON (no file or with presigned URL key):**

Headers:
```
Authorization: Bearer <token>
Content-Type: application/json
```
Body:
```json
{
  "courseId": 1,
  "githubLink": "https://github.com/naveen/dsa-project",
  "description": "My DSA implementation",
  "zipFile": "uuid-project.zip"
}
```

---

### GET /api/projects/upload-url?filename=project.zip
Generates a **presigned S3 URL** for direct frontend upload.

Headers:
```
Authorization: Bearer <token>
```

Response:
```json
{
  "uploadUrl": "https://s3.algorithmaliens.com/algo-aliens/uuid-project.zip?X-Amz-Signature=...",
  "key": "uuid-project.zip"
}
```

---

### GET /api/projects
Returns all projects submitted by the logged-in user.

---

## Status Values
| Status | Meaning |
|--------|---------|
| `pending` | Default — waiting for admin review |
| `approved` | Project approved |
| `rejected` | Project rejected |

## Files
| File | Purpose |
|------|---------|
| `projects.entity.ts` | Projects table definition |
| `projects.service.ts` | submitProject, getProjectsByUser |
| `projects.controller.ts` | Routes with Multer + S3 + presigned URL |
| `projects.module.ts` | Module wiring with MulterModule and S3Module |

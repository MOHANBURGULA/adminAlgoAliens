# Videos Module

Handles solution explanation video uploads by students. Supports two upload methods.

## Authentication Required
All routes require a valid JWT token.

---

## Endpoints

### POST /api/videos
Uploads a video. Two options:

**Option A — Send video URL (YouTube, external link, or S3 key you already uploaded):**

Headers:
```
Authorization: Bearer <token>
Content-Type: application/json
```
Body:
```json
{
  "title": "My Binary Search Explanation",
  "description": "Walking through my solution step by step",
  "videoUrl": "https://www.youtube.com/watch?v=example"
}
```

**Option B — Upload video file directly via backend (multipart/form-data):**

Headers:
```
Authorization: Bearer <token>
Content-Type: multipart/form-data
```
Form fields:
- `title` — video title
- `description` — explanation notes
- `videoFile` — the video file (.mp4, .mov, etc.)

The backend uploads it to S3 and stores the returned URL automatically.

---

### GET /api/videos/upload-url?filename=myvideo.mp4
Generates a **presigned S3 URL** for direct frontend upload (bypasses the backend server).

Headers:
```
Authorization: Bearer <token>
```

Response:
```json
{
  "uploadUrl": "https://s3.algorithmaliens.com/algo-aliens/uuid-myvideo.mp4?X-Amz-Signature=...",
  "key": "uuid-myvideo.mp4"
}
```

Frontend then does a PUT request to `uploadUrl` with the file, then sends the `key` as `videoUrl` when calling `POST /api/videos`.

---

### GET /api/videos
Returns all videos uploaded by the logged-in user.

Headers:
```
Authorization: Bearer <token>
```

Response:
```json
[
  {
    "id": 1,
    "userId": 1,
    "title": "My Binary Search Explanation",
    "description": "...",
    "videoUrl": "https://s3.algorithmaliens.com/algo-aliens/uuid-video.mp4",
    "status": "under_review",
    "createdAt": "2026-03-14T10:00:00.000Z"
  }
]
```

---

## Status Values
| Status | Meaning |
|--------|---------|
| `under_review` | Default on upload — waiting for admin review |
| `approved` | Admin has approved the video |

## Files
| File | Purpose |
|------|---------|
| `video.entity.ts` | Videos table definition |
| `videos.service.ts` | upload, getUserVideos methods |
| `videos.controller.ts` | Routes with Multer + S3 + presigned URL |
| `videos.module.ts` | Module wiring with MulterModule and S3Module |

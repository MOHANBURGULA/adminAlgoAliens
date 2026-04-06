# S3 Storage Module

Handles all file storage using an S3-compatible API.

- **Local development** → SeaweedFS at `https://s3.algorithmaliens.com`
- **Production** → Cloudflare R2

Both use the same `@aws-sdk/client-s3` SDK. Switching environments only requires changing `.env` values — no code changes needed.

---

## Methods

### uploadFile(buffer, originalName, mimeType)
Uploads a file from the backend (used for ZIP and video uploads via Multer).
Returns the full public URL of the uploaded file.

### generateUploadUrl(originalName)
Generates a **presigned URL** so the frontend can upload directly to S3 without going through the backend server. The URL expires in 1 hour.
Returns `{ uploadUrl, key }`.

### listFiles()
Lists all files in the bucket. Returns array of S3 object metadata.

### getFile(key)
Downloads a file by its key. Returns the S3 GetObject response stream.

### deleteFile(key)
Deletes a file by its key from the bucket.

---

## Environment Variables

Add these to your `.env` file:

```
# Local development (SeaweedFS)
S3_ENDPOINT=https://s3.algorithmaliens.com
S3_REGION=auto
S3_ACCESS_KEY=intern_access
S3_SECRET_KEY=intern_secret
S3_BUCKET=algo-aliens

# Production (Cloudflare R2) — replace with actual values
# S3_ENDPOINT=https://<account_id>.r2.cloudflarestorage.com
# S3_REGION=auto
# S3_ACCESS_KEY=<your_access_key>
# S3_SECRET_KEY=<your_secret_key>
# S3_BUCKET=algo-aliens
```

---

## How It Is Used

S3Service is injected into:
- `ProjectsController` — for ZIP file uploads
- `VideosController` — for video file uploads (future)

To use presigned URLs (frontend direct upload):
1. Frontend calls `GET /api/projects/upload-url?filename=project.zip`
2. Backend returns `{ uploadUrl, key }`
3. Frontend uploads directly to S3 using the `uploadUrl`
4. Frontend sends `key` to `POST /api/projects` as `zipFile`

---

## Files

| File | Purpose |
|------|---------|
| `s3.service.ts` | All S3 operations (upload, download, delete, presign) |
| `s3.module.ts` | Module definition — exports S3Service |

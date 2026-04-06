# Users Module

Handles user profile setup after signup.

## Authentication Required
All routes in this module require a valid JWT token in the Authorization header.

## Endpoints

### POST /api/users/profile
Creates or updates the logged-in user's profile.

**Headers:**
```
Authorization: Bearer <token>
```

**Request Body:**
```json
{
  "skillLevel": "beginner",
  "interests": ["DSA", "Python", "SQL"]
}
```

**Response:**
```json
{
  "id": 1,
  "userId": 1,
  "skillLevel": "beginner",
  "interests": ["DSA", "Python", "SQL"],
  "createdAt": "2026-03-14T10:00:00.000Z"
}
```

---

### GET /api/users/profile
Returns the logged-in user's profile.

**Headers:**
```
Authorization: Bearer <token>
```

**Response:**
```json
{
  "id": 1,
  "userId": 1,
  "skillLevel": "beginner",
  "interests": ["DSA", "Python", "SQL"],
  "createdAt": "2026-03-14T10:00:00.000Z"
}
```

## Files

| File | Purpose |
|------|---------|
| `user.entity.ts` | Users table definition |
| `user-profile.entity.ts` | User profiles table definition |
| `users.service.ts` | create, findByEmail, createProfile, getProfile methods |
| `users.controller.ts` | Route handlers |
| `users.module.ts` | Module wiring |

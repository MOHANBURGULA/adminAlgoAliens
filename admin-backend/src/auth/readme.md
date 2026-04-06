# Auth Module

Handles user registration and login. Returns a JWT token on success.

## Endpoints

### POST /api/auth/signup
Creates a new user account and returns a JWT token.

**Request Body:**
```json
{
  "name": "Naveen",
  "email": "naveen@example.com",
  "password": "mypassword123"
}
```

**Response:**
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": 1,
    "name": "Naveen",
    "email": "naveen@example.com"
  }
}
```

---

### POST /api/auth/login
Logs in an existing user and returns a JWT token.

**Request Body:**
```json
{
  "email": "naveen@example.com",
  "password": "mypassword123"
}
```

**Response:**
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": 1,
    "name": "Naveen",
    "email": "naveen@example.com"
  }
}
```

---

## How JWT Works in This Project

1. After signup or login, you receive a `token`
2. Copy this token
3. For all protected routes, add this header:
   - Key: `Authorization`
   - Value: `Bearer <your_token_here>`

## Files

| File | Purpose |
|------|---------|
| `auth.service.ts` | Signup and login business logic |
| `auth.controller.ts` | Route handlers |
| `auth.module.ts` | Module wiring with JwtModule and PassportModule |
| `jwt.strategy.ts` | Validates Bearer token from Authorization header |
| `jwt-auth.guard.ts` | Guard applied to protected routes |

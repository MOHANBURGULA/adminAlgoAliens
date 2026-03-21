# AlgoAliens EdTech Platform — Database Documentation

## Overview

This document describes the **PostgreSQL database schema** used for the AlgoAliens EdTech platform.

The database supports the following features:

* User authentication (signup / login)
* User profile setup and interests
* Course catalog
* Course modules
* Course enrollment and progress tracking
* Project submissions
* Explanation video uploads
* Skill certificates

The database is designed to support a scalable learning platform where users can enroll in courses, track progress, submit projects, upload solution explanation videos, and earn certificates.

---

# Database Information

Database Name:

```
Edtech
```

Database Type:

```
PostgreSQL
```

Main Tables:

```
users
user_profiles
courses
modules
enrollments
projects
videos
certificates
```

---

# Entity Relationship Overview

```
users
  │
  ├── user_profiles
  │
  ├── enrollments
  │        │
  │        └── courses
  │               │
  │               └── modules
  │
  ├── projects
  │
  ├── videos
  │
  └── certificates
```

---

# Table Descriptions

---

# 1. users

### Purpose

Stores information about users who create an account on the platform.

This table is used for:

* Signup
* Login authentication
* User identification across the platform

### Columns

| Column     | Type                | Description                                 |
| ---------- | ------------------- | ------------------------------------------- |
| id         | SERIAL PRIMARY KEY  | Unique identifier for each user             |
| name       | VARCHAR(100)        | Full name of the user                       |
| email      | VARCHAR(150) UNIQUE | User email address used for login           |
| password   | VARCHAR(200)        | Hashed password                             |
| created_at | TIMESTAMP           | Timestamp when the user account was created |

### Example

| id | name   | email                                       |
| -- | ------ | ------------------------------------------- |
| 1  | Naveen | [naveen@email.com](mailto:naveen@email.com) |

---

# 2. user_profiles

### Purpose

Stores additional profile information collected during the **profile setup step after signup**.

This includes:

* Coding skill level
* Programming interests

Used for:

* Personalized course recommendations
* Skill radar chart
* Dashboard insights

### Columns

| Column      | Type               | Description                        |
| ----------- | ------------------ | ---------------------------------- |
| id          | SERIAL PRIMARY KEY | Unique profile record              |
| user_id     | INT UNIQUE         | References the user                |
| skill_level | VARCHAR(50)        | beginner / intermediate / advanced |
| interests   | TEXT[]             | List of coding interests           |
| created_at  | TIMESTAMP          | Profile creation timestamp         |

### Example

| user_id | skill_level | interests          |
| ------- | ----------- | ------------------ |
| 1       | beginner    | {DSA, Python, SQL} |

---

# 3. courses

### Purpose

Stores all available courses in the learning platform.

Displayed on the **Courses page**.

### Columns

| Column     | Type               | Description                        |
| ---------- | ------------------ | ---------------------------------- |
| id         | SERIAL PRIMARY KEY | Unique course ID                   |
| title      | VARCHAR(200)       | Name of the course                 |
| difficulty | VARCHAR(50)        | beginner / intermediate / advanced |
| created_at | TIMESTAMP          | Course creation time               |

### Example Courses

* Data Structures & Algorithms
* SQL Mastery
* Computer Networks
* Operating Systems
* Java Programming
* Python for DSA

---

# 4. modules

### Purpose

Each course contains several learning modules.

Modules represent lessons or topics inside a course.

### Columns

| Column    | Type               | Description       |
| --------- | ------------------ | ----------------- |
| id        | SERIAL PRIMARY KEY | Module ID         |
| course_id | INT                | References course |
| title     | VARCHAR(200)       | Module title      |

### Example Modules

For DSA:

* Arrays
* Linked Lists
* Stacks
* Queues
* Trees
* Final Evaluation

---

# 5. enrollments

### Purpose

Tracks which users have enrolled in which courses.

Also stores learning progress.

### Columns

| Column     | Type               | Description                |
| ---------- | ------------------ | -------------------------- |
| id         | SERIAL PRIMARY KEY | Enrollment record ID       |
| user_id    | INT                | References users table     |
| course_id  | INT                | References courses table   |
| progress   | INT                | Course progress percentage |
| created_at | TIMESTAMP          | Enrollment date            |

### Example

| user_id | course_id | progress |
| ------- | --------- | -------- |
| 1       | 1         | 65       |

---

# 6. projects

### Purpose

Stores **project submissions** uploaded by students for course evaluation.

Users can submit:

* GitHub repository
* ZIP project files
* Project description

### Columns

| Column      | Type               | Description                   |
| ----------- | ------------------ | ----------------------------- |
| id          | SERIAL PRIMARY KEY | Project submission ID         |
| user_id     | INT                | References user               |
| course_id   | INT                | Course related to project     |
| github_link | TEXT               | GitHub repository URL         |
| zip_file    | TEXT               | ZIP file location             |
| description | TEXT               | Project description           |
| status      | VARCHAR(50)        | pending / approved / rejected |
| created_at  | TIMESTAMP          | Submission time               |

---

# 7. videos

### Purpose

Users upload **solution explanation videos**.

Videos are reviewed before approval.

### Columns

| Column      | Type               | Description             |
| ----------- | ------------------ | ----------------------- |
| id          | SERIAL PRIMARY KEY | Video ID                |
| user_id     | INT                | References user         |
| title       | VARCHAR(200)       | Video title             |
| description | TEXT               | Explanation notes       |
| video_url   | TEXT               | Stored video location   |
| status      | VARCHAR(50)        | under_review / approved |
| created_at  | TIMESTAMP          | Upload time             |

---

# 8. certificates

### Purpose

Stores certificates awarded after course completion.

Used for the **Certificates page**.

### Columns

| Column    | Type               | Description            |
| --------- | ------------------ | ---------------------- |
| id        | SERIAL PRIMARY KEY | Certificate ID         |
| user_id   | INT                | Certificate owner      |
| course_id | INT                | Completed course       |
| score     | INT                | Final evaluation score |
| issued_at | TIMESTAMP          | Certificate issue date |

---

# Database Workflow

User lifecycle in the platform:

```
Signup
 ↓
users table
 ↓
Profile setup
 ↓
user_profiles
 ↓
Browse courses
 ↓
courses + modules
 ↓
Enroll in course
 ↓
enrollments
 ↓
Submit project
 ↓
projects
 ↓
Upload explanation video
 ↓
videos
 ↓
Complete course
 ↓
certificates
```

---

# Future Improvements

Possible extensions:

* Course quizzes
* Leaderboards
* Coding challenges
* Activity tracking
* Instructor review system

---

# Tech Stack

Frontend

```
Next.js
TypeScript
Tailwind CSS
```

Backend

```
NestJS (Node.js)
```

Database

```
PostgreSQL
```

Caching

```
Redis
```

Storage

```
AWS S3
```

---

# Author

AlgoAliens EdTech Platform
Full Stack Internship Project

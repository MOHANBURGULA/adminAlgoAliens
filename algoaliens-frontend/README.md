# AlgoAliens – EdTech Learning Platform

## Overview

**AlgoAliens** is a modern **EdTech learning platform** built with **Next.js, React, and Tailwind CSS** that allows students to enroll in technical courses, complete structured modules, submit projects, and track their progress through a dashboard.

The platform focuses on **structured learning paths** where each course contains multiple modules and ends with a **Final Evaluation module** that includes an MCQ assessment, project submission, and video explanation upload.

This project was developed to simulate the architecture of professional learning platforms like Coursera or Udemy while keeping the implementation simple and scalable.

---

# Features

## 1. Dashboard

The dashboard provides a quick overview of the user's learning progress.

### Dashboard Components

* Courses enrolled
* Challenges solved
* Certificates earned
* Learning streak
* Weekly activity graph
* Skill radar chart
* Course progress tracker

This page acts as the **central hub for user activity**.

---

# 2. Courses Page

The Courses section displays all available courses on the platform.

Each course includes:

* Course title
* Difficulty level
* Progress percentage
* Enroll status
* Structured learning modules

### Example Courses

* Data Structures & Algorithms
* SQL Mastery
* Computer Networks
* Operating Systems
* Java Programming

---

# 3. My Courses

The **My Courses** page displays only the courses the user has enrolled in.

Courses are filtered using the `enrolled` property in the course data.

Example:

```js
enrolled: true
```

Only courses with `enrolled: true` appear inside **My Courses**.

This improves user experience by allowing quick access to active courses.

---

# 4. Course Learning Structure

Every course follows a structured module system.

### Standard Modules

Each course contains **5 learning modules**:

1. Theory
2. Activity (Coding challenge / assignment)
3. Explanation video

Example modules:

```
1 Arrays
2 Linked Lists
3 Stacks
4 Queues
5 Trees
```

---

# 5. Final Evaluation Module

Every course automatically includes a **6th module** called **Final Evaluation**.

This module evaluates the learner before completing the course.

### Final Evaluation Includes

#### MCQ Test

Students must complete a multiple-choice test covering the course material.

```
Start Test → /courses/[courseId]/mcq
```

---

#### Project Submission

Students must submit a project either by:

* Uploading a ZIP file
* Providing a GitHub repository link

Input fields appear dynamically when the user clicks **Submit**.

Example inputs:

* ZIP Upload
* GitHub Repository Link

---

#### Video Explanation

Students must upload a video explaining their project implementation.

Accepted input:

* Video file upload

Example:

```
Upload Explanation Video
```

---

# 6. Certificates

Certificates are displayed inside the **Certificates section**.

In future implementations, certificates can be unlocked automatically when the Final Evaluation is completed.

Example unlock logic:

```
IF
MCQ Test Passed
AND Project Submitted
AND Video Uploaded

THEN
Unlock Certificate
```

---

# 7. Profile Management

Users can manage their profile information.

### Profile Features

* Edit name
* Edit email
* Account settings
* Logout functionality

Future upgrades may include:

* Profile picture upload
* Password change
* Email verification

---

# Sidebar Navigation

The platform uses a sidebar layout for navigation.

### Sidebar Menu

```
Dashboard
Courses
My Courses
Certificates
Profile
```

The sidebar dynamically highlights the current page.

---

# UI Design

The interface uses a **dark futuristic theme**.

### Color System

Primary background:

```
#070312
```

Sidebar background:

```
#0B0518
```

Card background:

```
#0f0622
```

Accent colors:

```
Purple → #9333EA
Cyan → #22D3EE
```

Buttons use gradient styling:

```
from-purple-500 → to-cyan-400
```

---

# Tech Stack

Frontend Framework:

```
Next.js (App Router)
```

UI Library:

```
React
```

Styling:

```
Tailwind CSS
```

Icons:

```
Lucide React
```

Routing:

```
Next.js App Router
```

---

# Project Folder Structure

```
app
 ├ dashboard
 ├ courses
 │   └ [courseId]
 │        ├ page.tsx
 │        ├ mcq
 │        ├ project
 │        └ video-upload
 ├ my-courses
 ├ certificates
 ├ profile
 ├ signin
 ├ signup

components

lib
 └ courses.ts

styles
 └ globals.css

public
```

---

# Course Data Structure

Courses are defined inside:

```
lib/courses.ts
```

Example structure:

```js
{
  id: "1",
  title: "Data Structures & Algorithms",
  level: "Intermediate",
  progress: 65,
  enrolled: true,
  modules: [
    { id: "1", title: "Arrays" },
    { id: "2", title: "Linked Lists" },
    { id: "3", title: "Stacks" },
    { id: "4", title: "Queues" },
    { id: "5", title: "Trees" }
  ]
}
```

The **Final Evaluation module is automatically appended programmatically**.

---

# Dynamic Features Implemented

### Module Expansion

Modules expand and collapse dynamically using React state.

### Dynamic Inputs

Project and video upload inputs appear only when the user clicks submission buttons.

### Course Filtering

My Courses page filters enrolled courses using:

```
courses.filter(course => course.enrolled)
```

---

# Future Enhancements

Possible upgrades for production use:

### Learning System

* Module locking
* Progress persistence
* Auto certificate generation

### Assessment System

* MCQ scoring
* Result dashboard
* Attempt history

### Project Review System

* Instructor review
* GitHub API integration
* Automated project validation

### Media Handling

* Cloud video storage
* File upload backend
* Submission versioning

---

# Installation

Clone the repository:

```
git clone <repository-url>
```

Navigate to the project directory:

```
cd algoaliens-frontend
```

Install dependencies:

```
npm install
```

Run the development server:

```
npm run dev
```

Open the application in your browser:

```
http://localhost:3000
```

---

# Author

**Mohan Burgula**

GitHub
https://github.com/MOHANBURGULA






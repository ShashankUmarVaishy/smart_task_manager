# Software Requirements Specification (SRS)
## Smart Task Manager — v2.0

**Prepared by:** Subrata Das  
**Course:** Software Engineering Lab (6th Semester)  
**Date:** May 2026  
**Document Type:** Software Requirements Specification

---

## 1. Introduction

### 1.1 Purpose
This document defines the functional and non-functional requirements for the **Smart Task Manager** web application — a full-stack productivity tool powered by AI for intelligent task management.

### 1.2 Scope
The Smart Task Manager enables authenticated users to create, manage, search, sort, and track personal tasks via a web browser. It incorporates AI-driven voice input using Google Gemini to enable natural language task creation, and enforces strong security via stateless JWT authentication.

### 1.3 Definitions
| Term | Definition |
|---|---|
| JWT | JSON Web Token — a digitally signed token used for stateless authentication |
| HttpOnly Cookie | A browser cookie inaccessible to JavaScript, used to securely store the JWT |
| Infinite Scroll | A UX pattern where additional data loads as the user scrolls down |
| Rate Limiting | Server-side restriction on how many requests a client can make in a time window |
| Aggregation Pipeline | A MongoDB feature for server-side data computation and transformation |

---

## 2. Overall Description

### 2.1 Product Perspective
The application is a standalone web application using a MERN (MongoDB, Express, React, Node.js) stack. The frontend communicates with a RESTful backend API. A third-party AI service (Google Gemini) is integrated for natural language processing of voice input.

### 2.2 User Classes
- **Registered User** — Can log in, create/manage their own tasks, and use AI features.
- **Anonymous Visitor** — Can access login/register pages only; all task routes are protected.

### 2.3 Operating Environment
- **Frontend**: Modern web browser (Chrome 80+, Edge 80+, Firefox 75+, Safari 14+)
- **Voice Feature**: Requires Chrome or Edge (Web Speech API support)
- **Backend**: Node.js v18+, MongoDB v6+
- **Network**: Standard HTTP/HTTPS

---

## 3. Functional Requirements

### 3.1 User Authentication

| ID | Requirement | Priority |
|---|---|---|
| FR-01 | The system shall allow new users to register with a name, email, and password. | High |
| FR-02 | The system shall hash all passwords using bcrypt before storing them in the database. | High |
| FR-03 | The system shall validate that the email is not already registered during sign-up. | High |
| FR-04 | The system shall authenticate users by verifying email and bcrypt-hashed password on login. | High |
| FR-05 | On successful login/register, the system shall issue a signed JWT stored as an HttpOnly cookie. | High |
| FR-06 | The system shall provide a logout endpoint that expires the auth cookie immediately. | High |
| FR-07 | The system shall redirect unauthenticated users to the login page on any protected route access. | High |

### 3.2 Task Management

| ID | Requirement | Priority |
|---|---|---|
| FR-08 | The system shall allow authenticated users to create tasks with a title, optional deadline, and priority level. | High |
| FR-09 | Priority levels shall be limited to three values: `mid` (default), `high`, and `urgent`. | High |
| FR-10 | The system shall allow users to mark tasks as complete or revert them to pending (toggle). | High |
| FR-11 | The system shall allow users to permanently delete individual tasks. | High |
| FR-12 | The system shall allow users to bulk-delete all completed tasks in one action. | Medium |
| FR-13 | The system shall automatically detect tasks with past deadlines as "overdue". | Medium |
| FR-14 | The system shall extract and render hashtags (e.g. `#work`) from task titles as visual badges. | Low |
| FR-15 | The system shall enforce that a user can only modify or delete tasks they own. | High |

### 3.3 Task Retrieval — Search, Sort & Pagination

| ID | Requirement | Priority |
|---|---|---|
| FR-16 | The system shall return tasks paginated at 15 tasks per page. | High |
| FR-17 | The system shall support infinite scroll — loading the next page when the user reaches the bottom. | High |
| FR-18 | The system shall support server-side keyword search across task titles. | High |
| FR-19 | Search queries shall be debounced on the frontend (500ms) to reduce backend load. | Medium |
| FR-20 | The system shall support sorting by: Newest, Priority (urgent → high → mid), Pending, Completed, and Overdue. | High |
| FR-21 | The system shall return global stats (total, completed, pending, overdue) alongside each page of tasks. | Medium |

### 3.4 AI Voice Input

| ID | Requirement | Priority |
|---|---|---|
| FR-22 | The system shall provide a "Speak to add Task" button that activates the browser's microphone. | High |
| FR-23 | The system shall transcribe user speech using the Web Speech API. | High |
| FR-24 | The system shall send the transcript to the backend, which forwards it to Google Gemini AI. | High |
| FR-25 | Gemini shall extract the task `title`, `deadline` (as ISO 8601), and `priority` from the natural language input. | High |
| FR-26 | The AI prompt shall include the current local timestamp so relative dates ("tomorrow", "next Friday") are resolved correctly. | High |
| FR-27 | On successful AI parsing, the task shall be automatically created without any additional user interaction. | High |
| FR-28 | The system shall display a clear "Listening..." state with visual feedback during voice capture. | Medium |

---

## 4. Non-Functional Requirements

### 4.1 Security

| ID | Requirement |
|---|---|
| NFR-01 | JWT tokens shall never be exposed to JavaScript (stored only in HttpOnly cookies). |
| NFR-02 | All protected API routes shall validate the JWT on every request before processing. |
| NFR-03 | The JWT secret shall be stored in an environment variable, never hardcoded. |
| NFR-04 | Passwords shall never be stored in plaintext; bcrypt with a minimum cost factor of 10 shall be used. |
| NFR-05 | The system shall enforce CORS, accepting requests only from the authorised frontend origin. |

### 4.2 Performance

| ID | Requirement |
|---|---|
| NFR-06 | Authentication shall be stateless — no database lookup required per request (O(1) JWT verification). |
| NFR-07 | Task statistics shall be computed via a single MongoDB aggregation pipeline to avoid N+1 queries. |
| NFR-08 | The frontend shall load no more than 15 tasks at a time to minimise initial page load time. |

### 4.3 Rate Limiting

| ID | Requirement | Limit |
|---|---|---|
| NFR-09 | Global API rate limit (all endpoints). | 100 req / 15 min / IP |
| NFR-10 | Auth rate limit (login & register endpoints). | 10 req / 15 min / IP |
| NFR-11 | Task creation rate limit (`POST /api/tasks` and `POST /api/tasks/ai-parse`). | 30 req / 15 min / IP |

### 4.4 Usability

| ID | Requirement |
|---|---|
| NFR-12 | The UI shall display clear loading indicators during all async operations. |
| NFR-13 | All error states (network errors, validation failures, rate limit hits) shall show human-readable messages. |
| NFR-14 | The application shall be responsive across desktop and mobile screen widths. |

### 4.5 Reliability

| ID | Requirement |
|---|---|
| NFR-15 | A 401 Unauthorized response from any API call shall automatically redirect the user to the login page. |
| NFR-16 | All server-side errors shall be caught and return a structured JSON error response with an appropriate HTTP status code. |

---

## 5. External Interfaces

### 5.1 Google Gemini AI API
- **Endpoint**: Managed via `@google/genai` SDK
- **Model**: `gemini-2.5-flash`
- **Input**: Plain text transcript + current ISO timestamp
- **Output**: Structured JSON `{ title, deadline, priority }`
- **Auth**: API key via `GEMINI_API_KEY` environment variable

### 5.2 MongoDB Database
- **ODM**: Mongoose
- **Collections**: `users`, `tasks`
- **Connection**: Via `MONGO_URI` environment variable (supports both Atlas and local)

---

## 6. Constraints
- The voice feature requires the user to grant microphone permission in the browser.
- The voice feature is only supported in Chromium-based browsers (Chrome, Edge).
- A valid Google Gemini API key is required for AI task parsing.
- The application requires a stable internet connection for AI parsing and database operations.

# Smart Task Manager — Feature Workflow Guide

This document explains the end-to-end workflow for every major feature in the application, including how data flows through the system, how security is enforced, and how rate limiting protects the backend.

---

## 1. 🔐 Authentication Workflow (Login & Register)

This system uses a **Stateless JWT stored in an HttpOnly Cookie**. No sessions are kept on the server.

```
User fills in email & password on LoginPage
            │
            ▼
[Frontend] POST /api/users/login
  - Rate Limited: 10 req / 15 min (prevents brute-force)
            │
            ▼
[Backend - userController.js]
  1. Look up user by email in MongoDB
  2. Run bcrypt.compare(submittedPassword, storedHash)
  3. If match:
       a. jwt.sign({ userId }, JWT_SECRET, { expiresIn: '30d' })
       b. res.cookie('token', jwt, { httpOnly: true, sameSite: 'lax' })
       c. Return { name, email } — NO token in the body!
  4. If no match:
       Return 401 Unauthorized
            │
            ▼
[Browser]
  - Stores the httpOnly cookie internally (JS cannot touch it)
  - localStorage saves only: userName, userEmail (non-sensitive display data)
  - Redirects user to /dashboard
            │
            ▼
Every subsequent API request:
  - Browser automatically attaches the cookie in the request header
  - authMiddleware.js reads req.cookies.token
  - jwt.verify(token, JWT_SECRET) → extracts userId
  - Sets req.userId for the controller
  - No database lookup needed ✅
```

### Logout Flow
```
User clicks "Logout"
            │
            ▼
[Frontend] POST /api/users/logout (withCredentials: true)
            │
            ▼
[Backend] res.cookie('token', '', { expires: new Date(0) })
  - Browser cookie is immediately expired
  - localStorage.clear() removes display data
  - User is redirected to /login
```

---

## 2. 🛡️ Security Layer — How Every Request Is Protected

Every task-related request passes through this middleware chain:

```
HTTP Request arrives
      │
      ▼
[1. Global Rate Limiter]       ← 100 req / 15 min / IP
      │ (passes)
      ▼
[2. CORS Check]                ← Only accepts requests from http://localhost:5173
      │ (passes)
      ▼
[3. Route Matching]            ← /api/tasks/*
      │
      ▼
[4. authMiddleware (protect)]
      ├── Read token from req.cookies.token
      ├── If missing → 401 Unauthorized
      ├── jwt.verify(token, JWT_SECRET)
      ├── If invalid/expired → 401 Unauthorized
      └── If valid → attach req.userId → next()
      │
      ▼
[5. Controller Logic]
      ├── Uses req.userId (trusted, from verified JWT)
      ├── For mutations: checks task.userId === req.userId
      │   (prevents User A from deleting User B's tasks)
      └── Returns response
```

### Why HttpOnly Cookies Beat localStorage

| Attack | localStorage | HttpOnly Cookie |
|---|---|---|
| XSS (malicious JS reads the token) | ❌ Vulnerable — `localStorage.getItem('token')` works | ✅ Safe — JS **cannot** read `httpOnly` cookies |
| CSRF (forged cross-site request) | ✅ Safe — no auto-attach | ⚠️ Mitigated via `sameSite: 'lax'` setting |
| Token in network logs | Same | Same |

---

## 3. ➕ Manual Task Creation Workflow

```
User types a title, selects deadline & priority, clicks "+ Add Task"
            │
            ▼
[Frontend - AddTaskForm.jsx]
  1. handleSubmit validates title is not empty
  2. POST /api/tasks
     Body: { title, deadline, priority }
     Cookie: attached automatically by browser
            │
            ▼
[Rate Limiters]
  - Global: 100 req / 15 min
  - Task Create: 30 req / 15 min  ← specific cap for creation
            │
            ▼
[authMiddleware] → verifies JWT cookie → extracts req.userId
            │
            ▼
[taskController.js - createTask]
  1. Reads userId from req.userId (NOT from body — secure)
  2. Validates title is present
  3. Task.create({ userId, title, deadline, priority })
  4. Returns 201 Created with the new task object
            │
            ▼
[Frontend]
  - Resets page to 1
  - Re-fetches tasks (new task appears at top)
  - Clears the form fields
```

---

## 4. 🎙️ AI Voice Task Creation Workflow

```
User clicks "Speak to add Task"
            │
            ▼
[Frontend - AddTaskForm.jsx]
  1. Checks for window.SpeechRecognition / webkitSpeechRecognition
  2. If unsupported → shows alert (Chrome/Edge only)
  3. Shows "Listening..." state with amber UI feedback
            │
            ▼
[Web Speech API (browser-native)]
  - Captures audio from microphone
  - Transcribes locally in the browser
  - Returns transcript string when user stops speaking
            │
            ▼
[Frontend] POST /api/tasks/ai-parse
  Body: { text: "Submit lab report next Friday, it's urgent",
          localTime: "2026-05-14T14:30:00.000Z" }
  Cookie: attached automatically
            │
            ▼
[Rate Limiters]
  - Global: 100 req / 15 min
  - Task Create: 30 req / 15 min  ← same cap as manual creation
            │
            ▼
[authMiddleware] → JWT verified
            │
            ▼
[aiController.js - parseTaskText]
  1. Validates text is present
  2. Validates GEMINI_API_KEY exists in environment
  3. Builds a prompt:
     "Current time is 2026-05-14T14:30:00Z.
      User said: 'Submit lab report next Friday, it's urgent'
      Return JSON: { title, deadline (ISO 8601), priority }"
  4. Calls Google Gemini 2.5 Flash with a strict JSON schema
  5. Parses response.text as JSON
  6. Returns: { title: "Submit lab report",
                deadline: "2026-05-21T00:00:00.000Z",
                priority: "urgent" }
            │
            ▼
[Frontend]
  - Receives structured task data from AI
  - Automatically calls onAdd(data) → POST /api/tasks
  - Task is created and appears on dashboard instantly
  - No manual input required ✅
```

---

## 5. 📜 Infinite Scroll & Pagination Workflow

```
User opens Dashboard
            │
            ▼
[Frontend - Dashboard.jsx]
  loadTasks(page=1) called on mount
            │
            ▼
[GET /api/tasks?page=1&limit=15&sortBy=newest&search=]
  - Cookie auto-attached
  - authMiddleware verifies JWT
            │
            ▼
[taskController.js - getTasksByUser]
  1. userId = req.userId
  2. Builds MongoDB query from { sortBy, search, page, limit }
  3. For priority sort → MongoDB Aggregation Pipeline:
       $match → $addFields (priorityWeight) → $sort → $skip → $limit
  4. For other sorts → Task.find().sort().skip().limit()
  5. In PARALLEL (Promise.all), counts:
       - total tasks
       - completed tasks
       - pending tasks
       - overdue tasks (pending + deadline < today)
  6. Returns: { tasks: [...15 items], stats: {...}, hasMore: true/false }
            │
            ▼
[Frontend]
  - Renders 15 tasks
  - Shows stats bar (progress bar, counters)
  - Attaches IntersectionObserver to the bottom sentinel div

User scrolls down → sentinel enters viewport
            │
            ▼
  - IntersectionObserver fires
  - page state increments: page = 2
  - loadTasks(page=2) fetches next 15 tasks
  - New tasks appended to existing list (not replaced)
  - If hasMore === false → "All caught up!" message shown
```

---

## 6. 🔍 Search & Sort Workflow

```
User types in search bar
            │
            ▼
[Frontend] searchQuery state updates on every keystroke
  - useEffect watches searchQuery
  - Debounce: waits 500ms after last keystroke before firing
            │
            ▼
[After 500ms of no typing]
  - debouncedSearch updates
  - page resets to 1
  - loadTasks() called with new search param
            │
            ▼
[GET /api/tasks?search=report&page=1&limit=15]
  - authMiddleware verifies JWT
  - MongoDB: { title: { $regex: 'report', $options: 'i' } }
  - Returns filtered results

User changes View dropdown (e.g. "Urgent Priority")
            │
            ▼
  - viewMode state updates
  - page resets to 1
  - loadTasks() called with sortBy=priority
            │
            ▼
[Backend] Aggregation pipeline:
  urgent (weight 3) → high (weight 2) → mid (weight 1)
  Sorted highest weight first
```

---

## 7. ⚡ Rate Limiting Summary

| Layer | Endpoint(s) | Limit | Purpose |
|---|---|---|---|
| **Global** | All `/api/*` | 100 req / 15 min / IP | General abuse prevention |
| **Auth** | `POST /api/users/login` `POST /api/users/register` | 10 req / 15 min / IP | Brute-force attack prevention |
| **Task Create** | `POST /api/tasks` `POST /api/tasks/ai-parse` | 30 req / 15 min / IP | Spam task creation prevention |

When a limit is exceeded, the server responds with `429 Too Many Requests` and a descriptive message. The frontend displays this message to the user.

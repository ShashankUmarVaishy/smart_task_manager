# 🗒️ Smart Task Manager

A **full-stack, AI-powered task management application** built with the MERN stack. Designed with a clean brutalist/journal aesthetic, it combines intuitive UX with enterprise-grade security and modern AI capabilities.

---

## ✨ Features

### 🤖 AI & Voice
- **Voice-to-Task** — Click *"Speak to add Task"*, say your task naturally (e.g. *"Submit the lab report next Friday, it's urgent"*), and Gemini AI automatically extracts the title, deadline, and priority level.
- **Natural Language Understanding** — The AI understands relative dates ("tomorrow", "next Monday"), urgency cues ("it's an emergency"), and converts them into structured task data.

### 📋 Task Management
- **Create, Complete & Delete Tasks** — Full CRUD operations with a clean, minimal UI.
- **Priority Levels** — Three tiers: `Mid` (default), `High`, and `Urgent`, with visual colour-coded badges.
- **Deadline Tracking** — Optional deadline picker with smart quick-fill buttons: *Today*, *Tmrw*, *+1W*.
- **Smart Overdue Detection** — Tasks past their deadline are automatically flagged as Overdue on the server.
- **Hashtag Categorisation** — Type `#work` or `#personal` in any task title and it renders as a styled badge.
- **Clear Completed** — Bulk-delete all completed tasks in one click.

### 🔍 Search & Filter
- **Real-Time Search** — Debounced (500ms) backend search across all your tasks.
- **Sort & Filter Views** — Sort by Newest, Priority, or filter to Pending / Completed / Overdue tasks.

### 📊 Performance & Pagination
- **Infinite Scroll Pagination** — Only 15 tasks are loaded at a time. Scroll to the bottom to automatically fetch the next page — no performance degradation even with thousands of tasks.
- **Server-Side Stats** — Total, Completed, Pending, and Overdue counts are computed on the backend via MongoDB aggregation, ensuring accuracy alongside paginated results.
- **Animated Progress Bar** — Visual completion bar that updates live as tasks are completed.

### 🔒 Security
- **Stateless JWT Authentication** — No sessions stored in the database. Tokens are signed and verified cryptographically.
- **HttpOnly Cookies** — The JWT is stored in a secure, `httpOnly` browser cookie, making it completely inaccessible to JavaScript and immune to XSS attacks.
- **Rate Limiting** — Three-tier protection using `express-rate-limit`:
  - **Global**: 100 requests / 15 min per IP
  - **Auth**: 10 requests / 15 min per IP (brute-force protection)
  - **Task Creation**: 30 task creates / 15 min per IP
- **Ownership Validation** — Every task mutation (delete, complete) verifies the requesting user owns the resource.
- **Password Hashing** — Passwords are hashed with `bcryptjs` before storage; plaintext is never persisted.

---

## 🛠️ Tech Stack

| Layer | Technology |
|---|---|
| **Frontend** | React 18, Vite, Tailwind CSS |
| **Backend** | Node.js, Express.js |
| **Database** | MongoDB (Mongoose ODM) |
| **Auth** | JWT (`jsonwebtoken`), `cookie-parser` |
| **AI** | Google Gemini 2.5 Flash (`@google/genai`) |
| **Voice** | Web Speech API (browser-native) |
| **Rate Limiting** | `express-rate-limit` |
| **Password Security** | `bcryptjs` |

---

## 🚀 Getting Started

### Prerequisites
- Node.js v18+
- MongoDB (local or Atlas)
- A free [Google AI Studio API key](https://aistudio.google.com/app/apikey)

### 1. Clone the Repository
```bash
git clone https://github.com/your-username/smart-task-manager.git
cd smart-task-manager
```

### 2. Setup the Backend
```bash
cd backend
npm install
cp .env.example .env
```

Edit `.env` and fill in your values:
```env
MONGO_URI=mongodb://localhost:27017/smart-task-manager
PORT=5001
JWT_SECRET=your_super_secret_key_here
GEMINI_API_KEY=your_gemini_api_key_here
```

Start the backend:
```bash
npm run dev
```

### 3. Setup the Frontend
```bash
cd ../frontend
npm install
npm run dev
```

The app will be available at **http://localhost:5173**.

---

## 📁 Project Structure

```
smart-task-manager/
├── backend/
│   ├── config/
│   │   └── db.js                  # MongoDB connection
│   ├── controllers/
│   │   ├── aiController.js        # Gemini AI parsing logic
│   │   ├── taskController.js      # Task CRUD + aggregation
│   │   └── userController.js      # Auth logic (register/login/logout)
│   ├── middleware/
│   │   └── authMiddleware.js      # JWT verification via cookie
│   ├── models/
│   │   ├── Task.js                # Task schema
│   │   └── User.js                # User schema (bcrypt hook)
│   ├── routes/
│   │   ├── taskRoutes.js          # Protected task endpoints
│   │   └── userRoutes.js          # Public auth endpoints
│   └── server.js                  # Entry point, middleware, rate limiting
│
└── frontend/
    └── src/
        ├── components/
        │   ├── AddTaskForm.jsx     # Task form with voice AI button
        │   └── TaskCard.jsx        # Individual task display
        ├── pages/
        │   ├── Dashboard.jsx       # Main app view, infinite scroll
        │   ├── LoginPage.jsx       # Login UI
        │   └── RegisterPage.jsx    # Registration UI
        └── utils/
            └── api.js              # Axios instance (withCredentials)
```

---

## 🔐 Security Model

This application uses a **Stateless JWT + HttpOnly Cookie** security paradigm:

1. On login, the server signs a JWT with your `userId` using `JWT_SECRET`.
2. The token is sent to the browser as an `httpOnly` cookie — **JavaScript cannot read it**.
3. The browser automatically attaches the cookie to every subsequent request.
4. The `authMiddleware` verifies the token's signature on every protected route — **no database lookup required**.
5. On logout, the server instructs the browser to expire the cookie immediately.

---

## 📄 License
Link 🔗: https://smart-task-manager-ivory.vercel.app
MIT — Free to use and modify.

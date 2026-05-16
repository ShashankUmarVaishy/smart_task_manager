// =============================================
// server.js — Main Backend Entry Point
// =============================================
// This file:
//  1. Loads environment variables
//  2. Connects to MongoDB
//  3. Sets up Express middleware
//  4. Registers all API routes
//  5. Starts the HTTP server

require('dotenv').config(); // Load .env variables FIRST

const express = require('express');
const cors = require('cors');
const rateLimit = require('express-rate-limit');
const cookieParser = require('cookie-parser');
const connectDB = require('./config/db');

// ── Connect to database ───────────────────────────────────
connectDB();

const app = express();

// ── Middleware ────────────────────────────────────────────

// Allow our React frontend (port 5173 with Vite) to make API calls here
app.use(cors({
  origin: [
    "https://smart-task-manager-subrata-5017s-projects.vercel.app/",
    "http://localhost:5173",
    "https://smart-task-manager-seven-zeta.vercel.app",
    "http://localhost:4173",
    "https://smart-task-manager-ivory.vercel.app"
  ],
  credentials: true,
}));

// Parse incoming JSON request bodies (e.g. req.body.email)
app.use(express.json());
app.use(cookieParser());

// ── Rate Limiting ─────────────────────────────────────────
// Global limiter: 100 requests per 15 minutes per IP
const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100,
  message: { message: 'Too many requests from this IP, please try again after 15 minutes' }
});
app.use('/api/', globalLimiter);

// Auth limiter: 10 requests per 15 minutes per IP for login/register
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 15,
  message: { message: 'Too many authentication attempts, please try again later' }
});
app.use('/api/users', authLimiter);

// Task creation limiter: max 30 task-creates or AI-parses per 15 minutes per IP
// Covers both manual '+ Add Task' and 'Speak to add Task' flows.
const taskCreateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 30,
  message: { message: 'Too many tasks created. Please slow down and try again in 15 minutes.' }
});

// ── API Routes ────────────────────────────────────────────

// User routes: /api/users/register, /api/users/login
app.use('/api/users', require('./routes/userRoutes'));

// Task routes: /api/tasks, /api/tasks/:userId, etc.
// Apply task-creation limiter only to the two write endpoints
app.use('/api/tasks', require('./routes/taskRoutes'));
app.post('/api/tasks', taskCreateLimiter);
app.post('/api/tasks/ai-parse', taskCreateLimiter);

// ── Health Check ──────────────────────────────────────────
app.get('/', (req, res) => {
  res.json({ status: '✅ Smart Task Manager API is running' });
});

// ── Start Server ──────────────────────────────────────────
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 Server running at http://localhost:${PORT}`);
});

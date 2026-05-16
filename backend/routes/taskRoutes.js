// =============================================
// routes/taskRoutes.js — Task API Routes
// =============================================

const express    = require('express');
const router     = express.Router();
const {
  getTasksByUser,
  createTask,
  deleteTask,
  completeTask,
  clearCompletedTasks,
} = require('../controllers/taskController');
const { parseTaskText } = require('../controllers/aiController');
const { protect } = require('../middleware/authMiddleware');

// Secure all task routes
router.use(protect);

// GET  /api/tasks                — Get all tasks for a user
router.get('/', getTasksByUser);

// POST /api/tasks                — Create a new task
router.post('/', createTask);

// POST /api/tasks/ai-parse       — Parse text into task using AI
router.post('/ai-parse', parseTaskText);

// DELETE /api/tasks/clear-completed  — Delete all completed tasks
router.delete('/clear-completed', clearCompletedTasks);

// DELETE /api/tasks/:taskId      — Delete a task
router.delete('/:taskId', deleteTask);

// PUT /api/tasks/:taskId/complete — Toggle completion status
router.put('/:taskId/complete', completeTask);

module.exports = router;

// =============================================
// controllers/taskController.js — Task Logic
// =============================================

const Task = require('../models/Task');

const mongoose = require('mongoose');

// ── GET /api/tasks ─────────────────────────────────
// Returns paginated tasks for the authenticated user, with stats.
const getTasksByUser = async (req, res) => {
  try {
    const userId = req.userId;
    const { sortBy, search, page = 1, limit = 15 } = req.query;

    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);

    // Build query object
    const query = { userId };
    if (search) {
      query.title = { $regex: search, $options: 'i' };
    }
    
    if (sortBy === 'pending') query.status = 'pending';
    if (sortBy === 'completed') query.status = 'completed';
    if (sortBy === 'overdue') {
      query.status = 'pending';
      const today = new Date(); today.setHours(0,0,0,0);
      query.deadline = { $lt: today, $ne: null };
    }

    let tasks;

    // Fetch and sort tasks
    if (sortBy === 'priority') {
      const pipeline = [
        { $match: { ...query, userId: new mongoose.Types.ObjectId(userId) } },
        { 
          $addFields: { 
            priorityWeight: { 
              $switch: { 
                branches: [
                  { case: { $eq: ['$priority', 'urgent'] }, then: 3 },
                  { case: { $eq: ['$priority', 'high'] }, then: 2 },
                  { case: { $eq: ['$priority', 'mid'] }, then: 1 }
                ],
                default: 1
              }
            }
          }
        },
        { $sort: { priorityWeight: -1, createdAt: -1 } },
        { $skip: (pageNum - 1) * limitNum },
        { $limit: limitNum }
      ];
      tasks = await Task.aggregate(pipeline);
    } else {
      tasks = await Task.find(query)
        .sort({ createdAt: -1 })
        .skip((pageNum - 1) * limitNum)
        .limit(limitNum)
        .lean();
    }

    // Calculate global stats for user
    const todayStr = new Date(); todayStr.setHours(0,0,0,0);
    const [total, completed, pending, overdue] = await Promise.all([
      Task.countDocuments({ userId }),
      Task.countDocuments({ userId, status: 'completed' }),
      Task.countDocuments({ userId, status: 'pending' }),
      Task.countDocuments({ userId, status: 'pending', deadline: { $lt: todayStr, $ne: null } })
    ]);

    res.json({
      tasks,
      stats: { total, completed, pending, overdue },
      hasMore: tasks.length === limitNum
    });
  } catch (error) {
    console.error('Get tasks error:', error.message);
    res.status(500).json({ message: 'Error fetching tasks' });
  }
};

// ── POST /api/tasks ────────────────────────────────────────
// Creates a new task for the authenticated user.
// Expects: { title, deadline?, priority? } in the request body.
const createTask = async (req, res) => {
  const userId = req.userId;
  const { title, deadline, priority } = req.body;

  try {
    // Validation
    if (!title) {
      return res.status(400).json({ message: 'Title is required' });
    }

    const task = await Task.create({
      userId,
      title:    title.trim(),
      deadline: deadline || null,   // deadline is optional
      status:   'pending',          // always starts as pending
      priority: priority || 'mid',
    });

    res.status(201).json(task);
  } catch (error) {
    console.error('Create task error:', error.message);
    res.status(500).json({ message: 'Error creating task' });
  }
};

// ── DELETE /api/tasks/:taskId ──────────────────────────────
// Permanently removes a task.
const deleteTask = async (req, res) => {
  try {
    const task = await Task.findById(req.params.taskId);

    if (!task) {
      return res.status(404).json({ message: 'Task not found' });
    }

    if (task.userId.toString() !== req.userId) {
      return res.status(403).json({ message: 'Not authorized to delete this task' });
    }

    await task.deleteOne();
    res.json({ message: 'Task deleted', id: req.params.taskId });

  } catch (error) {
    console.error('Delete task error:', error.message);
    res.status(500).json({ message: 'Error deleting task' });
  }
};

// ── PUT /api/tasks/:taskId/complete ───────────────────────
// Toggles the task status between 'pending' and 'completed'.
const completeTask = async (req, res) => {
  try {
    const task = await Task.findById(req.params.taskId);

    if (!task) {
      return res.status(404).json({ message: 'Task not found' });
    }

    if (task.userId.toString() !== req.userId) {
      return res.status(403).json({ message: 'Not authorized to update this task' });
    }

    // Toggle: completed → pending, pending → completed
    task.status = task.status === 'completed' ? 'pending' : 'completed';
    await task.save();

    res.json(task);
  } catch (error) {
    console.error('Complete task error:', error.message);
    res.status(500).json({ message: 'Error updating task' });
  }
};

// ── DELETE /api/tasks/clear-completed ───────────────
// Permanently removes all completed tasks for the authenticated user.
const clearCompletedTasks = async (req, res) => {
  try {
    const userId = req.userId;
    const result = await Task.deleteMany({ userId, status: 'completed' });
    res.json({ message: 'Completed tasks cleared', deletedCount: result.deletedCount });
  } catch (error) {
    console.error('Clear completed tasks error:', error.message);
    res.status(500).json({ message: 'Error clearing completed tasks' });
  }
};

module.exports = { getTasksByUser, createTask, deleteTask, completeTask, clearCompletedTasks };

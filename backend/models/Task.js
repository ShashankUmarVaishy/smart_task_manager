// =============================================
// models/Task.js — Task Schema & Model
// =============================================
// Each task is linked to a user via the `userId` field.

const mongoose = require('mongoose');

const taskSchema = new mongoose.Schema(
  {
    // Reference to the User who owns this task
    userId: {
      type:     mongoose.Schema.Types.ObjectId, // MongoDB's special ID type
      ref:      'User',                          // Links to the User model
      required: [true, 'userId is required'],
    },

    title: {
      type:      String,
      required:  [true, 'Task title is required'],
      trim:      true,
      maxlength: [200, 'Title too long (max 200 chars)'],
    },

    // Optional deadline date
    deadline: {
      type:    Date,
      default: null,
    },

    // Only "pending" or "completed" are allowed
    status: {
      type:    String,
      enum:    ['pending', 'completed'],
      default: 'pending',
    },

    // Priority level of the task
    priority: {
      type:    String,
      enum:    ['mid', 'high', 'urgent'],
      default: 'mid',
    },
  },
  {
    // createdAt + updatedAt added automatically
    timestamps: true,
  }
);

module.exports = mongoose.model('Task', taskSchema);

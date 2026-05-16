// src/components/TaskList.jsx
// =============================================
// Renders the list of tasks with filter tabs.

import TaskCard from './TaskCard';

export default function TaskList({ tasks, filter, onComplete, onDelete }) {

  // Apply the current filter to tasks
  const filtered = tasks.filter(task => {
    if (filter === 'all')       return true;
    if (filter === 'pending')   return task.status === 'pending';
    if (filter === 'completed') return task.status === 'completed';
    if (filter === 'overdue') {
      if (task.status === 'completed' || !task.deadline) return false;
      const today = new Date(); today.setHours(0,0,0,0);
      return new Date(task.deadline) < today;
    }
    return true;
  });

  // Empty state messages per filter
  const emptyMessages = {
    all:       { icon: '📝', text: 'No tasks yet. Add one above!' },
    pending:   { icon: '⏳', text: 'No pending tasks!' },
    completed: { icon: '🎉', text: 'No completed tasks yet.' },
    overdue:   { icon: '✅', text: "You're all caught up — no overdue tasks!" },
  };

  const empty = emptyMessages[filter] || emptyMessages.all;

  return (
    <div>
      {filtered.length === 0 ? (
        /* ── Empty state ── */
        <div className="text-center py-16 border-2 border-dashed border-stone-200">
          <div className="text-4xl mb-3">{empty.icon}</div>
          <p className="text-stone-400 font-medium">{empty.text}</p>
        </div>
      ) : (
        /* ── Task grid ── */
        <div className="grid gap-3">
          {filtered.map(task => (
            <TaskCard
              key={task._id}
              task={task}
              onComplete={onComplete}
              onDelete={onDelete}
            />
          ))}
        </div>
      )}
    </div>
  );
}

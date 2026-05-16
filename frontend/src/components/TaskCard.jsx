// src/components/TaskCard.jsx
// =============================================
// Displays a single task. Handles:
//  - Overdue highlighting (red)
//  - Completed styling (strikethrough + dimmed)
//  - Complete toggle & delete actions

export default function TaskCard({ task, onComplete, onDelete }) {

  // ── Is the task overdue? ──────────────────
  // Overdue = has a deadline, it's in the past, and task is still pending
  const isOverdue = () => {
    if (!task.deadline || task.status === 'completed') return false;
    const today    = new Date();
    today.setHours(0, 0, 0, 0);
    const deadline = new Date(task.deadline);
    deadline.setHours(0, 0, 0, 0);
    return deadline < today;
  };

  // ── Format date for display ───────────────
  const formatDate = (dateStr) => {
    if (!dateStr) return null;
    return new Date(dateStr).toLocaleDateString('en-US', {
      month: 'short', day: 'numeric', year: 'numeric',
    });
  };

  const overdue   = isOverdue();
  const completed = task.status === 'completed';

  // ── Extract and remove hashtags ───────────
  const hashtagRegex = /#[\w-]+/g;
  const rawTitle = task.title || '';
  const hashtags = rawTitle.match(hashtagRegex) || [];
  const cleanTitle = rawTitle.replace(hashtagRegex, '').trim() || rawTitle;

  return (
    <div
      className={`
        task-card animate-in
        ${overdue   ? 'task-card-overdue' : ''}
        ${completed ? 'task-card-done'    : ''}
      `}
    >
      <div className="flex items-start gap-3">

        {/* ── Completion toggle button ── */}
        <button
          onClick={() => onComplete(task._id)}
          title={completed ? 'Mark as pending' : 'Mark as completed'}
          className={`
            mt-0.5 flex-shrink-0 w-5 h-5 border-2 flex items-center justify-center
            transition-colors duration-150
            ${completed
              ? 'bg-ink border-ink text-paper'
              : overdue
              ? 'border-red-500 hover:border-red-700'
              : 'border-ink hover:border-amber-500'
            }
          `}
        >
          {/* Checkmark shown when completed */}
          {completed && (
            <svg className="w-3 h-3" viewBox="0 0 12 12" fill="none">
              <path d="M2 6l3 3 5-5" stroke="currentColor" strokeWidth="2"
                    strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          )}
        </button>

        {/* ── Task content ── */}
        <div className="flex-1 min-w-0">

          {/* Title */}
          <p className={`font-semibold text-sm leading-snug ${
            completed ? 'line-through text-stone-400' : 'text-ink'
          }`}>
            {cleanTitle}
          </p>

          {/* Badges row */}
          <div className="flex flex-wrap items-center gap-2 mt-2">

            {/* Hashtags */}
            {hashtags.map(tag => (
              <span key={tag} className={`text-xs font-bold tracking-wider px-1.5 py-0.5 ${
                completed ? 'bg-stone-100 text-stone-300' : 'bg-fuchsia-100 text-fuchsia-700'
              }`}>
                {tag}
              </span>
            ))}

            {/* Overdue badge */}
            {overdue && (
              <span className="text-xs font-bold uppercase tracking-wider
                               bg-red-600 text-white px-2 py-0.5">
                Overdue
              </span>
            )}

            {/* Deadline badge */}
            {task.deadline && (
              <span className={`text-xs font-mono px-2 py-0.5 border ${
                overdue
                  ? 'border-red-400 text-red-700 bg-red-50'
                  : completed
                  ? 'border-stone-200 text-stone-400'
                  : 'border-amber-400 text-amber-700 bg-amber-50'
              }`}>
                📅 {formatDate(task.deadline)}
              </span>
            )}

            {/* Status badge */}
            <span className={`text-xs font-bold uppercase tracking-wider px-2 py-0.5 ${
              completed
                ? 'bg-stone-100 text-stone-400'
                : 'bg-amber-100 text-amber-700'
            }`}>
              {completed ? 'Done' : 'Pending'}
            </span>

            {/* Priority badge */}
            <span className={`text-xs font-bold uppercase tracking-wider px-2 py-0.5 border ${
              completed
                ? 'bg-stone-100 text-stone-400 border-transparent'
                : task.priority === 'urgent'
                ? 'bg-red-100 text-red-700 border-red-200'
                : task.priority === 'high'
                ? 'bg-orange-100 text-orange-700 border-orange-200'
                : 'bg-sky-100 text-sky-700 border-sky-200'
            }`}>
              {task.priority || 'Mid'}
            </span>
          </div>

          {/* Created at (small) */}
          <p className="text-xs text-stone-300 font-mono mt-2">
            Created {new Date(task.createdAt).toLocaleDateString()}
          </p>
        </div>

        {/* ── Delete button ── */}
        <button
          onClick={() => onDelete(task._id)}
          title="Delete task"
          className="flex-shrink-0 w-7 h-7 flex items-center justify-center
                     text-stone-300 hover:text-red-600 hover:bg-red-50
                     border border-transparent hover:border-red-200
                     transition-all duration-150 text-lg leading-none"
        >
          ×
        </button>
      </div>
    </div>
  );
}

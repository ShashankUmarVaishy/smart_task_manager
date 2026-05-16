// src/pages/Dashboard.jsx
// =============================================
// Main authenticated page. Shows:
//  - User header + logout
//  - Stats row (total / completed / pending / overdue)
//  - AddTaskForm
//  - Filter tabs + TaskList

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../utils/api';
import AddTaskForm from '../components/AddTaskForm';
import TaskList from '../components/TaskList';

export default function Dashboard() {
  const [tasks, setTasks] = useState([]);
  const [stats, setStats] = useState({ total: 0, completed: 0, pending: 0, overdue: 0 });
  const [viewMode, setViewMode] = useState('newest'); // newest | priority | pending | completed | overdue
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const navigate = useNavigate();

  // Read stored user info from localStorage
  const userName = localStorage.getItem('userName') || 'null';
  const userEmail = localStorage.getItem('userEmail') || '';

  // ── Debounce search ────────────────────────
  useEffect(() => {
    const handler = setTimeout(() => setDebouncedSearch(searchQuery), 500);
    return () => clearTimeout(handler);
  }, [searchQuery]);

  // ── Reset page on filter/search change ─────
  useEffect(() => {
    setPage(1);
  }, [viewMode, debouncedSearch]);

  // ── Fetch tasks ────────────────────────────
  useEffect(() => {
    loadTasks();
  }, [viewMode, debouncedSearch, page]);

  const loadTasks = async () => {
    try {
      if (page === 1) setLoading(true);
      const sortParam = viewMode === 'priority' ? 'priority' : (viewMode === 'newest' ? 'newest' : viewMode);
      // GET /api/tasks (userId is extracted from cookie)
      const { data } = await api.get(`/tasks?sortBy=${sortParam}&search=${debouncedSearch}&page=${page}&limit=15`);

      if (page === 1) setTasks(data.tasks);
      else setTasks(prev => [...prev, ...data.tasks]);

      setStats(data.stats);
      setHasMore(data.hasMore);
    } catch (err) {
      console.log("Error in dashboard 1.: ", err);
      if (err.response?.status === 401) {
        navigate('/login');
      } else {
        setError('Could not load tasks. Is the backend running?');
      }
    } finally {
      setLoading(false);
    }
  };

  // ── Create task ────────────────────────────
  const handleAddTask = async ({ title, deadline, priority }) => {
    try {
      await api.post('/tasks', { title, deadline, priority });
      setPage(1);
      if (page === 1) loadTasks();
    } catch (err) {
      console.log("Error in dashboard 2: ", err);
      if (err.response?.status === 401) navigate('/login');
    }
  };

  // ── Toggle complete ────────────────────────
  const handleComplete = async (taskId) => {
    try {
      const { data } = await api.put(`/tasks/${taskId}/complete`);
      setTasks(prev => prev.map(t => t._id === taskId ? data : t));
      setStats(prev => ({
        ...prev,
        completed: data.status === 'completed' ? prev.completed + 1 : prev.completed - 1,
        pending: data.status === 'completed' ? prev.pending - 1 : prev.pending + 1
      }));
    } catch (err) {
      console.log("Error in dashboard 3: ", err);
      alert('Failed to update task.');
    }
  };

  // ── Delete task ────────────────────────────
  const handleDelete = async (taskId) => {
    if (!confirm('Delete this task? This cannot be undone.')) return;
    try {
      await api.delete(`/tasks/${taskId}`);
      setTasks(prev => prev.filter(t => t._id !== taskId));
      setStats(prev => ({ ...prev, total: prev.total - 1 }));
    } catch (err) {
      console.log("Error in dashboard 4: ", err);
      alert('Failed to delete task.');
    }
  };

  // ── Clear completed tasks ──────────────────
  const handleClearCompleted = async () => {
    if (!confirm('Are you sure you want to delete all completed tasks?')) return;
    try {
      await api.delete(`/tasks/clear-completed`);
      setPage(1);
      if (page === 1) loadTasks();
    } catch (err) {
      console.log("Error in dashboard 5: ", err);
      alert('Failed to clear completed tasks.');
    }
  };

  // ── Logout ─────────────────────────────────
  const handleLogout = async () => {
    try {
      await api.post('/users/logout');
    } catch (err) {
      console.log("Error in dashboard 6: ", err);
      // ignore
    }
    localStorage.clear();
    navigate('/login');
  };

  const { total, completed, pending, overdue } = stats;

  return (
    <div className="min-h-screen bg-paper">

      {/* ── Top navigation bar ── */}
      <nav className="bg-ink text-paper border-b-4 border-amber-500 sticky top-0 z-10">
        <div className="max-w-3xl mx-auto px-4 py-4 flex items-center justify-between">

          {/* Brand */}
          <div className="flex items-center gap-2">
            <span className="text-amber-400 font-mono font-bold text-lg">✓</span>
            <span className="font-bold tracking-tight text-lg">SmartTasks</span>
          </div>

          {/* User + logout */}
          <div className="flex items-center gap-4">
            <div className="text-right hidden sm:block">
              <p className="text-xs font-bold text-paper">{userName}</p>
              <p className="text-xs text-stone-400 font-mono">{userEmail}</p>
            </div>
            <button
              onClick={handleLogout}
              className="text-xs font-bold uppercase tracking-wider text-stone-400
                         hover:text-amber-400 transition-colors"
            >
              Log out
            </button>
          </div>
        </div>
      </nav>

      {/* ── Main content ── */}
      <main className="max-w-3xl mx-auto px-4 py-10">

        {/* Page heading */}
        <div className="mb-8">
          <h1 className="text-3xl font-extrabold text-ink">
            Hey, {userName.split(' ')[0]}. 👋
          </h1>
          <div className="flex items-center gap-4 mt-2">
            <p className="text-stone-400 text-sm">
              {pending > 0
                ? `You have ${pending} pending task${pending !== 1 ? 's' : ''}.`
                : 'All caught up — nothing pending!'}
            </p>
            {total > 0 && (
              <div className="flex-1 max-w-xs h-2 bg-stone-200 rounded-none overflow-hidden" title={`${Math.round((completed / total) * 100)}% Completed`}>
                <div
                  className="h-full bg-emerald-500 transition-all duration-500"
                  style={{ width: `${(completed / total) * 100}%` }}
                />
              </div>
            )}
          </div>
        </div>

        {/* ── Stats row ── */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-8">
          {[
            { label: 'Total', value: total, accent: 'border-ink' },
            { label: 'Completed', value: completed, accent: 'border-emerald-500' },
            { label: 'Pending', value: pending, accent: 'border-amber-500' },
            {
              label: 'Overdue', value: overdue, accent: 'border-red-500',
              highlight: overdue > 0
            },
          ].map(s => (
            <div
              key={s.label}
              className={`bg-white border-2 ${s.accent} p-4
                          shadow-[3px_3px_0px_0px_#1a1612]
                          ${s.highlight ? 'bg-red-50' : ''}`}
            >
              <p className={`text-3xl font-extrabold ${s.highlight ? 'text-red-600' : 'text-ink'
                }`}>
                {s.value}
              </p>
              <p className="text-xs font-bold uppercase tracking-widest text-stone-400 mt-1">
                {s.label}
              </p>
            </div>
          ))}
        </div>

        {/* ── Overdue warning banner ── */}
        {overdue > 0 && (
          <div className="mb-6 px-5 py-4 bg-red-600 text-white border-2 border-ink
                          shadow-[4px_4px_0px_0px_#1a1612] flex items-center gap-3 animate-in">
            <span className="text-2xl">🚨</span>
            <div>
              <p className="font-bold text-sm">
                {overdue} task{overdue !== 1 ? 's are' : ' is'} overdue!
              </p>
              <p className="text-xs text-red-200 mt-0.5">
                Check the "Overdue" tab below to prioritise them.
              </p>
            </div>
          </div>
        )}

        {/* ── Add task form ── */}
        <AddTaskForm onAdd={handleAddTask} />

        {/* ── Error message ── */}
        {error && (
          <div className="mb-4 px-4 py-3 bg-red-50 border-2 border-red-500 text-red-700 text-sm">
            {error}
          </div>
        )}

        {/* ── Search Bar ── */}
        <div className="mb-4">
          <input
            type="text"
            placeholder="Search tasks..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="field w-full text-stone-600 bg-white"
          />
        </div>

        {/* ── Controls: Sort/Filter & Clear ── */}
        <div className="flex flex-col sm:flex-row gap-4 mb-6 items-start sm:items-center justify-between">
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <label className="text-xs font-bold uppercase tracking-widest text-stone-400">View:</label>
            <select
              value={viewMode}
              onChange={e => setViewMode(e.target.value)}
              className="field flex-1 sm:w-48 text-stone-600 bg-white cursor-pointer py-2"
            >
              <optgroup label="Sort By">
                <option value="newest">All Tasks (Newest)</option>
                <option value="priority">All Tasks (Priority)</option>
              </optgroup>
              <optgroup label="Filter By">
                <option value="pending">Pending Tasks</option>
                <option value="completed">Completed Tasks</option>
                <option value="overdue">Overdue Tasks</option>
              </optgroup>
            </select>
          </div>

          {completed > 0 && (
            <button
              onClick={handleClearCompleted}
              className="px-5 py-2 font-semibold text-sm tracking-wide bg-red-600 text-white border-2 border-red-800 shadow-[3px_3px_0px_0px_#991b1b] hover:shadow-[5px_5px_0px_0px_#991b1b] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none transition-all duration-150 cursor-pointer whitespace-nowrap"
            >
              Clear Completed
            </button>
          )}
        </div>

        {/* ── Task list ── */}
        {loading && page === 1 ? (
          <div className="text-center py-16">
            <div className="inline-block w-8 h-8 border-4 border-amber-500 border-t-transparent
                            rounded-full animate-spin mb-3" />
            <p className="text-stone-400 text-sm font-medium">Loading tasks…</p>
          </div>
        ) : (
          <>
            <TaskList
              tasks={tasks}
              filter={['pending', 'completed', 'overdue'].includes(viewMode) ? viewMode : 'all'}
              onComplete={handleComplete}
              onDelete={handleDelete}
            />

            {hasMore && (
              <div className="mt-8 text-center">
                <button
                  onClick={() => setPage(p => p + 1)}
                  className="px-6 py-3 bg-white border-2 border-ink text-ink font-bold text-sm tracking-widest uppercase hover:bg-stone-50 shadow-[4px_4px_0px_0px_#1a1612] transition-colors"
                >
                  {loading ? 'Loading...' : 'Load More Tasks ↓'}
                </button>
              </div>
            )}
          </>
        )}

      </main>
    </div>
  );
}

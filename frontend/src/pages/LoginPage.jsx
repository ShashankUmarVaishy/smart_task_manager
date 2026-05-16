// src/pages/LoginPage.jsx
// =============================================
// Warm industrial aesthetic: bold type, hard shadows,
// amber accents on a cream-paper background.

import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../utils/api';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      // POST /api/users/login
      const { data } = await api.post('/users/login', { email, password });
      console.log("DAta : ", data);
      // Store user info in localStorage
      localStorage.setItem('userName', data.name);
      localStorage.setItem('userEmail', data.email);

      navigate('/dashboard');
    } catch (err) {
      console.log('Login error:', err);
      setError(err.response?.data?.message || 'Login failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-paper flex items-center justify-center p-6">
      <div className="w-full max-w-md animate-in">

        {/* Brand mark */}
        <div className="mb-10">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 bg-ink flex items-center justify-center
                            shadow-[3px_3px_0px_0px_#d97706]">
              <span className="text-amber-400 text-lg font-bold font-mono">✓</span>
            </div>
            <span className="text-ink font-bold text-xl tracking-tight">SmartTasks</span>
          </div>
          <h1 className="text-4xl font-extrabold text-ink leading-tight">
            Welcome<br />back.
          </h1>
          <p className="text-stone-500 mt-2 text-sm">Sign in to manage your tasks.</p>
        </div>

        {/* Form card */}
        <div className="bg-white border-2 border-ink p-8 shadow-[6px_6px_0px_0px_#1a1612]">

          {/* Error */}
          {error && (
            <div className="mb-5 px-4 py-3 bg-red-50 border-2 border-red-500 text-red-700 text-sm font-medium">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">

            <div>
              <label className="block text-xs font-bold uppercase tracking-widest text-ink mb-2">
                Email
              </label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="you@example.com"
                required
                className="field"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-widest text-ink mb-2">
                Password
              </label>
              <input
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="Your password"
                required
                className="field"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="btn w-full text-center mt-2"
            >
              {loading ? 'Signing in…' : 'Sign In →'}
            </button>
          </form>

          <p className="mt-6 text-sm text-stone-500 text-center">
            No account?{' '}
            <Link
              to="/register"
              className="text-ink font-semibold underline underline-offset-2 hover:text-amber-700"
            >
              Register here
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}

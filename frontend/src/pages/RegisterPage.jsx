// src/pages/RegisterPage.jsx
// =============================================

import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../utils/api';

export default function RegisterPage() {
  const [name,            setName]            = useState('');
  const [email,           setEmail]           = useState('');
  const [password,        setPassword]        = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error,           setError]           = useState('');
  const [loading,         setLoading]         = useState(false);

  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    // Client-side password match check
    if (password !== confirmPassword) {
      return setError('Passwords do not match');
    }
    if (password.length < 6) {
      return setError('Password must be at least 6 characters');
    }

    setLoading(true);

    try {
      // POST /api/users/register
      const { data } = await api.post('/users/register', { name, email, password });

      // Auto-login: store user info immediately after registration
      localStorage.setItem('userName',  data.name);
      localStorage.setItem('userEmail', data.email);

      navigate('/dashboard');
    } catch (err) {
      console.log('Registration error:', err);
      setError(err.response?.data?.message || 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-paper flex items-center justify-center p-6">
      <div className="w-full max-w-md animate-in">

        {/* Brand */}
        <div className="mb-10">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 bg-ink flex items-center justify-center
                            shadow-[3px_3px_0px_0px_#d97706]">
              <span className="text-amber-400 text-lg font-bold font-mono">✓</span>
            </div>
            <span className="text-ink font-bold text-xl tracking-tight">SmartTasks</span>
          </div>
          <h1 className="text-4xl font-extrabold text-ink leading-tight">
            Create your<br />account.
          </h1>
          <p className="text-stone-500 mt-2 text-sm">Free forever. No credit card needed.</p>
        </div>

        {/* Form card */}
        <div className="bg-white border-2 border-ink p-8 shadow-[6px_6px_0px_0px_#1a1612]">

          {error && (
            <div className="mb-5 px-4 py-3 bg-red-50 border-2 border-red-500 text-red-700 text-sm font-medium">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">

            <div>
              <label className="block text-xs font-bold uppercase tracking-widest text-ink mb-2">
                Full Name
              </label>
              <input
                type="text"
                value={name}
                onChange={e => setName(e.target.value)}
                placeholder="Jane Doe"
                required
                className="field"
              />
            </div>

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
                placeholder="Min 6 characters"
                required
                className="field"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-widest text-ink mb-2">
                Confirm Password
              </label>
              <input
                type="password"
                value={confirmPassword}
                onChange={e => setConfirmPassword(e.target.value)}
                placeholder="Repeat password"
                required
                className="field"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="btn w-full text-center mt-2"
            >
              {loading ? 'Creating account…' : 'Create Account →'}
            </button>
          </form>

          <p className="mt-6 text-sm text-stone-500 text-center">
            Already have an account?{' '}
            <Link
              to="/login"
              className="text-ink font-semibold underline underline-offset-2 hover:text-amber-700"
            >
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}

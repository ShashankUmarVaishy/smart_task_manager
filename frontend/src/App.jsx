// src/App.jsx — Routing & App Shell
// =============================================

import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import LoginPage    from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import Dashboard    from './pages/Dashboard';

// ── PrivateRoute ──────────────────────────────
// Checks if userName is in localStorage (set on login/register).
// The actual auth is enforced by the httpOnly JWT cookie on every API call.
// If not, redirects to /login.
const PrivateRoute = ({ children }) => {
  const isLoggedIn = localStorage.getItem('userName');
  return isLoggedIn ? children : <Navigate to="/login" replace />;
};

export default function App() {
  return (
    <Router>
      <Routes>
        {/* Public routes */}
        <Route path="/login"    element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />

        {/* Protected route — requires userId in localStorage */}
        <Route
          path="/dashboard"
          element={
            <PrivateRoute>
              <Dashboard />
            </PrivateRoute>
          }
        />

        {/* Default redirect */}
        <Route path="/"  element={<Navigate to="/dashboard" replace />} />
        <Route path="*"  element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </Router>
  );
}

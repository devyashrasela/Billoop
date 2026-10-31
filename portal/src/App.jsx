import React, { useEffect } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { setBootstrapped } from './features/auth/authSlice';
import { useRefreshMutation } from './services/endpoints/authApi';
import ProtectedRoute from './routes/ProtectedRoute';

// ── Person A pages ──
import Login from './pages/Login/Login';
import Register from './pages/Register/Register';
import ForgotPassword from './pages/ForgotPassword/ForgotPassword';
import ResetPassword from './pages/ResetPassword/ResetPassword';

// ── Person B pages ──
// (Person B imports subscriptions, invoices, and portal pages here)

export default function App() {
  const dispatch = useDispatch();
  const [refresh] = useRefreshMutation();

  useEffect(() => {
    // Attempt silent session restore from httpOnly refresh cookie
    refresh()
      .unwrap()
      .catch(() => {
        dispatch(setBootstrapped());
      });
  }, [refresh, dispatch]);

  return (
    <Routes>
      {/* ── Public Auth Routes (Person A) ── */}
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />
      <Route path="/reset-password" element={<ResetPassword />} />

      {/* ── Protected Customer Routes ── */}
      <Route element={<ProtectedRoute />}>
        <Route path="/" element={<Navigate to="/subscriptions" replace />} />
        <Route
          path="/subscriptions"
          element={
            <div style={{ padding: '2rem' }}>
              <h2>My Subscriptions</h2>
              <p>Welcome to the customer portal! Milestone M3 Auth is active.</p>
            </div>
          }
        />

        {/* ── Person B routes ── */}
        {/* (Person B will insert my subscriptions, my invoices, and profile routes here) */}
      </Route>

      {/* ── Fallback ── */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

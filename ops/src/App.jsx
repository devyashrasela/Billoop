import React, { useEffect } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { setBootstrapped } from './features/auth/authSlice';
import { useRefreshMutation } from './services/endpoints/authApi';
import ProtectedRoute from './routes/ProtectedRoute';

// ── Person A pages ──
import Login from './pages/Login/Login';
import ForgotPassword from './pages/ForgotPassword/ForgotPassword';
import ResetPassword from './pages/ResetPassword/ResetPassword';

// ── Person B pages ──
// (Person B imports catalog, subscription, and invoice pages here)

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
      <Route path="/forgot-password" element={<ForgotPassword />} />
      <Route path="/reset-password" element={<ResetPassword />} />

      {/* ── Protected Ops Routes (Staff & Admin) ── */}
      <Route element={<ProtectedRoute allowedRoles={['admin', 'staff']} />}>
        {/* Placeholder home redirect or dashboard */}
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        <Route
          path="/dashboard"
          element={
            <div style={{ padding: '2rem' }}>
              <h2>Brightloop Operations Dashboard</h2>
              <p>Welcome! Milestone M3 Auth is active.</p>
            </div>
          }
        />

        {/* ── Person B routes ── */}
        {/* (Person B will insert product, plan, customer, sub, and invoice routes here) */}
      </Route>

      {/* ── Fallback ── */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

import React, { useEffect } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { setBootstrapped } from './features/auth/authSlice';
import { useRefreshMutation } from './services/endpoints/authApi';
import ProtectedRoute from './routes/ProtectedRoute';

// ── Person A components & pages ──
import OpsLayout from './components/Layout/OpsLayout';
import Login from './pages/Login/Login';
import ForgotPassword from './pages/ForgotPassword/ForgotPassword';
import ResetPassword from './pages/ResetPassword/ResetPassword';
import Dashboard from './pages/Dashboard/Dashboard';
import Reports from './pages/Reports/Reports';
import Staff from './pages/Staff/Staff';

// ── Person B pages ──
import Taxes from './pages/Taxes/Taxes';
import PaymentTerms from './pages/PaymentTerms/PaymentTerms';
import Products from './pages/Products/Products';
import Plans from './pages/Plans/Plans';
import Discounts from './pages/Discounts/Discounts';
import Templates from './pages/Templates/Templates';

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
        <Route element={<OpsLayout />}>
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/reports" element={<Reports />} />

          {/* Admin-only Staff Management */}
          <Route
            path="/staff"
            element={
              <ProtectedRoute allowedRoles={['admin']}>
                <Staff />
              </ProtectedRoute>
            }
          />

          {/* ── Person B Catalog & Transaction Pages ── */}
          <Route path="/products" element={<Products />} />
          <Route path="/plans" element={<Plans />} />
          <Route path="/templates" element={<Templates />} />
          <Route path="/discounts" element={<Discounts />} />
          <Route path="/taxes" element={<Taxes />} />
          <Route path="/payment-terms" element={<PaymentTerms />} />
        </Route>
      </Route>

      {/* ── Fallback ── */}
      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  );
}

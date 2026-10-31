import React, { useEffect } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { setBootstrapped } from './features/auth/authSlice';
import { useRefreshMutation } from './services/endpoints/authApi';
import ProtectedRoute from './routes/ProtectedRoute';

// ── Public & Landing pages ──
import Landing from './pages/Landing/Landing';
import Login from './pages/Login/Login';
import Register from './pages/Register/Register';
import ForgotPassword from './pages/ForgotPassword/ForgotPassword';
import ResetPassword from './pages/ResetPassword/ResetPassword';

// ── Protected Customer pages ──
import PortalLayout from './components/Layout/PortalLayout';
import SubscriptionList from './pages/Subscriptions/SubscriptionList';
import SubscriptionDetail from './pages/Subscriptions/SubscriptionDetail';
import InvoiceList from './pages/Invoices/InvoiceList';
import InvoiceDetail from './pages/Invoices/InvoiceDetail';
import PlanBrowser from './pages/Plans/PlanBrowser';
import Profile from './pages/Profile/Profile';
import { ToastContainer } from './components';

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
    <>
      <Routes>
        {/* ── Public Marketing & Auth Routes ── */}
        <Route path="/" element={<Landing />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password" element={<ResetPassword />} />

        {/* ── Protected Customer Routes ── */}
        <Route element={<ProtectedRoute />}>
          <Route element={<PortalLayout />}>
            <Route path="/portal" element={<Navigate to="/subscriptions" replace />} />
            <Route path="/dashboard" element={<Navigate to="/subscriptions" replace />} />
            <Route path="/subscriptions" element={<SubscriptionList />} />
            <Route path="/subscriptions/:id" element={<SubscriptionDetail />} />
            <Route path="/invoices" element={<InvoiceList />} />
            <Route path="/invoices/:id" element={<InvoiceDetail />} />
            <Route path="/plans" element={<PlanBrowser />} />
            <Route path="/profile" element={<Profile />} />
          </Route>
        </Route>

        {/* ── Fallback ── */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
      <ToastContainer />
    </>
  );
}

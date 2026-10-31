import React, { useEffect } from 'react';
import { Routes, Route, Navigate, NavLink, Outlet } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { setBootstrapped } from './features/auth/authSlice';
import { useRefreshMutation } from './services/endpoints/authApi';
import ProtectedRoute from './routes/ProtectedRoute';

// ── Person A pages ──
import Login from './pages/Login/Login';
import ForgotPassword from './pages/ForgotPassword/ForgotPassword';
import ResetPassword from './pages/ResetPassword/ResetPassword';

// ── Person B pages ──
import Taxes from './pages/Taxes/Taxes';
import PaymentTerms from './pages/PaymentTerms/PaymentTerms';
import Products from './pages/Products/Products';
import Plans from './pages/Plans/Plans';
import Discounts from './pages/Discounts/Discounts';
import Templates from './pages/Templates/Templates';
import './AppLayout.css';

function OpsLayout() {
  return (
    <div className="sheet">
      <div className="app">
        <aside className="side" aria-label="Main navigation">
          <div className="logo">
            <i aria-hidden="true">
              <b></b><b></b><b></b><b></b>
            </i>
            Brightloop
          </div>

          <NavLink
            to="/dashboard"
            className={({ isActive }) => `side__link ${isActive ? 'side__link--on' : ''}`}
          >
            Dashboard
          </NavLink>

          <div className="side__group">Catalog & Settings</div>
          <NavLink
            to="/products"
            className={({ isActive }) => `side__link ${isActive ? 'side__link--on' : ''}`}
          >
            Products & Variants
          </NavLink>
          <NavLink
            to="/plans"
            className={({ isActive }) => `side__link ${isActive ? 'side__link--on' : ''}`}
          >
            Subscription Plans
          </NavLink>
          <NavLink
            to="/templates"
            className={({ isActive }) => `side__link ${isActive ? 'side__link--on' : ''}`}
          >
            Quotation Templates
          </NavLink>
          <NavLink
            to="/discounts"
            className={({ isActive }) => `side__link ${isActive ? 'side__link--on' : ''}`}
          >
            Discounts & Coupons
          </NavLink>
          <NavLink
            to="/taxes"
            className={({ isActive }) => `side__link ${isActive ? 'side__link--on' : ''}`}
          >
            Taxes
          </NavLink>
          <NavLink
            to="/payment-terms"
            className={({ isActive }) => `side__link ${isActive ? 'side__link--on' : ''}`}
          >
            Payment Terms
          </NavLink>
        </aside>

        <main className="main">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

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
          <Route
            path="/dashboard"
            element={
              <div style={{ padding: '2rem' }}>
                <h2>Brightloop Operations Dashboard</h2>
                <p>Welcome! Milestone M3 Auth and Catalog Engine are active.</p>
              </div>
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

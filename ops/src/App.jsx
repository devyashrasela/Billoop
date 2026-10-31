import React from 'react';
import { Routes, Route, NavLink, Outlet } from 'react-router-dom';
import Home from './pages/Home/Home';
import Taxes from './pages/Taxes/Taxes';
import PaymentTerms from './pages/PaymentTerms/PaymentTerms';
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
            to="/"
            end
            className={({ isActive }) => `side__link ${isActive ? 'side__link--on' : ''}`}
          >
            Dashboard
          </NavLink>

          <div className="side__group">Catalog & Settings</div>
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
  return (
    <Routes>
      <Route path="/" element={<OpsLayout />}>
        <Route index element={<Home />} />
        {/* ── Person B Catalog & Transaction Pages ── */}
        <Route path="taxes" element={<Taxes />} />
        <Route path="payment-terms" element={<PaymentTerms />} />
      </Route>
    </Routes>
  );
}

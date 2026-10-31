import React from 'react';
import { NavLink } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { selectIsAdmin } from '../../features/auth/authSlice';
import '../../AppLayout.css';

export const Sidebar = () => {
  const isAdmin = useSelector(selectIsAdmin);

  return (
    <aside className="side" aria-label="Main navigation">
      <div className="logo">
        <i aria-hidden="true">
          <b></b><b></b><b></b><b></b>
        </i>
        Brightloop
      </div>

      <div className="side__group">Overview</div>
      <NavLink
        to="/dashboard"
        className={({ isActive }) => `side__link ${isActive ? 'side__link--on' : ''}`}
      >
        Dashboard
      </NavLink>
      <NavLink
        to="/reports"
        className={({ isActive }) => `side__link ${isActive ? 'side__link--on' : ''}`}
      >
        Reports & Analytics
      </NavLink>

      {isAdmin && (
        <>
          <div className="side__group">Administration</div>
          <NavLink
            to="/staff"
            className={({ isActive }) => `side__link ${isActive ? 'side__link--on' : ''}`}
          >
            Staff Management
          </NavLink>
        </>
      )}

      <div className="side__group">Customers & Sales</div>
      <NavLink
        to="/customers"
        className={({ isActive }) => `side__link ${isActive ? 'side__link--on' : ''}`}
      >
        Customers
      </NavLink>
      <NavLink
        to="/subscriptions"
        className={({ isActive }) => `side__link ${isActive ? 'side__link--on' : ''}`}
      >
        Subscriptions
      </NavLink>

      <div className="side__group">Catalog & Pricing</div>
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
  );
};

export default Sidebar;

import React from 'react';
import { NavLink, Outlet, Link } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { selectCurrentUser } from '../../features/auth/authSlice';
import { useLogoutMutation } from '../../services/endpoints/authApi';
import './PortalLayout.css';

export const PortalLayout = () => {
  const user = useSelector(selectCurrentUser);
  const [logout, { isLoading }] = useLogoutMutation();

  const handleLogout = async () => {
    try {
      await logout().unwrap();
    } catch {
      // Handled in onQueryStarted
    }
  };

  return (
    <div className="portal-shell">
      <header className="portal-nav" role="banner">
        <Link to="/subscriptions" className="portal-nav__brand">
          <i aria-hidden="true">
            <b></b><b></b><b></b><b></b>
          </i>
          <span>Brightloop Portal</span>
        </Link>

        <nav className="portal-nav__links" aria-label="Customer Navigation">
          <NavLink
            to="/subscriptions"
            className={({ isActive }) =>
              `portal-nav__link ${isActive ? 'portal-nav__link--active' : ''}`
            }
          >
            My Subscriptions
          </NavLink>
          <NavLink
            to="/invoices"
            className={({ isActive }) =>
              `portal-nav__link ${isActive ? 'portal-nav__link--active' : ''}`
            }
          >
            My Invoices
          </NavLink>
          <NavLink
            to="/plans"
            className={({ isActive }) =>
              `portal-nav__link ${isActive ? 'portal-nav__link--active' : ''}`
            }
          >
            Browse Plans
          </NavLink>
          <NavLink
            to="/profile"
            className={({ isActive }) =>
              `portal-nav__link ${isActive ? 'portal-nav__link--active' : ''}`
            }
          >
            My Profile
          </NavLink>
        </nav>

        <div className="portal-nav__user">
          <div className="portal-user-meta">
            <span className="portal-user-name">{user?.name || user?.email}</span>
            <span className="portal-user-role">Customer Account</span>
          </div>
          <button
            className="portal-btn-logout"
            onClick={handleLogout}
            disabled={isLoading}
            aria-label="Sign Out"
          >
            {isLoading ? '...' : 'Sign Out'}
          </button>
        </div>
      </header>

      <main className="portal-main">
        <Outlet />
      </main>
    </div>
  );
};

export default PortalLayout;

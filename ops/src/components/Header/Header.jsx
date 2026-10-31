import React from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { selectCurrentUser, selectRole } from '../../features/auth/authSlice';
import { toggleSidebar } from '../../features/ui/uiSlice';
import { useLogoutMutation } from '../../services/endpoints/authApi';
import './Header.css';

export const Header = () => {
  const dispatch = useDispatch();
  const user = useSelector(selectCurrentUser);
  const role = useSelector(selectRole);
  const [logout, { isLoading }] = useLogoutMutation();

  const handleLogout = async () => {
    try {
      await logout().unwrap();
    } catch {
      // Handled in onQueryStarted
    }
  };

  return (
    <header className="ops-header">
      <div className="ops-header-brand">
        <button
          type="button"
          className="ops-header__menu-btn"
          onClick={() => dispatch(toggleSidebar())}
          aria-label="Toggle navigation menu"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <line x1="3" y1="12" x2="21" y2="12" />
            <line x1="3" y1="6" x2="21" y2="6" />
            <line x1="3" y1="18" x2="21" y2="18" />
          </svg>
        </button>
        <div className="ops-header-title">
          Operations Control
        </div>
      </div>
      <div className="ops-header-user">
        <span style={{ fontSize: 'var(--fs-sm)', fontWeight: 'var(--fw-medium)' }}>
          {user?.name || user?.email || 'Operations User'}
        </span>
        <span className={`user-badge ${role === 'admin' ? 'badge-admin' : 'badge-staff'}`}>
          {role || 'staff'}
        </span>
        <button className="btn-logout" onClick={handleLogout} disabled={isLoading}>
          {isLoading ? '...' : 'Sign Out'}
        </button>
      </div>
    </header>
  );
};

export default Header;

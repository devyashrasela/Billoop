import React from 'react';
import { useSelector } from 'react-redux';
import { selectCurrentUser, selectRole } from '../../features/auth/authSlice';
import { useLogoutMutation } from '../../services/endpoints/authApi';
import './Header.css';

export const Header = () => {
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
      <div className="ops-header-title">
        Operations Control
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

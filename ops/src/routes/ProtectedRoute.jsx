import React from 'react';
import { Navigate, useLocation, Outlet } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { selectCurrentUser, selectIsBootstrapping, selectRole } from '../features/auth/authSlice';

export const ProtectedRoute = ({ allowedRoles, children }) => {
  const user = useSelector(selectCurrentUser);
  const role = useSelector(selectRole);
  const bootstrapping = useSelector(selectIsBootstrapping);
  const location = useLocation();

  if (bootstrapping) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <p>Loading session...</p>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (allowedRoles && !allowedRoles.includes(role)) {
    return <Navigate to="/" replace />;
  }

  return children ? children : <Outlet />;
};

export default ProtectedRoute;

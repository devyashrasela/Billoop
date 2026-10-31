import React from 'react';
import { Navigate, useLocation, Outlet } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { selectCurrentUser, selectIsBootstrapping } from '../features/auth/authSlice';

export const ProtectedRoute = ({ children }) => {
  const user = useSelector(selectCurrentUser);
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

  return children ? children : <Outlet />;
};

export default ProtectedRoute;

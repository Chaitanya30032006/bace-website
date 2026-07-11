import React from 'react';
import { Navigate } from 'react-router-dom';
import { getAuthSession } from '../lib/auth';

export default function ProtectedRoute({ children, allowedRoles = [] }) {
  const { token, user, isAuthenticated } = getAuthSession();

  if (!token || !isAuthenticated || !user) {
    return <Navigate to="/login" replace />;
  }

  // Check if role is allowed
  if (allowedRoles.length > 0 && !allowedRoles.includes(user.role)) {
    // If Admin attempts to view User area or User attempts to view Admin area
    if (user.role === 'Admin') {
      return <Navigate to="/admin" replace />;
    } else {
      return <Navigate to="/dashboard" replace />;
    }
  }

  return children;
}

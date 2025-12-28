import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

export default function ProtectedRoute({ children, role }) {
  const { currentUser, userRole, loading } = useAuth();

  if (loading) {
    return <div>Loading...</div>;
  }

  if (!currentUser) {
    return <Navigate to="/login" />;
  }

  // If user is admin and trying to access non-admin route, redirect to admin dashboard
  if (userRole === 'admin' && role !== 'admin') {
    return <Navigate to="/admin" />;
  }

  if (role && userRole !== role) {
    return <Navigate to="/" />; // Or unauthorized page
  }

  return children;
}

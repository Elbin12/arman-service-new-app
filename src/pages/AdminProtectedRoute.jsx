// src/components/routes/AdminProtectedRoute.jsx
import React from 'react';
import { Navigate } from 'react-router-dom';

const AdminProtectedRoute = ({ children }) => {
  const accessToken = localStorage.getItem('access');

  if (!accessToken) {
    return <Navigate to="/admin/login" replace />;
  }

  return children;
};

export default AdminProtectedRoute;

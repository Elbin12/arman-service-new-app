// src/components/routes/AdminProtectedRoute.jsx
import React from 'react';
import { Navigate, useNavigate } from 'react-router-dom';

const AdminProtectedRoute = ({ children }) => {
    const navigate = useNavigate()
  
  const accessToken = localStorage.getItem('access');

  if (!accessToken) {
    return <Navigate to="/admin/login" replace />;
  }

  return children;
};

export default AdminProtectedRoute;

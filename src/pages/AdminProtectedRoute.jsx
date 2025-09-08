// src/components/routes/AdminProtectedRoute.jsx
import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';

const AdminProtectedRoute = ({ children }) => {
  const accessToken = localStorage.getItem('access');
  const location = useLocation();

  console.log(location, location.search)

  if (!accessToken) {
    return (
      <Navigate
        to={`/admin/login${location.search}`}
        replace
      />
    );
  }

  return children;
};

export default AdminProtectedRoute;

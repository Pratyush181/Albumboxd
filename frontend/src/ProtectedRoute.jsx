import React from 'react';
import { Navigate } from 'react-router-dom';
import { useUser } from './UserContext';

const ProtectedRoute = ({ children }) => {
  const { user, loading } = useUser();

  if (loading) {
    return (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '100vh' 
      }}>
        <p>Loading...</p>
      </div>
    );
  }

  return user ? children : <Navigate to="/login" replace />;
};

export default ProtectedRoute;
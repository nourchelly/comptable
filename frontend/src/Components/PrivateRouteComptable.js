// PrivateRouteComptable.js
import React from 'react';
import { Navigate } from 'react-router-dom';

const PrivateRouteComptable = ({ children }) => {
  const token = localStorage.getItem("access_token");
  const role = localStorage.getItem("userRole");

  return token && role === 'comptable' ? children : <Navigate to="/login" />;
};

export default PrivateRouteComptable;

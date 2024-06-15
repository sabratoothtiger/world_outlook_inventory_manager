// src/components/ProtectedRoute.jsx

import React from "react";
import { Navigate } from "react-router-dom";

const ProtectedRoute = ({ component: Component, user, ...rest }) => {
  return user ? <Component {...rest} /> : <Navigate to="/signin" />;
};

export default ProtectedRoute;
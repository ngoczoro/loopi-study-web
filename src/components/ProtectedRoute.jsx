import { Navigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth.js";
import AuthLoadingScreen from "./AuthLoadingScreen.jsx";

/**
 * Renders children only when auth hydration is complete and the user is authenticated.
 */
export const ProtectedRoute = ({ children }) => {
  const { authReady, isAuthenticated } = useAuth();

  if (!authReady) {
    return <AuthLoadingScreen />;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return children;
};

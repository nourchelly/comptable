// ProtectedRoute.js
import { Navigate } from "react-router-dom";
import { useUser } from "./UserContext";

const ProtectedRoute = ({ children }) => {
  const { user } = useUser();
  const token = localStorage.getItem("access_token");

  if (!token || !user) {
    return <Navigate to="/connexion" replace />;
  }

  return children;
};

export default ProtectedRoute;
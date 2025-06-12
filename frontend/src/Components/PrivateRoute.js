import { Navigate, useLocation } from 'react-router-dom';

const PrivateRoute = ({ children, rolesRequises = [] }) => {
  const location = useLocation();
  const token = localStorage.getItem('auth_token');
  const userRole = localStorage.getItem('userRole')?.toLowerCase();

  if (!token) {
    return <Navigate to="/connexion" state={{ from: location }} replace />;
  }

  // Vérification des rôles si nécessaire
  if (rolesRequises.length > 0 && !rolesRequises.includes(userRole)) {
    return <Navigate to="/non-autorise" replace />;
  }

  return children;
};

export default PrivateRoute;
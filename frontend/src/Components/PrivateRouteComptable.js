import { Navigate, useLocation } from 'react-router-dom';

const PrivateRouteComptable = ({ children }) => {
  const location = useLocation();
  // Utilisez localStorage pour être cohérent avec le callback
  const token = localStorage.getItem('token');
  const userRole = localStorage.getItem('userRole')?.toLowerCase()?.trim();

  if (!token) {
    // Stockez dans localStorage pour persister après redirection
    localStorage.setItem('redirect_path', location.pathname);
    return <Navigate to="/connexion" replace state={{ from: location }} />;
  }

  

  return children;
};

export default PrivateRouteComptable;
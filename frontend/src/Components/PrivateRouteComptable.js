import { Navigate, useLocation } from 'react-router-dom';

const PrivateRouteComptable = ({ children }) => {
  const location = useLocation();
  const userRole = sessionStorage.getItem('userRole'); // Vérifie le rôle stocké dans sessionStorage

  if (!userRole) {
    // Stocke la route actuelle pour redirection après login
    sessionStorage.setItem('redirect_path', location.pathname);
    return <Navigate to="/connexion" replace state={{ from: location }} />;
  }

  return children;
};

export default PrivateRouteComptable;
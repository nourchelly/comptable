import React from "react";
import { Link, Outlet, useLocation, useNavigate } from "react-router-dom";
import axios from "axios";
import { FaHome, FaUser, FaCog, FaCheckCircle, FaSignOutAlt, FaSearch, FaBell, FaUserCircle } from "react-icons/fa";
import "./Dashboard.css"; // Fichier CSS pour les styles personnalisés

const Dashboard = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    const refreshToken = localStorage.getItem('refresh_token');
    
    axios.post("http://127.0.0.1:8000/api/logout/", { refresh_token: refreshToken })
      .then(result => {
        if (result.data.Status === 'Déconnexion réussie') {
          localStorage.removeItem("valid");
          localStorage.removeItem("refresh_token");
          navigate("/login");
        } else {
          console.log('Erreur dans la déconnexion:', result.data);
        }
      })
      .catch(err => {
        console.error('Erreur lors de la déconnexion:', err.response ? err.response.data : err);
      });
  };

  const getPageTitle = () => {
    switch (location.pathname) {
      case "/dashboard": return "Tableau de bord";
      case "/dashboard/comptes": return "Comptes";
      case "/dashboard/profil": return "Profil";
      case "/dashboard/validation": return "Validations";
      default: return "";
    }
  };

  return (
    <div className="container-fluid dashboard-container">
      <div className="row flex-nowrap">
        {/* Sidebar */}
        <div className="col-auto col-md-3 col-xl-2 px-sm-2 px-0 bg-white border-end min-vh-100">
          <div className="d-flex flex-column align-items-start px-3 pt-3">
            <Link to="/dashboard" className="d-flex align-items-center pb-3 text-decoration-none">
              <span className="fs-5 fw-bold text-primary">Compta<span className="text-black">BoT</span></span>
            </Link>
            
            {/* Menu */}
            <ul className="nav nav-pills flex-column mb-0 w-100">
              <li className="w-100 mb-3"> {/* Ajout de margin-bottom */}
                <Link to="/dashboard" 
                  className={`nav-link px-3 py-2 ${location.pathname === "/dashboard" ? "fw-bold text-primary bg-light" : "text-dark"}`}>
                  <FaHome className="me-2" /> {/* Icône tableau de bord */}
                  <span className="d-none d-sm-inline">Tableau de bord</span>
                </Link>
              </li>
              <li className="w-100 mb-3"> {/* Ajout de margin-bottom */}
                <Link to="/dashboard/comptes" 
                  className={`nav-link px-3 py-2 ${location.pathname === "/dashboard/comptes" ? "fw-bold text-primary bg-light" : "text-dark"}`}>
                  <FaUser className="me-2" /> {/* Icône comptes */}
                  <span className="d-none d-sm-inline"> Comptes</span>
                </Link>
              </li>
              <li className="w-100 mb-3"> {/* Ajout de margin-bottom */}
                <Link to="/dashboard/profil" 
                  className={`nav-link px-3 py-2 ${location.pathname === "/dashboard/profil" ? "fw-bold text-primary bg-light" : "text-dark"}`}>
                  <FaCog className="me-2" /> {/* Icône profil */}
                  <span className="d-none d-sm-inline">Profil</span>
                </Link>
              </li>
              <li className="w-100 mb-3"> {/* Ajout de margin-bottom */}
                <Link to="/dashboard/validation" 
                  className={`nav-link px-3 py-2 ${location.pathname === "/dashboard/validation" ? "fw-bold text-primary bg-light" : "text-dark"}`}>
                  <FaCheckCircle className="me-2" /> {/* Icône validations */}
                  <span className="d-none d-sm-inline">Validations</span>
                </Link>
              </li>
              <li className="w-100 mb-3"> {/* Ajout de margin-bottom */}
                <button className="nav-link px-3 py-2 text-dark border-0 bg-transparent w-100 text-start" onClick={handleLogout}>
                  <FaSignOutAlt className="me-2" /> {/* Icône déconnexion */}
                  <span className="d-none d-sm-inline">Déconnexion</span>
                </button>
              </li>
            </ul>
          </div>
        </div>

        {/* Main Content */}
        <div className="col p-0">
          <div className="p-3 d-flex justify-content-between align-items-center shadow bg-white">
            {/* Titre de la page */}
            <h5 className="m-0 ps-3 fw-bold" style={{ fontFamily: "'Montserrat', sans-serif" }}>{getPageTitle()}</h5>

            {/* Barre de recherche et icônes */}
            <div className="d-flex align-items-center gap-3 pe-3">
              <div className="position-relative">
                <input type="text" placeholder="Rechercher" className="form-control w-100 pe-5" />
                <FaSearch className="position-absolute top-50 end-0 translate-middle-y me-3 text-muted" /> {/* Icône de recherche */}
              </div>
              <FaBell className="text-muted" /> {/* Icône des notifications */}
              <FaUserCircle className="text-primary" /> {/* Icône de profil */}
            </div>
          </div>
          <div className="p-4"> {/* Ajout de padding pour le contenu principal */}
            <Outlet />
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
import React from "react";
import { Link, Outlet, useLocation, useNavigate } from "react-router-dom";
import axios from "axios";
import "./style.css";

const DashboardComptable = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    // Obtenir le refresh token (par exemple depuis localStorage ou un cookie)
    const refreshToken = localStorage.getItem('refresh_token');
    
    axios.post("http://127.0.0.1:8000/api/logout/", { refresh_token: refreshToken })
    .then(result => {
      console.log(result); // Afficher toute la réponse de l'API
      if (result.data.Status === 'Déconnexion réussie') {
        // Supprimer les éléments d'authentification
        localStorage.removeItem("valid");
        localStorage.removeItem("refresh_token");
        navigate("/login"); // Rediriger vers la page de connexion
      } else {
        console.log('Erreur dans la déconnexion:', result.data);
      }
    })
    .catch(err => {
      console.error('Erreur lors de la déconnexion:', err.response ? err.response.data : err);
    });

  const getPageTitle = () => {
    switch (location.pathname) {
      case "/dashboardcomptable": return "Tableau de bord";
      case "/dashboard/comptes": return "Comptes";
      case "/dashboard/profil": return "Profil";
      case "/dashboard/validation": return "Validations";
      default: return "";
    }
  };

  return (
    <div className="container-fluid" style={{ backgroundColor: "#F5F7FA" }}>
      <div className="row flex-nowrap">
        {/* Sidebar */}
        <div className="col-auto col-md-3 col-xl-2 px-sm-2 px-0 bg-white border-end min-vh-100">
          <div className="d-flex flex-column align-items-start px-3 pt-3">
            <Link to="/dashboardcomptable" className="d-flex align-items-center pb-3 text-decoration-none">
              <span className="fs-5 fw-bold text-primary">Compta<span className="text-black">BoT</span></span>
            </Link>
            
            {/* Menu */}
            <ul className="nav nav-pills flex-column mb-0 w-100">
              <li className="w-100 d-flex align-items-center">
                <Link to="/dashboardcomptable" 
                  className={`nav-link px-0 ${location.pathname === "/dashboard" ? "fw-bold text-primary" : "text-dark"}`}>
                  <i className="bi bi-house-door me-2"></i> {/* Icône tableau de bord */}
                  <span className="d-none d-sm-inline">Tableau de bord</span>
                </Link>
              </li>
              <li className="w-100 d-flex align-items-center">
                <Link to="/dashboardcomptable/comptes" 
                  className={`nav-link px-0 ${location.pathname === "/dashboard/comptes" ? "fw-bold text-primary" : "text-dark"}`}>
                  <i className="bi bi-person-bounding-box me-2"></i> {/* Icône comptes */}
                  <span className="d-none d-sm-inline"> Comptes</span>
                </Link>
              </li>
              <li className="w-100 d-flex align-items-center">
                <Link to="/dashboardcomptable/profil" 
                  className={`nav-link px-0 ${location.pathname === "/dashboard/profil" ? "fw-bold text-primary" : "text-dark"}`}>
                  <i className="bi bi-gear-fill me-2"></i> {/* Icône profil */}
                  <span className="d-none d-sm-inline">Profil</span>
                </Link>
              </li>
              <li className="w-100 d-flex align-items-center">
                <Link to="/dashboardcomptable/validation" 
                  className={`nav-link px-0 ${location.pathname === "/dashboard/validation" ? "fw-bold text-primary" : "text-dark"}`}>
                  <i className="bi bi-check-circle-fill me-2"></i> {/* Icône validations */}
                  <span className="d-none d-sm-inline">Validations</span>
                </Link>
              </li>
              <li className="w-100 d-flex align-items-center">
                <button className="nav-link px-0 text-dark border-0 bg-transparent" onClick={handleLogout}>
                  <i className="bi bi-box-arrow-right me-2"></i> {/* Icône déconnexion */}
                  <span className="d-none d-sm-inline">Déconnexion</span>
                </button>
              </li>
            </ul>
          </div>
        </div>

        {/* Main Content */}
        <div className="col p-0">
          <div className="p-2 d-flex justify-content-between align-items-center shadow bg-white">
            {/* Titre de la page */}
            <h5 className="m-0 ps-3">{getPageTitle()}</h5>

            {/* Barre de recherche et icônes */}
            <div className="d-flex align-items-center gap-3 pe-3">
              <div className="position-relative">
                <input type="text" placeholder="Rechercher" className="form-control w-100 pe-5" />
                <i className="bi bi-search position-absolute top-50 end-0 translate-middle-y me-3"></i> {/* Icône de recherche */}
              </div>
              <i className="bi bi-gear-fill text-muted"></i> {/* Icône des paramètres */}
              <i className="bi bi-bell-fill text-danger"></i> {/* Icône des notifications */}
              <i className="bi bi-person-circle text-primary"></i> {/* Icône de profil */}
            </div>
          </div>
          <Outlet />
        </div>
      </div>
    </div>
  );
}};

export default DashboardComptable;

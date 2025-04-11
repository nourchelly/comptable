import React from "react";
import { Link, Outlet, useLocation, useNavigate } from "react-router-dom";
import axios from "axios";
import { 
  FaHome, FaCheckCircle, FaSignOutAlt, 
  FaSearch, FaBell, FaUserCircle
  , FaUsersCog, FaUserShield, FaFileInvoiceDollar,
  FaShieldAlt, FaDatabase, FaQrcode
} from "react-icons/fa";

const Dashboard = () => {
  const navigate = useNavigate();
  const location = useLocation();

   // Fonction pour se déconnecter
   const handleLogout = () => {
    axios.get(  "http://127.0.0.1:8000/api/logout/")  // L'URL doit être celle du serveur Django
      .then(result => {
        if (result.data.Status) {
          localStorage.removeItem("valid");
          navigate('/login');
        }
      })
      .catch(err => console.error(err));
  };
  
  const getPageTitle = () => {
    switch (location.pathname) {
      case "/dashboard": return "Tableau de bord";
      case "/dashboard/comptes": return "Gestion des comptes";
      case "/dashboard/profil": return "Profil administrateur";
      case "/dashboard/validation": return "Validation des demandes";
      case "/dashboard/audit": return "Journal d'audit";
      default: return "";
    }
  };

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar */}
      <div className="w-64 bg-white border-r border-gray-200 flex flex-col shadow-sm">
        <div className="p-4 border-b border-gray-200 flex items-center">
          <FaQrcode className="text-2xl mr-3 text-indigo-600" />
          <span className="text-2xl font-bold text-gray-800">Compta<span className="text-indigo-600">BoT</span></span>
        </div>
        
        <nav className="flex-1 p-6 space-y-3 overflow-y-auto">
          <Link 
            to="/dashboard" 
            className={`flex items-center p-3 rounded-lg transition-all ${
              location.pathname === "/dashboard" 
                ? "bg-indigo-50 text-indigo-700 font-medium border-l-4 border-indigo-600" 
                : "text-gray-600 hover:bg-gray-100 hover:text-gray-800"
            }`}
          >
            <FaHome className={`mr-3 text-lg ${
              location.pathname === "/dashboard" ? "text-indigo-600" : "text-gray-500"
            }`} />
            <span>Tableau de bord</span>
          </Link>
          
          <Link 
            to="/dashboard/comptes" 
            className={`flex items-center p-3 rounded-lg transition-all ${
              location.pathname === "/dashboard/comptes" 
                ? "bg-indigo-50 text-indigo-700 font-medium border-l-4 border-indigo-600" 
                : "text-gray-600 hover:bg-gray-100 hover:text-gray-800"
            }`}
          >
            <FaUsersCog className={`mr-3 text-lg ${
              location.pathname === "/dashboard/comptes" ? "text-indigo-600" : "text-gray-500"
            }`} />
            <span>Comptes</span>
          </Link>
          
          <Link 
            to="/dashboard/profil" 
            className={`flex items-center p-3 rounded-lg transition-all ${
              location.pathname === "/dashboard/profil" 
                ? "bg-indigo-50 text-indigo-700 font-medium border-l-4 border-indigo-600" 
                : "text-gray-600 hover:bg-gray-100 hover:text-gray-800"
            }`}
          >
            <FaUserShield className={`mr-3 text-lg ${
              location.pathname === "/dashboard/profil" ? "text-indigo-600" : "text-gray-500"
            }`} />
            <span>Profil admin</span>
          </Link>
          
          <Link 
            to="/dashboard/validation" 
            className={`flex items-center p-3 rounded-lg transition-all ${
              location.pathname === "/dashboard/validation" 
                ? "bg-indigo-50 text-indigo-700 font-medium border-l-4 border-indigo-600" 
                : "text-gray-600 hover:bg-gray-100 hover:text-gray-800"
            }`}
          >
            <FaCheckCircle className={`mr-3 text-lg ${
              location.pathname === "/dashboard/validation" ? "text-indigo-600" : "text-gray-500"
            }`} />
            <span>Validations</span>
          </Link>

          <Link 
            to="/dashboard/audit" 
            className={`flex items-center p-3 rounded-lg transition-all ${
              location.pathname === "/dashboard/audit" 
                ? "bg-indigo-50 text-indigo-700 font-medium border-l-4 border-indigo-600" 
                : "text-gray-600 hover:bg-gray-100 hover:text-gray-800"
            }`}
          >
            <FaDatabase className={`mr-3 text-lg ${
              location.pathname === "/dashboard/audit" ? "text-indigo-600" : "text-gray-500"
            }`} />
            <span>Journal d'audit</span>
          </Link>
        </nav>

        <div className="p-4 border-t border-gray-200">
          <button 
            onClick={handleLogout}
            className="w-full flex items-center p-3 rounded-lg text-gray-600 hover:bg-gray-100 hover:text-gray-800 transition-all"
          >
            <FaSignOutAlt className="mr-3 text-lg text-gray-500" />
            <span>Déconnexion</span>
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <header className="bg-white border-b border-gray-200 py-2 px-6 flex items-center justify-between shadow-sm">
          <h1 className="text-xl font-semibold text-gray-800 flex items-center">
            {getPageTitle()}
            {location.pathname === "/dashboard" && (
              <span className="ml-2 text-sm bg-indigo-100 text-indigo-800 px-2 py-1 rounded-full">
                Admin
              </span>
            )}
          </h1>
          
          <div className="flex items-center space-x-4">
            <div className="relative w-64">
              <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Rechercher actions, utilisateurs..."
                className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
              />
            </div>
            
            <button className="p-2 rounded-full text-gray-500 hover:bg-gray-100 relative transition-colors">
              <FaBell className="text-xl" />
              <span className="absolute top-0 right-0 h-2.5 w-2.5 rounded-full bg-red-500 ring-2 ring-white"></span>
            </button>
            
            <div className="flex items-center space-x-2 group cursor-pointer">
              <div className="relative">
                <FaUserCircle className="text-2xl text-indigo-600" />
                <span className="absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full bg-green-500 ring-2 ring-white"></span>
              </div>
              <div className="hidden md:block">
                <p className="text-sm font-medium">Admin</p>
                <p className="text-xs text-gray-500">Super Admin</p>
              </div>
            </div>
          </div>
        </header>

        {/* Content area */}
        <main className="flex-1 overflow-y-auto p-4 bg-gray-50">
          <div >
            <Outlet />
            
            {/* Tableau de bord par défaut */}
            {location.pathname === "/dashboard" && (
              <div>
                {/* Section Bienvenue */}
                <div className="flex flex-col md:flex-row items-center justify-between bg-gradient-to-r from-indigo-50 to-purple-50 rounded-xl p-6 mb-8">
                  <div className="mb-4 md:mb-0 md:mr-6">
                    <h2 className="text-2xl font-bold text-gray-800 mb-2">Bienvenue, Administrateur</h2>
                    <p className="text-gray-600 mb-4">
                      Gérez l'ensemble de la plateforme depuis ce tableau de bord complet.
                    </p>
                    <button className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg transition-colors shadow-md hover:shadow-lg">
                      Voir le guide
                    </button>
                  </div>
                  <div className="bg-indigo-100 p-4 rounded-full shadow-inner">
                    <FaUserShield className="text-6xl text-indigo-600" />
                  </div>
                </div>

                {/* Cartes statistiques */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                  <div className="bg-white p-6 rounded-xl shadow-sm border-l-4 border-blue-500 hover:shadow-md transition-all transform hover:-translate-y-1">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-gray-500">Utilisateurs actifs</p>
                        <p className="text-2xl font-bold mt-1">1,248</p>
                      </div>
                      <div className="p-3 rounded-full bg-blue-100 text-blue-600 shadow-inner">
                        <FaUsersCog size={20} />
                      </div>
                    </div>
                    <div className="mt-4 flex items-center text-sm text-green-500">
                      <span>↑ 12% ce mois</span>
                    </div>
                  </div>

                  <div className="bg-white p-6 rounded-xl shadow-sm border-l-4 border-green-500 hover:shadow-md transition-all transform hover:-translate-y-1">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-gray-500">Transactions</p>
                        <p className="text-2xl font-bold mt-1">356</p>
                      </div>
                      <div className="p-3 rounded-full bg-green-100 text-green-600 shadow-inner">
                        <FaFileInvoiceDollar size={20} />
                      </div>
                    </div>
                    <div className="mt-4 flex items-center text-sm text-green-500">
                      <span>↑ 8% ce mois</span>
                    </div>
                  </div>

                  <div className="bg-white p-6 rounded-xl shadow-sm border-l-4 border-purple-500 hover:shadow-md transition-all transform hover:-translate-y-1">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-gray-500">Demandes en attente</p>
                        <p className="text-2xl font-bold mt-1">24</p>
                      </div>
                      <div className="p-3 rounded-full bg-purple-100 text-purple-600 shadow-inner">
                        <FaCheckCircle size={20} />
                      </div>
                    </div>
                    <div className="mt-4 flex items-center text-sm text-red-500">
                      <span>↓ 3% ce mois</span>
                    </div>
                  </div>

                  <div className="bg-white p-6 rounded-xl shadow-sm border-l-4 border-orange-500 hover:shadow-md transition-all transform hover:-translate-y-1">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-gray-500">Sécurité</p>
                        <p className="text-2xl font-bold mt-1">100%</p>
                      </div>
                      <div className="p-3 rounded-full bg-orange-100 text-orange-600 shadow-inner">
                        <FaShieldAlt size={20} />
                      </div>
                    </div>
                    <div className="mt-4 flex items-center text-sm text-green-500">
                      <span>Système sécurisé</span>
                    </div>
                  </div>
                </div>

                {/* Section rapide */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  <Link to="/dashboard/comptes" className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-all group transform hover:-translate-y-1">
                    <div className="flex items-center mb-4">
                      <div className="p-3 rounded-full bg-blue-100 text-blue-600 mr-4 group-hover:bg-blue-600 group-hover:text-white transition-colors shadow-inner">
                        <FaUsersCog size={20} />
                      </div>
                      <h3 className="font-bold text-lg group-hover:text-blue-600 transition-colors">Gérer les comptes</h3>
                    </div>
                    <p className="text-gray-500 text-sm">
                      Visualisez et gérez tous les comptes utilisateurs, modifiez les permissions et accès.
                    </p>
                  </Link>

                  <Link to="/dashboard/validation" className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-all group transform hover:-translate-y-1">
                    <div className="flex items-center mb-4">
                      <div className="p-3 rounded-full bg-green-100 text-green-600 mr-4 group-hover:bg-green-600 group-hover:text-white transition-colors shadow-inner">
                        <FaCheckCircle size={20} />
                      </div>
                      <h3 className="font-bold text-lg group-hover:text-green-600 transition-colors">Valider demandes</h3>
                    </div>
                    <p className="text-gray-500 text-sm">
                      Approuvez ou rejetez les demandes en attente des utilisateurs.
                    </p>
                  </Link>

                  <Link to="/dashboard/audit" className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-all group transform hover:-translate-y-1">
                    <div className="flex items-center mb-4">
                      <div className="p-3 rounded-full bg-purple-100 text-purple-600 mr-4 group-hover:bg-purple-600 group-hover:text-white transition-colors shadow-inner">
                        <FaDatabase size={20} />
                      </div>
                      <h3 className="font-bold text-lg group-hover:text-purple-600 transition-colors">Journal d'audit</h3>
                    </div>
                    <p className="text-gray-500 text-sm">
                      Consultez l'historique complet des actions administratives.
                    </p>
                  </Link>
                </div>
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
};

export default Dashboard;
import React from "react";
import { Link, Outlet, useLocation, useNavigate } from "react-router-dom";
import axios from "axios";
import { 
  FaHome, FaFileInvoice, FaQrcode,
  FaCheckCircle, FaSignOutAlt, FaSearch, FaBell,
  FaCog, FaUserCircle, FaMoneyBillWave, 
  FaRobot, FaFileAlt, FaCalculator,
  FaClipboardCheck, FaCoins, FaShieldAlt,
  FaChevronDown, FaChevronRight
} from "react-icons/fa";

const DashboardComptable = () => {
  const navigate = useNavigate();
  const location = useLocation();
  
  const handleLogout = () => {
    axios.get(  "http://127.0.0.1:8000/api/logout/")  // L'URL doit être celle du serveur Django
      .then(result => {
        if (result.data.Status) {
          localStorage.removeItem("valid");
          navigate('/connexion');
        }
      })
      .catch(err => console.error(err));
  };
  

  // Vérifie si un lien est actif
  const isActive = (path) => location.pathname === path;

  return (
    <div className="flex h-screen bg-gray-50 font-sans">
      {/* Sidebar - Version améliorée */}
      <div className="w-64 bg-gradient-to-b from-indigo-800 to-indigo-900 text-white flex flex-col shadow-xl">
        {/* Logo */}
        <div className="p-6 flex items-center space-x-3 border-b border-indigo-700">
          <FaQrcode className="text-3xl text-indigo-300" />
          <span className="text-2xl font-bold">
            <span className="text-white">Compta</span>
            <span className="text-indigo-300">BoT</span>
          </span>
        </div>

        {/* Menu */}
        <div className="flex-1 overflow-y-auto py-4 px-2">
          <nav className="space-y-1">
            {/* Tableau de bord */}
            <Link 
              to="/dashboardcomptable" 
              className={`flex items-center p-3 mx-2 rounded-lg transition-all ${
                isActive("/dashboardcomptable") 
                  ? 'bg-white text-indigo-800 shadow-md font-semibold' 
                  : 'text-indigo-100 hover:bg-indigo-700 hover:text-white'
              }`}
            >
              <FaHome className={`text-lg mr-3 ${
                isActive("/dashboardcomptable") ? 'text-indigo-600' : 'text-indigo-300'
              }`} />
              <span>Tableau de bord</span>
              {isActive("/dashboardcomptable") && (
                <FaChevronRight className="ml-auto text-indigo-600 text-xs" />
              )}
            </Link>

            {/* Section Comptabilité */}
            <div className="mt-6 mx-4">
              <p className="text-xs font-semibold text-indigo-300 uppercase tracking-wider mb-2">
                Gestion Comptable
              </p>
              <div className="space-y-1">
                <Link 
                  to="/dashboardcomptable/facture" 
                  className={`flex items-center p-3 rounded-lg transition-all ${
                    isActive("/dashboardcomptable/facture") 
                      ? 'bg-indigo-700 text-white shadow font-semibold' 
                      : 'text-indigo-100 hover:bg-indigo-700 hover:text-white'
                  }`}
                >
                  <FaFileInvoice className={`text-lg mr-3 ${
                    isActive("/dashboardcomptable/facture") ? 'text-white' : 'text-indigo-300'
                  }`} />
                  <span>Factures</span>
                
                </Link>
                
                <Link 
                  to="/dashboardcomptable/rapports" 
                  className={`flex items-center p-3 rounded-lg transition-all ${
                    isActive("/dashboardcomptable/rapports") 
                      ? 'bg-indigo-700 text-white shadow font-semibold' 
                      : 'text-indigo-100 hover:bg-indigo-700 hover:text-white'
                  }`}
                >
                  <FaFileAlt className={`text-lg mr-3 ${
                    isActive("/dashboardcomptable/rapports") ? 'text-white' : 'text-indigo-300'
                  }`} />
                  <span>Rapports</span>
                </Link>
              </div>
            </div>

            {/* Section Administration */}
            <div className="mt-6 mx-4">
              <p className="text-xs font-semibold text-indigo-300 uppercase tracking-wider mb-2">
                Administration
              </p>
              <div className="space-y-1">
                <Link 
                  to="/dashboardcomptable/profilcomptable" 
                  className={`flex items-center p-3 rounded-lg transition-all ${
                    isActive("/dashboardcomptable/profilcomptable") 
                      ? 'bg-indigo-700 text-white shadow font-semibold' 
                      : 'text-indigo-100 hover:bg-indigo-700 hover:text-white'
                  }`}
                >
                  <FaUserCircle className={`text-lg mr-3 ${
                    isActive("/dashboardcomptable/profilcomptable") ? 'text-white' : 'text-indigo-300'
                  }`} />
                  <span>Mon Profil</span>
                </Link>
              </div>
            </div>
          </nav>
        </div>

        {/* Déconnexion */}
        <div className="p-4 border-t border-indigo-700">
          <button 
            onClick={handleLogout}
            className="flex items-center w-full p-3 text-indigo-100 hover:bg-indigo-700 rounded-lg transition-colors"
          >
            <FaSignOutAlt className="mr-3 text-indigo-300" />
            <span className="font-medium">Déconnexion</span>
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header amélioré */}
        <header className="bg-white border-b border-gray-200 py-4 px-6 flex items-center justify-between shadow-sm">
          <h1 className="text-2xl font-bold text-gray-800">
            {isActive("/dashboardcomptable") && "Tableau de Bord"}
            {isActive("/dashboardcomptable/profilcomptable") && "Profil Comptable"}
            {isActive("/dashboardcomptable/rapports") && "Rapports Comptables"}
            {isActive("/dashboardcomptable/facture") && "Gestion des Factures"}
          </h1>

          <div className="flex items-center space-x-4">
            <div className="relative">
              <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input 
                type="text" 
                placeholder="Rechercher..." 
                className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent w-64"
              />
            </div>
            <button className="p-2 text-gray-500 hover:text-indigo-600 relative">
              <FaBell />
              <span className="absolute top-0 right-0 h-2 w-2 rounded-full bg-red-500"></span>
            </button>
            <button className="p-2 text-gray-500 hover:text-indigo-600">
              <FaCog />
            </button>
            <div className="flex items-center space-x-2">
              <div className="h-8 w-8 rounded-full bg-indigo-100 flex items-center justify-center">
                <FaUserCircle className="text-indigo-600 text-xl" />
              </div>
              <span className="font-medium text-gray-700">Comptable</span>
              <FaChevronDown className="text-gray-500 text-xs" />
            </div>
          </div>
        </header>

        {/* Content */}
        <main className="flex-1 overflow-y-auto p-6 bg-gray-50">
          <Outlet />

          {/* Default Dashboard Content */}
          {isActive("/dashboardcomptable") && (
            <div className="space-y-6">
              {/* Stats Cards améliorées */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white p-6 rounded-xl shadow-sm border-t-4 border-blue-500 hover:shadow-md transition-shadow">
                  <div className="flex justify-between items-center">
                    <div>
                      <p className="text-sm font-medium text-gray-500">Solde Actuel</p>
                      <p className="text-2xl font-bold text-gray-800">24,500 €</p>
                      <p className="text-xs text-green-500 mt-1">+2.5% vs mois dernier</p>
                    </div>
                    <div className="p-3 bg-blue-50 rounded-full">
                      <FaMoneyBillWave className="text-blue-500 text-xl" />
                    </div>
                  </div>
                </div>

                <div className="bg-white p-6 rounded-xl shadow-sm border-t-4 border-green-500 hover:shadow-md transition-shadow">
                  <div className="flex justify-between items-center">
                    <div>
                      <p className="text-sm font-medium text-gray-500">Transactions</p>
                      <p className="text-2xl font-bold text-gray-800">156</p>
                      <p className="text-xs text-blue-500 mt-1">12 nouvelles aujourd'hui</p>
                    </div>
                    <div className="p-3 bg-green-50 rounded-full">
                      <FaCoins className="text-green-500 text-xl" />
                    </div>
                  </div>
                </div>

                <div className="bg-white p-6 rounded-xl shadow-sm border-t-4 border-purple-500 hover:shadow-md transition-shadow">
                  <div className="flex justify-between items-center">
                    <div>
                      <p className="text-sm font-medium text-gray-500">Tâches Automatisées</p>
                      <p className="text-2xl font-bold text-gray-800">28</p>
                      <p className="text-xs text-purple-500 mt-1">Économie de 42h/mois</p>
                    </div>
                    <div className="p-3 bg-purple-50 rounded-full">
                      <FaRobot className="text-purple-500 text-xl" />
                    </div>
                  </div>
                </div>
              </div>

              {/* Quick Actions améliorées */}
              <div className="bg-white p-6 rounded-xl shadow-sm">
                <h2 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
                  <span>Actions Rapides</span>
                  <span className="ml-auto text-sm text-indigo-600 font-normal">Fonctions fréquentes</span>
                </h2>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                  <button className="flex flex-col items-center p-4 border border-gray-100 rounded-lg hover:border-indigo-300 hover:bg-indigo-50 transition-colors group">
                    <div className="p-3 bg-blue-100 rounded-full mb-2 group-hover:bg-blue-200 transition-colors">
                      <FaFileInvoice className="text-blue-600 text-xl" />
                    </div>
                    <span className="text-sm font-medium text-gray-700">Créer Facture</span>
                  </button>
                  <button className="flex flex-col items-center p-4 border border-gray-100 rounded-lg hover:border-green-300 hover:bg-green-50 transition-colors group">
                    <div className="p-3 bg-green-100 rounded-full mb-2 group-hover:bg-green-200 transition-colors">
                      <FaCalculator className="text-green-600 text-xl" />
                    </div>
                    <span className="text-sm font-medium text-gray-700">Nouveau Rapport</span>
                  </button>
                  <button className="flex flex-col items-center p-4 border border-gray-100 rounded-lg hover:border-yellow-300 hover:bg-yellow-50 transition-colors group">
                    <div className="p-3 bg-yellow-100 rounded-full mb-2 group-hover:bg-yellow-200 transition-colors">
                      <FaClipboardCheck className="text-yellow-600 text-xl" />
                    </div>
                    <span className="text-sm font-medium text-gray-700">Valider Écritures</span>
                  </button>
                  <button className="flex flex-col items-center p-4 border border-gray-100 rounded-lg hover:border-purple-300 hover:bg-purple-50 transition-colors group">
                    <div className="p-3 bg-purple-100 rounded-full mb-2 group-hover:bg-purple-200 transition-colors">
                      <FaShieldAlt className="text-purple-600 text-xl" />
                    </div>
                    <span className="text-sm font-medium text-gray-700">Audit Comptable</span>
                  </button>
                </div>
              </div>

              {/* Recent Activities améliorées */}
              <div className="bg-white p-6 rounded-xl shadow-sm">
                <h2 className="text-lg font-semibold text-gray-800 mb-4">Activités Récentes</h2>
                <div className="space-y-3">
                  {[1, 2, 3].map((item) => (
                    <div key={item} className="flex items-center p-3 border border-gray-100 rounded-lg hover:bg-gray-50 transition-colors">
                      <div className={`p-3 rounded-full mr-4 ${
                        item % 2 === 0 ? 'bg-green-100 text-green-600' : 'bg-blue-100 text-blue-600'
                      }`}>
                        {item % 2 === 0 ? <FaCheckCircle /> : <FaFileInvoice />}
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-medium text-gray-800">
                          {item % 2 === 0 ? 'Validation comptable' : 'Nouvelle facture'} #{item}
                        </p>
                        <p className="text-xs text-gray-500">Il y a {item} heure{item > 1 ? 's' : ''}</p>
                      </div>
                      <div className={`text-sm font-medium ${
                        item % 2 === 0 ? 'text-green-600' : 'text-blue-600'
                      }`}>
                        {item % 2 === 0 ? 'Validé' : 'En attente'}
                      </div>
                    </div>
                  ))}
                </div>
                <button className="mt-4 text-sm text-indigo-600 hover:text-indigo-800 font-medium flex items-center">
                  Voir toutes les activités <FaChevronRight className="ml-1 text-xs" />
                </button>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
};

export default DashboardComptable;
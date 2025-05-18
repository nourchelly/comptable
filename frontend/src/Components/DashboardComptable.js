import React, { useState, useEffect, useContext } from "react";
import { 
  FiHome, FiFileText, FiDollarSign, FiPieChart, FiUser, 
  FiLogOut, FiChevronRight, FiChevronDown, FiZap, 
  FiBell, FiSearch, FiSettings, FiDatabase, FiClipboard
} from "react-icons/fi";
import { 
  FaFileInvoice, FaUniversity, FaFileInvoiceDollar, 
  FaFileAlt, FaUserCircle, FaRobot, FaClipboardCheck, 
  FaUserTie, FaCheckCircle, FaSpinner, FaQrcode,
  FaSignOutAlt, FaBell as FaBellSolid, FaArrowRight,FaChevronRight
} from "react-icons/fa";
import { Link, Outlet, useLocation, useNavigate } from "react-router-dom";
import axios from "axios";
import Notification from './Notification';
import { useUser } from './UserContext'; // Import du contexte utilisateur

const DashboardComptable = () => {
  const navigate = useNavigate();
  const location = useLocation();
 const { user } = useUser(); // Récupération de l'utilisateur depuis le contexte
  const [showConfirm, setShowConfirm] = useState(false);
  const [usersStats, setUsersStats] = useState({
    facture: 0,
    releve: 0,
    rapport: 0,
  });
  const [loadingStats, setLoadingStats] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      setLoadingStats(true);
      try {
        const response = await axios.get('http://localhost:8000/api/users-stats/', {
          withCredentials: true
        });
        
        if (response.data.status && response.data.data?.stats) {
          setUsersStats(response.data.data.stats);
        } else {
          console.error('Structure inattendue:', response.data);
        }
      } catch (err) {
        console.error('Erreur API:', err);
        if (err.response?.status === 401) {
          navigate('/connexion');
        }
      } finally {
        setLoadingStats(false);
      }
    };
    fetchStats();
  }, [navigate]);

  const handleLogout = () => {
    axios.get("http://127.0.0.1:8000/api/logout/")
      .then(result => {
        if (result.data.Status) {
          localStorage.removeItem("valid");
          navigate('/connexion');
        }
      })
      .catch(err => console.error(err));
  };

  const isActive = (path) => location.pathname === path;

  const titleConfig = {
    "/dashboardcomptable": {
      title: "Tableau de Bord",
      icon: <FiHome className="text-indigo-600" />,
      color: "indigo"
    },
    "/dashboardcomptable/profilcomptable": {
      title: "Profil Comptable",
      icon: <FaUserTie className="text-purple-600" />,
      color: "purple"
    },
    "/dashboardcomptable/rapport": {
      title: "Rapports Comptables",
      icon: <FiFileText className="text-green-600" />,
      color: "green"
    },
    "/dashboardcomptable/facture": {
      title: "Gestion des Factures",
      icon: <FaFileInvoice className="text-blue-600" />,
      color: "blue"
    },
    "/dashboardcomptable/banque": {
      title: "Banque",
      icon: <FaUniversity className="text-yellow-600" />,
      color: "yellow"
    },
    "/dashboardcomptable/rapprochement": {
      title: "Rapprochement",
      icon: <FaClipboardCheck className="text-red-600" />,
      color: "red"
    }
  };

  const getActiveTitle = () => {
    for (const path in titleConfig) {
      if (isActive(path)) {
        return titleConfig[path];
      }
    }
    return { title: "", icon: null, color: "" };
  };

  const { title, icon, color } = getActiveTitle();

  return (
    <div className="flex h-screen bg-gray-50 font-sans text-gray-800">
      {/* Confirmation Modal */}
      {showConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 backdrop-blur-sm">
          <div className="bg-white rounded-xl p-8 w-full max-w-md">
            <div className="flex flex-col items-center text-center space-y-4">
              <div className="p-3 bg-red-100 rounded-full">
                <FaSignOutAlt className="text-red-500 text-2xl" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900">Déconnexion</h3>
              <p className="text-gray-600">Êtes-vous sûr de vouloir vous déconnecter ?</p>
              <div className="flex space-x-4 w-full mt-4">
                <button 
                  onClick={handleLogout}
                  className="flex-1 bg-red-600 hover:bg-red-700 text-white py-3 px-6 rounded-lg font-medium transition-colors flex items-center justify-center"
                >
                  <FaSignOutAlt className="mr-2" />
                  Déconnexion
                </button>
                <button 
                  onClick={() => setShowConfirm(false)}
                  className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-800 py-3 px-6 rounded-lg font-medium transition-colors"
                >
                  Annuler
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Sidebar */}
      <div className={`${sidebarOpen ? 'w-64' : 'w-20'} bg-gradient-to-b from-indigo-800 to-indigo-900 text-white flex flex-col shadow-xl transition-all duration-300`}>
        {/* Logo */}
        <div className="p-6 flex items-center justify-center border-b border-indigo-700">
          {sidebarOpen ? (
            <div className="flex items-center space-x-3">
              <FaQrcode className="text-3xl text-indigo-300" />
              <span className="text-2xl font-bold">
                <span className="text-white">Compta</span>
                <span className="text-indigo-300">Bot</span>
              </span>
            </div>
          ) : (
            <FaQrcode className="text-3xl text-indigo-300" />
          )}
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
              <div className={`p-2 rounded-lg mr-3 ${
                isActive("/dashboardcomptable") ? 'bg-indigo-100 text-indigo-600' : 'bg-indigo-500 text-white'
              }`}>
                <FiHome className="text-lg" />
              </div>
              {sidebarOpen && <span>Tableau de bord</span>}
              {sidebarOpen && isActive("/dashboardcomptable") && (
                <FiChevronRight className="ml-auto text-indigo-600 text-sm" />
              )}
            </Link>

            {/* Section Comptabilité */}
            {sidebarOpen && (
              <div className="mt-6 mx-4">
                <p className="text-xs font-semibold text-indigo-300 uppercase tracking-wider mb-2">
                  Gestion Comptable
                </p>
              </div>
            )}
            <div className="space-y-1">
              <Link 
                to="/dashboardcomptable/facture" 
                className={`flex items-center p-3 mx-2 rounded-lg transition-all ${
                  isActive("/dashboardcomptable/facture") 
                    ? 'bg-indigo-700 text-white shadow font-semibold' 
                    : 'text-indigo-100 hover:bg-indigo-700 hover:text-white'
                }`}
              >
                <div className={`p-2 rounded-lg mr-3 ${
                  isActive("/dashboardcomptable/facture") ? 'bg-blue-100 text-blue-600' : 'bg-blue-500 text-white'
                }`}>
                  <FaFileInvoice className="text-lg" />
                </div>
                {sidebarOpen && <span>Factures</span>}
              </Link>

              <Link 
                to="/dashboardcomptable/banque" 
                className={`flex items-center p-3 mx-2 rounded-lg transition-all ${
                  isActive("/dashboardcomptable/banque") 
                    ? 'bg-indigo-700 text-white shadow font-semibold' 
                    : 'text-indigo-100 hover:bg-indigo-700 hover:text-white'
                }`}
              >
                <div className={`p-2 rounded-lg mr-3 ${
                  isActive("/dashboardcomptable/banque") ? 'bg-yellow-100 text-yellow-600' : 'bg-yellow-500 text-white'
                }`}>
                  <FaUniversity className="text-lg" />
                </div>
                {sidebarOpen && <span>Banques</span>}
              </Link>

              <Link 
                to="/dashboardcomptable/rapprochement" 
                className={`flex items-center p-3 mx-2 rounded-lg transition-all ${
                  isActive("/dashboardcomptable/rapprochement") 
                    ? 'bg-indigo-700 text-white shadow font-semibold' 
                    : 'text-indigo-100 hover:bg-indigo-700 hover:text-white'
                }`}
              >
                <div className={`p-2 rounded-lg mr-3 ${
                  isActive("/dashboardcomptable/rapprochement") ? 'bg-red-100 text-red-600' : 'bg-red-500 text-white'
                }`}>
                  <FaFileInvoiceDollar className="text-lg" />
                </div>
                {sidebarOpen && <span>Rapprochements</span>}
              </Link>

              <Link 
                to="/dashboardcomptable/rapport" 
                className={`flex items-center p-3 mx-2 rounded-lg transition-all ${
                  isActive("/dashboardcomptable/rapport") 
                    ? 'bg-indigo-700 text-white shadow font-semibold' 
                    : 'text-indigo-100 hover:bg-indigo-700 hover:text-white'
                }`}
              >
                <div className={`p-2 rounded-lg mr-3 ${
                  isActive("/dashboardcomptable/rapport") ? 'bg-green-100 text-green-600' : 'bg-green-500 text-white'
                }`}>
                  <FaFileAlt className="text-lg" />
                </div>
                {sidebarOpen && <span>Rapports</span>}
              </Link>
            </div>

            {/* Section Administration */}
            {sidebarOpen && (
              <div className="mt-6 mx-4">
                <p className="text-xs font-semibold text-indigo-300 uppercase tracking-wider mb-2">
                  Administration
                </p>
              </div>
            )}
            <div className="space-y-1">
              <Link 
                to="/dashboardcomptable/profilcomptable" 
                className={`flex items-center p-3 mx-2 rounded-lg transition-all ${
                  isActive("/dashboardcomptable/profilcomptable") 
                    ? 'bg-indigo-700 text-white shadow font-semibold' 
                    : 'text-indigo-100 hover:bg-indigo-700 hover:text-white'
                }`}
              >
                <div className={`p-2 rounded-lg mr-3 ${
                  isActive("/dashboardcomptable/profilcomptable") ? 'bg-purple-100 text-purple-600' : 'bg-purple-500 text-white'
                }`}>
                  <FiUser className="text-lg" />
                </div>
                {sidebarOpen && <span>Mon Profil</span>}
              </Link>
            </div>
          </nav>
        </div>

        {/* Déconnexion */}
        <div className="p-4 border-t border-indigo-700">
          <button 
            onClick={() => setShowConfirm(true)}
            className="flex items-center w-full p-3 text-indigo-100 hover:bg-indigo-700 rounded-lg transition-colors"
          >
            <div className="p-2 rounded-lg mr-3 bg-red-500 text-white">
              <FiLogOut className="text-lg" />
            </div>
            {sidebarOpen && <span className="font-medium">Déconnexion</span>}
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <header className="bg-white border-b border-gray-200 py-4 px-6 flex items-center justify-between shadow-sm">
          <div className="flex items-center">
            <button 
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="mr-4 text-gray-500 hover:text-indigo-600"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16"></path>
              </svg>
            </button>
            
            {icon && (
              <div className={`p-2 rounded-lg bg-${color}-100 mr-3`}>
                {icon}
              </div>
            )}
            <h1 className="text-xl font-bold text-gray-800">
              {title}
            </h1>
          </div>

          <div className="flex items-center space-x-4">
            <div className="relative hidden md:block">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <FiSearch className="text-gray-400" />
              </div>
              <input 
                type="text" 
                placeholder="Rechercher..." 
                className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent w-64"
              />
            </div>
            
            <Notification />
            
            <div className="flex items-center space-x-2">
              <div className="h-10 w-10 rounded-full bg-gradient-to-r from-indigo-500 to-purple-500 flex items-center justify-center text-white font-medium">
                {user?.username?.charAt(0).toUpperCase() || 'C'}
              </div>
              {sidebarOpen && (
                <div className="hidden md:block">
                  <p className="text-sm font-medium">{user?.username || 'Comptable'}</p>
                  <p className="text-xs text-gray-500">Administrateur</p>
                </div>
              )}
              <FiChevronDown className="text-gray-500 text-sm" />
            </div>
          </div>
        </header>

        {/* Content */}
        <main className="flex-1 overflow-y-auto p-6 bg-gray-50">
          <Outlet />

          {/* Default Dashboard Content */}
          {isActive("/dashboardcomptable") && (
            <div className="space-y-6">
              {/* Welcome Banner */}
              <div className="bg-gradient-to-r from-indigo-600 to-blue-600 rounded-xl p-6 text-white shadow-lg">
                <div className="flex flex-col md:flex-row md:items-center md:justify-between">
                  <div>
                    <h2 className="text-2xl font-bold mb-2">Bonjour, {user?.username || 'Comptable'}!</h2>
                    <p className="text-indigo-100">Voici un résumé de votre activité aujourd'hui</p>
                  </div>
                  <div className="mt-4 md:mt-0">
                    <button className="px-4 py-2 bg-white text-indigo-600 rounded-lg font-medium hover:bg-gray-100 transition shadow-sm">
                      Voir les statistiques
                    </button>
                  </div>
                </div>
              </div>

              {/* Stats Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {/* Factures Card */}
                <div className="bg-white p-6 rounded-xl shadow-sm hover:shadow-md transition-all border border-gray-100">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="text-sm text-gray-500 mb-1">Total Factures</p>
                      {loadingStats ? (
                        <div className="h-8 w-3/4 bg-gray-200 rounded animate-pulse"></div>
                      ) : (
                        <p className="text-2xl font-bold text-gray-800">{usersStats.facture}</p>
                      )}
                      <p className="text-xs text-blue-500 mt-2 flex items-center">
                        <span className="inline-block w-2 h-2 bg-blue-500 rounded-full mr-1"></span>
                        {usersStats.newFactures || 0} nouvelles ce mois
                      </p>
                    </div>
                    <div className="p-3 bg-blue-50 rounded-lg text-blue-600">
                      <FaFileInvoice className="text-xl" />
                    </div>
                  </div>
                </div>

                {/* Relevés Card */}
                <div className="bg-white p-6 rounded-xl shadow-sm hover:shadow-md transition-all border border-gray-100">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="text-sm text-gray-500 mb-1">Relevés Bancaires</p>
                      {loadingStats ? (
                        <div className="h-8 w-3/4 bg-gray-200 rounded animate-pulse"></div>
                      ) : (
                        <p className="text-2xl font-bold text-gray-800">{usersStats.releve}</p>
                      )}
                      <p className="text-xs text-green-500 mt-2 flex items-center">
                        <span className="inline-block w-2 h-2 bg-green-500 rounded-full mr-1"></span>
                        Documents bancaires
                      </p>
                    </div>
                    <div className="p-3 bg-green-50 rounded-lg text-green-600">
                      <FiDollarSign className="text-xl" />
                    </div>
                  </div>
                </div>

                {/* Tâches Card */}
                <div className="bg-white p-6 rounded-xl shadow-sm hover:shadow-md transition-all border border-gray-100">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="text-sm text-gray-500 mb-1">Tâches Automatisées</p>
                      <p className="text-2xl font-bold text-gray-800">28</p>
                      <p className="text-xs text-purple-500 mt-2 flex items-center">
                        <span className="inline-block w-2 h-2 bg-purple-500 rounded-full mr-1"></span>
                        Économie de 42h/mois
                      </p>
                    </div>
                    <div className="p-3 bg-purple-50 rounded-lg text-purple-600">
                      <FaRobot className="text-xl" />
                    </div>
                  </div>
                </div>

                {/* Rapports Card */}
                <div className="bg-white p-6 rounded-xl shadow-sm hover:shadow-md transition-all border border-gray-100">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="text-sm text-gray-500 mb-1">Rapports Générés</p>
                      {loadingStats ? (
                        <div className="h-8 w-3/4 bg-gray-200 rounded animate-pulse"></div>
                      ) : (
                        <p className="text-2xl font-bold text-gray-800">{usersStats.rapport}</p>
                      )}
                      <p className="text-xs text-amber-500 mt-2 flex items-center">
                        <span className="inline-block w-2 h-2 bg-amber-500 rounded-full mr-1"></span>
                        Rapports Financiers
                      </p>
                    </div>
                    <div className="p-3 bg-amber-50 rounded-lg text-amber-600">
                      <FiPieChart className="text-xl" />
                    </div>
                  </div>
                </div>
              </div>

              {/* Quick Actions */}
              <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
                    <FiZap className="text-indigo-500" />
                    <span>Actions Rapides</span>
                  </h2>
                  <span className="text-xs font-medium px-3 py-1 bg-indigo-50 text-indigo-700 rounded-full">
                    Fonctions fréquentes
                  </span>
                </div>
                
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                  {/* Carte Facture */}
                  <Link 
                    to="/dashboardcomptable/facture" 
                    className="group flex flex-col items-center p-5 rounded-xl bg-white border border-gray-200 hover:border-indigo-200 hover:shadow-md transition-all duration-300 hover:-translate-y-1"
                  >
                    <div className="p-3 mb-3 rounded-lg bg-blue-50 group-hover:bg-blue-100 transition-all duration-300">
                      <FaFileInvoice className="text-blue-600 text-2xl" />
                    </div>
                    <span className="text-sm font-semibold text-gray-700 group-hover:text-gray-900">Importer Facture</span>
                    <span className="mt-1 text-xs text-gray-500 group-hover:text-indigo-600 flex items-center">
                      Nouvelle entrée <FaArrowRight className="ml-1 text-xs opacity-0 group-hover:opacity-100 transition-opacity" />
                    </span>
                  </Link>

                  {/* Carte Rapports */}
                  <Link 
                    to="/dashboardcomptable/rapport" 
                    className="group flex flex-col items-center p-5 rounded-xl bg-white border border-gray-200 hover:border-green-200 hover:shadow-md transition-all duration-300 hover:-translate-y-1"
                  >
                    <div className="p-3 mb-3 rounded-lg bg-green-50 group-hover:bg-green-100 transition-all duration-300">
                      <FiFileText className="text-green-600 text-2xl" />
                    </div>
                    <span className="text-sm font-semibold text-gray-700 group-hover:text-gray-900">Rapports</span>
                    <span className="mt-1 text-xs text-gray-500 group-hover:text-green-600 flex items-center">
                      Analytiques <FaArrowRight className="ml-1 text-xs opacity-0 group-hover:opacity-100 transition-opacity" />
                    </span>
                  </Link>

                  {/* Carte Rapprochements */}
                  <Link 
                    to="/dashboardcomptable/rapprochement" 
                    className="group flex flex-col items-center p-5 rounded-xl bg-white border border-gray-200 hover:border-red-200 hover:shadow-md transition-all duration-300 hover:-translate-y-1"
                  >
                    <div className="p-3 mb-3 rounded-lg bg-red-50 group-hover:bg-red-100 transition-all duration-300">
                      <FaClipboardCheck className="text-red-600 text-2xl" />
                    </div>
                    <span className="text-sm font-semibold text-gray-700 group-hover:text-gray-900">Rapprochements</span>
                    <span className="mt-1 text-xs text-gray-500 group-hover:text-red-600 flex items-center">
                      Vérification <FaArrowRight className="ml-1 text-xs opacity-0 group-hover:opacity-100 transition-opacity" />
                    </span>
                  </Link>

                  {/* Carte Profil */}
                  <Link 
                    to="/dashboardcomptable/profilcomptable" 
                    className="group flex flex-col items-center p-5 rounded-xl bg-white border border-gray-200 hover:border-purple-200 hover:shadow-md transition-all duration-300 hover:-translate-y-1"
                  >
                    <div className="p-3 mb-3 rounded-lg bg-purple-50 group-hover:bg-purple-100 transition-all duration-300">
                      <FiUser className="text-purple-600 text-2xl" />
                    </div>
                    <span className="text-sm font-semibold text-gray-700 group-hover:text-gray-900">Profil Comptable</span>
                    <span className="mt-1 text-xs text-gray-500 group-hover:text-purple-600 flex items-center">
                      Paramètres <FaArrowRight className="ml-1 text-xs opacity-0 group-hover:opacity-100 transition-opacity" />
                    </span>
                  </Link>
                </div>
              </div>

              {/* Recent Activities */}
              <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                <h2 className="text-xl font-semibold text-gray-800 mb-4 flex items-center">
                  <FiClipboard className="text-indigo-500 mr-2" />
                  Activités Récentes
                </h2>
                <div className="space-y-3">
                  {[1, 2, 3].map((item) => (
                    <div key={item} className="flex items-center p-4 border border-gray-100 rounded-lg hover:bg-gray-50 transition-colors">
                      <div className={`p-3 rounded-full mr-4 ${
                        item % 2 === 0 ? 'bg-green-100 text-green-600' : 'bg-blue-100 text-blue-600'
                      }`}>
                        {item % 2 === 0 ? <FaCheckCircle className="text-xl" /> : <FaFileInvoice className="text-xl" />}
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-medium text-gray-800">
                          {item % 2 === 0 ? 'Validation comptable' : 'Nouvelle facture'} #{item}
                        </p>
                        <p className="text-xs text-gray-500">Il y a {item} heure{item > 1 ? 's' : ''}</p>
                      </div>
                      <div className={`text-sm font-medium px-3 py-1 rounded-full ${
                        item % 2 === 0 ? 'bg-green-50 text-green-600' : 'bg-blue-50 text-blue-600'
                      }`}>
                        {item % 2 === 0 ? 'Validé' : 'En attente'}
                      </div>
                    </div>
                  ))}
                </div>
                <button className="mt-4 text-sm text-indigo-600 hover:text-indigo-800 font-medium flex items-center">
                  Voir toutes les activités <FaChevronRight className="ml-1 text-sm" />
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
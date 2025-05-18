import React, { useState, useEffect } from "react";
import { 
  FiHome, FiUsers, FiUser, FiFileText, FiClipboard, 
  FiSettings, FiLogOut, FiSearch, FiBell, FiTrendingUp,
  FiCheckCircle, FiAlertCircle, FiClock, FiArrowRight
} from "react-icons/fi";
import { 
  FaUserShield, FaUserTie, FaUserCheck, FaUserTimes, FaUserPlus,
  FaFileInvoiceDollar, FaShieldAlt, FaQrcode, FaSpinner, FaTimes,
  FaChartLine, FaDatabase, FaLock
} from "react-icons/fa";
import { Link, Outlet, useLocation, useNavigate } from "react-router-dom";
import axios from "axios";

const Dashboard = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [userStats, setUserStats] = useState({
    total: 0,
    admin: 0,
    comptable: 0,
    directeur: 0,
    active: 0,
    inactive: 0,
    newUsers: 0
  });
  const [loadingStats, setLoadingStats] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      setLoadingStats(true);
      try {
        const response = await axios.get('http://localhost:8000/api/user-stats/', {
          withCredentials: true
        });
        
        if (response.data.status && response.data.data?.stats) {
          setUserStats(response.data.data.stats);
        }
      } catch (err) {
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
    const getPageTitle = () => {
    switch (location.pathname) {
      case "/dashboard": return "Tableau de bord";
      case "/dashboard/comptes": return "Gestion des comptes";
      case "/dashboard/profile": return "Profil administrateur";
      case "/dashboard/validation": return "Supervision des actions";
     
      default: return "";
    }
  };
  return (
    <div className="flex h-screen bg-gray-50">
      {/* Modal de déconnexion */}
      {showLogoutModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 backdrop-blur-sm">
          <div className="bg-white rounded-xl p-6 w-full max-w-md border border-gray-200 shadow-xl">
            <div className="flex flex-col items-center text-center space-y-4">
              <div className="p-3 bg-red-100 rounded-full">
                <FiLogOut className="text-red-500 text-2xl" />
              </div>
              <h3 className="text-xl font-bold text-gray-900">Déconnexion</h3>
              <p className="text-gray-600">Êtes-vous sûr de vouloir vous déconnecter ?</p>
              <div className="flex space-x-4 w-full mt-4">
                <button 
                  onClick={handleLogout}
                  className="flex-1 bg-red-600 hover:bg-red-700 text-white py-2 px-4 rounded-lg font-medium transition-colors flex items-center justify-center shadow-md"
                >
                  <FiLogOut className="mr-2" />
                  Déconnexion
                </button>
                <button 
                  onClick={() => setShowLogoutModal(false)}
                  className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-800 py-2 px-4 rounded-lg font-medium transition-colors shadow-md"
                >
                  Annuler
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Sidebar */}
      <div className="w-64 bg-gradient-to-b from-indigo-700 to-indigo-800 text-white flex flex-col shadow-xl">
        <div className="p-4 flex items-center justify-center border-b border-indigo-600">
          <div className="flex items-center">
            <FaQrcode className="text-3xl text-indigo-300 mr-3" />
            <span className="text-xl font-bold">Compta<span className="text-indigo-300">Bot</span></span>
          </div>
        </div>
        
        <nav className="flex-1 p-4 space-y-2">
          <Link 
            to="/dashboard" 
            className={`flex items-center p-3 rounded-lg transition-all ${
              isActive("/dashboard") 
                ? 'bg-white text-indigo-800 shadow-md font-semibold' 
                : 'text-indigo-100 hover:bg-indigo-600 hover:text-white'
            }`}
          >
            <div className={`p-2 rounded-lg mr-3 ${
              isActive("/dashboard") ? 'bg-indigo-100 text-indigo-600' : 'bg-indigo-500 text-white'
            }`}>
              <FiHome className="text-lg" />
            </div>
            <span>Tableau de bord</span>
          </Link>

          <Link 
            to="/dashboard/comptes" 
            className={`flex items-center p-3 rounded-lg transition-all ${
              isActive("/dashboard/comptes") 
                ? 'bg-white text-indigo-800 shadow-md font-semibold' 
                : 'text-indigo-100 hover:bg-indigo-600 hover:text-white'
            }`}
          >
            <div className={`p-2 rounded-lg mr-3 ${
              isActive("/dashboard/comptes") ? 'bg-blue-100 text-blue-600' : 'bg-blue-500 text-white'
            }`}>
              <FiUsers className="text-lg" />
            </div>
            <span>Gestion des comptes</span>
          </Link>

          <Link 
            to="/dashboard/profile" 
            className={`flex items-center p-3 rounded-lg transition-all ${
              isActive("/dashboard/profile") 
                ? 'bg-white text-indigo-800 shadow-md font-semibold' 
                : 'text-indigo-100 hover:bg-indigo-600 hover:text-white'
            }`}
          >
            <div className={`p-2 rounded-lg mr-3 ${
              isActive("/dashboard/profile") ? 'bg-purple-100 text-purple-600' : 'bg-purple-500 text-white'
            }`}>
              <FaUserShield className="text-lg" />
            </div>
            <span>Profil admin</span>
          </Link>

          <Link 
            to="/dashboard/validation" 
            className={`flex items-center p-3 rounded-lg transition-all ${
              isActive("/dashboard/validation") 
                ? 'bg-white text-indigo-800 shadow-md font-semibold' 
                : 'text-indigo-100 hover:bg-indigo-600 hover:text-white'
            }`}
          >
            <div className={`p-2 rounded-lg mr-3 ${
              isActive("/dashboard/validation") ? 'bg-green-100 text-green-600' : 'bg-green-500 text-white'
            }`}>
              <FiClipboard className="text-lg" />
            </div>
            <span>Supervision</span>
          </Link>
        </nav>

        <div className="p-4 border-t border-indigo-600">
          <button 
            onClick={() => setShowLogoutModal(true)}
            className="flex items-center w-full p-3 text-indigo-100 hover:bg-indigo-600 rounded-lg transition-colors"
          >
            <div className="p-2 rounded-lg mr-3 bg-red-500 text-white">
              <FiLogOut className="text-lg" />
            </div>
            <span className="font-medium">Déconnexion</span>
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <header className="bg-white border-b border-gray-200 py-3 px-6 flex items-center justify-between shadow-sm">
          <h1 className="text-xl font-semibold text-gray-800 flex items-center">
            {getPageTitle()}
            {location.pathname === "/dashboard" && (
              <span className="ml-2 text-xs bg-indigo-600 text-white px-2 py-1 rounded-full uppercase tracking-wider">
                Tableau de bord
              </span>
            )}
          </h1>
          
          <div className="flex items-center space-x-4">
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <FiSearch className="text-gray-400" />
              </div>
              <input 
                type="text" 
                placeholder="Rechercher..." 
                className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent w-64"
              />
            </div>
            
            <button className="p-2 text-gray-500 hover:text-indigo-600 relative">
              <FiBell className="text-xl" />
              <span className="absolute top-0 right-0 h-2 w-2 rounded-full bg-red-500"></span>
            </button>
            
            <div className="flex items-center space-x-2">
              <div className="h-10 w-10 rounded-full bg-gradient-to-r from-indigo-500 to-purple-500 flex items-center justify-center text-white font-medium">
                A
              </div>
              <div>
                <p className="text-sm font-medium">Administrateur</p>
                <p className="text-xs text-gray-500">Super Admin</p>
              </div>
            </div>
          </div>
        </header>

        {/* Content */}
        <main className="flex-1 overflow-y-auto p-6 bg-gray-50">
          <Outlet />
          
          {/* Default Dashboard Content */}
          {isActive("/dashboard") && (
            <div className="space-y-6">
              {/* Welcome Card */}
              <div className="bg-gradient-to-r from-indigo-600 to-blue-600 rounded-xl p-6 text-white shadow-lg">
                <div className="flex flex-col md:flex-row md:items-center md:justify-between">
                  <div>
                    <h2 className="text-2xl font-bold mb-2">Bonjour, Administrateur</h2>
                    <p className="text-indigo-100">Bienvenue sur votre tableau de bord de gestion</p>
                  </div>
                  <button className="mt-4 md:mt-0 px-4 py-2 bg-white text-indigo-600 rounded-lg font-medium hover:bg-gray-100 transition shadow-sm">
                    Guide d'utilisation
                  </button>
                </div>
              </div>

              {/* Stats Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {/* Total Users Card */}
                <div className="bg-white p-6 rounded-xl shadow-sm border-l-4 border-blue-500 hover:shadow-md transition-all">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="text-sm text-gray-500 mb-1">Total Utilisateurs</p>
                      {loadingStats ? (
                        <div className="h-8 w-3/4 bg-gray-200 rounded animate-pulse"></div>
                      ) : (
                        <p className="text-2xl font-bold text-gray-800">{userStats.total}</p>
                      )}
                    </div>
                    <div className="p-3 bg-blue-50 rounded-lg text-blue-600">
                      <FiUsers className="text-xl" />
                    </div>
                  </div>
                </div>

                {/* Admins Card */}
                <div className="bg-white p-6 rounded-xl shadow-sm border-l-4 border-purple-500 hover:shadow-md transition-all">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="text-sm text-gray-500 mb-1">Administrateurs</p>
                      {loadingStats ? (
                        <div className="h-8 w-3/4 bg-gray-200 rounded animate-pulse"></div>
                      ) : (
                        <p className="text-2xl font-bold text-gray-800">{userStats.admin}</p>
                      )}
                    </div>
                    <div className="p-3 bg-purple-50 rounded-lg text-purple-600">
                      <FaUserShield className="text-xl" />
                    </div>
                  </div>
                </div>

                {/* Comptables Card */}
                <div className="bg-white p-6 rounded-xl shadow-sm border-l-4 border-green-500 hover:shadow-md transition-all">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="text-sm text-gray-500 mb-1">Comptables</p>
                      {loadingStats ? (
                        <div className="h-8 w-3/4 bg-gray-200 rounded animate-pulse"></div>
                      ) : (
                        <p className="text-2xl font-bold text-gray-800">{userStats.comptable}</p>
                      )}
                    </div>
                    <div className="p-3 bg-green-50 rounded-lg text-green-600">
                      <FaUserTie className="text-xl" />
                    </div>
                  </div>
                </div>

                {/* Directeurs Card */}
                <div className="bg-white p-6 rounded-xl shadow-sm border-l-4 border-orange-500 hover:shadow-md transition-all">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="text-sm text-gray-500 mb-1">Directeurs</p>
                      {loadingStats ? (
                        <div className="h-8 w-3/4 bg-gray-200 rounded animate-pulse"></div>
                      ) : (
                        <p className="text-2xl font-bold text-gray-800">{userStats.directeur}</p>
                      )}
                    </div>
                    <div className="p-3 bg-orange-50 rounded-lg text-orange-600">
                      <FaUserTie className="text-xl" />
                    </div>
                  </div>
                </div>
              </div>

              {/* Second Stats Row */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Active Users Card */}
                <div className="bg-white p-6 rounded-xl shadow-sm border-l-4 border-teal-500 hover:shadow-md transition-all">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="text-sm text-gray-500 mb-1">Utilisateurs Actifs</p>
                      {loadingStats ? (
                        <div className="h-8 w-3/4 bg-gray-200 rounded animate-pulse"></div>
                      ) : (
                        <p className="text-2xl font-bold text-gray-800">{userStats.active}</p>
                      )}
                    </div>
                    <div className="p-3 bg-teal-50 rounded-lg text-teal-600">
                      <FaUserCheck className="text-xl" />
                    </div>
                  </div>
                </div>

                {/* Inactive Users Card */}
                <div className="bg-white p-6 rounded-xl shadow-sm border-l-4 border-red-500 hover:shadow-md transition-all">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="text-sm text-gray-500 mb-1">Utilisateurs Inactifs</p>
                      {loadingStats ? (
                        <div className="h-8 w-3/4 bg-gray-200 rounded animate-pulse"></div>
                      ) : (
                        <p className="text-2xl font-bold text-gray-800">{userStats.inactive}</p>
                      )}
                    </div>
                    <div className="p-3 bg-red-50 rounded-lg text-red-600">
                      <FaUserTimes className="text-xl" />
                    </div>
                  </div>
                </div>

                {/* New Users Card */}
                <div className="bg-white p-6 rounded-xl shadow-sm border-l-4 border-yellow-500 hover:shadow-md transition-all">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="text-sm text-gray-500 mb-1">Nouveaux (30j)</p>
                      {loadingStats ? (
                        <div className="h-8 w-3/4 bg-gray-200 rounded animate-pulse"></div>
                      ) : (
                        <p className="text-2xl font-bold text-gray-800">{userStats.newUsers}</p>
                      )}
                    </div>
                    <div className="p-3 bg-yellow-50 rounded-lg text-yellow-600">
                      <FaUserPlus className="text-xl" />
                    </div>
                  </div>
                </div>
              </div>

              {/* Quick Actions */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Manage Accounts Card */}
                <Link 
                  to="/dashboard/comptes" 
                  className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 hover:shadow-md transition-all group hover:border-blue-200"
                >
                  <div className="flex items-center mb-4">
                    <div className="p-3 rounded-full bg-blue-50 text-blue-600 mr-4 group-hover:bg-blue-100">
                      <FiUsers className="text-xl" />
                    </div>
                    <div>
                      <h3 className="font-bold text-lg text-gray-800 group-hover:text-blue-600">
                        Gérer les comptes
                      </h3>
                      <p className="text-gray-500 text-sm mt-1">
                        Administration des utilisateurs
                      </p>
                    </div>
                  </div>
                  <div className="flex justify-end">
                    <FiArrowRight className="text-gray-300 group-hover:text-blue-400" />
                  </div>
                </Link>

                {/* Admin Profile Card */}
                <Link 
                  to="/dashboard/profile" 
                  className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 hover:shadow-md transition-all group hover:border-purple-200"
                >
                  <div className="flex items-center mb-4">
                    <div className="p-3 rounded-full bg-purple-50 text-purple-600 mr-4 group-hover:bg-purple-100">
                      <FaUserShield className="text-xl" />
                    </div>
                    <div>
                      <h3 className="font-bold text-lg text-gray-800 group-hover:text-purple-600">
                        Profil admin
                      </h3>
                      <p className="text-gray-500 text-sm mt-1">
                        Modifier vos informations
                      </p>
                    </div>
                  </div>
                  <div className="flex justify-end">
                    <FiArrowRight className="text-gray-300 group-hover:text-purple-400" />
                  </div>
                </Link>

                {/* Audit Log Card */}
                <Link 
                  to="/dashboard/validation" 
                  className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 hover:shadow-md transition-all group hover:border-green-200"
                >
                  <div className="flex items-center mb-4">
                    <div className="p-3 rounded-full bg-green-50 text-green-600 mr-4 group-hover:bg-green-100">
                      <FiClipboard className="text-xl" />
                    </div>
                    <div>
                      <h3 className="font-bold text-lg text-gray-800 group-hover:text-green-600">
                        Journal d'audit
                      </h3>
                      <p className="text-gray-500 text-sm mt-1">
                        Historique des activités
                      </p>
                    </div>
                  </div>
                  <div className="flex justify-end">
                    <FiArrowRight className="text-gray-300 group-hover:text-green-400" />
                  </div>
                </Link>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
};

export default Dashboard;
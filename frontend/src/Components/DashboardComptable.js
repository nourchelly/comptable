import React from "react";
import { useState,useEffect } from 'react';
import Notification from './Notification'; 
import { FiZap } from "react-icons/fi";
import { Link, Outlet, useLocation, useNavigate } from "react-router-dom";
import axios from "axios";
import { 
  FaHome, FaFileInvoice, FaQrcode,
  FaCheckCircle, FaSignOutAlt, FaSearch, FaBell,FaUsers, FaSpinner,
  FaCog, FaUserCircle, FaMoneyBillWave, 
  FaRobot, FaFileAlt, FaCalculator,
  FaClipboardCheck, FaCoins, FaUserTie, FaFileInvoiceDollar, FaUniversity,
  FaChevronDown, FaChevronRight, FaTachometerAlt, FaBolt
} from "react-icons/fa";
import { 
FiChevronDown, FiChevronRight, FiSearch, FiBell, FiSettings, FiUser, FiHome,
  FiFileText, FiClipboard, FiDollarSign, FiPieChart, FiDatabase, FiLogOut
} from "react-icons/fi";
const DashboardComptable = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [showConfirm, setShowConfirm] = useState(false);
  const [usersStats, setUsersStats] = useState({
    facture: 0,
    releve: 0,
   
  });
  const [loadingStats, setLoadingStats] = useState(true);
  // Charger les statistiques utilisateurs
  useEffect(() => {
    const fetchStats = async () => {
      setLoadingStats(true);
      try {
        const response = await axios.get('http://localhost:8000/api/users-stats/', {
          withCredentials: true
        });
        
        console.log('API Response:', response.data);
        
        // Correction ici - la structure est response.data.data.stats
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
  }, []);
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

  const handleCancel = () => {
    setShowConfirm(false);
  };
  
  const isActive = (path) => location.pathname === path;

  // Configuration des titres avec icônes
  const titleConfig = {
    "/dashboardcomptable": {
      title: "Tableau de Bord",
      icon: <FaTachometerAlt className="text-indigo-600" />,
      color: "indigo"
    },
    "/dashboardcomptable/profilcomptable": {
      title: "Profil Comptable",
      icon: <FaUserTie className="text-purple-600" />,
      color: "purple"
    },
    "/dashboardcomptable/rapports": {
      title: "Rapports Comptables",
      icon: <FaFileAlt className="text-green-600" />,
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
              <FaHome className={`text-xl mr-3 ${
                isActive("/dashboardcomptable") ? 'text-indigo-600' : 'text-indigo-300'
              }`} />
              <span>Tableau de bord</span>
              {isActive("/dashboardcomptable") && (
                <FaChevronRight className="ml-auto text-indigo-600 text-sm" />
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
                  <FaFileInvoice className={`text-xl mr-3 ${
                    isActive("/dashboardcomptable/facture") ? 'text-white' : 'text-indigo-300'
                  }`} />
                  <span>Factures</span>
                </Link>
                <Link 
                  to="/dashboardcomptable/banque" 
                  className={`flex items-center p-3 rounded-lg transition-all ${
                    isActive("/dashboardcomptable/banque") 
                      ? 'bg-indigo-700 text-white shadow font-semibold' 
                      : 'text-indigo-100 hover:bg-indigo-700 hover:text-white'
                  }`}
                >
                  <FaUniversity className={`text-xl mr-3 ${
                    isActive("/dashboardcomptable/banque") ? 'text-white' : 'text-indigo-300'
                  }`} />
                  <span>Banques</span>
                </Link>
                <Link 
                  to="/dashboardcomptable/rapprochement" 
                  className={`flex items-center p-3 rounded-lg transition-all ${
                    isActive("/dashboardcomptable/rapprochement") 
                      ? 'bg-indigo-700 text-white shadow font-semibold' 
                      : 'text-indigo-100 hover:bg-indigo-700 hover:text-white'
                  }`}
                >
                  <FaFileInvoiceDollar className={`text-xl mr-3 ${
                    isActive("/dashboardcomptable/rapprochement") ? 'text-white' : 'text-indigo-300'
                  }`} />
                  <span>Rapprochements</span>
                </Link>
                <Link 
                  to="/dashboardcomptable/rapports" 
                  className={`flex items-center p-3 rounded-lg transition-all ${
                    isActive("/dashboardcomptable/rapports") 
                      ? 'bg-indigo-700 text-white shadow font-semibold' 
                      : 'text-indigo-100 hover:bg-indigo-700 hover:text-white'
                  }`}
                >
                  <FaFileAlt className={`text-xl mr-3 ${
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
                  <FaUserCircle className={`text-xl mr-3 ${
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
            onClick={() => setShowConfirm(true)}
            className="flex items-center w-full p-3 text-indigo-100 hover:bg-indigo-700 rounded-lg transition-colors"
          >
            <FaSignOutAlt className={`text-xl ${sidebarOpen ? 'mr-3' : 'mx-auto'}`} />
            {sidebarOpen && <span className="font-medium">Déconnexion</span>}
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header amélioré avec icônes */}
        <header className="bg-white border-b border-gray-200 py-4 px-6 flex items-center justify-between shadow-sm">
          <div className="flex items-center">
            {icon && (
              <span className={`p-2 rounded-lg bg-${color}-100 mr-3`}>
                {icon}
              </span>
            )}
            <h1 className="text-2xl font-bold text-gray-800">
              {title}
            </h1>
          </div>

          <div className="flex items-center space-x-4">
            <div className="relative">
              <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 text-lg" />
              <input 
                type="text" 
                placeholder="Rechercher..." 
                className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent w-64"
              />
            </div>
            
            <Notification />
            
            <button className="p-2 text-gray-500 hover:text-indigo-600">
              <FaCog className="text-xl" />
            </button>
            
            <div className="flex items-center space-x-2">
              <div className="h-10 w-10 rounded-full bg-indigo-100 flex items-center justify-center">
                <FaUserCircle className="text-indigo-600 text-2xl" />
              </div>
              <span className="font-medium text-gray-700">Comptable</span>
              <FaChevronDown className="text-gray-500 text-sm" />
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
                {/* Factures Card */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="bg-white p-6 rounded-xl shadow-sm border-l-4 border-blue-500 hover:shadow-md transition-all">
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
                        {usersStats.newFactures} nouvelles ce mois
                      </p>
                    </div>
                    <div className="p-3 bg-blue-50 rounded-lg">
                      <FiFileText className="text-blue-500 text-xl" />
                    </div>
                  </div>
                </div>

                {/* Relevés Card */}
                <div className="bg-white p-6 rounded-xl shadow-sm border-l-4 border-green-500 hover:shadow-md transition-all">
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
                    <div className="p-3 bg-green-50 rounded-lg">
                      <FiDollarSign className="text-green-500 text-xl" />
                    </div>
                  </div>
                </div>

                {/* Tâches Card */}
                <div className="bg-white p-6 rounded-xl shadow-sm border-l-4 border-purple-500 hover:shadow-md transition-all">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="text-sm text-gray-500 mb-1">Tâches Automatisées</p>
                      <p className="text-2xl font-bold text-gray-800">28</p>
                      <p className="text-xs text-purple-500 mt-2 flex items-center">
                        <span className="inline-block w-2 h-2 bg-purple-500 rounded-full mr-1"></span>
                        Économie de 42h/mois
                      </p>
                    </div>
                    <div className="p-3 bg-purple-50 rounded-lg">
                      <FaRobot className="text-purple-500 text-xl" />
                    </div>
                  </div>
                </div>

                {/* Rapports Card */}
                <div className="bg-white p-6 rounded-xl shadow-sm border-l-4 border-amber-500 hover:shadow-md transition-all">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="text-sm text-gray-500 mb-1">Rapports Générés</p>
                      <p className="text-2xl font-bold text-gray-800">15</p>
                      <p className="text-xs text-amber-500 mt-2 flex items-center">
                        <span className="inline-block w-2 h-2 bg-amber-500 rounded-full mr-1"></span>
                        3 nouveaux ce mois
                      </p>
                    </div>
                    <div className="p-3 bg-amber-50 rounded-lg">
                      <FiPieChart className="text-amber-500 text-xl" />
                    </div>
                  </div>
                </div>
              </div>

              {/* Quick Actions Premium */}
              <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-50">
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
                    className="relative overflow-hidden group flex flex-col items-center p-5 rounded-xl bg-gradient-to-b from-white to-gray-50 border border-gray-100 hover:border-indigo-100 hover:shadow-md transition-all duration-300 hover:-translate-y-1"
                  >
                    <div className="absolute inset-0 bg-gradient-to-r from-indigo-50 to-blue-50 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                    <div className="relative z-10 p-3 mb-3 rounded-lg bg-gradient-to-br from-blue-100 to-blue-50 group-hover:from-blue-200 group-hover:to-blue-100 transition-all duration-300 shadow-inner">
                      <FaFileInvoice className="text-blue-600 text-2xl" />
                    </div>
                    <span className="relative z-10 text-sm font-semibold text-gray-700 group-hover:text-gray-900">Importer Facture</span>
                    <span className="relative z-10 mt-1 text-xs text-gray-500 group-hover:text-indigo-600">Nouvelle entrée</span>
                  </Link>

                  {/* Carte Rapports */}
                  <Link 
                    to="/dashboardcomptable/rapports" 
                    className="relative overflow-hidden group flex flex-col items-center p-5 rounded-xl bg-gradient-to-b from-white to-gray-50 border border-gray-100 hover:border-green-100 hover:shadow-md transition-all duration-300 hover:-translate-y-1"
                  >
                    <div className="absolute inset-0 bg-gradient-to-r from-green-50 to-emerald-50 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                    <div className="relative z-10 p-3 mb-3 rounded-lg bg-gradient-to-br from-green-100 to-emerald-50 group-hover:from-green-200 group-hover:to-emerald-100 transition-all duration-300 shadow-inner">
                      <FaCalculator className="text-green-600 text-2xl" />
                    </div>
                    <span className="relative z-10 text-sm font-semibold text-gray-700 group-hover:text-gray-900">Rapports</span>
                    <span className="relative z-10 mt-1 text-xs text-gray-500 group-hover:text-green-600">Analytiques</span>
                  </Link>

                  {/* Carte Rapprochements */}
                  <Link 
                    to="/dashboardcomptable/rapprochement" 
                    className="relative overflow-hidden group flex flex-col items-center p-5 rounded-xl bg-gradient-to-b from-white to-gray-50 border border-gray-100 hover:border-amber-100 hover:shadow-md transition-all duration-300 hover:-translate-y-1"
                  >
                    <div className="absolute inset-0 bg-gradient-to-r from-amber-50 to-yellow-50 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                    <div className="relative z-10 p-3 mb-3 rounded-lg bg-gradient-to-br from-amber-100 to-yellow-50 group-hover:from-amber-200 group-hover:to-yellow-100 transition-all duration-300 shadow-inner">
                      <FaClipboardCheck className="text-amber-600 text-2xl" />
                    </div>
                    <span className="relative z-10 text-sm font-semibold text-gray-700 group-hover:text-gray-900">Rapprochements</span>
                    <span className="relative z-10 mt-1 text-xs text-gray-500 group-hover:text-amber-600">Vérification</span>
                  </Link>

                  {/* Carte Profil */}
                  <Link 
                    to="/dashboardcomptable/profilcomptable" 
                    className="relative overflow-hidden group flex flex-col items-center p-5 rounded-xl bg-gradient-to-b from-white to-gray-50 border border-gray-100 hover:border-purple-100 hover:shadow-md transition-all duration-300 hover:-translate-y-1"
                  >
                    <div className="absolute inset-0 bg-gradient-to-r from-purple-50 to-violet-50 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                    <div className="relative z-10 p-3 mb-3 rounded-lg bg-gradient-to-br from-purple-100 to-violet-50 group-hover:from-purple-200 group-hover:to-violet-100 transition-all duration-300 shadow-inner">
                      <FaUserTie className="text-purple-600 text-2xl" />
                    </div>
                    <span className="relative z-10 text-sm font-semibold text-gray-700 group-hover:text-gray-900">Profil Comptable</span>
                    <span className="relative z-10 mt-1 text-xs text-gray-500 group-hover:text-purple-600">Paramètres</span>
                  </Link>
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
                        {item % 2 === 0 ? <FaCheckCircle className="text-xl" /> : <FaFileInvoice className="text-xl" />}
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
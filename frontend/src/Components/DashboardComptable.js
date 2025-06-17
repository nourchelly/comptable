import React, { useState, useEffect, Fragment } from 'react';
import {
  FiHome, FiFileText, FiUser, FiLogOut, FiSearch, FiDollarSign, FiPieChart, FiChevronDown, FiChevronRight
} from "react-icons/fi";
import { 
  FaFileInvoice, FaUniversity, FaClipboardCheck, FaUserTie, FaSignOutAlt, FaQrcode,
  FaFileAlt, FaRobot, FaFileInvoiceDollar
} from "react-icons/fa";
import { Link, Outlet, useLocation, useNavigate } from "react-router-dom";
import axios from "axios";
import Notification from './Notification';
import { useUser } from './UserContext';

// Importations spécifiques pour Chart.js
import { Bar, Doughnut } from 'react-chartjs-2'; // Importe Doughnut
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  ArcElement, // Importe ArcElement pour les graphiques en secteur/anneau
  Title,
  Tooltip,
  Legend,
} from 'chart.js';

// Enregistrez les composants nécessaires de Chart.js
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  ArcElement, // Enregistre ArcElement
  Title,
  Tooltip,
  Legend
);


const DashboardComptable = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useUser();
  const [showConfirm, setShowConfirm] = useState(false);
  const [usersStats, setUsersStats] = useState({
    facture: 0,
    releve: 0,
    rapport: 0,
    taches_automatisees: 0,
    economie_heures: 0,
    validated_items: 0,  // Nouveau champ pour les éléments validés
    adjusted_items: 0,   // Nouveau champ pour les éléments ajustés
    recent_activities: [],
    months_stats: []
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
          console.log("Stats reçues:", response.data.data.stats);
        } else {
          console.error('Structure inattendue des données:', response.data);
          setUsersStats({
            facture: 0,
            releve: 0,
            rapport: 0,
            taches_automatisees: 0,
            economie_heures: 0,
            validated_items: 0,
            adjusted_items: 0,
            recent_activities: [],
            months_stats: []
          });
        }
      } catch (err) {
        console.error('Erreur API lors du chargement des statistiques:', err);
        if (err.response?.status === 401) {
          navigate('/connexion');
        }
        setUsersStats({
            facture: 0,
            releve: 0,
            rapport: 0,
            taches_automatisees: 0,
            economie_heures: 0,
            validated_items: 0,
            adjusted_items: 0,
            recent_activities: [],
            months_stats: []
        });
      } finally {
        setLoadingStats(false);
      }
    };
    fetchStats();
  }, [navigate]);

  const handleLogout = () => {
    const token = localStorage.getItem('auth_token');
    
    axios.post("http://127.0.0.1:8000/api/log/", {}, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    })
      .then(result => {
        if (result.data.status === 'success' || result.data.Status) {
          localStorage.removeItem("valid");
          localStorage.removeItem("auth_token");
          localStorage.removeItem("userId");
          localStorage.removeItem("userRole");
          navigate('/connexion');
        }
      })
      .catch(err => {
        console.error("Erreur lors de la déconnexion:", err);
        localStorage.removeItem("valid");
        localStorage.removeItem("auth_token");
        localStorage.removeItem("userId");
        localStorage.removeItem("userRole");
        navigate('/connexion');
      });
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
      title: "Rapports Financiers",
      icon: <FiFileText className="text-green-600" />,
      color: "green"
    },
    "/dashboardcomptable/facture": {
      title: "Gestion des Factures",
      icon: <FaFileInvoice className="text-blue-600" />,
      color: "blue"
    },
    "/dashboardcomptable/banque": {
      title: "Gestion des relevés bancaires",
      icon: <FaUniversity className="text-yellow-600" />,
      color: "yellow"
    },
    "/dashboardcomptable/rapprochement": {
      title: "Rapprochements intelligents",
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

  // Préparation des données pour le graphique à barres (Statistiques Mensuelles)
  const barChartData = {
    labels: usersStats.months_stats.map(stat => stat.month),
    datasets: [
      {
        label: 'Factures',
        data: usersStats.months_stats.map(stat => stat.factures),
        backgroundColor: 'rgba(59, 130, 246, 0.6)', // blue-500 avec opacité
        borderColor: 'rgba(59, 130, 246, 1)',
        borderWidth: 1,
      },
      {
        label: 'Rapprochements',
        data: usersStats.months_stats.map(stat => stat.rapprochements),
        backgroundColor: 'rgba(16, 185, 129, 0.6)', // green-500 avec opacité
        borderColor: 'rgba(16, 185, 129, 1)',
        borderWidth: 1,
      },
    ],
  };

  const barChartOptions = {
    responsive: true,
    plugins: {
      legend: {
        position: 'top',
        labels: {
            font: {
                size: 14
            }
        }
      },
      title: {
        display: true,
        text: 'Activités Mensuelles (Factures & Rapprochements)',
        font: {
            size: 18
        },
        color: '#334155'
      },
      tooltip: {
        callbacks: {
          label: function(context) {
            let label = context.dataset.label || '';
            if (label) {
              label += ': ';
            }
            if (context.parsed.y !== null) {
              label += context.parsed.y;
            }
            return label;
          }
        }
      }
    },
    scales: {
        x: {
            grid: {
                display: false
            },
            ticks: {
                color: '#64748B'
            }
        },
        y: {
            beginAtZero: true,
            grid: {
                color: '#e2e8f0'
            },
            ticks: {
                color: '#64748B'
            }
        }
    }
  };

  // Préparation des données pour le graphique en anneau (Validé/Ajusté)
  const doughnutData = {
    labels: ['Validé', 'Ajusté'],
    datasets: [
      {
        data: [usersStats.validated_items, usersStats.adjusted_items],
        backgroundColor: [
          'rgba(34, 197, 94, 0.8)', // green-500 avec opacité
          'rgba(234, 88, 12, 0.8)', // orange-600 avec opacité
        ],
        borderColor: [
          'rgba(34, 197, 94, 1)',
          'rgba(234, 88, 12, 1)',
        ],
        borderWidth: 1,
      },
    ],
  };

  const doughnutOptions = {
    responsive: true,
    maintainAspectRatio: false, // Important pour contrôler la taille
    plugins: {
      legend: {
        position: 'right', // Positionne la légende à droite
        labels: {
          font: {
            size: 14
          }
        }
      },
      title: {
        display: true,
        text: 'Statut des éléments',
        font: {
          size: 18
        },
        color: '#334155'
      },
      tooltip: {
        callbacks: {
          label: function(context) {
            const label = context.label || '';
            const value = context.parsed;
            const total = context.dataset.data.reduce((sum, val) => sum + val, 0);
            const percentage = total > 0 ? ((value / total) * 100).toFixed(2) : 0;
            return `${label}: ${value} (${percentage}%)`;
          }
        }
      }
    },
    cutout: '70%', // Crée un anneau (doughnut) au lieu d'un secteur (pie)
  };


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
                {sidebarOpen && <span>Relevés Bancaires</span>}
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
                {sidebarOpen && <span>Rapports Financiers</span>}
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
            
            <div className="flex items-center space-x-2">
              <div className="h-10 w-10 rounded-full bg-gradient-to-r from-indigo-500 to-purple-500 flex items-center justify-center text-white font-medium">
                {user?.username?.charAt(0).toUpperCase() || 'C'}
              </div>
              {sidebarOpen && (
                <div className="hidden md:block">
                  <p className="text-sm font-medium">{user?.username || 'Comptable'}</p>
                  <p className="text-xs text-gray-500">Comptable</p>
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
                        {usersStats.months_stats.length > 0 ? usersStats.months_stats[usersStats.months_stats.length - 1].factures : 0} nouvelles ce mois 
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

                {/* Tâches Automatisées Card (Rapprochements) */}
                <div className="bg-white p-6 rounded-xl shadow-sm hover:shadow-md transition-all border border-gray-100">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="text-sm text-gray-500 mb-1">Tâches Automatisées</p>
                      {loadingStats ? (
                        <div className="h-8 w-3/4 bg-gray-200 rounded animate-pulse"></div>
                      ) : (
                        <p className="text-2xl font-bold text-gray-800">{usersStats.taches_automatisees}</p>
                      )}
                      <p className="text-xs text-purple-500 mt-2 flex items-center">
                        <span className="inline-block w-2 h-2 bg-purple-500 rounded-full mr-1"></span>
                        Économie de {usersStats.economie_heures}h/mois
                      </p>
                    </div>
                    <div className="p-3 bg-purple-50 rounded-lg text-purple-600">
                      <FaRobot className="text-xl" />
                    </div>
                  </div>
                </div>

                {/* Rapports Générés Card */}
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

              {/* Nouvelle section pour les graphiques Validé/Ajusté */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Graphique Validé / Ajusté */}
                <div className="bg-white rounded-xl shadow-md p-6 flex flex-col items-center">
                  <h3 className="text-xl font-semibold text-gray-800 mb-4 flex items-center">
                    <FaClipboardCheck className="mr-3 text-red-500 text-2xl" />
                    Statut des Éléments
                  </h3>
                  {loadingStats ? (
                    <div className="h-64 w-64 bg-gray-200 rounded-full animate-pulse"></div>
                  ) : usersStats.validated_items + usersStats.adjusted_items > 0 ? (
                    <div className="relative w-64 h-64"> {/* Conteneur pour le graphique */}
                      <Doughnut data={doughnutData} options={doughnutOptions} />
                    </div>
                  ) : (
                    <p className="text-gray-500 text-center py-4">Aucune donnée Validé/Ajusté disponible.</p>
                  )}
                </div>

                {/* Section Activités Récentes (maintenue) */}
                <div className="bg-white rounded-xl shadow-md p-6">
                  <h3 className="text-xl font-semibold text-gray-800 mb-4 flex items-center">
                    <FiFileText className="mr-3 text-indigo-500 text-2xl" />
                    Activités Récentes
                  </h3>
                  {loadingStats ? (
                    <div className="space-y-4">
                      {[1, 2, 3].map((_, index) => (
                        <div key={index} className="flex items-center space-x-4 animate-pulse">
                          <div className="w-10 h-10 bg-gray-200 rounded-full"></div>
                          <div className="flex-1 space-y-2">
                            <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                            <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : usersStats.recent_activities && usersStats.recent_activities.length > 0 ? (
                    <ul className="divide-y divide-gray-200">
                      {usersStats.recent_activities.map((activity, index) => (
                        <li key={index} className="py-3 flex items-center space-x-4">
                          <div className={`p-2 rounded-full text-white ${activity.color === 'blue' ? 'bg-blue-500' : activity.color === 'green' ? 'bg-green-500' : activity.color === 'purple' ? 'bg-purple-500' : 'bg-gray-500'}`}>
                            {activity.icon === 'FaFileInvoice' && <FaFileInvoice className="text-lg" />}
                            {activity.icon === 'FaClipboardCheck' && <FaClipboardCheck className="text-lg" />}
                            {activity.icon === 'FiFileText' && <FiFileText className="text-lg" />}
                            {/* Ajoutez d'autres icônes au besoin */}
                          </div>
                          <div className="flex-1">
                            <p className="text-sm font-medium text-gray-900">{activity.title}</p>
                            <p className="text-xs text-gray-500">{new Date(activity.date).toLocaleString('fr-FR', {
                              year: 'numeric',
                              month: 'short',
                              day: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit'
                            })}</p>
                          </div>
                          <span className={`px-2 py-0.5 text-xs font-semibold rounded-full ${
                            activity.status === 'validé' ? 'bg-green-100 text-green-800' :
                            activity.status === 'complet' ? 'bg-indigo-100 text-indigo-800' :
                            activity.status === 'généré' ? 'bg-purple-100 text-purple-800' :
                            'bg-gray-100 text-gray-800'
                          }`}>
                            {activity.status}
                          </span>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-gray-500 text-center py-4">Aucune activité récente.</p>
                  )}
                </div>
              </div>

              {/* Section Statistiques Mensuelles (avec Chart.js) */}
              <div className="bg-white rounded-xl shadow-md p-6">
                <h3 className="text-xl font-semibold text-gray-800 mb-4 flex items-center">
                  <FiPieChart className="mr-3 text-orange-500 text-2xl" />
                  Statistiques Mensuelles
                </h3>
                {loadingStats ? (
                  <div className="h-64 bg-gray-200 rounded animate-pulse"></div>
                ) : usersStats.months_stats && usersStats.months_stats.length > 0 ? (
                  <div className="w-full">
                    <Bar data={barChartData} options={barChartOptions} />
                  </div>
                ) : (
                  <p className="text-gray-500 text-center py-4">Aucune donnée mensuelle disponible pour le graphique.</p>
                )}
              </div>

            </div>
          )}
        </main>
      </div>
    </div>
  );
};

export default DashboardComptable;
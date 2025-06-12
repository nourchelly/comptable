import React, { useState, useEffect } from 'react';
import { 
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer 
} from 'recharts';
import { 
  Link, useLocation, useNavigate, Outlet 
} from 'react-router-dom';
import { 
  FaChartLine, FaMoneyBillWave, FaPercentage, FaTachometerAlt,
  FaChevronRight, FaUserTie, FaFileInvoice, FaBalanceScale, 
  FaCalendarAlt, FaSearch, FaHome, FaFileAlt, FaClipboardCheck, 
  FaUserCircle, FaSignOutAlt, FaBell, FaQrcode, FaFilter,
  FaRegClock, FaChartPie, FaRegChartBar, FaRegListAlt
} from 'react-icons/fa';
import { 
  FiTrendingUp, FiAlertTriangle, FiActivity, FiDollarSign,
  FiCheckCircle, FiAlertCircle, FiClock, FiPieChart,FiRefreshCw,FiChevronDown
} from 'react-icons/fi';
import axios from 'axios';
import { toast } from 'react-toastify';
import { useUser } from './UserContext';

const COLORS = ['#10B981', '#F59E0B', '#6366F1', '#EF4444', '#8B5CF6'];

const DashboardDirecteur = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useUser();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState('last30days');
  const [bankFilter, setBankFilter] = useState('all');
  const [showConfirm, setShowConfirm] = useState(false);

  const isActive = (path) => location.pathname.includes(path);

  const getPageTitle = () => {
    if (isActive('/profildirecteur')) return 'Profil Directeur';
    if (isActive('/rapports')) return 'Rapports Financiers';
    if (isActive('/audits')) return 'Audits Financiers';
    if (isActive('/calendar')) return 'Calendrier';
    return 'Tableau de Bord';
  };

  const getPageIcon = () => {
    if (isActive('/profildirecteur')) return <FaUserTie className="text-indigo-500 mr-3" />;
    if (isActive('/rapports')) return <FiTrendingUp className="text-emerald-500 mr-3" />;
    if (isActive('/audits')) return <FiAlertTriangle className="text-amber-500 mr-3" />;
    if (isActive('/calendar')) return <FaCalendarAlt className="text-purple-500 mr-3" />;
    return <FaTachometerAlt className="text-indigo-500 mr-3" />;
  };

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

useEffect(() => {
  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const response = await axios.get('http://localhost:5000/api/dashboard/finance', {
        params: {
          dateRange,
          banque_id: bankFilter === 'all' ? 'all' : bankFilter
        },
        withCredentials: true,
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        }
      });

      // Vérification des données reçues
      if (!response.data || !response.data.metadata) {
        throw new Error('Données du dashboard invalides');
      }

      // Normalisation des données
      const normalizedData = {
        ...response.data,
        metrics: {
          taux_completude: response.data.metrics?.taux_completude || 0,
          taux_anomalies: response.data.metrics?.taux_anomalies || 0,
          montant_total: response.data.metrics?.montant_total || 0,
          montant_moyen: response.data.metrics?.montant_moyen || 0,
          montants_par_statut: response.data.metrics?.montants_par_statut || {
            complet: 0,
            anomalie: 0,
            incomplet: 0
          }
        },
        charts: {
          ...response.data.charts,
          statut_distribution: response.data.charts?.statut_distribution || {
            complet: 0,
            anomalie: 0,
            incomplet: 0
          }
        }
      };

      setDashboardData(normalizedData);
    } catch (error) {
      console.error('Erreur détaillée:', error.response?.data || error.message);
      toast.error(`Erreur lors du chargement des données: ${error.message}`);
      setDashboardData(null);
    } finally {
      setLoading(false);
    }
  };

  if (isActive('/dashboarddirecteur') && !isActive('/dashboarddirecteur/')) {
    fetchDashboardData();
  }
}, [dateRange, bankFilter, location.pathname]);

  const Sidebar = () => (
    <div className="w-64 bg-gradient-to-b from-indigo-700 to-indigo-800 text-white flex flex-col h-full shadow-xl transition-all duration-300">
      <div className="p-6 flex items-center justify-center border-b border-indigo-600">
        <div className="bg-white p-2 rounded-lg mr-3">
          <FaQrcode className="text-3xl text-indigo-600" />
        </div>
        <span className="text-2xl font-bold text-white">Compta<span className="text-indigo-200">Bot</span></span>
      </div>

      <nav className="flex-1 px-4 py-6 space-y-2">
        <Link 
          to="/dashboarddirecteur" 
          className={`flex items-center p-3 mx-2 rounded-lg transition-all ${
            isActive('/dashboarddirecteur') && !isActive('/dashboarddirecteur/') 
              ? 'bg-white text-indigo-700 shadow-md font-semibold' 
              : 'text-indigo-100 hover:bg-indigo-600 hover:text-white'
          }`}
        >
          <div className={`p-2 rounded-lg mr-3 ${
            isActive('/dashboarddirecteur') && !isActive('/dashboarddirecteur/') 
              ? 'bg-indigo-100 text-indigo-600' 
              : 'bg-indigo-500 text-white'
          }`}>
            <FaTachometerAlt className="text-lg" />
          </div>
          <span>Tableau de bord</span>
          {isActive('/dashboarddirecteur') && !isActive('/dashboarddirecteur/') && 
            <FaChevronRight className="ml-auto text-indigo-500 text-sm" />}
        </Link>

        <Link 
          to="/dashboarddirecteur/rapports" 
          className={`flex items-center p-3 mx-2 rounded-lg transition-all ${
            isActive('/rapports') 
              ? 'bg-white text-indigo-700 shadow-md font-semibold' 
              : 'text-indigo-100 hover:bg-indigo-600 hover:text-white'
          }`}
        >
          <div className={`p-2 rounded-lg mr-3 ${
            isActive('/rapports') 
              ? 'bg-emerald-100 text-emerald-600' 
              : 'bg-emerald-500 text-white'
          }`}>
            <FiTrendingUp className="text-lg" />
          </div>
          <span>Rapports Financiers</span>
          {isActive('/rapports') && <FaChevronRight className="ml-auto text-indigo-500 text-sm" />}
        </Link>

        <Link 
          to="/dashboarddirecteur/audits" 
          className={`flex items-center p-3 mx-2 rounded-lg transition-all ${
            isActive('/audits') 
              ? 'bg-white text-indigo-700 shadow-md font-semibold' 
              : 'text-indigo-100 hover:bg-indigo-600 hover:text-white'
          }`}
        >
          <div className={`p-2 rounded-lg mr-3 ${
            isActive('/audits') 
              ? 'bg-amber-100 text-amber-600' 
              : 'bg-amber-500 text-white'
          }`}>
            <FiAlertTriangle className="text-lg" />
          </div>
          <span>Audits Financiers</span>
          {isActive('/audits') && <FaChevronRight className="ml-auto text-indigo-500 text-sm" />}
        </Link>

        <Link 
          to="/dashboarddirecteur/profildirecteur" 
          className={`flex items-center p-3 mx-2 rounded-lg transition-all ${
            isActive('/profildirecteur') 
              ? 'bg-white text-indigo-700 shadow-md font-semibold' 
              : 'text-indigo-100 hover:bg-indigo-600 hover:text-white'
          }`}
        >
          <div className={`p-2 rounded-lg mr-3 ${
            isActive('/profildirecteur') 
              ? 'bg-purple-100 text-purple-600' 
              : 'bg-purple-500 text-white'
          }`}>
            <FaUserCircle className="text-lg" />
          </div>
          <span>Profil Directeur</span>
          {isActive('/profildirecteur') && <FaChevronRight className="ml-auto text-indigo-500 text-sm" />}
        </Link>
      </nav>

      <div className="p-4 border-t border-indigo-600">
        <button 
          onClick={() => setShowConfirm(true)}
          className="flex items-center w-full p-3 text-indigo-100 hover:bg-indigo-600 rounded-lg transition-colors group"
        >
          <div className="p-2 rounded-lg mr-3 bg-rose-500 text-white group-hover:bg-rose-600">
            <FaSignOutAlt className="text-lg" />
          </div>
          <span className="font-medium">Déconnexion</span>
        </button>
      </div>
    </div>
  );

  const DashboardContent = () => {
    if (loading) {
      return (
        <div className="flex justify-center items-center h-full">
          <div className="flex flex-col items-center">
            <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-indigo-600 mb-4"></div>
            
          </div>
        </div>
      );
    }

    if (!dashboardData) {
      return (
        <div className="text-center py-10">
          <div className="mx-auto w-24 h-24 bg-indigo-100 rounded-full flex items-center justify-center mb-4">
            <FiAlertCircle className="text-indigo-500 text-3xl" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">Aucune donnée disponible</h3>
          <p className="text-gray-600 mb-6">Nous n'avons pas pu charger les données du tableau de bord</p>
          <button 
            onClick={() => window.location.reload()}
            className="px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors shadow-md flex items-center mx-auto"
          >
            <FiRefreshCw className="mr-2" />
            Recharger
          </button>
        </div>
      );
    }

    // Préparer les données pour les graphiques
    const chartData = dashboardData.charts?.monthly_trends?.labels?.map((label, index) => ({
      name: label,
      total: dashboardData.charts.monthly_trends.datasets[0]?.data[index] || 0,
      complet: dashboardData.charts.monthly_trends.datasets[1]?.data[index] || 0,
      anomalie: dashboardData.charts.monthly_trends.datasets[2]?.data[index] || 0
    })) || [];

    const amountData = dashboardData.charts?.monthly_amounts?.labels?.map((label, index) => ({
      name: label,
      montant: dashboardData.charts.monthly_amounts.datasets[0]?.data[index] || 0
    })) || [];

    const statusData = Object.entries(dashboardData.charts?.statut_distribution || {}).map(([name, value]) => ({
      name: name === 'complet' ? 'Complet' : name === 'anomalie' ? 'Anomalie' : 'Incomplet',
      value,
      color: name === 'complet' ? '#10B981' : name === 'anomalie' ? '#F59E0B' : '#6366F1'
    }));

    const anomaliesData = dashboardData.charts?.top_anomalies?.map(item => ({
      name: item.anomalie || 'Non spécifié',
      count: item.count || 0
    })) || [];

    return (
      <div className="space-y-6">
        {/* Header with filters */}
        <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-100">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-800 flex items-center">
                <FaTachometerAlt className="text-indigo-500 mr-3" />
                Tableau de Bord Financier
              </h1>
              <p className="text-gray-600 mt-1">
                Période: {dashboardData.metadata?.periode || 'Non définie'}
              </p>
            </div>
            
            <div className="flex flex-wrap gap-3">
              <div className="relative flex-1 min-w-[200px]">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <FaCalendarAlt className="text-gray-400" />
                </div>
                <select 
                  value={dateRange}
                  onChange={(e) => setDateRange(e.target.value)}
                  className="pl-10 pr-4 py-2.5 w-full border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent appearance-none bg-white shadow-sm"
                >
                  <option value="last7days">7 derniers jours</option>
                  <option value="last30days">30 derniers jours</option>
                  <option value="last90days">90 derniers jours</option>
                  <option value="all">Toutes périodes</option>
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-gradient-to-r from-indigo-500 to-indigo-600 p-6 rounded-xl shadow-lg text-white">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm font-medium text-indigo-100 uppercase tracking-wider">Rapprochements</p>
                <p className="text-3xl font-bold mt-2">
                  {dashboardData.metadata?.total_reconciliations || 0}
                </p>
                <div className="flex items-center mt-3">
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-indigo-400 text-white">
                    <FiTrendingUp className="mr-1" />
                    {dashboardData.metrics?.taux_completude?.toFixed(1) || 0}% complétude
                  </span>
                </div>
              </div>
              <div className="h-12 w-12 rounded-full bg-white bg-opacity-20 flex items-center justify-center">
                <FiDollarSign className="text-white text-xl" />
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-r from-emerald-500 to-emerald-600 p-6 rounded-xl shadow-lg text-white">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm font-medium text-emerald-100 uppercase tracking-wider">Montant Total</p>
                <p className="text-3xl font-bold mt-2">
                  {(dashboardData.metrics?.montant_total || 0).toLocaleString('fr-FR')} €
                </p>
                <div className="flex items-center mt-3">
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-400 text-white">
                    <FaMoneyBillWave className="mr-1" />
                    Moy: {(dashboardData.metrics?.montant_moyen || 0).toFixed(0)} €
                  </span>
                </div>
              </div>
              <div className="h-12 w-12 rounded-full bg-white bg-opacity-20 flex items-center justify-center">
                <FiActivity className="text-white text-xl" />
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-r from-amber-500 to-amber-600 p-6 rounded-xl shadow-lg text-white">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm font-medium text-amber-100 uppercase tracking-wider">Anomalies</p>
                <p className="text-3xl font-bold mt-2">
                  {dashboardData.metrics?.taux_anomalies?.toFixed(1) || 0}%
                </p>
                <div className="flex items-center mt-3">
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-400 text-white">
                    <FiAlertTriangle className="mr-1" />
                    {dashboardData.charts?.statut_distribution?.anomalie || 0} cas
                  </span>
                </div>
              </div>
              <div className="h-12 w-12 rounded-full bg-white bg-opacity-20 flex items-center justify-center">
                <FiAlertTriangle className="text-white text-xl" />
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-r from-green-500 to-green-600 p-6 rounded-xl shadow-lg text-white">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm font-medium text-green-100 uppercase tracking-wider">Complets</p>
                <p className="text-3xl font-bold mt-2">
                  {dashboardData.charts?.statut_distribution?.complet || 0}
                </p>
                <div className="flex items-center mt-3">
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-400 text-white">
                    <FiCheckCircle className="mr-1" />
                    {(dashboardData.metrics?.montants_par_statut?.complet || 0).toLocaleString('fr-FR')} €
                  </span>
                </div>
              </div>
              <div className="h-12 w-12 rounded-full bg-white bg-opacity-20 flex items-center justify-center">
                <FiCheckCircle className="text-white text-xl" />
              </div>
            </div>
          </div>
        </div>

        {/* Charts Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Trends Chart */}
          <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-100">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-800 flex items-center">
                <FiTrendingUp className="text-indigo-500 mr-2" />
                Évolution des rapprochements
              </h2>
              <div className="flex items-center text-sm text-gray-500">
                <FiClock className="mr-1" />
                Mise à jour: maintenant
              </div>
            </div>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData}>
                  <defs>
                    <linearGradient id="colorTotal" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#6366F1" stopOpacity={0.8}/>
                      <stop offset="95%" stopColor="#6366F1" stopOpacity={0.1}/>
                    </linearGradient>
                  </defs>
                  <XAxis 
                    dataKey="name" 
                    tick={{ fill: '#6B7280' }}
                    axisLine={{ stroke: '#E5E7EB' }}
                  />
                  <YAxis 
                    tick={{ fill: '#6B7280' }}
                    axisLine={{ stroke: '#E5E7EB' }}
                  />
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                  <Tooltip 
                    contentStyle={{
                      backgroundColor: 'white',
                      borderRadius: '0.5rem',
                      boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                      border: '1px solid #E5E7EB'
                    }}
                  />
                  <Area 
                    type="monotone" 
                    dataKey="total" 
                    stroke="#6366F1" 
                    strokeWidth={2}
                    fillOpacity={1} 
                    fill="url(#colorTotal)" 
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Distribution Chart */}
          <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-100">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-800 flex items-center">
                <FiPieChart className="text-emerald-500 mr-2" />
                Répartition par statut
              </h2>
              <div className="text-sm text-gray-500">
                Total: {dashboardData.metadata?.total_reconciliations || 0}
              </div>
            </div>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={statusData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    outerRadius={80}
                    innerRadius={50}
                    fill="#8884d8"
                    dataKey="value"
                    label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                  >
                    {statusData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip 
                    contentStyle={{
                      backgroundColor: 'white',
                      borderRadius: '0.5rem',
                      boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                      border: '1px solid #E5E7EB'
                    }}
                  />
                  <Legend 
                    layout="vertical" 
                    verticalAlign="middle" 
                    align="right"
                    wrapperStyle={{
                      paddingLeft: '20px'
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* Monthly amounts */}
        <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-100">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-800 flex items-center">
              <FaMoneyBillWave className="text-emerald-500 mr-2" />
              Évolution des montants mensuels
            </h2>
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={amountData}>
                <defs>
                  <linearGradient id="colorMontant" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10B981" stopOpacity={0.8}/>
                    <stop offset="95%" stopColor="#10B981" stopOpacity={0.1}/>
                  </linearGradient>
                </defs>
                <XAxis 
                  dataKey="name" 
                  tick={{ fill: '#6B7280' }}
                  axisLine={{ stroke: '#E5E7EB' }}
                />
                <YAxis 
                  tick={{ fill: '#6B7280' }}
                  axisLine={{ stroke: '#E5E7EB' }}
                  tickFormatter={(value) => `${value.toLocaleString()} €`}
                />
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                <Tooltip 
                  contentStyle={{
                    backgroundColor: 'white',
                    borderRadius: '0.5rem',
                    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                    border: '1px solid #E5E7EB'
                  }}
                  formatter={(value, name) => [`${value.toLocaleString()} €`, 'Montant']}
                />
                <Area 
                  type="monotone" 
                  dataKey="montant" 
                  stroke="#10B981" 
                  strokeWidth={2}
                  fillOpacity={1} 
                  fill="url(#colorMontant)" 
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Anomalies and Banks */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Anomalies Chart */}
          <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-100">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-800 flex items-center">
                <FiAlertTriangle className="text-amber-500 mr-2" />
                Top des anomalies détectées
              </h2>
            </div>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={anomaliesData}
                  layout="vertical"
                  margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="#E5E7EB" />
                  <XAxis 
                    type="number" 
                    tick={{ fill: '#6B7280' }}
                    axisLine={{ stroke: '#E5E7EB' }}
                  />
                  <YAxis 
                    dataKey="name" 
                    type="category" 
                    width={120}
                    tick={{ fill: '#6B7280', fontSize: 12 }}
                    axisLine={{ stroke: '#E5E7EB' }}
                  />
                  <Tooltip 
                    contentStyle={{
                      backgroundColor: 'white',
                      borderRadius: '0.5rem',
                      boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                      border: '1px solid #E5E7EB'
                    }}
                  />
                  <Bar 
                    dataKey="count" 
                    fill="#F59E0B" 
                    radius={[0, 4, 4, 0]} 
                    animationDuration={1500}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Top Banks */}
          <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-100">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-800 flex items-center">
                <FaBalanceScale className="text-purple-500 mr-2" />
                Top banques
              </h2>
            </div>
            <div className="space-y-3">
              {dashboardData.charts?.top_banques?.map((bank, index) => (
                <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center">
                    <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center mr-3">
  <span className="text-purple-600 font-semibold text-sm">{index + 1}</span>
</div>
                      <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center mr-3">
                      <span className="text-purple-600 font-semibold text-sm">{index + 1}</span>
                    </div>
                    <div>
                      <h3 className="font-medium text-gray-900">{bank.banque}</h3>
                      <p className="text-sm text-gray-500">{bank.count} rapprochements</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="flex items-center">
                      <div className="w-24 bg-gray-200 rounded-full h-2 mr-2">
                        <div 
                          className="bg-purple-500 h-2 rounded-full transition-all duration-1000"
                          style={{ 
                            width: `${Math.min((bank.count / (dashboardData.charts?.top_banques?.[0]?.count || 1)) * 100, 100)}%` 
                          }}
                        ></div>
                      </div>
                      <span className="text-sm font-medium text-gray-700">
                        {((bank.count / dashboardData.metadata?.total_reconciliations) * 100).toFixed(1)}%
                      </span>
                    </div>
                  </div>
                </div>
              )) || (
                <div className="text-center py-8 text-gray-500">
                  <FaBalanceScale className="mx-auto text-3xl mb-2 opacity-50" />
                  <p>Aucune donnée bancaire disponible</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Recent Activity Section */}
        <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-100">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-800 flex items-center">
              <FiActivity className="text-indigo-500 mr-2" />
              Activité récente
            </h2>
            <button className="text-indigo-600 hover:text-indigo-800 text-sm font-medium flex items-center">
              Voir tout
              <FaChevronRight className="ml-1 text-xs" />
            </button>
          </div>
          <div className="space-y-3">
            {dashboardData.recent_activity?.length > 0 ? (
              dashboardData.recent_activity.map((activity, index) => (
                <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                  <div className="flex items-center">
                    <div className={`w-3 h-3 rounded-full mr-3 ${
                      activity.statut === 'complet' ? 'bg-green-500' :
                      activity.statut === 'anomalie' ? 'bg-amber-500' : 
                      'bg-gray-400'
                    }`}></div>
                    <div>
                      <p className="font-medium text-gray-900">Facture #{activity.facture}</p>
                      <p className="text-sm text-gray-600">{activity.banque} - {activity.date}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-gray-900">
                      {activity.montant.toLocaleString('fr-FR')} €
                    </p>
                    <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                      activity.statut === 'complet' ? 'bg-green-100 text-green-800' :
                      activity.statut === 'anomalie' ? 'bg-amber-100 text-amber-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {activity.statut}
                    </span>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-8 text-gray-500">
                <FiActivity className="mx-auto text-3xl mb-2 opacity-50" />
                <p>Aucune activité récente</p>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  // Confirmation Dialog
  const ConfirmDialog = () => (
    showConfirm && (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white p-6 rounded-xl shadow-xl max-w-md w-full mx-4">
          <div className="flex items-center mb-4">
            <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mr-4">
              <FaSignOutAlt className="text-red-600 text-xl" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Confirmer la déconnexion</h3>
              <p className="text-gray-600">Êtes-vous sûr de vouloir vous déconnecter ?</p>
            </div>
          </div>
          <div className="flex justify-end space-x-3">
            <button
              onClick={() => setShowConfirm(false)}
              className="px-4 py-2 text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
            >
              Annuler
            </button>
            <button
              onClick={handleLogout}
              className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
            >
              Se déconnecter
            </button>
          </div>
        </div>
      </div>
    )
  );

  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar />
      
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <header className="bg-white shadow-sm border-b border-gray-200 px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              {getPageIcon()}
              <div>
                <h1 className="text-xl font-semibold text-gray-800">{getPageTitle()}</h1>
                <p className="text-sm text-gray-600">
                  {dashboardData?.metadata?.periode || 'Chargement...'}
                </p>
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              
              
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 bg-indigo-600 rounded-full flex items-center justify-center">
                  <span className="text-white text-sm font-medium">D</span>
                </div>
                <div className="hidden md:block">
                  <p className="text-sm font-medium text-gray-900">Directeur</p>
                  <p className="text-xs text-gray-600">Administrateur</p>
                </div>
              </div>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="flex-1 overflow-y-auto p-6">
          {location.pathname === '/dashboarddirecteur' || location.pathname === '/dashboarddirecteur/' ? (
            <DashboardContent />
          ) : (
            <Outlet />
          )}
        </main>
      </div>

      <ConfirmDialog />
    </div>
  );
};
export default DashboardDirecteur;
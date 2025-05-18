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
  FiCheckCircle, FiAlertCircle, FiClock, FiPieChart,FiRefreshCw
} from 'react-icons/fi';
import axios from 'axios';
import { toast } from 'react-toastify';

const COLORS = ['#6366F1', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6'];

const DashboardDirecteur = () => {
  const navigate = useNavigate();
  const location = useLocation();
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
    axios.get("http://127.0.0.1:8000/api/logout/")
      .then(result => {
        if (result.data.Status) {
          localStorage.removeItem("valid");
          navigate('/connexion');
        }
      })
      .catch(err => console.error(err));
  };

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        const response = await axios.get('http://localhost:5000/api/dashboard/finance', {
          params: {
            dateRange,
            banque_id: bankFilter === 'all' ? null : bankFilter
          },
          withCredentials: true,
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json'
          }
        });
        setDashboardData(response.data);
      } catch (error) {
        toast.error('Erreur lors du chargement des données');
        console.error(error);
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
            <p className="text-gray-600">Chargement des données...</p>
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
                {dateRange === 'last7days' ? '7 derniers jours' : 
                 dateRange === 'last30days' ? '30 derniers jours' : 
                 dateRange === 'last90days' ? '90 derniers jours' : 
                 'Toutes périodes'}
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
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
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
                <p className="text-sm font-medium text-emerald-100 uppercase tracking-wider">Transactions</p>
                <p className="text-3xl font-bold mt-2">
                  {dashboardData.metadata?.total_transactions || 0}
                </p>
                <div className="flex items-center mt-3">
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-400 text-white">
                    <FaMoneyBillWave className="mr-1" />
                    {dashboardData.metadata?.total_amount?.toLocaleString() || 0} €
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
                    {dashboardData.charts?.top_anomalies?.length || 0} types
                  </span>
                </div>
              </div>
              <div className="h-12 w-12 rounded-full bg-white bg-opacity-20 flex items-center justify-center">
                <FiAlertTriangle className="text-white text-xl" />
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
                Mise à jour: il y a 5 min
              </div>
            </div>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={dashboardData.charts?.monthly_trends?.datasets[0]?.data || []}>
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
                    dataKey="count" 
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
                    data={Object.entries(dashboardData.charts?.statut_distribution || {}).map(([name, value]) => ({ name, value }))}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    outerRadius={80}
                    innerRadius={50}
                    fill="#8884d8"
                    dataKey="value"
                    label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                  >
                    {Object.keys(dashboardData.charts?.statut_distribution || {}).map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
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

        {/* Anomalies Chart */}
        <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-100">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-800 flex items-center">
              <FiAlertTriangle className="text-amber-500 mr-2" />
              Top 5 des anomalies détectées
            </h2>
            <div className="text-sm text-amber-600 font-medium">
              {dashboardData.metrics?.total_anomalies || 0} anomalies totales
            </div>
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={dashboardData.charts?.top_anomalies || []}
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
                  dataKey="_id" 
                  type="category" 
                  width={150}
                  tick={{ fill: '#6B7280' }}
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

        {/* Recent Activity */}
        <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-100">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-800 flex items-center">
              <FiActivity className="text-purple-500 mr-2" />
              Activité récente
            </h2>
            <Link 
              to="/dashboarddirecteur/rapports" 
              className="text-sm text-indigo-600 hover:text-indigo-800 font-medium flex items-center"
            >
              Voir tout <FaChevronRight className="ml-1 text-xs" />
            </Link>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Facture</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Banque</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Montant</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Statut</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {dashboardData.recent_activity?.map((item, index) => (
                  <tr key={index} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      <div className="flex items-center">
                        <FiClock className="mr-2 text-gray-400" />
                        {item.date}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {item.facture}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {item.banque}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {item.montant ? `${item.montant} €` : '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        item.statut === 'complet' ? 'bg-green-100 text-green-800' :
                        item.statut === 'anomalie' ? 'bg-amber-100 text-amber-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {item.statut === 'complet' ? (
                          <FiCheckCircle className="mr-1" />
                        ) : item.statut === 'anomalie' ? (
                          <FiAlertCircle className="mr-1" />
                        ) : (
                          <FiClock className="mr-1" />
                        )}
                        {item.statut}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="flex h-screen bg-gray-50 font-sans">
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
                  className="flex-1 bg-red-600 hover:bg-red-700 text-white py-3 px-6 rounded-lg font-medium transition-colors flex items-center justify-center shadow-md"
                >
                  <FaSignOutAlt className="mr-2" />
                  Déconnexion
                </button>
                <button 
                  onClick={() => setShowConfirm(false)}
                  className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-800 py-3 px-6 rounded-lg font-medium transition-colors shadow-md"
                >
                  Annuler
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <Sidebar />

      <div className="flex-1 flex flex-col overflow-hidden">
        <header className="bg-white shadow-sm py-4 px-6 flex items-center justify-between sticky top-0 z-10">
          <div className="flex items-center">
            {getPageIcon()}
            <h1 className="text-xl font-bold text-gray-800">
              {getPageTitle()}
            </h1>
          </div>

          <div className="flex items-center space-x-4">
            <div className="relative hidden md:block">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <FaSearch className="text-gray-400" />
              </div>
              <input 
                type="text" 
                placeholder="Rechercher..." 
                className="pl-10 pr-4 py-2 w-64 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-gray-50 transition-all shadow-sm"
              />
            </div>
            <button className="p-2 text-gray-500 hover:text-gray-700 relative">
              <div className="relative">
                <FaBell className="text-xl" />
                <span className="absolute top-0 right-0 h-2.5 w-2.5 rounded-full bg-red-500 border-2 border-white"></span>
              </div>
            </button>
            <div className="flex items-center space-x-2 group cursor-pointer">
              <div className="h-10 w-10 rounded-full bg-gradient-to-r from-indigo-500 to-purple-500 flex items-center justify-center text-white font-medium">
                DF
              </div>
              <div className="hidden md:block">
                <p className="text-sm font-medium">Directeur Financier</p>
                <p className="text-xs text-gray-500">Administrateur</p>
              </div>
            </div>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-6 bg-gray-50">
          {isActive('/dashboarddirecteur') && !isActive('/dashboarddirecteur/') ? (
            <DashboardContent />
          ) : (
            <Outlet />
          )}
        </main>
      </div>
    </div>
  );
};

export default DashboardDirecteur;
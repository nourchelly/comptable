import React from "react";
import { Link, Outlet, useLocation, useNavigate } from "react-router-dom";
import axios from "axios";
import { 
  FaHome, FaChartLine, FaFileInvoice, FaUserCog, FaQrcode,
  FaCheckCircle, FaSignOutAlt, FaSearch, FaBell,
  FaCog, FaUserCircle, FaMoneyBillWave, FaBalanceScale,
  FaHandHoldingUsd, FaRobot, FaFileAlt, FaCalculator,
  FaBuilding, FaClipboardCheck, FaCoins, FaShieldAlt
} from "react-icons/fa";

const DashboardComptable = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const handleLogout = async () => {
    try {
      const refreshToken = localStorage.getItem('refresh_token');
      const accessToken = localStorage.getItem('valid');
  
      console.log('Tokens:', { refreshToken, accessToken }); // Debug
  
      const response = await axios.post(
        "http://127.0.0.1:8000/api/logout/",
        { refresh_token: refreshToken }, // Format important
        {
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${accessToken}`
          }
        }
      );
  
      console.log('Réponse:', response.data); // Debug
      localStorage.removeItem('valid');
      localStorage.removeItem('refresh_token');
      navigate('/login');
    } catch (error) {
      console.error('Erreur détaillée:', {
        status: error.response?.status,
        data: error.response?.data,
        config: error.config
      });
      // Force logout même en cas d'erreur
      localStorage.clear();
      navigate('/login');
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

        <div className="flex-1 overflow-y-auto p-4">
          {/* Menu Principal */}
          <nav className="space-y-1">
            <Link 
              to="/dashboardcomptable" 
              className={`flex items-center p-3 rounded-lg ${location.pathname === "/dashboardcomptable" ? 'bg-blue-50 text-blue-600' : 'text-gray-700 hover:bg-gray-100'}`}
            >
              <FaHome className={`mr-3 ${location.pathname === "/dashboardcomptable" ? 'text-blue-500' : 'text-gray-500'}`} />
              <span>Tableau de bord</span>
            </Link>
            {/* Section Profil */}
<div className="mt-6">
  <p className="px-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Profil</p>
  <div className="mt-2 space-y-1">
    <Link 
      to="/dashboardcomptable/profilcomptable" 
      className={`flex items-center p-3 rounded-lg ${location.pathname === "/dashboardcomptable/profil" ? 'bg-indigo-50 text-indigo-600' : 'text-gray-700 hover:bg-gray-100'}`}
    >
      <FaUserCircle className={`mr-3 ${location.pathname === "/dashboardcomptable/profil" ? 'text-indigo-500' : 'text-gray-500'}`} />
      <span>Mon Profil</span>
    </Link>
    <Link 
                  to="/dashboardcomptable/rapports" 
                  className={`flex items-center p-3 rounded-lg ${location.pathname === "/dashboardcomptable/rapports" ? 'bg-blue-50 text-blue-600' : 'text-gray-700 hover:bg-gray-100'}`}
                >
                  <FaFileAlt className={`mr-3 ${location.pathname === "/dashboardcomptable/rapports" ? 'text-blue-500' : 'text-gray-500'}`} />
                  <span>Rapports</span>
                </Link>
                <Link 
                  to="/dashboardcomptable/facture" 
                  className={`flex items-center p-3 rounded-lg ${location.pathname === "/dashboardcomptable/facture" ? 'bg-blue-50 text-blue-600' : 'text-gray-700 hover:bg-gray-100'}`}
                >
                  <FaFileInvoice className={`mr-3 ${location.pathname === "/dashboardcomptable/facture" ? 'text-blue-500' : 'text-gray-500'}`} />
                  <span>Factures</span>
                </Link>
  </div>
</div>

            {/* Section Analyse Financière */}
            <div className="mt-6">
              <p className="px-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Analyse Financière</p>
              <div className="mt-2 space-y-1">
                <Link 
                  to="/dashboardcomptable/etats-financiers" 
                  className={`flex items-center p-3 rounded-lg ${location.pathname === "/dashboardcomptable/etats-financiers" ? 'bg-blue-50 text-blue-600' : 'text-gray-700 hover:bg-gray-100'}`}
                >
                  <FaChartLine className={`mr-3 ${location.pathname === "/dashboardcomptable/etats-financiers" ? 'text-blue-500' : 'text-gray-500'}`} />
                  <span>États Financiers</span>
                </Link>
              
              </div>
            </div>

            {/* Section Gestion des Actifs */}
            <div className="mt-6">
              <p className="px-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Gestion des Actifs</p>
              <div className="mt-2 space-y-1">
                <Link 
                  to="/dashboardcomptable/actes-financiers" 
                  className={`flex items-center p-3 rounded-lg ${location.pathname === "/dashboardcomptable/actes-financiers" ? 'bg-green-50 text-green-600' : 'text-gray-700 hover:bg-gray-100'}`}
                >
                  <FaHandHoldingUsd className={`mr-3 ${location.pathname === "/dashboardcomptable/actes-financiers" ? 'text-green-500' : 'text-gray-500'}`} />
                  <span>Actes Financiers</span>
                </Link>
                <Link 
                  to="/dashboardcomptable/conseil" 
                  className={`flex items-center p-3 rounded-lg ${location.pathname === "/dashboardcomptable/conseil" ? 'bg-green-50 text-green-600' : 'text-gray-700 hover:bg-gray-100'}`}
                >
                  <FaUserCog className={`mr-3 ${location.pathname === "/dashboardcomptable/conseil" ? 'text-green-500' : 'text-gray-500'}`} />
                  <span>Conseil Utilisateurs</span>
                </Link>
              </div>
            </div>

            {/* Section Automatisation */}
            <div className="mt-6">
              <p className="px-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Automatisation</p>
              <div className="mt-2 space-y-1">
                <Link 
                  to="/dashboardcomptable/automatisation" 
                  className={`flex items-center p-3 rounded-lg ${location.pathname === "/dashboardcomptable/automatisation" ? 'bg-purple-50 text-purple-600' : 'text-gray-700 hover:bg-gray-100'}`}
                >
                  <FaRobot className={`mr-3 ${location.pathname === "/dashboardcomptable/automatisation" ? 'text-purple-500' : 'text-gray-500'}`} />
                  <span>Système Comptable</span>
                </Link>
              </div>
            </div>
          </nav>
        </div>

        <div className="p-4 border-t border-gray-200">
          <button 
            onClick={handleLogout}
            className="flex items-center w-full p-3 text-gray-700 hover:bg-gray-100 rounded-lg"
          >
            <FaSignOutAlt className="mr-3 text-gray-500" />
            <span>Déconnexion</span>
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <header className="bg-white border-b border-gray-200 py-4 px-6 flex items-center justify-between">
          <h1 className="text-2xl font-bold text-gray-800">
            {location.pathname === "/dashboardcomptable" && "Tableau de Bord"}
            {location.pathname === "/dashboardcomptable/profilcomptable" && "Profil Comptable"}
            {location.pathname === "/dashboardcomptable/etats-financiers" && "États Financiers"}
            {location.pathname === "/dashboardcomptable/rapports" && "Rapports Comptables"}
            {location.pathname === "/dashboardcomptable/facture" && "Factures"}
            {location.pathname === "/dashboardcomptable/actes-financiers" && "Actes Financiers"}
            {location.pathname === "/dashboardcomptable/automatisation" && "Automatisation"}
          </h1>

          <div className="flex items-center space-x-4">
            <div className="relative">
              <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input 
                type="text" 
                placeholder="Rechercher..." 
                className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <button className="p-2 text-gray-500 hover:text-gray-700">
              <FaBell />
            </button>
            <button className="p-2 text-gray-500 hover:text-gray-700">
              <FaCog />
            </button>
            <div className="flex items-center space-x-2">
              <FaUserCircle className="text-blue-500 text-xl" />
              <span className="font-medium">Comptable</span>
            </div>
          </div>
        </header>

        {/* Content */}
        <main className="flex-1 overflow-y-auto p-6 bg-gray-50">
          <Outlet />

          {/* Default Dashboard Content */}
          {location.pathname === "/dashboardcomptable" && (
            <div className="space-y-6">
              {/* Stats Cards */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white p-6 rounded-xl shadow-sm border-l-4 border-blue-500">
                  <div className="flex justify-between items-center">
                    <div>
                      <p className="text-sm font-medium text-gray-500">Solde Actuel</p>
                      <p className="text-2xl font-bold text-gray-800">24,500 €</p>
                    </div>
                    <FaMoneyBillWave className="text-blue-500 text-3xl" />
                  </div>
                </div>

                <div className="bg-white p-6 rounded-xl shadow-sm border-l-4 border-green-500">
                  <div className="flex justify-between items-center">
                    <div>
                      <p className="text-sm font-medium text-gray-500">Transactions</p>
                      <p className="text-2xl font-bold text-gray-800">156</p>
                    </div>
                    <FaCoins className="text-green-500 text-3xl" />
                  </div>
                </div>

                <div className="bg-white p-6 rounded-xl shadow-sm border-l-4 border-purple-500">
                  <div className="flex justify-between items-center">
                    <div>
                      <p className="text-sm font-medium text-gray-500">Tâches Automatisées</p>
                      <p className="text-2xl font-bold text-gray-800">28</p>
                    </div>
                    <FaRobot className="text-purple-500 text-3xl" />
                  </div>
                </div>
              </div>

              {/* Quick Actions */}
              <div className="bg-white p-6 rounded-xl shadow-sm">
                <h2 className="text-lg font-semibold text-gray-800 mb-4">Actions Rapides</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  <button className="flex flex-col items-center justify-center p-4 border border-blue-100 rounded-lg hover:bg-blue-50 transition-colors">
                    <FaFileInvoice className="text-blue-500 text-2xl mb-2" />
                    <span className="text-sm font-medium">Créer Facture</span>
                  </button>
                  <button className="flex flex-col items-center justify-center p-4 border border-green-100 rounded-lg hover:bg-green-50 transition-colors">
                    <FaCalculator className="text-green-500 text-2xl mb-2" />
                    <span className="text-sm font-medium">Nouveau Rapport</span>
                  </button>
                  <button className="flex flex-col items-center justify-center p-4 border border-yellow-100 rounded-lg hover:bg-yellow-50 transition-colors">
                    <FaClipboardCheck className="text-yellow-500 text-2xl mb-2" />
                    <span className="text-sm font-medium">Valider Écritures</span>
                  </button>
                  <button className="flex flex-col items-center justify-center p-4 border border-purple-100 rounded-lg hover:bg-purple-50 transition-colors">
                    <FaShieldAlt className="text-purple-500 text-2xl mb-2" />
                    <span className="text-sm font-medium">Audit Comptable</span>
                  </button>
                </div>
              </div>

              {/* Recent Activities */}
              <div className="bg-white p-6 rounded-xl shadow-sm">
                <h2 className="text-lg font-semibold text-gray-800 mb-4">Activités Récentes</h2>
                <div className="space-y-4">
                  {[1, 2, 3].map((item) => (
                    <div key={item} className="flex items-center p-3 border-b border-gray-100 last:border-0">
                      <div className={`p-2 rounded-full ${item % 2 === 0 ? 'bg-green-100 text-green-600' : 'bg-blue-100 text-blue-600'}`}>
                        {item % 2 === 0 ? <FaCheckCircle /> : <FaFileInvoice />}
                      </div>
                      <div className="ml-4 flex-1">
                        <p className="text-sm font-medium">
                          {item % 2 === 0 ? 'Validation comptable' : 'Nouvelle facture'} #{item}
                        </p>
                        <p className="text-xs text-gray-500">Il y a {item} heure{item > 1 ? 's' : ''}</p>
                      </div>
                      <div className={`text-sm font-medium ${item % 2 === 0 ? 'text-green-600' : 'text-blue-600'}`}>
                        {item % 2 === 0 ? 'Validé' : 'En attente'}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
};

export default DashboardComptable;
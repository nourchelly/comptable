import React from "react";
import { Link, Outlet, useLocation, useNavigate } from "react-router-dom";
import axios from "axios";
import { 
  FaHome, FaChartPie, FaFileAlt, FaClipboardCheck, 
  FaUserCircle, FaSignOutAlt, FaSearch, FaBell,
  FaCog, FaCalendarAlt, FaFileExport, FaChartLine,
  FaMoneyBillWave, FaPercentage, FaBalanceScale ,FaDatabase,FaQrcode
} from "react-icons/fa";
import { AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

// Données pour les graphiques
const performanceData = [
  { name: 'Jan', revenus: 4000, depenses: 2400 },
  { name: 'Fév', revenus: 3000, depenses: 1800 },
  { name: 'Mar', revenus: 5000, depenses: 2800 },
  { name: 'Avr', revenus: 3780, depenses: 2908 },
  { name: 'Mai', revenus: 5890, depenses: 4800 },
  { name: 'Jun', revenus: 6390, depenses: 3800 },
];

const budgetData = [
  { name: 'Marketing', budget: 4000, utilisé: 3200 },
  { name: 'R&D', budget: 3000, utilisé: 1898 },
  { name: 'Production', budget: 6000, utilisé: 4800 },
];

const DashboardDirecteurFinancier = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = async () => {
    try {
      const refreshToken = localStorage.getItem('refresh_token');
      const accessToken = localStorage.getItem('valid');

      await axios.post(
        "http://127.0.0.1:8000/api/logout/",
        { refresh_token: refreshToken },
        {
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${accessToken}`
          }
        }
      );

      localStorage.removeItem('valid');
      localStorage.removeItem('refresh_token');
      navigate('/login');
    } catch (error) {
      console.error('Erreur de déconnexion:', error);
      localStorage.clear();
      navigate('/login');
    }
  };

  // Données pour les audits
  const auditsData = [
    { id: 1, nom: "Audit Financier Q2", date: "15/07/2023", statut: "À planifier", priorite: "Haute" },
    { id: 2, nom: "Audit Interne RH", date: "22/07/2023", statut: "En préparation", priorite: "Moyenne" },
    { id: 3, nom: "Audit Comptable Annuel", date: "05/08/2023", statut: "Planifié", priorite: "Haute" },
  ];

  // Données pour les rapports
  const rapportsData = [
    { id: 1, titre: "Rapport Financier Q1", date: "15/04/2023", type: "Trimestriel", statut: "Validé" },
    { id: 2, titre: "Analyse des Dépenses", date: "30/05/2023", type: "Analytique", statut: "En révision" },
    { id: 3, titre: "Prévisions 2023", date: "10/06/2023", type: "Prévisionnel", statut: "Brouillon" },
  ];

  return (
    <div className="flex h-screen bg-gray-50 font-sans">
      {/* Sidebar élégante */}
     <div className="w-64 bg-white border-r border-gray-200 flex flex-col shadow-sm">
                      <div className="p-4 border-b border-gray-200 flex items-center">
                        <FaQrcode className="text-2xl mr-3 text-indigo-600" />
                        <span className="text-2xl font-bold text-gray-800">Compta<span className="text-indigo-600">BoT</span></span>
                      </div>

        <div className="flex-1 overflow-y-auto p-4">
          <nav className="space-y-2">
            <Link 
              to="/dashboarddirecteur" 
              className={`flex items-center p-3 rounded-lg transition ${location.pathname === "/dashboarddirecteur" ? 'bg-blue-50 text-blue-600' : 'text-gray-700 hover:bg-gray-100'}`}
            >
              <FaHome className="mr-3" />
              <span>Tableau de bord</span>
            </Link>

            <Link 
              to="/dashboarddirecteur/rapports" 
              className={`flex items-center p-3 rounded-lg transition ${location.pathname === "/dashboarddirecteur/rapports" ? 'bg-blue-50 text-blue-600' : 'text-gray-700 hover:bg-gray-100'}`}
            >
              <FaFileAlt className="mr-3" />
              <span>Rapports Financiers</span>
            </Link>

            <Link 
              to="/dashboarddirecteur/audits" 
              className={`flex items-center p-3 rounded-lg transition ${location.pathname === "/dashboarddirecteur/audits" ? 'bg-blue-50 text-blue-600' : 'text-gray-700 hover:bg-gray-100'}`}
            >
              <FaClipboardCheck className="mr-3" />
              <span>Audits Financiers</span>
            </Link>

            <Link 
              to="/dashboarddirecteur/profildirecteur" 
              className={`flex items-center p-3 rounded-lg transition ${location.pathname === "/dashboarddirecteur/profil" ? 'bg-blue-50 text-blue-600' : 'text-gray-700 hover:bg-gray-100'}`}
            >
              <FaUserCircle className="mr-3" />
              <span>Mon Profil</span>
            </Link>
          </nav>
        </div>

        <div className="p-4 border-t border-indigo-700">
          <button 
            onClick={handleLogout}
            className="flex items-center w-full p-3 text-gray-700 hover:bg-gray-100 rounded-lg"
          >
            <FaSignOutAlt className="mr-3" />
            <span>Déconnexion</span>
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header moderne */}
        <header className="bg-white shadow-sm py-4 px-6 flex items-center justify-between">
          <h1 className="text-xl font-bold text-gray-800">
            {location.pathname === "/dashboarddirecteur" && "Tableau de Bord"}
            {location.pathname === "/dashboarddirecteur/rapports" && "Rapports Financiers"}
            {location.pathname === "/dashboarddirecteur/audits" && "Audits Financiers"}
            {location.pathname === "/dashboarddirecteur/profil" && "Mon Profil"}
          </h1>

          <div className="flex items-center space-x-4">
            <div className="relative hidden md:block">
              <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input 
                type="text" 
                placeholder="Rechercher..." 
                className="pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-gray-50"
              />
            </div>
            <button className="p-2 text-gray-500 hover:text-gray-700 relative">
              <FaBell />
              <span className="absolute top-0 right-0 h-2 w-2 rounded-full bg-red-500"></span>
            </button>
            <div className="flex items-center space-x-2">
              <div className="h-8 w-8 rounded-full bg-indigo-100 flex items-center justify-center">
                <FaUserCircle className="text-indigo-600" />
              </div>
              <span className="hidden md:block font-medium text-sm">Directeur Financier</span>
            </div>
          </div>
        </header>

        {/* Content avec graphiques */}
        <main className="flex-1 overflow-y-auto p-6 bg-gray-50">
          <Outlet />

          {/* Tableau de Bord avec graphiques */}
          {location.pathname === "/dashboarddirecteur" && (
            <div className="space-y-6">
              {/* Cartes de Statistiques */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white p-5 rounded-xl shadow-sm border-t-4 border-blue-500">
                  <div className="flex justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-500">Chiffre d'Affaires</p>
                      <p className="text-2xl font-bold text-gray-800 mt-1">2.45M €</p>
                      <div className="flex items-center text-green-500 text-sm mt-1">
                        <FaChartLine className="mr-1" />
                        <span>↑ 12% vs trimestre dernier</span>
                      </div>
                    </div>
                    <div className="h-12 w-12 rounded-full bg-blue-50 flex items-center justify-center">
                      <FaMoneyBillWave className="text-blue-500 text-xl" />
                    </div>
                  </div>
                </div>

                <div className="bg-white p-5 rounded-xl shadow-sm border-t-4 border-green-500">
                  <div className="flex justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-500">Marge Brute</p>
                      <p className="text-2xl font-bold text-gray-800 mt-1">1.12M €</p>
                      <div className="flex items-center text-green-500 text-sm mt-1">
                        <FaPercentage className="mr-1" />
                        <span>45.7% de marge</span>
                      </div>
                    </div>
                    <div className="h-12 w-12 rounded-full bg-green-50 flex items-center justify-center">
                      <FaChartPie className="text-green-500 text-xl" />
                    </div>
                  </div>
                </div>

                <div className="bg-white p-5 rounded-xl shadow-sm border-t-4 border-purple-500">
                  <div className="flex justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-500">Trésorerie</p>
                      <p className="text-2xl font-bold text-gray-800 mt-1">845K €</p>
                      <div className="flex items-center text-blue-500 text-sm mt-1">
                        <FaBalanceScale className="mr-1" />
                        <span>Ratio: 1.8</span>
                      </div>
                    </div>
                    <div className="h-12 w-12 rounded-full bg-purple-50 flex items-center justify-center">
                      <FaDatabase className="text-purple-500 text-xl" />
                    </div>
                  </div>
                </div>
              </div>

              {/* Graphique de Performance */}
              <div className="bg-white p-5 rounded-xl shadow-sm">
                <h2 className="text-lg font-semibold text-gray-800 mb-4">Performance Financière</h2>
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={performanceData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                      <defs>
                        <linearGradient id="colorRevenus" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#4F46E5" stopOpacity={0.8}/>
                          <stop offset="95%" stopColor="#4F46E5" stopOpacity={0}/>
                        </linearGradient>
                        <linearGradient id="colorDepenses" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#10B981" stopOpacity={0.8}/>
                          <stop offset="95%" stopColor="#10B981" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <XAxis dataKey="name" />
                      <YAxis />
                      <CartesianGrid strokeDasharray="3 3" vertical={false} />
                      <Tooltip />
                      <Area type="monotone" dataKey="revenus" stroke="#4F46E5" fillOpacity={1} fill="url(#colorRevenus)" />
                      <Area type="monotone" dataKey="depenses" stroke="#10B981" fillOpacity={1} fill="url(#colorDepenses)" />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Graphique Budget vs Dépenses */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-white p-5 rounded-xl shadow-sm">
                  <h2 className="text-lg font-semibold text-gray-800 mb-4">Budget vs Dépenses</h2>
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={budgetData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} />
                        <XAxis dataKey="name" />
                        <YAxis />
                        <Tooltip />
                        <Bar dataKey="budget" fill="#4F46E5" radius={[4, 4, 0, 0]} />
                        <Bar dataKey="utilisé" fill="#10B981" radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                {/* Audits à Planifier */}
                <div className="bg-white p-5 rounded-xl shadow-sm">
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-lg font-semibold text-gray-800">Audits à Planifier</h2>
                    <Link to="/dashboarddirecteur/audits" className="text-indigo-600 hover:text-indigo-800 text-sm">
                      Voir tous →
                    </Link>
                  </div>
                  
                  <div className="space-y-3">
                    {auditsData.map((audit) => (
                      <div key={audit.id} className="border border-gray-100 rounded-lg p-3 hover:shadow-sm transition">
                        <div className="flex justify-between items-start">
                          <div>
                            <h3 className="font-medium">{audit.nom}</h3>
                            <div className="flex items-center text-sm text-gray-500 mt-1">
                              <FaCalendarAlt className="mr-1" />
                              <span>{audit.date}</span>
                            </div>
                          </div>
                          <span className={`px-2 py-1 text-xs rounded-full ${
                            audit.priorite === 'Haute' ? 'bg-red-100 text-red-800' :
                            'bg-yellow-100 text-yellow-800'
                          }`}>
                            {audit.priorite}
                          </span>
                        </div>
                        <div className="flex justify-between items-center mt-2">
                          <span className={`text-xs px-2 py-1 rounded-full ${
                            audit.statut === 'Planifié' ? 'bg-green-100 text-green-800' :
                            audit.statut === 'En préparation' ? 'bg-blue-100 text-blue-800' :
                            'bg-gray-100 text-gray-800'
                          }`}>
                            {audit.statut}
                          </span>
                          <button className="text-indigo-600 text-xs hover:text-indigo-800">
                            Planifier
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Rapports Récents */}
              <div className="bg-white p-5 rounded-xl shadow-sm">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-semibold text-gray-800">Rapports Récents</h2>
                  <Link to="/dashboarddirecteur/rapports" className="text-indigo-600 hover:text-indigo-800 text-sm">
                    Voir tous →
                  </Link>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {rapportsData.map((rapport) => (
                    <div key={rapport.id} className="border border-gray-100 rounded-lg p-4 hover:shadow-sm transition">
                      <div className="flex items-center mb-2">
                        <div className={`h-3 w-3 rounded-full mr-2 ${
                          rapport.statut === 'Validé' ? 'bg-green-500' :
                          rapport.statut === 'En révision' ? 'bg-yellow-500' :
                          'bg-gray-500'
                        }`}></div>
                        <h3 className="font-medium text-sm">{rapport.titre}</h3>
                      </div>
                      <div className="text-xs text-gray-500 mb-1">Type: {rapport.type}</div>
                      <div className="text-xs text-gray-500 mb-3">Date: {rapport.date}</div>
                      <div className="flex justify-between items-center">
                        <span className={`text-xs px-2 py-1 rounded-full ${
                          rapport.statut === 'Validé' ? 'bg-green-100 text-green-800' :
                          rapport.statut === 'En révision' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {rapport.statut}
                        </span>
                        <button className="text-indigo-600 text-xs hover:text-indigo-800">
                          Consulter
                        </button>
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

export default DashboardDirecteurFinancier;
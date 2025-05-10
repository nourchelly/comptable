import React, { useState, useEffect } from "react";
import Search from './Search';
import { Link, Outlet, useLocation, useNavigate } from "react-router-dom";
import axios from "axios";
import { 
  FaHome, FaCheckCircle, FaSignOutAlt, 
  FaSearch, FaBell, FaUserCircle, FaUsers, FaUserTie, FaUserCheck, FaUserTimes, FaUserPlus,
  FaUsersCog, FaFileInvoiceDollar,
  FaShieldAlt, FaDatabase, FaQrcode,
  FaSpinner, FaTimes,FaUserShield, FaUserEdit, FaClipboardList, FaArrowRight
} from "react-icons/fa";


const Dashboard = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [showResults, setShowResults] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [searchError, setSearchError] = useState(null);
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
    // Charger les statistiques utilisateurs
    useEffect(() => {
      const fetchStats = async () => {
        setLoadingStats(true);
        try {
          const response = await axios.get('http://localhost:8000/api/user-stats/', {
            withCredentials: true
          });
          
          console.log('API Response:', response.data);
          
          // Correction ici - la structure est response.data.data.stats
          if (response.data.status && response.data.data?.stats) {
            setUserStats(response.data.data.stats);
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
  // Fonction de recherche avec debounce


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

  const getPageTitle = () => {
    switch (location.pathname) {
      case "/dashboard": return "Tableau de bord";
      case "/dashboard/comptes": return "Gestion des comptes";
      case "/dashboard/profile": return "Profil administrateur";
      case "/dashboard/validation": return "Supervision des actions";
      case "/dashboard/audit": return "Journal d'audit";
      default: return "";
    }
  };

  const clearSearch = () => {
    setSearchQuery("");
    setSearchResults([]);
    setShowResults(false);
  };

  return (
    <div className="flex h-screen bg-gray-50" onClick={() => showResults && setShowResults(false)}>
      {/* Modal de déconnexion */}
      {showLogoutModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl overflow-hidden w-full max-w-md">
            <div className="p-6 text-center">
              <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-red-100 mb-4">
                <FaSignOutAlt className="h-8 w-8 text-red-600" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">Déconnexion</h3>
              <p className="text-gray-600 mb-6">
                Êtes-vous sûr de vouloir vous déconnecter ?
              </p>
              <div className="flex justify-center space-x-4">
                <button
                  onClick={() => setShowLogoutModal(false)}
                  className="px-6 py-2.5 bg-gray-200 hover:bg-gray-300 text-gray-800 rounded-lg font-medium transition-colors duration-200"
                >
                  Annuler
                </button>
                <button
                  onClick={handleLogout}
                  className="px-6 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-lg font-medium transition-colors duration-200 flex items-center"
                >
                  <FaSignOutAlt className="mr-2" />
                  Déconnexion
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

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
            to="/dashboard/profile" 
            className={`flex items-center p-3 rounded-lg transition-all ${
              location.pathname === "/dashboard/profile" 
                ? "bg-indigo-50 text-indigo-700 font-medium border-l-4 border-indigo-600" 
                : "text-gray-600 hover:bg-gray-100 hover:text-gray-800"
            }`}
          >
            <FaUserShield className={`mr-3 text-lg ${
              location.pathname === "/dashboard/profile" ? "text-indigo-600" : "text-gray-500"
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
            <FaDatabase className={`mr-3 text-lg ${
              location.pathname === "/dashboard/validation" ? "text-indigo-600" : "text-gray-500"
            }`} />
            <span>Supervisions</span>
          </Link>

         
        </nav>

        <div className="p-4 border-t border-gray-200">
          <button 
            onClick={() => setShowLogoutModal(true)}
            className="w-full flex items-center justify-center p-3 rounded-lg text-gray-600 hover:bg-red-50 hover:text-red-600 transition-all group"
          >
            <FaSignOutAlt className="mr-3 text-lg text-gray-500 group-hover:text-red-500" />
            <span className="font-medium">Déconnexion</span>
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
             <Search/>
              
              
              {searchQuery && (
                <button
                  onClick={clearSearch}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  <FaTimes />
                </button>
              )}
              
              {isSearching && (
                <FaSpinner className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 animate-spin" />
              )}
              
              {/* Résultats de recherche */}
              {showResults && (
                <div 
                  className="absolute z-50 mt-1 w-full bg-white shadow-lg rounded-lg overflow-hidden border border-gray-200 max-h-96 overflow-y-auto"
                  onClick={(e) => e.stopPropagation()}
                >
                  {searchError ? (
                    <div className="p-4 text-center text-red-500">{searchError}</div>
                  ) : searchResults.length > 0 ? (
                    searchResults.map((result) => (
                      <Link
                        key={result.id}
                        to={result.link}
                        className="block px-4 py-3 hover:bg-gray-50 transition-colors border-b border-gray-100 last:border-b-0"
                        onClick={() => {
                          setShowResults(false);
                          setSearchQuery("");
                        }}
                      >
                        <div className="font-medium text-gray-800">{result.name}</div>
                        <div className="text-xs text-gray-500 mt-1 capitalize">{result.type}</div>
                      </Link>
                    ))
                  ) : (
                    <div className="p-4 text-center text-gray-500">
                      {searchQuery.length > 2 ? "Aucun résultat trouvé" : "Tapez au moins 3 caractères"}
                    </div>
                  )}
                </div>
              )}
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
          <div>
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

                 {/* Section Statistiques Utilisateurs */}
                 <div className="mb-8">
                  <h3 className="text-xl font-semibold text-gray-800 mb-4 flex items-center">
                    <FaUsers className="mr-2 text-indigo-600" />
                    Statistiques Utilisateurs
                  </h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
                    {/* Carte Total Utilisateurs */}
                    <div className="bg-white p-6 rounded-xl shadow-sm border-l-4 border-blue-500 hover:shadow-md transition-all transform hover:-translate-y-1">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm text-gray-500">Total Utilisateurs</p>
                          {loadingStats ? (
                            <FaSpinner className="animate-spin text-gray-400 mt-2" />
                          ) : (
                            <p className="text-2xl font-bold mt-1">{userStats.total}</p>
                          )}
                        </div>
                        <div className="p-3 rounded-full bg-blue-100 text-blue-600 shadow-inner">
                          <FaUsers size={20} />
                        </div>
                      </div>
                    </div>

                    {/* Carte Admins */}
                    <div className="bg-white p-6 rounded-xl shadow-sm border-l-4 border-purple-500 hover:shadow-md transition-all transform hover:-translate-y-1">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm text-gray-500">Administrateurs</p>
                          {loadingStats ? (
                            <FaSpinner className="animate-spin text-gray-400 mt-2" />
                          ) : (
                            <p className="text-2xl font-bold mt-1">{userStats.admin}</p>
                          )}
                        </div>
                        <div className="p-3 rounded-full bg-purple-100 text-purple-600 shadow-inner">
                          <FaUserShield size={20} />
                        </div>
                      </div>
                    </div>

                    {/* Carte Comptables */}
                    <div className="bg-white p-6 rounded-xl shadow-sm border-l-4 border-green-500 hover:shadow-md transition-all transform hover:-translate-y-1">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm text-gray-500">Comptables</p>
                          {loadingStats ? (
                            <FaSpinner className="animate-spin text-gray-400 mt-2" />
                          ) : (
                            <p className="text-2xl font-bold mt-1">{userStats.comptable}</p>
                          )}
                        </div>
                        <div className="p-3 rounded-full bg-green-100 text-green-600 shadow-inner">
                          <FaUserTie size={20} />
                        </div>
                      </div>
                    </div>

                    {/* Carte Directeurs */}
                    <div className="bg-white p-6 rounded-xl shadow-sm border-l-4 border-orange-500 hover:shadow-md transition-all transform hover:-translate-y-1">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm text-gray-500">Directeurs</p>
                          {loadingStats ? (
                            <FaSpinner className="animate-spin text-gray-400 mt-2" />
                          ) : (
                            <p className="text-2xl font-bold mt-1">{userStats.directeur}</p>
                          )}
                        </div>
                        <div className="p-3 rounded-full bg-orange-100 text-orange-600 shadow-inner">
                          <FaUserTie size={20} />
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Deuxième ligne de statistiques */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {/* Carte Utilisateurs Actifs */}
                    <div className="bg-white p-6 rounded-xl shadow-sm border-l-4 border-teal-500 hover:shadow-md transition-all transform hover:-translate-y-1">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm text-gray-500">Utilisateurs Actifs</p>
                          {loadingStats ? (
                            <FaSpinner className="animate-spin text-gray-400 mt-2" />
                          ) : (
                            <p className="text-2xl font-bold mt-1">{userStats.active}</p>
                          )}
                        </div>
                        <div className="p-3 rounded-full bg-teal-100 text-teal-600 shadow-inner">
                          <FaUserCheck size={20} />
                        </div>
                      </div>
                    </div>

                    {/* Carte Utilisateurs Inactifs */}
                    <div className="bg-white p-6 rounded-xl shadow-sm border-l-4 border-red-500 hover:shadow-md transition-all transform hover:-translate-y-1">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm text-gray-500">Utilisateurs Inactifs</p>
                          {loadingStats ? (
                            <FaSpinner className="animate-spin text-gray-400 mt-2" />
                          ) : (
                            <p className="text-2xl font-bold mt-1">{userStats.inactive}</p>
                          )}
                        </div>
                        <div className="p-3 rounded-full bg-red-100 text-red-600 shadow-inner">
                          <FaUserTimes size={20} />
                        </div>
                      </div>
                    </div>

                    {/* Carte Nouveaux Utilisateurs */}
                    <div className="bg-white p-6 rounded-xl shadow-sm border-l-4 border-yellow-500 hover:shadow-md transition-all transform hover:-translate-y-1">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm text-gray-500">Nouveaux (30j)</p>
                          {loadingStats ? (
                            <FaSpinner className="animate-spin text-gray-400 mt-2" />
                          ) : (
                            <p className="text-2xl font-bold mt-1">{userStats.newUsers}</p>
                          )}
                        </div>
                        <div className="p-3 rounded-full bg-yellow-100 text-yellow-600 shadow-inner">
                          <FaUserPlus size={20} />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Cartes statistiques existantes */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
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
  {/* Carte Gérer les comptes */}
  <Link 
    to="/dashboard/comptes" 
    className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-all group transform hover:-translate-y-1 hover:border-blue-100"
  >
    <div className="flex items-center mb-4">
      <div className="p-3 rounded-full bg-blue-50 text-blue-600 mr-4 group-hover:bg-blue-600 group-hover:text-white transition-colors shadow-inner">
        <FaUserShield size={20} /> {/* Icône plus appropriée pour la gestion des accès */}
      </div>
      <div>
        <h3 className="font-bold text-lg text-gray-800 group-hover:text-blue-600 transition-colors">
          Gérer les comptes
        </h3>
        <p className="text-gray-500 text-sm mt-1">
          Administration complète des utilisateurs et permissions
        </p>
      </div>
    </div>
    <div className="flex justify-end">
      <FaArrowRight className="text-gray-300 group-hover:text-blue-400 transition-colors" />
    </div>
  </Link>

  {/* Carte Gérer Profil */}
  <Link 
    to="/dashboard/profil" 
    className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-all group transform hover:-translate-y-1 hover:border-green-100"
  >
    <div className="flex items-center mb-4">
      <div className="p-3 rounded-full bg-green-50 text-green-600 mr-4 group-hover:bg-green-600 group-hover:text-white transition-colors shadow-inner">
        <FaUserEdit size={20} /> {/* Icône plus spécifique pour l'édition de profil */}
      </div>
      <div>
        <h3 className="font-bold text-lg text-gray-800 group-hover:text-green-600 transition-colors">
          Gestion de profil
        </h3>
        <p className="text-gray-500 text-sm mt-1">
          Modifier vos informations personnelles et préférences
        </p>
      </div>
    </div>
    <div className="flex justify-end">
      <FaArrowRight className="text-gray-300 group-hover:text-green-400 transition-colors" />
    </div>
  </Link>

  {/* Carte Journal d'audit */}
  <Link 
    to="/dashboard/validation" 
    className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-all group transform hover:-translate-y-1 hover:border-purple-100"
  >
    <div className="flex items-center mb-4">
      <div className="p-3 rounded-full bg-purple-50 text-purple-600 mr-4 group-hover:bg-purple-600 group-hover:text-white transition-colors shadow-inner">
        <FaClipboardList size={20} /> {/* Icône plus représentative d'un journal */}
      </div>
      <div>
        <h3 className="font-bold text-lg text-gray-800 group-hover:text-purple-600 transition-colors">
          Journal d'audit
        </h3>
        <p className="text-gray-500 text-sm mt-1">
          Historique détaillé de toutes les activités système
        </p>
      </div>
    </div>
    <div className="flex justify-end">
      <FaArrowRight className="text-gray-300 group-hover:text-purple-400 transition-colors" />
    </div>
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
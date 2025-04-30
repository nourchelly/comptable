import React from "react";
import { useState } from 'react';
import Notification from './Notification'; // Adaptez le chemin selon votre structure
import { Link, Outlet, useLocation, useNavigate } from "react-router-dom";
import axios from "axios";
import { 
  FaHome, FaFileInvoice, FaQrcode,
  FaCheckCircle, FaSignOutAlt, FaSearch, FaBell,
  FaCog, FaUserCircle, FaMoneyBillWave, 
  FaRobot, FaFileAlt, FaCalculator,
  FaClipboardCheck, FaCoins, FaUserTie ,FaFileInvoiceDollar,FaUniversity,
  FaChevronDown, FaChevronRight
} from "react-icons/fa";

const DashboardComptable = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [showConfirm, setShowConfirm] = useState(false);
  
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
  
  // Vérifie si un lien est actif
  const isActive = (path) => location.pathname === path;

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
               {/* Logout */}
               <div className="p-4 border-t border-indigo-700">
          <button 
            onClick={() => setShowConfirm(true)}
            className="flex items-center w-full p-3 text-indigo-100 hover:bg-indigo-700 rounded-lg transition-colors"
          >
            <FaSignOutAlt className={`text-xl ${sidebarOpen ? 'mr-3' : 'mx-auto'}`} />
            {sidebarOpen && <span className="font-medium">Déconnexion</span>}
          </button>
        </div>
      </div> {/* End of sidebar */}

    {/* Main Content */}
<div className="flex-1 flex flex-col overflow-hidden">
  {/* Header amélioré */}
  <header className="bg-white border-b border-gray-200 py-4 px-6 flex items-center justify-between shadow-sm">
    <h1 className="text-2xl font-bold text-gray-800">
      {isActive("/dashboardcomptable") && "Tableau de Bord"}
      {isActive("/dashboardcomptable/profilcomptable") && "Profil Comptable"}
      {isActive("/dashboardcomptable/rapports") && "Rapports Comptables"}
      {isActive("/dashboardcomptable/facture") && "Gestion des Factures"}
      {isActive("/dashboardcomptable/banque") && "Banque"}
      {isActive("/dashboardcomptable/rapprochement") && "Rapprochement"}
    </h1>

    <div className="flex items-center space-x-4">
      <div className="relative">
        <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 text-lg" />
        <input 
          type="text" 
          placeholder="Rechercher..." 
          className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent w-64"
        />
      </div>
      
      {/* Remplacez le bouton de notification par le composant NotificationCenter */}
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
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white p-6 rounded-xl shadow-sm border-t-4 border-blue-500 hover:shadow-md transition-shadow">
                  <div className="flex justify-between items-center">
                    <div>
                      <p className="text-sm font-medium text-gray-500">Solde Actuel</p>
                      <p className="text-2xl font-bold text-gray-800">24,500 €</p>
                      <p className="text-xs text-green-500 mt-1">+2.5% vs mois dernier</p>
                    </div>
                    <div className="p-3 bg-blue-50 rounded-full">
                      <FaMoneyBillWave className="text-blue-500 text-2xl" />
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
                      <FaCoins className="text-green-500 text-2xl" />
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
                      <FaRobot className="text-purple-500 text-2xl" />
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
                  <Link to="/dashboardcomptable/facture" className="flex flex-col items-center p-4 border border-gray-100 rounded-lg hover:border-indigo-300 hover:bg-indigo-50 transition-colors group">
                    <div className="p-3 bg-blue-100 rounded-full mb-2 group-hover:bg-blue-200 transition-colors">
                      <FaFileInvoice className="text-blue-600 text-2xl" />
                    </div>
                    <span className="text-sm font-medium text-gray-700">Importer Facture</span>
                  </Link>
                 
                  <Link to="/dashboardcomptable/rapports" className="flex flex-col items-center p-4 border border-gray-100 rounded-lg hover:border-green-300 hover:bg-green-50 transition-colors group">
                    <div className="p-3 bg-green-100 rounded-full mb-2 group-hover:bg-green-200 transition-colors">
                      <FaCalculator className="text-green-600 text-2xl" />
                    </div>
                    <span className="text-sm font-medium text-gray-700">Rapports</span>
                  </Link>
                  <Link to="/dashboardcomptable/rapprochement" className="flex flex-col items-center p-4 border border-gray-100 rounded-lg hover:border-yellow-300 hover:bg-yellow-50 transition-colors group">
                    <div className="p-3 bg-yellow-100 rounded-full mb-2 group-hover:bg-yellow-200 transition-colors">
                      <FaClipboardCheck className="text-yellow-600 text-2xl" />
                    </div>
                    <span className="text-sm font-medium text-gray-700">Rapprochements</span>
                  </Link>
                  <Link to="/dashboardcomptable/profilcomptable" className="flex flex-col items-center p-4 border border-gray-100 rounded-lg hover:border-purple-300 hover:bg-purple-50 transition-colors group">
  <div className="p-3 bg-purple-100 rounded-full mb-2 group-hover:bg-purple-200 transition-colors">
    <FaUserTie className="text-purple-600 text-2xl" /> 
  </div>
  <span className="text-sm font-medium text-gray-700">Profil Comptable</span>
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
import React, { useState, useEffect, useMemo } from 'react';
import axios from 'axios';
import { 
  FaUserTie, FaSearch, FaFilter, FaSync, FaCalendarAlt,FaUserPlus,
  FaUserShield, FaUserEdit, FaTrashAlt, FaSignInAlt, FaChartBar
} from 'react-icons/fa';
import { toast } from 'react-toastify';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';

const AdminActionsList = () => {
  const [actions, setActions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('Tous');
  const [filterRole, setFilterRole] = useState('Tous');
  const [dateRange, setDateRange] = useState([null, null]);
  const [startDate, endDate] = dateRange;
  const [lastRefresh, setLastRefresh] = useState(null);
  const [selectedAction, setSelectedAction] = useState(null);
  const [viewMode, setViewMode] = useState('table'); // 'table' ou 'cards'

  // Configurations
const ACTION_TYPES = useMemo(() => [
 { value: 'Tous', label: 'Toutes les actions' },
 { value: 'ajout', label: 'Ajouts (Générique)', icon: <FaUserPlus className="mr-2" /> },
 { value: 'modification', label: 'Modifications (Générique)', icon: <FaUserEdit className="mr-2" /> },
{ value: 'suppression', label: 'Suppressions (Générique)', icon: <FaTrashAlt className="mr-2" /> },
 { value: 'connexion', label: 'Connexions', icon: <FaSignInAlt className="mr-2" /> },
 { value: 'déconnexion', label: 'Déconnexions', icon: <FaSignInAlt className="mr-2 transform rotate-180" /> },
 { value: 'creation', label: 'Créations (Générique)', icon: <FaUserPlus className="mr-2" /> }, // Ajouté

    // Nouveaux types pour les Factures
    { value: 'ajout_facture', label: 'Ajout Facture', icon: <FaUserPlus className="mr-2 text-blue-500" /> },
    { value: 'modification_facture', label: 'Modification Facture', icon: <FaUserEdit className="mr-2 text-blue-500" /> },
    { value: 'suppression_facture', label: 'Suppression Facture', icon: <FaTrashAlt className="mr-2 text-blue-500" /> },
    { value: 'consultation_facture', label: 'Consultation Facture', icon: <FaSearch className="mr-2 text-blue-500" /> },
    { value: 'consultation_liste_factures', label: 'Consultation Liste Factures', icon: <FaSearch className="mr-2 text-blue-500" /> },

    // Nouveaux types pour les Audits (déjà présents dans le backend, mais on les rend explicites ici)
    { value: 'creation_audit', label: 'Création Audit', icon: <FaChartBar className="mr-2 text-purple-500" /> },
    { value: 'modification_audit', label: 'Modification Audit', icon: <FaChartBar className="mr-2 text-purple-500" /> },
    { value: 'suppression_audit', label: 'Suppression Audit', icon: <FaChartBar className="mr-2 text-purple-500" /> },
    { value: 'consultation_audit', label: 'Consultation Audit', icon: <FaChartBar className="mr-2 text-purple-500" /> },
    { value: 'consultation_liste_audits', label: 'Consultation Liste Audits', icon: <FaChartBar className="mr-2 text-purple-500" /> }

 ], []);

  const USER_ROLES = useMemo(() => [
    { value: 'Tous', label: 'Tous les rôles' },
    { value: 'admin', label: 'Administrateurs', icon: <FaUserShield className="mr-2" /> },
    { value: 'comptable', label: 'Comptables', icon: <FaUserTie className="mr-2" /> },
    { value: 'directeur', label: 'Directeurs', icon: <FaUserTie className="mr-2" /> }
  ], []);

  // Classes de type d'action avec icônes
 const ACTION_TYPE_CONFIG = useMemo(() => ({
 'ajout': { class: 'bg-green-100 text-green-800', icon: <FaUserPlus className="mr-1" /> },
 'modification': { class: 'bg-yellow-100 text-yellow-800', icon: <FaUserEdit className="mr-1" /> },
 'suppression': { class: 'bg-red-100 text-red-800', icon: <FaTrashAlt className="mr-1" /> },
 'connexion': { class: 'bg-blue-100 text-blue-800', icon: <FaSignInAlt className="mr-1" /> },
 'déconnexion': { class: 'bg-gray-100 text-gray-800', icon: <FaSignInAlt className="mr-1 transform rotate-180" /> },
    'creation': { class: 'bg-indigo-100 text-indigo-800', icon: <FaUserPlus className="mr-1" /> }, // Ajouté

    // Configurations pour les Factures
    'ajout_facture': { class: 'bg-green-100 text-green-800', icon: <FaUserPlus className="mr-1 text-blue-500" /> },
    'modification_facture': { class: 'bg-yellow-100 text-yellow-800', icon: <FaUserEdit className="mr-1 text-blue-500" /> },
    'suppression_facture': { class: 'bg-red-100 text-red-800', icon: <FaTrashAlt className="mr-1 text-blue-500" /> },
    'consultation_facture': { class: 'bg-teal-100 text-teal-800', icon: <FaSearch className="mr-1 text-blue-500" /> },
    'consultation_liste_factures': { class: 'bg-teal-100 text-teal-800', icon: <FaSearch className="mr-1 text-blue-500" /> },

    // Configurations pour les Audits
    'creation_audit': { class: 'bg-purple-100 text-purple-800', icon: <FaChartBar className="mr-1 text-purple-500" /> },
    'modification_audit': { class: 'bg-purple-100 text-purple-800', icon: <FaChartBar className="mr-1 text-purple-500" /> },
    'suppression_audit': { class: 'bg-purple-100 text-purple-800', icon: <FaChartBar className="mr-1 text-purple-500" /> },
    'consultation_audit': { class: 'bg-purple-100 text-purple-800', icon: <FaChartBar className="mr-1 text-purple-500" /> },
    'consultation_liste_audits': { class: 'bg-purple-100 text-purple-800', icon: <FaChartBar className="mr-1 text-purple-500" /> },

 'default': {
 class: 'bg-gray-100 text-gray-800',
 icon: <FaChartBar className="mr-1" />
 }
}), []);
  // Charger les actions
  const fetchActions = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await axios.get('http://127.0.0.1:8000/api/actions/', {
        params: {
          cacheBuster: Date.now()
        }
      });
      setActions(response.data.actions);
      setLastRefresh(new Date());
    } catch (err) {
      console.error("Erreur de chargement:", err);
      setError("Échec du chargement des actions");
      toast.error(
        <div>
          <h3 className="font-bold">Erreur de chargement</h3>
          <p>Impossible de récupérer les actions</p>
          <button 
            onClick={fetchActions}
            className="mt-2 px-3 py-1 bg-blue-500 text-white rounded text-sm hover:bg-blue-600"
          >
            Réessayer
          </button>
        </div>
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchActions();
  }, []);

  // Filtrage optimisé
  const filteredActions = useMemo(() => {
    const term = searchTerm.toLowerCase();
    return actions.filter(action => {
      const matchesSearch = 
        (action.description?.toLowerCase().includes(term)) || 
        
        (action.username?.toLowerCase().includes(term));
      
      const matchesType = filterType === 'Tous' || 
        action.action_type?.toLowerCase().includes(filterType.toLowerCase());
      
      const matchesRole = filterRole === 'Tous' || action.role === filterRole;
      
      const matchesDate = (!startDate || !endDate) || 
        (new Date(action.timestamp) >= startDate && 
         new Date(action.timestamp) <= endDate);
      
      return matchesSearch && matchesType && matchesRole && matchesDate;
    });
  }, [actions, searchTerm, filterType, filterRole, startDate, endDate]);

  // Statistiques calculées
  const stats = useMemo(() => {
    return {
      total: actions.length,
      additions: actions.filter(a => a.action_type?.toLowerCase().includes('ajout')).length,
      modifications: actions.filter(a => a.action_type?.toLowerCase().includes('modification')).length,
      deletions: actions.filter(a => a.action_type?.toLowerCase().includes('suppression')).length,
      logins: actions.filter(a => a.action_type?.toLowerCase().includes('connexion')).length,
      last7Days: actions.filter(a => {
        const weekAgo = new Date();
        weekAgo.setDate(weekAgo.getDate() - 7);
        return new Date(a.timestamp) > weekAgo;
      }).length
    };
  }, [actions]);

  // Formatage de date
  const formatDate = (dateString) => {
    const options = { 
      day: '2-digit', 
      month: 'short', 
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    };
    return new Date(dateString).toLocaleDateString('fr-FR', options);
  };

  if (loading && actions.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 mb-4"></div>
        <p className="text-gray-500">Chargement de l'historique...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 bg-white rounded-lg shadow-md">
        <div className="text-center py-10">
          <div className="mx-auto w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-4">
            <svg className="w-8 h-8 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
            </svg>
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">{error}</h3>
          <button 
            onClick={fetchActions}
            className="mt-4 px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 flex items-center mx-auto"
          >
            <FaSync className="mr-2" /> Réessayer
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-md overflow-hidden">
      {/* En-tête avec filtres */}
      <div className="p-6 bg-gray-50 border-b">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="flex items-center">
            <FaUserTie className="text-blue-600 mr-3 text-xl" />
            <div>
              <h2 className="text-xl font-bold text-gray-800">Historique des Actions</h2>
              {lastRefresh && (
                <p className="text-xs text-gray-500">
                  Dernière actualisation: {lastRefresh.toLocaleTimeString()}
                </p>
              )}
            </div>
          </div>
          
          <div className="flex flex-wrap gap-2">
            <button
              onClick={fetchActions}
              className="p-2 bg-white text-gray-700 rounded-md hover:bg-gray-100 border flex items-center"
              title="Actualiser"
            >
              <FaSync className={loading ? 'animate-spin' : ''} />
            </button>
            
            <div className="relative flex-grow md:w-48">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <FaSearch className="text-gray-400" />
              </div>
              <input
                type="text"
                placeholder="Rechercher..."
                className="pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 w-full"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            
            <div className="flex items-center bg-white rounded-md border">
              <FaFilter className="text-gray-500 mx-2" />
              <select
                className="border-none px-2 py-2 rounded-md focus:ring-blue-500 focus:border-blue-500 text-sm"
                value={filterType}
                onChange={(e) => setFilterType(e.target.value)}
              >
                {ACTION_TYPES.map(type => (
                  <option key={type.value} value={type.value}>
                    {type.label}
                  </option>
                ))}
              </select>
            </div>
            
            <div className="flex items-center bg-white rounded-md border">
              <FaUserShield className="text-gray-500 mx-2" />
              <select
                className="border-none px-2 py-2 rounded-md focus:ring-blue-500 focus:border-blue-500 text-sm"
                value={filterRole}
                onChange={(e) => setFilterRole(e.target.value)}
              >
                {USER_ROLES.map(role => (
                  <option key={role.value} value={role.value}>
                    {role.label}
                  </option>
                ))}
              </select>
            </div>
            
            <div className="flex items-center bg-white rounded-md border px-2">
              <FaCalendarAlt className="text-gray-500 mr-2" />
              <DatePicker
                selectsRange={true}
                startDate={startDate}
                endDate={endDate}
                onChange={(update) => setDateRange(update)}
                isClearable={true}
                placeholderText="Filtrer par date"
                className="border-none focus:ring-0 text-sm py-2"
                dateFormat="dd/MM/yyyy"
              />
            </div>
            
            <div className="flex border rounded-md overflow-hidden">
              <button
                onClick={() => setViewMode('table')}
                className={`px-3 py-2 text-sm ${viewMode === 'table' ? 'bg-blue-500 text-white' : 'bg-white text-gray-700'}`}
              >
                Tableau
              </button>
              <button
                onClick={() => setViewMode('cards')}
                className={`px-3 py-2 text-sm ${viewMode === 'cards' ? 'bg-blue-500 text-white' : 'bg-white text-gray-700'}`}
              >
                Cartes
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Statistiques */}
      <div className="px-6 pt-4 grid grid-cols-2 md:grid-cols-6 gap-3">
        <StatCard 
          title="Total" 
          value={stats.total} 
          trend={stats.total > 0 ? ((stats.last7Days / stats.total) * 100).toFixed(0) : 0}
          icon={<FaChartBar className="text-blue-500" />}
          color="blue"
        />
        <StatCard 
          title="Ajouts" 
          value={stats.additions} 
          trend={stats.total > 0 ? ((stats.additions / stats.total) * 100).toFixed(0) : 0}
          icon={<FaUserPlus className="text-green-500" />}
          color="green"
        />
        <StatCard 
          title="Modifs" 
          value={stats.modifications} 
          trend={stats.total > 0 ? ((stats.modifications / stats.total) * 100).toFixed(0) : 0}
          icon={<FaUserEdit className="text-yellow-500" />}
          color="yellow"
        />
        <StatCard 
          title="Suppr." 
          value={stats.deletions} 
          trend={stats.total > 0 ? ((stats.deletions / stats.total) * 100).toFixed(0) : 0}
          icon={<FaTrashAlt className="text-red-500" />}
          color="red"
        />
        <StatCard 
          title="Connexions" 
          value={stats.logins} 
          trend={stats.total > 0 ? ((stats.logins / stats.total) * 100).toFixed(0) : 0}
          icon={<FaSignInAlt className="text-purple-500" />}
          color="purple"
        />
        <StatCard 
          title="7 derniers jours" 
          value={stats.last7Days} 
          trend={stats.total > 0 ? ((stats.last7Days / stats.total) * 100).toFixed(0) : 0}
          icon={<FaCalendarAlt className="text-indigo-500" />}
          color="indigo"
        />
      </div>

      {/* Contenu principal */}
      <div className="p-6">
        {viewMode === 'table' ? (
          <div className="overflow-x-auto rounded-lg border border-gray-200">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Utilisateur</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Rôle</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Action</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Description</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Détails</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredActions.length > 0 ? (
                  filteredActions.map(action => (
                    <tr 
                      key={action.id} 
                      className="hover:bg-gray-50 transition-colors cursor-pointer"
                      onClick={() => setSelectedAction(action)}
                    >
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="flex-shrink-0 h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-medium">
                            {action.username?.charAt(0).toUpperCase()}
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-gray-900">{action.username}</div>
                            <div className="text-xs text-gray-500">{action.email}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                          action.role === 'admin' ? 'bg-purple-100 text-purple-800' :
                          action.role === 'comptable' ? 'bg-blue-100 text-blue-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {action.role?.charAt(0).toUpperCase() + action.role?.slice(1)}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          {ACTION_TYPE_CONFIG[action.action_type]?.icon || ACTION_TYPE_CONFIG.default.icon}
                          <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                            ACTION_TYPE_CONFIG[action.action_type]?.class || ACTION_TYPE_CONFIG.default.class
                          }`}>
                            {action.action_type?.charAt(0).toUpperCase() + action.action_type?.slice(1)}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 max-w-xs">
                        <div className="text-sm text-gray-900 truncate" title={action.description}>
                          {action.description}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-500">
                          {formatDate(action.timestamp)}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {action.details ? (
                          <button 
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedAction(action);
                            }}
                            className="text-blue-500 hover:text-blue-700"
                          >
                            Voir
                          </button>
                        ) : (
                          <span className="text-gray-400">-</span>
                        )}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="6" className="px-6 py-4 text-center text-gray-500">
                      <div className="flex flex-col items-center justify-center py-8">
                        <svg className="w-16 h-16 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1" d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                        </svg>
                        <p className="mt-2 text-sm">
                          {actions.length === 0 ? 
                            "Aucune action disponible" : 
                            "Aucun résultat correspond aux filtres"}
                        </p>
                        <button 
                          onClick={() => {
                            setSearchTerm('');
                            setFilterType('Tous');
                            setFilterRole('Tous');
                            setDateRange([null, null]);
                          }}
                          className="mt-2 text-sm text-blue-500 hover:text-blue-700"
                        >
                          Réinitialiser les filtres
                        </button>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredActions.length > 0 ? (
              filteredActions.map(action => (
                <ActionCard 
                  key={action.id} 
                  action={action} 
                  onClick={() => setSelectedAction(action)}
                  config={ACTION_TYPE_CONFIG}
                />
              ))
            ) : (
              <div className="col-span-full flex flex-col items-center justify-center py-12">
                <svg className="w-16 h-16 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1" d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                </svg>
                <p className="mt-2 text-gray-500">
                  {actions.length === 0 ? 
                    "Aucune action disponible" : 
                    "Aucun résultat correspond aux filtres"}
                </p>
                <button 
                  onClick={() => {
                    setSearchTerm('');
                    setFilterType('Tous');
                    setFilterRole('Tous');
                    setDateRange([null, null]);
                  }}
                  className="mt-2 text-sm text-blue-500 hover:text-blue-700"
                >
                  Réinitialiser les filtres
                </button>
              </div>
            )}
          </div>
        )}

        {/* Pagination */}
        {filteredActions.length > 0 && (
          <div className="mt-4 flex items-center justify-between">
            <div className="text-sm text-gray-500">
              Affichage de <span className="font-medium">1</span> à <span className="font-medium">{filteredActions.length}</span> sur <span className="font-medium">{actions.length}</span> actions
            </div>
            <div className="flex space-x-2">
              <button className="px-3 py-1 border rounded-md text-sm disabled:opacity-50" disabled>
                Précédent
              </button>
              <button className="px-3 py-1 border rounded-md text-sm disabled:opacity-50" disabled>
                Suivant
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Modal de détails */}
      {selectedAction && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-start">
                <h3 className="text-lg font-bold text-gray-900">Détails de l'action</h3>
                <button 
                  onClick={() => setSelectedAction(null)}
                  className="text-gray-400 hover:text-gray-500"
                >
                  <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              
              <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h4 className="text-sm font-medium text-gray-500">Utilisateur</h4>
                  <div className="mt-1 flex items-center">
                    <div className="flex-shrink-0 h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-medium">
                      {selectedAction.username?.charAt(0).toUpperCase()}
                    </div>
                    <div className="ml-4">
                      <p className="text-sm font-medium text-gray-900">{selectedAction.username}</p>
                      <p className="text-sm text-gray-500">{selectedAction.email}</p>
                    </div>
                  </div>
                </div>
                
                <div>
                  <h4 className="text-sm font-medium text-gray-500">Rôle</h4>
                  <p className="mt-1 text-sm text-gray-900">
                    <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                      selectedAction.role === 'admin' ? 'bg-purple-100 text-purple-800' :
                      selectedAction.role === 'comptable' ? 'bg-blue-100 text-blue-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {selectedAction.role?.charAt(0).toUpperCase() + selectedAction.role?.slice(1)}
                    </span>
                  </p>
                </div>
                
                <div>
                  <h4 className="text-sm font-medium text-gray-500">Type d'action</h4>
                  <p className="mt-1 text-sm text-gray-900 flex items-center">
                    {ACTION_TYPE_CONFIG[selectedAction.action_type]?.icon || ACTION_TYPE_CONFIG.default.icon}
                    <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ml-2 ${
                      ACTION_TYPE_CONFIG[selectedAction.action_type]?.class || ACTION_TYPE_CONFIG.default.class
                    }`}>
                      {selectedAction.action_type?.charAt(0).toUpperCase() + selectedAction.action_type?.slice(1)}
                    </span>
                  </p>
                </div>
                
                <div>
                  <h4 className="text-sm font-medium text-gray-500">Date</h4>
                  <p className="mt-1 text-sm text-gray-900">
                    {formatDate(selectedAction.timestamp)}
                  </p>
                </div>
                
                <div className="md:col-span-2">
                  <h4 className="text-sm font-medium text-gray-500">Description</h4>
                  <p className="mt-1 text-sm text-gray-900">
                    {selectedAction.description || 'Aucune description disponible'}
                  </p>
                </div>
                
                {selectedAction.details && (
                  <div className="md:col-span-2">
                    <h4 className="text-sm font-medium text-gray-500">Détails techniques</h4>
                    <pre className="mt-1 p-3 bg-gray-50 rounded-md text-sm text-gray-900 whitespace-pre-wrap overflow-x-auto">
                      {JSON.stringify(selectedAction.details, null, 2)}
                    </pre>
                  </div>
                )}
              </div>
              
              <div className="mt-6 flex justify-end">
                <button
                  type="button"
                  onClick={() => setSelectedAction(null)}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  Fermer
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// Composant StatCard amélioré
const StatCard = ({ title, value, trend, icon, color }) => {
  const colorClasses = {
    blue: 'bg-blue-50 border-blue-200 text-blue-800',
    green: 'bg-green-50 border-green-200 text-green-800',
    yellow: 'bg-yellow-50 border-yellow-200 text-yellow-800',
    red: 'bg-red-50 border-red-200 text-red-800',
    purple: 'bg-purple-50 border-purple-200 text-purple-800',
    indigo: 'bg-indigo-50 border-indigo-200 text-indigo-800'
  };

  return (
    <div className={`p-3 rounded-lg border ${colorClasses[color]} flex items-center`}>
      <div className="p-2 rounded-full bg-white mr-3 shadow-sm">
        {icon}
      </div>
      <div>
        <h3 className="text-xs font-medium">{title}</h3>
        <div className="flex items-baseline">
          <p className="text-xl font-bold mr-2">{value}</p>
          {trend > 0 && (
            <span className="text-xs font-medium">
              ({trend}%)
            </span>
          )}
        </div>
      </div>
    </div>
  );
};

// Composant ActionCard pour la vue en cartes
const ActionCard = ({ action, onClick, config }) => {
  const actionConfig = config[action.action_type] || config.default;
  
  return (
    <div 
      className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow cursor-pointer"
      onClick={onClick}
    >
      <div className="flex justify-between items-start">
        <div>
          <div className="flex items-center">
            <div className="flex-shrink-0 h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-medium text-sm">
              {action.username?.charAt(0).toUpperCase()}
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-900">{action.username}</p>
              <p className="text-xs text-gray-500">{action.email}</p>
            </div>
          </div>
          
          <div className="mt-3 flex items-center">
            {actionConfig.icon}
            <span className={`px-2 py-1 text-xs font-semibold rounded-full ${actionConfig.class}`}>
              {action.action_type?.charAt(0).toUpperCase() + action.action_type?.slice(1)}
            </span>
          </div>
          
          <p className="mt-2 text-sm text-gray-600 line-clamp-2">
            {action.description}
          </p>
        </div>
        
        <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
          action.role === 'admin' ? 'bg-purple-100 text-purple-800' :
          action.role === 'comptable' ? 'bg-blue-100 text-blue-800' :
          'bg-gray-100 text-gray-800'
        }`}>
          {action.role?.charAt(0).toUpperCase() + action.role?.slice(1)}
        </span>
      </div>
      
      <div className="mt-4 flex justify-between items-center">
        <p className="text-xs text-gray-500">
          {new Date(action.timestamp).toLocaleDateString('fr-FR', {
            day: '2-digit',
            month: 'short',
            year: 'numeric'
          })}
        </p>
        {action.details && (
          <button 
            onClick={(e) => {
              e.stopPropagation();
              onClick();
            }}
            className="text-xs text-blue-500 hover:text-blue-700"
          >
            Voir détails
          </button>
        )}
      </div>
    </div>
  );
};

export default AdminActionsList;
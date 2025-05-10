import React, { useState, useEffect, useMemo } from 'react';
import axios from 'axios';
import { FaUserTie, FaSearch, FaFilter, FaSync } from 'react-icons/fa';
import { toast } from 'react-toastify';

const AdminActionsList = () => {
  const [actions, setActions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('Tous');
  const [filterRole, setFilterRole] = useState('Tous');
  const [lastRefresh, setLastRefresh] = useState(null);

  // Configurations (à remplacer par un appel API si dynamique)
  const ACTION_TYPES = useMemo(() => [
    'Tous',
    'ajout',
    'modification',
    'suppression',
    'consultation',
    'connexion',
    'deconnexion'
  ], []);

  const USER_ROLES = useMemo(() => [
    'Tous',
    'admin',
    'comptable',
    'directeur',
    
  ], []);

  // Classes de type d'action
  const ACTION_TYPE_CLASSES = useMemo(() => ({
    'Ajout': 'bg-green-100 text-green-800',
    'Modification': 'bg-yellow-100 text-yellow-800',
    'Suppression': 'bg-red-100 text-red-800',
    'Consultation': 'bg-blue-100 text-blue-800',
    'Connexion': 'bg-purple-100 text-purple-800',
    'Déconnexion': 'bg-gray-100 text-gray-800'
  }), []);

  // Charger les actions
  const fetchActions = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await axios.get('http://127.0.0.1:8000/api/actions/', {
        params: {
          cacheBuster: Date.now() // Evite le cache
        }
      });
      setActions(response.data.actions);
      console.log(actions.map(a => a.action_type));  // <== ici

      setLastRefresh(new Date());
    } catch (err) {
      console.error("Erreur de chargement:", err);
      setError("Échec du chargement des actions");
      toast.error("Erreur lors du chargement des actions");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchActions();
  }, []);

  // Filtrage optimisé avec useMemo
  const filteredActions = useMemo(() => {
    const term = searchTerm.toLowerCase();
    return actions.filter(action => {
      const matchesSearch = 
        (action.description?.toLowerCase().includes(term)) || 
        (action.audit?.toLowerCase().includes(term)) ||
        (action.username?.toLowerCase().includes(term));
      
      const matchesType = filterType === 'Tous' || action.action_type === filterType;
      const matchesRole = filterRole === 'Tous' || action.role === filterRole;
      
      return matchesSearch && matchesType && matchesRole;
    });
  }, [actions, searchTerm, filterType, filterRole]);

  const getActionClass = (actionType) => {
    if (!actionType) return 'bg-gray-100 text-gray-800';
    const typeKey = Object.keys(ACTION_TYPE_CLASSES).find(
      type => actionType.includes(type)
    );
    return ACTION_TYPE_CLASSES[typeKey] || 'bg-gray-100 text-gray-800';
  };

  // Statistiques calculées une seule fois
  const stats = useMemo(() => {
    const normalize = (str) => (str || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  
    return {
      total: actions.length,
      additions: actions.filter(a => normalize(a.action_type).includes('ajout')).length,
      modifications: actions.filter(a => normalize(a.action_type).includes('modification')).length,
      deletions: actions.filter(a => normalize(a.action_type).includes('suppression')).length,
      logins: actions.filter(a => normalize(a.action_type).includes('connexion')).length
    };
  }, [actions]);
  

  if (loading && actions.length === 0) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 bg-white rounded-lg shadow">
        <div className="text-red-500 text-center py-10">
          {error}
          <button 
            onClick={fetchActions}
            className="mt-4 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 flex items-center mx-auto"
          >
            <FaSync className="mr-2" /> Réessayer
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 bg-white rounded-lg shadow">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6">
        <h2 className="text-xl font-bold text-gray-800 flex items-center">
          <FaUserTie className="mr-2 text-blue-600" />
          Historique des Actions
          {lastRefresh && (
            <span className="text-xs text-gray-500 ml-3">
              Dernière actualisation: {lastRefresh.toLocaleTimeString()}
            </span>
          )}
        </h2>
        
        <div className="flex flex-col md:flex-row gap-4 mt-4 md:mt-0">
          <button
            onClick={fetchActions}
            className="px-3 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 flex items-center"
            title="Actualiser"
          >
            <FaSync />
          </button>
          
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <FaSearch className="text-gray-400" />
            </div>
            <input
              type="text"
              placeholder="Rechercher..."
              className="pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 w-full md:w-64"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          
          <div className="flex items-center">
            <FaFilter className="text-gray-500 mr-2" />
            <select
              className="border border-gray-300 rounded-md px-3 py-2 focus:ring-blue-500 focus:border-blue-500"
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
            >
              {ACTION_TYPES.map(type => (
                <option key={type} value={type}>{type}</option>
              ))}
            </select>
          </div>
          
          <div className="flex items-center">
            <FaFilter className="text-gray-500 mr-2" />
            <select
              className="border border-gray-300 rounded-md px-3 py-2 focus:ring-blue-500 focus:border-blue-500"
              value={filterRole}
              onChange={(e) => setFilterRole(e.target.value)}
            >
              {USER_ROLES.map(role => (
                <option key={role} value={role}>
                  {role === 'Tous' ? role : role.charAt(0).toUpperCase() + role.slice(1)}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      <div className="overflow-x-auto">
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
                <tr key={action.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">{action.username}</div>
                    <div className="text-xs text-gray-500">{action.email}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="px-2 py-1 text-xs font-medium rounded-full bg-gray-100 text-gray-800">
                      {action.role?.charAt(0).toUpperCase() + action.role?.slice(1)}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getActionClass(action.action_type)}`}>
                      {action.action_type}
                    </span>
                  </td>
                  <td className="px-6 py-4 max-w-xs">
                    <div className="text-sm text-gray-900 truncate" title={action.description}>
                      {action.description}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-500">
                      {new Date(action.timestamp).toLocaleString()}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {action.details ? (
                      <button 
                        onClick={() => toast.info(
                          <div>
                            <h3 className="font-bold mb-2">Détails complets</h3>
                            <pre className="whitespace-pre-wrap">{action.details}</pre>
                          </div>,
                          {autoClose: false}
                        )} 
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
                  {actions.length === 0 ? 
                    "Aucune action disponible" : 
                    "Aucun résultat correspond aux filtres"}
                  <button 
                    onClick={() => {
                      setSearchTerm('');
                      setFilterType('Tous');
                      setFilterRole('Tous');
                    }}
                    className="text-blue-500 hover:text-blue-700 ml-2"
                  >
                    Réinitialiser les filtres
                  </button>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Statistiques améliorées */}
      <div className="mt-8 grid grid-cols-1 md:grid-cols-5 gap-4">
        <StatCard 
          title="Total" 
          value={stats.total} 
          color="blue" 
          icon="📊"
        />
        <StatCard 
          title="Ajouts" 
          value={stats.additions} 
          color="green" 
          icon="➕"
        />
        <StatCard 
          title="Modifications" 
          value={stats.modifications} 
          color="yellow" 
          icon="✏️"
        />
        <StatCard 
          title="Suppressions" 
          value={stats.deletions} 
          color="red" 
          icon="🗑️"
        />
        <StatCard 
          title="Connexions" 
          value={stats.logins} 
          color="purple" 
          icon="🔑"
        />
      </div>
    </div>
  );
};

// Composant StatCard pour les statistiques
const StatCard = ({ title, value, color, icon }) => {
  const colorClasses = {
    blue: 'bg-blue-50 border-blue-500',
    green: 'bg-green-50 border-green-500',
    yellow: 'bg-yellow-50 border-yellow-500',
    red: 'bg-red-50 border-red-500',
    purple: 'bg-purple-50 border-purple-500'
  };

  return (
    <div className={`p-4 rounded-lg border-l-4 ${colorClasses[color]}`}>
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-sm font-medium text-gray-500">{title}</h3>
          <p className="text-2xl font-bold">{value}</p>
        </div>
        <span className="text-2xl">{icon}</span>
      </div>
    </div>
  );
};

export default AdminActionsList;
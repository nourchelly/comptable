import React, { useState, useEffect } from 'react';
import axios from 'axios';
import {
  FaEye,
  FaEdit,
  FaTrash,
  FaFilePdf,
  FaFileExcel,
  FaSync,
  FaSearch,
  FaFilter,
  FaTimes
} from 'react-icons/fa';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

// Define STATUS_CONFIG object to replace statusColors and statusLabels
const STATUS_CONFIG = {
  complet: {
    color: 'bg-green-100 text-green-800',
    label: 'Payée'
  },
  incomplet: {
    color: 'bg-yellow-100 text-yellow-800',
    label: 'Non payée'
  },
  anomalie: {
    color: 'bg-red-100 text-red-800',
    label: 'Anomalies'
  },
  default: {
    color: 'bg-gray-100 text-gray-800',
    label: 'Inconnu'
  }
};

const RapportAdmin = ({ onSelectRapport }) => {
  const [rapports, setRapports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filters, setFilters] = useState({
    statut: '',
    search: ''
  });

  // Fonction pour charger les rapports
  const fetchRapports = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (filters.statut) params.append('statut', filters.statut);
      
      const response = await axios.get(`http://localhost:5000/api/rapports?${params.toString()}`);
      
      // Normalisation des données pour gérer différents formats de réponse
      const data = response.data.success 
        ? (response.data.data || []) 
        : [];
      
      setRapports(Array.isArray(data) ? data : []);
      setError(null);
    } catch (err) {
      console.error('Erreur de chargement:', err);
      setError(err.response?.data?.message || 'Erreur lors du chargement des rapports');
      setRapports([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRapports();
  }, [filters.statut]);

  // Fonction pour extraire le numéro de facture
  const getFactureNumero = (rapport) => {
    if (!rapport) return 'N/A';
    return rapport.facture?.numero || rapport.facture_numero || 'N/A';
  };

  // Fonction pour extraire le numéro de banque
  const getBanqueNumero = (rapport) => {
    if (!rapport) return 'N/A';
    return rapport.banque?.numero || rapport.banque_numero || 'N/A';
  };

  // Fonction pour formater la date
  const formatDate = (dateString) => {
    try {
      if (!dateString) return 'Date inconnue';
      const options = { day: '2-digit', month: '2-digit', year: 'numeric' };
      return new Date(dateString).toLocaleDateString('fr-FR', options);
    } catch {
      return 'Date invalide';
    }
  };

  // Fonction pour gérer le changement de filtre
  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Fonction pour réinitialiser tous les filtres
  const resetFilters = () => {
    setFilters({
      statut: '',
      search: ''
    });
    toast.info('Filtres réinitialisés');
  };

  // Fonction spécifique pour annuler la recherche
  const clearSearch = () => {
    setFilters(prev => ({
      ...prev,
      search: ''
    }));
    toast.info('Recherche annulée');
  };

  // Filtrage des rapports
  const filteredRapports = rapports.filter(rapport => {
    if (!rapport) return false;
    
    const searchTerm = filters.search.toLowerCase();
    const matchesSearch = !filters.search || (
      (rapport.titre || '').toLowerCase().includes(searchTerm) ||
      getFactureNumero(rapport).toLowerCase().includes(searchTerm) ||
      getBanqueNumero(rapport).toLowerCase().includes(searchTerm)
    );
    
    const matchesStatus = !filters.statut || rapport.statut === filters.statut;
    
    return matchesSearch && matchesStatus;
  });

  // Vérifier si des filtres sont actifs
  const hasActiveFilters = filters.statut !== '' || filters.search !== '';

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <ToastContainer position="top-right" autoClose={3000} />
      
      <div className="max-w-7xl mx-auto">
        {/* En-tête */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6">
          <h1 className="text-2xl font-bold text-gray-800 flex items-center">
            <span className="bg-indigo-100 text-indigo-800 p-2 rounded-lg mr-3">
              <FaFilePdf />
            </span>
            Rapports de rapprochement
          </h1>
          <div className="flex space-x-2 mt-4 md:mt-0">
            {filters.search && (
              <button
                onClick={clearSearch}
                className="flex items-center px-4 py-2 bg-blue-50 border border-blue-300 rounded-lg shadow-sm text-sm font-medium text-blue-700 hover:bg-blue-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <FaTimes className="mr-2" />
                Annuler la recherche
              </button>
            )}
            {hasActiveFilters && (
              <button
                onClick={resetFilters}
                className="flex items-center px-4 py-2 bg-red-50 border border-red-300 rounded-lg shadow-sm text-sm font-medium text-red-700 hover:bg-red-100 focus:outline-none focus:ring-2 focus:ring-red-500"
              >
                <FaTimes className="mr-2" />
                Annuler tous les filtres
              </button>
            )}
            <button
              onClick={fetchRapports}
              className="flex items-center px-4 py-2 bg-white border border-gray-300 rounded-lg shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <FaSync className="mr-2" />
              Actualiser
            </button>
          </div>
        </div>

        

        {/* Indicateur de filtres actifs */}
        {hasActiveFilters && (
          <div className="flex items-center bg-blue-50 p-3 rounded-lg mb-6 border border-blue-200">
            <div className="text-blue-700 mr-2">
              <FaFilter />
            </div>
            <span className="text-blue-700 text-sm font-medium">
              Filtres actifs: {' '}
              {filters.statut && <span className="mr-2">Statut: {STATUS_CONFIG[filters.statut].label}</span>}
              {filters.search && <span>Recherche: "{filters.search}"</span>}
            </span>
            <button
              onClick={resetFilters}
              className="ml-auto text-sm text-blue-700 hover:text-blue-900"
            >
              Réinitialiser
            </button>
          </div>
        )}

        {/* Message d'erreur */}
        {error && (
          <div className="bg-red-50 border-l-4 border-red-500 p-4 mb-6">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-red-500" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm text-red-700">{error}</p>
              </div>
            </div>
          </div>
        )}

        {/* Tableau des rapports */}
        <div className="bg-white shadow-sm rounded-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Facture
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Banque
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Date
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Statut
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Anomalies
                  </th>
                 
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {loading ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-4 text-center">
                      <div className="flex justify-center items-center">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
                      </div>
                    </td>
                  </tr>
                ) : filteredRapports.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-4 text-center text-gray-500">
                      Aucun rapport trouvé
                    </td>
                  </tr>
                ) : (
                  filteredRapports.map((rapport) => {
                    const status = STATUS_CONFIG[rapport.statut] || STATUS_CONFIG.default;
                    
                    return (
                      <tr key={rapport.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">
                            {getFactureNumero(rapport)}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">
                            {getBanqueNumero(rapport)}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-500">
                            {formatDate(rapport.date_generation)}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${status.color}`}>
                            {status.label}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {rapport.anomalies_count > 0 ? (
                            <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-red-100 text-red-800">
                              {rapport.anomalies_count} anomalie(s)
                            </span>
                          ) : (
                            <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                              Aucune
                            </span>
                          )}
                        </td>
                       
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Stats */}
        {!loading && filteredRapports.length > 0 && (
          <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-white p-4 rounded-lg shadow-sm border-l-4 border-green-500">
              <div className="text-sm font-medium text-gray-500">Complets</div>
              <div className="mt-1 text-2xl font-semibold text-gray-900">
                {filteredRapports.filter(r => r.statut === 'complet').length}
              </div>
            </div>
            <div className="bg-white p-4 rounded-lg shadow-sm border-l-4 border-yellow-500">
              <div className="text-sm font-medium text-gray-500">Incomplets</div>
              <div className="mt-1 text-2xl font-semibold text-gray-900">
                {filteredRapports.filter(r => r.statut === 'incomplet').length}
              </div>
            </div>
            <div className="bg-white p-4 rounded-lg shadow-sm border-l-4 border-red-500">
              <div className="text-sm font-medium text-gray-500">Avec anomalies</div>
              <div className="mt-1 text-2xl font-semibold text-gray-900">
                {filteredRapports.filter(r => r.statut === 'anomalie').length}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default RapportAdmin;
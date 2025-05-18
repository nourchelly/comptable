import React, { useState, useEffect, useMemo } from 'react';
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
  FaPlus,
  FaDownload,
  FaInfoCircle,
  FaCheckCircle,
FaTimesCircle} from 'react-icons/fa';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { useNavigate } from 'react-router-dom';

const STATUS_CONFIG = {
  complet: {
    color: 'bg-green-100 text-green-800',
    label: 'Payée',
    icon: '✅'
  },
  incomplet: {
    color: 'bg-yellow-100 text-yellow-800',
    label: 'Non payée',
    icon: '⚠️'
  },
  anomalie: {
    color: 'bg-red-100 text-red-800',
    label: 'Anomalies',
    icon: '❌'
  },
  default: {
    color: 'bg-gray-100 text-gray-800',
    label: 'Inconnu',
    icon: '❓'
  }
};

const RapportsList = ({ onSelectRapport }) => {
  const navigate = useNavigate();
  const [rapports, setRapports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filters, setFilters] = useState({
    statut: '',
    search: '',
    dateDebut: '',
    dateFin: ''
  });
  const [selectedRapport, setSelectedRapport] = useState(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);

  // Charger les rapports
  const fetchRapports = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (filters.statut) params.append('statut', filters.statut);
      if (filters.dateDebut) params.append('dateDebut', filters.dateDebut);
      if (filters.dateFin) params.append('dateFin', filters.dateFin);
      
      const response = await axios.get(`http://localhost:5000/api/rapports?${params.toString()}`);
      
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
  }, [filters.statut, filters.dateDebut, filters.dateFin]);

  // Gestion des actions
  const handleDeleteRapport = async (rapportId) => {
    if (window.confirm('Êtes-vous sûr de vouloir supprimer ce rapport ?')) {
      try {
        await axios.delete(`http://localhost:5000/api/rapports/${rapportId}`);
        fetchRapports();
        toast.success('Rapport supprimé avec succès');
      } catch (err) {
        console.error('Erreur lors de la suppression:', err);
        toast.error('Erreur lors de la suppression du rapport');
      }
    }
  };

  const handleExport = async (rapportId, type) => {
    try {
      const endpoint = `http://localhost:5000/api/rapports/${rapportId}/${type}`;
      const response = await axios.get(endpoint, { responseType: 'blob' });
      
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `rapport-${rapportId}-${new Date().toISOString().slice(0,10)}.${type}`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      
      toast.success(`Export ${type.toUpperCase()} généré avec succès`);
    } catch (err) {
      console.error(`Erreur d'export ${type}:`, err);
      toast.error(`Erreur lors de l'export ${type}`);
    }
  };

  // Fonctions utilitaires
  const getFactureNumero = (rapport) => rapport?.facture?.numero || rapport?.facture_numero || 'N/A';
  const getBanqueNumero = (rapport) => rapport?.banque?.numero || rapport?.banque_numero || 'N/A';

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    try {
      return new Date(dateString).toLocaleDateString('fr-FR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
      });
    } catch {
      return 'Date invalide';
    }
  };

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters(prev => ({ ...prev, [name]: value }));
  };

  // Filtrage et tri optimisés
  const filteredRapports = useMemo(() => {
    const searchTerm = filters.search.toLowerCase();
    
    return rapports.filter(rapport => {
      if (!rapport) return false;
      
      const matchesSearch = (
        (rapport.titre || '').toLowerCase().includes(searchTerm) ||
        getFactureNumero(rapport).toLowerCase().includes(searchTerm) ||
        getBanqueNumero(rapport).toLowerCase().includes(searchTerm)
      );
      
      const matchesStatus = !filters.statut || rapport.statut === filters.statut;
      
      return matchesSearch && matchesStatus;
    });
  }, [rapports, filters.search, filters.statut]);

  // Statistiques
  const stats = useMemo(() => {
    return {
      complet: filteredRapports.filter(r => r.statut === 'complet').length,
      incomplet: filteredRapports.filter(r => r.statut === 'incomplet').length,
      anomalie: filteredRapports.filter(r => r.statut === 'anomalie').length,
      total: filteredRapports.length
    };
  }, [filteredRapports]);

  // Ouvrir les détails d'un rapport
  const openDetails = (rapport) => {
    setSelectedRapport(rapport);
    setShowDetailsModal(true);
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-6">
      <ToastContainer position="top-right" autoClose={3000} />
      
      <div className="max-w-7xl mx-auto">
        {/* En-tête */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
          <div className="flex items-center">
            <div className="bg-indigo-100 text-indigo-800 p-3 rounded-lg mr-4">
              <FaFilePdf className="text-xl" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-800">Rapports de rapprochement</h1>
              <p className="text-sm text-gray-500">
                {stats.total} {stats.total > 1 ? 'rapports trouvés' : 'rapport trouvé'}
              </p>
            </div>
          </div>
          
          <div className="flex flex-wrap gap-2">
           
            <button
              onClick={fetchRapports}
              className="flex items-center px-4 py-2 bg-white border border-gray-300 rounded-lg shadow-sm hover:bg-gray-50"
            >
              <FaSync className={`mr-2 ${loading ? 'animate-spin' : ''}`} />
              Actualiser
            </button>
          </div>
        </div>

        {/* Filtres */}
        <div className="bg-white p-4 rounded-lg shadow-sm mb-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <FaSearch className="text-gray-400" />
              </div>
              <input
                type="text"
                name="search"
                placeholder="Rechercher..."
                className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                value={filters.search}
                onChange={handleFilterChange}
              />
            </div>
            
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <FaFilter className="text-gray-400" />
              </div>
              <select
                name="statut"
                className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                value={filters.statut}
                onChange={handleFilterChange}
              >
                <option value="">Tous les statuts</option>
                {Object.entries(STATUS_CONFIG).map(([key, {label}]) => (
                  <option key={key} value={key}>{label}</option>
                ))}
              </select>
            </div>

           

            
          </div>
        </div>

        {/* Statistiques */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <StatCard 
            title="Complets" 
            value={stats.complet} 
            color="green" 
            icon={<FaCheckCircle className="text-green-500" />}
          />
          <StatCard 
            title="Incomplets" 
            value={stats.incomplet} 
            color="yellow" 
            icon={<FaInfoCircle className="text-yellow-500" />}
          />
          <StatCard 
            title="Anomalies" 
            value={stats.anomalie} 
            color="red" 
            icon={<FaInfoCircle className="text-red-500" />}
          />
          <StatCard 
            title="Total" 
            value={stats.total} 
            color="indigo" 
            icon={<FaFilePdf className="text-indigo-500" />}
          />
        </div>

        {/* Tableau des rapports */}
        <div className="bg-white shadow-sm rounded-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Facture
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Banque
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Date
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Statut
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Anomalies
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {loading ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-8 text-center">
                      <div className="flex justify-center">
                        <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-indigo-500"></div>
                      </div>
                    </td>
                  </tr>
                ) : filteredRapports.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-6 text-center text-gray-500">
                      <div className="flex flex-col items-center justify-center">
                        <FaFilePdf className="text-gray-400 text-3xl mb-2" />
                        <span>Aucun rapport trouvé</span>
                        {filters.statut || filters.search ? (
                          <button
                            onClick={() => setFilters({
                              statut: '',
                              search: '',
                              dateDebut: '',
                              dateFin: ''
                            })}
                            className="mt-2 text-sm text-indigo-600 hover:text-indigo-800"
                          >
                            Réinitialiser les filtres
                          </button>
                        ) : null}
                      </div>
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
                            {status.icon} {status.label}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                            rapport.anomalies_count > 0 ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'
                          }`}>
                            {rapport.anomalies_count > 0 ? `${rapport.anomalies_count} anomalie(s)` : 'Aucune'}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <div className="flex justify-end space-x-2">
                            <ActionButton 
                              icon={<FaEye />} 
                              color="text-indigo-600 hover:text-indigo-900" 
                              onClick={() => openDetails(rapport)}
                              tooltip="Voir détails"
                            />
                            <ActionButton 
                              icon={<FaEdit />} 
                              color="text-blue-600 hover:text-blue-900" 
                              onClick={() => navigate(`/dashboardcomptable/modif_rapport/${rapport.id}`)}
                              tooltip="Modifier"
                            />
                            <ActionButton 
                              icon={<FaTrash />} 
                              color="text-red-600 hover:text-red-900" 
                              onClick={() => handleDeleteRapport(rapport.id)}
                              tooltip="Supprimer"
                            />
                            <ActionButton 
                              icon={<FaFilePdf />} 
                              color="text-red-500 hover:text-red-700" 
                              onClick={() => handleExport(rapport.id, 'pdf')}
                              tooltip="Export PDF"
                            />
                            <ActionButton 
                              icon={<FaFileExcel />} 
                              color="text-green-600 hover:text-green-800" 
                              onClick={() => handleExport(rapport.id, 'excel')}
                              tooltip="Export Excel"
                            />
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Modal de détails */}
      {showDetailsModal && selectedRapport && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center border-b p-4">
              <h3 className="text-lg font-semibold text-gray-800">Détails du rapport</h3>
              <button 
                onClick={() => setShowDetailsModal(false)} 
                className="text-gray-400 hover:text-gray-600"
              >
                <FaTimesCircle className="text-xl" />
              </button>
            </div>
            
            <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h4 className="text-sm font-medium text-gray-500 mb-3">Informations générales</h4>
                <DetailItem label="Numéro de facture" value={getFactureNumero(selectedRapport)} />
                <DetailItem label="Numéro de banque" value={getBanqueNumero(selectedRapport)} />
                <DetailItem label="Date de génération" value={formatDate(selectedRapport.date_generation)} />
                <DetailItem label="Statut" value={
                  <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                    STATUS_CONFIG[selectedRapport.statut]?.color || STATUS_CONFIG.default.color
                  }`}>
                    {STATUS_CONFIG[selectedRapport.statut]?.label || STATUS_CONFIG.default.label}
                  </span>
                } />
              </div>
              
              <div>
                <h4 className="text-sm font-medium text-gray-500 mb-3">Anomalies</h4>
                {selectedRapport.anomalies_count > 0 ? (
                  <div className="bg-red-50 p-3 rounded-lg">
                    <p className="text-sm text-red-800">
                      {selectedRapport.anomalies_count} anomalie(s) détectée(s)
                    </p>
                    {selectedRapport.anomalies_details && (
                      <pre className="mt-2 text-xs text-red-600 whitespace-pre-wrap">
                        {selectedRapport.anomalies_details}
                      </pre>
                    )}
                  </div>
                ) : (
                  <div className="bg-green-50 p-3 rounded-lg">
                    <p className="text-sm text-green-800">Aucune anomalie détectée</p>
                  </div>
                )}
              </div>
              
              <div className="md:col-span-2">
                <h4 className="text-sm font-medium text-gray-500 mb-3">Actions</h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <button
                    onClick={() => {
                      setShowDetailsModal(false);
                      navigate(`/dashboardcomptable/modif_rapport/${selectedRapport.id}`);
                    }}
                    className="flex items-center justify-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                  >
                    <FaEdit className="mr-2" />
                    Modifier
                  </button>
                  <button
                    onClick={() => handleExport(selectedRapport.id, 'pdf')}
                    className="flex items-center justify-center px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
                  >
                    <FaFilePdf className="mr-2" />
                    Export PDF
                  </button>
                  <button
                    onClick={() => handleExport(selectedRapport.id, 'excel')}
                    className="flex items-center justify-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                  >
                    <FaFileExcel className="mr-2" />
                    Export Excel
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// Composants utilitaires
const StatCard = ({ title, value, color, icon }) => {
  const colorClasses = {
    green: 'bg-green-50 border-green-200 text-green-800',
    yellow: 'bg-yellow-50 border-yellow-200 text-yellow-800',
    red: 'bg-red-50 border-red-200 text-red-800',
    indigo: 'bg-indigo-50 border-indigo-200 text-indigo-800'
  };

  return (
    <div className={`p-4 rounded-lg border-l-4 ${colorClasses[color]}`}>
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-medium">{title}</h3>
          <p className="text-2xl font-bold">{value}</p>
        </div>
        <div className="text-2xl">
          {icon}
        </div>
      </div>
    </div>
  );
};

const ActionButton = ({ icon, color, onClick, tooltip }) => (
  <button
    onClick={onClick}
    className={`p-2 rounded-lg hover:bg-gray-100 ${color}`}
    title={tooltip}
  >
    {icon}
  </button>
);

const DetailItem = ({ label, value }) => (
  <div className="mb-3">
    <p className="text-xs text-gray-500">{label}</p>
    <p className="text-sm font-medium text-gray-900">
      {typeof value === 'string' || typeof value === 'number' ? value : value}
    </p>
  </div>
);

export default RapportsList;
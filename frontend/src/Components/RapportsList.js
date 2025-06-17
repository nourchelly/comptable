import React, { useState, useEffect, useMemo,useCallback } from 'react';
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
  FaChevronDown,
  FaChevronUp,
  FaTimesCircle,
  FaCheckCircle,
  FaSpinner,FaSave,FaTimes,FaExclamationTriangle
} from 'react-icons/fa';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { useNavigate } from 'react-router-dom';
import AnomalyCorrection from './AnomalyCorrection'; // Assurez-vous que ce chemin est correct
// Configuration des statuts pour la cohérence de l'affichage
const STATUS_CONFIG = {
  complet: {
    color: 'bg-green-100 text-green-800',
    label: 'Rapproché',
    icon: '✅'
  },
  incomplet: {
    color: 'bg-yellow-100 text-yellow-800',
    label: 'En attente',
    icon: '⏳'
  },
  anomalie: {
    color: 'bg-red-100 text-red-800',
    label: 'Anomalies',
    icon: '❌'
  },
  Validé: {
    color: 'bg-blue-100 text-blue-800',
    label: 'Validé',
    icon: '✔️'
  },
  Ajusté: {
    color: 'bg-purple-100 text-purple-800',
    label: 'Ajusté',
    icon: '✏️'
  },
  default: {
    color: 'bg-gray-100 text-gray-800',
    label: 'Inconnu',
    icon: '❓'
  }
};

const TableSection = ({ title, data, columns, expandable = false }) => {
  const [expanded, setExpanded] = useState(false);

  if (!data || data.length === 0) {
    return (
      <div className="mb-6">
        <h4 className="text-sm font-medium text-gray-500 mb-3">{title}</h4>
        <p className="text-sm text-gray-500">Aucune donnée disponible</p>
      </div>
    );
  }

  return (
    <div className="mb-6 border border-gray-200 rounded-lg p-4 bg-white shadow-sm">
      <div className="flex justify-between items-center mb-3">
        <h4 className="text-sm font-medium text-gray-700">{title}</h4>
        {expandable && (
          <button
            onClick={() => setExpanded(!expanded)}
            className="text-gray-500 hover:text-gray-700 p-1 -mr-1 rounded-full hover:bg-gray-100 transition-colors"
            title={expanded ? "Réduire" : "Développer"}
          >
            {expanded ? <FaChevronUp /> : <FaChevronDown />}
          </button>
        )}
      </div>

      <div className={`overflow-x-auto ${expandable && !expanded ? 'max-h-40 overflow-y-hidden' : ''}`}>
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              {columns.map((column, index) => (
                <th
                  key={index}
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  {column.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {data.map((item, rowIndex) => (
              <tr key={rowIndex}>
                {columns.map((column, colIndex) => (
                  <td key={colIndex} className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {typeof column.accessor === 'function' ? column.accessor(item) : item[column.accessor]}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

const RapportsList = () => {
  const navigate = useNavigate();
  const [rapports, setRapports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    statut: '',
    search: '',
    dateDebut: '',
    dateFin: ''
  });
  const [selectedRapportDetails, setSelectedRapportDetails] = useState(null);
  const [loadingDetails, setLoadingDetails] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [showDeleteConfirmModal, setShowDeleteConfirmModal] = useState(false);
  const [rapportToDelete, setRapportToDelete] = useState(null);
  const [showAdjustModal, setShowAdjustModal] = useState(false);
  const [currentAdjustRapport, setCurrentAdjustRapport] = useState(null);
  const [adjustments, setAdjustments] = useState({
    corrections: [],
    comments: ''
  });

  const API_BASE_URL = 'http://localhost:5000/api';

  // Fonction pour charger les rapports
  const fetchRapports = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (filters.statut) params.append('statut', filters.statut);
      if (filters.dateDebut) params.append('start_date', filters.dateDebut);
      if (filters.dateFin) params.append('end_date', filters.dateFin);

      const response = await axios.get(`${API_BASE_URL}/rapports?${params.toString()}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
        },
        withCredentials: true
      });

      const data = response.data.success ? response.data.data || [] : [];
      setRapports(Array.isArray(data) ? data.map(r => ({
        ...r,
        loadingValidation: false,
        loadingAdjustment: false
      })) : []);
    } catch (err) {
      console.error('Erreur de chargement des rapports:', err);
      toast.error(err.response?.data?.error || 'Erreur lors du chargement des rapports.');
      setRapports([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRapports();
  }, [filters.statut, filters.dateDebut, filters.dateFin]);

  // Fonction pour charger les détails d'un rapport
  const fetchRapportDetails = async (rapportId) => {
    setLoadingDetails(true);
    setSelectedRapportDetails(null);
    try {
      const response = await axios.get(`${API_BASE_URL}/rapports/${rapportId}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
        },
        withCredentials: true
      });
      setSelectedRapportDetails(response.data);
      setShowDetailsModal(true);
    } catch (err) {
      console.error('Erreur de chargement des détails:', err);
      toast.error(err.response?.data?.error || 'Erreur lors du chargement des détails du rapport.');
    } finally {
      setLoadingDetails(false);
    }
  };

  // Fonction pour valider un rapport
  const handleValidateRapport = async (rapportId) => {
    // Optimistic UI update: Set loading state
    setRapports(prev => prev.map(r => 
      r.id === rapportId ? { ...r, loadingValidation: true } : r
    ));

    try {
      const response = await axios.post(
        `${API_BASE_URL}/rapports/${rapportId}/validate`,
        {},
        {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
          },
          withCredentials: true
        }
      );

      if (response.status === 200) {
        toast.success('Rapport validé avec succès');
        
        // Utiliser exactement la valeur retournée par le backend
        const updatedRapport = response.data.data;
        
        setRapports(prev => prev.map(r => 
          r.id === rapportId ? { 
            ...r, 
            statut: updatedRapport.statut,  // Utiliser la valeur exacte du backend
            derniere_maj: updatedRapport.derniere_maj,
            loadingValidation: false 
          } : r
        ));
        
        // Mettre à jour les détails du rapport sélectionné
        if (selectedRapportDetails?.id === rapportId) {
          setSelectedRapportDetails(prev => ({
            ...prev,
            statut: updatedRapport.statut,
            derniere_maj: updatedRapport.derniere_maj
          }));
        }
      }
    } catch (error) {
      console.error('Erreur lors de la validation:', error);
      toast.error(error.response?.data?.error || "Erreur lors de la validation");
      setRapports(prev => prev.map(r => 
        r.id === rapportId ? { ...r, loadingValidation: false } : r
      ));
    }
};

// Fonction utilitaire pour normaliser l'affichage des statuts
const getStatusDisplay = (statut) => {
  if (!statut) return 'Inconnu';
  
  // Normaliser le statut pour l'affichage
  const statusMap = {
    'validé': 'Validé',
    'valide': 'Validé',
    'en_cours': 'En cours',
    'encours': 'En cours',
    'brouillon': 'Brouillon',
    'draft': 'Brouillon'
  };
  
  return statusMap[statut.toLowerCase()] || statut;
};

// Fonction utilitaire pour obtenir la classe CSS du statut
const getStatusClass = (statut) => {
  if (!statut) return 'status-unknown';
  
  const statusClasses = {
    'validé': 'status-validated',
    'valide': 'status-validated',
    'en_cours': 'status-pending',
    'encours': 'status-pending',
    'brouillon': 'status-draft',
    'draft': 'status-draft'
  };
  
  return statusClasses[statut.toLowerCase()] || 'status-unknown';
};

// Utilisation dans votre composant d'affichage :
const StatusBadge = ({ statut }) => (
  <span className={`status-badge ${getStatusClass(statut)}`}>
    {getStatusDisplay(statut)}
  </span>
);
// Dans RapportsList.js, à l'intérieur de votre composant RapportsList
const handleAnomalyCorrectionChange = useCallback((index, newCorrectionText) => {
 setAdjustments((prevAdjustments) => {
 const updatedCorrections = [...prevAdjustments.corrections];
 if (updatedCorrections[index]) {
 updatedCorrections[index] = {
 ...updatedCorrections[index],
 userCorrection: newCorrectionText, // <--- This updates the object
 };
 }
 return { ...prevAdjustments, corrections: updatedCorrections };
 });
}, []);
  // Fonction pour ajuster un rapport
  const handleAdjustRapport = async (rapportId, corrections, comments) => {
  setRapports(prev => prev.map(r =>
    r.id === rapportId ? { ...r, loadingAdjustment: true } : r
  ));

  try {
    // --- START OF REQUIRED CHANGE ---
    // Transform the array of anomaly objects into an array of strings
    const anomaliesToSendBackend = corrections.map(anomaly => {
      let anomalyString = anomaly.message; // Start with the main message

      if (anomaly.userCorrection && anomaly.userCorrection.trim() !== '') {
        anomalyString += ` - Correction: ${anomaly.userCorrection.trim()}`;
      }
      // You can add more details to the string if you want, e.g.:
      // if (anomaly.field && anomaly.field !== 'Non spécifié') {
      //   anomalyString += ` (Champ: ${anomaly.field})`;
      // }
      // if (anomaly.originalValue && anomaly.originalValue !== 'N/A') {
      //   anomalyString += ` (Valeur originale: ${anomaly.originalValue})`;
      // }
      return anomalyString;
    });
    // --- END OF REQUIRED CHANGE ---

    const response = await axios.put(
      `${API_BASE_URL}/rapports/${rapportId}/adjust`,
      {
        anomalies: anomaliesToSendBackend, // Send the transformed array of strings
        commentaires: comments
      },
      {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
        },
        withCredentials: true
      }
    );

    if (response.status === 200) {
      toast.success('Rapport ajusté avec succès');
      setRapports(prev => prev.map(r =>
        r.id === rapportId ? {
          ...r,
          statut: 'Ajusté',
          anomalies: anomaliesToSendBackend, // Also update frontend state with the string array
          commentaires: comments,
          loadingAdjustment: false
        } : r
      ));

      if (selectedRapportDetails?.id === rapportId) {
        setSelectedRapportDetails(prev => ({
          ...prev,
          statut: 'Ajusté',
          anomalies: anomaliesToSendBackend, // Update selected details with string array
          commentaires: comments
        }));
      }

      setShowAdjustModal(false);
    }
  } catch (error) {
    console.error('Erreur lors de l\'ajustement:', error);
    toast.error(error.response?.data?.error || "Erreur lors de l'ajustement");
    setRapports(prev => prev.map(r =>
      r.id === rapportId ? { ...r, loadingAdjustment: false } : r
    ));
  }
};

  // Fonction pour supprimer un rapport
  const confirmDeleteRapport = (rapportId) => {
    setRapportToDelete(rapportId);
    setShowDeleteConfirmModal(true);
  };

  const handleDeleteRapport = async () => {
    if (!rapportToDelete) return;

    try {
      await axios.delete(`${API_BASE_URL}/rapports/${rapportToDelete}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
        },
        withCredentials: true
      });
      fetchRapports();
      toast.success('Rapport supprimé avec succès.');
    } catch (err) {
      console.error('Erreur lors de la suppression:', err);
      toast.error(err.response?.data?.error || 'Erreur lors de la suppression du rapport.');
    } finally {
      setShowDeleteConfirmModal(false);
      setRapportToDelete(null);
    }
  };

  // Fonction pour exporter un rapport
  const handleExport = async (rapportId, exportType) => {
    try {
      const endpoint = `${API_BASE_URL}/rapports/${rapportId}/${exportType}`;
      const response = await axios.get(endpoint, { 
        responseType: 'blob',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
        },
        withCredentials: true
      });

      let fileExtension = exportType === 'excel' ? 'xlsx' : 'pdf';
      let filename = `rapport_${rapportId}_${new Date().toISOString().slice(0, 10)}.${fileExtension}`;

      const contentDisposition = response.headers['content-disposition'];
      if (contentDisposition) {
        const filenameMatch = contentDisposition.match(/filename\*?=['"]?([^"';\n]*)/i);
        if (filenameMatch && filenameMatch[1]) {
          try {
            filename = decodeURIComponent(filenameMatch[1]);
          } catch (e) {
            filename = filenameMatch[1];
          }
        }
      }

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', filename);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);

      toast.success(`Export ${exportType.toUpperCase()} généré avec succès.`);
    } catch (err) {
      console.error(`Erreur d'export ${exportType}:`, err);
      toast.error(err.response?.data?.error || `Erreur lors de l'export ${exportType}.`);
    }
  };

  // Fonctions utilitaires pour accéder aux données
  const getFactureNumero = (rapport) => rapport?.facture?.numero || 'N/A';
  const getBanqueCompteNumero = (rapport) => rapport?.banque?.numero_compte || 'N/A';
  const getBanqueNom = (rapport) => rapport?.banque?.nom_banque || 'N/A';
  const getFactureClientNom = (rapport) => rapport?.facture?.client || 'N/A';
  const getBanqueTitulaire = (rapport) => rapport?.banque?.titulaire || 'N/A';

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    try {
      const date = new Date(dateString);
      return isNaN(date.getTime()) ? 'Date invalide' : date.toLocaleDateString('fr-FR');
    } catch {
      return 'Date invalide';
    }
  };

  const formatCurrency = (amount, currency) => {
    if (typeof amount !== 'number' || isNaN(amount)) return 'N/A';
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: currency || 'EUR'
    }).format(amount);
  };

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters(prev => ({ ...prev, [name]: value }));
  };

  // Fonction pour ouvrir le modal d'ajustement
  // Dans RapportsList.js
const openAdjustModal = (rapport) => {
  setCurrentAdjustRapport(rapport);

  // Assurez-vous que rapport.anomalies est un tableau d'objets structurés
  const formattedAnomalies = (rapport.anomalies || []).map((anomalyItem, index) => {
    // Supposons que anomalyItem est une chaîne de caractères (par exemple, "Montant total de la facture incorrect")
    // ou un objet déjà structuré.
    // Si c'est une chaîne, vous devrez peut-être la parser ou la transformer.
    // Pour l'instant, je vais créer une structure minimale si c'est une chaîne,
    // et utiliser l'objet tel quel si c'est déjà un objet.

    if (typeof anomalyItem === 'string') {
      return {
        id: `anon-${index}`, // Un ID unique est crucial pour les `key` React
        message: anomalyItem,
        type: 'Non spécifié', // Valeur par défaut
        field: 'Non spécifié', // Valeur par défaut
        originalValue: 'N/A',
        expectedValue: 'N/A',
        userCorrection: '' // Initialise la correction de l'utilisateur
      };
    } else {
      // Si anomalyItem est déjà un objet, assurez-vous qu'il a les propriétés nécessaires
      // et ajoutez 'userCorrection' s'il manque.
      return {
        id: anomalyItem.id || `anon-${index}`, // Assurez un ID unique
        message: anomalyItem.message || 'Anomalie non spécifiée',
        type: anomalyItem.type || 'Inconnu',
        field: anomalyItem.field || 'Inconnu',
        originalValue: anomalyItem.originalValue || 'N/A',
        expectedValue: anomalyItem.expectedValue || 'N/A',
        userCorrection: anomalyItem.userCorrection || '' // Important pour l'état initial
      };
    }
  });

  setAdjustments({
    corrections: formattedAnomalies,
    comments: rapport.commentaires || ''
  });
  setShowAdjustModal(true);
};

  // Filtrage des rapports
  const filteredRapports = useMemo(() => {
    const searchTerm = filters.search.toLowerCase();
    return rapports.filter(rapport => {
      const matchesSearch = (
        (rapport.titre || '').toLowerCase().includes(searchTerm) ||
        getFactureNumero(rapport).toLowerCase().includes(searchTerm) ||
        getBanqueCompteNumero(rapport).toLowerCase().includes(searchTerm) ||
        getBanqueNom(rapport).toLowerCase().includes(searchTerm)
      );
      const matchesStatus = !filters.statut || rapport.statut === filters.statut;

      const rapportDate = new Date(rapport.date_generation);
      const startDate = filters.dateDebut ? new Date(filters.dateDebut) : null;
      const endDate = filters.dateFin ? new Date(filters.dateFin) : null;

      const matchesDate = (!startDate || rapportDate >= startDate) && (!endDate || rapportDate <= endDate);

      return matchesSearch && matchesStatus && matchesDate;
    });
  }, [rapports, filters.search, filters.statut, filters.dateDebut, filters.dateFin]);

  const stats = useMemo(() => ({
    complet: filteredRapports.filter(r => r.statut === 'complet').length,
    incomplet: filteredRapports.filter(r => r.statut === 'incomplet').length,
    anomalie: filteredRapports.filter(r => r.statut === 'anomalie').length,
    Validé: filteredRapports.filter(r => r.statut === 'Validé').length,
    Ajusté: filteredRapports.filter(r => r.statut === 'Ajusté').length,
    total: filteredRapports.length
  }), [filteredRapports]);

  const openDetails = (rapport) => {
    fetchRapportDetails(rapport.id);
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
                {stats.total} {stats.total > 1 ? 'rapports trouvés' : 'rapport trouvé'} • 
                <span className="text-green-600"> {stats.Validé} Validés</span> • 
                <span className="text-purple-600"> {stats.Ajusté} Ajustés</span> • 
                <span className="text-red-600"> {stats.anomalie} Anomalies</span>
              </p>
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            <button
              onClick={fetchRapports}
              className="flex items-center px-4 py-2 bg-white border border-gray-300 rounded-lg shadow-sm hover:bg-gray-50 transition-colors"
            >
              <FaSync className={`mr-2 ${loading ? 'animate-spin' : ''}`} />
              Actualiser
            </button>
          </div>
        </div>

        {/* Filtres */}
        <div className="bg-white p-4 rounded-lg shadow-sm mb-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {/* Champ de recherche général */}
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <FaSearch className="text-gray-400" />
              </div>
              <input
                type="text"
                name="search"
                placeholder="Rechercher par n° facture, banque, n° compte..."
                className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                value={filters.search}
                onChange={handleFilterChange}
              />
            </div>

            {/* Filtre par statut */}
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
                {Object.entries(STATUS_CONFIG).map(([key, { label }]) => (
                  <option key={key} value={key}>{label}</option>
                ))}
              </select>
            </div>

            {/* Filtre Date Début */}
            <div className="relative">
              <label htmlFor="dateDebut" className="sr-only">Date de début</label>
              <input
                type="date"
                name="dateDebut"
                id="dateDebut"
                placeholder="Date de début"
                className="block w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                value={filters.dateDebut}
                onChange={handleFilterChange}
              />
            </div>

            {/* Filtre Date Fin */}
            <div className="relative">
              <label htmlFor="dateFin" className="sr-only">Date de fin</label>
              <input
                type="date"
                name="dateFin"
                id="dateFin"
                placeholder="Date de fin"
                className="block w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                value={filters.dateFin}
                onChange={handleFilterChange}
              />
            </div>
          </div>
        </div>

        {/* Tableau principal */}
        <div className="bg-white shadow-sm rounded-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Titre
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Facture
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Banque
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Date Génération
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
                    <td colSpan={7} className="px-6 py-8 text-center">
                      <div className="flex justify-center">
                        <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-indigo-500"></div>
                      </div>
                      <p className="mt-2 text-gray-600">Chargement des rapports...</p>
                    </td>
                  </tr>
                ) : filteredRapports.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-6 py-6 text-center text-gray-500">
                      <div className="flex flex-col items-center justify-center">
                        <FaFilePdf className="text-gray-400 text-3xl mb-2" />
                        <span>Aucun rapport trouvé pour les critères sélectionnés.</span>
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
                            {rapport.titre || 'N/A'}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">
                            {getFactureNumero(rapport)}
                          </div>
                          <div className="text-xs text-gray-500">
                            Client: {getFactureClientNom(rapport)}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">
                            {getBanqueNom(rapport)}
                          </div>
                          <div className="text-xs text-gray-500">
                            Compte: {getBanqueCompteNumero(rapport)}
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
                            <button
                              onClick={() => openDetails(rapport)}
                              className="p-2 text-indigo-600 hover:text-indigo-900 rounded-lg hover:bg-gray-100 transition-colors"
                              title="Voir détails"
                            >
                              <FaEye />
                            </button>
                            
                            {rapport.statut !== 'Validé' && (
                              <button
                                onClick={() => handleValidateRapport(rapport.id)}
                                disabled={rapport.loadingValidation}
                                className="p-2 text-green-600 hover:text-green-900 rounded-lg hover:bg-gray-100 transition-colors"
                                title="Valider"
                              >
                                {rapport.loadingValidation ? (
                                  <FaSpinner className="animate-spin" />
                                ) : (
                                  <FaCheckCircle />
                                )}
                              </button>
                            )}
                            
                            {rapport.anomalies_count > 0 && rapport.statut !== 'Validé' && (
                              <button
                                onClick={() => openAdjustModal(rapport)}
                                disabled={rapport.loadingAdjustment}
                                className="p-2 text-yellow-600 hover:text-yellow-900 rounded-lg hover:bg-gray-100 transition-colors"
                                title="Ajuster"
                              >
                                {rapport.loadingAdjustment ? (
                                  <FaSpinner className="animate-spin" />
                                ) : (
                                  <FaEdit />
                                )}
                              </button>
                            )}
                            
                            <button
                              onClick={() => confirmDeleteRapport(rapport.id)}
                              className="p-2 text-red-600 hover:text-red-900 rounded-lg hover:bg-gray-100 transition-colors"
                              title="Supprimer"
                            >
                              <FaTrash />
                            </button>
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
      {showDetailsModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-6xl max-h-[90vh] overflow-y-auto transform scale-95 animate-scale-in">
            <div className="flex justify-between items-center border-b p-4 sticky top-0 bg-white z-10">
              <h3 className="text-lg font-semibold text-gray-800">Détails du rapport</h3>
              <button
                onClick={() => setShowDetailsModal(false)}
                className="text-gray-400 hover:text-gray-600 p-1 rounded-full hover:bg-gray-100 transition-colors"
                title="Fermer"
              >
                <FaTimesCircle className="text-xl" />
              </button>
            </div>

            {loadingDetails ? (
              <div className="p-6 text-center">
                <div className="flex justify-center my-8">
                  <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
                </div>
                <p className="text-gray-600">Chargement des détails du rapport...</p>
              </div>
            ) : selectedRapportDetails ? (
              <div className="p-6">
                {/* Informations générales */}
                <TableSection
                  title="Informations générales"
                  data={[selectedRapportDetails]}
                  columns={[
                    { header: 'Titre', accessor: item => item.titre || 'N/A' },
                    { header: 'Numéro de facture', accessor: item => getFactureNumero(item) },
                    { header: 'Nom de banque', accessor: item => getBanqueNom(item) },
                    { header: 'Numéro de compte bancaire', accessor: item => getBanqueCompteNumero(item) },
                    { header: 'Date de génération', accessor: item => formatDate(item.date_generation) },
                    {
                      header: 'Statut',
                      accessor: item => (
                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                          STATUS_CONFIG[item.statut]?.color || STATUS_CONFIG.default.color
                        }`}>
                          {STATUS_CONFIG[item.statut]?.label || STATUS_CONFIG.default.label}
                        </span>
                      )
                    },
                    { header: 'Client/Titulaire', accessor: item => getFactureClientNom(item) || getBanqueTitulaire(item) }
                  ]}
                />

                {/* Détails de la facture */}
                {selectedRapportDetails.facture ? (
                  <>
                    <TableSection
                      title="Détails de la facture"
                      data={[selectedRapportDetails.facture]}
                      columns={[
                        { header: 'Numéro', accessor: fact => fact.numero || 'N/A' },
                        { header: 'Émetteur', accessor: fact => fact.emetteur || 'N/A' },
                        { header: 'Date émission', accessor: fact => formatDate(fact.date_emission) },
                        { header: 'Montant total', accessor: fact => formatCurrency(fact.montant_total, fact.devise) },
                        { header: 'Client', accessor: fact => fact.client || 'N/A' }
                      ]}
                    />

                    {selectedRapportDetails.facture.ligne_details?.length > 0 && (
                      <TableSection
                        title="Lignes de détails de la facture"
                        data={selectedRapportDetails.facture.ligne_details}
                        columns={[
                          { header: 'Description', accessor: item => item.description || 'N/A' },
                          { header: 'Quantité', accessor: item => item.quantite || 0 },
                          { header: 'Prix unitaire', accessor: item => formatCurrency(item.prix_unitaire, selectedRapportDetails.facture.devise) },
                          { header: 'Montant', accessor: item => formatCurrency(item.montant, selectedRapportDetails.facture.devise) }
                        ]}
                        expandable
                      />
                    )}
                  </>
                ) : (
                  <p className="text-sm text-gray-500 mb-6">Aucune facture associée à ce rapport.</p>
                )}

                {/* Détails du relevé bancaire */}
                {selectedRapportDetails.banque ? (
                  <>
                    <TableSection
                      title="Détails du relevé bancaire"
                      data={[selectedRapportDetails.banque]}
                      columns={[
                        { header: 'Numéro de compte', accessor: banque => banque.numero_compte || 'N/A' },
                        { header: 'Nom de la banque', accessor: banque => banque.nom_banque || 'N/A' },
                        { header: 'Titulaire', accessor: banque => banque.titulaire || 'N/A' },
                        { header: 'BIC', accessor: banque => banque.bic || 'N/A' },
                        { header: 'IBAN', accessor: banque => banque.iban || 'N/A' },
                        { header: 'Numéro de relevé', accessor: banque => banque.numero_releve || 'N/A' },
                        {
                          header: 'Période',
                          accessor: banque => `${formatDate(banque.date_debut)} - ${formatDate(banque.date_fin)}`
                        },
                        { header: 'Solde Initial', accessor: banque => formatCurrency(banque.solde_initial, 'EUR') },
                        { header: 'Solde Final', accessor: banque => formatCurrency(banque.solde_final, 'EUR') },
                        { header: 'Total Crédits', accessor: banque => formatCurrency(banque.total_credits, 'EUR') },
                        { header: 'Total Débits', accessor: banque => formatCurrency(banque.total_debits, 'EUR') },
                      ]}
                    />

                    {selectedRapportDetails.banque.operations?.length > 0 && (
                      <TableSection
                        title="Opérations bancaires"
                        data={selectedRapportDetails.banque.operations}
                        columns={[
                          { header: 'Date', accessor: op => formatDate(op.date) },
                          { header: 'Libellé', accessor: op => op.libelle || 'N/A' },
                          { header: 'Débit', accessor: op => op.debit !== null ? formatCurrency(op.debit, op.devise) : '' },
                          { header: 'Crédit', accessor: op => op.credit !== null ? formatCurrency(op.credit, op.devise) : '' },
                          { header: 'Solde', accessor: op => formatCurrency(op.solde, op.devise) },
                          { header: 'Montant Op.', accessor: op => formatCurrency(op.montant, op.devise) },
                          { header: 'Réf Facture', accessor: op => op.ref_facture || 'N/A' },
                          { header: 'Référence', accessor: op => op.reference || 'N/A' },
                          { header: 'N° Pièce', accessor: op => op.numero_piece || 'N/A' },
                          { header: 'Type Op.', accessor: op => op.type_operation || 'N/A' },
                        ]}
                        expandable
                      />
                    )}
                  </>
                ) : (
                  <p className="text-sm text-gray-500 mb-6">Aucun relevé bancaire associé à ce rapport.</p>
                )}

                {/* Anomalies */}
                {selectedRapportDetails.anomalies?.length > 0 && (
                  <TableSection
                    title={`Anomalies (${selectedRapportDetails.anomalies.length})`}
                    data={selectedRapportDetails.anomalies.map((a, i) => ({ id: i, anomalie: a }))}
                    columns={[
                      { header: '#', accessor: a => a.id + 1 },
                      { header: 'Description', accessor: a => a.anomalie }
                    ]}
                    expandable
                  />
                )}

                {/* Recommandations */}
                {selectedRapportDetails.recommandations?.length > 0 && (
                  <TableSection
                    title={`Recommandations (${selectedRapportDetails.recommandations.length})`}
                    data={selectedRapportDetails.recommandations.map((r, i) => ({ id: i, recommandation: r }))}
                    columns={[
                      { header: '#', accessor: r => r.id + 1 },
                      { header: 'Description', accessor: r => r.recommandation }
                    ]}
                    expandable
                  />
                )}

                {/* Actions */}
                <div className="mt-6 border border-gray-200 rounded-lg p-4 bg-white shadow-sm">
                  <h4 className="text-sm font-medium text-gray-700 mb-3">Actions</h4>
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                    <button
                      onClick={() => {
                        setShowDetailsModal(false);
                        navigate(`/dashboardcomptable/modif_rapport/${selectedRapportDetails.id}`);
                      }}
                      className="flex items-center justify-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                    >
                      <FaEdit className="mr-2" />
                      Modifier
                    </button>
                    
                    {selectedRapportDetails.statut !== 'Validé' && (
                      <button
                        onClick={() => handleValidateRapport(selectedRapportDetails.id)}
                        className="flex items-center justify-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                      >
                        <FaCheckCircle className="mr-2" />
                        Valider
                      </button>
                    )}
                    
                    <button
                      onClick={() => handleExport(selectedRapportDetails.id, 'pdf')}
                      className="flex items-center justify-center px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                    >
                      <FaFilePdf className="mr-2" />
                      Export PDF
                    </button>
                    <button
                      onClick={() => handleExport(selectedRapportDetails.id, 'excel')}
                      className="flex items-center justify-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                    >
                      <FaFileExcel className="mr-2" />
                      Export Excel
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="p-6 text-center text-red-500">
                Impossible de charger les détails du rapport.
              </div>
            )}
          </div>
        </div>
      )}

      {/* Modal de confirmation de suppression */}
      {showDeleteConfirmModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-sm transform scale-95 animate-scale-in">
            <div className="p-6 text-center">
              <FaTrash className="text-red-500 text-4xl mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Confirmer la suppression</h3>
              <p className="text-sm text-gray-500 mb-6">
                Êtes-vous sûr de vouloir supprimer ce rapport ? Cette action est irréversible.
              </p>
              <div className="flex justify-center space-x-4">
                <button
                  onClick={() => setShowDeleteConfirmModal(false)}
                  className="px-5 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  Annuler
                </button>
                <button
                  onClick={handleDeleteRapport}
                  className="px-5 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                >
                  Supprimer
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal d'ajustement */}
      {showAdjustModal && currentAdjustRapport && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-white rounded-xl shadow-2xl p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto transform scale-95 animate-scale-in">
            <div className="flex justify-between items-center mb-6 pb-4 border-b border-gray-200">
              <div>
                <h2 className="text-2xl font-bold text-gray-800 flex items-center">
                  <FaEdit className="mr-3 text-indigo-600" />
                  Ajuster le Rapport <span className="ml-2 px-3 py-1 bg-indigo-100 text-indigo-800 rounded-full text-sm">#{currentAdjustRapport.id}</span>
                </h2>
                <p className="text-gray-500 text-sm mt-1">
                  {currentAdjustRapport.anomalies_count} anomalie(s) à corriger
                </p>
              </div>
              <button
                onClick={() => setShowAdjustModal(false)}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <FaTimes className="text-xl" />
              </button>
            </div>

            <div className="mb-8">
              <h3 className="text-lg font-semibold text-gray-700 mb-4 flex items-center">
                <FaExclamationTriangle className="mr-2 text-yellow-500" />
                Anomalies détectées et corrections
              </h3>

              {/* C'est ICI que le composant AnomalyCorrection est utilisé */}
              {adjustments.corrections?.length > 0 ? (
                <div className="space-y-4">
                  {adjustments.corrections.map((anomaly, index) => (
                    <AnomalyCorrection
                      key={anomaly.id} // IMPORTANT: Utilisez anomaly.id pour la clé
                      anomaly={anomaly}
                      index={index}
                      onCorrectionChange={handleAnomalyCorrectionChange}
                    />
                  ))}
                </div>
              ) : (
                <div className="p-4 bg-green-50 border-l-4 border-green-400 rounded-r-lg">
                  <p className="text-green-800 flex items-center">
                    <FaCheckCircle className="mr-3 text-xl" />
                    Aucune anomalie trouvée dans ce rapport
                  </p>
                </div>
              )}
            </div>

            <div className="mb-8">
              <label htmlFor="correctionComments" className="block text-sm font-medium text-gray-700 mb-3 flex items-center">
                <FaEdit className="mr-2 text-gray-500" />
                Commentaires sur les corrections
              </label>
              <textarea
                id="correctionComments"
                rows={4}
                className="w-full rounded-lg border border-gray-300 py-3 px-4 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                value={adjustments.comments}
                onChange={(e) => setAdjustments(prev => ({ ...prev, comments: e.target.value }))}
                placeholder="Décrivez les corrections apportées..."
              />
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
              <button
                onClick={() => setShowAdjustModal(false)}
                className="px-5 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg font-medium transition-colors flex items-center"
              >
                <FaTimes className="mr-2" />
                Annuler
              </button>
              <button
                onClick={() => handleAdjustRapport(currentAdjustRapport.id, adjustments.corrections, adjustments.comments)}
                className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-medium transition-colors flex items-center"
              >
                <FaSave className="mr-2" />
                Sauvegarder
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default RapportsList;
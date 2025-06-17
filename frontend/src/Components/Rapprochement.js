import React, { useState, useEffect, useCallback } from 'react';
import {
  FaFileAlt, FaSyncAlt, FaSpinner,
  FaRobot, FaExclamationTriangle,
  FaFileInvoice, FaLandmark, FaCheckCircle,
  FaSearch, FaFilePdf, FaFileExcel, FaFileWord,
  FaChevronDown, FaChevronUp, FaFilter,
  FaCalendarAlt, FaTimes
} from 'react-icons/fa';
import axios from 'axios';
import { toast } from "react-toastify";
import DataDisplay from './DataDisplay'; 
import { Dialog, Transition } from '@headlessui/react';
import { Fragment } from 'react';

// Configuration des URLs d'API
const API_BASE_URL = 'http://localhost:5000/api';
const FACTURES_API_URL = 'http://localhost:8000/api/factures/';
const RELEVES_API_URL = 'http://localhost:8000/api/banques/';

const Rapprochements = () => {
  const [facturesImportees, setFacturesImportees] = useState([]);
  const [relevesImportees, setRelevesImportees] = useState([]);
  const [rapports, setRapports] = useState([]);
  const [selectedRapport, setSelectedRapport] = useState(null);
  const [selectedFactureId, setSelectedFactureId] = useState(null);
  const [selectedReleveId, setSelectedReleveId] = useState(null);
  const [loading, setLoading] = useState({
    factures: true,
    releves: true,
    rapports: true,
    comparing: false
  });
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [expandedSections, setExpandedSections] = useState({
    newReconciliation: true,
    rapportsList: true
  });

  // Fonction pour récupérer les fichiers
  const fetchFile = async (url, filename) => {
    try {
      const response = await fetch(url);
      if (!response.ok) throw new Error("Échec du téléchargement");
      const blob = await response.blob();
      return new File([blob], filename);
    } catch (error) {
      console.error("Erreur lors de la récupération du fichier:", error);
      throw error;
    }
  };

  // Chargement initial des factures et relevés
  useEffect(() => {
    const fetchInitialData = async () => {
      try {
        const [facturesResponse, relevesResponse] = await Promise.all([
          axios.get(FACTURES_API_URL, { 
            withCredentials: true,
            headers: {
              'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
            }
          }),
          axios.get(RELEVES_API_URL, { 
            withCredentials: true,
            headers: {
              'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
            }
          })
        ]);

        // Gestion de la réponse des factures
        let facturesData = [];
        if (Array.isArray(facturesResponse.data)) {
          facturesData = facturesResponse.data;
        } else if (facturesResponse.data.data && Array.isArray(facturesResponse.data.data)) {
          facturesData = facturesResponse.data.data;
        }

        // Gestion de la réponse des relevés
        let relevesData = [];
        if (Array.isArray(relevesResponse.data)) {
          relevesData = relevesResponse.data;
        } else if (relevesResponse.data.data && Array.isArray(relevesResponse.data.data)) {
          relevesData = relevesResponse.data.data;
        }

        setFacturesImportees(facturesData);
        setRelevesImportees(relevesData);
      } catch (error) {
        toast.error(error.response?.data?.error || "Erreur lors du chargement des fichiers");
        console.error("Erreur détaillée:", error);
      } finally {
        setLoading(prev => ({ ...prev, factures: false, releves: false }));
      }
    };

    fetchInitialData();
  }, []);

  // Récupération des rapports
  const fetchRapports = useCallback(async () => {
    setLoading(prev => ({ ...prev, rapports: true }));
    try {
      const response = await axios.get(`${API_BASE_URL}/rapports`, {
        withCredentials: true,
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
        }
      });

      const rapportsData = response.data.data || [];
      setRapports(rapportsData);
    } catch (err) {
      toast.error(err.response?.data?.error || 'Erreur lors du chargement des rapports');
      console.error(err);
    } finally {
      setLoading(prev => ({ ...prev, rapports: false }));
    }
  }, []);

  useEffect(() => {
    fetchRapports();
  }, [fetchRapports]);

  // Comparaison des documents
  const handleCompareDocuments = useCallback(async () => {
    if (!selectedFactureId || !selectedReleveId) {
      toast.error("Veuillez sélectionner une facture et un relevé");
      return;
    }

    setLoading(prev => ({ ...prev, comparing: true }));
    const toastId = toast.loading("Rapprochement en cours...");

    try {
      const selectedFacture = facturesImportees.find(f => f.id == selectedFactureId);
      const selectedReleve = relevesImportees.find(r => r.id == selectedReleveId);

      if (!selectedFacture) {
        toast.error("Facture sélectionnée introuvable.");
        return;
      }
      if (!selectedReleve) {
        toast.error("Relevé sélectionné introuvable.");
        return;
      }

      const invoiceFilename = selectedFacture.filename || (selectedFacture.fichier_url ? selectedFacture.fichier_url.split('/').pop() : `facture_${selectedFacture.id}.pdf`);
      const statementFilename = selectedReleve.filename || (selectedReleve.fichier_url ? selectedReleve.fichier_url.split('/').pop() : `releve_${selectedReleve.id}.pdf`);

      const invoiceFileObj = await fetchFile(selectedFacture.fichier_url, invoiceFilename);
      const statementFileObj = await fetchFile(selectedReleve.fichier_url, statementFilename);

      const formData = new FormData();
      formData.append('invoice', invoiceFileObj);
      formData.append('statement', statementFileObj);
      formData.append('facture_id', selectedFactureId);
      formData.append('banque_id', selectedReleveId);

      const response = await axios.post(`${API_BASE_URL}/compare-documents`, formData, {
        headers: { 
          'Content-Type': 'multipart/form-data',
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
        },
        withCredentials: true
      });

      if (response.status === 200 || response.status === 201) {
        toast.success("Rapprochement effectué avec succès!", { id: toastId });
        fetchRapports();
      } else {
        toast.error(response.data?.error || "Le rapprochement a rencontré une erreur.", { id: toastId });
      }
    } catch (error) {
      const errorMessage = error.response?.data?.error || error.message || "Erreur inconnue lors du rapprochement.";
      toast.error(errorMessage, { id: toastId });
      console.error("Erreur détaillée:", error);
    } finally {
      setLoading(prev => ({ ...prev, comparing: false }));
      toast.dismiss(toastId);
    }
  }, [selectedFactureId, selectedReleveId, facturesImportees, relevesImportees, fetchRapports]);

  const getFileIcon = (filename) => {
    if (!filename) return <FaFileAlt className="text-gray-400" />;
    const ext = filename.split('.').pop().toLowerCase();
    switch(ext) {
      case 'pdf': return <FaFilePdf className="text-red-500" />;
      case 'xls': case 'xlsx': return <FaFileExcel className="text-green-600" />;
      case 'doc': case 'docx': return <FaFileWord className="text-blue-500" />;
      default: return <FaFileAlt className="text-indigo-500" />;
    }
  };

  // Toggle des sections
  const toggleSection = (section) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  // Filtrage des rapports
  const filteredRapports = rapports.filter(rapport => {
    const matchesSearch = 
      rapport.facture?.numero?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      rapport.banque?.nom_banque?.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus = 
      statusFilter === 'all' || 
      (rapport.statut || 'En attente').toLowerCase() === statusFilter.toLowerCase();

    return matchesSearch && matchesStatus;
  });

  return (
    <div className="container mx-auto p-4 md:p-6 lg:p-8">
      <header className="mb-8">
        <h1 className="text-3xl md:text-4xl font-bold text-gray-800 flex items-center">
          <div className="p-3 bg-indigo-100 rounded-lg mr-4 text-indigo-600">
            <FaFileAlt className="text-2xl" />
          </div>
          <div>
            Rapports de Rapprochement
            <p className="text-lg font-normal text-gray-600 mt-1">Comparez et validez vos factures et relevés bancaires</p>
          </div>
        </h1>
      </header>

      <div className="space-y-6">
        {/* Section Nouveau Rapport */}
        <section className="bg-white rounded-xl shadow-md overflow-hidden">
          <div 
            className="flex justify-between items-center p-6 cursor-pointer hover:bg-gray-50"
            onClick={() => toggleSection('newReconciliation')}
          >
            <h2 className="text-xl font-semibold text-gray-800 flex items-center">
              <div className="p-2 bg-purple-100 rounded-lg mr-4 text-purple-600">
                <FaRobot className="text-xl" />
              </div>
              Nouveau Rapport
            </h2>
            {expandedSections.newReconciliation ? (
              <FaChevronUp className="text-gray-500" />
            ) : (
              <FaChevronDown className="text-gray-500" />
            )}
          </div>
          
          {expandedSections.newReconciliation && (
            <div className="px-6 pb-6">
              <p className="text-gray-600 mb-6">
                Sélectionnez une facture et un relevé bancaire pour générer un rapport de rapprochement
              </p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                  <label className="block text-sm font-medium text-gray-700 mb-3 flex items-center">
                    <div className="p-1.5 bg-green-100 rounded-md mr-3 text-green-600">
                      <FaLandmark />
                    </div>
                    Relevé bancaire
                  </label>
                  <select
                    value={selectedReleveId || ''}
                    onChange={(e) => setSelectedReleveId(e.target.value || null)}
                    className="w-full rounded-lg border border-gray-300 py-2.5 px-4 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all"
                    disabled={loading.releves}
                  >
                    <option value="">-- Sélectionner un relevé --</option>
                    {loading.releves ? (
                      <option disabled>Chargement...</option>
                    ) : (
                      Array.isArray(relevesImportees) && relevesImportees.map(releve => (
                        <option key={releve.id} value={releve.id}>
                          {releve.filename || releve.numero || `Relevé ${releve.id}`}
                        </option>
                      ))
                    )}
                  </select>
                </div>
                <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                  <label className="block text-sm font-medium text-gray-700 mb-3 flex items-center">
                    <div className="p-1.5 bg-blue-100 rounded-md mr-3 text-blue-600">
                      <FaFileInvoice />
                    </div>
                    Facture à rapprocher
                  </label>
                  <select
                    value={selectedFactureId || ''}
                    onChange={(e) => setSelectedFactureId(e.target.value || null)}
                    className="w-full rounded-lg border border-gray-300 py-2.5 px-4 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                    disabled={loading.factures}
                  >
                    <option value="">-- Facture --</option>
                    {loading.factures ? (
                      <option disabled>Chargement...</option>
                    ) : (
                      Array.isArray(facturesImportees) && facturesImportees.map(facture => (
                        <option key={facture.id} value={facture.id}>
                          {facture.filename || facture.numero || `Facture ${facture.id}`}
                        </option>
                      ))
                    )}
                  </select>
                </div>
              </div>

              <button
                onClick={handleCompareDocuments}
                disabled={!selectedFactureId || !selectedReleveId || loading.comparing}
                className={`px-6 py-3 rounded-lg font-medium flex items-center transition-all ${
                  !selectedFactureId || !selectedReleveId || loading.comparing
                    ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                    : 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-md hover:shadow-lg'
                }`}
              >
                {loading.comparing ? (
                  <>
                    <FaSpinner className="animate-spin mr-3" />
                    Traitement en cours...
                  </>
                ) : (
                  <>
                    <FaSyncAlt className="mr-3" />
                    Générer le rapport
                  </>
                )}
              </button>
            </div>
          )}
        </section>

        {/* Liste des Rapports */}
        <section className="bg-white rounded-xl shadow-md overflow-hidden">
          <div 
            className="flex justify-between items-center p-6 cursor-pointer hover:bg-gray-50"
            onClick={() => toggleSection('rapportsList')}
          >
            <h2 className="text-xl font-semibold text-gray-800 flex items-center">
              <div className="p-2 bg-indigo-100 rounded-lg mr-4 text-indigo-600">
                <FaFileAlt className="text-xl" />
              </div>
              Historique des Rapports
              <span className="ml-3 px-2.5 py-0.5 bg-gray-100 text-gray-800 rounded-full text-sm font-medium">
                {rapports.length}
              </span>
            </h2>
            {expandedSections.rapportsList ? (
              <FaChevronUp className="text-gray-500" />
            ) : (
              <FaChevronDown className="text-gray-500" />
            )}
          </div>
          
          {expandedSections.rapportsList && (
            <div className="px-6 pb-6">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
                <div className="relative flex-grow max-w-md">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <FaSearch className="text-gray-400" />
                  </div>
                  <input
                    type="text"
                    placeholder="Rechercher un rapport..."
                    className="pl-10 pr-4 py-2.5 w-full rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
                <div className="flex items-center gap-3">
                  <div className="flex items-center">
                    <FaFilter className="text-gray-500 mr-2" />
                    <select
                      className="rounded-lg border border-gray-300 py-2 px-3 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                      value={statusFilter}
                      onChange={(e) => setStatusFilter(e.target.value)}
                    >
                      <option value="all">Tous les statuts</option>
                      <option value="en attente">En attente</option>
                      <option value="ajusté">Ajusté</option>
                      <option value="validé">Validé</option>
                    </select>
                  </div>
                </div>
              </div>

              {loading.rapports ? (
                <div className="flex justify-center items-center py-12">
                  <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
                </div>
              ) : filteredRapports.length === 0 ? (
                <div className="text-center py-12">
                  <div className="mx-auto w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                    <FaFileAlt className="text-3xl text-gray-400" />
                  </div>
                  <h3 className="text-lg font-medium text-gray-700 mb-1">Aucun rapport trouvé</h3>
                  <p className="text-gray-500">Essayez de modifier vos critères de recherche</p>
                </div>
              ) : (
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
                      {filteredRapports.map(rapport => (
                        <tr 
                          key={rapport.id} 
                          className="hover:bg-gray-50 cursor-pointer"
                          onClick={() => setSelectedRapport(rapport)}
                        >
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center">
                              {getFileIcon(rapport.facture?.filename)}
                              <span className="ml-2 text-sm font-medium text-gray-900">
                                {rapport.facture?.numero || 'N/A'}
                              </span>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            <div className="flex items-center">
                              <FaLandmark className="text-green-500 mr-2" />
                              {rapport.banque?.nom_banque || 'N/A'}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
 <div className="flex items-center">
 <FaCalendarAlt className="text-gray-400 mr-2" />
 {/* Ajoutez ce console.log */}
 {console.log('rapport.date_creation:', rapport.date_creation)}
 {rapport.date_creation ? new Date(rapport.date_creation).toLocaleDateString() : 'N/A'}
 </div>
 </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                              rapport.statut === 'Validé'
                                ? 'bg-green-100 text-green-800'
                                : rapport.statut === 'Ajusté'
                                  ? 'bg-yellow-100 text-yellow-800'
                                  : 'bg-gray-100 text-gray-800'
                            }`}>
                              {rapport.statut || 'En attente'}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {rapport.anomalies && rapport.anomalies.length > 0 ? (
                              <span className="px-2.5 py-0.5 inline-flex items-center bg-red-100 text-red-800 rounded-full text-xs font-medium">
                                <FaExclamationTriangle className="mr-1" />
                                {rapport.anomalies.length}
                              </span>
                            ) : (
                              <span className="px-2.5 py-0.5 inline-flex items-center bg-green-100 text-green-800 rounded-full text-xs font-medium">
                                <FaCheckCircle className="mr-1" />
                                Aucune
                              </span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}
        </section>

        {/* Détails du rapport sélectionné */}
        {selectedRapport && (
          <section className="bg-white rounded-xl shadow-md overflow-hidden">
            <div className="p-6 border-b border-gray-200 flex justify-between items-center">
              <h2 className="text-xl font-semibold text-gray-800 flex items-center">
                <div className="p-2 bg-blue-100 rounded-lg mr-4 text-blue-600">
                  <FaFileAlt className="text-xl" />
                </div>
                Détails du Rapport <span className="ml-2 px-2 py-0.5 bg-blue-100 text-blue-800 rounded-full text-sm">#{selectedRapport.id}</span>
              </h2>
              <button
                onClick={() => setSelectedRapport(null)}
                className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-colors"
              >
                <FaTimes />
              </button>
            </div>
            
            <div className="p-6 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-blue-50 p-4 rounded-lg border border-blue-100">
                  <h3 className="text-lg font-medium text-blue-800 mb-3 flex items-center">
                    <FaFileInvoice className="mr-2" />
                    Facture: {selectedRapport.facture?.numero || 'N/A'}
                  </h3>
                  <DataDisplay
                    data={selectedRapport.facture}
                    type="invoice"
                    anomalies={selectedRapport.anomalies?.filter(a => a.type === 'facture')}
                  />
                </div>

                <div className="bg-green-50 p-4 rounded-lg border border-green-100">
                  <h3 className="text-lg font-medium text-green-800 mb-3 flex items-center">
                    <FaLandmark className="mr-2" />
                    Relevé Bancaire: {selectedRapport.banque?.nom_banque || 'N/A'}
                  </h3>
                  <DataDisplay
                    data={selectedRapport.banque}
                    type="statement"
                    anomalies={selectedRapport.anomalies?.filter(a => a.type === 'releve')}
                  />
                </div>
              </div>

              <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                <h3 className="text-lg font-medium text-gray-800 mb-3 flex items-center">
                  <FaFileAlt className="mr-2" />
                  Résultats du Rapprochement
                </h3>
                <div className="space-y-4">
                  <div>
                    <h4 className="font-medium text-gray-700 mb-2">Statut:</h4>
                    <span className={`px-3 py-1 inline-flex text-sm leading-5 font-semibold rounded-full ${
                      selectedRapport.statut === 'Validé'
                        ? 'bg-green-100 text-green-800'
                        : selectedRapport.statut === 'Ajusté'
                          ? 'bg-yellow-100 text-yellow-800'
                          : 'bg-gray-100 text-gray-800'
                    }`}>
                      {selectedRapport.statut || 'En attente'}
                    </span>
                  </div>

                  {selectedRapport.commentaires && (
                    <div>
                      <h4 className="font-medium text-gray-700 mb-2">Commentaires:</h4>
                      <p className="text-gray-600">{selectedRapport.commentaires}</p>
                    </div>
                  )}

                  <div>
                    <h4 className="font-medium text-gray-700 mb-2">Résultats:</h4>
                    {selectedRapport.resultat_verification ? (
                      <pre className="bg-white p-4 rounded border border-gray-200 overflow-x-auto">
                        {JSON.stringify(selectedRapport.resultat_verification, null, 2)}
                      </pre>
                    ) : (
                      <p className="text-gray-500">Aucun résultat disponible</p>
                    )}
                  </div>

                  {selectedRapport.recommendations && (
                    <div>
                      <h4 className="font-medium text-gray-700 mb-2">Recommandations:</h4>
                      <ul className="list-disc pl-5 space-y-1 text-gray-600">
                        {selectedRapport.recommendations.map((rec, i) => (
                          <li key={i}>{rec}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              </div>

              <div className="flex justify-end">
                <button
                  onClick={() => setSelectedRapport(null)}
                  className="px-5 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg font-medium transition-colors"
                >
                  Fermer les détails
                </button>
              </div>
            </div>
          </section>
        )}
      </div>
    </div>
  );
};

export default Rapprochements;
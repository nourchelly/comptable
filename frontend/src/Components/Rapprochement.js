import React, { useState, useEffect, useCallback } from 'react';
import {
  FaFileAlt, FaSyncAlt, FaSpinner,
  FaRobot, FaExclamationTriangle,
  FaFileInvoice, FaLandmark, FaCheckCircle,
  FaEdit, FaSave, FaTimes, FaSearch,
  FaFilePdf, FaFileExcel, FaFileWord,
  FaChevronDown, FaChevronUp, FaFilter,
  FaCalendarAlt, FaPercentage, FaMoneyBillWave
} from 'react-icons/fa';
import axios from 'axios';
import { toast } from "react-toastify";
import DataDisplay from './DataDisplay'; 
import AnomalyCorrection from './AnomalyCorrection';

const ReconciliationEditModal = ({
  reconciliation,
  onSave,
  onCancel,
  isLoading
}) => {
  const [corrections, setCorrections] = useState([]);
  const [comments, setComments] = useState('');

  const anomalies = reconciliation?.anomalies || [];

  useEffect(() => {
    const initialCorrections = anomalies.map((anomaly, index) => ({
      anomalyId: anomaly.id || `temp-${index}`,
      type: anomaly.type || 'inconnu',
      field: anomaly.field || 'champ_inconnu',
      value: anomaly.expectedValue || '',
      originalValue: anomaly.originalValue || 'N/A',
      expectedValue: anomaly.expectedValue || 'N/A',
      message: anomaly.message || 'Anomalie non spécifiée'
    }));

    setCorrections(initialCorrections);
    setComments(reconciliation?.report?.metadata?.commentaires || '');
  }, [reconciliation, anomalies]);

  const handleCorrectionChange = useCallback((index, correction) => {
    setCorrections(prev => {
      const newCorrections = [...prev];
      newCorrections[index] = correction;
      return newCorrections;
    });
  }, []);

  const handleSubmit = useCallback(() => {
    onSave({
      corrections: corrections.filter(c => c && c.value),
      comments
    });
  }, [corrections, comments, onSave]);

  return (
    <div className="fixed inset-0 bg-gray-900 bg-opacity-50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl shadow-2xl p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-6 pb-4 border-b border-gray-200">
          <div>
            <h2 className="text-2xl font-bold text-gray-800 flex items-center">
              <FaEdit className="mr-3 text-indigo-600" />
              Ajuster le Rapprochement <span className="ml-2 px-3 py-1 bg-indigo-100 text-indigo-800 rounded-full text-sm">#{reconciliation.id}</span>
            </h2>
            <p className="text-gray-500 text-sm mt-1">
              {anomalies.length} anomalie(s) à corriger
            </p>
          </div>
          <button
            onClick={onCancel}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <FaTimes className="text-xl" />
          </button>
        </div>

        <div className="mb-8">
          <h3 className="text-lg font-semibold text-gray-700 mb-4 flex items-center">
            <FaExclamationTriangle className="mr-2 text-yellow-500" />
            Anomalies détectées
          </h3>

          {anomalies.length > 0 ? (
            <div className="space-y-4">
              {anomalies.map((anomaly, index) => (
                <AnomalyCorrection
                  key={anomaly.id || `anomaly-${index}`}
                  anomaly={anomaly}
                  index={index}
                  corrections={corrections}
                  onCorrectionChange={handleCorrectionChange}
                />
              ))}
            </div>
          ) : (
            <div className="p-4 bg-yellow-50 border-l-4 border-yellow-400 rounded-r-lg">
              <p className="text-yellow-800 flex items-center">
                <FaExclamationTriangle className="mr-3 text-xl" />
                Aucune anomalie trouvée dans ce rapprochement
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
            value={comments}
            onChange={(e) => setComments(e.target.value)}
            placeholder="Décrivez les corrections apportées..."
          />
        </div>

        <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
          <button
            onClick={onCancel}
            className="px-5 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg font-medium transition-colors flex items-center"
          >
            <FaTimes className="mr-2" />
            Annuler
          </button>
          <button
            onClick={handleSubmit}
            className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-medium transition-colors flex items-center"
            disabled={isLoading}
          >
            {isLoading ? (
              <FaSpinner className="animate-spin mr-2" />
            ) : (
              <FaSave className="mr-2" />
            )}
            Sauvegarder
          </button>
        </div>
      </div>
    </div>
  );
};

const Rapprochements = () => {
  const [facturesImportees, setFacturesImportees] = useState([]);
  const [relevesImportees, setRelevesImportees] = useState([]);
  const [reconciliations, setReconciliations] = useState([]);
  const [selectedReconciliation, setSelectedReconciliation] = useState(null);
  const [editingReconciliation, setEditingReconciliation] = useState(null);
  const [selectedFactureId, setSelectedFactureId] = useState(null);
  const [selectedReleveId, setSelectedReleveId] = useState(null);
  const [loading, setLoading] = useState({
    factures: true,
    releves: true,
    reconciliations: true,
    comparing: false,
    saving: false
  });
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [expandedSections, setExpandedSections] = useState({
    newReconciliation: true,
    reconciliationsList: true
  });

  useEffect(() => {
  const fetchInitialData = async () => {
    try {
      const [facturesResponse, relevesResponse] = await Promise.all([
        axios.get('http://localhost:8000/api/factures/', { 
          withCredentials: true,
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
          }
        }),
        axios.get('http://localhost:8000/api/banques/', { 
          withCredentials: true,
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
          }
        })
      ]);

      // Vérifiez et normalisez la réponse des factures
      let facturesData = [];
      if (Array.isArray(facturesResponse.data)) {
        facturesData = facturesResponse.data;
      } else if (facturesResponse.data.data && Array.isArray(facturesResponse.data.data)) {
        facturesData = facturesResponse.data.data;
      }

      // Vérifiez et normalisez la réponse des relevés
      let relevesData = [];
      if (Array.isArray(relevesResponse.data)) {
        relevesData = relevesResponse.data;
      } else if (relevesResponse.data.data && Array.isArray(relevesResponse.data.data)) {
        relevesData = relevesResponse.data.data;
      }

      setFacturesImportees(facturesData);
      setRelevesImportees(relevesData);
    } catch (error) {
      toast.error("Erreur lors du chargement des fichiers");
      console.error("Erreur détaillée:", error.response?.data);
    } finally {
      setLoading(prev => ({ ...prev, factures: false, releves: false }));
    }
  };

  fetchInitialData();
}, []);
  const fetchReconciliations = useCallback(async () => {
    setLoading(prev => ({ ...prev, reconciliations: true }));
    try {
      const response = await axios.get('http://localhost:5000/api/reconciliations', {
        withCredentials: true
      });

      const dataWithLoadingState = (response.data.data || []).map(rec => ({
        ...rec,
        loadingValidation: false,
        loadingAdjustment: false
      }));

      setReconciliations(dataWithLoadingState);
    } catch (err) {
      toast.error('Erreur lors du chargement des rapprochements');
    } finally {
      setLoading(prev => ({ ...prev, reconciliations: false }));
    }
  }, []);

  useEffect(() => {
    fetchReconciliations();
  }, [fetchReconciliations]);

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

      // Vérifiez si les fichiers sont bien trouvés avant de tenter d'accéder à leurs propriétés
      if (!selectedFacture) {
        toast.error("Facture sélectionnée introuvable.");
        return;
      }
      if (!selectedReleve) {
        toast.error("Relevé sélectionné introuvable.");
        return;
      }

      // --- DÉBUT DE LA MODIFICATION ---
      // Assurez-vous qu'un nom de fichier valide est fourni pour le relevé,
      // même si selectedReleve.filename est undefined ou null.
      const invoiceFilename = selectedFacture.filename || (selectedFacture.fichier_url ? selectedFacture.fichier_url.split('/').pop() : `facture_${selectedFacture.id}.pdf`);
        const statementFilename = selectedReleve.filename || (selectedReleve.fichier_url ? selectedReleve.fichier_url.split('/').pop() : `releve_${selectedReleve.id}.pdf`);

        console.log("URL Facture:", selectedFacture.fichier_url);
        console.log("URL Relevé:", selectedReleve.fichier_url);

        const invoiceFileObj = await fetchFile(selectedFacture.fichier_url, invoiceFilename);
        const statementFileObj = await fetchFile(selectedReleve.fichier_url, statementFilename);

        console.log("Objet Facture (File) :", invoiceFileObj);
        console.log("Nom Facture (File):", invoiceFileObj.name, "Type:", invoiceFileObj.type, "Taille:", invoiceFileObj.size);
        console.log("Objet Relevé (File) :", statementFileObj);
        console.log("Nom Relevé (File):", statementFileObj.name, "Type:", statementFileObj.type, "Taille:", statementFileObj.size);

        const formData = new FormData();
        // Here you append the actual File objects (blobs with filenames)
        formData.append('invoice', invoiceFileObj);    // This is the file for processing
        formData.append('statement', statementFileObj); // This is the file for processing
        formData.append('facture_id', selectedFactureId);
        formData.append('banque_id', selectedReleveId);

        const response = await axios.post('http://localhost:5000/api/compare-documents', formData, {
            headers: { 'Content-Type': 'multipart/form-data' }, // Correct header for FormData
            withCredentials: true
        });
      if (response.status === 200) {
        toast.success("Rapprochement effectué avec succès!", { id: toastId });
        fetchReconciliations(); // Rafraîchir la liste des rapprochements
      } else {
        toast.error("Le rapprochement a rencontré une erreur.", { id: toastId });
      }
    } catch (error) {
      // Amélioration du message d'erreur pour le débogage
      const errorMessage = error.response?.data?.message || error.message || "Erreur inconnue lors du rapprochement.";
      toast.error(errorMessage, { id: toastId });
      console.error("Erreur détaillée lors du rapprochement:", error.response?.data || error);
    } finally {
      setLoading(prev => ({ ...prev, comparing: false }));
      toast.dismiss(toastId); // S'assurer que le toast de chargement est fermé
    }
  }, [selectedFactureId, selectedReleveId, facturesImportees, relevesImportees, fetchReconciliations]);

  const handleValidateReconciliation = useCallback(async (reconciliationId) => {
    setReconciliations(prev => prev.map(rec =>
      rec.id === reconciliationId
        ? { ...rec, loadingValidation: true }
        : rec
    ));
    const toastId = toast.loading("Validation en cours...");

    try {
      const response = await axios.patch(
        `http://localhost:5000/api/reconciliations/${reconciliationId}`,
        { report: { metadata: { statut: 'Validé', date_validation: new Date().toISOString() } } },
        { withCredentials: true }
      );

      if (response.status === 200) {
        toast.success(`Le rapprochement #${reconciliationId} a été validé.`, { id: toastId });
        setReconciliations(prev => prev.map(rec =>
          rec.id === reconciliationId
            ? {
                ...rec,
                statut: 'Validé',
                report: {
                  ...rec.report,
                  metadata: {
                    ...rec.report?.metadata,
                    statut: 'Validé',
                    date_validation: new Date().toISOString()
                  }
                },
                loadingValidation: false
              }
            : rec
        ));
      } else {
        toast.error(`Erreur lors de la validation du rapprochement #${reconciliationId}.`, { id: toastId });
        setReconciliations(prev => prev.map(rec =>
          rec.id === reconciliationId
            ? { ...rec, loadingValidation: false }
            : rec
        ));
      }
    } catch (error) {
      toast.error(error.response?.data?.message || "Erreur lors de la validation.", { id: toastId });
      setReconciliations(prev => prev.map(rec =>
        rec.id === reconciliationId
          ? { ...rec, loadingValidation: false }
          : rec
      ));
    } finally {
      toast.dismiss(toastId);
    }
  }, []);
  
  const handleSaveCorrections = useCallback(async ({ corrections, comments }) => {
    if (!editingReconciliation) return;

    const reconciliationId = editingReconciliation.id;
    setLoading(prev => ({ ...prev, saving: true }));
    const toastId = toast.loading("Sauvegarde des corrections en cours...");

    try {
      const response = await axios.post(
        `http://localhost:5000/api/reconciliations/${reconciliationId}/correct`,
        {
          corrections,
          metadata: {
            statut: 'Ajusté',
            commentaires: comments,
            date_ajustement: new Date().toISOString(),
            corrections_appliquees: true
          }
        },
        { withCredentials: true }
      );

      if (response.status === 200) {
        toast.success(`Le rapprochement #${reconciliationId} a été ajusté avec succès.`, { id: toastId });
        setReconciliations(prev => prev.map(rec =>
          rec.id === reconciliationId
            ? {
                ...rec,
                report: {
                  ...rec.report,
                  metadata: {
                    ...rec.report?.metadata,
                    statut: 'Ajusté',
                    commentaires: comments,
                    date_ajustement: new Date().toISOString(),
                    corrections_appliquees: true
                  }
                },
                loadingAdjustment: false
              }
            : rec
        ));
        setEditingReconciliation(null);
      } else {
        toast.error(`Erreur lors de la sauvegarde des corrections pour le rapprochement #${reconciliationId}.`, { id: toastId });
        setReconciliations(prev => prev.map(rec =>
          rec.id === reconciliationId
            ? { ...rec, loadingAdjustment: false }
            : rec
        ));
      }
    } catch (error) {
      toast.error(error.response?.data?.message || "Erreur lors de la sauvegarde des corrections.", { id: toastId });
      setReconciliations(prev => prev.map(rec =>
        rec.id === reconciliationId
          ? { ...rec, loadingAdjustment: false }
          : rec
      ));
    } finally {
      setLoading(prev => ({ ...prev, saving: false }));
      toast.dismiss(toastId);
    }
  }, [editingReconciliation]);

  const fetchFile = async (url, filename) => {
    const response = await fetch(url);
    if (!response.ok) throw new Error("Échec du téléchargement");
    const blob = await response.blob();
    return new File([blob], filename);
  };

  const toggleSection = (section) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  const filteredReconciliations = reconciliations.filter(rec => {
    const matchesSearch = 
      rec.facture?.numero?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      rec.banque?.nom?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      rec.id.toString().includes(searchTerm);

    const matchesStatus = 
      statusFilter === 'all' || 
      (rec.report?.metadata?.statut || 'En attente').toLowerCase() === statusFilter.toLowerCase();

    return matchesSearch && matchesStatus;
  });

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

  return (
    <div className="container mx-auto p-4 md:p-6 lg:p-8">
      <header className="mb-8">
        <h1 className="text-3xl md:text-4xl font-bold text-gray-800 flex items-center">
          <div className="p-3 bg-indigo-100 rounded-lg mr-4 text-indigo-600">
            <FaFileAlt className="text-2xl" />
          </div>
          <div>
            Rapprochements Bancaires
            <p className="text-lg font-normal text-gray-600 mt-1">Comparez et validez vos factures et relevés bancaires</p>
          </div>
        </h1>
      </header>

      <div className="space-y-6">
        {/* Section Nouveau Rapprochement */}
        <section className="bg-white rounded-xl shadow-md overflow-hidden">
          <div 
            className="flex justify-between items-center p-6 cursor-pointer hover:bg-gray-50"
            onClick={() => toggleSection('newReconciliation')}
          >
            <h2 className="text-xl font-semibold text-gray-800 flex items-center">
              <div className="p-2 bg-purple-100 rounded-lg mr-4 text-purple-600">
                <FaRobot className="text-xl" />
              </div>
              Nouveau Rapprochement
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
                Sélectionnez une facture et un relevé bancaire pour effectuer un rapprochement automatique
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
                    Lancer le rapprochement automatique
                  </>
                )}
              </button>
            </div>
          )}
        </section>

        {/* Liste des Rapprochements */}
        <section className="bg-white rounded-xl shadow-md overflow-hidden">
          <div 
            className="flex justify-between items-center p-6 cursor-pointer hover:bg-gray-50"
            onClick={() => toggleSection('reconciliationsList')}
          >
            <h2 className="text-xl font-semibold text-gray-800 flex items-center">
              <div className="p-2 bg-indigo-100 rounded-lg mr-4 text-indigo-600">
                <FaFileAlt className="text-xl" />
              </div>
              Historique des Rapprochements
              <span className="ml-3 px-2.5 py-0.5 bg-gray-100 text-gray-800 rounded-full text-sm font-medium">
                {reconciliations.length}
              </span>
            </h2>
            {expandedSections.reconciliationsList ? (
              <FaChevronUp className="text-gray-500" />
            ) : (
              <FaChevronDown className="text-gray-500" />
            )}
          </div>
          
          {expandedSections.reconciliationsList && (
            <div className="px-6 pb-6">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
                <div className="relative flex-grow max-w-md">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <FaSearch className="text-gray-400" />
                  </div>
                  <input
                    type="text"
                    placeholder="Rechercher un rapprochement..."
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

              {loading.reconciliations ? (
                <div className="flex justify-center items-center py-12">
                  <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
                </div>
              ) : filteredReconciliations.length === 0 ? (
                <div className="text-center py-12">
                  <div className="mx-auto w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                    <FaFileAlt className="text-3xl text-gray-400" />
                  </div>
                  <h3 className="text-lg font-medium text-gray-700 mb-1">Aucun rapprochement trouvé</h3>
                  <p className="text-gray-500">Essayez de modifier vos critères de recherche</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          ID
                        </th>
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
                        <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {filteredReconciliations.map(reconciliation => (
                        <tr key={reconciliation.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                            #{reconciliation.id}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center">
                              {getFileIcon(reconciliation.facture?.filename)}
                              <span className="ml-2 text-sm font-medium text-gray-900">
                                {reconciliation.facture?.numero || 'N/A'}
                              </span>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            <div className="flex items-center">
                              <FaLandmark className="text-green-500 mr-2" />
                              {reconciliation.banque?.nom || 'N/A'}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            <div className="flex items-center">
                              <FaCalendarAlt className="text-gray-400 mr-2" />
                              {new Date(reconciliation.date).toLocaleDateString()}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                              reconciliation.report?.metadata?.statut === 'Validé'
                                ? 'bg-green-100 text-green-800'
                                : reconciliation.report?.metadata?.statut === 'Ajusté'
                                  ? 'bg-yellow-100 text-yellow-800'
                                  : 'bg-gray-100 text-gray-800'
                            }`}>
                              {reconciliation.report?.metadata?.statut || 'En attente'}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {reconciliation.anomalies && reconciliation.anomalies.length > 0 ? (
                              <span className="px-2.5 py-0.5 inline-flex items-center bg-red-100 text-red-800 rounded-full text-xs font-medium">
                                <FaExclamationTriangle className="mr-1" />
                                {reconciliation.anomalies.length}
                              </span>
                            ) : (
                              <span className="px-2.5 py-0.5 inline-flex items-center bg-green-100 text-green-800 rounded-full text-xs font-medium">
                                <FaCheckCircle className="mr-1" />
                                Aucune
                              </span>
                            )}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                            <div className="flex justify-end space-x-2">
                              <button
                                onClick={() => setSelectedReconciliation(reconciliation)}
                                className="p-2 text-indigo-600 hover:text-indigo-900 bg-indigo-50 rounded-lg hover:bg-indigo-100 transition-colors"
                                title="Voir les détails"
                              >
                                <FaSearch />
                              </button>

                              {(() => {
                                const statut = reconciliation.report?.metadata?.statut || 'En attente';

                                if (statut === 'Validé') {
                                  return null;
                                }

                                if (reconciliation.anomalies && reconciliation.anomalies.length > 0) {
                                  return (
                                    <button
                                      onClick={() => setEditingReconciliation(reconciliation)}
                                      className="p-2 text-yellow-600 hover:text-yellow-900 bg-yellow-50 rounded-lg hover:bg-yellow-100 transition-colors"
                                      title="Ajuster"
                                    >
                                      <FaEdit />
                                    </button>
                                  );
                                }

                                return (
                                  <button
                                    onClick={() => handleValidateReconciliation(reconciliation.id)}
                                    className="p-2 text-green-600 hover:text-green-900 bg-green-50 rounded-lg hover:bg-green-100 transition-colors"
                                    disabled={reconciliation.loadingValidation}
                                    title="Valider"
                                  >
                                    {reconciliation.loadingValidation ? (
                                      <FaSpinner className="animate-spin" />
                                    ) : (
                                      <FaCheckCircle />
                                    )}
                                  </button>
                                );
                              })()}
                            </div>
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

        {/* Détails de la réconciliation sélectionnée */}
        {selectedReconciliation && (
          <section className="bg-white rounded-xl shadow-md overflow-hidden">
            <div className="p-6 border-b border-gray-200 flex justify-between items-center">
              <h2 className="text-xl font-semibold text-gray-800 flex items-center">
                <div className="p-2 bg-blue-100 rounded-lg mr-4 text-blue-600">
                  <FaFileAlt className="text-xl" />
                </div>
                Détails du Rapprochement <span className="ml-2 px-2 py-0.5 bg-blue-100 text-blue-800 rounded-full text-sm">#{selectedReconciliation.id}</span>
              </h2>
              <button
                onClick={() => setSelectedReconciliation(null)}
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
                    Facture: {selectedReconciliation.facture?.numero || 'N/A'}
                  </h3>
                  <DataDisplay
                    data={selectedReconciliation.facture}
                    type="invoice"
                    anomalies={selectedReconciliation.anomalies?.filter(a => a.type === 'facture')}
                  />
                </div>

                <div className="bg-green-50 p-4 rounded-lg border border-green-100">
                  <h3 className="text-lg font-medium text-green-800 mb-3 flex items-center">
                    <FaLandmark className="mr-2" />
                    Relevé Bancaire: {selectedReconciliation.banque?.nom || 'N/A'}
                  </h3>
                  <DataDisplay
                    data={selectedReconciliation.banque}
                    type="statement"
                    anomalies={selectedReconciliation.anomalies?.filter(a => a.type === 'releve')}
                  />
                </div>
              </div>

              <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                <h3 className="text-lg font-medium text-gray-800 mb-3 flex items-center">
                  <FaFileAlt className="mr-2" />
                  Rapport Complet
                </h3>
                <DataDisplay
                  data={selectedReconciliation.report}
                  anomalies={selectedReconciliation.anomalies}
                />
              </div>

              <div className="flex justify-end">
                <button
                  onClick={() => setSelectedReconciliation(null)}
                  className="px-5 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg font-medium transition-colors"
                >
                  Fermer les détails
                </button>
              </div>
            </div>
          </section>
        )}

        {/* Modal d'édition des corrections */}
        {editingReconciliation && (
          <ReconciliationEditModal
            reconciliation={editingReconciliation}
            onSave={handleSaveCorrections}
            onCancel={() => setEditingReconciliation(null)}
            isLoading={loading.saving}
          />
        )}
      </div>
    </div>
  );
};

export default Rapprochements;
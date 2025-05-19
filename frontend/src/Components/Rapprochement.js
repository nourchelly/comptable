import React, { useState, useEffect, useCallback } from 'react';
import {
  FaFileAlt, FaSyncAlt, FaSpinner,
  FaRobot, FaExclamationTriangle,
  FaFileInvoice, FaLandmark, FaCheckCircle,
  FaEdit, FaSave, FaTimes, FaSearch
} from 'react-icons/fa';
import axios from 'axios';
import { toast } from "react-toastify";
import DataDisplay from './DataDisplay'; 
import AnomalyCorrection from './AnomalyCorrection';

// ... (Vos composants DataDisplay et AnomalyCorrection restent inchangés)

// Composant ReconciliationEditModal (inchangé)
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
    <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold text-gray-800 flex items-center">
            <FaEdit className="mr-2 text-yellow-500" />
            Ajuster le Rapprochement #{reconciliation.id}
          </h2>
          <button
            onClick={onCancel}
            className="text-gray-500 hover:text-gray-700"
          >
            <FaTimes />
          </button>
        </div>

        <div className="mb-6">
          <h3 className="text-lg font-medium text-gray-700 mb-3">
            Anomalies à corriger ({anomalies.length})
          </h3>

          {anomalies.length > 0 ? (
            anomalies.map((anomaly, index) => (
              <AnomalyCorrection
                key={anomaly.id || `anomaly-${index}`}
                anomaly={anomaly}
                index={index}
                corrections={corrections}
                onCorrectionChange={handleCorrectionChange}
              />
            ))
          ) : (
            <div className="p-4 bg-yellow-50 border border-yellow-200 rounded">
              <p className="text-yellow-800 flex items-center">
                <FaExclamationTriangle className="mr-2" />
                Aucune anomalie trouvée dans ce rapprochement
              </p>
            </div>
          )}
        </div>

        <div className="mb-6">
          <label htmlFor="correctionComments" className="block text-sm font-medium text-gray-700 mb-2">
            Commentaires sur les corrections
          </label>
          <textarea
            id="correctionComments"
            rows={3}
            className="w-full rounded-md border border-gray-300 py-2 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            value={comments}
            onChange={(e) => setComments(e.target.value)}
            placeholder="Ajoutez des commentaires sur les corrections apportées..."
          />
        </div>

        <div className="flex justify-end gap-2">
          <button
            onClick={onCancel}
            className="px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-800 rounded-md"
          >
            Annuler
          </button>
          <button
            onClick={handleSubmit}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md flex items-center"
            disabled={isLoading}
          >
            {isLoading ? (
              <FaSpinner className="animate-spin mr-2" />
            ) : (
              <FaSave className="mr-2" />
            )}
            Sauvegarder les corrections
          </button>
        </div>
      </div>
    </div>
  );
};

// Composant principal Rapprochements
const Rapprochements = () => {
  // États pour les données
  const [facturesImportees, setFacturesImportees] = useState([]);
  const [relevesImportees, setRelevesImportees] = useState([]);
  const [reconciliations, setReconciliations] = useState([]);
  const [selectedReconciliation, setSelectedReconciliation] = useState(null);
  const [editingReconciliation, setEditingReconciliation] = useState(null);

  // États pour la sélection et le chargement
  const [selectedFactureId, setSelectedFactureId] = useState(null);
  const [selectedReleveId, setSelectedReleveId] = useState(null);
  const [loading, setLoading] = useState({
    factures: true,
    releves: true,
    reconciliations: true,
    comparing: false,
    saving: false // Ajout d'un état de chargement pour la sauvegarde des corrections
  });

  // Charger les factures et relevés
  useEffect(() => {
    const fetchInitialData = async () => {
      try {
        const [facturesResponse, relevesResponse] = await Promise.all([
          axios.get('http://localhost:8000/api/factures/', { withCredentials: true }),
          axios.get('http://localhost:8000/api/banques/', { withCredentials: true })
        ]);

        setFacturesImportees(facturesResponse.data || []);
        setRelevesImportees(relevesResponse.data || []);
      } catch (error) {
        toast.error("Erreur lors du chargement des fichiers");
      } finally {
        setLoading(prev => ({ ...prev, factures: false, releves: false }));
      }
    };

    fetchInitialData();
  }, []);

  // Charger les reconciliations
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

  // Effectuer un rapprochement
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

      const formData = new FormData();
      formData.append('invoice', await fetchFile(selectedFacture.fichier_url, selectedFacture.filename));
      formData.append('statement', await fetchFile(selectedReleve.fichier_url, selectedReleve.filename));
      formData.append('facture_id', selectedFactureId);
      formData.append('banque_id', selectedReleveId);

      console.log('Début de la requête de rapprochement...'); // Ajout de ce log

      const response = await axios.post('http://localhost:5000/api/compare-documents', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
        withCredentials: true
      });

      console.log('Réponse reçue:', response); // Ajout de ce log

      if (response.status === 200) {
        console.log('Statut 200 détecté'); // Ajout de ce log
        toast.success("Rapprochement effectué avec succès!", { id: toastId });
        fetchReconciliations();
      } else {
        console.log('Statut non 200:', response.status); // Ajout de ce log
        toast.error("Le rapprochement a rencontré une erreur.", { id: toastId });
      }
    } catch (error) {
      console.error('Erreur lors du rapprochement:', error); // Log de l'erreur complète
      toast.error(error.response?.data?.message || "Erreur lors du rapprochement", { id: toastId });
    } finally {
      setLoading(prev => ({ ...prev, comparing: false }));
      toast.dismiss(toastId); // S'assurer que le toast de chargement disparaît toujours
    }
  }, [selectedFactureId, selectedReleveId, facturesImportees, relevesImportees, fetchReconciliations]);

  // Valider un rapprochement
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
              statut: 'Validé', // Ajout de la mise à jour directe du statut
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
  
  // Sauvegarder les corrections
  const handleSaveCorrections =useCallback(async ({ corrections, comments }) => {
    if (!editingReconciliation) return;

    const reconciliationId = editingReconciliation.id;
    setLoading(prev => ({ ...prev, saving: true })); // Activer l'état de chargement de la sauvegarde
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
      setLoading(prev => ({ ...prev, saving: false })); // Désactiver l'état de chargement de la sauvegarde
      toast.dismiss(toastId);
    }
  }, [editingReconciliation]);

  // Fonction utilitaire pour récupérer les fichiers
  const fetchFile = async (url, filename) => {
    const response = await fetch(url);
    if (!response.ok) throw new Error("Échec du téléchargement");
    const blob = await response.blob();
    return new File([blob], filename);
  };

  return (
    <div className="container mx-auto p-4 md:p-6">
      <header className="mb-8">
        <h1 className="text-2xl md:text-3xl font-bold flex items-center">
          <FaFileAlt className="mr-3 text-blue-600" />
          Rapprochements Bancaires
        </h1>
        <p className="text-gray-600">Comparez les factures et relevés bancaires</p>
      </header>

      <div className="space-y-8">
        {/* Section de rapprochement */}
        <section className="bg-white rounded-xl shadow-md p-6 md:p-8">
          <div className="mb-6">
            <h2 className="text-xl font-semibold text-gray-800 mb-2 flex items-center">
              <FaRobot className="mr-2 text-purple-500" />
              Nouveau Rapprochement
            </h2>
            <p className="text-gray-600 text-sm">
              Sélectionnez une facture et un relevé bancaire pour effectuer un rapprochement
            </p>
          </div>

          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center">
                  <FaFileInvoice className="mr-2 text-blue-500" />
                  Facture
                </label>
                <select
                  value={selectedFactureId || ''}
                  onChange={(e) => setSelectedFactureId(e.target.value || null)}
                  className="w-full rounded-md border border-gray-300 py-2 px-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  disabled={loading.factures}
                >
                  <option value="">-- Sélectionner --</option>
                  {loading.factures && <option disabled>Chargement...</option>}
                  {facturesImportees.map(facture => (
                    <option key={facture.id} value={facture.id}>
                      {facture.filename}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center">
                  <FaLandmark className="mr-2 text-green-500" />
                  Relevé bancaire
                </label>
                <select
                  value={selectedReleveId || ''}
                  onChange={(e) => setSelectedReleveId(e.target.value || null)}
                  className="w-full rounded-md border border-gray-300 py-2 px-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  disabled={loading.releves}
                >
                  <option value="">-- Sélectionner --</option>
                  {loading.releves && <option disabled>Chargement...</option>}
                  {relevesImportees.map(releve => (
                    <option key={releve.id} value={releve.id}>
                      {releve.filename}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="flex flex-wrap gap-3 pt-2">
              <button
                onClick={handleCompareDocuments}
                disabled={!selectedFactureId || !selectedReleveId || loading.comparing}
                className={`px-4 py-2 rounded-md flex items-center ${
                  !selectedFactureId || !selectedReleveId || loading.comparing
                    ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                    : 'bg-blue-600 hover:bg-blue-700 text-white'
                }`}
              >
                {loading.comparing ? (
                  <>
                    <FaSpinner className="animate-spin mr-2" />
                    Traitement...
                  </>
                ) : (
                  <>
                    <FaSyncAlt className="mr-2" />
                    Lancer le rapprochement
                  </>
                )}
              </button>
            </div>
          </div>
        </section>

        {/* Liste des Rapprochements */}
        <section className="bg-white shadow-md rounded-lg overflow-hidden">
          <h2 className="px-6 py-3 bg-gray-50 text-left text-lg font-semibold text-gray-700">
            Liste des Rapprochements
          </h2>
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
                  <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {loading.reconciliations ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-4 text-center">
                      <div className="flex justify-center items-center">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
                      </div>
                    </td>
                  </tr>
                ) : reconciliations.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-4 text-center text-gray-500">
                      Aucun rapprochement trouvé
                    </td>
                  </tr>
                ) : (
                  reconciliations.map(reconciliation => (
                    <tr key={reconciliation.id}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {reconciliation.facture?.numero || 'N/A'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {reconciliation.banque?.nom || 'N/A'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {new Date(reconciliation.date).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        <span className={`px-2 py-1 rounded ${
                          reconciliation.report?.metadata?.statut === 'Validé'
                            ? 'bg-green-100 text-green-800'
                            : reconciliation.report?.metadata?.statut === 'Ajusté'
                              ? 'bg-yellow-100 text-yellow-800'
                              : 'bg-gray-100 text-gray-800'
                        }`}>
                          {reconciliation.report?.metadata?.statut || 'En attente'}
                        </span>
                        {reconciliation.report?.metadata?.statut === 'Validé' && (
                          <FaCheckCircle className="inline-block ml-1 text-green-500" />
                        )}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500">
                        {reconciliation.anomalies && reconciliation.anomalies.length > 0 ? (
                          <span className="px-2 inline-flex ... bg-red-100 ...">
                            {reconciliation.anomalies.length} anomalie(s)
                          </span>
                        ) : (
                          <span className="px-2 inline-flex ... bg-green-100 ...">
                            Aucune
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <button
                          onClick={() => setSelectedReconciliation(reconciliation)}
                          className="text-indigo-600 hover:text-indigo-900 mr-2"
                        >
                          <FaSearch className="inline-block mr-1" />
                          Détails
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
                                className="text-yellow-600 hover:text-yellow-900 mr-2 px-3 py-1 bg-yellow-50 border border-yellow-200 rounded-md"
                              >
                                <FaEdit className="inline-block mr-1" />
                                Ajuster
                              </button>
                            );
                          }

                          return (
                            <button
                              onClick={() => handleValidateReconciliation(reconciliation.id)}
                              className="text-green-600 hover:text-green-900 px-3 py-1 bg-green-50 border border-green-200 rounded-md"
                              disabled={reconciliation.loadingValidation}
                            >
                              {reconciliation.loadingValidation ? (
                                <FaSpinner className="animate-spin inline-block mr-1" />
                              ) : (
                                <FaCheckCircle className="inline-block mr-1" />
                              )}
                              Valider
                            </button>
                          );
                        })()}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </section>

        {/* Détails de la réconciliation sélectionnée */}
        {selectedReconciliation && (
          <section className="bg-white rounded-xl shadow-md p-6 md:p-8">
            <h2 className="text-xl font-semibold text-gray-800 mb-4 flex items-center">
              <FaFileAlt className="mr-2 text-indigo-500" />
              Détails du Rapprochement #{selectedReconciliation.id}
            </h2>
            <DataDisplay
              title={`Facture: ${selectedReconciliation.facture?.numero || 'N/A'}`}
              data={selectedReconciliation.facture}
              type="invoice"
              anomalies={selectedReconciliation.anomalies?.filter(a => a.type === 'facture')}
            />
            <div className="my-4" />
            <DataDisplay
              title={`Relevé Bancaire: ${selectedReconciliation.banque?.nom || 'N/A'}`}
              data={selectedReconciliation.banque}
              type="statement"
              anomalies={selectedReconciliation.anomalies?.filter(a => a.type === 'releve')}
            />
            <div className="my-4" />
            <DataDisplay
              title="Rapport Complet"
              data={selectedReconciliation.report}
              anomalies={selectedReconciliation.anomalies}
            />
            <button
              onClick={() => setSelectedReconciliation(null)}
              className="mt-4 px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-800 rounded-md"
            >
              Fermer les détails
            </button>
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
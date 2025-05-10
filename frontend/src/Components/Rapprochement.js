import React, { useState, useEffect } from 'react';
import { 
  FaFileAlt, FaSyncAlt, FaFilter, FaDownload, 
  FaRobot, FaChartBar, FaExclamationTriangle,
  FaSpinner, FaCheckCircle, FaTimesCircle
} from 'react-icons/fa';
import axios from 'axios';
import { toast } from "react-toastify";

const Rapprochements = () => {
  // États
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(false);
  const [filters, setFilters] = useState({
    dateRange: 'last30days',
    status: 'all',
    type: 'all'
  });
  const [aiInsights, setAiInsights] = useState(null);
  const [files, setFiles] = useState({
    invoice: null,
    statement: null
  });
  const [comparisonResult, setComparisonResult] = useState(null);
  const [isComparing, setIsComparing] = useState(false);
  const [error, setError] = useState(null);

  // Charger les rapports
  useEffect(() => {
    fetchReports();
  }, [filters]);

  const fetchReports = async () => {
    setLoading(true);
    try {
      const response = await axios.get('/api/reconciliation-reports', {
        params: filters,
        withCredentials: true
      });
      setReports(response.data);
      analyzeWithAI(response.data);
    } catch (error) {
      console.error("Erreur:", error);
    } finally {
      setLoading(false);
    }
  };

  const analyzeWithAI = async (data) => {
    try {
      const response = await axios.post('/api/ai/analyze-reconciliation', {
        transactions: data
      });
      setAiInsights(response.data.insights);
    } catch (error) {
      console.error("Erreur AI:", error);
    }
  };

  const generateReport = async () => {
    setLoading(true);
    try {
      await axios.post('/api/generate-reconciliation');
      fetchReports();
    } catch (error) {
      console.error("Erreur génération:", error);
    }
  };

  const handleCompareDocuments = async () => {
    if (!files.invoice || !files.statement) {
      setError('Veuillez sélectionner les deux fichiers');
      return;
    }
  
    setError(null);
    setIsComparing(true);
    
    const formData = new FormData();
    formData.append('invoice', files.invoice);
    formData.append('statement', files.statement);
    
    // Afficher les informations des fichiers pour le débogage
    console.log("Fichiers à comparer:", {
      invoice: {
        name: files.invoice.name,
        type: files.invoice.type,
        size: files.invoice.size
      },
      statement: {
        name: files.statement.name,
        type: files.statement.type,
        size: files.statement.size
      }
    });
  
    try {
      toast.info("Comparaison en cours...", { autoClose: false, toastId: "comparison" });
      
      // IMPORTANT: Supprimé withCredentials: true et gardé la même configuration que pour l'extraction
      const response = await axios.post('http://localhost:5000/api/compare-documents', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
      
      toast.dismiss("comparison");
      toast.success("Comparaison effectuée avec succès!");
      
      console.log("Résultat de la comparaison:", response.data);
      setComparisonResult(response.data);
    } catch (err) {
      toast.dismiss("comparison");
      toast.error("Erreur lors de la comparaison des documents");
      
      console.error("Erreur détaillée:", {
        message: err.message,
        status: err.response?.status,
        statusText: err.response?.statusText,
        data: err.response?.data,
      });
      
      setError(err.response?.data?.error || 'Une erreur est survenue lors de la comparaison');
    } finally {
      setIsComparing(false);
    }
  };

  const clearComparison = () => {
    setFiles({ invoice: null, statement: null });
    setComparisonResult(null);
    setError(null);
  };

  return (
    <div className="container mx-auto p-6">
      <header className="mb-8">
        <h1 className="text-3xl font-bold flex items-center">
          <FaFileAlt className="mr-3 text-blue-600" />
          Rapprochements Bancaires
        </h1>
        <p className="text-gray-600">Rapports générés par intelligence artificielle</p>
      </header>

      {/* Section de comparaison manuelle */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-6 border border-gray-200">
        <h2 className="text-xl font-semibold flex items-center mb-4 text-gray-800">
          <FaFileAlt className="mr-2 text-blue-600" />
          Comparaison Manuelle
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Facture (PDF)
              {files.invoice && (
                <span className="ml-2 text-green-600 text-sm font-normal">
                  ✓ {files.invoice.name}
                </span>
              )}
            </label>
            <input
              type="file"
              accept=".pdf"
              onChange={(e) => setFiles({...files, invoice: e.target.files[0]})}
              className="block w-full text-sm text-gray-500
                file:mr-4 file:py-2 file:px-4
                file:rounded-md file:border-0
                file:text-sm file:font-semibold
                file:bg-blue-50 file:text-blue-700
                hover:file:bg-blue-100"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Relevé Bancaire (PDF)
              {files.statement && (
                <span className="ml-2 text-green-600 text-sm font-normal">
                  ✓ {files.statement.name}
                </span>
              )}
            </label>
            <input
              type="file"
              accept=".pdf"
              onChange={(e) => setFiles({...files, statement: e.target.files[0]})}
              className="block w-full text-sm text-gray-500
                file:mr-4 file:py-2 file:px-4
                file:rounded-md file:border-0
                file:text-sm file:font-semibold
                file:bg-blue-50 file:text-blue-700
                hover:file:bg-blue-100"
            />
          </div>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-50 text-red-700 rounded-md flex items-center">
            <FaTimesCircle className="mr-2" />
            {error}
          </div>
        )}

        <div className="flex gap-3">
          <button
            onClick={handleCompareDocuments}
            disabled={isComparing || !files.invoice || !files.statement}
            className={`px-4 py-2 rounded-lg flex items-center ${
              isComparing || !files.invoice || !files.statement
                ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                : 'bg-blue-600 hover:bg-blue-700 text-white'
            }`}
          >
            {isComparing ? (
              <>
                <FaSpinner className="animate-spin mr-2" />
                Comparaison en cours...
              </>
            ) : (
              <>
                <FaSyncAlt className="mr-2" />
                Comparer les documents
              </>
            )}
          </button>

          {comparisonResult && (
            <button
              onClick={clearComparison}
              className="px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-800 rounded-lg flex items-center"
            >
              Effacer
            </button>
          )}
        </div>
      </div>

      {/* Affichage des résultats */}
      {comparisonResult && (
        <div className="bg-white rounded-lg shadow-md p-6 mb-6 border border-gray-200">
          <h2 className="text-xl font-semibold mb-4 text-gray-800">Résultats de la comparaison</h2>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
            {/* Données de la facture */}
            <div className="border border-gray-200 rounded-lg p-4">
              <h3 className="font-medium text-lg mb-3 flex items-center text-blue-700">
                <FaFileAlt className="mr-2" />
                Données de la facture
              </h3>
              {comparisonResult.invoice_anomalies?.length > 0 && (
                <div className="mb-3">
                  <h4 className="font-medium text-red-600 flex items-center">
                    <FaExclamationTriangle className="mr-1" />
                    Anomalies détectées:
                  </h4>
                  <ul className="list-disc pl-5 text-sm text-red-600">
                    {comparisonResult.invoice_anomalies.map((anomaly, index) => (
                      <li key={index}>{anomaly}</li>
                    ))}
                  </ul>
                </div>
              )}
              <div className="bg-gray-50 p-3 rounded overflow-auto max-h-80">
                <pre className="text-xs md:text-sm">
                  {JSON.stringify(comparisonResult.invoice_data || {}, null, 2)}
                </pre>
              </div>
            </div>

            {/* Données du relevé */}
            <div className="border border-gray-200 rounded-lg p-4">
              <h3 className="font-medium text-lg mb-3 flex items-center text-green-700">
                <FaFileAlt className="mr-2" />
                Données du relevé
              </h3>
              {comparisonResult.statement_anomalies?.length > 0 && (
                <div className="mb-3">
                  <h4 className="font-medium text-red-600 flex items-center">
                    <FaExclamationTriangle className="mr-1" />
                    Anomalies détectées:
                  </h4>
                  <ul className="list-disc pl-5 text-sm text-red-600">
                    {comparisonResult.statement_anomalies.map((anomaly, index) => (
                      <li key={index}>{anomaly}</li>
                    ))}
                  </ul>
                </div>
              )}
              <div className="bg-gray-50 p-3 rounded overflow-auto max-h-80">
                <pre className="text-xs md:text-sm">
                  {JSON.stringify(comparisonResult.statement_data || {}, null, 2)}
                </pre>
              </div>
            </div>
          </div>

          {/* Résultats du rapprochement */}
          <div className="border border-gray-200 rounded-lg p-4 mb-6">
            <h3 className="font-medium text-lg mb-3 flex items-center text-purple-700">
              <FaChartBar className="mr-2" />
              Résultats du rapprochement
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
              <div className={`p-3 rounded-lg ${
                comparisonResult.verification?.paiement_trouve 
                  ? 'bg-green-100 text-green-800' 
                  : 'bg-red-100 text-red-800'
              }`}>
                <p className="font-medium">Paiement trouvé:</p>
                <p>{comparisonResult.verification?.paiement_trouve ? 'Oui' : 'Non'}</p>
              </div>
              <div className={`p-3 rounded-lg ${
                comparisonResult.verification?.montant_correspond 
                  ? 'bg-green-100 text-green-800' 
                  : 'bg-red-100 text-red-800'
              }`}>
                <p className="font-medium">Montant correspond:</p>
                <p>{comparisonResult.verification?.montant_correspond ? 'Oui' : 'Non'}</p>
              </div>
              <div className={`p-3 rounded-lg ${
                comparisonResult.verification?.date_correspond 
                  ? 'bg-green-100 text-green-800' 
                  : 'bg-red-100 text-red-800'
              }`}>
                <p className="font-medium">Date correspond:</p>
                <p>{comparisonResult.verification?.date_correspond ? 'Oui' : 'Non'}</p>
              </div>
            </div>
            
            {comparisonResult.verification?.anomalies?.length > 0 ? (
              <div className="bg-yellow-50 p-3 rounded">
                <h4 className="font-medium text-yellow-800 flex items-center">
                  <FaExclamationTriangle className="mr-2" />
                  Anomalies détectées:
                </h4>
                <ul className="list-disc pl-5 text-sm text-yellow-800">
                  {comparisonResult.verification.anomalies.map((anomaly, index) => (
                    <li key={index}>{anomaly}</li>
                  ))}
                </ul>
              </div>
            ) : (
              <div className="bg-green-50 p-3 rounded text-green-800">
                Aucune anomalie détectée dans le rapprochement
              </div>
            )}
          </div>

          {/* Analyse IA */}
          <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
            <h3 className="font-medium text-lg mb-3 flex items-center text-blue-800">
              <FaRobot className="mr-2" />
              Analyse Intelligente
            </h3>
            <div className="whitespace-pre-line text-sm bg-white p-3 rounded border border-blue-100">
              {comparisonResult.analysis || "Aucune analyse disponible"}
            </div>
          </div>
        </div>
      )}

      {/* Contrôles principaux */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <div className="flex flex-wrap justify-between items-center gap-4">
          <button 
            onClick={generateReport}
            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg flex items-center"
            disabled={loading}
          >
            <FaSyncAlt className={`mr-2 ${loading ? 'animate-spin' : ''}`} />
            {loading ? 'Génération...' : 'Nouveau Rapprochement'}
          </button>
          
          <div className="flex gap-3">
            <select 
              value={filters.dateRange}
              onChange={(e) => setFilters({...filters, dateRange: e.target.value})}
              className="border rounded-lg px-3 py-2"
            >
              <option value="last7days">7 derniers jours</option>
              <option value="last30days">30 derniers jours</option>
              <option value="last90days">90 derniers jours</option>
              <option value="custom">Période personnalisée</option>
            </select>
            
            <button className="border rounded-lg px-4 py-2 flex items-center">
              <FaFilter className="mr-2" /> Filtres
            </button>
          </div>
        </div>
      </div>

      {/* Insights AI */}
      {aiInsights && (
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg shadow-md p-6 mb-6">
          <h2 className="text-xl font-semibold flex items-center mb-4">
            <FaRobot className="mr-2 text-indigo-600" />
            Analyse Intelligente
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Carte Statistiques */}
            <div className="bg-white p-4 rounded-lg shadow-sm">
              <h3 className="font-medium flex items-center">
                <FaChartBar className="mr-2 text-blue-500" />
                Statistiques
              </h3>
              <ul className="mt-2 space-y-1">
                <li>• {aiInsights.matched || 0} opérations concordantes</li>
                <li>• {aiInsights.unmatched || 0} écarts détectés</li>
                <li>• {aiInsights.accuracy || 0}% de précision</li>
              </ul>
            </div>
            
            {/* Carte Alertes */}
            <div className="bg-white p-4 rounded-lg shadow-sm">
              <h3 className="font-medium flex items-center">
                <FaExclamationTriangle className="mr-2 text-yellow-500" />
                Alertes
              </h3>
              <ul className="mt-2 space-y-1">
                {(aiInsights.alerts || []).slice(0, 3).map((alert, index) => (
                  <li key={index}>• {alert.message || alert}</li>
                ))}
              </ul>
            </div>
            
            {/* Carte Recommandations */}
            <div className="bg-white p-4 rounded-lg shadow-sm">
              <h3 className="font-medium flex items-center">
                <FaCheckCircle className="mr-2 text-green-500" />
                Recommandations
              </h3>
              <ul className="mt-2 space-y-1">
                {(aiInsights.recommendations || []).slice(0, 3).map((rec, index) => (
                  <li key={index}>• {rec}</li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* Liste des rapports */}
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Période</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Statut</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Correspondance</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {loading ? (
              <tr>
                <td colSpan="5" className="px-6 py-4 text-center">
                  <FaSpinner className="animate-spin mx-auto text-blue-600" />
                </td>
              </tr>
            ) : reports.length > 0 ? (
              reports.map((report) => (
                <tr key={report.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    {new Date(report.date).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {report.periodStart} au {report.periodEnd}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 py-1 rounded-full text-xs ${
                      report.status === 'completed' 
                        ? 'bg-green-100 text-green-800' 
                        : report.status === 'pending'
                        ? 'bg-yellow-100 text-yellow-800'
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {report.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="w-24 bg-gray-200 rounded-full h-2.5 mr-2">
                        <div 
                          className="bg-blue-600 h-2.5 rounded-full" 
                          style={{ width: `${report.matchRate}%` }}
                        ></div>
                      </div>
                      <span>{report.matchRate}%</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <button className="text-blue-600 hover:text-blue-800 mr-3">
                      <FaDownload />
                    </button>
                    <button className="text-gray-600 hover:text-gray-800">
                      Voir détails
                    </button>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="5" className="px-6 py-4 text-center text-gray-500">
                  Aucun rapport disponible
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default Rapprochements;
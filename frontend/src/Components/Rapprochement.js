import React, { useState, useEffect } from 'react';
import { 
  FaFileAlt, FaSyncAlt, FaFilter, FaDownload, 
  FaRobot, FaChartBar, FaExclamationTriangle,FaSpinner,FaCheckCircle
} from 'react-icons/fa';
import axios from 'axios';

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
      analyzeWithAI(response.data); // Analyse automatique
    } catch (error) {
      console.error("Erreur:", error);
    } finally {
      setLoading(false);
    }
  };

  // Analyse AI
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

  // Générer nouveau rapport
  const generateReport = async () => {
    setLoading(true);
    try {
      await axios.post('/api/generate-reconciliation');
      fetchReports(); // Rafraîchir la liste
    } catch (error) {
      console.error("Erreur génération:", error);
    }
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
                <li>• {aiInsights.matched} opérations concordantes</li>
                <li>• {aiInsights.unmatched} écarts détectés</li>
                <li>• {aiInsights.accuracy}% de précision</li>
              </ul>
            </div>
            
            {/* Carte Alertes */}
            <div className="bg-white p-4 rounded-lg shadow-sm">
              <h3 className="font-medium flex items-center">
                <FaExclamationTriangle className="mr-2 text-yellow-500" />
                Alertes
              </h3>
              <ul className="mt-2 space-y-1">
                {aiInsights.alerts.slice(0, 3).map((alert, index) => (
                  <li key={index}>• {alert.message}</li>
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
                {aiInsights.recommendations.slice(0, 3).map((rec, index) => (
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
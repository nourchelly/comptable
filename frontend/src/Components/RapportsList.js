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
  FaChevronDown,
  FaChevronUp,
  FaTimesCircle
} from 'react-icons/fa';
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
    <div className="mb-6">
      <div className="flex justify-between items-center mb-3">
        <h4 className="text-sm font-medium text-gray-500">{title}</h4>
        {expandable && (
          <button
            onClick={() => setExpanded(!expanded)}
            className="text-gray-500 hover:text-gray-700"
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
                    {column.accessor(item)}
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

const RapportsList = ({ onSelectRapport }) => {
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

  const fetchRapports = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (filters.statut) params.append('statut', filters.statut);
      if (filters.dateDebut) params.append('dateDebut', filters.dateDebut);
      if (filters.dateFin) params.append('dateFin', filters.dateFin);

      const response = await axios.get(`http://localhost:5000/api/rapports?${params.toString()}`);
      const data = response.data.success ? response.data.data || [] : [];
      setRapports(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Erreur de chargement des rapports:', err);
      toast.error('Erreur lors du chargement des rapports');
      setRapports([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRapports();
  }, [filters.statut, filters.dateDebut, filters.dateFin]);

  const fetchRapportDetails = async (rapportId) => {
    setLoadingDetails(true);
    setSelectedRapportDetails(null);
    try {
      const response = await axios.get(`http://localhost:5000/api/rapports/${rapportId}`);
      setSelectedRapportDetails(response.data);
      setShowDetailsModal(true);
    } catch (err) {
      console.error('Erreur de chargement des détails:', err);
      toast.error('Erreur lors du chargement des détails du rapport');
    } finally {
      setLoadingDetails(false);
    }
  };

  const confirmDeleteRapport = (rapportId) => {
    setRapportToDelete(rapportId);
    setShowDeleteConfirmModal(true);
  };

  const handleDeleteRapport = async () => {
    if (!rapportToDelete) return;

    try {
      await axios.delete(`http://localhost:5000/api/rapports/${rapportToDelete}`);
      fetchRapports();
      toast.success('Rapport supprimé avec succès');
    } catch (err) {
      console.error('Erreur lors de la suppression:', err);
      toast.error('Erreur lors de la suppression du rapport');
    } finally {
      setShowDeleteConfirmModal(false);
      setRapportToDelete(null);
    }
  };

  const handleExport = async (rapportId, type) => {
    try {
      const endpoint = `http://localhost:5000/api/rapports/${rapportId}/${type}`;
      const response = await axios.get(endpoint, { responseType: 'blob' });

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `rapport-${rapportId}-${new Date().toISOString().slice(0, 10)}.${type}`);
      document.body.appendChild(link);
      link.click();
      link.remove();

      toast.success(`Export ${type.toUpperCase()} généré avec succès`);
    } catch (err) {
      console.error(`Erreur d'export ${type}:`, err);
      toast.error(`Erreur lors de l'export ${type}`);
    }
  };

  const getFactureNumero = (rapport) => rapport?.facture?.numero || rapport?.facture_numero || 'N/A';
  const getBanqueNumero = (rapport) => rapport?.banque?.numero || rapport?.banque_numero || 'N/A';

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    try {
      return new Date(dateString).toLocaleDateString('fr-FR');
    } catch {
      return 'Date invalide';
    }
  };

  const formatCurrency = (amount, currency) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: currency || 'EUR'
    }).format(amount || 0);
  };

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters(prev => ({ ...prev, [name]: value }));
  };

  const filteredRapports = useMemo(() => {
    const searchTerm = filters.search.toLowerCase();
    return rapports.filter(rapport => {
      const matchesSearch = (
        (rapport.titre || '').toLowerCase().includes(searchTerm) ||
        getFactureNumero(rapport).toLowerCase().includes(searchTerm) ||
        getBanqueNumero(rapport).toLowerCase().includes(searchTerm)
      );
      const matchesStatus = !filters.statut || rapport.statut === filters.statut;
      return matchesSearch && matchesStatus;
    });
  }, [rapports, filters.search, filters.statut]);

  const stats = useMemo(() => ({
    complet: filteredRapports.filter(r => r.statut === 'complet').length,
    incomplet: filteredRapports.filter(r => r.statut === 'incomplet').length,
    anomalie: filteredRapports.filter(r => r.statut === 'anomalie').length,
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
                {Object.entries(STATUS_CONFIG).map(([key, { label }]) => (
                  <option key={key} value={key}>{label}</option>
                ))}
              </select>
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
                            <button
                              onClick={() => openDetails(rapport)}
                              className="p-2 text-indigo-600 hover:text-indigo-900 rounded-lg hover:bg-gray-100"
                              title="Voir détails"
                            >
                              <FaEye />
                            </button>
                            <button
                              onClick={() => navigate(`/dashboardcomptable/modif_rapport/${rapport.id}`)}
                              className="p-2 text-blue-600 hover:text-blue-900 rounded-lg hover:bg-gray-100"
                              title="Modifier"
                            >
                              <FaEdit />
                            </button>
                            <button
                              onClick={() => confirmDeleteRapport(rapport.id)}
                              className="p-2 text-red-600 hover:text-red-900 rounded-lg hover:bg-gray-100"
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
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-6xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center border-b p-4">
              <h3 className="text-lg font-semibold text-gray-800">Détails du rapport</h3>
              <button
                onClick={() => setShowDetailsModal(false)}
                className="text-gray-400 hover:text-gray-600"
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
                    { header: 'Numéro de banque', accessor: item => getBanqueNumero(item) },
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
                    }
                  ]}
                />

                {/* Détails de la facture */}
                {selectedRapportDetails.facture && (
                  <>
                    <TableSection
                      title="Détails de la facture"
                      data={[selectedRapportDetails.facture]}
                      columns={[
                        { header: 'Numéro', accessor: fact => fact.numero || 'N/A' },
                        { header: 'Émetteur', accessor: fact => fact.emetteur || 'N/A' },
                        { header: 'Date émission', accessor: fact => formatDate(fact.date_emission) },
                        { header: 'Montant total', accessor: fact => formatCurrency(fact.montant_total, fact.devise) },
                        { header: 'Client', accessor: fact => fact.client?.nom || 'N/A' }
                      ]}
                    />

                    {selectedRapportDetails.facture.items?.length > 0 && (
                      <TableSection
                        title="Articles de la facture"
                        data={selectedRapportDetails.facture.items}
                        columns={[
                          { header: 'Description', accessor: item => item.description || 'N/A' },
                          { header: 'Quantité', accessor: item => item.quantite || 0 },
                          { header: 'Prix unitaire', accessor: item => formatCurrency(item.prix_unitaire, selectedRapportDetails.facture.devise) },
                          { header: 'Montant ligne', accessor: item => formatCurrency(item.montant_ligne, selectedRapportDetails.facture.devise) }
                        ]}
                        expandable
                      />
                    )}
                  </>
                )}

                {/* Détails du relevé bancaire */}
                {selectedRapportDetails.banque && (
                  <>
                    <TableSection
                      title="Détails du relevé bancaire"
                      data={[selectedRapportDetails.banque]}
                      columns={[
                        { header: 'Numéro de compte', accessor: banque => banque.numero_compte || 'N/A' },
                        { header: 'Nom de la banque', accessor: banque => banque.nom_banque || 'N/A' },
                        { header: 'Date début', accessor: banque => formatDate(banque.date_debut) },
                        { header: 'Date fin', accessor: banque => formatDate(banque.date_fin) }
                      ]}
                    />

                    {selectedRapportDetails.banque.transactions?.length > 0 && (
                      <TableSection
                        title="Transactions bancaires"
                        data={selectedRapportDetails.banque.transactions}
                        columns={[
                          { header: 'Date', accessor: tr => formatDate(tr.date) },
                          { header: 'Description', accessor: tr => tr.description || 'N/A' },
                          { header: 'Montant', accessor: tr => formatCurrency(tr.montant, tr.devise) },
                          { header: 'Référence', accessor: tr => tr.reference || 'N/A' }
                        ]}
                        expandable
                      />
                    )}
                  </>
                )}

                {/* Rapprochement */}
                {selectedRapportDetails.rapprochement && (
                  <TableSection
                    title="Rapprochement"
                    data={[selectedRapportDetails.rapprochement]}
                    columns={[
                      { header: 'Statut', accessor: rap => rap.statut_rapprochement || 'N/A' },
                      { header: 'Transactions rapprochées', accessor: rap => rap.transactions_rapprochees_count || 0 },
                      { header: 'Écart total', accessor: rap => formatCurrency(rap.ecart_total, rap.devise_ecart) },
                      { header: 'Détails écart', accessor: rap => rap.details_ecart || 'Aucun détail' }
                    ]}
                  />
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
                  />
                )}

                {/* Actions */}
                <div className="mt-6">
                  <h4 className="text-sm font-medium text-gray-500 mb-3">Actions</h4>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    <button
                      onClick={() => {
                        setShowDetailsModal(false);
                        navigate(`/dashboardcomptable/modif_rapport/${selectedRapportDetails.id}`);
                      }}
                      className="flex items-center justify-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                    >
                      <FaEdit className="mr-2" />
                      Modifier
                    </button>
                    <button
                      onClick={() => handleExport(selectedRapportDetails.id, 'pdf')}
                      className="flex items-center justify-center px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
                    >
                      <FaFilePdf className="mr-2" />
                      Export PDF
                    </button>
                    <button
                      onClick={() => handleExport(selectedRapportDetails.id, 'excel')}
                      className="flex items-center justify-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
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
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-sm">
            <div className="p-6 text-center">
              <FaTrash className="text-red-500 text-4xl mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Confirmer la suppression</h3>
              <p className="text-sm text-gray-500 mb-6">
                Êtes-vous sûr de vouloir supprimer ce rapport ? Cette action est irréversible.
              </p>
              <div className="flex justify-center space-x-4">
                <button
                  onClick={() => setShowDeleteConfirmModal(false)}
                  className="px-5 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
                >
                  Annuler
                </button>
                <button
                  onClick={handleDeleteRapport}
                  className="px-5 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
                >
                  Supprimer
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default RapportsList;
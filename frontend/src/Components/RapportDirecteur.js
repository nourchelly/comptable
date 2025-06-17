import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { FaEye, FaSync, FaTimesCircle ,FaChevronUp,
  FaFilePdf,
  FaChevronDown } from 'react-icons/fa';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

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
  const [rapports, setRapports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedRapportDetails, setSelectedRapportDetails] = useState(null);
  const [loadingDetails, setLoadingDetails] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);

  const API_BASE_URL = 'http://localhost:5000/api';

  const fetchRapports = async () => {
    setLoading(true);
    try {
      const response = await axios.get(`${API_BASE_URL}/rapports`);
      const data = response.data.success ? response.data.data || [] : [];
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
  }, []);

  const fetchRapportDetails = async (rapportId) => {
    setLoadingDetails(true);
    setSelectedRapportDetails(null);
    try {
      const response = await axios.get(`${API_BASE_URL}/rapports/${rapportId}`);
      setSelectedRapportDetails(response.data);
      setShowDetailsModal(true);
    } catch (err) {
      console.error('Erreur de chargement des détails:', err);
      toast.error('Erreur lors du chargement des détails du rapport.');
    } finally {
      setLoadingDetails(false);
    }
  };

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
            <button
              onClick={fetchRapports}
              className="flex items-center px-4 py-2 bg-white border border-gray-300 rounded-lg shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              <FaSync className={`mr-2 ${loading ? 'animate-spin' : ''}`} />
              Actualiser
            </button>
          </div>
        </div>

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
                ) : rapports.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-6 py-6 text-center text-gray-500">
                      <div className="flex flex-col items-center justify-center">
                        <FaFilePdf className="text-gray-400 text-3xl mb-2" />
                        <span>Aucun rapport disponible.</span>
                      </div>
                    </td>
                  </tr>
                ) : (
                  rapports.map((rapport) => {
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
                              onClick={() => fetchRapportDetails(rapport.id)}
                              className="p-2 text-indigo-600 hover:text-indigo-900 rounded-lg hover:bg-gray-100 transition-colors"
                              title="Voir détails"
                            >
                              <FaEye />
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

        {/* Modal de détails */}
        {showDetailsModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg shadow-xl w-full max-w-6xl max-h-[90vh] overflow-y-auto">
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

                  {/* Rapprochement */}
                  {selectedRapportDetails.rapprochement ? (
                    <TableSection
                      title="Rapprochement"
                      data={[selectedRapportDetails.rapprochement]}
                      columns={[
                        { header: 'Statut Rapprochement', accessor: rap => rap.statut_rapprochement || 'N/A' },
                        { header: 'Transactions rapprochées', accessor: rap => rap.transactions_rapprochees_count || 0 },
                        { header: 'Écart total', accessor: rap => formatCurrency(rap.ecart_total, rap.devise_ecart) },
                        { header: 'Détails écart', accessor: rap => rap.details_ecart || 'Aucun détail' }
                      ]}
                    />
                  ) : (
                    <p className="text-sm text-gray-500 mb-6">Aucune information de rapprochement.</p>
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
                </div>
              ) : (
                <div className="p-6 text-center text-red-500">
                  Impossible de charger les détails du rapport.
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default RapportsList;
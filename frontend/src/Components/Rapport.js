import { useState, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import { 
  FaFileAlt, FaFileInvoice, FaFileInvoiceDollar, 
  FaSearch, FaTrashAlt, FaFilePdf, 
  FaFileExcel, FaDownload, FaTimesCircle,FaEye,
} from 'react-icons/fa';

export default function RapportList() {
  const [rapports, setRapports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedRapport, setSelectedRapport] = useState(null);
  const [filterType, setFilterType] = useState('tous'); // 'tous', 'facture', 'releve'

  useEffect(() => {
    const fetchRapports = async () => {
      try {
        const { data } = await axios.get('/api/rapports/', {
          withCredentials: true
        });
        setRapports(data);
      } catch (err) {
        toast.error(`Erreur: ${err.response?.data?.error || err.message}`);
      } finally {
        setLoading(false);
      }
    };
    fetchRapports();
  }, []);

  const handleDelete = async (id) => {
    if (!window.confirm('Supprimer ce rapport ?')) return;
    
    try {
      await axios.delete(`/api/rapports/${id}`, { withCredentials: true });
      setRapports(rapports.filter(r => r.id !== id));
      toast.success('Rapport supprimé');
    } catch (err) {
      toast.error(`Erreur: ${err.response?.data?.error || err.message}`);
    }
  };

  const exportReport = async (id, format) => {
    try {
      const response = await axios.get(`/api/rapports/${id}/export/${format}`, {
        responseType: 'blob',
        withCredentials: true
      });
      
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `rapport_${id}.${format}`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (err) {
      toast.error(`Erreur export: ${err.message}`);
    }
  };

  const filteredRapports = rapports.filter(r => {
    // Filtre par type
    const typeMatch = filterType === 'tous' || r.type === filterType;
    // Filtre par recherche
    const searchMatch = 
      r.document_numero?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.data?.fournisseur?.nom?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.data?.banque?.toLowerCase().includes(searchTerm.toLowerCase());
    
    return typeMatch && searchMatch;
  });

  const renderDocumentIcon = (type) => {
    switch(type) {
      case 'facture':
        return <FaFileInvoice className="text-blue-500 mr-2" />;
      case 'releve':
        return <FaFileInvoiceDollar className="text-green-500 mr-2" />;
      default:
        return <FaFileAlt className="text-gray-500 mr-2" />;
    }
  };

  const renderDetailContent = () => {
    if (!selectedRapport) return null;

    switch(selectedRapport.type) {
      case 'facture':
        return (
          <>
            <div className="grid grid-cols-2 gap-4 mb-6">
              <div>
                <h4 className="font-bold mb-2">Informations Facture</h4>
                <p>Numéro: {selectedRapport.data?.facture_info?.numero || 'N/A'}</p>
                <p>Date: {selectedRapport.data?.facture_info?.date || 'N/A'}</p>
                <p>Montant TTC: {selectedRapport.data?.facture_info?.montant_ttc || 'N/A'} €</p>
              </div>
              <div>
                <h4 className="font-bold mb-2">Fournisseur</h4>
                <p>{selectedRapport.data?.fournisseur?.nom || 'N/A'}</p>
                <p>{selectedRapport.data?.fournisseur?.adresse || 'N/A'}</p>
              </div>
            </div>

            <h4 className="font-bold mb-2">Lignes de facture</h4>
            <table className="min-w-full divide-y divide-gray-200 mb-6">
              {/* ... Tableau des lignes de facture ... */}
            </table>
          </>
        );
      
      case 'releve':
        return (
          <>
            <div className="grid grid-cols-2 gap-4 mb-6">
              <div>
                <h4 className="font-bold mb-2">Informations Relevé</h4>
                <p>Banque: {selectedRapport.data?.banque || 'N/A'}</p>
                <p>Compte: {selectedRapport.data?.compte || 'N/A'}</p>
                <p>Période: {selectedRapport.data?.periode || 'N/A'}</p>
              </div>
              <div>
                <h4 className="font-bold mb-2">Solde</h4>
                <p>Initial: {selectedRapport.data?.solde_initial || 'N/A'} €</p>
                <p>Final: {selectedRapport.data?.solde_final || 'N/A'} €</p>
              </div>
            </div>

            <h4 className="font-bold mb-2">Transactions</h4>
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left">Date</th>
                  <th className="px-6 py-3 text-left">Libellé</th>
                  <th className="px-6 py-3 text-left">Montant</th>
                  <th className="px-6 py-3 text-left">Bénéficiaire</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {selectedRapport.data?.transactions?.map((t, i) => (
                  <tr key={i}>
                    <td className="px-6 py-4">{t.date}</td>
                    <td className="px-6 py-4">{t.libelle}</td>
                    <td className={`px-6 py-4 ${
                      t.montant < 0 ? 'text-red-600' : 'text-green-600'
                    }`}>
                      {t.montant} €
                    </td>
                    <td className="px-6 py-4">{t.beneficiaire || 'N/A'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </>
        );
      
      default:
        return <p className="text-gray-500">Type de document non supporté</p>;
    }
  };

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-6">Gestion des Rapports</h1>

      <div className="mb-6 grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="relative">
          <FaSearch className="absolute left-3 top-3 text-gray-400" />
          <input
            type="text"
            placeholder="Rechercher par numéro, fournisseur ou banque..."
            className="pl-10 pr-4 py-2 border rounded w-full"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        
        <div className="flex items-center space-x-4">
          <label className="whitespace-nowrap">Filtrer par type :</label>
          <select 
            className="border rounded px-3 py-2 flex-grow"
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
          >
            <option value="tous">Tous les types</option>
            <option value="facture">Factures</option>
            <option value="releve">Relevés bancaires</option>
          </select>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="min-w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left">Type</th>
              <th className="px-6 py-3 text-left">Référence</th>
              <th className="px-6 py-3 text-left">Date création</th>
              <th className="px-6 py-3 text-left">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {loading ? (
              <tr>
                <td colSpan="4" className="px-6 py-4 text-center">
                  Chargement...
                </td>
              </tr>
            ) : filteredRapports.length === 0 ? (
              <tr>
                <td colSpan="4" className="px-6 py-4 text-center">
                  {searchTerm || filterType !== 'tous' 
                    ? 'Aucun résultat correspondant' 
                    : 'Aucun rapport disponible'}
                </td>
              </tr>
            ) : (
              filteredRapports.map(rapport => (
                <tr key={rapport.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4">
                    <div className="flex items-center">
                      {renderDocumentIcon(rapport.type)}
                      <span className="capitalize">{rapport.type}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    {rapport.document_numero || 'N/A'}
                    {rapport.type === 'releve' && rapport.data?.banque && (
                      <div className="text-sm text-gray-500">
                        {rapport.data.banque}
                      </div>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    {new Date(rapport.created_at).toLocaleString()}
                  </td>
                  <td className="px-6 py-4 space-x-2">
                    <button
                      onClick={() => setSelectedRapport(rapport)}
                      className="text-blue-600 hover:text-blue-800 p-1"
                      title="Voir détails"
                    >
                      <FaEye />
                    </button>
                    <button
                      onClick={() => exportReport(rapport.id, 'pdf')}
                      className="text-red-600 hover:text-red-800 p-1"
                      title="Export PDF"
                    >
                      <FaFilePdf />
                    </button>
                    <button
                      onClick={() => exportReport(rapport.id, 'excel')}
                      className="text-green-600 hover:text-green-800 p-1"
                      title="Export Excel"
                    >
                      <FaFileExcel />
                    </button>
                    <button
                      onClick={() => handleDelete(rapport.id)}
                      className="text-red-600 hover:text-red-800 p-1"
                      title="Supprimer"
                    >
                      <FaTrashAlt />
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Modal de détail */}
      {selectedRapport && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-6xl max-h-[90vh] overflow-hidden">
            <div className="flex justify-between items-center p-4 border-b">
              <div>
                <h3 className="text-lg font-semibold">
                  {selectedRapport.type === 'facture' 
                    ? `Facture ${selectedRapport.document_numero || ''}`
                    : `Relevé Bancaire ${selectedRapport.document_numero || ''}`}
                </h3>
                <p className="text-sm text-gray-500">
                  Généré le {new Date(selectedRapport.created_at).toLocaleString()}
                </p>
              </div>
              <button 
                onClick={() => setSelectedRapport(null)}
                className="text-gray-500 hover:text-gray-700"
              >
                <FaTimesCircle size={20} />
              </button>
            </div>
            
            <div className="p-6 overflow-y-auto max-h-[80vh]">
              {renderDetailContent()}
            </div>
            
            <div className="flex justify-between items-center p-4 border-t">
              <div className="text-sm text-gray-500">
                ID: {selectedRapport.id}
              </div>
              <div className="space-x-2">
                <button
                  onClick={() => exportReport(selectedRapport.id, 'pdf')}
                  className="px-4 py-2 bg-red-600 text-white rounded flex items-center"
                >
                  <FaFilePdf className="mr-2" /> PDF
                </button>
                <button
                  onClick={() => exportReport(selectedRapport.id, 'excel')}
                  className="px-4 py-2 bg-green-600 text-white rounded flex items-center"
                >
                  <FaFileExcel className="mr-2" /> Excel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
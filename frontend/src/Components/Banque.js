import { useState, useEffect,useMemo } from 'react';
import axios from 'axios';
import { useUser } from './UserContext';
import { toast } from 'react-toastify';
import { useNavigate } from 'react-router-dom'; 

import { 
  FaFileInvoice, 
  FaUpload, 
  FaTimesCircle, 
  FaFilePdf,
  FaEye,
  FaTrashAlt,
  FaDownload,
  FaSpinner,
  FaSearch,
  FaRobot,
  FaFileSignature,
  FaCheckCircle,
  FaCalendarAlt,
  FaUser,
  FaBuilding,
  FaMoneyBillWave,
  FaInfoCircle,
  FaSort,
  FaSortUp,
  FaSortDown,
  FaFileExcel,
  FaFilter
} from 'react-icons/fa';
import { CSVLink } from 'react-csv';

export default function ReleveBancaireList() {
  const navigate = useNavigate();
  const { user } = useUser();

  const [releves, setReleves] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showImportModal, setShowImportModal] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadStatus, setUploadStatus] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [pdfPreview, setPdfPreview] = useState({ visible: false, url: null });
  const [isFileHovering, setIsFileHovering] = useState(false);
  const [extractedData, setExtractedData] = useState(null);
  const [isExtracting, setIsExtracting] = useState(false);
  const [extractionStatus, setExtractionStatus] = useState(null);
  const [expandedReleve, setExpandedReleve] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortConfig, setSortConfig] = useState({ key: 'date_import', direction: 'desc' });
  const [selectedBanque, setSelectedBanque] = useState('Toutes');
  const [banquesList, setBanquesList] = useState([]);

  // Charger les relevés et la liste des banques
useEffect(() => {
  const fetchData = async () => {
    try {
      setLoading(true);
      const { data } = await axios.get('http://localhost:8000/api/banques/', {
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json'
        },
        withCredentials: true
      });
      
      const processedData = data.map(r => {
        let metadata = r.metadata;
        if (typeof r.metadata === 'string') {
          try {
            metadata = JSON.parse(r.metadata);
            // Normaliser les noms de banques
            if (metadata.banque) {
              metadata.banque = metadata.banque.replace(/\./g, '').trim();
            }
            if (metadata.emetteur) {
              metadata.emetteur = metadata.emetteur.replace(/\./g, '').trim();
            }
          } catch (e) {
            console.error("Erreur de parsing JSON des métadonnées:", e);
            metadata = {};
          }
        } // <-- Cette parenthèse fermante manquait
          
        return {
          ...r,
          metadata,
          downloadUrl: r.id ? `http://localhost:8000/api/banques/${r.id}/download/` : null,
          banque: metadata.banque || metadata.emetteur || 'Inconnue'
        };
      });
    
      setReleves(processedData);
      
      // Extraire la liste unique des banques
      const banques = [...new Set(processedData
        .map(r => r.metadata?.banque || r.metadata?.emetteur || '')
        .filter(b => b)
      )].sort(); // <-- Parenthèse fermante manquante ici
      
      setBanquesList(['Toutes', ...banques]);
      setLoading(false);
    } catch (err) {
      toast.error(`Erreur de chargement: ${err.message}`);
      setLoading(false);
    }
  };
  
  fetchData();
}, []);

  // Gestion du tri
  const requestSort = (key) => {
    let direction = 'asc';
    if (sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  // Fonction de tri
  const sortedReleves = useMemo(() => {
    let sortableItems = [...releves];
    if (sortConfig.key) {
      sortableItems.sort((a, b) => {
        // Pour les dates
        if (sortConfig.key === 'date_import') {
          const dateA = new Date(a.date_import);
          const dateB = new Date(b.date_import);
          return sortConfig.direction === 'asc' ? dateA - dateB : dateB - dateA;
        }
        
        // Pour les métadonnées
        if (sortConfig.key.includes('metadata.')) {
          const metaKey = sortConfig.key.replace('metadata.', '');
          const valueA = a.metadata?.[metaKey] || '';
          const valueB = b.metadata?.[metaKey] || '';
          
          // Tri numérique pour les montants
          if (metaKey.includes('montant') || metaKey.includes('solde')) {
            const numA = parseFloat(valueA) || 0;
            const numB = parseFloat(valueB) || 0;
            return sortConfig.direction === 'asc' ? numA - numB : numB - numA;
          }
          
          // Tri alphabétique pour le reste
          return sortConfig.direction === 'asc' 
            ? valueA.localeCompare(valueB) 
            : valueB.localeCompare(valueA);
        }
        
        // Tri par défaut
        if (a[sortConfig.key] < b[sortConfig.key]) {
          return sortConfig.direction === 'asc' ? -1 : 1;
        }
        if (a[sortConfig.key] > b[sortConfig.key]) {
          return sortConfig.direction === 'asc' ? 1 : -1;
        }
        return 0;
      });
    }
    return sortableItems;
  }, [releves, sortConfig]);

  // Filtrage combiné
  const filteredReleves = useMemo(() => {
    return sortedReleves.filter(releve => {
      // Filtre par recherche
      const matchesSearch = searchTerm === '' || 
        (releve.nom_fichier && releve.nom_fichier.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (releve.metadata && (
          (releve.metadata.client && releve.metadata.client.toLowerCase().includes(searchTerm.toLowerCase())) ||
          (releve.metadata.nom_titulaire && releve.metadata.nom_titulaire.toLowerCase().includes(searchTerm.toLowerCase())) ||
          (releve.metadata.numero_compte && releve.metadata.numero_compte.toLowerCase().includes(searchTerm.toLowerCase())) ||
          (releve.metadata.iban && releve.metadata.iban.toLowerCase().includes(searchTerm.toLowerCase()))
        ));
      
      // Filtre par banque
      const matchesBanque = selectedBanque === 'Toutes' || 
        (releve.metadata && (
          (releve.metadata.banque && releve.metadata.banque === selectedBanque) ||
          (releve.metadata.emetteur && releve.metadata.emetteur === selectedBanque)
        ));
      
      return matchesSearch && matchesBanque;
    });
  }, [sortedReleves, searchTerm, selectedBanque]);

  // Gestion du fichier sélectionné
  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (file.type !== 'application/pdf') {
      toast.error('Seuls les PDF sont acceptés');
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      toast.error('Taille maximale: 10MB');
      return;
    }

    setSelectedFile(file);
    setUploadStatus(null);
    setExtractionStatus(null);
    await extractDataFromPdf(file);
  };
   // Ajoutez ces fonctions
  const toggleDetails = (id) => {
    setExpandedReleve(expandedReleve === id ? null : id);
  };

  const closePdfPreview = () => setPdfPreview({ visible: false, url: null });
  // Extraction des données PDF
  const extractDataFromPdf = async (file) => {
    setIsExtracting(true);
    setExtractedData(null);
    setExtractionStatus(null);
    
    try {
      toast.info("Extraction des données en cours...", { autoClose: false });
      
      const formData = new FormData();
      formData.append('file', file);
      formData.append('type', 'bank_statement');
      
      const { data } = await axios.post('http://localhost:5000/api/extract-document', formData);
      
      toast.dismiss();
      
      if (data.success) {
        setExtractedData(data.data);
        setExtractionStatus('success');
        toast.success("Données extraites avec succès!");
      } else {
        throw new Error(data.error || "Erreur d'extraction");
      }
    } catch (err) {
      setExtractionStatus('error');
      toast.error("Échec de l'extraction: " + err.message);
    } finally {
      setIsExtracting(false);
    }
  };

  // Téléchargement des relevés
  const handleDownload = async (url, filename) => {
    try {
      const response = await axios.get(url, {
        responseType: 'blob',
        withCredentials: true
      });
      
      const blob = new Blob([response.data], { type: 'application/pdf' });
      const link = document.createElement('a');
      link.href = window.URL.createObjectURL(blob);
      link.download = filename || 'releve_bancaire.pdf';
      link.click();
    } catch (err) {
      toast.error('Erreur lors du téléchargement');
    }
  };

  // Import du relevé
  const handleUpload = async () => {
    if (!selectedFile) {
      toast.error('Sélectionnez un PDF');
      return;
    }

    const uploadData = new FormData();
    uploadData.append('fichier', selectedFile);
    
    if (extractedData) {
      uploadData.append('metadata', JSON.stringify(extractedData));
    }

    try {
      setUploadStatus('uploading');
      const response = await axios.post('http://localhost:8000/api/banques/', uploadData, {
        withCredentials: true
      });
      
      setReleves([{
        ...response.data,
        downloadUrl: `http://localhost:8000/api/banques/${response.data.id}/download`,
        metadata: extractedData || {},
        banque: extractedData?.banque || extractedData?.emetteur || 'Inconnue'
      }, ...releves]);
      
      toast.success('Import réussi!');
      setShowImportModal(false);
      setSelectedFile(null);
      setExtractedData(null);
      navigate(`/dashboardcomptable/rapprochement`);
    } catch (err) {
      setUploadStatus('error');
      toast.error(err.response?.data?.error || "Erreur d'import");
    }
  };

  // Suppression d'un relevé
  const handleDelete = async (id) => {
    if (!window.confirm('Supprimer ce relevé bancaire ?')) return;
    
    try {
      setIsDeleting(true);
      await axios.delete(`http://localhost:8000/api/banques/${id}/`, {
        withCredentials: true
      });
      setReleves(releves.filter(r => r.id !== id));
      toast.success('Suppression réussie');
    } finally {
      setIsDeleting(false);
    }
  };

  // Préparation des données pour export CSV
  const csvData = useMemo(() => {
    return filteredReleves.map(releve => ({
      'Nom du fichier': releve.nom_fichier,
      'Date import': new Date(releve.date_import).toLocaleDateString(),
      'Banque': releve.metadata?.banque || releve.metadata?.emetteur || '',
      'Client': releve.metadata?.client || releve.metadata?.nom_titulaire || '',
      'Numéro de compte': releve.metadata?.numero_compte || '',
      'IBAN': releve.metadata?.iban || '',
      'Période': releve.metadata?.periode || '',
      'Solde initial': releve.metadata?.solde_initial ? formatCurrency(releve.metadata.solde_initial) : '',
      'Solde final': releve.metadata?.solde_final ? formatCurrency(releve.metadata.solde_final) : '',
      'Nombre d\'opérations': releve.metadata?.nombre_operations || ''
    }));
  }, [filteredReleves]);

  // Formatage des montants
  const formatCurrency = (amount) => {
    if (!amount && amount !== 0) return 'N/A';
    return new Intl.NumberFormat('fr-FR', { 
      style: 'currency', 
      currency: 'EUR',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(amount);
  };

  // Affichage des opérations
  const renderOperations = (contenu) => {
    if (!contenu) return null;
    
    // Extraction des opérations (adaptée à différents formats de relevés)
    const lines = contenu.split('\n')
      .filter(line => line.trim() !== '')
      .map(line => {
        // Tentative d'extraction des données selon différents formats
        const dateMatch = line.match(/(\d{2}\/\d{2}\/\d{4})/);
        const date = dateMatch ? dateMatch[1] : '';
        
        const description = line
          .replace(/(\d{2}\/\d{2}\/\d{4})/g, '')
          .replace(/(\d+,\d{2})/g, '')
          .replace(/\s+/g, ' ')
          .trim();
        
        const montantMatch = line.match(/(-?\d+,\d{2})/);
        const montant = montantMatch ? montantMatch[1].replace(',', '.') : '';
        
        return { date, description, montant };
      })
      .filter(op => op.date || op.description || op.montant);
    
    if (lines.length === 0) return null;
    
    return (
      <div className="mt-4">
        <h5 className="text-sm font-medium text-gray-700 mb-2">Opérations extraites</h5>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 text-xs">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-3 py-2 text-left font-medium text-gray-500">Date</th>
                <th className="px-3 py-2 text-left font-medium text-gray-500">Description</th>
                <th className="px-3 py-2 text-right font-medium text-gray-500">Montant</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-100">
              {lines.slice(0, 5).map((line, index) => (
                <tr key={index} className="hover:bg-gray-50">
                  <td className="px-3 py-2">{line.date}</td>
                  <td className="px-3 py-2">{line.description}</td>
                  <td className={`px-3 py-2 text-right ${
                    line.montant.startsWith('-') ? 'text-red-600' : 'text-green-600'
                  }`}>
                    {line.montant ? formatCurrency(parseFloat(line.montant)) : ''}
                  </td>
                </tr>
              ))}
              {lines.length > 5 && (
                <tr>
                  <td colSpan="3" className="px-3 py-2 text-center text-xs text-gray-500">
                    + {lines.length - 5} opérations supplémentaires...
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  // Icône de tri
  const getSortIcon = (key) => {
    if (sortConfig.key !== key) return <FaSort className="text-gray-400" />;
    return sortConfig.direction === 'asc' 
      ? <FaSortUp className="text-blue-500" /> 
      : <FaSortDown className="text-blue-500" />;
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-6">
      <div className="max-w-7xl mx-auto">
        {/* En-tête */}
        <div className="bg-white rounded-xl shadow-md overflow-hidden mb-6">
          <div className="px-6 py-5 sm:px-8 sm:py-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div className="flex items-center">
                <div className="h-12 w-12 rounded-lg bg-blue-100 flex items-center justify-center mr-4">
                  <FaFileInvoice className="text-blue-600 text-2xl" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-gray-800">Relevés Bancaires</h1>
                  <p className="text-gray-500 text-sm mt-1">
                    {filteredReleves.length} {filteredReleves.length > 1 ? 'relevés' : 'relevé'} trouvé(s)
                  </p>
                </div>
              </div>
              
              <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
                <div className="relative flex-grow sm:w-64">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <FaSearch className="text-gray-400" />
                  </div>
                  <input
                    type="text"
                    placeholder="Rechercher..."
                    className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 w-full"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
                
                <div className="flex items-center bg-white rounded-lg border px-3">
                  <FaFilter className="text-gray-500 mr-2" />
                  <select
                    className="border-none py-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                    value={selectedBanque}
                    onChange={(e) => setSelectedBanque(e.target.value)}
                  >
                    {banquesList.map(banque => (
                      <option key={banque} value={banque}>{banque}</option>
                    ))}
                  </select>
                </div>
                
                <button
                  onClick={() => setShowImportModal(true)}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center justify-center"
                >
                  <FaUpload className="mr-2" />
                  <span className="hidden sm:inline">Importer</span>
                </button>
                
                {filteredReleves.length > 0 && (
                  <CSVLink
                    data={csvData}
                    filename={"releves_bancaires.csv"}
                    className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg flex items-center justify-center"
                  >
                    <FaFileExcel className="mr-2" />
                    <span className="hidden sm:inline">Exporter</span>
                  </CSVLink>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Liste des relevés */}
        <div className="bg-white rounded-xl shadow-md overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th 
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                    onClick={() => requestSort('nom_fichier')}
                  >
                    <div className="flex items-center">
                      <FaFilePdf className="text-red-500 mr-2" />
                      <span>Nom du fichier</span>
                      {getSortIcon('nom_fichier')}
                    </div>
                  </th>
                  <th 
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                    onClick={() => requestSort('metadata.banque')}
                  >
                    <div className="flex items-center">
                      <FaBuilding className="text-blue-500 mr-2" />
                      <span>Banque</span>
                      {getSortIcon('metadata.banque')}
                    </div>
                  </th>
                  <th 
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                    onClick={() => requestSort('metadata.solde_final')}
                  >
                    <div className="flex items-center">
                      <FaMoneyBillWave className="text-green-500 mr-2" />
                      <span>Solde</span>
                      {getSortIcon('metadata.solde_final')}
                    </div>
                  </th>
                  <th 
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                    onClick={() => requestSort('date_import')}
                  >
                    <div className="flex items-center">
                      <FaCalendarAlt className="text-yellow-500 mr-2" />
                      <span>Date import</span>
                      {getSortIcon('date_import')}
                    </div>
                  </th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {loading ? (
                  <tr>
                    <td colSpan="5" className="px-6 py-12 text-center">
                      <div className="flex flex-col items-center justify-center space-y-3">
                        <FaSpinner className="animate-spin text-blue-600 text-3xl" />
                        <span className="text-gray-500">Chargement des relevés...</span>
                      </div>
                    </td>
                  </tr>
                ) : filteredReleves.length === 0 ? (
                  <tr>
                    <td colSpan="5" className="px-6 py-12 text-center">
                      <div className="flex flex-col items-center justify-center space-y-3">
                        <FaFileInvoice className="text-gray-400 text-3xl" />
                        <span className="text-gray-500">
                          {searchTerm || selectedBanque !== 'Toutes' 
                            ? "Aucun relevé ne correspond aux critères" 
                            : "Aucun relevé disponible"}
                        </span>
                        {(searchTerm || selectedBanque !== 'Toutes') && (
                          <button
                            onClick={() => {
                              setSearchTerm('');
                              setSelectedBanque('Toutes');
                            }}
                            className="text-blue-600 hover:text-blue-800 text-sm"
                          >
                            Réinitialiser les filtres
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ) : (
                  filteredReleves.map((releve) => (
                    <>
                      <tr key={releve.id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="flex-shrink-0 h-10 w-10 bg-red-50 rounded-lg flex items-center justify-center mr-3">
                              <FaFilePdf className="text-red-500" />
                            </div>
                            <div>
                              <div className="text-sm font-medium text-gray-900">
                                {releve.nom_fichier || 'releve.pdf'}
                              </div>
                              <div className="text-xs text-gray-500">
                                {releve.metadata?.numero_compte || releve.metadata?.iban || 'N/A'}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">
                            {releve.metadata?.banque || releve.metadata?.emetteur || 'Inconnue'}
                          </div>
                          <div className="text-xs text-gray-500">
                            {releve.metadata?.client || releve.metadata?.nom_titulaire || 'N/A'}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium">
                            {releve.metadata?.solde_final 
                              ? formatCurrency(releve.metadata.solde_final) 
                              : 'N/A'}
                          </div>
                          {releve.metadata?.solde_initial && (
                            <div className="text-xs text-gray-500">
                              Initial: {formatCurrency(releve.metadata.solde_initial)}
                            </div>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">
                            {new Date(releve.date_import).toLocaleDateString()}
                          </div>
                          <div className="text-xs text-gray-500">
                            {new Date(releve.date_import).toLocaleTimeString()}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-center">
                          <div className="flex justify-center space-x-2">
                            <button
                              onClick={() => handleDownload(releve.downloadUrl, releve.nom_fichier)}
                              className="h-9 w-9 flex items-center justify-center bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition-colors"
                              title="Télécharger"
                            >
                              <FaDownload className="text-sm" />
                            </button>
                            <button
                              onClick={() => toggleDetails(releve.id)}
                              className="h-9 w-9 flex items-center justify-center bg-gray-50 text-gray-600 rounded-lg hover:bg-gray-100 transition-colors"
                              title="Détails"
                            >
                              <FaInfoCircle className="text-sm" />
                            </button>
                            <button
                              onClick={() => handleDelete(releve.id)}
                              disabled={isDeleting}
                              className="h-9 w-9 flex items-center justify-center bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition-colors disabled:opacity-50"
                              title="Supprimer"
                            >
                              {isDeleting ? (
                                <FaSpinner className="animate-spin text-sm" />
                              ) : (
                                <FaTrashAlt className="text-sm" />
                              )}
                            </button>
                          </div>
                        </td>
                      </tr>
                      {expandedReleve === releve.id && (
                        <tr>
                          <td colSpan="5" className="px-6 py-4 bg-gray-50 border-t border-gray-200">
                            <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
                              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                <div>
                                  <h4 className="text-sm font-medium text-gray-700 mb-3 flex items-center">
                                    <FaFileSignature className="text-blue-500 mr-2" />
                                    Informations du relevé
                                  </h4>
                                  <div className="space-y-2 text-sm">
                                    <div className="flex justify-between">
                                      <span className="text-gray-500">Banque:</span>
                                      <span className="font-medium">
                                        {releve.metadata?.banque || releve.metadata?.emetteur || 'N/A'}
                                      </span>
                                    </div>
                                    <div className="flex justify-between">
                                      <span className="text-gray-500">Client:</span>
                                      <span className="font-medium">
                                        {releve.metadata?.client || releve.metadata?.nom_titulaire || 'N/A'}
                                      </span>
                                    </div>
                                    <div className="flex justify-between">
                                      <span className="text-gray-500">Compte/IBAN:</span>
                                      <span className="font-medium">
                                        {releve.metadata?.numero_compte || releve.metadata?.iban || 'N/A'}
                                      </span>
                                    </div>
                                    <div className="flex justify-between">
                                      <span className="text-gray-500">BIC:</span>
                                      <span className="font-medium">
                                        {releve.metadata?.bic || 'N/A'}
                                      </span>
                                    </div>
                                  </div>
                                </div>
                                
                                <div>
                                  <h4 className="text-sm font-medium text-gray-700 mb-3 flex items-center">
                                    <FaCalendarAlt className="text-blue-500 mr-2" />
                                    Période & Soldes
                                  </h4>
                                  <div className="space-y-2 text-sm">
                                    <div className="flex justify-between">
                                      <span className="text-gray-500">Période:</span>
                                      <span className="font-medium">
                                        {releve.metadata?.periode || 'N/A'}
                                      </span>
                                    </div>
                                    <div className="flex justify-between">
                                      <span className="text-gray-500">Date import:</span>
                                      <span className="font-medium">
                                        {new Date(releve.date_import).toLocaleString()}
                                      </span>
                                    </div>
                                    <div className="flex justify-between">
                                      <span className="text-gray-500">Solde initial:</span>
                                      <span className="font-medium">
                                        {releve.metadata?.solde_initial 
                                          ? formatCurrency(releve.metadata.solde_initial) 
                                          : 'N/A'}
                                      </span>
                                    </div>
                                    <div className="flex justify-between">
                                      <span className="text-gray-500">Solde final:</span>
                                      <span className="font-medium">
                                        {releve.metadata?.solde_final 
                                          ? formatCurrency(releve.metadata.solde_final) 
                                          : 'N/A'}
                                      </span>
                                    </div>
                                  </div>
                                </div>
                                
                                <div>
                                  <h4 className="text-sm font-medium text-gray-700 mb-3 flex items-center">
                                    <FaFileInvoice className="text-blue-500 mr-2" />
                                    Fichier & Actions
                                  </h4>
                                  <div className="space-y-3">
                                    <button
                                      onClick={() => handleDownload(releve.downloadUrl, releve.nom_fichier)}
                                      className="w-full flex items-center justify-center px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50"
                                    >
                                      <FaDownload className="mr-2" />
                                      Télécharger le PDF
                                    </button>
                                    <button
                                      onClick={() => navigate(`/dashboardcomptable/rapprochement?releveId=${releve.id}`)}
                                      className="w-full flex items-center justify-center px-4 py-2 border border-transparent rounded-lg text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
                                    >
                                      <FaCheckCircle className="mr-2" />
                                      Faire le rapprochement
                                    </button>
                                  </div>
                                </div>
                              </div>
                              
                              {releve.metadata?.contenu_analyse && renderOperations(releve.metadata.contenu_analyse)}
                            </div>
                          </td>
                        </tr>
                      )}
                    </>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Modal d'import */}
      {showImportModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl">
            <div className="flex justify-between items-center border-b p-5">
              <h3 className="text-xl font-semibold text-gray-800">Importer un relevé bancaire</h3>
              <button 
                onClick={() => {
                  setShowImportModal(false);
                  setSelectedFile(null);
                  setExtractedData(null);
                }} 
                className="text-gray-400 hover:text-gray-600"
                disabled={uploadStatus === 'uploading'}
              >
                <FaTimesCircle className="text-xl" />
              </button>
            </div>
            
            <div className="p-6">
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Sélectionnez un fichier PDF
                  </label>
                  <div className={`mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-dashed rounded-md transition-colors ${
                    isFileHovering ? 'border-blue-500 bg-blue-50' : 'border-gray-300'
                  }`}
                  onDragOver={(e) => {
                    e.preventDefault();
                    setIsFileHovering(true);
                  }}
                  onDragLeave={() => setIsFileHovering(false)}
                  onDrop={(e) => {
                    e.preventDefault();
                    setIsFileHovering(false);
                    if (e.dataTransfer.files.length > 0) {
                      handleFileChange({ target: { files: e.dataTransfer.files } });
                    }
                  }}>
                    <div className="space-y-1 text-center">
                      {!selectedFile ? (
                        <>
                          <FaUpload className={`mx-auto h-12 w-12 ${isFileHovering ? 'text-blue-500' : 'text-gray-400'}`} />
                          <div className="flex text-sm text-gray-600 justify-center">
                            <label
                              htmlFor="file-upload"
                              className={`relative cursor-pointer bg-white rounded-md font-medium ${
                                isFileHovering ? 'text-blue-600' : 'text-blue-500'
                              } hover:text-blue-500 focus-within:outline-none`}
                            >
                              <span>Choisir un fichier</span>
                              <input
                                id="file-upload"
                                name="file-upload"
                                type="file"
                                className="sr-only"
                                onChange={handleFileChange}
                                accept=".pdf"
                              />
                            </label>
                            <p className="pl-1">ou glisser-déposer</p>
                          </div>
                          <p className="text-xs text-gray-500">
                            PDF jusqu'à 10MB
                          </p>
                        </>
                      ) : (
                        <>
                          <div className="flex flex-col items-center">
                            <FaFilePdf className="mx-auto h-12 w-12 text-blue-500" />
                            <p className="mt-2 text-sm font-medium text-gray-900">
                              {selectedFile.name}
                            </p>
                            <p className="text-xs text-gray-500">
                              {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                            </p>
                            <button
                              onClick={() => {
                                setSelectedFile(null);
                                setExtractedData(null);
                              }}
                              className="mt-2 text-sm text-red-600 hover:text-red-800 flex items-center"
                            >
                              <FaTimesCircle className="mr-1" />
                              Changer de fichier
                            </button>
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                {extractedData && (
                  <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                    <div className="flex items-center mb-3">
                      <FaRobot className="text-blue-500 mr-2" />
                      <h4 className="text-sm font-medium text-blue-800">Données extraites automatiquement</h4>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2 text-sm">
                        {extractedData.banque && (
                          <div className="flex justify-between">
                            <span className="text-gray-600">Banque:</span>
                            <span className="font-medium">{extractedData.banque}</span>
                          </div>
                        )}
                        {extractedData.client && (
                          <div className="flex justify-between">
                            <span className="text-gray-600">Client:</span>
                            <span className="font-medium">{extractedData.client}</span>
                          </div>
                        )}
                        {extractedData.numero_compte && (
                          <div className="flex justify-between">
                            <span className="text-gray-600">Numéro de compte:</span>
                            <span className="font-medium">{extractedData.numero_compte}</span>
                          </div>
                        )}
                        {extractedData.iban && (
                          <div className="flex justify-between">
                            <span className="text-gray-600">IBAN:</span>
                            <span className="font-medium">{extractedData.iban}</span>
                          </div>
                        )}
                      </div>
                      
                      <div className="space-y-2 text-sm">
                        {extractedData.periode && (
                          <div className="flex justify-between">
                            <span className="text-gray-600">Période:</span>
                            <span className="font-medium">{extractedData.periode}</span>
                          </div>
                        )}
                        {extractedData.solde_initial && (
                          <div className="flex justify-between">
                            <span className="text-gray-600">Solde initial:</span>
                            <span className="font-medium">{formatCurrency(extractedData.solde_initial)}</span>
                          </div>
                        )}
                        {extractedData.solde_final && (
                          <div className="flex justify-between">
                            <span className="text-gray-600">Solde final:</span>
                            <span className="font-medium">{formatCurrency(extractedData.solde_final)}</span>
                          </div>
                        )}
                        {extractedData.nombre_operations && (
                          <div className="flex justify-between">
                            <span className="text-gray-600">Nombre d'opérations:</span>
                            <span className="font-medium">{extractedData.nombre_operations}</span>
                          </div>
                        )}
                      </div>
                    </div>
                    
                    {extractedData.contenu_analyse && (
                      <div className="mt-3">
                        <button
                          onClick={() => {
                            toast.info(
                              <div className="max-h-96 overflow-y-auto p-2">
                                <h5 className="font-bold mb-2">Contenu analysé complet</h5>
                                <pre className="whitespace-pre-wrap text-xs">{extractedData.contenu_analyse}</pre>
                              </div>,
                              { autoClose: false }
                            );
                          }}
                          className="text-xs text-blue-600 hover:text-blue-800"
                        >
                          Voir le contenu complet analysé
                        </button>
                      </div>
                    )}
                  </div>
                )}

                {isExtracting && (
                  <div className="mt-4 p-3 bg-blue-50 rounded-lg flex items-center">
                    <FaSpinner className="animate-spin text-blue-500 mr-2" />
                    <span className="text-sm text-blue-700">Extraction des données en cours...</span>
                  </div>
                )}
              </div>
            </div>

            <div className="flex justify-between bg-gray-50 px-6 py-4 rounded-b-lg border-t border-gray-200">
              <button
                onClick={() => {
                  setShowImportModal(false);
                  setSelectedFile(null);
                  setExtractedData(null);
                }}
                className="px-4 py-2 text-sm font-medium text-gray-700 hover:text-gray-900 focus:outline-none"
              >
                Annuler
              </button>
              <div className="flex space-x-3">
                {selectedFile && (
                  <button
                    onClick={() => handleDownload(URL.createObjectURL(selectedFile), selectedFile.name)}
                    className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
                  >
                    Prévisualiser
                  </button>
                )}
                <button
                  onClick={handleUpload}
                  disabled={!selectedFile || uploadStatus === 'uploading'}
                  className={`px-5 py-2 text-sm font-medium text-white rounded-lg shadow-sm ${
                    !selectedFile ? 'bg-blue-300 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700'
                  }`}
                >
                  {uploadStatus === 'uploading' ? (
                    <>
                      <FaSpinner className="animate-spin inline mr-2" />
                      Import en cours...
                    </>
                  ) : (
                    'Confirmer l\'import'
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      
      {/* PDF Preview Modal */}
      {pdfPreview.visible && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-6xl h-[90vh] flex flex-col">
            <div className="flex justify-between items-center border-b p-4">
              <h3 className="text-lg font-semibold text-gray-800">Aperçu du relevé</h3>
              <button 
                onClick={closePdfPreview} 
                className="text-gray-400 hover:text-gray-600"
              >
                <FaTimesCircle className="text-xl" />
              </button>
            </div>
            <div className="flex-1 overflow-hidden">
              <iframe 
                src={pdfPreview.url} 
                className="w-full h-full" 
                title="PDF Preview"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
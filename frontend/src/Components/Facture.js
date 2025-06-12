import { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { FaFileInvoice, FaUpload, FaTable, FaThLarge, FaTimesCircle, FaFilePdf, FaEye, FaTrashAlt, FaCheckCircle, FaSearch, FaRegClock, FaFileDownload, FaChevronLeft, FaChevronRight, FaFileUpload, FaUser, FaBuilding, FaMoneyBillWave, FaBoxes, FaRobot, FaCalendarAlt, FaCreditCard, FaPercentage, FaHashtag, FaExclamationTriangle } from 'react-icons/fa';

export default function ModernFactureList() {
  const navigate = useNavigate();
  const [factures, setFactures] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showImportModal, setShowImportModal] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [uploadStatus, setUploadStatus] = useState(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [selectedFacture, setSelectedFacture] = useState(null);
  const [viewMode, setViewMode] = useState('grid');
  const [pagination, setPagination] = useState({ page: 1, limit: 20, total: 0 });
  const [isDeleting, setIsDeleting] = useState(false);
  const [isExtracting, setIsExtracting] = useState(false);
  const [extractedData, setExtractedData] = useState(null);

  // Fonctions de base
  const fetchFactures = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`http://localhost:8000/api/factures/?page=${pagination.page}&limit=${pagination.limit}`, {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('auth_token')}` },
        withCredentials: true
      });

      const facturesData = Array.isArray(response.data) ? response.data : response.data.data || [];
      setFactures(facturesData.map(f => ({
        ...f,
        downloadUrl: f.id ? `http://localhost:8000/api/factures/${f.id}/download/` : null,
        previewUrl: f.id ? `http://localhost:8000/api/factures/${f.id}/download/?preview=true` : null
      })));
      setPagination(prev => ({ ...prev, total: response.data.total || facturesData.length }));
    } catch (err) {
      toast.error(`Erreur de chargement: ${err.response?.data?.message || err.message}`);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchFactures(); }, [pagination.page, pagination.limit]);

  const filteredFactures = factures.filter(facture =>
    !searchTerm || Object.values(facture).some(val =>
      String(val).toLowerCase().includes(searchTerm.toLowerCase())
    ));

  // Fonctions utilitaires
  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';

    const parts = dateString.split('/');
    if (parts.length === 3) {
      const [day, month, year] = parts;
      const dateObj = new Date(year, month - 1, day);
      if (!isNaN(dateObj.getTime())) {
        return dateObj.toLocaleDateString('fr-FR');
      }
    }

    try {
      const dateObj = new Date(dateString);
      if (!isNaN(dateObj.getTime())) {
        return dateObj.toLocaleDateString('fr-FR');
      }
    } catch (e) {
      // Ignorer l'erreur
    }

    return 'N/A';
  };

  const formatCurrency = (amount) => {
    if (typeof amount !== 'number' || isNaN(amount)) return 'N/A';
    return new Intl.NumberFormat('fr-TN', { 
      style: 'currency', 
      currency: 'TND',
      minimumFractionDigits: 2 
    }).format(amount);
  };

  const getStatusBadge = (statut) => {
    const statusConfig = {
      payee: { bg: 'bg-green-100', text: 'text-green-800', label: 'Payée' },
      en_attente: { bg: 'bg-yellow-100', text: 'text-yellow-800', label: 'En attente' },
      en_retard: { bg: 'bg-red-100', text: 'text-red-800', label: 'En retard' },
    };
    const config = statusConfig[statut] || statusConfig.en_attente;
    return <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${config.bg} ${config.text}`}>{config.label}</span>;
  };

  // Fonction pour obtenir le niveau de confiance avec couleur
  const getConfidenceBadge = (confidence) => {
    if (!confidence) return null;
    
    let colorClass = 'bg-red-100 text-red-800';
    let label = 'Faible';
    
    if (confidence >= 80) {
      colorClass = 'bg-green-100 text-green-800';
      label = 'Élevée';
    } else if (confidence >= 60) {
      colorClass = 'bg-yellow-100 text-yellow-800';
      label = 'Moyenne';
    }
    
    return (
      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${colorClass}`}>
        {label} ({confidence}%)
      </span>
    );
  };

  // Gestion des fichiers
  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file || file.type !== 'application/pdf') {
      toast.error('Seuls les PDF sont acceptés');
      return;
    }
    setSelectedFile(file);
    setExtractedData(null);
    await extractDataFromPdf(file);
  };

  const extractDataFromPdf = async (file) => {
    setIsExtracting(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      const { data } = await axios.post('http://localhost:5000/api/extract-document', formData);
      
      if (data.success) {
        // Mapping des données selon votre fonction d'extraction
        setExtractedData({
          // Identifiants essentiels
          numero: data.data.numero || null,
          date: data.data.date || null,
          date_echeance: data.data.date_echeance || null,
          
          // Parties
          emetteur: data.data.emetteur || null,
          client: data.data.client || null,
          
          // Montants critiques
          montant_total: data.data.montant_total || null,
          montant_ht: data.data.montant_ht || null,
          montant_tva: data.data.montant_tva || null,
          net_a_payer: data.data.net_a_payer || null,
          
          // Informations de paiement
          mode_reglement: data.data.mode_reglement || null,
          reference_paiement: data.data.reference_paiement || null,
          
          // Métadonnées
          devise: data.data.devise || 'TND',
          confiance_extraction: data.data.confiance_extraction || null,
          
          // Type de document
          type: data.data.type || 'facture'
        });
        toast.success("Extraction réussie !");
      } else {
        throw new Error(data.error || "Erreur d'extraction");
      }
    } catch (err) {
      toast.error("Échec extraction: " + (err.response?.data?.error || err.message));
      setExtractedData(null);
    } finally {
      setIsExtracting(false);
    }
  };

  const handleImport = async () => {
    if (!selectedFile) {
      toast.error('Sélectionnez un PDF');
      return;
    }
    if (!extractedData) {
      toast.error('Aucune donnée extraite à importer.');
      return;
    }

    try {
      setUploadStatus('uploading');
      const formData = new FormData();
      formData.append('fichier', selectedFile);
      formData.append('metadata', JSON.stringify(cleanExtractedData(extractedData)));

      const response = await axios.post('http://localhost:8000/api/factures/', formData, {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('auth_token')}` }
      });

      if (response.data?.id) {
        toast.success('Import réussi!');
        setShowImportModal(false);
        setSelectedFile(null);
        setExtractedData(null);
        fetchFactures();
      } else {
        toast.error("L'import a échoué: Aucune ID de facture retournée.");
      }
    } catch (err) {
      toast.error(err.response?.data?.error || err.message || "Erreur d'import");
    } finally {
      setUploadStatus(null);
    }
  };

  const handleDelete = async (factureId) => {
    if (!window.confirm("Êtes-vous sûr de vouloir supprimer cette facture ?")) {
      return;
    }
    setIsDeleting(true);
    try {
      await axios.delete(`http://localhost:8000/api/factures/${factureId}/`, {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('auth_token')}` },
        withCredentials: true
      });
      toast.success('Facture supprimée avec succès !');
      setFactures(prevFactures => prevFactures.filter(facture => facture.id !== factureId));
      fetchFactures();
    } catch (err) {
      toast.error(`Erreur de suppression: ${err.response?.data?.message || err.message}`);
    } finally {
      setIsDeleting(false);
    }
  };

const cleanExtractedData = (data) => {
 const cleaned = {};
 Object.entries(data).forEach(([key, value]) => {
if (value === null || value === undefined || (typeof value === 'string' && value.trim() === '')) {
 if (key.includes('date')) {
cleaned[key] = null;
 }
  return;
 }

if (key.includes('montant') || key.includes('total') || key.includes('tva') || key.includes('net_a_payer')) {
 const numValue = parseFloat(String(value).replace(/[^\d.,]/g, '').replace(',', '.'));
 cleaned[key] = isNaN(numValue) ? 0 : numValue;
 } else if (key.includes('date')) {
try {
const parts = String(value).split('/');
 let dateObj;
 if (parts.length === 3) {
 // Assurez-vous que l'année est dans le bon ordre (YYYY-MM-DD)
 dateObj = new Date(parts[2], parts[1] - 1, parts[0]);
} else {
dateObj = new Date(value);
 }

 if (!isNaN(dateObj.getTime())) {
                // IMPORTANT: Utiliser toLocaleDateString avec des options pour obtenir YYYY-MM-DD
                // Ou construire manuellement la chaîne YYYY-MM-DD
                const year = dateObj.getFullYear();
                const month = (dateObj.getMonth() + 1).toString().padStart(2, '0'); // Mois est basé sur 0
                const day = dateObj.getDate().toString().padStart(2, '0');
                cleaned[key] = `${year}-${month}-${day}`;
} else {
cleaned[key] = null;
 }
 } catch (e) {
 cleaned[key] = null;
 }
 } else {
 cleaned[key] = String(value).trim();
 }
 });

const defaultFields = {
 numero: '',
 date_emission: null, // Ce champ sera rempli par le backend si 'date' existe
 date_echeance: null,
 mode_reglement: '',
 emetteur: '',
 client: '',
 montant_total: 0,
montant_ht: 0,
 montant_tva: 0,
net_a_payer: 0
 };

    // Assurez-vous que date_emission est correctement assigné à partir de 'date'
    // avant d'envoyer les métadonnées au backend.
    // L'IA fournit 'date' et 'date_echeance'. On veut que 'date' devienne 'date_emission'.
    if (cleaned.date) {
        cleaned.date_emission = cleaned.date;
    }
    // Supprimez le champ 'date' car le backend attend 'date_emission'
    delete cleaned.date;

return { ...defaultFields, ...cleaned };
 };

  // Composants réutilisables optimisés
  const DataField = ({ label, value, isCurrency = false, isDate = false, icon: Icon }) => (
    <div className="flex items-center text-sm bg-gray-50 p-2 rounded">
      {Icon && <Icon className="mr-2 text-gray-500 flex-shrink-0" />}
      <div className="flex-1">
        <span className="text-gray-600 font-medium">{label}:</span>{' '}
        <span className={`${isCurrency ? 'font-semibold text-green-700' : 'text-gray-800'} ${!value || value === 'N/A' ? 'text-gray-400 italic' : ''}`}>
          {isCurrency ? formatCurrency(value) : (isDate ? formatDate(value) : (value || 'Non spécifié'))}
        </span>
      </div>
    </div>
  );

  const DataSection = ({ title, icon: Icon, children, className = "" }) => (
    <div className={`bg-white p-4 rounded-lg border border-gray-200 shadow-sm ${className}`}>
      <h4 className="font-semibold text-gray-800 mb-3 flex items-center border-b border-gray-100 pb-2">
        <Icon className="mr-2 text-blue-600" /> {title}
      </h4>
      <div className="space-y-2">{children}</div>
    </div>
  );

  const renderExtractedData = (data) => {
    if (!data || Object.keys(data).length === 0) {
      return (
        <div className="text-center py-8 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
          <FaRobot className="mx-auto text-4xl text-gray-400 mb-3" />
          <p className="text-gray-500 font-medium">Aucune donnée extraite</p>
          <p className="text-sm text-gray-400">Sélectionnez un fichier PDF pour commencer l'extraction</p>
        </div>
      );
    }

    // Vérification des champs critiques pour le rapprochement
    const criticalFields = ['numero', 'date', 'montant_total', 'net_a_payer', 'emetteur'];
    const missingCritical = criticalFields.filter(field => !data[field]);
    const hasCriticalIssues = missingCritical.length > 0;

    return (
      <div className="space-y-4">
        {/* Indicateur de confiance et alertes */}
        <div className="flex justify-between items-center bg-blue-50 p-3 rounded-lg">
          <div className="flex items-center">
            <FaRobot className="mr-2 text-blue-600" />
            <span className="font-medium text-blue-800">Données extraites par IA</span>
          </div>
          <div className="flex items-center space-x-2">
            {getConfidenceBadge(data.confiance_extraction)}
            {hasCriticalIssues && (
              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-orange-100 text-orange-800">
                <FaExclamationTriangle className="mr-1" />
                Données incomplètes
              </span>
            )}
          </div>
        </div>

        {/* Alertes pour champs manquants critiques */}
        {hasCriticalIssues && (
          <div className="bg-orange-50 border-l-4 border-orange-400 p-3 rounded">
            <div className="flex items-center">
              <FaExclamationTriangle className="text-orange-400 mr-2" />
              <p className="text-sm text-orange-700">
                <strong>Attention:</strong> Champs critiques manquants pour le rapprochement: {missingCritical.join(', ')}
              </p>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Identifiants essentiels */}
          <DataSection title="Identifiants Critiques" icon={FaHashtag}>
            <DataField label="Numéro facture" value={data.numero} icon={FaFileInvoice} />
            <DataField label="Date émission" value={data.date} isDate icon={FaCalendarAlt} />
            <DataField label="Date échéance" value={data.date_echeance} isDate icon={FaRegClock} />
            <DataField label="Référence paiement" value={data.reference_paiement} icon={FaHashtag} />
          </DataSection>

          {/* Parties impliquées */}
          <DataSection title="Parties" icon={FaUser}>
            <DataField label="Émetteur" value={data.emetteur} icon={FaBuilding} />
            <DataField label="Client" value={data.client} icon={FaUser} />
            <DataField label="Mode règlement" value={data.mode_reglement} icon={FaCreditCard} />
            <DataField label="Devise" value={data.devise} />
          </DataSection>
        </div>

        {/* Montants critiques pour rapprochement */}
        <DataSection title="Montants pour Rapprochement Bancaire" icon={FaMoneyBillWave} className="border-2 border-green-200 bg-green-50">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            <DataField label="Net à payer" value={data.net_a_payer} isCurrency icon={FaMoneyBillWave} />
            <DataField label="Montant total TTC" value={data.montant_total} isCurrency icon={FaMoneyBillWave} />
            <DataField label="Montant HT" value={data.montant_ht} isCurrency />
            <DataField label="Montant TVA" value={data.montant_tva} isCurrency icon={FaPercentage} />
          </div>
          
          {/* Validation des calculs */}
          {data.montant_ht && data.montant_tva && data.montant_total && (
            <div className="mt-2 p-2 bg-white rounded border">
              <p className="text-xs text-gray-600">
                <strong>Vérification:</strong> HT + TVA = {formatCurrency(data.montant_ht + data.montant_tva)} 
                {Math.abs((data.montant_ht + data.montant_tva) - data.montant_total) > 0.1 ? 
                  <span className="text-red-600 ml-1">⚠️ Incohérence détectée</span> : 
                  <span className="text-green-600 ml-1">✅ Cohérent</span>}
              </p>
            </div>
          )}
        </DataSection>

        {/* Résumé pour rapprochement */}
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-4 rounded-lg border border-blue-200">
          <h4 className="font-semibold text-blue-800 mb-2 flex items-center">
            <FaCheckCircle className="mr-2" /> Résumé pour Rapprochement Bancaire
          </h4>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-sm">
            <div className="text-center">
              <p className="text-gray-600">Montant à rechercher</p>
              <p className="font-bold text-lg text-blue-700">{formatCurrency(data.net_a_payer || data.montant_total)}</p>
            </div>
            <div className="text-center">
              <p className="text-gray-600">Date émission</p>
              <p className="font-medium text-gray-800">{formatDate(data.date)}</p>
            </div>
            <div className="text-center">
              <p className="text-gray-600">Référence</p>
              <p className="font-medium text-gray-800">{data.numero || data.reference_paiement || 'N/A'}</p>
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header et barre de recherche */}
      <div className="flex flex-col sm:flex-row justify-between items-center mb-6 gap-4">
        <h1 className="text-3xl font-extrabold text-gray-900 flex items-center">
          <FaFileInvoice className="mr-3 text-blue-600" /> Mes Factures
        </h1>
        <div className="relative w-full sm:w-1/3">
          <input
            type="text"
            placeholder="Rechercher..."
            className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg w-full focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
        </div>
      </div>

      {/* Contenu principal */}
      {loading ? (
        <div className="text-center py-10">
          <FaRegClock className="animate-spin text-4xl text-blue-500 mx-auto mb-4" />
          <p className="text-gray-600">Chargement des factures...</p>
        </div>
      ) : filteredFactures.length === 0 ? (
        <div className="text-center py-10 bg-white rounded-lg shadow-sm">
          <FaFileInvoice className="text-5xl text-gray-400 mx-auto mb-4" />
          <p className="text-gray-700 text-lg font-medium">Aucune facture trouvée</p>
          <button
            onClick={() => setShowImportModal(true)}
            className="mt-6 flex items-center mx-auto px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition duration-200"
          >
            <FaFileUpload className="mr-2" /> Importer une facture
          </button>
        </div>
      ) : (
        <>
          {/* View Mode Toggle */}
          <div className="flex justify-end mb-4 space-x-2">
            <button
              onClick={() => setViewMode('grid')}
              className={`p-2 rounded-lg transition duration-200 ${viewMode === 'grid' ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}`}
              title="Vue grille"
            >
              <FaThLarge />
            </button>
            <button
              onClick={() => setViewMode('table')}
              className={`p-2 rounded-lg transition duration-200 ${viewMode === 'table' ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}`}
              title="Vue tableau"
            >
              <FaTable />
            </button>
            <button
              onClick={() => setShowImportModal(true)}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center transition duration-200"
            >
              <FaFileUpload className="mr-2" /> Extraire les données
            </button>
          </div>

          {/* Vue tableau ou grille */}
          {viewMode === 'grid' ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredFactures.map(facture => (
                <div key={facture.id} className="bg-white rounded-xl shadow-md hover:shadow-lg transition duration-200 overflow-hidden">
                  <div className="p-4">
                    <div className="flex justify-between items-start mb-3">
                      <h3 className="font-semibold text-gray-900 truncate flex-1">{facture.numero || 'N/A'}</h3>
                      {getStatusBadge(facture.statut)}
                    </div>
                    <div className="space-y-2 text-sm text-gray-600">
                      <div className="flex items-center">
                        <FaBuilding className="mr-2 text-gray-400" />
                        <span className="truncate">{facture.emetteur || 'N/A'}</span>
                      </div>
                      <div className="flex items-center">
                        <FaCalendarAlt className="mr-2 text-gray-400" />
                        <span>{formatDate(facture.date_emission)}</span>
                      </div>
                      <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-100">
                        <span className="text-xs text-gray-500">Montant à rechercher</span>
                        <span className="font-bold text-lg text-green-700">{formatCurrency(facture.net_a_payer || facture.montant_total)}</span>
                      </div>
                    </div>
                    <div className="mt-4 flex justify-between">
                      <button
                        onClick={() => {
                          setSelectedFacture(facture);
                          setShowDetailsModal(true);
                        }}
                        className="text-blue-600 hover:text-blue-800 transition duration-200"
                        title="Voir les détails"
                      >
                        <FaEye />
                      </button>
                      <button
                        onClick={() => handleDelete(facture.id)}
                        disabled={isDeleting}
                        className="text-red-600 hover:text-red-800 transition duration-200 disabled:opacity-50"
                        title="Supprimer la facture"
                      >
                        <FaTrashAlt />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="bg-white shadow-sm rounded-lg overflow-hidden">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Facture</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Émetteur</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Net à payer</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Statut</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredFactures.map(facture => (
                    <tr key={facture.id} className="hover:bg-gray-50 transition duration-150">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="font-medium text-gray-900">{facture.numero || 'N/A'}</div>
                        <div className="text-sm text-gray-500">{formatDate(facture.date_emission)}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{facture.emetteur || 'N/A'}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-right font-semibold text-green-700">{formatCurrency(facture.net_a_payer || facture.montant_total)}</td>
                      <td className="px-6 py-4 whitespace-nowrap">{getStatusBadge(facture.statut)}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-2">
                        <button
                          onClick={() => {
                            setSelectedFacture(facture);
                            setShowDetailsModal(true);
                          }}
                          className="text-blue-600 hover:text-blue-800 transition duration-200"
                          title="Voir les détails"
                        >
                          <FaEye />
                        </button>
                        <button
                          onClick={() => handleDelete(facture.id)}
                          disabled={isDeleting}
                          className="text-red-600 hover:text-red-800 transition duration-200 disabled:opacity-50"
                          title="Supprimer la facture"
                        >
                          <FaTrashAlt />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Pagination */}
          {pagination.total > pagination.limit && (
            <div className="flex justify-center mt-8 space-x-4">
              <button
                onClick={() => setPagination(prev => ({ ...prev, page: prev.page - 1 }))}
                disabled={pagination.page === 1}
                className="px-3 py-1 border rounded-lg hover:bg-gray-100 disabled:opacity-50"
              >
                <FaChevronLeft />
              </button>
              <span className="py-1 text-gray-700">Page {pagination.page} sur {Math.ceil(pagination.total / pagination.limit)}</span>
              <button
                onClick={() => setPagination(prev => ({ ...prev, page: prev.page + 1 }))}
                disabled={pagination.page * pagination.limit >= pagination.total}
                className="px-3 py-1 border rounded-lg hover:bg-gray-100 disabled:opacity-50"
              >
                <FaChevronRight />
              </button>
            </div>
          )}
        </>
      )}

      {/* Modals */}
      {showImportModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-semibold">Extraire les données</h2>
                <button onClick={() => { setShowImportModal(false); setSelectedFile(null); setExtractedData(null); }} className="text-gray-500 hover:text-gray-700">
                   <FaTimesCircle className="text-2xl" />
                </button>
              </div>

              <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center cursor-pointer hover:border-blue-400 transition duration-200" onClick={() => document.getElementById('file-upload').click()}>
                <input type="file" id="file-upload" className="hidden" accept="application/pdf" onChange={handleFileUpload} />
                <FaFilePdf className="mx-auto text-5xl text-red-500 mb-3" />
                <p className="text-gray-700 font-medium">Cliquez pour sélectionner un PDF</p>
                <p className="text-sm text-gray-500 mt-1">Seuls les fichiers PDF sont acceptés</p>
                {selectedFile && <p className="mt-2 text-sm text-blue-600">Fichier sélectionné: {selectedFile.name}</p>}
              </div>

              {/* Affichage des données extraites */}
              <div className="mt-6">
                {isExtracting ? (
                  <div className="flex items-center text-blue-600 font-medium justify-center py-4">
                    <FaRegClock className="animate-spin mr-2 text-lg" /> Extraction en cours...
                  </div>
                ) : (
                  <>
                    <h3 className="font-semibold mb-3 text-gray-800 flex items-center">
                        <FaRobot className="mr-2 text-blue-500" /> Données extraites (Prévisualisation)
                    </h3>
                    {renderExtractedData(extractedData)}
                  </>
                )}
              </div>

              <div className="mt-6 flex justify-end space-x-3">
                <button onClick={() => { setShowImportModal(false); setSelectedFile(null); setExtractedData(null); }} className="px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition duration-200">
                  Annuler
                </button>
                <button onClick={handleImport} disabled={!selectedFile || isExtracting || !extractedData} className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition duration-200 disabled:opacity-50 disabled:cursor-not-allowed">
                  Importer
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {showDetailsModal && selectedFacture && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-4">
                   <h2 className="text-xl font-semibold">Détails de la facture: {selectedFacture.numero || 'N/A'}</h2>
                   <button onClick={() => setShowDetailsModal(false)} className="text-gray-500 hover:text-gray-700">
                     <FaTimesCircle className="text-2xl" />
                   </button>
              </div>

              {/* Utilise les données de la facture sélectionnée pour l'affichage */}
              {renderExtractedData(selectedFacture)}

              <div className="mt-6 flex justify-end space-x-3">
               
                <a
                  href={selectedFacture.previewUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-4 py-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600 flex items-center"
                >
                  <FaEye className="mr-2" /> Prévisualiser
                </a>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
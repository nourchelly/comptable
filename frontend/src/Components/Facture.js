import { useState, useEffect } from 'react';
import axios from 'axios';
import { useUser } from './UserContext';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { 
  FaFileInvoice, 
  FaUpload, 
  FaTimesCircle, 
  FaFilePdf,
  FaEye,
  FaTrashAlt,
  FaFileAlt,
  FaRobot,
  FaFileSignature,
  FaCheckCircle
} from 'react-icons/fa';

export default function FactureList() {
  const navigate = useNavigate();
  const { user } = useUser();
  const [factures, setFactures] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
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

  useEffect(() => {
    const fetchFactures = async () => {
      try {
        const { data } = await axios.get('http://localhost:8000/api/factures/', {
          headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json'
          },
          withCredentials: true
        });
        
        setFactures(data.map(f => ({
          ...f,
          downloadUrl: f.id ? `http://localhost:8000/api/factures/${f.id}/download/` : null,
          previewUrl: f.id ? `http://localhost:8000/api/factures/${f.id}/download/?preview=true` : null
        })));
        
        setLoading(false);
      } catch (err) {
        console.error('Erreur:', err);
        setError(err.message);
        setLoading(false);
        toast.error(`Erreur de chargement: ${err.message}`);
      }
    };
    
    fetchFactures();
  }, []);

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

  const extractDataFromPdf = async (file) => {
    setIsExtracting(true);
    setExtractedData(null);
    setExtractionStatus(null);
    
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('type', 'invoice');
      
      const { data } = await axios.post('http://localhost:5000/api/extract-document', formData);
      
      if (data.success) {
        setExtractedData(data.data);
        setExtractionStatus('success');
        toast.success("Extraction réussie !");
      } else {
        setExtractionStatus('error');
        throw new Error(data.error || "Erreur d'extraction");
      }
    } catch (err) {
      setExtractionStatus('error');
      toast.error("Échec extraction: " + err.message);
    } finally {
      setIsExtracting(false);
    }
  };

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
      const response = await axios.post('http://localhost:8000/api/factures/', uploadData);
      
      setFactures([{
        ...response.data,
        downloadUrl: `http://localhost:8000/api/factures/${response.data.id}/download`,
        previewUrl: `http://localhost:8000/api/factures/${response.data.id}/download/?preview=true`
      }, ...factures]);
      
      toast.success('Import réussi!');
      closeModal();
      navigate(`/dashboardcomptable/rapprochement`);
    } catch (err) {
      setUploadStatus('error');
      toast.error(err.response?.data?.error || "Erreur d'import");
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Supprimer cette facture ?')) return;
    
    try {
      setIsDeleting(true);
      await axios.delete(`http://localhost:8000/api/factures/${id}/`, {
        withCredentials: true
      });
      
      setFactures(factures.filter(f => f.id !== id));
      toast.success('Suppression réussie');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Erreur de suppression');
    } finally {
      setIsDeleting(false);
    }
  };

  const openPdfPreview = (url) => setPdfPreview({ visible: true, url });
  const closePdfPreview = () => setPdfPreview({ visible: false, url: null });

  const closeModal = () => {
    setShowImportModal(false);
    setSelectedFile(null);
    setUploadProgress(0);
    setUploadStatus(null);
    setExtractedData(null);
    setExtractionStatus(null);
  };

  // Fonction pour rendre les données extraites
  const renderExtractedData = (data) => {
    if (!data) return null;
    
    // Crée un tableau avec toutes les propriétés qui ne sont pas null ou undefined
    const fields = Object.entries(data).filter(([_, value]) => value !== null && value !== undefined);
    
    return (
      <div className="space-y-2 text-sm">
        {fields.map(([key, value]) => (
          <div key={key} className="flex justify-between">
            <span className="text-gray-600">
              {key.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')}:
            </span>
            <span className="font-medium">
              {typeof value === 'number' && key.includes('montant') ? `${value} €` : value}
            </span>
          </div>
        ))}
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-xl shadow-md overflow-hidden mb-6">
          <div className="px-8 py-6">
            <div className="flex justify-between items-center">
              <div className="flex items-center">
                <div className="h-12 w-12 rounded-lg bg-blue-100 flex items-center justify-center mr-4">
                  <FaFileInvoice className="text-blue-600 text-2xl" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-gray-800">Gestion des Factures</h1>
                  <p className="text-gray-500 text-sm mt-1">Importez et gérez vos factures</p>
                </div>
              </div>
              <button
                onClick={() => setShowImportModal(true)}
                className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg transition duration-300 ease-in-out transform hover:scale-105 flex items-center shadow-md"
              >
                <FaUpload className="mr-2" />
                Importer
              </button>
            </div>
          </div>
        </div>

        {/* Dashboard simplifié */}
        <div className="bg-white rounded-xl shadow-md overflow-hidden mb-6">
          <div className="px-8 py-6 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-700">Tableau de bord</h2>
          </div>
          <div className="p-8">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-blue-50 rounded-lg p-4 border border-blue-100">
                <h3 className="text-blue-800 font-medium mb-2">Total factures</h3>
                <p className="text-3xl font-bold text-blue-900">{factures.length}</p>
              </div>
              <div className="bg-green-50 rounded-lg p-4 border border-green-100">
                <h3 className="text-green-800 font-medium mb-2">Espace utilisé</h3>
                <p className="text-3xl font-bold text-green-900">
                  {factures.length > 0 ? `${(Math.random() * 10).toFixed(2)} MB` : '0 MB'}
                </p>
              </div>
              <div className="bg-purple-50 rounded-lg p-4 border border-purple-100">
                <h3 className="text-purple-800 font-medium mb-2">Dernier import</h3>
                <p className="text-3xl font-bold text-purple-900">
                  {factures.length > 0 ? new Date().toLocaleDateString() : '—'}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Liste des factures */}
        <div className="bg-white rounded-xl shadow-md overflow-hidden">
          <div className="px-8 py-6 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-700">Liste des factures</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-4 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                  <th className="px-6 py-4 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Détails</th>
                  <th className="px-6 py-4 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {loading ? (
                  <tr>
                    <td colSpan="3" className="px-6 py-4 text-center">
                      <div className="flex justify-center py-10">
                        <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-blue-600"></div>
                      </div>
                    </td>
                  </tr>
                ) : factures.length === 0 ? (
                  <tr>
                    <td colSpan="3" className="px-6 py-4 text-center text-gray-500">
                      {error ? 'Erreur de chargement' : 'Aucune facture disponible'}
                    </td>
                  </tr>
                ) : (
                  factures.map((facture) => (
                    <tr key={facture.id}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {facture.date_import || new Date().toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500">
                        {facture.metadata && (
                          <div className="flex flex-col">
                            {facture.metadata.numero && (
                              <span>N°: {facture.metadata.numero}</span>
                            )}
                            {facture.metadata.date && (
                              <span>Date: {facture.metadata.date}</span>
                            )}
                            {facture.metadata.client && (
                              <span>Client: {facture.metadata.client}</span>
                            )}
                            {facture.metadata.montant_total && (
                              <span>Montant: {facture.metadata.montant_total} €</span>
                            )}
                            {facture.metadata.montant_ht && (
                              <span>Montant HT: {facture.metadata.montant_ht} €</span>
                            )}
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex justify-center space-x-2">
                          <button
                            onClick={() => handleDelete(facture.id)}
                            disabled={isDeleting}
                            className="flex items-center justify-center h-9 w-9 rounded-lg bg-red-50 text-red-600 hover:bg-red-100 transition-all duration-200 shadow-sm disabled:opacity-50"
                            title="Supprimer"
                          >
                            {isDeleting ? (
                              <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-red-600"></div>
                            ) : (
                              <FaTrashAlt className="text-sm" />
                            )}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Modal d'import */}
      {showImportModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50 backdrop-blur-sm">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md animate-fadeIn">
            <div className="flex justify-between items-center px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-800">Importer une facture</h3>
              <button 
                onClick={closeModal} 
                className="text-gray-400 hover:text-gray-600 transition"
                disabled={uploadStatus === 'uploading'}
              >
                <FaTimesCircle className="text-xl" />
              </button>
            </div>
            
            <div className="p-6">
              <div className="space-y-5">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Fichier PDF (max 10MB)
                  </label>
                  <div 
                    className={`mt-1 flex justify-center px-6 pt-5 pb-6 border-2 ${
                      isFileHovering ? 'border-blue-500 bg-blue-50' : 'border-gray-300'
                    } border-dashed rounded-lg transition-colors duration-200`}
                    onDragOver={(e) => {
                      e.preventDefault();
                      setIsFileHovering(true);
                    }}
                    onDragLeave={() => setIsFileHovering(false)}
                    onDrop={(e) => {
                      e.preventDefault();
                      setIsFileHovering(false);
                      if (e.dataTransfer.files[0]?.type === 'application/pdf') {
                        setSelectedFile(e.dataTransfer.files[0]);
                        extractDataFromPdf(e.dataTransfer.files[0]);
                      }
                    }}
                  >
                    <div className="space-y-2 text-center">
                      <FaUpload className="mx-auto h-12 w-12 text-gray-400" />
                      <div className="flex text-sm text-gray-600 justify-center">
                        <label
                          htmlFor="file-upload"
                          className="relative cursor-pointer bg-white rounded-md font-medium text-blue-600 hover:text-blue-500 focus-within:outline-none"
                        >
                          <span>Choisir un fichier</span>
                          <input
                            id="file-upload"
                            name="file-upload"
                            type="file"
                            className="sr-only"
                            onChange={handleFileChange}
                            accept=".pdf"
                            disabled={uploadStatus === 'uploading'}
                          />
                        </label>
                        <p className="pl-1">ou glisser-déposer</p>
                      </div>
                    </div>
                  </div>
                  {selectedFile && (
                    <div className="mt-3 p-3 bg-blue-50 border border-blue-100 rounded-lg flex items-center justify-between">
                      <div className="flex items-center">
                        <FaFilePdf className="text-red-500 mr-2" />
                        <div>
                          <p className="text-sm font-medium text-gray-900 truncate max-w-xs">{selectedFile.name}</p>
                          <p className="text-xs text-gray-500">
                            {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                          </p>
                        </div>
                      </div>
                      <button 
                        onClick={() => setSelectedFile(null)} 
                        className="text-gray-400 hover:text-gray-600"
                        disabled={uploadStatus === 'uploading'}
                      >
                        <FaTimesCircle />
                      </button>
                    </div>
                  )}
                </div>
                
                {/* Message de succès d'extraction */}
                {extractionStatus === 'success' && (
                  <div className="mt-3 p-4 bg-green-50 border border-green-100 rounded-lg animate-fadeIn">
                    <div className="flex items-center">
                      <FaCheckCircle className="text-green-600 mr-2" />
                      <h4 className="text-sm font-medium text-green-800">Extraction réussie!</h4>
                    </div>
                  </div>
                )}
                
                {extractedData && (
                  <div className="mt-3 p-4 bg-green-50 border border-green-100 rounded-lg">
                    <div className="flex items-center mb-2">
                      <FaFileSignature className="text-green-600 mr-2" />
                      <h4 className="text-sm font-medium text-green-800">Données extraites</h4>
                    </div>
                    {renderExtractedData(extractedData)}
                  </div>
                )}
                
                {isExtracting && (
                  <div className="mt-3 p-4 bg-blue-50 border border-blue-100 rounded-lg flex items-center">
                    <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-blue-600 mr-3"></div>
                    <p className="text-sm text-blue-700">Extraction en cours...</p>
                  </div>
                )}
                
                {extractionStatus === 'error' && (
                  <div className="mt-3 p-4 bg-red-50 border border-red-100 rounded-lg flex items-center">
                    <FaTimesCircle className="text-red-600 mr-2" />
                    <p className="text-sm text-red-700">Échec de l'extraction. Veuillez réessayer.</p>
                  </div>
                )}
              </div>

              {uploadStatus === 'success' && (
                <div className="mt-4 p-3 bg-green-50 border border-green-100 text-green-700 rounded-lg text-sm flex items-center">
                  <div className="h-8 w-8 rounded-full bg-green-100 text-green-500 flex items-center justify-center mr-3">
                    ✓
                  </div>
                  Import réussi!
                </div>
              )}

              {uploadStatus === 'error' && (
                <div className="mt-4 p-3 bg-red-50 border border-red-100 text-red-700 rounded-lg text-sm flex items-center">
                  <div className="h-8 w-8 rounded-full bg-red-100 text-red-500 flex items-center justify-center mr-3">
                    ✗
                  </div>
                  Erreur lors de l'import
                </div>
              )}
            </div>

            <div className="flex justify-end bg-gray-50 px-6 py-4 rounded-b-lg border-t border-gray-200">
              <button
                onClick={closeModal}
                disabled={uploadStatus === 'uploading'}
                className="mr-3 px-4 py-2 text-sm font-medium text-gray-700 hover:text-gray-900 focus:outline-none disabled:opacity-50 transition"
              >
                Annuler
              </button>
              <button
                onClick={handleUpload}
                disabled={!selectedFile || uploadStatus === 'uploading'}
                className={`px-5 py-2 text-sm font-medium text-white rounded-lg shadow-sm transition ${
                  !selectedFile || uploadStatus === 'uploading'
                    ? 'bg-blue-300 cursor-not-allowed'
                    : 'bg-blue-600 hover:bg-blue-700'
                }`}
              >
                {uploadStatus === 'uploading' ? 'Import en cours...' : 'Importer'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
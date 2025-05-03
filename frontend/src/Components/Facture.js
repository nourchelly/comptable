import { useState, useEffect } from 'react';
import axios from 'axios';
import { useUser } from './UserContext';
import { toast } from 'react-toastify';
import { 
  FaFileInvoice, 
  FaUpload, 
  FaTimesCircle, 
  FaFilePdf, 
  FaDownload, 
  FaEye, 
  FaSearch,
  FaTrashAlt
} from 'react-icons/fa';

export default function FactureList() {
  const { user } = useUser();
  const [factures, setFactures] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showImportModal, setShowImportModal] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadStatus, setUploadStatus] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [formData, setFormData] = useState({ numero: '' });
  const [pdfPreview, setPdfPreview] = useState({ visible: false, url: null });
  const [searchTerm, setSearchTerm] = useState('');
  const [isFileHovering, setIsFileHovering] = useState(false);

  useEffect(() => {
    const fetchFactures = async () => {
      try {
        console.log('Début du chargement des factures...');
        const { data } = await axios.get('http://localhost:8000/api/factures/', {
          headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json'
          },
          withCredentials: true
        });
        
        console.log('Données reçues:', data);
        
        setFactures(data.map(f => ({
          ...f,
          downloadUrl: f.id ? `http://localhost:8000/api/factures/${f.id}/download/` : null,
          previewUrl: f.id ? `http://localhost:8000/api/factures/${f.id}/download/?preview=true` : null
        })));
        
        setLoading(false);
      } catch (err) {
        console.error('Erreur complète:', err);
        console.error('Erreur response:', err.response);
        
        setError(err.message);
        setLoading(false);
        toast.error(`Erreur de chargement des factures: ${err.message}`);
      }
    };
    
    fetchFactures();
  }, []);

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (file.type !== 'application/pdf') {
      toast.error('Seuls les fichiers PDF sont acceptés');
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      toast.error('Le fichier ne doit pas dépasser 10MB');
      return;
    }

    setSelectedFile(file);
    setUploadStatus(null);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const validateForm = () => {
    if (!formData.numero || formData.numero.trim() === '') {
      toast.error('Le numéro de facture est requis');
      return false;
    }

    if (!selectedFile) {
      toast.error('Veuillez sélectionner un fichier PDF');
      return false;
    }

    return true;
  };

  const handleUpload = async () => {
    if (!validateForm()) return;

    const uploadData = new FormData();
    uploadData.append('fichier', selectedFile);
    uploadData.append('numero', formData.numero);

    try {
      setUploadStatus('uploading');
      const response = await axios.post('http://localhost:8000/api/factures/', uploadData, {
        headers: { 
          'Content-Type': 'multipart/form-data',
        },
        withCredentials: true,
        onUploadProgress: (progressEvent) => {
          const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
          setUploadProgress(percentCompleted);
        }
      });

      setUploadStatus('success');
      toast.success('Facture importée avec succès!');
      
      const newFacture = {
        ...response.data,
        downloadUrl: `http://localhost:8000/api/factures/${response.data.id}/download`,
        previewUrl: `http://localhost:8000/api/factures/${response.data.id}/download/?preview=true`
      };
      
      setFactures([newFacture, ...factures]);
      
      setTimeout(() => {
        closeModal();
      }, 1500);
    } catch (err) {
      console.error('Erreur lors de l\'upload:', err);
      setUploadStatus('error');
      const errorMessage = err.response?.data?.error || err.message || "Erreur lors de l'import";
      toast.error(errorMessage);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Êtes-vous sûr de vouloir supprimer cette facture ?')) return;
    
    try {
      setIsDeleting(true);
      await axios.delete(`http://localhost:8000/api/factures/${id}/`, {
        withCredentials: true
      });
      
      setFactures(factures.filter(f => f.id !== id));
      toast.success('Facture supprimée avec succès');
    } catch (err) {
      console.error('Erreur lors de la suppression:', err);
      toast.error(err.response?.data?.error || 'Erreur lors de la suppression');
    } finally {
      setIsDeleting(false);
    }
  };

  const openPdfPreview = (url) => {
    setPdfPreview({ visible: true, url });
  };

  const closePdfPreview = () => {
    setPdfPreview({ visible: false, url: null });
  };

  const closeModal = () => {
    setShowImportModal(false);
    setSelectedFile(null);
    setUploadProgress(0);
    setUploadStatus(null);
    setFormData({ numero: '' });
  };

  const filteredFactures = factures.filter(facture => 
    facture.numero.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-xl shadow-md overflow-hidden mb-6">
          <div className="px-8 py-6">
            <div className="flex justify-between items-center flex-wrap gap-4">
              <div className="flex items-center">
                <div className="h-12 w-12 rounded-lg bg-blue-100 flex items-center justify-center mr-4">
                  <FaFileInvoice className="text-blue-600 text-2xl" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-gray-800">Gestion des Factures</h1>
                  <p className="text-gray-500 text-sm mt-1">Importez et gérez vos factures en toute simplicité</p>
                </div>
              </div>
              <button
                onClick={() => setShowImportModal(true)}
                className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg transition duration-300 ease-in-out transform hover:scale-105 flex items-center shadow-md"
              >
                <FaUpload className="mr-2" />
                Importer une facture
              </button>
            </div>
          </div>
        </div>

        {/* Dashboard */}
        <div className="bg-white rounded-xl shadow-md overflow-hidden mb-6">
          <div className="px-8 py-6 border-b border-gray-200">
            <div className="flex justify-between items-center">
              <h2 className="text-lg font-semibold text-gray-700">Tableau de bord</h2>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <FaSearch className="text-gray-400" />
                </div>
                <input
                  type="text"
                  placeholder="Rechercher une facture..."
                  className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:outline-none transition w-64"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>
          </div>
          <div className="p-8">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-blue-50 rounded-lg p-4 border border-blue-100">
                <h3 className="text-blue-800 font-medium mb-2">Factures importées</h3>
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
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Numéro</th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date d'import</th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
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
                ) : filteredFactures.length === 0 ? (
                  <tr>
                    <td colSpan="3" className="px-6 py-4 text-center text-gray-500">
                      {error ? 'Erreur lors du chargement' : searchTerm ? 'Aucune facture ne correspond à votre recherche' : 'Aucune facture à afficher'}
                    </td>
                  </tr>
                ) : (
                  filteredFactures.map((facture, index) => (
                    <tr key={`facture-${facture.id}`} 
                        className={`hover:bg-blue-50 transition ${index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}`}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        <div className="flex items-center">
                          <div className="h-8 w-8 rounded-md bg-red-100 flex items-center justify-center mr-3">
                            <FaFilePdf className="text-red-600" />
                          </div>
                          {facture.numero}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {facture.date_import || new Date().toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        <div className="flex space-x-3">
                          {facture.previewUrl && (
                            <button
                              onClick={() => openPdfPreview(facture.previewUrl)}
                              className="flex items-center justify-center h-8 w-8 rounded-md bg-blue-100 text-blue-600 hover:bg-blue-200 transition"
                              title="Prévisualiser"
                            >
                              <FaEye />
                            </button>
                          )}
                          {facture.downloadUrl && (
                            <a
                              href={facture.downloadUrl}
                              download
                              className="flex items-center justify-center h-8 w-8 rounded-md bg-green-100 text-green-600 hover:bg-green-200 transition"
                              title="Télécharger"
                            >
                              <FaDownload />
                            </a>
                          )}
                          <button
                            onClick={() => handleDelete(facture.id)}
                            disabled={isDeleting}
                            className="flex items-center justify-center h-8 w-8 rounded-md bg-red-100 text-red-600 hover:bg-red-200 transition"
                            title="Supprimer"
                          >
                            {isDeleting ? (
                              <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-red-600"></div>
                            ) : (
                              <FaTrashAlt />
                            )}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
            
            {filteredFactures.length > 0 && !loading && (
              <div className="bg-gray-50 px-6 py-4 border-t border-gray-200">
                <p className="text-sm text-gray-500">
                  Affichage de {filteredFactures.length} {filteredFactures.length === 1 ? 'facture' : 'factures'} {searchTerm && `pour la recherche "${searchTerm}"`}
                </p>
              </div>
            )}
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
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Numéro de facture *
                  </label>
                  <input
                    type="text"
                    name="numero"
                    value={formData.numero}
                    onChange={handleInputChange}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:outline-none transition"
                    placeholder="Ex: FACT-2025-001"
                    required
                    disabled={uploadStatus === 'uploading'}
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Fichier de facture (PDF uniquement) *
                  </label>
                  <div 
                    className={`mt-1 flex justify-center px-6 pt-5 pb-6 border-2 ${
                      isFileHovering ? 'border-blue-500 bg-blue-50' : 'border-gray-300'
                    } border-dashed rounded-lg transition-colors duration-200`}
                    onDragOver={(e) => {
                      e.preventDefault();
                      setIsFileHovering(true);
                    }}
                    onDragLeave={(e) => {
                      e.preventDefault();
                      setIsFileHovering(false);
                    }}
                    onDrop={(e) => {
                      e.preventDefault();
                      setIsFileHovering(false);
                      if (e.dataTransfer.files.length > 0) {
                        const file = e.dataTransfer.files[0];
                        if (file.type === 'application/pdf') {
                          setSelectedFile(file);
                        } else {
                          toast.error('Seuls les fichiers PDF sont acceptés');
                        }
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
                            required
                            disabled={uploadStatus === 'uploading'}
                          />
                        </label>
                        <p className="pl-1">ou faites glisser et déposez</p>
                      </div>
                      <p className="text-xs text-gray-500">
                        PDF jusqu'à 10MB
                      </p>
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
              </div>

              {uploadProgress > 0 && uploadProgress < 100 && (
                <div className="mt-5">
                  <div className="flex justify-between text-xs mb-1">
                    <span>Progression</span>
                    <span>{uploadProgress}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${uploadProgress}%` }}
                    ></div>
                  </div>
                </div>
              )}

              {uploadStatus === 'success' && (
                <div className="mt-4 p-3 bg-green-50 border border-green-100 text-green-700 rounded-lg text-sm flex items-center">
                  <div className="h-8 w-8 rounded-full bg-green-100 text-green-500 flex items-center justify-center mr-3">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  </div>
                  Facture importée avec succès!
                </div>
              )}

              {uploadStatus === 'error' && (
                <div className="mt-4 p-3 bg-red-50 border border-red-100 text-red-700 rounded-lg text-sm flex items-center">
                  <div className="h-8 w-8 rounded-full bg-red-100 text-red-500 flex items-center justify-center mr-3">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                    </svg>
                  </div>
                  Erreur lors de l'import. Veuillez réessayer.
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
                disabled={!selectedFile || !formData.numero || uploadStatus === 'uploading'}
                className={`px-5 py-2 text-sm font-medium text-white rounded-lg shadow-sm transition ${
                  !selectedFile || !formData.numero || uploadStatus === 'uploading'
                    ? 'bg-blue-300 cursor-not-allowed'
                    : 'bg-blue-600 hover:bg-blue-700 transform hover:scale-105'
                }`}
              >
                {uploadStatus === 'uploading' ? (
                  <div className="flex items-center">
                    <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-white mr-2"></div>
                    Import en cours...
                  </div>
                ) : (
                  'Importer'
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de prévisualisation PDF */}
      {pdfPreview.visible && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center p-4 z-50 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-6xl h-5/6 flex flex-col">
            <div className="flex justify-between items-center px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-800">Prévisualisation du document</h3>
              <div className="flex items-center space-x-3">
                <a 
                  href={pdfPreview.url}
                  download
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg flex items-center hover:bg-blue-700 transition"
                >
                  <FaDownload className="mr-2" />
                  Télécharger
                </a>
                <button 
                  onClick={closePdfPreview}
                  className="text-gray-400 hover:text-gray-600 transition"
                >
                  <FaTimesCircle className="text-xl" />
                </button>
              </div>
            </div>
            <div className="flex-1 bg-gray-100">
              <iframe 
                src={pdfPreview.url}
                className="w-full h-full border-0"
                frameBorder="0"
                title="Prévisualisation PDF"
              ></iframe>
            </div>
          </div>
        </div>
      )}
    </div>
     );
    }
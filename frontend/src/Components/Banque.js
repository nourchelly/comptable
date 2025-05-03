import { useEffect, useState } from 'react';
import axios from 'axios';
import { useUser } from './UserContext';
import { toast } from 'react-toastify';
import { 
  FaFileInvoice, 
  FaUpload, 
  FaTimesCircle, 
  FaFilePdf, 
  FaTrash, 
  FaDownload,
  FaEye,
  FaSearch,
  FaCalendarAlt
} from 'react-icons/fa';

export default function BanqueList() {
  const { user } = useUser();
  const [banques, setBanques] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showImportModal, setShowImportModal] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadStatus, setUploadStatus] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deletingId, setDeletingId] = useState(null);
  const [formData, setFormData] = useState({ numero: '' });
  const [pdfPreview, setPdfPreview] = useState({ visible: false, url: null });
  const [searchTerm, setSearchTerm] = useState('');
  const [sortOrder, setSortOrder] = useState('desc'); // newest first

  useEffect(() => {
    fetchBanques();
  }, []);

  const fetchBanques = async () => {
    try {
      setLoading(true);
      const { data } = await axios.get('http://localhost:8000/api/banques/', {
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json'
        },
        withCredentials: true
      });
      
      const enhancedData = data.map(f => ({
        ...f,
        downloadUrl: f.id ? `http://localhost:8000/api/banques/${f.id}/download/` : null,
        previewUrl: f.id ? `http://localhost:8000/api/banques/${f.id}/download/?preview=true` : null
      }));
      
      setBanques(enhancedData);
    } catch (err) {
      console.error('Erreur complète:', err);
      setError(err.message);
      toast.error(`Erreur de chargement des relevés bancaires: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

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
      toast.error('Le numéro de banque est requis');
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
      const response = await axios.post('http://localhost:8000/api/banques/', uploadData, {
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
      toast.success('Relevé bancaire importé avec succès!');
      
      const newBanque = {
        ...response.data,
        downloadUrl: `http://localhost:8000/api/banques/${response.data.id}/download`,
        previewUrl: `http://localhost:8000/api/banques/${response.data.id}/download/?preview=true`
      };
      
      setBanques([newBanque, ...banques]);
      
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
    if (!window.confirm('Êtes-vous sûr de vouloir supprimer ce relevé bancaire ?')) return;
    
    try {
      setIsDeleting(true);
      setDeletingId(id);
      await axios.delete(`http://localhost:8000/api/banques/${id}/`, {
        withCredentials: true
      });
      
      setBanques(banques.filter(f => f.id !== id));
      toast.success('Relevé bancaire supprimé avec succès');
    } catch (err) {
      console.error('Erreur lors de la suppression:', err);
      toast.error(err.response?.data?.error || 'Erreur lors de la suppression');
    } finally {
      setIsDeleting(false);
      setDeletingId(null);
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

  const toggleSortOrder = () => {
    setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
  };

  const filteredBanques = banques
    .filter(banque => banque.numero.toLowerCase().includes(searchTerm.toLowerCase()))
    .sort((a, b) => {
      // Assuming each banque has a createdAt field, or use the id as a fallback
      const dateA = a.createdAt ? new Date(a.createdAt) : a.id;
      const dateB = b.createdAt ? new Date(b.createdAt) : b.id;
      return sortOrder === 'asc' ? dateA - dateB : dateB - dateA;
    });

  return (
    <div className="bg-gray-50 min-h-screen">
      <div className="max-w-7xl mx-auto p-6">
        {/* Header */}
        <div className="bg-white shadow-md rounded-lg p-6 mb-6">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <div className="flex items-center">
              <FaFileInvoice className="text-blue-600 text-3xl mr-3" />
              <h1 className="text-2xl font-bold text-gray-800">Gestion des Relevés Bancaires</h1>
            </div>
            <div className="flex flex-col sm:flex-row gap-4 w-full md:w-auto">
              <div className="relative flex-grow">
                <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder="Rechercher par numéro..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
                />
              </div>
              <button
                onClick={() => setShowImportModal(true)}
                className="flex items-center justify-center bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition shadow-sm"
              >
                <FaUpload className="mr-2" />
                <span>Importer un relevé</span>
              </button>
            </div>
          </div>
        </div>

        {/* Stats Card */}
        <div className="bg-white shadow-md rounded-lg p-6 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-blue-50 p-4 rounded-lg border border-blue-100">
              <h3 className="text-blue-800 font-medium mb-2">Total des relevés</h3>
              <p className="text-3xl font-bold text-blue-700">{banques.length}</p>
            </div>
            <div className="bg-green-50 p-4 rounded-lg border border-green-100">
              <h3 className="text-green-800 font-medium mb-2">Importés ce mois</h3>
              <p className="text-3xl font-bold text-green-700">
                {banques.filter(b => {
                  if (!b.createdAt) return false;
                  const now = new Date();
                  const createdDate = new Date(b.createdAt);
                  return createdDate.getMonth() === now.getMonth() && 
                         createdDate.getFullYear() === now.getFullYear();
                }).length}
              </p>
            </div>
            <div className="bg-purple-50 p-4 rounded-lg border border-purple-100">
              <h3 className="text-purple-800 font-medium mb-2">Espace utilisé</h3>
              <p className="text-3xl font-bold text-purple-700">
                {(banques.reduce((acc, b) => acc + (b.fileSize || 0), 0) / (1024 * 1024)).toFixed(2)} MB
              </p>
            </div>
          </div>
        </div>

        {/* Tableau des Banques */}
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
            <h2 className="text-lg font-semibold text-gray-800">Liste des relevés bancaires</h2>
            <button 
              onClick={toggleSortOrder}
              className="flex items-center text-sm text-gray-600 hover:text-blue-600 transition"
            >
              <FaCalendarAlt className="mr-2" />
              {sortOrder === 'desc' ? 'Plus récents d\'abord' : 'Plus anciens d\'abord'}
            </button>
          </div>
          
          {loading ? (
            <div className="flex justify-center items-center py-20">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
            </div>
          ) : error ? (
            <div className="p-6 text-center text-red-500">
              Erreur lors du chargement des données
            </div>
          ) : banques.length === 0 ? (
            <div className="p-12 text-center">
              <div className="mx-auto w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                <FaFileInvoice className="text-2xl text-gray-400" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-1">Aucun relevé bancaire</h3>
              <p className="text-gray-500 mb-6">Commencez par importer votre premier relevé bancaire.</p>
              <button
                onClick={() => setShowImportModal(true)}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
              >
                <FaUpload className="mr-2" />
                Importer un relevé
              </button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-1/3">
                      Numéro
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-1/3">
                      Date d'import
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-1/3">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredBanques.map(banque => (
                    <tr key={`banque-${banque.id}`} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {banque.numero}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {banque.createdAt ? new Date(banque.createdAt).toLocaleDateString('fr-FR', {
                          day: '2-digit',
                          month: '2-digit',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        }) : 'Non disponible'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        <div className="flex space-x-3">
                          {banque.previewUrl && (
                            <button
                              onClick={() => openPdfPreview(banque.previewUrl)}
                              className="group p-2 bg-blue-50 text-blue-600 rounded-md hover:bg-blue-100 transition-colors flex items-center"
                              title="Prévisualiser"
                            >
                              <FaEye className="group-hover:scale-110 transform transition-transform" />
                            </button>
                          )}
                          
                          {banque.downloadUrl && (
                            <a
                              href={banque.downloadUrl}
                              download
                              className="group p-2 bg-green-50 text-green-600 rounded-md hover:bg-green-100 transition-colors flex items-center"
                              title="Télécharger"
                            >
                              <FaDownload className="group-hover:scale-110 transform transition-transform" />
                            </a>
                          )}
                          
                          <button
                            onClick={() => handleDelete(banque.id)}
                            disabled={isDeleting && deletingId === banque.id}
                            className="group p-2 bg-red-50 text-red-600 rounded-md hover:bg-red-100 transition-colors flex items-center disabled:opacity-50"
                            title="Supprimer"
                          >
                            {isDeleting && deletingId === banque.id ? (
                              <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-red-600"></div>
                            ) : (
                              <FaTrash className="group-hover:scale-110 transform transition-transform" />
                            )}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          
          {filteredBanques.length > 0 && filteredBanques.length < banques.length && (
            <div className="px-6 py-4 bg-gray-50 border-t border-gray-200">
              <p className="text-sm text-gray-700">
                Affichage de <span className="font-medium">{filteredBanques.length}</span> relevés sur <span className="font-medium">{banques.length}</span> au total
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Modal d'import */}
      {showImportModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md">
            <div className="flex justify-between items-center border-b p-4">
              <h3 className="text-lg font-semibold text-gray-800">Importer un relevé bancaire</h3>
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
                    Numéro de Relevé <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="numero"
                    value={formData.numero}
                    onChange={handleInputChange}
                    className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
                    required
                    disabled={uploadStatus === 'uploading'}
                    placeholder="Ex: RB-2025-0412"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Fichier PDF du relevé bancaire <span className="text-red-500">*</span>
                  </label>
                  <div className={`mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-dashed rounded-md transition ${selectedFile ? 'border-blue-300 bg-blue-50' : 'border-gray-300 hover:border-gray-400'}`}>
                    <div className="space-y-1 text-center">
                      {!selectedFile ? (
                        <>
                          <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-blue-50 mb-3">
                            <FaUpload className="h-6 w-6 text-blue-500" />
                          </div>
                          <div className="flex text-sm text-gray-600">
                            <label
                              htmlFor="file-upload"
                              className="relative cursor-pointer bg-white rounded-md font-medium text-blue-600 hover:text-blue-500 focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-blue-500"
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
                            <p className="pl-1">ou glisser-déposer</p>
                          </div>
                          <p className="text-xs text-gray-500">
                            Format PDF uniquement, taille max. 10MB
                          </p>
                        </>
                      ) : (
                        <>
                          <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-green-50 mb-3">
                            <FaFilePdf className="h-6 w-6 text-green-500" />
                          </div>
                          <p className="text-sm font-medium text-gray-900">{selectedFile.name}</p>
                          <p className="text-xs text-gray-500">
                            {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                          </p>
                          <button 
                            onClick={() => setSelectedFile(null)}
                            className="mt-2 inline-flex items-center px-2.5 py-1.5 border border-transparent text-xs font-medium rounded text-red-700 bg-red-100 hover:bg-red-200 transition"
                            disabled={uploadStatus === 'uploading'}
                          >
                            <FaTimesCircle className="mr-1" />
                            Supprimer
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {uploadProgress > 0 && uploadStatus === 'uploading' && (
                <div className="mt-5">
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-sm font-medium text-gray-700">Progression</span>
                    <span className="text-sm font-medium text-gray-700">{uploadProgress}%</span>
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
                <div className="mt-5 p-3 bg-green-50 border border-green-200 text-green-700 rounded-md flex items-start">
                  <div className="flex-shrink-0">
                    <svg className="h-5 w-5 text-green-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div className="ml-3">
                    <p className="text-sm font-medium">Relevé bancaire importé avec succès!</p>
                  </div>
                </div>
              )}

              {uploadStatus === 'error' && (
                <div className="mt-5 p-3 bg-red-50 border border-red-200 text-red-700 rounded-md flex items-start">
                  <div className="flex-shrink-0">
                    <svg className="h-5 w-5 text-red-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div className="ml-3">
                    <p className="text-sm font-medium">Erreur lors de l'import. Veuillez réessayer.</p>
                  </div>
                </div>
              )}
            </div>

            <div className="flex justify-end bg-gray-50 px-6 py-4 rounded-b-lg">
              <button
                onClick={closeModal}
                disabled={uploadStatus === 'uploading'}
                className="mr-3 px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 transition disabled:opacity-50"
              >
                Annuler
              </button>
              <button
                onClick={handleUpload}
                disabled={!selectedFile || !formData.numero || uploadStatus === 'uploading'}
                className={`px-4 py-2 shadow-sm text-sm font-medium rounded-md text-white transition ${
                  !selectedFile || !formData.numero || uploadStatus === 'uploading'
                    ? 'bg-blue-400 cursor-not-allowed'
                    : 'bg-blue-600 hover:bg-blue-700'
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
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-6xl h-5/6 flex flex-col">
            <div className="flex justify-between items-center border-b p-4">
              <h3 className="text-lg font-semibold text-gray-800">Prévisualisation PDF</h3>
              <button 
                onClick={closePdfPreview}
                className="text-gray-400 hover:text-gray-600 transition"
              >
                <FaTimesCircle className="text-xl" />
              </button>
            </div>
            <div className="flex-1 bg-gray-100">
              <iframe 
                src={pdfPreview.url}
                className="w-full h-full"
                frameBorder="0"
                title="Prévisualisation PDF"
              ></iframe>
            </div>
            <div className="border-t p-4 bg-gray-50 flex justify-end">
              <a 
                href={pdfPreview.url?.replace('?preview=true', '')} 
                download
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                <FaDownload className="mr-2" />
                Télécharger
              </a>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
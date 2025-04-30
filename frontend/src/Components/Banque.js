import { FaEye, FaFileInvoice, FaUpload, FaTimesCircle, FaFilePdf, FaTrash, FaDownload } from 'react-icons/fa';
import { useEffect, useState } from 'react';
import axios from 'axios';
import { useUser } from './UserContext';
import { toast } from 'react-toastify';

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
  const [formData, setFormData] = useState({ numero: '' });
  const [pdfPreview, setPdfPreview] = useState({ visible: false, url: null });

  useEffect(() => {
    const fetchBanques = async () => {
      try {
        console.log('Début du chargement des Banques...');
        const { data } = await axios.get('http://localhost:8000/api/banques/', {
          headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json'
          },
          withCredentials: true
        });
        
        console.log('Données reçues:', data);
        
        setBanques(data.map(f => ({
          ...f,
          downloadUrl: f.id ? `http://localhost:8000/api/banques/${f.id}/download/` : null,
          previewUrl: f.id ? `http://localhost:8000/api/banques/${f.id}/download/?preview=true` : null
        })));
        
        setLoading(false);
      } catch (err) {
        console.error('Erreur complète:', err);
        console.error('Erreur response:', err.response);
        
        setError(err.message);
        setLoading(false);
        toast.error(`Erreur de chargement des Banques: ${err.message}`);
      }
    };
    
    fetchBanques();
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

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center">
          <FaFileInvoice className="text-blue-500 text-2xl mr-3" />
          <h1 className="text-2xl font-bold">Gestion des Relevés Bancaires</h1>
        </div>
        <button
          onClick={() => setShowImportModal(true)}
          className="flex items-center bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg transition"
        >
          <FaUpload className="mr-2" />
          Importer Relevé
        </button>
      </div>

      {/* Section de débogage */}
      <div className="mb-4 p-4 bg-gray-100 rounded-lg">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
          <div>
            <p><span className="font-semibold">Nombre de Relevés:</span> {banques.length}</p>
          </div>
        </div>
      </div>

      {/* Tableau des Banques - TAILLE AJUSTÉE */}
      <div className="bg-white rounded-lg shadow overflow-hidden w-full max-w-4xl mx-auto">
        <table className="w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider w-2/3">Numéro</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-1/3">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {loading ? (
              <tr>
                <td colSpan="2" className="px-3 py-2 text-center">
                  <div className="flex justify-center py-10">
                    <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-blue-500"></div>
                  </div>
                </td>
              </tr>
            ) : banques.length === 0 ? (
              <tr>
                <td colSpan="2" className="px-3 py-2 text-center text-gray-500">
                  {error ? 'Erreur lors du chargement' : 'Aucun relevé bancaire à afficher'}
                </td>
              </tr>
            ) : (
              banques.map(banque => (
                <tr key={`banque-${banque.id}`}>
                  <td className="px-3 py-2 whitespace-nowrap text-sm font-medium text-gray-900 text-center">
                    {banque.numero}
                  </td>
                  <td className="px-3 py-3 whitespace-nowrap text-sm text-gray-500">
                    <div className="flex space-x-2">
                      {banque.downloadUrl && (
                        <a
                          href={banque.downloadUrl}
                          download
                          className="p-2 bg-red-100 text-red-600 rounded hover:bg-red-200"
                          title="Télécharger"
                        >
                          <FaFilePdf />
                        </a>
                      )}
                      <button
                        onClick={() => handleDelete(banque.id)}
                        disabled={isDeleting}
                        className="text-red-500 hover:text-red-700"
                        title="Supprimer"
                        aria-label="Supprimer le relevé bancaire"
                      >
                        {isDeleting ? (
                          <div className="flex items-center justify-center">
                            <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-red-600"></div>
                          </div>
                        ) : (
                          <span className="text-lg">🗑️</span>
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

      {/* Modal d'import */}
      {showImportModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md">
            <div className="flex justify-between items-center border-b p-4">
              <h3 className="text-lg font-semibold">Importer un relevé bancaire</h3>
              <button 
                onClick={closeModal} 
                className="text-gray-500 hover:text-gray-700"
                disabled={uploadStatus === 'uploading'}
              >
                <FaTimesCircle className="text-xl" />
              </button>
            </div>
            
            <div className="p-6">
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Numéro de Relevé *
                  </label>
                  <input
                    type="text"
                    name="numero"
                    value={formData.numero}
                    onChange={handleInputChange}
                    className="w-full p-2 border rounded"
                    required
                    disabled={uploadStatus === 'uploading'}
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Fichier PDF du relevé bancaire *
                  </label>
                  <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-md">
                    <div className="space-y-1 text-center">
                      <div className="flex text-sm text-gray-600">
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
                      </div>
                      <p className="text-xs text-gray-500">
                        PDF jusqu'à 10MB
                      </p>
                    </div>
                  </div>
                  {selectedFile && (
                    <div className="mt-2 text-sm text-gray-700">
                      Fichier sélectionné: <span className="font-medium">{selectedFile.name}</span>
                      <span className="ml-2 text-gray-500">({(selectedFile.size / 1024 / 1024).toFixed(2)} MB)</span>
                    </div>
                  )}
                </div>
              </div>

              {uploadProgress > 0 && uploadProgress < 100 && (
                <div className="w-full bg-gray-200 rounded-full h-2.5 mt-4">
                  <div
                    className="bg-blue-600 h-2.5 rounded-full"
                    style={{ width: `${uploadProgress}%` }}
                  ></div>
                </div>
              )}

              {uploadStatus === 'success' && (
                <div className="mt-4 p-3 bg-green-100 text-green-700 rounded text-sm">
                  Relevé bancaire importé avec succès!
                </div>
              )}

              {uploadStatus === 'error' && (
                <div className="mt-4 p-3 bg-red-100 text-red-700 rounded text-sm">
                  Erreur lors de l'import. Veuillez réessayer.
                </div>
              )}
            </div>

            <div className="flex justify-end bg-gray-50 px-4 py-3 rounded-b-lg">
              <button
                onClick={closeModal}
                disabled={uploadStatus === 'uploading'}
                className="mr-2 px-4 py-2 text-sm text-gray-600 hover:text-gray-800 disabled:opacity-50"
              >
                Annuler
              </button>
              <button
                onClick={handleUpload}
                disabled={!selectedFile || !formData.numero || uploadStatus === 'uploading'}
                className={`px-4 py-2 text-sm text-white rounded ${
                  !selectedFile || !formData.numero || uploadStatus === 'uploading'
                    ? 'bg-blue-300 cursor-not-allowed'
                    : 'bg-blue-500 hover:bg-blue-600'
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
              <h3 className="text-lg font-semibold">Prévisualisation PDF</h3>
              <button 
                onClick={closePdfPreview}
                className="text-gray-500 hover:text-gray-700"
              >
                <FaTimesCircle className="text-xl" />
              </button>
            </div>
            <div className="flex-1">
              <iframe 
                src={pdfPreview.url}
                className="w-full h-full"
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
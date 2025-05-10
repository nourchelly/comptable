import { useState, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import { 
  FaFileInvoice, 
  FaUpload, 
  FaTimesCircle, 
  FaFilePdf,
  FaEye,
  FaTrashAlt,
  FaDownload,
  FaSpinner,
  FaRobot
} from 'react-icons/fa';

export default function ReleveBancaireList() {
  const [releves, setReleves] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showImportModal, setShowImportModal] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [uploadStatus, setUploadStatus] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [extractedData, setExtractedData] = useState(null);
  const [isExtracting, setIsExtracting] = useState(false);

  useEffect(() => {
    const fetchReleves = async () => {
      try {
        setLoading(true);
        const { data } = await axios.get('http://localhost:8000/api/banques/');
        setReleves(data.map(r => ({
          ...r,
          downloadUrl: r.id ? `http://localhost:8000/api/banques/${r.id}/download/` : null
        })));
        setLoading(false);
      } catch (err) {
        toast.error(`Erreur de chargement: ${err.message}`);
        setLoading(false);
      }
    };
    
    fetchReleves();
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
    await extractDataFromPdf(file);
  };

  const extractDataFromPdf = async (file) => {
    setIsExtracting(true);
    setExtractedData(null);
    
    try {
      toast.info("Extraction des données en cours...", { autoClose: false });
      
      const formData = new FormData();
      formData.append('file', file);
      formData.append('type', 'bank_statement');
      
      const { data } = await axios.post('http://localhost:5000/api/extract-document', formData);
      
      toast.dismiss();
      
      if (data.success) {
        setExtractedData(data.data);
        toast.success("Données extraites avec succès!");
      } else {
        throw new Error(data.error || "Erreur d'extraction");
      }
    } catch (err) {
      toast.error("Échec de l'extraction: " + err.message);
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
      const response = await axios.post('http://localhost:8000/api/banques/', uploadData);
      
      setReleves([{
        ...response.data,
        downloadUrl: `http://localhost:8000/api/banques/${response.data.id}/download`
      }, ...releves]);
      
      toast.success('Import réussi!');
      setShowImportModal(false);
      setSelectedFile(null);
      setExtractedData(null);
    } catch (err) {
      setUploadStatus('error');
      toast.error(err.response?.data?.error || "Erreur d'import");
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Supprimer ce relevé bancaire ?')) return;
    
    try {
      setIsDeleting(true);
      await axios.delete(`http://localhost:8000/api/banques/${id}/`);
      setReleves(releves.filter(r => r.id !== id));
      toast.success('Suppression réussie');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Erreur de suppression');
    } finally {
      setIsDeleting(false);
    }
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
                  <h1 className="text-2xl font-bold text-gray-800">Relevés Bancaires</h1>
                  <p className="text-gray-500 text-sm mt-1">Gestion des relevés PDF</p>
                </div>
              </div>
              <button
                onClick={() => setShowImportModal(true)}
                className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg flex items-center"
              >
                <FaUpload className="mr-2" />
                Importer PDF
              </button>
            </div>
          </div>
        </div>

        {/* Liste des relevés */}
        <div className="bg-white rounded-xl shadow-md overflow-hidden">
  <div className="overflow-x-auto">
    <table className="min-w-full divide-y divide-gray-200">
      <thead className="bg-gray-50">
        <tr>
          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
            <div className="flex items-center space-x-2">
              <FaFilePdf className="text-red-500" />
              <span>Nom du fichier</span>
            </div>
          </th>
          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
            Détails
          </th>
          <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
            Actions
          </th>
        </tr>
      </thead>
      <tbody className="bg-white divide-y divide-gray-200">
        {loading ? (
          <tr>
            <td colSpan="3" className="px-6 py-8 text-center">
              <div className="flex justify-center">
                <FaSpinner className="animate-spin text-blue-600 text-2xl" />
              </div>
            </td>
          </tr>
        ) : releves.length === 0 ? (
          <tr>
            <td colSpan="3" className="px-6 py-8 text-center text-gray-500">
              <div className="flex flex-col items-center justify-center space-y-2">
                <FaFileInvoice className="text-gray-400 text-3xl" />
                <span>Aucun relevé disponible</span>
              </div>
            </td>
          </tr>
        ) : (
          releves.map((releve) => (
            <tr key={releve.id} className="hover:bg-gray-50 transition-colors duration-150">
              <td className="px-6 py-4 whitespace-nowrap">
                <div className="flex items-center">
                  <div className="flex-shrink-0 h-10 w-10 bg-red-50 rounded-lg flex items-center justify-center mr-3">
                    <FaFilePdf className="text-red-500" />
                  </div>
                  <div>
                    <div className="text-sm font-medium text-gray-900">
                      {releve.nom_fichier || 'releve.pdf'}
                    </div>
                   
                  </div>
                </div>
              </td>
              <td className="px-6 py-4">
                {releve.metadata && (
                  <div className="text-sm text-gray-900 space-y-1">
                    {releve.metadata.numero_compte && (
                      <div className="flex">
                        <span className="text-gray-500 w-24">Compte:</span>
                        <span>{releve.metadata.numero_compte}</span>
                      </div>
                    )}
                    {releve.metadata.solde_final && (
                      <div className="flex">
                        <span className="text-gray-500 w-24">Solde:</span>
                        <span>{releve.metadata.solde_final} €</span>
                      </div>
                    )}
                  </div>
                )}
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                <div className="flex justify-center space-x-2">
                  {releve.downloadUrl && (
                    <a
                      href={releve.downloadUrl}
                      download
                      className="h-9 w-9 flex items-center justify-center bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition-colors"
                      title="Télécharger"
                    >
                      <FaEye className="text-sm" />
                    </a>
                  )}
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
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md">
            <div className="flex justify-between items-center border-b p-4">
              <h3 className="text-lg font-semibold text-gray-800">Importer un relevé PDF</h3>
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
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Fichier PDF (max 10MB)
                  </label>
                  <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-md">
                    <div className="space-y-1 text-center">
                      {!selectedFile ? (
                        <>
                          <FaUpload className="mx-auto h-12 w-12 text-gray-400" />
                          <div className="flex text-sm text-gray-600 justify-center">
                            <label
                              htmlFor="file-upload"
                              className="relative cursor-pointer bg-white rounded-md font-medium text-blue-600 hover:text-blue-500"
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
                          <FaFilePdf className="mx-auto h-12 w-12 text-blue-500" />
                          <p className="mt-1 text-sm font-medium text-gray-900">
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
                            className="mt-2 text-sm text-red-600 hover:text-red-800"
                          >
                            Supprimer le fichier
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                {extractedData && (
                  <div className="mt-4 p-4 bg-blue-50 border border-blue-100 rounded-lg">
                    <div className="flex items-center mb-2">
                      <FaRobot className="text-blue-500 mr-2" />
                      <h4 className="text-sm font-medium text-blue-800">Données extraites</h4>
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      {extractedData.banque && (
                        <>
                          <span className="text-gray-600">Banque:</span>
                          <span className="font-medium">{extractedData.banque}</span>
                        </>
                      )}
                      {extractedData.numero_compte && (
                        <>
                          <span className="text-gray-600">Compte:</span>
                          <span className="font-medium">{extractedData.numero_compte}</span>
                        </>
                      )}
                      {extractedData.periode && (
                        <>
                          <span className="text-gray-600">Période:</span>
                          <span className="font-medium">{extractedData.periode}</span>
                        </>
                      )}
                      {extractedData.solde_final && (
                        <>
                          <span className="text-gray-600">Solde final:</span>
                          <span className="font-medium">{extractedData.solde_final} €</span>
                        </>
                      )}
                    </div>
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

            <div className="flex justify-end bg-gray-50 px-6 py-4 rounded-b-lg border-t border-gray-200">
              <button
                onClick={() => {
                  setShowImportModal(false);
                  setSelectedFile(null);
                  setExtractedData(null);
                }}
                className="mr-3 px-4 py-2 text-sm font-medium text-gray-700 hover:text-gray-900 focus:outline-none"
              >
                Annuler
              </button>
              <button
                onClick={handleUpload}
                disabled={!selectedFile || uploadStatus === 'uploading'}
                className={`px-5 py-2 text-sm font-medium text-white rounded-lg shadow-sm ${
                  !selectedFile ? 'bg-blue-300 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700'
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
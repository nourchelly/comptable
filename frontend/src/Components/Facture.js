import { FaCheck, FaTimes, FaEye, FaFileInvoice, FaUpload, FaTimesCircle } from 'react-icons/fa'
import { Link } from 'react-router-dom'
import { useEffect, useState } from 'react'
import axios from 'axios'

export default function FactureList() {
  const [factures, setFactures] = useState([])
  const [loading, setLoading] = useState(true)
  const [showImportModal, setShowImportModal] = useState(false)
  const [selectedFile, setSelectedFile] = useState(null)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [uploadStatus, setUploadStatus] = useState(null) // 'success', 'error', null

  useEffect(() => {
    fetchFactures()
  }, [])

  const fetchFactures = async () => {
    try {
      const token = localStorage.getItem('valid')
      const res = await axios.get('http://localhost:8000/api/factures/', {
        headers: { Authorization: `Bearer ${token}` }
      })
      setFactures(res.data)
    } catch (error) {
      console.error('Erreur:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleValidation = async (id, action) => {
    try {
      const token = localStorage.getItem('valid')
      await axios.patch(
        `http://localhost:8000/api/factures/${id}/`,
        { statut: action === 'validate' ? 'valide' : 'rejete' },
        { headers: { Authorization: `Bearer ${token}` } }
      )
      setFactures(factures.map(f => 
        f.id === id ? { ...f, statut: action === 'validate' ? 'valide' : 'rejete' } : f
      ))
    } catch (error) {
      console.error('Erreur:', error)
    }
  }

  const handleFileChange = (e) => {
    const file = e.target.files[0]
    if (file && (file.type === 'application/pdf' || file.type.startsWith('image/'))) {
      setSelectedFile(file)
      setUploadStatus(null)
    } else {
      alert('Veuillez sélectionner un fichier PDF, PNG ou JPG valide.')
    }
  }

  const handleUpload = async () => {
    if (!selectedFile) return

    const formData = new FormData()
    formData.append('file', selectedFile)

    try {
      const token = localStorage.getItem('valid')
      const res = await axios.post('http://localhost:8000/api/factures/upload/', formData, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'multipart/form-data'
        },
        onUploadProgress: (progressEvent) => {
          const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total)
          setUploadProgress(percentCompleted)
        }
      })

      setUploadStatus('success')
      setTimeout(() => {
        setShowImportModal(false)
        fetchFactures() // Rafraîchir la liste
        setSelectedFile(null)
        setUploadProgress(0)
      }, 1500)
    } catch (error) {
      console.error('Erreur lors de l\'upload:', error)
      setUploadStatus('error')
    }
  }

  const closeModal = () => {
    setShowImportModal(false)
    setSelectedFile(null)
    setUploadProgress(0)
    setUploadStatus(null)
  }

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center">
          <FaFileInvoice className="text-blue-500 text-2xl mr-3" />
          <h1 className="text-2xl font-bold">Factures à Vérifier</h1>
        </div>
        <button
          onClick={() => setShowImportModal(true)}
          className="flex items-center bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg transition"
        >
          <FaUpload className="mr-2" />
          Importer Facture
        </button>
      </div>

      {/* Tableau des factures */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ID</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Numéro</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Client</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Montant</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Statut</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {loading ? (
              <tr>
                <td colSpan="7" className="px-6 py-4 text-center">
                  <div className="flex justify-center py-10">
                    <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-blue-500"></div>
                  </div>
                </td>
              </tr>
            ) : factures.length === 0 ? (
              <tr>
                <td colSpan="7" className="px-6 py-4 text-center text-gray-500">
                  Aucune facture à afficher
                </td>
              </tr>
            ) : (
              factures.map(facture => (
                <tr key={facture.id}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{facture.id}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{facture.numero}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{facture.client}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{facture.montant} €</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {new Date(facture.date_emission).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 py-1 text-xs rounded-full ${
                      facture.statut === 'valide' ? 'bg-green-100 text-green-800' :
                      facture.statut === 'rejete' ? 'bg-red-100 text-red-800' : 'bg-yellow-100 text-yellow-800'
                    }`}>
                      {facture.statut}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    <div className="flex space-x-2">
                      <Link 
                        to={`/facture/${facture.id}`}
                        className="p-2 bg-blue-100 text-blue-600 rounded hover:bg-blue-200"
                        title="Voir détails"
                      >
                        <FaEye />
                      </Link>
                      <button
                        onClick={() => handleValidation(facture.id, 'validate')}
                        className="p-2 bg-green-100 text-green-600 rounded hover:bg-green-200 disabled:opacity-50"
                        disabled={facture.statut === 'valide'}
                        title="Valider"
                      >
                        <FaCheck />
                      </button>
                      <button
                        onClick={() => handleValidation(facture.id, 'reject')}
                        className="p-2 bg-red-100 text-red-600 rounded hover:bg-red-200 disabled:opacity-50"
                        disabled={facture.statut === 'rejete'}
                        title="Rejeter"
                      >
                        <FaTimes />
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
              <h3 className="text-lg font-semibold">Importer une facture</h3>
              <button onClick={closeModal} className="text-gray-500 hover:text-gray-700">
                <FaTimesCircle className="text-xl" />
              </button>
            </div>
            
            <div className="p-6">
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Sélectionnez un fichier (PDF, PNG, JPG)
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
                          accept=".pdf,.png,.jpg,.jpeg"
                        />
                      </label>
                      <p className="pl-1">ou glisser-déposer</p>
                    </div>
                    <p className="text-xs text-gray-500">
                      PDF, PNG, JPG jusqu'à 10MB
                    </p>
                  </div>
                </div>
                {selectedFile && (
                  <div className="mt-2 text-sm text-gray-700">
                    Fichier sélectionné: <span className="font-medium">{selectedFile.name}</span>
                  </div>
                )}
              </div>

              {uploadProgress > 0 && uploadProgress < 100 && (
                <div className="w-full bg-gray-200 rounded-full h-2.5 mb-4">
                  <div
                    className="bg-blue-600 h-2.5 rounded-full"
                    style={{ width: `${uploadProgress}%` }}
                  ></div>
                </div>
              )}

              {uploadStatus === 'success' && (
                <div className="mb-4 p-3 bg-green-100 text-green-700 rounded text-sm">
                  Facture importée avec succès!
                </div>
              )}

              {uploadStatus === 'error' && (
                <div className="mb-4 p-3 bg-red-100 text-red-700 rounded text-sm">
                  Erreur lors de l'import. Veuillez réessayer.
                </div>
              )}
            </div>

            <div className="flex justify-end bg-gray-50 px-4 py-3 rounded-b-lg">
              <button
                onClick={closeModal}
                className="mr-2 px-4 py-2 text-sm text-gray-600 hover:text-gray-800"
              >
                Annuler
              </button>
              <button
                onClick={handleUpload}
                disabled={!selectedFile || uploadStatus === 'success'}
                className={`px-4 py-2 text-sm text-white rounded ${
                  !selectedFile || uploadStatus === 'success'
                    ? 'bg-blue-300 cursor-not-allowed'
                    : 'bg-blue-500 hover:bg-blue-600'
                }`}
              >
                Importer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
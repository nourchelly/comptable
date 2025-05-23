import { useEffect, useState } from 'react'
import axios from 'axios'
import { useParams, Link } from 'react-router-dom'
import { useUser } from './UserContext'
import { FaArrowLeft } from 'react-icons/fa'

export default function FactureDetail() {
  const { id } = useParams()
  const { user } = useUser()
  const [facture, setFacture] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    const fetchFacture = async () => {
      try {
        const response = await axios.get(`http://127.0.0.1:8000/api/factures/${id}/`, {
          withCredentials: true
        })
        setFacture({
          ...response.data,
          fileUrl: response.data.fichier ? `http://127.0.0.1:8000${response.data.fichier}` : null
        })
      } catch (err) {
        setError(err.message)
      } finally {
        setLoading(false)
      }
    }
    fetchFacture()
  }, [id])

  if (loading) return <div className="p-6">Chargement...</div>
  if (error) return <div className="p-6 text-red-500">Erreur: {error}</div>
  if (!facture) return <div className="p-6">Facture non trouvée</div>

  return (
    <div className="p-6">
      <Link 
        to="/dashboardcomptable/facture" 
        className="flex items-center text-blue-500 mb-4"
      >
        <FaArrowLeft className="mr-2" /> Retour à la liste
      </Link>
      
      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <h2 className="text-xl font-bold mb-4">Détails de la facture</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <div>
            <p className="font-semibold">Numéro:</p>
            <p>{facture.numero}</p>
          </div>
          <div>
        </div>

        {facture.fileUrl && (
          <div className="mt-6">
            <h3 className="font-semibold mb-2">Document de facture:</h3>
            {facture.fileUrl.endsWith('.pdf') ? (
              <embed 
                src={facture.fileUrl} 
                type="application/pdf" 
                width="100%" 
                height="600px" 
                className="border rounded-lg"
              />
            ) : (
              <img 
                src={facture.fileUrl} 
                alt="Facture" 
                className="max-w-full h-auto border rounded-lg"
              />
            )}
          </div>
        )}
      </div>
    </div>
 </div>
  )}
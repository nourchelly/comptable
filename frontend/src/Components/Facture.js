import { FaCheck, FaTimes, FaEye, FaFileInvoice } from 'react-icons/fa'
import { Link } from 'react-router-dom'
import { useEffect, useState } from 'react'
import axios from 'axios'

export default function FactureList() {
  const [factures, setFactures] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
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
    fetchFactures()
  }, [])

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

  return (
    <div className="p-6">
      <div className="flex items-center mb-6">
        <FaFileInvoice className="text-blue-500 text-2xl mr-3" />
        <h1 className="text-2xl font-bold">Factures à Vérifier</h1>
      </div>

      {loading ? (
        <div className="flex justify-center py-10">
          <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-blue-500"></div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {factures.map(facture => (
            <div key={facture.id} className="bg-white rounded-lg shadow p-6 border-l-4 border-blue-500">
              <div className="flex justify-between items-start mb-4">
                <h2 className="font-bold text-lg">{facture.numero}</h2>
                <span className={`px-2 py-1 text-xs rounded-full ${
                  facture.statut === 'valide' ? 'bg-green-100 text-green-800' :
                  facture.statut === 'rejete' ? 'bg-red-100 text-red-800' : 'bg-yellow-100 text-yellow-800'
                }`}>
                  {facture.statut}
                </span>
              </div>

              <div className="space-y-2 mb-6">
                <p><span className="font-semibold">Client:</span> {facture.client}</p>
                <p><span className="font-semibold">Montant:</span> {facture.montant} €</p>
                <p><span className="font-semibold">Date:</span> {new Date(facture.date_emission).toLocaleDateString()}</p>
              </div>

              <div className="flex space-x-3">
                <Link 
                  to={`/facture/${facture.id}`}
                  className="p-2 bg-blue-100 text-blue-600 rounded hover:bg-blue-200"
                >
                  <FaEye />
                </Link>
                <button
                  onClick={() => handleValidation(facture.id, 'validate')}
                  className="p-2 bg-green-100 text-green-600 rounded hover:bg-green-200"
                  disabled={facture.statut === 'valide'}
                >
                  <FaCheck />
                </button>
                <button
                  onClick={() => handleValidation(facture.id, 'reject')}
                  className="p-2 bg-red-100 text-red-600 rounded hover:bg-red-200"
                  disabled={facture.statut === 'rejete'}
                >
                  <FaTimes />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
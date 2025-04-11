import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { FaSave, FaTimes, FaFileAlt, FaSpinner } from 'react-icons/fa';
import axios from 'axios';

const ModifierRapport = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [report, setReport] = useState({
    nom: '',
    type: 'Financier',
    date: new Date().toISOString().split('T')[0],
    statut: 'En attente',
    contenu: ''
  });
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const fetchReport = async () => {
      try {
        const token = localStorage.getItem('valid');
        const response = await axios.get(`http://127.0.0.1:8000/api/rapports/${id}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setReport(response.data);
      } catch (error) {
        console.error("Erreur chargement rapport:", error);
        alert("Erreur lors du chargement du rapport");
      } finally {
        setLoading(false);
      }
    };
    fetchReport();
  }, [id]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setReport(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const token = localStorage.getItem('valid');
      await axios.put(`http://127.0.0.1:8000/api/rapports/${id}`, report, {
        headers: { Authorization: `Bearer ${token}` }
      });
      alert("Rapport modifié avec succès");
      navigate('/dashboardcomptable/rapports');
    } catch (error) {
      console.error("Erreur modification:", error);
      alert("Erreur lors de la modification du rapport");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500 mx-auto"></div>
          <p className="mt-4 text-gray-600">Chargement du rapport...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-5xl mx-auto">
        <div className="bg-white shadow-xl rounded-lg overflow-hidden">
          {/* Header avec bouton Annuler modifié */}
          <div className="bg-gradient-to-r from-indigo-600 to-indigo-800 px-6 py-5 sm:px-8 flex justify-between items-center">
            <div className="flex items-center">
              <FaFileAlt className="text-white text-2xl mr-3" />
              <h2 className="text-2xl font-bold text-white">Modifier le Rapport</h2>
            </div>
         
          </div>

          {/* Form Container */}
          <div className="px-6 py-8 sm:px-8">
            <form onSubmit={handleSubmit} className="space-y-8">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Nom du rapport */}
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700">Nom du rapport</label>
                  <div className="mt-1 relative rounded-md shadow-sm">
                    <input
                      type="text"
                      name="nom"
                      value={report.nom}
                      onChange={handleChange}
                      className="block w-full pl-4 pr-10 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                      required
                      placeholder="Nom du rapport"
                    />
                  </div>
                </div>

                {/* Type de rapport */}
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700">Type de rapport</label>
                  <div className="mt-1 relative rounded-md shadow-sm">
                    <select
                      name="type"
                      value={report.type}
                      onChange={handleChange}
                      className="block w-full pl-4 pr-10 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm appearance-none bg-white"
                    >
                      <option value="Financier">Financier</option>
                      <option value="Bilan">Bilan</option>
                      <option value="Trésorerie">Trésorerie</option>
                      <option value="Fiscal">Fiscal</option>
                    </select>
                    <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                      <svg className="h-5 w-5 text-gray-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                      </svg>
                    </div>
                  </div>
                </div>

                {/* Date */}
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700">Date</label>
                  <div className="mt-1 relative rounded-md shadow-sm">
                    <input
                      type="date"
                      name="date"
                      value={report.date}
                      onChange={handleChange}
                      className="block w-full pl-4 pr-10 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                      required
                    />
                  </div>
                </div>

                {/* Statut */}
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700">Statut</label>
                  <div className="mt-1 relative rounded-md shadow-sm">
                    <select
                      name="statut"
                      value={report.statut}
                      onChange={handleChange}
                      className="block w-full pl-4 pr-10 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm appearance-none bg-white"
                    >
                      <option value="En attente">En attente</option>
                      <option value="Validé">Validé</option>
                      <option value="Brouillon">Brouillon</option>
                      <option value="Rejeté">Rejeté</option>
                    </select>
                    <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                      <svg className="h-5 w-5 text-gray-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                      </svg>
                    </div>
                  </div>
                </div>

                {/* Contenu */}
                <div className="md:col-span-2 space-y-2">
                  <label className="block text-sm font-medium text-gray-700">Contenu</label>
                  <div className="mt-1">
                    <textarea
                      name="contenu"
                      value={report.contenu}
                      onChange={handleChange}
                      rows="10"
                      className="block w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm shadow-sm"
                      placeholder="Entrez le contenu détaillé du rapport..."
                    ></textarea>
                  </div>
                </div>
              </div>

              {/* Submit Button */}
              <div className="pt-6 border-t border-gray-200">
                <div className="flex justify-end space-x-4">
                  <Link 
                    to="/dashboardcomptable/rapports"
                    className="inline-flex items-center px-6 py-3 border border-gray-300 text-base font-medium rounded-md shadow-sm text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition duration-200"
                  >
                    <FaTimes className="mr-2" /> Annuler
                  </Link>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className={`inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition duration-200 ${isSubmitting ? 'opacity-75 cursor-not-allowed' : ''}`}
                  >
                    {isSubmitting ? (
                      <>
                        <FaSpinner className="animate-spin mr-2" />
                        Enregistrement...
                      </>
                    ) : (
                      <>
                        <FaSave className="mr-2" />
                        Enregistrer
                      </>
                    )}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ModifierRapport;
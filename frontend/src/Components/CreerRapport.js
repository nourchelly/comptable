import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaSave, FaTimes, FaFileAlt, FaSpinner } from 'react-icons/fa';
import axios from 'axios';

const NouveauRapport = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    nom: '',
    type: 'Financier',
    date: new Date().toISOString().split('T')[0],
    statut: 'En attente',
    contenu: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const token = localStorage.getItem('valid');
      await axios.post('http://127.0.0.1:8000/api/rapports', formData, {
        headers: { Authorization: `Bearer ${token}` }
      });
      navigate('/dashboardcomptable/rapports');
    } catch (error) {
      console.error("Erreur création rapport:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-5xl mx-auto">
        <div className="bg-white shadow-xl rounded-lg overflow-hidden">
          {/* En-tête avec bouton Annuler amélioré */}
          <div className="bg-gradient-to-r from-indigo-600 to-indigo-800 px-6 py-5 sm:px-8 flex justify-between items-center">
            <div className="flex items-center">
              <FaFileAlt className="text-white text-2xl mr-3" />
              <h2 className="text-2xl font-bold text-white">Nouveau Rapport Comptable</h2>
            </div>
           
          </div>

          {/* Contenu du formulaire */}
          <div className="px-6 py-8 sm:px-8">
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Nom du rapport */}
                <div className="space-y-1">
                  <label className="block text-sm font-medium text-gray-700">Nom du rapport</label>
                  <input
                    type="text"
                    name="nom"
                    value={formData.nom}
                    onChange={handleChange}
                    className="mt-1 block w-full px-4 py-3 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                    required
                    placeholder="Nom du rapport"
                  />
                </div>

                {/* Type de rapport */}
                <div className="space-y-1">
                  <label className="block text-sm font-medium text-gray-700">Type de rapport</label>
                  <select
                    name="type"
                    value={formData.type}
                    onChange={handleChange}
                    className="mt-1 block w-full pl-4 pr-10 py-3 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm appearance-none bg-white"
                  >
                    <option value="Financier">Financier</option>
                    <option value="Bilan">Bilan</option>
                    <option value="Trésorerie">Trésorerie</option>
                    <option value="Fiscal">Fiscal</option>
                  </select>
                </div>

                {/* Date */}
                <div className="space-y-1">
                  <label className="block text-sm font-medium text-gray-700">Date</label>
                  <input
                    type="date"
                    name="date"
                    value={formData.date}
                    onChange={handleChange}
                    className="mt-1 block w-full px-4 py-3 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                    required
                  />
                </div>

                {/* Statut */}
                <div className="space-y-1">
                  <label className="block text-sm font-medium text-gray-700">Statut</label>
                  <select
                    name="statut"
                    value={formData.statut}
                    onChange={handleChange}
                    className="mt-1 block w-full pl-4 pr-10 py-3 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm appearance-none bg-white"
                  >
                    <option value="En attente">En attente</option>
                    <option value="Validé">Validé</option>
                    <option value="Brouillon">Brouillon</option>
                  </select>
                </div>

                {/* Contenu */}
                <div className="md:col-span-2 space-y-1">
                  <label className="block text-sm font-medium text-gray-700">Contenu</label>
                  <textarea
                    name="contenu"
                    value={formData.contenu}
                    onChange={handleChange}
                    rows="8"
                    className="mt-1 block w-full px-4 py-3 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                    placeholder="Saisissez le contenu détaillé du rapport..."
                  ></textarea>
                </div>
              </div>

              {/* Boutons d'action */}
              <div className="pt-6 border-t border-gray-200">
                <div className="flex justify-end space-x-3">
                  <button
                    type="button"
                    onClick={() => navigate('/dashboardcomptable/rapports')}
                    className="inline-flex items-center px-6 py-3 border border-gray-300 text-sm font-medium rounded-md shadow-sm text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                  >
                    <FaTimes className="mr-2" /> Annuler
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className={`inline-flex items-center px-6 py-3 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 ${isSubmitting ? 'opacity-75 cursor-not-allowed' : ''}`}
                  >
                    {isSubmitting ? (
                      <>
                        <FaSpinner className="animate-spin mr-2" />
                        Création en cours...
                      </>
                    ) : (
                      <>
                        <FaSave className="mr-2" /> Générer le Rapport
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

export default NouveauRapport;
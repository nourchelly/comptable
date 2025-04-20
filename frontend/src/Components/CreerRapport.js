import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaSave, FaTimes, FaFileAlt, FaSpinner } from 'react-icons/fa';
import axios from 'axios';
import { toast } from 'react-toastify'; // Ajout pour les notifications
import 'react-toastify/dist/ReactToastify.css';
import axiosInstance from './AxiosInstance';
// Types de rapports prédéfinis
const REPORT_TYPES = [
  { value: 'Financier', label: 'Financier' },
  { value: 'Bilan', label: 'Bilan' },
  { value: 'Trésorerie', label: 'Trésorerie' },
  { value: 'Fiscal', label: 'Fiscal' }
];

// Statuts possibles
const REPORT_STATUSES = [
  { value: 'En attente', label: 'En attente' },
  { value: 'Validé', label: 'Validé' },
  { value: 'Brouillon', label: 'Brouillon' }
];

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
  const [errors, setErrors] = useState({}); // Gestion des erreurs

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Effacer l'erreur quand l'utilisateur corrige
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.nom.trim()) {
      newErrors.nom = 'Le nom du rapport est requis';
    }
    
    if (!formData.contenu.trim()) {
      newErrors.contenu = 'Le contenu ne peut pas être vide';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Dans votre composant NouveauRapport
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) return;
  
    setIsSubmitting(true);
  
    try {
      const response = await axiosInstance.post('rapports/create/', formData);
      
      toast.success("Rapport créé avec succès !");
      navigate('/dashboardcomptable/rapports');
    } catch (error) {
      console.error("Erreur création rapport:", error);
      
      let errorMessage = "Erreur lors de la création";
      if (error.response?.status === 401) {
        errorMessage = "Session expirée, veuillez vous reconnecter";
        localStorage.removeItem('access_token');
        localStorage.removeItem('refresh_token');
        navigate('/login');
      } else if (error.response?.status === 500) {
        errorMessage = "Le serveur est momentanément indisponible. Veuillez réessayer plus tard.";
      } else if (error.response?.data) {
        errorMessage = error.response.data.error || JSON.stringify(error.response.data);
      }
      
      toast.error(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };
  

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-5xl mx-auto">
        <div className="bg-white shadow-xl rounded-lg overflow-hidden">
          {/* En-tête */}
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
                  <label className="block text-sm font-medium text-gray-700">
                    Nom du rapport <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="nom"
                    value={formData.nom}
                    onChange={handleChange}
                    className={`mt-1 block w-full px-4 py-3 border ${errors.nom ? 'border-red-500' : 'border-gray-300'} rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm`}
                    required
                    placeholder="Nom du rapport"
                  />
                  {errors.nom && <p className="mt-1 text-sm text-red-600">{errors.nom}</p>}
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
                    {REPORT_TYPES.map(type => (
                      <option key={type.value} value={type.value}>
                        {type.label}
                      </option>
                    ))}
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
                    {REPORT_STATUSES.map(status => (
                      <option key={status.value} value={status.value}>
                        {status.label}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Contenu */}
                <div className="md:col-span-2 space-y-1">
                  <label className="block text-sm font-medium text-gray-700">
                    Contenu <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    name="contenu"
                    value={formData.contenu}
                    onChange={handleChange}
                    rows="8"
                    className={`mt-1 block w-full px-4 py-3 border ${errors.contenu ? 'border-red-500' : 'border-gray-300'} rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm`}
                    placeholder="Saisissez le contenu détaillé du rapport..."
                  ></textarea>
                  {errors.contenu && <p className="mt-1 text-sm text-red-600">{errors.contenu}</p>}
                </div>
              </div>

              {/* Boutons d'action */}
              <div className="pt-6 border-t border-gray-200">
                <div className="flex justify-end space-x-3">
                  <button
                    type="button"
                    onClick={() => navigate('/dashboardcomptable/rapports')}
                    className="inline-flex items-center px-6 py-3 border border-gray-300 text-sm font-medium rounded-md shadow-sm text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                    disabled={isSubmitting}
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
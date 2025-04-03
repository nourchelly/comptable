import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaSave, FaTimes, FaFileAlt } from 'react-icons/fa';
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

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('valid');
      await axios.post('http://127.0.0.1:8000/api/rapports', formData, {
        headers: { Authorization: `Bearer ${token}` }
      });
      navigate('/dashboardcomptable/rapports');
    } catch (error) {
      console.error("Erreur création rapport:", error);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6 bg-white rounded-lg shadow-md">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-blue-600 flex items-center">
          <FaFileAlt className="mr-2" /> Nouveau Rapport
        </h2>
        <button 
          onClick={() => navigate('/dashboardcomptable/rapports')}
          className="flex items-center px-4 py-2 bg-gray-200 text-gray-800 rounded hover:bg-gray-300"
        >
          <FaTimes className="mr-2" /> Annuler
        </button>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Nom du rapport</label>
            <input
              type="text"
              name="nom"
              value={formData.nom}
              onChange={handleChange}
              className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Type de rapport</label>
            <select
              name="type"
              value={formData.type}
              onChange={handleChange}
              className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="Financier">Financier</option>
              <option value="Bilan">Bilan</option>
              <option value="Trésorerie">Trésorerie</option>
              <option value="Fiscal">Fiscal</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
            <input
              type="date"
              name="date"
              value={formData.date}
              onChange={handleChange}
              className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Statut</label>
            <select
              name="statut"
              value={formData.statut}
              onChange={handleChange}
              className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="En attente">En attente</option>
              <option value="Validé">Validé</option>
              <option value="Brouillon">Brouillon</option>
            </select>
          </div>

          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">Contenu</label>
            <textarea
              name="contenu"
              value={formData.contenu}
              onChange={handleChange}
              rows="6"
              className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="Saisissez le contenu du rapport..."
            ></textarea>
          </div>
        </div>

        <div className="flex justify-end">
          <button
            type="submit"
            className="flex items-center px-6 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
          >
            <FaSave className="mr-2" /> Générer le Rapport
          </button>
        </div>
      </form>
    </div>
  );
};

export default NouveauRapport;
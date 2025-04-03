import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { FaSave, FaTimes, FaFileAlt } from 'react-icons/fa';
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
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-6 bg-white rounded-lg shadow-md">
      <div className="flex justify-between items-center mb-8">
        <h2 className="text-2xl font-bold text-blue-600 flex items-center">
          <FaFileAlt className="mr-3" /> Modifier le Rapport
        </h2>
        <Link 
          to="/dashboardcomptable/rapports"
          className="flex items-center px-4 py-2 bg-gray-200 text-gray-800 rounded hover:bg-gray-300 transition duration-200"
        >
          <FaTimes className="mr-2" /> Annuler
        </Link>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Nom du rapport</label>
            <input
              type="text"
              name="nom"
              value={report.nom}
              onChange={handleChange}
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Type de rapport</label>
            <select
              name="type"
              value={report.type}
              onChange={handleChange}
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="Financier">Financier</option>
              <option value="Bilan">Bilan</option>
              <option value="Trésorerie">Trésorerie</option>
              <option value="Fiscal">Fiscal</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Date</label>
            <input
              type="date"
              name="date"
              value={report.date}
              onChange={handleChange}
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Statut</label>
            <select
              name="statut"
              value={report.statut}
              onChange={handleChange}
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="En attente">En attente</option>
              <option value="Validé">Validé</option>
              <option value="Brouillon">Brouillon</option>
              <option value="Rejeté">Rejeté</option>
            </select>
          </div>

          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-2">Contenu</label>
            <textarea
              name="contenu"
              value={report.contenu}
              onChange={handleChange}
              rows="8"
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="Entrez le contenu détaillé du rapport..."
            ></textarea>
          </div>
        </div>

        <div className="flex justify-end pt-4">
          <button
            type="submit"
            className="flex items-center px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition duration-200 shadow hover:shadow-lg"
          >
            <FaSave className="mr-2" /> Enregistrer les modifications
          </button>
        </div>
      </form>
    </div>
  );
};

export default ModifierRapport;
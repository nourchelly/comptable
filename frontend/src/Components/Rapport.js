import React, { useState, useEffect } from 'react';
import { FaSearch, FaEdit, FaTrash, FaFileDownload, FaPlus } from 'react-icons/fa';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { useUser } from './UserContext';
import { toast } from "react-toastify";

const ListeRapports = () => {
    const { user } = useUser();
    const [reports, setReports] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [isLoading, setIsLoading] = useState(true);
    const [formData, setFormData] = useState({
      nom: "",
      type: "Financier",
      date: "",
      statut: "Brouillon",
      contenu: "",
      facture_id: ""
  });
    const [showForm, setShowForm] = useState(false);
    const [editingId, setEditingId] = useState(null);

    useEffect(() => {
        const fetchReports = async () => {
            try {
                setIsLoading(true);
                const response = await axios.get('http://127.0.0.1:8000/api/rapports/', {
                    withCredentials: true
                });

                const normalizedReports = (response.data.rapports || []).map(report => ({
                    _id: report.id,
                    nom: report.nom,
                    type: report.type,
                    date: report.date,
                    statut: report.statut,
                    contenu: report.contenu,
                    facture_id: report.facture_id,
                    created_at: report.created_at
                }));

                setReports(normalizedReports);
            } catch (error) {
                toast.error("Erreur lors du chargement des rapports");
                console.error("Erreur:", error);
            } finally {
                setIsLoading(false);
            }
        };

        fetchReports();
    }, []);

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handleSubmit = async (e) => {
      e.preventDefault();
      try {
          // Prépare les données
          const dataToSend = {
              nom: formData.nom || "",
              type: formData.type || "Financier",
              statut: formData.statut || "Brouillon",
              contenu: formData.contenu || "",
              facture_id: formData.facture_id || null,
              date: formData.date || null
          };
  
          // Envoie la requête
          const response = await axios.put(
              `http://127.0.0.1:8000/api/rapports/${editingId}/`,
              dataToSend,
              {
                  headers: {
                      'Content-Type': 'application/json',
                  },
                  withCredentials: true
              }
          );
  
          // Met à jour l'état
          setReports(reports.map(report => 
              report._id === editingId ? response.data.data : report
          ));
          toast.success("Rapport mis à jour avec succès");
          resetForm();
      } catch (error) {
          console.error("Erreur détaillée:", error.response?.data);
          toast.error(error.response?.data?.error || "Erreur lors de la mise à jour");
      }
  };

    const resetForm = () => {
        setFormData({
            nom: "",
            type: "Financier",
            date: "",
            statut: "Brouillon",
            contenu: "",
            facture_id: ""
        });
        setEditingId(null);
        setShowForm(false);
    };

   // Dans handleEdit
const handleEdit = (report) => {
  setFormData({
      nom: report.nom || "",
      type: report.type || "Financier",
      date: report.date ? report.date.split('T')[0] : "",
      statut: report.statut || "Brouillon",
      contenu: report.contenu || "",
      facture_id: report.facture_id || ""
  });
  setEditingId(report._id);
  setShowForm(true);
};

    const handleDelete = async (id) => {
        if (window.confirm("Êtes-vous sûr de vouloir supprimer ce rapport ?")) {
            try {
                await axios.delete(`http://127.0.0.1:8000/api/rapports/${id}/`, {
                    withCredentials: true
                });
                setReports(reports.filter(report => report._id !== id));
                toast.success("Rapport supprimé avec succès");
            } catch (error) {
                toast.error(error.response?.data?.error || "Erreur lors de la suppression");
                console.error("Erreur:", error);
            }
        }
    };

    const filteredReports = reports.filter(report => {
        const matchesSearch = report.nom.toLowerCase().includes(searchTerm.toLowerCase()) ||
                             report.type.toLowerCase().includes(searchTerm.toLowerCase());
        return matchesSearch;
    });

    if (isLoading) {
        return <div className="text-center py-10">Chargement...</div>;
    }

    return (
        <div className="max-w-6xl mx-auto p-6 bg-white rounded-lg shadow-md">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6">
                <h2 className="text-2xl font-bold text-blue-600 mb-4 md:mb-0">Gestion des Rapports</h2>
                <div className="flex space-x-3 w-full md:w-auto">
                    <div className="relative flex-1 md:w-64">
                        <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                        <input
                            type="text"
                            placeholder="Rechercher..."
                            className="pl-10 pr-4 py-2 w-full border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                    <button
                        onClick={() => setShowForm(true)}
                        className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 whitespace-nowrap flex items-center"
                    >
                        <FaPlus className="mr-2" /> Nouveau Rapport
                    </button>
                </div>
            </div>

            {showForm && (
                <div className="mb-6 p-4 bg-gray-50 rounded-lg">
                    <h3 className="text-lg font-semibold mb-3">
                        {editingId ? "Modifier le rapport" : "Créer un nouveau rapport"}
                    </h3>
                    <form onSubmit={handleSubmit}>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700">Nom</label>
                                <input
    type="text"
    name="nom"
    value={formData.nom || ""}
    onChange={handleInputChange}
    className="mt-1 block w-full border rounded-md p-2"
    required
/>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700">Type</label>
                                <select
                                    name="type"
                                    value={formData.type}
                                    onChange={handleInputChange}
                                    className="mt-1 block w-full border rounded-md p-2"
                                    required
                                >
                                    <option value="Financier">Financier</option>
                                    <option value="Bilan">Bilan</option>
                                    <option value="Trésorerie">Trésorerie</option>
                                    <option value="Fiscal">Fiscal</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700">Date</label>
                                <input
    type="date"
    name="date"
    value={formData.date || ""}
    onChange={handleInputChange}
    className="mt-1 block w-full border rounded-md p-2"
/>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700">Statut</label>
                                <select
                                    name="statut"
                                    value={formData.statut}
                                    onChange={handleInputChange}
                                    className="mt-1 block w-full border rounded-md p-2"
                                >
                                    <option value="Brouillon">Brouillon</option>
                                    <option value="En attente">En attente</option>
                                    <option value="Validé">Validé</option>
                                    <option value="Rejeté">Rejeté</option>
                                </select>
                            </div>
                            <div className="md:col-span-2">
                                <label className="block text-sm font-medium text-gray-700">Contenu</label>
                                <textarea
    name="contenu"
    value={formData.contenu || ""}
    onChange={handleInputChange}
    className="mt-1 block w-full border rounded-md p-2"
    rows="3"
/>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700">ID Facture</label>
                                <input
                                    type="text"
                                    name="facture_id"
                                    value={formData.facture_id}
                                    onChange={handleInputChange}
                                    className="mt-1 block w-full border rounded-md p-2"
                                />
                            </div>
                        </div>
                        <div className="mt-4 flex justify-end space-x-3">
                            <button
                                type="button"
                                onClick={resetForm}
                                className="px-4 py-2 bg-gray-200 text-gray-800 rounded hover:bg-gray-300"
                            >
                                Annuler
                            </button>
                            <button
                                type="submit"
                                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                            >
                                {editingId ? "Mettre à jour" : "Créer"}
                            </button>
                        </div>
                    </form>
                </div>
            )}

            <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Nom</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Statut</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {filteredReports.map((report) => (
                            <tr key={report._id} className="hover:bg-gray-50">
                                <td className="px-6 py-4 whitespace-nowrap">{report.nom}</td>
                                <td className="px-6 py-4 whitespace-nowrap">{report.type}</td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                    {report.date ? new Date(report.date).toLocaleDateString() : 'N/A'}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                    <span className={`px-2 py-1 rounded-full text-xs ${
                                        report.statut === 'Validé' ? 'bg-green-100 text-green-800' :
                                        report.statut === 'En attente' ? 'bg-yellow-100 text-yellow-800' :
                                        report.statut === 'Rejeté' ? 'bg-red-100 text-red-800' :
                                        'bg-gray-100 text-gray-800'
                                    }`}>
                                        {report.statut}
                                    </span>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                    <div className="flex space-x-2">
                                        <button 
                                            onClick={() => handleEdit(report)}
                                            className="text-blue-600 hover:text-blue-800 p-1"
                                        >
                                            <FaEdit />
                                        </button>
                                        <button 
                                            onClick={() => handleDelete(report._id)}
                                            className="text-red-600 hover:text-red-800 p-1"
                                        >
                                            <FaTrash />
                                        </button>
                                        <Link
                                            to={`/dashboardcomptable/exporter_rapport/${report._id}`}
                                            className="text-green-600 hover:text-green-800 p-1"
                                        >
                                            <FaFileDownload />
                                        </Link>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default ListeRapports;
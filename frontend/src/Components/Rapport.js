import React, { useState, useEffect } from 'react';
import { FaSearch, FaEdit, FaTrash, FaFileDownload, FaPlus } from 'react-icons/fa';
import { Link } from 'react-router-dom';
import axios from 'axios';

const ListeRapports = () => {
    const [reports, setReports] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setLoading(true);
    const fetchReports = async () => {
      try {
        const token = localStorage.getItem('valid');
        const response = await axios.get('http://127.0.0.1:8000/api/rapports', {
          headers: { Authorization: `Bearer ${token}` }
        });
        setReports(response.data);
      } catch (error) {
        console.error("Erreur chargement rapports:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchReports();
  }, []);
  const handleDelete = async (id) => {
    if (window.confirm("Voulez-vous vraiment supprimer ce rapport ?")) {
      try {
        const token = localStorage.getItem('valid');
        await axios.delete(`http://127.0.0.1:8000/api/rapports/${id}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setReports(reports.filter(report => report._id !== id));
      } catch (error) {
        console.error("Erreur suppression rapport:", error);
        alert("Erreur lors de la suppression du rapport");
      }
    }
  };

  const filteredReports = reports.filter(report =>
    report.nom.toLowerCase().includes(searchTerm.toLowerCase()) ||
    report.type.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
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
          <Link 
            to="/dashboardcomptable/creer_rapport"
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 whitespace-nowrap flex items-center"
          >
            <FaPlus className="mr-2" /> Nouveau Rapport
          </Link>
        </div>
      </div>

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
                  {new Date(report.date).toLocaleDateString()}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`px-2 py-1 rounded-full text-xs ${
                    report.statut === 'Validé' ? 'bg-green-100 text-green-800' :
                    report.statut === 'En attente' ? 'bg-yellow-100 text-yellow-800' :
                    'bg-red-100 text-red-800'
                  }`}>
                    {report.statut}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex space-x-2">
                    <Link 
                      to={`/dashboardcomptable/modif_rapport/${report._id}`}
                      className="text-blue-600 hover:text-blue-800 p-1"
                    >
                      <FaEdit />
                    </Link>
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
import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { FaFilePdf, FaFileExcel, FaArrowLeft } from 'react-icons/fa';
import axios from 'axios';

const ExporterRapport = () => {
  const { id } = useParams();
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

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
        setError("Erreur lors du chargement du rapport");
      } finally {
        setLoading(false);
      }
    };
    fetchReport();
  }, [id]);

  const handleExport = async (format) => {
    try {
      if (!report) return;
      
      const token = localStorage.getItem('valid');
      const response = await axios.get(
        `http://127.0.0.1:8000/api/rapports/${id}/export?format=${format}`, 
        {
          headers: { Authorization: `Bearer ${token}` },
          responseType: 'blob'
        }
      );
      
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `${report.nom}.${format}`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Erreur export:", error);
      alert(`Erreur lors de l'export en ${format.toUpperCase()}`);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-4xl mx-auto p-6 bg-white rounded-lg shadow-md">
        <div className="flex items-center mb-8">
          <Link 
            to="/dashboardcomptable/rapports"
            className="flex items-center text-blue-600 hover:text-blue-800 mr-4"
          >
            <FaArrowLeft className="mr-2 text-xl" />
            <span className="font-medium">Retour</span>
          </Link>
        </div>
        <div className="bg-red-50 p-4 rounded border border-red-200 text-red-600">
          {error}
        </div>
      </div>
    );
  }

  if (!report) {
    return (
      <div className="max-w-4xl mx-auto p-6 bg-white rounded-lg shadow-md">
        <div className="flex items-center mb-8">
          <Link 
            to="/dashboardcomptable/rapports"
            className="flex items-center text-blue-600 hover:text-blue-800 mr-4"
          >
            <FaArrowLeft className="mr-2 text-xl" />
            <span className="font-medium">Retour</span>
          </Link>
        </div>
        <div className="bg-yellow-50 p-4 rounded border border-yellow-200 text-yellow-600">
          Aucun rapport trouvé avec cet ID
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-6 bg-white rounded-lg shadow-md">
      <div className="flex items-center mb-8">
        <Link 
          to="/dashboardcomptable/rapports"
          className="flex items-center text-blue-600 hover:text-blue-800 mr-4"
        >
          <FaArrowLeft className="mr-2 text-xl" />
          <span className="font-medium">Retour</span>
        </Link>
        <h2 className="text-2xl font-bold text-blue-600">Exporter Rapport</h2>
      </div>

      <div className="bg-gray-50 p-8 rounded-lg border border-gray-200">
        <div className="mb-6">
          <h3 className="text-xl font-semibold text-gray-800 mb-2">{report.nom}</h3>
          <div className="flex space-x-4 text-sm text-gray-600">
            <span>Type: {report.type}</span>
            <span>Date: {new Date(report.date).toLocaleDateString()}</span>
            <span className={`${
              report.statut === 'Validé' ? 'text-green-600' :
              report.statut === 'En attente' ? 'text-yellow-600' :
              'text-red-600'
            }`}>
              Statut: {report.statut}
            </span>
          </div>
        </div>
        
        <div className="flex flex-col sm:flex-row justify-center gap-6 mt-8">
          <button 
            onClick={() => handleExport('pdf')}
            className="flex items-center justify-center px-8 py-4 bg-red-600 text-white rounded-lg hover:bg-red-700 transition duration-200 shadow-md hover:shadow-lg"
          >
            <FaFilePdf className="mr-3 text-xl" /> 
            <span>Exporter en PDF</span>
          </button>
          <button 
            onClick={() => handleExport('excel')}
            className="flex items-center justify-center px-8 py-4 bg-green-600 text-white rounded-lg hover:bg-green-700 transition duration-200 shadow-md hover:shadow-lg"
          >
            <FaFileExcel className="mr-3 text-xl" /> 
            <span>Exporter en Excel</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default ExporterRapport;
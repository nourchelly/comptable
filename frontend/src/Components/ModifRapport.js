// src/components/rapports/ModifierRapport.jsx
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { 
  FaSave, 
  FaTimes, 
  FaFileAlt, 
  FaSpinner,
  FaFileInvoice,
  FaFileInvoiceDollar,
  FaCalendarAlt,
  FaClipboardCheck,
  FaClipboardList,
  FaExclamationTriangle,
  FaLightbulb,
  FaChartBar,
  FaFilePdf,
  FaHeading,
  FaListUl
} from 'react-icons/fa';
import axios from 'axios';

const ModifierRapport = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [report, setReport] = useState({
        titre: '',
        facture_numero: '',
        banque_numero: '',
        date_generation: new Date().toISOString().split('T')[0],
        statut: 'Anomalies',
        resume_facture: '',
        resume_releve: '',
        anomalies: [],
        recommendations: [],
        analyse_texte: '',
        rapport_complet: ''
    });
    const [loading, setLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchReport = async () => {
            setLoading(true);
            setError(null);
            try {
                const response = await axios.get(`http://localhost:5000/api/rapports/${id}`);
                const data = response.data;
                setReport({
                    titre: data.titre || '',
                    facture_numero: data.facture?.numero || '',
                    banque_numero: data.banque?.numero || '',
                    date_generation: data.date_generation ? new Date(data.date_generation).toISOString().slice(0, 10) : new Date().toISOString().slice(0, 10),
                    statut: data.statut || 'En attente',
                    resume_facture: data.resume_facture || '',
                    resume_releve: data.resume_releve || '',
                    anomalies: data.anomalies || [],
                    recommendations: data.recommendations || [],
                    analyse_texte: data.analyse_texte || '',
                    rapport_complet: data.rapport_complet || ''
                });
            } catch (err) {
                console.error("Erreur chargement rapport:", err);
                setError("Erreur lors du chargement du rapport. Veuillez réessayer.");
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
        setError(null);
        try {
            await axios.put(`http://localhost:5000/api/rapports/${id}`, {
                ...report,
                anomalies: report.anomalies,
                recommendations: report.recommendations
            });
            alert("Rapport modifié avec succès");
            navigate('/dashboardcomptable/rapport');
        } catch (err) {
            console.error("Erreur modification:", err);
            setError("Erreur lors de la modification du rapport");
        } finally {
            setIsSubmitting(false);
        }
    };

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 p-4">
                <div className="text-center max-w-md">
                    <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-indigo-600 mx-auto mb-4"></div>
                    <h3 className="text-xl font-semibold text-gray-800 mb-2">Chargement du rapport</h3>
                    <p className="text-gray-600">Nous préparons votre espace d'édition...</p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 flex items-center justify-center p-4">
                <div className="max-w-md w-full bg-white rounded-xl shadow-lg overflow-hidden">
                    <div className="bg-red-500 p-4 flex items-center">
                        <FaExclamationTriangle className="text-white text-2xl mr-3" />
                        <h2 className="text-xl font-bold text-white">Erreur de chargement</h2>
                    </div>
                    <div className="p-6">
                        <p className="text-gray-700 mb-6">{error}</p>
                        <div className="flex justify-center">
                            <Link 
                                to="/dashboardcomptable/rapports" 
                                className="inline-flex items-center px-4 py-2 bg-white border border-gray-300 rounded-lg shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors duration-200"
                            >
                                <FaTimes className="mr-2 text-red-500" /> 
                                Retour à la liste
                            </Link>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 py-8 px-4 sm:px-6 lg:px-8">
            <div className="max-w-5xl mx-auto">
                <div className="mb-6 flex justify-between items-center">
                    <h1 className="text-2xl font-bold text-gray-800 flex items-center">
                        <FaFilePdf className="text-indigo-600 mr-3 text-3xl" />
                        <span>Éditeur de Rapport</span>
                    </h1>
                    <div className="text-sm breadcrumbs">
                        <ul>
                            <li><Link to="/dashboardcomptable" className="text-indigo-600">Tableau de bord</Link></li> 
                            <li><Link to="/dashboardcomptable/rapports" className="text-indigo-600">Rapports</Link></li> 
                            <li className="text-gray-500">Édition #{id}</li>
                        </ul>
                    </div>
                </div>

                <div className="bg-white rounded-xl shadow-lg overflow-hidden">
                    <div className="bg-gradient-to-r from-indigo-600 to-blue-700 px-6 py-5 sm:px-8">
                        <div className="flex items-center">
                            <FaFileAlt className="text-white text-2xl mr-3" />
                            <h2 className="text-2xl font-bold text-white">Modification du Rapport</h2>
                        </div>
                        <p className="mt-1 text-indigo-100">Dernière modification : {new Date().toLocaleDateString()}</p>
                    </div>

                    <div className="px-6 py-8 sm:px-8">
                        <form onSubmit={handleSubmit} className="space-y-8">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                {/* Titre du Rapport */}
                                <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                                    <label htmlFor="titre" className="block text-sm font-medium text-gray-700 mb-1 flex items-center">
                                        <FaHeading className="text-indigo-500 mr-2" />
                                        Titre du Rapport
                                    </label>
                                    <div className="mt-1">
                                        <input
                                            type="text"
                                            name="titre"
                                            id="titre"
                                            value={report.titre}
                                            onChange={handleChange}
                                            className="block w-full px-4 py-2 border border-gray-300 rounded-lg shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                                            placeholder="Donnez un titre clair à ce rapport"
                                        />
                                    </div>
                                </div>

                                {/* Date de Génération */}
                                <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                                    <label htmlFor="date_generation" className="block text-sm font-medium text-gray-700 mb-1 flex items-center">
                                        <FaCalendarAlt className="text-purple-500 mr-2" />
                                        Date de Génération
                                    </label>
                                    <div className="mt-1">
                                        <input
                                            type="date"
                                            name="date_generation"
                                            id="date_generation"
                                            value={report.date_generation}
                                            onChange={handleChange}
                                            className="block w-full px-4 py-2 border border-gray-300 rounded-lg shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                                        />
                                    </div>
                                </div>

                                {/* Numéro de Facture */}
                                <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                                    <label htmlFor="facture_numero" className="block text-sm font-medium text-gray-700 mb-1 flex items-center">
                                        <FaFileInvoiceDollar className="text-blue-500 mr-2" />
                                        Numéro de Facture
                                    </label>
                                    <div className="mt-1">
                                        <input
                                            type="text"
                                            name="facture_numero"
                                            id="facture_numero"
                                            value={report.facture_numero}
                                            onChange={handleChange}
                                            className="block w-full px-4 py-2 border border-gray-300 rounded-lg shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                                            placeholder="Ex: FAC-2023-001"
                                        />
                                    </div>
                                </div>

                                {/* Numéro de Banque */}
                                <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                                    <label htmlFor="banque_numero" className="block text-sm font-medium text-gray-700 mb-1 flex items-center">
                                        <FaFileInvoice className="text-green-500 mr-2" />
                                        Numéro de Banque
                                    </label>
                                    <div className="mt-1">
                                        <input
                                            type="text"
                                            name="banque_numero"
                                            id="banque_numero"
                                            value={report.banque_numero}
                                            onChange={handleChange}
                                            className="block w-full px-4 py-2 border border-gray-300 rounded-lg shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                                            placeholder="Ex: BQ-2023-001"
                                        />
                                    </div>
                                </div>

                                {/* Statut */}
                                <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                                    <label htmlFor="statut" className="block text-sm font-medium text-gray-700 mb-1 flex items-center">
                                        <FaClipboardCheck className="text-yellow-500 mr-2" />
                                        Statut
                                    </label>
                                    <div className="mt-1">
                                        <select
                                            id="statut"
                                            name="statut"
                                            value={report.statut}
                                            onChange={handleChange}
                                            className="block w-full px-4 py-2 border border-gray-300 rounded-lg shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                                        >
                                          
                                            <option value="Anomalie">Anomalie</option>
                                            <option value="Complet">Complet</option>
                                            <option value="Incomplet">Incomplet</option>
                                        </select>
                                    </div>
                                </div>
                            </div>

                            {/* Résumé de la Facture */}
                            <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                                <label htmlFor="resume_facture" className="block text-sm font-medium text-gray-700 mb-1 flex items-center">
                                    <FaClipboardList className="text-blue-400 mr-2" />
                                    Résumé de la Facture
                                </label>
                                <div className="mt-1">
                                    <textarea
                                        id="resume_facture"
                                        name="resume_facture"
                                        value={report.resume_facture}
                                        onChange={handleChange}
                                        rows="4"
                                        className="block w-full px-4 py-2 border border-gray-300 rounded-lg shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                                        placeholder="Décrivez les éléments principaux de la facture..."
                                    ></textarea>
                                </div>
                            </div>

                            {/* Résumé du Relevé Bancaire */}
                            <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                                <label htmlFor="resume_releve" className="block text-sm font-medium text-gray-700 mb-1 flex items-center">
                                    <FaClipboardList className="text-green-400 mr-2" />
                                    Résumé du Relevé Bancaire
                                </label>
                                <div className="mt-1">
                                    <textarea
                                        id="resume_releve"
                                        name="resume_releve"
                                        value={report.resume_releve}
                                        onChange={handleChange}
                                        rows="4"
                                        className="block w-full px-4 py-2 border border-gray-300 rounded-lg shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                                        placeholder="Décrivez les éléments principaux du relevé bancaire..."
                                    ></textarea>
                                </div>
                            </div>

                            {/* Anomalies */}
                            <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                                <label htmlFor="anomalies" className="block text-sm font-medium text-gray-700 mb-1 flex items-center">
                                    <FaExclamationTriangle className="text-red-400 mr-2" />
                                    Anomalies détectées
                                    <span className="ml-auto text-xs text-gray-500">(séparées par des virgules)</span>
                                </label>
                                <div className="mt-1">
                                    <textarea
                                        id="anomalies"
                                        name="anomalies"
                                        value={report.anomalies.join(', ')}
                                        onChange={(e) => setReport(prev => ({ ...prev, anomalies: e.target.value.split(',').map(item => item.trim()) }))}
                                        rows="3"
                                        className="block w-full px-4 py-2 border border-gray-300 rounded-lg shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                                        placeholder="Ex: Montant incorrect, Date erronée, Fournisseur inconnu"
                                    ></textarea>
                                </div>
                            </div>

                            {/* Recommandations */}
                            <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                                <label htmlFor="recommendations" className="block text-sm font-medium text-gray-700 mb-1 flex items-center">
                                    <FaLightbulb className="text-yellow-400 mr-2" />
                                    Recommandations
                                    <span className="ml-auto text-xs text-gray-500">(séparées par des virgules)</span>
                                </label>
                                <div className="mt-1">
                                    <textarea
                                        id="recommendations"
                                        name="recommendations"
                                        value={report.recommendations.join(', ')}
                                        onChange={(e) => setReport(prev => ({ ...prev, recommendations: e.target.value.split(',').map(item => item.trim()) }))}
                                        rows="3"
                                        className="block w-full px-4 py-2 border border-gray-300 rounded-lg shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                                        placeholder="Ex: Vérifier avec le fournisseur, Corriger le montant, Archivage"
                                    ></textarea>
                                </div>
                            </div>

                            {/* Analyse Textuelle */}
                            <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                                <label htmlFor="analyse_texte" className="block text-sm font-medium text-gray-700 mb-1 flex items-center">
                                    <FaChartBar className="text-indigo-400 mr-2" />
                                    Analyse Textuelle
                                </label>
                                <div className="mt-1">
                                    <textarea
                                        id="analyse_texte"
                                        name="analyse_texte"
                                        value={report.analyse_texte}
                                        onChange={handleChange}
                                        rows="6"
                                        className="block w-full px-4 py-2 border border-gray-300 rounded-lg shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                                        placeholder="Rédigez votre analyse détaillée des éléments financiers..."
                                    ></textarea>
                                </div>
                            </div>

                            {/* Rapport Complet */}
                            <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                                <label htmlFor="rapport_complet" className="block text-sm font-medium text-gray-700 mb-1 flex items-center">
                                    <FaFileAlt className="text-blue-500 mr-2" />
                                    Rapport Complet
                                </label>
                                <div className="mt-1">
                                    <textarea
                                        id="rapport_complet"
                                        name="rapport_complet"
                                        value={report.rapport_complet}
                                        onChange={handleChange}
                                        rows="8"
                                        className="block w-full px-4 py-2 border border-gray-300 rounded-lg shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                                        placeholder="Rédigez le rapport complet avec tous les détails nécessaires..."
                                    ></textarea>
                                </div>
                            </div>

                            {/* Actions */}
                            <div className="flex flex-col sm:flex-row justify-end gap-4 pt-6 border-t border-gray-200">
                                <Link 
                                    to="/dashboardcomptable/rapport" 
                                    className="inline-flex justify-center items-center px-6 py-3 border border-gray-300 rounded-lg shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors duration-200"
                                >
                                    <FaTimes className="mr-2 text-red-500" /> 
                                    Annuler
                                </Link>
                                <button
                                    type="submit"
                                    disabled={isSubmitting}
                                    className={`inline-flex justify-center items-center px-6 py-3 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors duration-200 ${isSubmitting ? 'bg-indigo-400 cursor-not-allowed' : 'bg-indigo-600 hover:bg-indigo-700'}`}
                                >
                                    {isSubmitting ? (
                                        <>
                                            <FaSpinner className="animate-spin mr-2" />
                                            Enregistrement...
                                        </>
                                    ) : (
                                        <>
                                            <FaSave className="mr-2" />
                                            Enregistrer les modifications
                                        </>
                                    )}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ModifierRapport;
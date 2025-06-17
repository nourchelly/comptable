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
    FaListUl,
    FaSyncAlt // Ajouté pour indiquer la nature générée de certains champs
} from 'react-icons/fa';
import axios from 'axios';

const ModifierRapport = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [report, setReport] = useState({
        titre: '',
        facture_numero: '', // Devient lecture seule
        banque_numero: '',  // Devient lecture seule
        date_generation: new Date().toISOString().split('T')[0], // Devient lecture seule
        statut: 'Anomalie', // Peut être modifié
        resume_facture: '', // Devient lecture seule
        resume_releve: '',  // Devient lecture seule
        anomalies: [],      // Devient lecture seule (affichage de la liste)
        recommendations: [],// Peut être modifié
        analyse_texte: '',  // Peut être modifié
        rapport_complet: '' // Peut être modifié
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

                // Assurez-vous de gérer les données potentiellement manquantes ou de type incorrect
                setReport({
                    titre: data.titre || '',
                    facture_numero: data.facture?.numero || 'N/A', // Affiche N/A si non disponible
                    banque_numero: data.banque?.numero || 'N/A',   // Affiche N/A si non disponible
                    date_generation: data.date_generation ? new Date(data.date_generation).toISOString().slice(0, 10) : new Date().toISOString().slice(0, 10),
                    statut: data.statut || 'En attente', // Assurez-vous que les statuts correspondent à ceux de votre backend
                    resume_facture: data.resume_facture || 'Aucun résumé disponible.',
                    resume_releve: data.resume_releve || 'Aucun résumé disponible.',
                    anomalies: Array.isArray(data.anomalies) ? data.anomalies : [],
                    recommendations: Array.isArray(data.recommendations) ? data.recommendations : [],
                    analyse_texte: data.analyse_texte || '',
                    rapport_complet: data.rapport_complet || ''
                });
            } catch (err) {
                console.error("Erreur chargement rapport:", err);
                setError("Erreur lors du chargement du rapport. Veuillez réessayer. " + (err.response?.data?.error || err.message));
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

    // Nouvelle fonction pour gérer les changements des listes (anomalies, recommendations)
    // Utile si vous décidez de les rendre éditables par l'utilisateur
    const handleListChange = (e, fieldName) => {
        const { value } = e.target;
        setReport(prev => ({
            ...prev,
            [fieldName]: value.split(',').map(item => item.trim()).filter(item => item !== '')
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsSubmitting(true);
        setError(null);

        // Créer un objet avec seulement les champs que le backend est censé mettre à jour
        const dataToSend = {
            titre: report.titre,
            statut: report.statut,
           
            // N'incluez pas les champs qui sont censés être générés automatiquement ou en lecture seule
            // comme resume_facture, resume_releve, anomalies, facture_numero, banque_numero, etc.
        };

        try {
            const response = await axios.put(`http://localhost:5000/api/rapports/${id}`, dataToSend);
            if (response.data.success) {
                alert("Rapport modifié avec succès : " + response.data.message);
                navigate('/dashboardcomptable/rapport');
            } else {
                setError(response.data.error || "Échec de la modification du rapport.");
            }
        } catch (err) {
            console.error("Erreur modification:", err);
            setError("Erreur lors de la modification du rapport: " + (err.response?.data?.error || err.message));
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
                                {/* Titre du Rapport (Modifiable) */}
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

                                {/* Date de Génération (Lecture Seule) */}
                                <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                                    <label htmlFor="date_generation" className="block text-sm font-medium text-gray-700 mb-1 flex items-center">
                                        <FaCalendarAlt className="text-purple-500 mr-2" />
                                        Date de Génération <span className="ml-2 text-xs text-gray-500"><FaSyncAlt className="inline mr-1" /> (Générée)</span>
                                    </label>
                                    <div className="mt-1">
                                        <input
                                            type="date"
                                            name="date_generation"
                                            id="date_generation"
                                            value={report.date_generation}
                                            readOnly // Rendu en lecture seule
                                            className="block w-full px-4 py-2 border border-gray-300 rounded-lg shadow-sm bg-gray-100 cursor-not-allowed sm:text-sm"
                                        />
                                    </div>
                                </div>

                                {/* Numéro de Facture (Lecture Seule) */}
                                <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                                    <label htmlFor="facture_numero" className="block text-sm font-medium text-gray-700 mb-1 flex items-center">
                                        <FaFileInvoiceDollar className="text-blue-500 mr-2" />
                                        Numéro de Facture <span className="ml-2 text-xs text-gray-500"><FaSyncAlt className="inline mr-1" /> (Généré)</span>
                                    </label>
                                    <div className="mt-1">
                                        <input
                                            type="text"
                                            name="facture_numero"
                                            id="facture_numero"
                                            value={report.facture_numero}
                                            readOnly // Rendu en lecture seule
                                            className="block w-full px-4 py-2 border border-gray-300 rounded-lg shadow-sm bg-gray-100 cursor-not-allowed sm:text-sm"
                                        />
                                    </div>
                                </div>

                                {/* Numéro de Banque (Lecture Seule) */}
                                <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                                    <label htmlFor="banque_numero" className="block text-sm font-medium text-gray-700 mb-1 flex items-center">
                                        <FaFileInvoice className="text-green-500 mr-2" />
                                        Numéro de Relevé Bancaire <span className="ml-2 text-xs text-gray-500"><FaSyncAlt className="inline mr-1" /> (Généré)</span>
                                    </label>
                                    <div className="mt-1">
                                        <input
                                            type="text"
                                            name="banque_numero"
                                            id="banque_numero"
                                            value={report.banque_numero}
                                            readOnly // Rendu en lecture seule
                                            className="block w-full px-4 py-2 border border-gray-300 rounded-lg shadow-sm bg-gray-100 cursor-not-allowed sm:text-sm"
                                        />
                                    </div>
                                </div>

                                {/* Statut (Modifiable) */}
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
                                            <option value="En attente">En attente</option>
                                            <option value="En revue">En revue</option>
                                            {/* Ajoutez d'autres statuts si nécessaire, en accord avec votre backend */}
                                        </select>
                                    </div>
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
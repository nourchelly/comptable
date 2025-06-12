import React, { useState, useEffect, useMemo } from 'react';
import axios from 'axios';
import { useUser } from './UserContext';
import { toast } from 'react-toastify';
import { useNavigate } from 'react-router-dom';
import { 
    FaFileInvoice,
    FaExclamationTriangle, 
    FaUpload, 
    FaTimesCircle, 
    FaFilePdf,
    FaEye,
    FaTrashAlt,
    FaDownload,
    FaSpinner,
    FaSearch,
    FaRobot,
    FaFileSignature,
    FaCheckCircle,
    FaCalendarAlt,
    FaUser,
    FaBuilding,
    FaMoneyBillWave,
    FaInfoCircle,
    FaSort,
    FaSortUp,
    FaSortDown,
    FaFileExcel,
    FaFilter,
    FaExchangeAlt
} from 'react-icons/fa';

export default function ReleveBancaireList() {
    const navigate = useNavigate();
    const { user } = useUser();

    const [releves, setReleves] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showImportModal, setShowImportModal] = useState(false);
    const [selectedFile, setSelectedFile] = useState(null);
    const [uploadProgress, setUploadProgress] = useState(0);
    const [uploadStatus, setUploadStatus] = useState(null);
    const [isDeleting, setIsDeleting] = useState(false);
    const [pdfPreview, setPdfPreview] = useState({ visible: false, url: null });
    const [isFileHovering, setIsFileHovering] = useState(false);
    const [extractedData, setExtractedData] = useState(null); // Data after extraction
    const [isExtracting, setIsExtracting] = useState(false);
    const [extractionStatus, setExtractionStatus] = useState(null);
    const [expandedReleve, setExpandedReleve] = useState(null); // ID of the currently expanded releve
    const [searchTerm, setSearchTerm] = useState('');
    const [sortConfig, setSortConfig] = useState({ key: 'date_import', direction: 'desc' });
    const [selectedBanque, setSelectedBanque] = useState('Toutes');
    const [banquesList, setBanquesList] = useState([]);
    const [deleteModal, setDeleteModal] = useState({ 
    isOpen: false, 
    releveId: null, 
    releveName: null 
});
    const API_URL = 'http://localhost:5000'; // Remplacez par votre URL backend si différente

    useEffect(() => {
        const fetchData = async () => {
            try {
                const response = await axios.get(`http://localhost:8000/api/banques/`, {
                    headers: { 
                        'Authorization': `Bearer ${localStorage.getItem('auth_token')}`,
                        'Content-Type': 'application/json'
                    },
                    withCredentials: true
                });
                console.log("Response:", response); // Debug
                
                const data = response.data;
                
                const processedData = data.map(r => {
                    let metadata = r.metadata;
                    if (typeof r.metadata === 'string') {
                        try {
                            metadata = JSON.parse(r.metadata);
                            // Clean up some metadata fields for display/filtering
                            if (metadata.banque) {
                                metadata.banque = metadata.banque.replace(/\./g, '').trim();
                            }
                            if (metadata.emetteur) {
                                metadata.emetteur = metadata.emetteur.replace(/\./g, '').trim();
                            }
                        } catch (e) {
                            console.error("Erreur de parsing JSON des métadonnées:", e);
                            metadata = {};
                        }
                    }
                    
                    // Ensure 'operations' is an array, even if empty
                    metadata.operations = metadata.operations || []; 

                    return {
                        ...r,
                        metadata,
                        downloadUrl: r.id ? `${API_URL}/api/banques/${r.id}/download/` : null,
                        banque: metadata.banque || metadata.emetteur || 'Inconnue'
                    };
                });
            
                setReleves(processedData);
                
                const banques = [...new Set(processedData
                    .map(r => r.metadata?.banque || r.metadata?.emetteur || '')
                    .filter(b => b)
                )].sort();
                
                setBanquesList(['Toutes', ...banques]);
                setLoading(false);
            } catch (err) {
                console.error("Full error:", err);
                console.error("Error response:", err.response);
                toast.error(`Erreur de chargement: ${err.message}`);
                setLoading(false);
            }
        };
        
        fetchData();
    }, []);

    const requestSort = (key) => {
        let direction = 'asc';
        if (sortConfig.key === key && sortConfig.direction === 'asc') {
            direction = 'desc';
        }
        setSortConfig({ key, direction });
    };

    const sortedReleves = useMemo(() => {
        let sortableItems = [...releves];
        if (sortConfig.key) {
            sortableItems.sort((a, b) => {
                if (sortConfig.key === 'date_import') {
                    const dateA = new Date(a.date_import);
                    const dateB = new Date(b.date_import);
                    return sortConfig.direction === 'asc' ? dateA - dateB : dateB - dateA;
                }
                
                if (sortConfig.key.includes('metadata.')) {
                    const metaKey = sortConfig.key.replace('metadata.', '');
                    const valueA = a.metadata?.[metaKey] || '';
                    const valueB = b.metadata?.[metaKey] || '';
                    
                    if (metaKey.includes('montant') || metaKey.includes('solde')) {
                        const numA = parseFloat(valueA) || 0;
                        const numB = parseFloat(valueB) || 0;
                        return sortConfig.direction === 'asc' ? numA - numB : numB - numA;
                    }
                    
                    return sortConfig.direction === 'asc' 
                        ? valueA.localeCompare(valueB) 
                        : valueB.localeCompare(valueA);
                }
                
                if (a[sortConfig.key] < b[sortConfig.key]) {
                    return sortConfig.direction === 'asc' ? -1 : 1;
                }
                if (a[sortConfig.key] > b[sortConfig.key]) {
                    return sortConfig.direction === 'asc' ? 1 : -1;
                }
                return 0;
            });
        }
        return sortableItems;
    }, [releves, sortConfig]);

    const filteredReleves = useMemo(() => {
        return sortedReleves.filter(releve => {
            const matchesSearch = searchTerm === '' || 
                (releve.nom_fichier && releve.nom_fichier.toLowerCase().includes(searchTerm.toLowerCase())) ||
                (releve.metadata && (
                    (releve.metadata.client && releve.metadata.client.toLowerCase().includes(searchTerm.toLowerCase())) ||
                    (releve.metadata.nom_titulaire && releve.metadata.nom_titulaire.toLowerCase().includes(searchTerm.toLowerCase())) ||
                    (releve.metadata.numero_compte && releve.metadata.numero_compte.toLowerCase().includes(searchTerm.toLowerCase())) ||
                    (releve.metadata.iban && releve.metadata.iban.toLowerCase().includes(searchTerm.toLowerCase())) ||
                    // Search in operations as well
                    (releve.metadata.operations && releve.metadata.operations.some(op => 
                        (op.libelle && op.libelle.toLowerCase().includes(searchTerm.toLowerCase()))
                    ))
                ));
            
            const matchesBanque = selectedBanque === 'Toutes' || 
                (releve.metadata && (
                    (releve.metadata.banque && releve.metadata.banque === selectedBanque) ||
                    (releve.metadata.emetteur && releve.metadata.emetteur === selectedBanque)
                ));
            
            return matchesSearch && matchesBanque;
        });
    }, [sortedReleves, searchTerm, selectedBanque]);

    const handleFileChange = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        if (file.type !== 'application/pdf') {
            toast.error('Seuls les PDF sont acceptés');
            return;
        }

        if (file.size > 10 * 1024 * 1024) {
            toast.error('Taille maximale: 10MB');
            return;
        }

        setSelectedFile(file);
        setUploadStatus(null);
        setExtractionStatus(null);
        await extractDataFromPdf(file);
    };

    const toggleDetails = (id) => {
        setExpandedReleve(expandedReleve === id ? null : id);
    };

    const closePdfPreview = () => setPdfPreview({ visible: false, url: null });
const extractDataFromPdf = async (file) => {
    setIsExtracting(true);
    setExtractedData(null);
    setExtractionStatus(null);

    try {
        toast.info("Extraction des données en cours...", { autoClose: false });

        const formData = new FormData();
        formData.append('file', file);
        formData.append('type', 'bank_statement');

        const { data } = await axios.post(`${API_URL}/api/extract-document`, formData);

        // --- AJOUTEZ CE CONSOLE.LOG ICI ---
        console.log("Réponse complète de l'extraction (frontend) :", data); 

        toast.dismiss(); // Dismiss the info toast

        if (data.success) {
            setExtractedData(data.data);
            setExtractionStatus('success');
            toast.success("Données extraites avec succès!");
        } else {
            throw new Error(data.error || "Erreur d'extraction");
        }
    } catch (err) {
        setExtractionStatus('error');
        toast.error(`Erreur d'extraction: ${err.message}`);
        console.error("Erreur d'extraction (frontend):", err);
    } finally {
        setIsExtracting(false);
    }
};

    const handleUpload = async () => {
        if (!selectedFile) {
            toast.error('Veuillez sélectionner un fichier PDF');
            return;
        }
        if (!extractedData) {
            toast.error('Veuillez extraire les données du PDF avant l\'upload.');
            return;
        }

        try {
            // 1. Préparation des métadonnées selon le modèle Banque
            const metadata = {
                nom: extractedData?.nom || extractedData?.banque || "Banque Inconnue",
                numero_compte: extractedData?.numero_compte || extractedData?.iban || "N/A",
                titulaire: extractedData?.titulaire || extractedData?.client || "Titulaire Inconnu",
                
                // Champs optionnels qui sont utiles pour le rapprochement ou l'information
                ...(extractedData?.iban && { iban: extractedData.iban }),
                ...(extractedData?.solde_final && { solde_final: parseFloat(extractedData.solde_final) }),
                ...(extractedData?.solde_initial && { solde_initial: parseFloat(extractedData.solde_initial) }),
                ...(extractedData?.periode && { periode: extractedData.periode }),
                ...(extractedData?.bic && { bic: extractedData.bic }),
                ...(extractedData?.total_credits && { total_credits: parseFloat(extractedData.total_credits) }),
                ...(extractedData?.total_debits && { total_debits: parseFloat(extractedData.total_debits) }),
                // Inclure les opérations extraites
                ...(extractedData?.operations && { operations: extractedData.operations })
            };

            // 2. Validation des champs obligatoires pour le relevé
            const requiredFields = ['nom', 'numero_compte', 'titulaire', 'operations']; // 'operations' is crucial for reconciliation
            const missingFields = requiredFields.filter(field => !metadata[field] || (field === 'operations' && metadata[field].length === 0));
            if (missingFields.length > 0) {
                throw new Error(`Certains champs essentiels manquent pour l'enregistrement du relevé : ${missingFields.join(', ')}. Veuillez vous assurer que l'extraction a bien fonctionné.`);
            }

            // 3. Construction du FormData
            const formData = new FormData();
            formData.append('fichier', selectedFile); // Le fichier PDF
            formData.append('metadata', JSON.stringify(metadata)); // Les métadonnées en JSON

            // 4. Configuration de la requête
            const config = {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('auth_token')}`,
                    'Content-Type': 'multipart/form-data'
                },
                withCredentials: true,
                onUploadProgress: (progressEvent) => {
                    const percentCompleted = Math.round(
                        (progressEvent.loaded * 100) / progressEvent.total
                    );
                    setUploadProgress(percentCompleted);
                }
            };

            // 5. Envoi de la requête
            const response = await axios.post(
                `http://localhost:8000/api/banques/`, 
                formData, 
                config
            );
            console.log("Upload response:", response);

            // 6. Gestion de la réponse
            if (response.data.id) {
                toast.success('Relevé importé avec succès !');
                // Add the newly uploaded releve to the list
                setReleves(prevReleves => [{
                    ...response.data,
                    metadata: metadata, // Use the prepared metadata, which includes operations
                    downloadUrl: response.data.id ? `http://localhost:8000/api/banques/${response.data.id}/download/` : null
                }, ...prevReleves]);
                setShowImportModal(false);
                setSelectedFile(null); // Reset file selection
                setExtractedData(null); // Reset extracted data
            } else {
                throw new Error('Réponse inattendue du serveur');
            }

        } catch (error) {
            console.error("Upload error:", error);
            console.error("Error response:", error.response);
            console.error("Erreur détaillée lors de l'upload:", error);
            let errorMessage = "Échec de l'import";

            if (error.response) {
                // Erreur du serveur
                const serverError = error.response.data;
                errorMessage += `: ${serverError.error || 'Erreur inconnue'}`;
                
                if (serverError.champs_manquants) {
                    errorMessage += ` (Champs manquants côté serveur : ${serverError.champs_manquants.join(', ')})`;
                }
            } else {
                // Erreur réseau ou autre
                errorMessage += `: ${error.message}`;
            }

            toast.error(errorMessage);
        }
    };

const DeleteConfirmationModal = ({ isOpen, onClose, onConfirm, releveName }) => {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 overflow-y-auto">
            {/* Overlay avec effet de flou moderne */}
            <div 
                className="fixed inset-0 bg-black/40 backdrop-blur-md transition-all duration-500 ease-out" 
                onClick={onClose}
            ></div>
            
            {/* Modal Container avec animation d'entrée */}
            <div className="flex min-h-full items-center justify-center p-4">
                <div className="relative transform overflow-hidden rounded-3xl bg-white shadow-[0_25px_50px_-12px_rgba(0,0,0,0.25)] transition-all duration-500 ease-out w-full max-w-lg animate-in slide-in-from-bottom-4 fade-in">
                    
                    {/* Icône principale avec animation */}
                    <div className="relative px-8 pt-8 pb-6 text-center">
                        <div className="mx-auto mb-6 relative">
                            {/* Cercles d'arrière-plan avec animation */}
                            <div className="absolute inset-0 rounded-full bg-red-100 animate-ping opacity-30"></div>
                            <div className="absolute inset-0 rounded-full bg-red-50 animate-pulse"></div>
                            <div className="relative h-20 w-20 mx-auto rounded-full bg-gradient-to-br from-red-400 to-red-600 flex items-center justify-center shadow-lg transform transition-transform duration-300 hover:scale-105">
                                <FaTrashAlt className="text-white text-2xl animate-bounce" />
                            </div>
                        </div>

                        {/* Titre principal */}
                        <h3 className="text-2xl font-bold text-gray-900 mb-3">
                            Supprimer le relevé ?
                        </h3>
                        
                        {/* Message d'avertissement */}
                        <p className="text-gray-600 mb-6 leading-relaxed">
                            Cette action est <span className="font-semibold text-red-600">irréversible</span>. 
                            Toutes les données associées seront définitivement perdues.
                        </p>

                        {/* Nom du fichier avec style moderne */}
                        <div className="bg-gradient-to-r from-gray-50 to-gray-100 rounded-2xl p-4 border border-gray-200/50 backdrop-blur-sm">
                            <div className="flex items-center justify-center space-x-3">
                                <div className="h-10 w-10 rounded-xl bg-red-100 flex items-center justify-center">
                                    <FaFilePdf className="text-red-500 text-lg" />
                                </div>
                                <div className="text-left">
                                    <p className="font-semibold text-gray-900 text-sm">
                                        {releveName}
                                    </p>
                                    <p className="text-xs text-gray-500">
                                        Relevé bancaire • PDF
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Zone d'information détaillée */}
                    <div className="px-8 pb-6">
                        <div className="bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200/50 rounded-2xl p-4">
                            <div className="flex items-start space-x-3">
                                <div className="flex-shrink-0 mt-0.5">
                                    <div className="h-6 w-6 rounded-full bg-amber-100 flex items-center justify-center">
                                        <FaInfoCircle className="h-3 w-3 text-amber-600" />
                                    </div>
                                </div>
                                <div className="text-sm">
                                    <p className="font-medium text-amber-800 mb-2">
                                        Éléments qui seront supprimés :
                                    </p>
                                    <ul className="text-amber-700 space-y-1 text-xs">
                                        <li className="flex items-center">
                                            <div className="h-1.5 w-1.5 bg-amber-400 rounded-full mr-2"></div>
                                            Fichier PDF original
                                        </li>
                                        <li className="flex items-center">
                                            <div className="h-1.5 w-1.5 bg-amber-400 rounded-full mr-2"></div>
                                            Données extraites et métadonnées
                                        </li>
                                        <li className="flex items-center">
                                            <div className="h-1.5 w-1.5 bg-amber-400 rounded-full mr-2"></div>
                                            Opérations bancaires associées
                                        </li>
                                        <li className="flex items-center">
                                            <div className="h-1.5 w-1.5 bg-amber-400 rounded-full mr-2"></div>
                                            Historique de traitement
                                        </li>
                                    </ul>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Boutons d'action avec design moderne */}
                    <div className="px-8 pb-8 flex flex-col sm:flex-row gap-3 sm:gap-4">
                        <button
                            type="button"
                            onClick={onClose}
                            className="flex-1 group relative overflow-hidden rounded-2xl bg-gray-100 px-6 py-3.5 text-sm font-semibold text-gray-700 transition-all duration-300 hover:bg-gray-200 hover:scale-[1.02] focus:outline-none focus:ring-2 focus:ring-gray-300 focus:ring-offset-2"
                        >
                            <div className="flex items-center justify-center space-x-2">
                                <FaTimesCircle className="text-gray-500 group-hover:text-gray-600 transition-colors" />
                                <span>Annuler</span>
                            </div>
                        </button>
                        
                        <button
                            type="button"
                            onClick={onConfirm}
                            className="flex-1 group relative overflow-hidden rounded-2xl bg-gradient-to-r from-red-500 via-red-600 to-red-700 px-6 py-3.5 text-sm font-semibold text-white transition-all duration-300 hover:from-red-600 hover:via-red-700 hover:to-red-800 hover:scale-[1.02] hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 transform active:scale-95"
                        >
                            {/* Effet de brillance au survol */}
                            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -skew-x-12 -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></div>
                            
                            <div className="relative flex items-center justify-center space-x-2">
                                <FaTrashAlt className="group-hover:animate-pulse" />
                                <span>Supprimer définitivement</span>
                            </div>
                        </button>
                    </div>

                    {/* Bouton de fermeture en haut à droite */}
                    <button 
                        onClick={onClose}
                        className="absolute top-4 right-4 h-8 w-8 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition-all duration-200 hover:scale-110 focus:outline-none focus:ring-2 focus:ring-gray-300"
                    >
                        <FaTimesCircle className="text-gray-500 text-sm" />
                    </button>
                </div>
            </div>
        </div>
    );
};
// Fonction handleDelete mise à jour
const handleDelete = (id) => {
    const releve = releves.find(r => r.id === id);
    const releveName = releve?.nom_fichier || 'releve.pdf';
    
    setDeleteModal({ 
        isOpen: true, 
        releveId: id, 
        releveName: releveName 
    });
};
{/* Modale de suppression */}

const confirmDelete = async () => {
    const { releveId } = deleteModal;
    
    try {
        setIsDeleting(true);
        setDeleteModal({ isOpen: false, releveId: null, releveName: null });
        
        await axios.delete(`http://localhost:8000/api/banques/${releveId}/`, {
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
            },
            withCredentials: true
        });
        
        setReleves(releves.filter(r => r.id !== releveId));
        toast.success('Relevé supprimé avec succès !');
    } catch (error) {
        console.error("Erreur de suppression:", error);
        toast.error(`Échec de la suppression: ${error.message}`);
    } finally {
        setIsDeleting(false);
    }
};

const formatCurrency = (amount, currency = 'EUR') => {
    if (amount === null || amount === undefined || isNaN(amount)) return 'N/A';
    
    // Pour les DH (Dirhams marocains), on utilise un format spécifique
    if (currency === 'DH') {
        return new Intl.NumberFormat('fr-FR', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        }).format(amount) + ' DH';
    }
    
    // Pour les euros (par défaut)
    return new Intl.NumberFormat('fr-FR', { 
        style: 'currency', 
        currency: 'EUR',
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    }).format(amount);
};

    // Rendu des opérations détaillées pour le rapprochement
    const renderOperations = (operations) => {
    if (!operations || operations.length === 0) {
        return <p className="text-gray-500 text-sm italic">Aucune opération détectée pour ce relevé.</p>;
    }
    
    return (
        <div className="mt-4">
            <h5 className="text-sm font-semibold text-gray-800 mb-2 flex items-center">
                <FaExchangeAlt className="text-blue-500 mr-2" />
                Détail des opérations ({operations.length})
            </h5>
            <div className="overflow-x-auto border border-gray-200 rounded-lg shadow-sm">
                <table className="min-w-full divide-y divide-gray-200 text-xs">
                    <thead className="bg-gray-100">
                        <tr>
                            <th className="px-3 py-2 text-left font-medium text-gray-600">Date</th>
                            <th className="px-3 py-2 text-left font-medium text-gray-600">Réf. Facture</th>
                            <th className="px-3 py-2 text-left font-medium text-gray-600">Libellé</th>
                            <th className="px-3 py-2 text-right font-medium text-gray-600">Débit</th>
                            <th className="px-3 py-2 text-right font-medium text-gray-600">Crédit</th>
                            <th className="px-3 py-2 text-right font-medium text-gray-600">Solde après</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-100">
                        {operations.map((op, index) => (

                             
                            <tr key={index} className="hover:bg-gray-50">
                                <td className="px-3 py-2 whitespace-nowrap text-gray-700">
                                    {op.date || 'N/A'}
                                </td>
                                <td className="px-3 py-2 text-gray-700">
                                    {op.ref_facture || 'N/A'}
                                </td>
                                <td className="px-3 py-2 text-gray-800">
                                    {op.libelle || 'N/A'}
                                </td>
                                <td className="px-3 py-2 text-right text-red-600 font-semibold">
                                    {op.debit !== undefined && op.debit !== null && op.debit !== 0
                                        ? formatCurrency(op.debit, 'DH')
                                        : '-'}
                                </td>
                                <td className="px-3 py-2 text-right text-green-600 font-semibold">
                                    {op.credit !== undefined && op.credit !== null && op.credit !== 0
                                        ? formatCurrency(op.credit, 'DH')
                                        : '-'}
                                </td>
                                <td className="px-3 py-2 text-right text-gray-700">
                                    {op.solde ? formatCurrency(op.solde, 'DH') : '-'}
                                </td>
                            </tr>
    ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};
    const getSortIcon = (key) => {
        if (sortConfig.key !== key) return <FaSort className="text-gray-400 ml-1" />;
        return sortConfig.direction === 'asc' 
            ? <FaSortUp className="text-blue-500 ml-1" /> 
            : <FaSortDown className="text-blue-500 ml-1" />;
    };

    return (
        <div className="min-h-screen bg-gray-50 p-4 md:p-6">
            <div className="max-w-7xl mx-auto">
                {/* En-tête */}
                <div className="bg-white rounded-xl shadow-md overflow-hidden mb-6">
                    <div className="px-6 py-5 sm:px-8 sm:py-6">
                        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                            <div className="flex items-center">
                                <div className="h-12 w-12 rounded-lg bg-blue-100 flex items-center justify-center mr-4">
                                    <FaFileInvoice className="text-blue-600 text-2xl" />
                                </div>
                                <div>
                                    <h1 className="text-2xl font-bold text-gray-800">Relevés Bancaires</h1>
                                    <p className="text-gray-500 text-sm mt-1">
                                        {filteredReleves.length} {filteredReleves.length > 1 ? 'relevés' : 'relevé'} trouvé(s)
                                    </p>
                                </div>
                            </div>
                            
                            <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
                                <div className="relative flex-grow sm:w-64">
                                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                        <FaSearch className="text-gray-400" />
                                    </div>
                                    <input
                                        type="text"
                                        placeholder="Rechercher (fichier, banque, compte, libellé op.)..."
                                        className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 w-full"
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                    />
                                </div>
                                
                                <div className="flex items-center bg-white rounded-lg border px-3">
                                    <FaFilter className="text-gray-500 mr-2" />
                                    <select
                                        className="border-none py-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                                        value={selectedBanque}
                                        onChange={(e) => setSelectedBanque(e.target.value)}
                                    >
                                        {banquesList.map(banque => (
                                            <option key={banque} value={banque}>{banque}</option>
                                        ))}
                                    </select>
                                </div>
                                
                                <button
                                    onClick={() => setShowImportModal(true)}
                                    className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center justify-center"
                                >
                                    <FaUpload className="mr-2" />
                                    <span className="hidden sm:inline">Extraire & Importer</span>
                                </button>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Liste des relevés */}
                <div className="bg-white rounded-xl shadow-md overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th 
                                        className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                                        onClick={() => requestSort('nom_fichier')}
                                    >
                                        <div className="flex items-center">
                                            <FaFilePdf className="text-red-500 mr-2" />
                                            <span>Nom du fichier</span>
                                            {getSortIcon('nom_fichier')}
                                        </div>
                                    </th>
                                    <th 
                                        className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                                        onClick={() => requestSort('metadata.banque')}
                                    >
                                        <div className="flex items-center">
                                            <FaBuilding className="text-blue-500 mr-2" />
                                            <span>Banque</span>
                                            {getSortIcon('metadata.banque')}
                                        </div>
                                    </th>
                                    <th 
                                        className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                                        onClick={() => requestSort('metadata.solde_final')}
                                    >
                                        <div className="flex items-center">
                                            <FaMoneyBillWave className="text-green-500 mr-2" />
                                            <span>Solde Final</span>
                                            {getSortIcon('metadata.solde_final')}
                                        </div>
                                    </th>
                                    <th 
                                        className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                                        onClick={() => requestSort('date_import')}
                                    >
                                        <div className="flex items-center">
                                            <FaCalendarAlt className="text-yellow-500 mr-2" />
                                            <span>Date d'import</span>
                                            {getSortIcon('date_import')}
                                        </div>
                                    </th>
                                    <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Actions
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {loading ? (
                                    <tr>
                                        <td colSpan="5" className="px-6 py-12 text-center">
                                            <div className="flex flex-col items-center justify-center space-y-3">
                                                <FaSpinner className="animate-spin text-blue-600 text-3xl" />
                                                <span className="text-gray-500">Chargement des relevés...</span>
                                            </div>
                                        </td>
                                    </tr>
                                ) : filteredReleves.length === 0 ? (
                                    <tr>
                                        <td colSpan="5" className="px-6 py-12 text-center">
                                            <div className="flex flex-col items-center justify-center space-y-3">
                                                <FaFileInvoice className="text-gray-400 text-3xl" />
                                                <span className="text-gray-500">
                                                    {searchTerm || selectedBanque !== 'Toutes' 
                                                        ? "Aucun relevé ne correspond aux critères de recherche/filtre." 
                                                        : "Aucun relevé bancaire disponible. Importez-en un pour commencer !"}
                                                </span>
                                                {(searchTerm || selectedBanque !== 'Toutes') && (
                                                    <button
                                                        onClick={() => {
                                                            setSearchTerm('');
                                                            setSelectedBanque('Toutes');
                                                        }}
                                                        className="text-blue-600 hover:text-blue-800 text-sm mt-2"
                                                    >
                                                        Réinitialiser les filtres
                                                    </button>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                ) : (
                                    filteredReleves.map((releve) => (
                                        <React.Fragment key={releve.id}>
                                            <tr className="hover:bg-gray-50 transition-colors">
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <div className="flex items-center">
                                                        <div className="flex-shrink-0 h-10 w-10 bg-red-50 rounded-lg flex items-center justify-center mr-3">
                                                            <FaFilePdf className="text-red-500" />
                                                        </div>
                                                        <div>
                                                            <div className="text-sm font-medium text-gray-900">
                                                                {releve.nom_fichier || 'releve.pdf'}
                                                            </div>
                                                            <div className="text-xs text-gray-500">
                                                                {releve.metadata?.numero_compte || releve.metadata?.iban || 'N/A'}
                                                            </div>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <div className="text-sm text-gray-900">
                                                        {releve.metadata?.banque || releve.metadata?.emetteur || 'Inconnue'}
                                                    </div>
                                                    <div className="text-xs text-gray-500">
                                                        {releve.metadata?.client || releve.metadata?.nom_titulaire || 'N/A'}
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <div className="text-sm font-medium">
                                                        {releve.metadata?.solde_final 
                                                            ? formatCurrency(releve.metadata.solde_final) 
                                                            : 'N/A'}
                                                    </div>
                                                    {releve.metadata?.solde_initial && (
                                                        <div className="text-xs text-gray-500">
                                                            Initial: {formatCurrency(releve.metadata.solde_initial)}
                                                        </div>
                                                    )}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <div className="text-sm text-gray-900">
                                                        {new Date(releve.date_import).toLocaleDateString()}
                                                    </div>
                                                    <div className="text-xs text-gray-500">
                                                        {new Date(releve.date_import).toLocaleTimeString()}
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-center">
                                                    <div className="flex justify-center space-x-2">
                                                        <button
                                                            onClick={() => toggleDetails(releve.id)}
                                                            className="h-9 w-9 flex items-center justify-center bg-gray-50 text-gray-600 rounded-lg hover:bg-gray-100 transition-colors"
                                                            title="Détails"
                                                        >
                                                            <FaInfoCircle className="text-sm" />
                                                        </button>
                                                        {/* Bouton pour voir le PDF (si vous avez un viewer) */}
                                                        {releve.downloadUrl && (
                                                            <a 
                                                                href={releve.downloadUrl} 
                                                                target="_blank" 
                                                                rel="noopener noreferrer"
                                                                className="h-9 w-9 flex items-center justify-center bg-purple-50 text-purple-600 rounded-lg hover:bg-purple-100 transition-colors"
                                                                title="Voir le PDF"
                                                            >
                                                                <FaEye className="text-sm" />
                                                            </a>
                                                        )}
                                                        {/* Bouton pour télécharger le PDF */}
                                                        
                                                        <button
                                                            onClick={() => handleDelete(releve.id)}
                                                            disabled={isDeleting}
                                                            className="h-9 w-9 flex items-center justify-center bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition-colors disabled:opacity-50"
                                                            title="Supprimer"
                                                        >
                                                            {isDeleting ? (
                                                                <FaSpinner className="animate-spin text-sm" />
                                                            ) : (
                                                                <FaTrashAlt className="text-sm" />
                                                            )}
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                            {/* Détails du relevé (étendu) */}
                                            {expandedReleve === releve.id && (
                                                <tr>
                                                    <td colSpan="5" className="px-6 py-4 bg-gray-50 border-t border-gray-200">
                                                        <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
                                                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                                                {/* Informations principales du relevé */}
                                                                <div>
                                                                    <h4 className="text-sm font-medium text-gray-700 mb-3 flex items-center">
                                                                        <FaFileSignature className="text-blue-500 mr-2" />
                                                                        Informations générales du relevé
                                                                    </h4>
                                                                    <div className="space-y-2 text-sm">
                                                                        <div className="flex justify-between">
                                                                            <span className="text-gray-500">Banque:</span>
                                                                            <span className="font-medium">
                                                                                {releve.metadata?.banque || releve.metadata?.emetteur || 'N/A'}
                                                                            </span>
                                                                        </div>
                                                                        <div className="flex justify-between">
                                                                            <span className="text-gray-500">Client:</span>
                                                                            <span className="font-medium">
                                                                                {releve.metadata?.client || releve.metadata?.nom_titulaire || 'N/A'}
                                                                            </span>
                                                                        </div>
                                                                        <div className="flex justify-between">
                                                                            <span className="text-gray-500">Compte/IBAN:</span>
                                                                            <span className="font-medium">
                                                                                {releve.metadata?.numero_compte || releve.metadata?.iban || 'N/A'}
                                                                            </span>
                                                                        </div>
                                                                        <div className="flex justify-between">
                                                                            <span className="text-gray-500">Période:</span>
                                                                            <span className="font-medium">
                                                                                {releve.metadata?.periode || 'N/A'}
                                                                            </span>
                                                                        </div>
                                                                        <div className="flex justify-between">
                                                                            <span className="text-gray-500">Solde Initial:</span>
                                                                            <span className="font-medium">
                                                                                {releve.metadata?.solde_initial 
                                                                                    ? formatCurrency(releve.metadata.solde_initial) 
                                                                                    : 'N/A'}
                                                                            </span>
                                                                        </div>
                                                                        <div className="flex justify-between">
                                                                            <span className="text-gray-500">Solde Final:</span>
                                                                            <span className="font-medium">
                                                                                {releve.metadata?.solde_final 
                                                                                    ? formatCurrency(releve.metadata.solde_final) 
                                                                                    : 'N/A'}
                                                                            </span>
                                                                        </div>
                                                                    </div>
                                                                </div>

                                                                {/* Totaux des mouvements (utile pour contrôle) */}
                                                                <div>
                                                                    <h4 className="text-sm font-medium text-gray-700 mb-3 flex items-center">
                                                                        <FaMoneyBillWave className="text-green-500 mr-2" />
                                                                        Totaux des mouvements
                                                                    </h4>
                                                                    <div className="space-y-2 text-sm">
                                                                       {/* Dans la partie qui affiche les totaux des mouvements */}
<div className="flex justify-between">
    <span className="text-gray-500">Total des crédits:</span>
    <span className="font-medium text-green-600">
        {releve.metadata?.total_credits !== undefined && releve.metadata?.total_credits !== null 
            ? formatCurrency(releve.metadata.total_credits) 
            : 'N/A'}
    </span>
</div>
<div className="flex justify-between">
    <span className="text-gray-500">Total des débits:</span>
    <span className="font-medium text-red-600">
        {releve.metadata?.total_debits !== undefined && releve.metadata?.total_debits !== null 
            ? formatCurrency(releve.metadata.total_debits) 
            : 'N/A'}
    </span>
</div>
                                                                    </div>
                                                                    {/* Bouton de rapprochement rapide */}
                                                                    <div className="mt-4">
                                                                        <button
                                                                            onClick={() => navigate(`/dashboardcomptable/rapprochement?releveId=${releve.id}`)}
                                                                            className="w-full bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-lg flex items-center justify-center text-sm"
                                                                        >
                                                                            <FaCheckCircle className="mr-2" />
                                                                            Effectuer le rapprochement
                                                                        </button>
                                                                    </div>
                                                                </div>
                                                                
                                                                {/* Le tableau des opérations pour le rapprochement */}
                                                                <div className="md:col-span-2 lg:col-span-3"> {/* Prend plus de place pour le tableau */}
                                                                    {renderOperations(releve.metadata?.operations)}
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </td>
                                                </tr>
                                            )}
                                        </React.Fragment>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

            {/* Modal d'importation */}
            {showImportModal && (
                <div className="fixed inset-0 bg-gray-600 bg-opacity-75 flex items-center justify-center z-50">
                    <div className="bg-white p-6 rounded-lg shadow-xl w-full max-w-md">
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="text-lg font-bold text-gray-800 flex items-center">
                                <FaUpload className="mr-2 text-blue-600" />
                                Importer un Relevé Bancaire
                            </h3>
                            <button onClick={() => setShowImportModal(false)} className="text-gray-500 hover:text-gray-700">
                                <FaTimesCircle className="text-xl" />
                            </button>
                        </div>
                        
                        <div 
                            className={`border-2 border-dashed rounded-lg p-6 text-center transition-all duration-300 
                                ${isFileHovering ? 'border-blue-500 bg-blue-50' : 'border-gray-300 bg-gray-50'}`}
                            onDragOver={(e) => { e.preventDefault(); setIsFileHovering(true); }}
                            onDragLeave={() => setIsFileHovering(false)}
                            onDrop={(e) => {
                                e.preventDefault();
                                setIsFileHovering(false);
                                handleFileChange({ target: { files: e.dataTransfer.files } });
                            }}
                              
                        >
                            <input
                                type="file"
                                id="pdfUpload"
                                accept=".pdf"
                                onChange={handleFileChange}
                                className="hidden"
                            />
                            <label htmlFor="pdfUpload" className="cursor-pointer">
                                <FaFilePdf className="mx-auto text-blue-400 text-4xl mb-3" />
                                <p className="text-gray-600 font-medium">Glissez-déposez ou <span className="text-blue-600 hover:underline">cliquez pour sélectionner</span> un fichier PDF</p>
                                <p className="text-xs text-gray-500 mt-1">(Taille maximale: 10MB)</p>
                            </label>
                        </div>

                        {selectedFile && (
                            <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-md flex items-center justify-between">
                                <span className="text-sm text-blue-800 flex items-center">
                                    <FaFilePdf className="mr-2 text-blue-600" />
                                    {selectedFile.name} 
                                    {isExtracting && <FaSpinner className="animate-spin ml-2 text-blue-500" />}
                                    {extractionStatus === 'success' && <FaCheckCircle className="ml-2 text-green-500" />}
                                    {extractionStatus === 'error' && <FaTimesCircle className="ml-2 text-red-500" />}
                                </span>
                                <button onClick={() => { setSelectedFile(null); setExtractedData(null); setExtractionStatus(null); }} className="text-blue-500 hover:text-blue-700 text-sm">
                                    <FaTimesCircle />
                                </button>
                            </div>
                        )}

                        {extractedData && extractionStatus === 'success' && (
                            <div className="mt-4 p-4 border border-green-200 bg-green-50 rounded-md">
                                <h4 className="text-sm font-semibold text-green-800 mb-2 flex items-center">
                                    <FaRobot className="mr-2 text-green-600" />
                                    Données extraites (vérification)
                                </h4>
                                <div className="text-xs text-gray-700 space-y-1">
                                    <p><strong>Banque:</strong> {extractedData.nom || extractedData.banque || 'N/A'}</p>
                                    <p><strong>Titulaire:</strong> {extractedData.titulaire || extractedData.client || 'N/A'}</p>
                                    <p><strong>N° Compte:</strong> {extractedData.numero_compte || extractedData.iban || 'N/A'}</p>
                                    <p><strong>Période:</strong> {extractedData.periode || 'N/A'}</p>
                                    <p><strong>Solde Initial:</strong> {formatCurrency(parseFloat(extractedData.solde_initial))}</p>
                                    <p><strong>Solde Final:</strong> {formatCurrency(parseFloat(extractedData.solde_final))}</p>
                                    <p><strong>Opérations détectées:</strong> {extractedData.operations?.length || 0}</p>
                                </div>
                            </div>
                        )}

                        <div className="mt-6 flex justify-end space-x-3">
                            <button
                                onClick={() => setShowImportModal(false)}
                                className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300"
                            >
                                Annuler
                            </button>
                            <button
                                onClick={handleUpload}
                                disabled={!selectedFile || isExtracting || !extractedData || uploadProgress > 0}
                                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 flex items-center"
                            >
                                {uploadProgress > 0 ? (
                                    <>
                                        <FaSpinner className="animate-spin mr-2" />
                                        <span>{uploadProgress}%</span>
                                    </>
                                ) : (
                                    <>
                                        <FaCheckCircle className="mr-2" />
                                        <span>Confirmer & Importer</span>
                                    </>
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            )}
               <DeleteConfirmationModal
                isOpen={deleteModal.isOpen}
                onClose={() => setDeleteModal({ isOpen: false, releveId: null, releveName: null })}
                onConfirm={confirmDelete}
                releveName={deleteModal.releveName}
            />
        </div>
    );
}

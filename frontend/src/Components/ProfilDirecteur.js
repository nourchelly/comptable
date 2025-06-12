import axios from "axios";
import React, { useEffect, useState } from "react";
import { useUser } from './UserContext';
import { 
  FaUserEdit, 
  FaTrashAlt,
  FaEnvelope,
  FaPhone,
  FaChartPie,
  FaBuilding,
  FaKey,
  FaSignature,
  FaShieldAlt,
  FaPlusCircle,
  FaTimes,
  FaSpinner,
  FaExclamationTriangle,
  FaUserCircle,
  FaCamera,
  FaCalendarAlt,
  FaUser,
  FaCalendarCheck,
  FaSignInAlt,
  FaIdCard
} from "react-icons/fa";
import { GiMoneyStack } from "react-icons/gi";
import { useNavigate, Link } from "react-router-dom";

const ProfilDirecteur = () => {
    const { user, logout } = useUser();
    const [profile, setProfile] = useState({
        username: '',
        email: '',
        nom_complet: '',
        telephone: '',
        date_naissance: '',
        matricule: '',
        sexe: '',
        last_login: '',
        date_creation: '',
        role: '',
        departement: '',
        specialite: ''
    });
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [showAddForm, setShowAddForm] = useState(false);
    const [showDeleteConfirmation, setShowDeleteConfirmation] = useState(false);
    const [formData, setFormData] = useState({
        nom_complet: '',
        telephone: '',
        date_naissance: '',
        matricule: '',
        sexe: '',
        departement: '',
        specialite: ''
    });
    const navigate = useNavigate();
    
    const GENDER_CHOICES = [
        { value: 'Homme', label: 'Homme' },
        { value: 'Femme', label: 'Femme' },
        { value: 'Autre', label: 'Autre' },
    ];
    
    const DEPARTEMENT_OPTIONS = [
        { value: 'Finance', label: 'Finance' },
        { value: 'Comptabilité', label: 'Comptabilité' },
        { value: 'RH', label: 'Ressources Humaines' },
        { value: 'Direction', label: 'Direction' },
        { value: 'IT', label: 'Technologie de l\'Information' }
    ];

    useEffect(() => {
        const fetchProfile = async () => {
            if (!user?.id) {
                setError("Utilisateur non connecté");
                setLoading(false);
                return;
            }

            try {
                const response = await axios.get(`http://127.0.0.1:8000/api/profildirecteur/${user.id}/`, {
                    withCredentials: true
                });

                const profileData = response.data || {};
                console.log("Données reçues:", profileData);

                setFormData({
                    nom_complet: profileData.nom_complet || '',
                    telephone: profileData.telephone || '',
                    date_naissance: profileData.date_naissance 
                        ? new Date(profileData.date_naissance).toISOString().split('T')[0] 
                        : '',
                    matricule: profileData.matricule || '',
                    sexe: profileData.sexe || '',
                    departement: profileData.departement || '',
                    specialite: profileData.specialite || ''
                });

                setProfile({
                    username: profileData.username || 'Non spécifié',
                    email: profileData.email || 'Non spécifié',
                    nom_complet: profileData.nom_complet || null,
                    telephone: profileData.telephone || null,
                    date_naissance: profileData.date_naissance || null,
                    matricule: profileData.matricule || null,
                    sexe: profileData.sexe || null,
                    last_login: profileData.last_login || 'Non spécifié',
                    date_creation: profileData.date_joined || 'Non spécifié',
                    role: profileData.role || 'Directeur',
                    departement: profileData.departement || null,
                    specialite: profileData.specialite || null
                });

            } catch (err) {
                console.error("Erreur lors de la récupération du profil:", err);
                
                if (err.response?.status === 404) {
                    setError("Profil directeur non trouvé");
                } else if (err.response?.status === 403) {
                    setError("Accès non autorisé - vérifiez votre rôle");
                } else {
                    setError(err.response?.data?.error || err.message || "Impossible de charger les informations du profil");
                }
            } finally {
                setLoading(false);
            }
        };

        fetchProfile();
    }, [user]);

    const handleDelete = () => {
        setShowDeleteConfirmation(true);
    };
    
    const confirmDelete = async () => {
        try {
            const response = await axios.delete(`http://127.0.0.1:8000/api/profildirecteur/${user.id}/`, {
                withCredentials: true
            });
            
            if (response.data?.status === 'success') {
                alert("Votre compte a été supprimé avec succès");
                logout();
                navigate('/connexion');
            }
        } catch (err) {
            console.error("Erreur lors de la suppression du compte:", err);
            setError("Impossible de supprimer le compte");
        } finally {
            setShowDeleteConfirmation(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError(null);
        
        try {
            const payload = {
                user_id: user?.id,
                nom_complet: formData.nom_complet,
                telephone: formData.telephone,
                date_naissance: formData.date_naissance,
                matricule: formData.matricule,
                sexe: formData.sexe,
                departement: formData.departement,
                specialite: formData.specialite
            };

            const response = await axios.post(
                `http://127.0.0.1:8000/api/profildirecteur/`,
                payload,
                { 
                    withCredentials: true,
                    headers: {
                        'Content-Type': 'application/json'
                    }
                }
            );

            if (response.data?.status === 'success') {
                const profileResponse = await axios.get(
                    `http://127.0.0.1:8000/api/profildirecteur/${user?.id}/`,
                    { withCredentials: true }
                );
                
                const newProfileData = profileResponse.data;
                
                setProfile(prev => ({
                    ...prev,
                    nom_complet: newProfileData.nom_complet || null,
                    telephone: newProfileData.telephone || null,
                    date_naissance: newProfileData.date_naissance || null,
                    matricule: newProfileData.matricule || null,
                    sexe: newProfileData.sexe || null,
                    departement: newProfileData.departement || null,
                    specialite: newProfileData.specialite || null
                }));
                
                setShowAddForm(false);
                alert(response.data.message || "Profil directeur mis à jour avec succès");
            }
        } catch (err) {
            console.error("Erreur lors de la mise à jour:", err);
            
            if (err.response) {
                if (err.response.status === 400) {
                    setError(err.response.data.error || "Données invalides");
                } else if (err.response.status === 403) {
                    setError("Vous n'avez pas la permission de modifier ce profil");
                } else if (err.response.status === 409) {
                    setError("Ce matricule est déjà utilisé par un autre utilisateur");
                } else {
                    setError(err.response.data.error || "Erreur lors de la mise à jour du profil");
                }
            } else {
                setError("Erreur de connexion au serveur");
            }
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <div className="text-center">
                    <FaSpinner className="animate-spin h-12 w-12 text-indigo-600 mx-auto mb-4" />
                    <p className="text-lg text-gray-600">Chargement de votre profil...</p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <div className="max-w-md bg-white p-8 rounded-xl shadow-md text-center">
                    <FaExclamationTriangle className="h-12 w-12 text-red-500 mx-auto mb-4" />
                    <h2 className="text-xl font-bold text-gray-800 mb-2">Erreur</h2>
                    <p className="text-gray-600 mb-6">{error}</p>
                    <button
                        onClick={() => window.location.reload()}
                        className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition-colors"
                    >
                        Réessayer
                    </button>
                </div>
            </div>
        );
    }

    if (!user) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <div className="max-w-md bg-white p-8 rounded-xl shadow-md text-center">
                    <FaUserCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <h2 className="text-xl font-bold text-gray-800 mb-2">Accès non autorisé</h2>
                    <p className="text-gray-600 mb-6">Veuillez vous connecter pour accéder à cette page</p>
                    <Link
                        to="/connexion"
                        className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition-colors"
                    >
                        Se connecter
                    </Link>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
            <div className="max-w-6xl mx-auto">
                {/* Header */}
                <div className="text-center mb-12">
                    <h1 className="text-3xl font-bold text-gray-900 flex items-center justify-center">
                        <GiMoneyStack className="text-indigo-600 mr-3 text-4xl" />
                        <span className="bg-gradient-to-r from-indigo-600 to-blue-800 bg-clip-text text-transparent">
                            Profil Directeur Financier
                        </span>
                    </h1>
                    <p className="mt-2 text-lg text-gray-600">Gestion de votre profil professionnel</p>
                </div>

                {/* Profile Card */}
                <div className="bg-white rounded-xl shadow-md overflow-hidden">
                    <div className="md:flex flex-row-reverse">
                        {/* Partie bleue à droite */}
                        <div className="md:w-1/3 bg-gradient-to-b from-indigo-600 to-indigo-800 p-8 text-white shadow-lg">
                            <div className="flex flex-col items-center h-full justify-between">
                                {/* Photo de profil */}
                                <div className="relative mb-6 group transform hover:scale-105 transition duration-300">
                                    <div className="h-40 w-40 rounded-full border-4 border-white shadow-xl overflow-hidden bg-indigo-500 flex items-center justify-center">
                                        <FaUserCircle className="h-32 w-32 text-white opacity-90" />
                                    </div>
                                    <button className="absolute bottom-0 right-0 bg-white text-indigo-600 p-2 rounded-full hover:bg-gray-100 transition shadow-md transform hover:scale-110">
                                        <FaCamera className="text-sm" />
                                    </button>
                                </div>
                                
                                {/* Informations utilisateur */}
                                <div className="text-center">
                                    <h2 className="text-2xl font-bold">{profile.username}</h2>
                                    <p className="mt-2 text-indigo-100 text-sm bg-indigo-500/80 px-4 py-1 rounded-full inline-block">
                                        Directeur Financier
                                    </p>
                                    
                                    {/* Dernière connexion */}
                                    <div className="mt-4 text-indigo-200 text-sm">
                                        <p>Dernière connexion :</p>
                                        <p className="font-medium">
                                            {profile.last_login 
                                                ? new Date(profile.last_login).toLocaleString('fr-FR') 
                                                : 'Non disponible'}
                                        </p>
                                    </div>
                                </div>
                                
                                {/* Boutons d'action */}
                                <div className="mt-8 w-full space-y-4">
                                    <button
                                        onClick={() => setShowAddForm(true)}
                                        className="w-full flex items-center justify-center px-6 py-3 bg-white text-indigo-600 rounded-lg font-medium hover:bg-gray-50 transition shadow-sm hover:shadow-md"
                                    >
                                        <FaPlusCircle className="mr-2 text-indigo-600" />
                                        {profile.nom_complet ? 'Modifier' : 'Compléter'} le profil
                                    </button>
                                    
                                    <Link
                                        to="/dashboarddirecteur/modify_profil"
                                        className="w-full flex items-center justify-center px-6 py-3 bg-indigo-500/90 text-white rounded-lg font-medium hover:bg-indigo-600 transition shadow-sm hover:shadow-md"
                                    >
                                        <FaUserEdit className="mr-2 text-white" />
                                        Modifier le compte
                                    </Link>
                                </div>
                            </div>
                        </div>

                        {/* Partie informations à gauche */}
                        <div className="md:w-2/3 p-8">
                            <div className="mb-8">
                                <h2 className="text-xl font-bold text-gray-800 mb-6 flex items-center">
                                    <GiMoneyStack className="text-indigo-600 mr-3" />
                                    <span className="border-b-2 border-indigo-200 pb-1">
                                        Informations Professionnelles
                                    </span>
                                </h2>
                                
                                {/* Grille d'informations */}
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    {/* Nom complet */}
                                    <div className="bg-gray-50 p-4 rounded-lg hover:shadow-md transition">
                                        <div className="flex items-center mb-2">
                                            <FaSignature className="text-purple-500 mr-3" />
                                            <h3 className="text-sm font-medium text-gray-500">Nom complet</h3>
                                        </div>
                                        <p className="text-lg font-semibold text-gray-900 pl-9">
                                            {profile.nom_complet || profile.username || 'Non spécifié'}
                                        </p>
                                    </div>
                                    
                                    {/* Email */}
                                    <div className="bg-gray-50 p-4 rounded-lg hover:shadow-md transition">
                                        <div className="flex items-center mb-2">
                                            <FaEnvelope className="text-red-400 mr-3" />
                                            <h3 className="text-sm font-medium text-gray-500">Email</h3>
                                        </div>
                                        <p className="text-lg font-semibold text-gray-900 pl-9">
                                            {profile.email || 'Non spécifié'}
                                        </p>
                                    </div>
                                    
                                    {/* Téléphone */}
                                    <div className="bg-gray-50 p-4 rounded-lg hover:shadow-md transition">
                                        <div className="flex items-center mb-2">
                                            <FaPhone className="text-green-500 mr-3" />
                                            <h3 className="text-sm font-medium text-gray-500">Téléphone</h3>
                                        </div>
                                        <p className="text-lg font-semibold text-gray-900 pl-9">
                                            {profile.telephone || 'Non spécifié'}
                                        </p>
                                    </div>
                                    
                                    {/* Matricule */}
                                    <div className="bg-gray-50 p-4 rounded-lg hover:shadow-md transition">
                                        <div className="flex items-center mb-2">
                                            <FaIdCard className="text-indigo-500 mr-3" />
                                            <h3 className="text-sm font-medium text-gray-500">Matricule</h3>
                                        </div>
                                        <p className="text-lg font-semibold text-gray-900 pl-9">
                                            {profile.matricule || 'Non spécifié'}
                                        </p>
                                    </div>
                                    
                                    {/* Date de naissance */}
                                    <div className="bg-gray-50 p-4 rounded-lg hover:shadow-md transition">
                                        <div className="flex items-center mb-2">
                                            <FaCalendarAlt className="text-blue-400 mr-3" />
                                            <h3 className="text-sm font-medium text-gray-500">Date de naissance</h3>
                                        </div>
                                        <p className="text-lg font-semibold text-gray-900 pl-9">
                                            {profile.date_naissance 
                                                ? new Date(profile.date_naissance).toLocaleDateString('fr-FR') 
                                                : 'Non spécifié'}
                                        </p>
                                    </div>
                                    
                                    {/* Sexe */}
                                    <div className="bg-gray-50 p-4 rounded-lg hover:shadow-md transition">
                                        <div className="flex items-center mb-2">
                                            <FaUser className="text-pink-500 mr-3" />
                                            <h3 className="text-sm font-medium text-gray-500">Sexe</h3>
                                        </div>
                                        <p className="text-lg font-semibold text-gray-900 pl-9">
                                            {profile.sexe || 'Non spécifié'}
                                        </p>
                                    </div>
                                    
                                    {/* Spécialité */}
                                    <div className="bg-gray-50 p-4 rounded-lg hover:shadow-md transition">
                                        <div className="flex items-center mb-2">
                                            <FaChartPie className="text-yellow-500 mr-3" />
                                            <h3 className="text-sm font-medium text-gray-500">Spécialité</h3>
                                        </div>
                                        <p className="text-lg font-semibold text-gray-900 pl-9">
                                            {profile.specialite || 'Non spécifié'}
                                        </p>
                                    </div>
                                    
                                    {/* Département */}
                                    <div className="bg-gray-50 p-4 rounded-lg hover:shadow-md transition">
                                        <div className="flex items-center mb-2">
                                            <FaBuilding className="text-blue-400 mr-3" />
                                            <h3 className="text-sm font-medium text-gray-500">Département</h3>
                                        </div>
                                        <p className="text-lg font-semibold text-gray-900 pl-9">
                                            {profile.departement || 'Non spécifié'}
                                        </p>
                                    </div>
                                </div>
                            </div>

                            {/* Dates importantes */}
                            <div className="mt-8">
                                <h2 className="text-xl font-bold text-gray-800 mb-6 flex items-center">
                                    <FaCalendarAlt className="text-indigo-600 mr-3" />
                                    <span className="border-b-2 border-indigo-200 pb-1">
                                        Historique
                                    </span>
                                </h2>
                                
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="bg-gray-50 p-4 rounded-lg hover:shadow-md transition">
                                        <div className="flex items-center mb-2">
                                            <FaCalendarCheck className="text-green-500 mr-3" />
                                            <h3 className="text-sm font-medium text-gray-500">Date de création</h3>
                                        </div>
                                        <p className="text-lg font-semibold text-gray-900 pl-9">
                                            {profile.date_creation 
                                                ? new Date(profile.date_creation).toLocaleDateString('fr-FR') 
                                                : 'Non spécifié'}
                                        </p>
                                    </div>
                                    
                                    <div className="bg-gray-50 p-4 rounded-lg hover:shadow-md transition">
                                        <div className="flex items-center mb-2">
                                            <FaSignInAlt className="text-blue-500 mr-3" />
                                            <h3 className="text-sm font-medium text-gray-500">Dernière connexion</h3>
                                        </div>
                                        <p className="text-lg font-semibold text-gray-900 pl-9">
                                            {profile.last_login 
                                                ? new Date(profile.last_login).toLocaleString('fr-FR') 
                                                : 'Non spécifié'}
                                        </p>
                                    </div>
                                </div>
                            </div>

                            {/* Bouton Supprimer */}
                            <div className="flex justify-end mt-8">
                                <button
                                    onClick={handleDelete}
                                    className="flex items-center px-4 py-2 text-red-600 hover:text-red-800 hover:bg-red-50 rounded-lg transition"
                                >
                                    <FaTrashAlt className="mr-2" />
                                    Supprimer mon compte
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            
            {/* Modal de confirmation de suppression */}
            {showDeleteConfirmation && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-xl shadow-2xl w-full max-w-md overflow-hidden">
                        <div className="bg-red-50 p-5 border-b border-red-100">
                            <div className="flex flex-col items-center">
                                <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100">
                                    <svg 
                                        className="h-6 w-6 text-red-600" 
                                        fill="none" 
                                        viewBox="0 0 24 24" 
                                        stroke="currentColor"
                                        strokeWidth="2"
                                    >
                                        <path 
                                            strokeLinecap="round" 
                                            strokeLinejoin="round" 
                                            d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" 
                                        />
                                    </svg>
                                </div>
                                <h3 className="mt-4 text-xl font-bold text-red-600">Confirmation requise</h3>
                            </div>
                        </div>

                        <div className="p-6 space-y-4">
                            <div className="flex items-start">
                                <div className="flex-shrink-0 text-red-500">
                                    <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
                                        <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                                    </svg>
                                </div>
                                <div className="ml-3">
                                    <h3 className="text-lg font-medium text-gray-900">Êtes-vous sûr de vouloir supprimer ce compte ?</h3>
                                </div>
                            </div>

                            <div className="bg-yellow-50 rounded-lg p-4">
                                <div className="flex">
                                    <div className="flex-shrink-0 text-yellow-500">
                                        <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
                                            <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                                        </svg>
                                    </div>
                                    <div className="ml-3">
                                        <div className="text-sm text-yellow-700">
                                            <p className="font-medium">Cette action est irréversible !</p>
                                            <ul className="mt-1 list-disc list-inside space-y-1">
                                                <li>L'utilisateur perdra immédiatement l'accès</li>
                                                <li>Toutes les données seront définitivement supprimées</li>
                                                <li>Cette opération ne peut pas être annulée</li>
                                            </ul>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse rounded-b-lg">
                            <button
                                type="button"
                                onClick={confirmDelete}
                                className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-red-600 text-base font-medium text-white hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 sm:ml-3 sm:w-auto sm:text-sm transition-colors duration-150"
                            >
                                <svg className="-ml-1 mr-2 h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                </svg>
                                Confirmer la suppression
                            </button>
                            <button
                                type="button"
                                onClick={() => setShowDeleteConfirmation(false)}
                                className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm transition-colors duration-150"
                            >
                                <svg className="-ml-1 mr-2 h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                                </svg>
                                Annuler
                            </button>
                        </div>
                    </div>
                </div>
            )}
            
            {/* Formulaire d'ajout/modification */}
            {showAddForm && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl">
                        <div className="flex justify-between items-center border-b p-6 bg-indigo-600 text-white rounded-t-xl">
                            <h3 className="text-xl font-bold">
                                {profile.nom_complet ? 'Modifier le profil' : 'Compléter votre profil'}
                            </h3>
                            <button 
                                onClick={() => setShowAddForm(false)}
                                className="text-white hover:text-indigo-200 transition"
                            >
                                <FaTimes className="text-xl" />
                            </button>
                        </div>
                        
                        <form onSubmit={handleSubmit} className="p-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                {/* Colonne gauche */}
                                <div className="space-y-5">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">Nom complet *</label>
                                        <input
                                            type="text"
                                            name="nom_complet"
                                            value={formData.nom_complet}
                                            onChange={(e) => setFormData({...formData, nom_complet: e.target.value})}
                                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition"
                                            required
                                        />
                                    </div>
                                    
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">Téléphone *</label>
                                        <input
                                            type="tel"
                                            name="telephone"
                                            value={formData.telephone}
                                            onChange={(e) => setFormData({...formData, telephone: e.target.value})}
                                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition"
                                            required
                                        />
                                    </div>
                                    
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">Date de naissance</label>
                                        <input
                                            type="date"
                                            name="date_naissance"
                                            value={formData.date_naissance}
                                            onChange={(e) => setFormData({...formData, date_naissance: e.target.value})}
                                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition"
                                        />
                                    </div>
                                </div>
                                
                                {/* Colonne droite */}
                                <div className="space-y-5">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">Matricule</label>
                                        <input
                                            type="text"
                                            name="matricule"
                                            value={formData.matricule}
                                            onChange={(e) => setFormData({...formData, matricule: e.target.value})}
                                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition"
                                        />
                                    </div>
                                    
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">Sexe</label>
                                        <select
                                            name="sexe"
                                            value={formData.sexe}
                                            onChange={(e) => setFormData({...formData, sexe: e.target.value})}
                                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition"
                                        >
                                            <option value="">Sélectionnez un sexe</option>
                                            {GENDER_CHOICES.map((option) => (
                                                <option key={option.value} value={option.value}>
                                                    {option.label}
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                    
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">Département *</label>
                                        <select
                                            name="departement"
                                            value={formData.departement}
                                            onChange={(e) => setFormData({...formData, departement: e.target.value})}
                                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition"
                                            required
                                        >
                                            <option value="">Sélectionnez un département</option>
                                            {DEPARTEMENT_OPTIONS.map((option) => (
                                                <option key={option.value} value={option.value}>
                                                    {option.label}
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                    
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">Spécialité *</label>
                                        <input
                                            type="text"
                                            name="specialite"
                                            value={formData.specialite}
                                            onChange={(e) => setFormData({...formData, specialite: e.target.value})}
                                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition"
                                            required
                                        />
                                    </div>
                                </div>
                            </div>
                            
                            {error && (
                                <div className="mt-4 p-3 bg-red-50 text-red-700 rounded-lg flex items-center">
                                    <FaExclamationTriangle className="mr-2" />
                                    {error}
                                </div>
                            )}
                            
                            <div className="mt-8 flex justify-end space-x-4">
                                <button
                                    type="button"
                                    onClick={() => setShowAddForm(false)}
                                    className="px-5 py-2.5 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition shadow-sm"
                                >
                                    Annuler
                                </button>
                                <button
                                    type="submit"
                                    className="px-5 py-2.5 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition shadow-sm flex items-center"
                                >
                                    {profile.nom_complet ? (
                                        <>
                                            <FaUserEdit className="mr-2" />
                                            Mettre à jour
                                        </>
                                    ) : (
                                        <>
                                            <FaPlusCircle className="mr-2" />
                                            Enregistrer
                                        </>
                                    )}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ProfilDirecteur;
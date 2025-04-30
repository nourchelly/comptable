import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useUser } from './UserContext';
import { useNavigate, Link } from 'react-router-dom';
import { 
  IdentificationIcon,
  EnvelopeIcon,
  CalendarIcon,
  ShieldCheckIcon,
  PencilSquareIcon,
  TrashIcon,
  ArrowLeftIcon,
  ExclamationTriangleIcon,
  CogIcon,
  LockClosedIcon,
  BellIcon,
  PlusCircleIcon
} from '@heroicons/react/24/outline';

const UserProfileView = () => {
    const { user, logout } = useUser();
    const [profile, setProfile] = useState(null);
    const [showDeleteConfirmation, setShowDeleteConfirmation] = useState(false);
    const [error, setError] = useState(null);
    const [loading, setLoading] = useState(true);
    const [hoverPhoto, setHoverPhoto] = useState(false);
    const [showAddForm, setShowAddForm] = useState(false);
    const [formData, setFormData] = useState({
        nom_complet: '',
        telephone: '',
        last_login: '',
        date_creation: ''
    });
    const navigate = useNavigate();

    useEffect(() => {
        const fetchProfile = async () => {
            if (!user?.id) {
                setError("Utilisateur non connecté");
                setLoading(false);
                return;
            }
            
            try {
                const response = await axios.get(`http://127.0.0.1:8000/api/profiladmin/${user.id}/`, {
                    withCredentials: true
                });
                
                if (!response.data) {
                    throw new Error("Aucune donnée reçue");
                }
        
                setProfile({
                    username: response.data.username || 'Non spécifié',
                    email: response.data.email || 'Non spécifié',
                    nom_complet: response.data.nom_complet || null,
                    telephone: response.data.telephone || null,
                    last_login: response.data.last_login || 'Non spécifié',
                    date_creation: response.data.date_creation || 'Non spécifié',
                    role: response.data.role || 'Admin'
                });
                
            } catch (err) {
                console.error("Erreur lors de la récupération du profil:", err);
                setError(err.message || "Impossible de charger les informations du profil");
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
            const response = await axios.delete(`http://127.0.0.1:8000/api/profilcomptable/${user.id}/`, {
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
            const response = await axios.post(
                `http://127.0.0.1:8000/api/profiladmin/`,
                {
                    user_id: user.id,
                    nom_complet: formData.nom_complet,
                    telephone: formData.telephone,
                },
                { withCredentials: true }
            );

            if (response.data.status === 'success') {
                const profileResponse = await axios.get(
                    `http://127.0.0.1:8000/api/profiladmin/${user.id}/`,
                    { withCredentials: true }
                );
                setProfile({
                    ...profile,
                    nom_complet: profileResponse.data.nom_complet,
                    telephone: profileResponse.data.telephone
                });
                setShowAddForm(false);
                setError(null);
            }
        } catch (err) {
            console.error("Erreur lors de l'ajout des informations:", err);
            setError(err.response?.data?.error || "Erreur lors de l'ajout des informations");
        }
    };

    if (!user) {
        return (
            <div className="max-w-md mx-auto mt-20 p-8 bg-white rounded-2xl shadow-xl border border-gray-100 text-center">
                <div className="flex justify-center mb-6">
                    <div className="p-4 bg-red-100 rounded-full">
                        <ExclamationTriangleIcon className="h-10 w-10 text-red-500" />
                    </div>
                </div>
                <h3 className="text-2xl font-bold text-gray-800 mb-3">Accès non autorisé</h3>
                <p className="text-gray-600 mb-6">Connectez-vous pour accéder à votre profil</p>
                <div className="flex justify-center">
                    <Link 
                        to="/connexion" 
                        className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-blue-500 to-indigo-600 text-white font-medium rounded-lg shadow-lg hover:shadow-xl transition-all hover:from-blue-600 hover:to-indigo-700"
                    >
                        <LockClosedIcon className="h-5 w-5 mr-2" />
                        Se connecter
                    </Link>
                </div>
            </div>
        );
    }

    if (loading) {
        return (
            <div className="flex justify-center items-center h-screen">
                <div className="text-center">
                    <div className="inline-flex mb-4">
                        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
                    </div>
                    <h3 className="text-xl font-semibold text-gray-800 mb-2">Chargement du profil</h3>
                    <p className="text-gray-500">Veuillez patienter...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
            <div className="max-w-6xl mx-auto">
                <div className="flex justify-between items-center mb-8">
                    <button 
                        onClick={() => navigate(-1)}
                        className="flex items-center space-x-2 text-indigo-600 hover:text-indigo-800 transition-colors"
                    >
                        <ArrowLeftIcon className="h-5 w-5" />
                        <span className="font-medium">Retour</span>
                    </button>
                    <div className="flex space-x-3">
                        <button className="p-2 bg-white rounded-lg shadow-sm hover:bg-gray-50 transition-colors">
                            <CogIcon className="h-5 w-5 text-gray-600" />
                        </button>
                        <button className="p-2 bg-white rounded-lg shadow-sm hover:bg-gray-50 transition-colors">
                            <BellIcon className="h-5 w-5 text-gray-600" />
                        </button>
                    </div>
                </div>

                <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
                    <div className="flex flex-col lg:flex-row">
                        {/* Section Profil */}
                        <div className="w-full lg:w-1/3 bg-gradient-to-b from-indigo-600 to-indigo-700 p-8 flex flex-col items-center">
                            <div 
                                className="relative mb-6 group"
                                onMouseEnter={() => setHoverPhoto(true)}
                                onMouseLeave={() => setHoverPhoto(false)}
                            >
                                <div className="h-40 w-40 rounded-full border-4 border-white shadow-xl overflow-hidden transition-transform duration-300 group-hover:scale-105">
                                    <img 
                                        src="/images/nou.jpg" 
                                        alt="Profil administrateur"
                                        className="h-full w-full object-cover"
                                    />
                                </div>
                                {hoverPhoto && (
                                    <div className="absolute inset-0 bg-black bg-opacity-40 rounded-full flex items-center justify-center">
                                        <div className="text-center animate-fade-in">
                                            <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-white text-indigo-600 mb-2">
                                                <PencilSquareIcon className="h-5 w-5" />
                                            </div>
                                            <p className="text-white font-medium text-sm">Modifier photo</p>
                                        </div>
                                    </div>
                                )}
                            </div>
                            
                            <h2 className="text-2xl font-bold text-white text-center">{profile.username}</h2>
                            <p className="text-indigo-200 mt-1 text-sm font-medium capitalize">{profile.role}</p>
                            
                            <div className="mt-8 w-full space-y-4">
                                <Link
                                    to={`/dashboard/edit-profile`}
                                    className="w-full flex items-center justify-center space-x-2 px-6 py-3 bg-white text-indigo-600 font-medium rounded-lg shadow-md hover:bg-gray-50 transition-all"
                                >
                                    <PencilSquareIcon className="h-5 w-5" />
                                    <span>Modifier le profil</span>
                                </Link>
                                
                                {(!profile.nom_complet || !profile.telephone) && (
                                    <button
                                        onClick={() => setShowAddForm(true)}
                                        className="w-full flex items-center justify-center space-x-2 px-6 py-3 bg-green-600 text-white font-medium rounded-lg shadow-md hover:bg-green-700 transition-all"
                                    >
                                        <PlusCircleIcon className="h-5 w-5" />
                                        <span>Ajouter des informations</span>
                                    </button>
                                )}
                            </div>
                        </div>

                        {/* Section Détails */}
                        <div className="w-full lg:w-2/3">
                            <div className="px-8 py-6 border-b border-gray-200">
                                <h3 className="text-2xl font-bold text-gray-800">Informations du profil</h3>
                                <p className="text-gray-500">Gérez vos informations personnelles et paramètres</p>
                            </div>
                            
                            <div className="p-8">
                                {error && (
                                    <div className="mb-6 p-4 bg-red-50 rounded-lg flex items-start border border-red-200">
                                        <ExclamationTriangleIcon className="h-5 w-5 text-red-500 mr-3 mt-0.5" />
                                        <div>
                                            <p className="text-red-700 font-medium">{error}</p>
                                        </div>
                                    </div>
                                )}
                                
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    {/* Carte Identité */}
                                    <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
                                        <div className="flex items-center mb-4">
                                            <div className="p-3 bg-blue-100 rounded-lg mr-4">
                                                <IdentificationIcon className="h-6 w-6 text-blue-600" />
                                            </div>
                                            <h4 className="text-lg font-semibold text-gray-800">Identité</h4>
                                        </div>
                                        <div className="space-y-3 pl-16">
                                            <div>
                                                <p className="text-xs text-gray-500 uppercase tracking-wider">Nom d'utilisateur</p>
                                                <p className="text-gray-900 font-medium">{profile.username}</p>
                                            </div>
                                            <div>
                                                <p className="text-xs text-gray-500 uppercase tracking-wider">Nom complet</p>
                                                <p className="text-gray-900 font-medium">
                                                    {profile.nom_complet || (
                                                        <span className="text-gray-400">Non spécifié</span>
                                                    )}
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                    
                                    {/* Carte Contact */}
                                    <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
                                        <div className="flex items-center mb-4">
                                            <div className="p-3 bg-purple-100 rounded-lg mr-4">
                                                <EnvelopeIcon className="h-6 w-6 text-purple-600" />
                                            </div>
                                            <h4 className="text-lg font-semibold text-gray-800">Contact</h4>
                                        </div>
                                        <div className="space-y-3 pl-16">
                                            <div>
                                                <p className="text-xs text-gray-500 uppercase tracking-wider">Email</p>
                                                <p className="text-gray-900 font-medium">{profile.email}</p>
                                            </div>
                                            <div>
                                                <p className="text-xs text-gray-500 uppercase tracking-wider">Téléphone</p>
                                                <p className="text-gray-900 font-medium">
                                                    {profile.telephone || (
                                                        <span className="text-gray-400">Non spécifié</span>
                                                    )}
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                    
                                    {/* Carte Informations */}
                                    <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
                                        <div className="flex items-center mb-4">
                                            <div className="p-3 bg-green-100 rounded-lg mr-4">
                                                <CalendarIcon className="h-6 w-6 text-green-600" />
                                            </div>
                                            <h4 className="text-lg font-semibold text-gray-800">Informations</h4>
                                        </div>
                                        <div className="space-y-3 pl-16">
                                            <div>
                                                <p className="text-xs text-gray-500 uppercase tracking-wider">Date de création</p>
                                                <p className="text-gray-900 font-medium">
                                                    {profile.date_creation ? 
                                                        new Date(profile.date_creation).toLocaleDateString() : 
                                                        'Non spécifié'}
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                    
                                    {/* Carte Sécurité */}
                                    <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
                                        <div className="flex items-center mb-4">
                                            <div className="p-3 bg-amber-100 rounded-lg mr-4">
                                                <ShieldCheckIcon className="h-6 w-6 text-amber-600" />
                                            </div>
                                            <h4 className="text-lg font-semibold text-gray-800">Sécurité</h4>
                                        </div>
                                        <div className="space-y-3 pl-16">
                                            <div>
                                                <p className="text-xs text-gray-500 uppercase tracking-wider">Rôle</p>
                                                <p className="text-gray-900 font-medium capitalize">{profile.role}</p>
                                            </div>
                                            <div>
                                                <p className="text-xs text-gray-500 uppercase tracking-wider">Dernière connexion</p>
                                                <p className="text-gray-900 font-medium">
                                                    {profile.last_login ? 
                                                        new Date(profile.last_login).toLocaleString() : 
                                                        "Jamais connecté"}
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            
                            <div className="px-8 py-6 bg-gray-50 border-t border-gray-200 flex flex-col sm:flex-row justify-between items-center">
                                <div className="mb-4 sm:mb-0">
                                    <p className="text-sm text-gray-500">
                                        Compte créé le {profile.date_creation ? 
                                            new Date(profile.date_creation).toLocaleDateString() : 
                                            'Date inconnue'}
                                    </p>
                                </div>
                                <button
                                    onClick={handleDelete}
                                    className="flex items-center space-x-2 px-4 py-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition-colors"
                                >
                                    <TrashIcon className="h-5 w-5" />
                                    <span>Supprimer le compte</span>
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
                                    <ExclamationTriangleIcon className="h-6 w-6 text-red-600" />
                                </div>
                                <h3 className="mt-4 text-xl font-bold text-red-600">Confirmation requise</h3>
                            </div>
                        </div>

                        <div className="p-6 space-y-4">
                            <div className="flex items-start">
                                <div className="flex-shrink-0 text-red-500">
                                    <ExclamationTriangleIcon className="h-5 w-5" />
                                </div>
                                <div className="ml-3">
                                    <h3 className="text-lg font-medium text-gray-900">Êtes-vous sûr de vouloir supprimer ce compte ?</h3>
                                </div>
                            </div>

                            <div className="bg-yellow-50 rounded-lg p-4">
                                <div className="flex">
                                    <div className="flex-shrink-0 text-yellow-500">
                                        <ExclamationTriangleIcon className="h-5 w-5" />
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

                        <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                            <button
                                type="button"
                                onClick={confirmDelete}
                                className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-red-600 text-base font-medium text-white hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 sm:ml-3 sm:w-auto sm:text-sm"
                            >
                                Supprimer définitivement
                            </button>
                            <button
                                type="button"
                                onClick={() => setShowDeleteConfirmation(false)}
                                className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
                            >
                                Annuler
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Modal d'ajout d'informations */}
            {showAddForm && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-lg p-6 w-full max-w-md">
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="text-xl font-bold text-gray-800">Ajouter des informations</h3>
                            <button 
                                onClick={() => setShowAddForm(false)}
                                className="text-gray-500 hover:text-gray-700"
                            >
                                &times;
                            </button>
                        </div>
                        <form onSubmit={handleSubmit}>
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Nom complet <span className="text-red-500">*</span>
                                    </label>
                                    <input
                                        type="text"
                                        name="nom_complet"
                                        value={formData.nom_complet}
                                        onChange={handleInputChange}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Téléphone <span className="text-red-500">*</span>
                                    </label>
                                    <input
                                        type="text"
                                        name="telephone"
                                        value={formData.telephone}
                                        onChange={handleInputChange}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                        required
                                    />
                                </div>
                            </div>
                            <div className="mt-6 flex justify-end space-x-3">
                                <button
                                    type="button"
                                    onClick={() => setShowAddForm(false)}
                                    className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300 transition-colors"
                                >
                                    Annuler
                                </button>
                                <button
                                    type="submit"
                                    className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition-colors"
                                >
                                    Enregistrer
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default UserProfileView;
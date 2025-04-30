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
  FaCamera
} from "react-icons/fa";
import { GiMoneyStack } from "react-icons/gi";
import { useNavigate, Link } from "react-router-dom";

const ProfilDirecteur = () => {
    const { user, logout } = useUser();
    const [profile, setProfile] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [showAddForm, setShowAddForm] = useState(false);
    const [showDeleteConfirmation, setShowDeleteConfirmation] = useState(false);
    const [formData, setFormData] = useState({
        telephone: '',
        departement: '',
        specialite: ''
    });
    const navigate = useNavigate();

    useEffect(() => {
        const fetchProfile = async () => {
            if (!user?.id) {
                setError("Utilisateur non connecté");
                return;
            }
            try {
                const response = await axios.get(`http://127.0.0.1:8000/api/profildirecteur/${user.id}/`, {
                    withCredentials: true
                });
                setProfile(response.data);
                setLoading(false);
            } catch (err) {
                console.error("Erreur lors de la récupération du profil:", err);
                setError("Impossible de charger les informations du profil");
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

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const response = await axios.post(
                `http://127.0.0.1:8000/api/profildirecteur/`,
                {
                    user_id: user.id,
                    telephone: formData.telephone,
                    departement: formData.departement,
                    specialite: formData.specialite,
                },
                { withCredentials: true }
            );

            if (response.data.status === 'success') {
                const profileResponse = await axios.get(
                    `http://127.0.0.1:8000/api/profildirecteur/${user.id}/`,
                    { withCredentials: true }
                );
                setProfile({
                    ...profile,
                    telephone: profileResponse.data.telephone,
                    departement: profileResponse.data.departement,
                    specialite: profileResponse.data.specialite,
                });
                setShowAddForm(false);
                setError(null);
            }
        } catch (err) {
            console.error("Erreur lors de l'ajout des informations:", err);
            setError(err.response?.data?.error || "Erreur lors de l'ajout des informations");
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

                {/* Profile Card - Inversé */}
                <div className="bg-white rounded-xl shadow-md overflow-hidden">
                    <div className="md:flex flex-row-reverse"> {/* Changement ici */}
                        
                        {/* Partie bleue à droite */}
                        <div className="md:w-1/3 bg-gradient-to-b from-indigo-600 to-indigo-700 p-8 text-white">
                            <div className="flex flex-col items-center h-full">
                                {/* Photo de profil */}
                                <div className="relative mb-6 group">
                                    <div className="h-40 w-40 rounded-full border-4 border-white shadow-lg overflow-hidden bg-indigo-500 flex items-center justify-center">
                                        <FaUserCircle className="h-32 w-32 text-white opacity-90" />
                                    </div>
                                    <button className="absolute bottom-0 right-0 bg-white text-indigo-600 p-2 rounded-full hover:bg-gray-100 transition shadow-md">
                                        <FaCamera className="text-sm" />
                                    </button>
                                </div>
                                
                                <h2 className="text-2xl font-bold text-center">{profile.username}</h2>
                                <p className="mt-2 text-indigo-100 text-sm bg-indigo-500 px-3 py-1 rounded-full">
                                    Directeur Financier
                                </p>
                                
                                {/* Boutons d'action */}
                                <div className="mt-8 w-full space-y-4">
                                    <button
                                        onClick={() => setShowAddForm(true)}
                                        className="w-full flex items-center justify-center px-6 py-3 bg-white text-indigo-600 rounded-lg font-medium hover:bg-gray-50 transition shadow-sm"
                                    >
                                        <FaPlusCircle className="mr-2 text-indigo-600" />
                                        Ajouter des informations
                                    </button>
                                    
                                    <Link
                                        to="/dashboarddirecteur/modify_profil"
                                        className="w-full flex items-center justify-center px-6 py-3 bg-indigo-500 text-white rounded-lg font-medium hover:bg-indigo-600 transition shadow-sm"
                                    >
                                        <FaUserEdit className="mr-2 text-white" />
                                        Modifier le profil
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
                                    <div className="bg-gray-50 p-4 rounded-lg">
                                        <div className="flex items-center mb-2">
                                            <FaSignature className="text-purple-500 mr-3" />
                                            <h3 className="text-sm font-medium text-gray-500">Nom complet</h3>
                                        </div>
                                        <p className="text-lg font-semibold text-gray-900 pl-9">
                                            {profile.username || 'Non spécifié'}
                                        </p>
                                    </div>
                                    
                                    {/* Email */}
                                    <div className="bg-gray-50 p-4 rounded-lg">
                                        <div className="flex items-center mb-2">
                                            <FaEnvelope className="text-red-400 mr-3" />
                                            <h3 className="text-sm font-medium text-gray-500">Email</h3>
                                        </div>
                                        <p className="text-lg font-semibold text-gray-900 pl-9">
                                            {profile.email || 'Non spécifié'}
                                        </p>
                                    </div>
                                    
                                    {/* Téléphone */}
                                    <div className="bg-gray-50 p-4 rounded-lg">
                                        <div className="flex items-center mb-2">
                                            <FaPhone className="text-green-500 mr-3" />
                                            <h3 className="text-sm font-medium text-gray-500">Téléphone</h3>
                                        </div>
                                        <p className="text-lg font-semibold text-gray-900 pl-9">
                                            {profile.telephone || 'Non spécifié'}
                                        </p>
                                    </div>
                                    
                                    {/* Spécialité */}
                                    <div className="bg-gray-50 p-4 rounded-lg">
                                        <div className="flex items-center mb-2">
                                            <FaChartPie className="text-yellow-500 mr-3" />
                                            <h3 className="text-sm font-medium text-gray-500">Spécialité</h3>
                                        </div>
                                        <p className="text-lg font-semibold text-gray-900 pl-9">
                                            {profile.specialite || 'Non spécifié'}
                                        </p>
                                    </div>
                                    
                                    {/* Département */}
                                    <div className="bg-gray-50 p-4 rounded-lg">
                                        <div className="flex items-center mb-2">
                                            <FaBuilding className="text-blue-400 mr-3" />
                                            <h3 className="text-sm font-medium text-gray-500">Département</h3>
                                        </div>
                                        <p className="text-lg font-semibold text-gray-900 pl-9">
                                            {profile.departement || 'Non spécifié'}
                                        </p>
                                    </div>
                                    
                                    {/* Mot de passe */}
                                    <div className="bg-gray-50 p-4 rounded-lg">
                                        <div className="flex items-center mb-2">
                                            <FaKey className="text-orange-400 mr-3" />
                                            <h3 className="text-sm font-medium text-gray-500">Mot de passe</h3>
                                        </div>
                                        <p className="text-lg font-semibold text-gray-900 pl-9">
                                            ••••••••
                                        </p>
                                        <p className="text-xs text-gray-500 mt-1 flex items-center">
                                            <FaShieldAlt className="mr-1 text-indigo-400" />
                                            Pour des raisons de sécurité, le mot de passe n'est pas affiché
                                        </p>
                                    </div>
                                </div>
                            </div>

                            {/* Bouton Supprimer */}
                            <div className="flex justify-end">
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
                        {/* Header avec fond rouge */}
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

                        {/* Corps du message */}
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

                        {/* Boutons d'action */}
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
            
            {/* Add Info Modal */}
            {showAddForm && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-xl shadow-xl w-full max-w-md">
                        <div className="flex justify-between items-center border-b p-6">
                            <h3 className="text-xl font-bold text-gray-800">Compléter votre profil</h3>
                            <button 
                                onClick={() => setShowAddForm(false)}
                                className="text-gray-500 hover:text-gray-700"
                            >
                                <FaTimes />
                            </button>
                        </div>
                        
                        <form onSubmit={handleSubmit} className="p-6">
                            <div className="space-y-5">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">Téléphone</label>
                                    <input
                                        type="tel"
                                        name="telephone"
                                        value={formData.telephone}
                                        onChange={(e) => setFormData({...formData, telephone: e.target.value})}
                                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                                        required
                                    />
                                </div>
                                
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">Département</label>
                                    <select
                                        name="departement"
                                        value={formData.departement}
                                        onChange={(e) => setFormData({...formData, departement: e.target.value})}
                                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                                        required
                                    >
                                        <option value="">Sélectionnez un département</option>
                                        <option value="Finance">Finance</option>
                                        <option value="Comptabilité">Comptabilité</option>
                                        <option value="Direction">Direction</option>
                                        <option value="Ressources Humaines">Ressources Humaines</option>
                                    </select>
                                </div>
                                
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">Spécialité</label>
                                    <input
                                        type="text"
                                        name="specialite"
                                        value={formData.specialite}
                                        onChange={(e) => setFormData({...formData, specialite: e.target.value})}
                                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                                        required
                                    />
                                </div>
                            </div>
                            
                            {error && (
                                <div className="mt-4 p-3 bg-red-50 text-red-700 rounded-lg">
                                    {error}
                                </div>
                            )}
                            
                            <div className="mt-8 flex justify-end space-x-4">
                                <button
                                    type="button"
                                    onClick={() => setShowAddForm(false)}
                                    className="px-5 py-2.5 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition"
                                >
                                    Annuler
                                </button>
                                <button
                                    type="submit"
                                    className="px-5 py-2.5 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition flex items-center"
                                >
                                    <FaPlusCircle className="mr-2" />
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

export default ProfilDirecteur;
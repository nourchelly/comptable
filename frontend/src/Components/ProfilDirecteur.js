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

    const handleDeleteAccount = async () => {
        if (window.confirm("Êtes-vous sûr de vouloir supprimer votre compte ? Cette action est irréversible.")) {
            try {
                const response = await axios.delete(`http://127.0.0.1:8000/api/profildirecteur/${user.id}/`, {
                    withCredentials: true
                });
                
                if (response.data.status === 'success') {
                    alert("Votre compte a été supprimé avec succès");
                    logout();
                    navigate('/connexion');
                }
            } catch (err) {
                console.error("Erreur lors de la suppression du compte:", err);
                setError("Impossible de supprimer le compte");
            }
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
                            <div className="pt-6 border-t border-gray-200 flex justify-start">
                                <button
                                    onClick={handleDeleteAccount}
                                    className="flex items-center px-6 py-3 bg-red-100 text-red-600 rounded-lg font-medium hover:bg-red-200 transition"
                                >
                                    <FaTrashAlt className="mr-2 text-red-600" />
                                    Supprimer le compte
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
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
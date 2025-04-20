import axios from "axios";
import React, { useEffect, useState } from "react";
import { 
  FaUser, 
  FaUserEdit, 
  FaTrashAlt, 
  FaLock, 
  FaEnvelope,
  FaIdCard,
  FaUserCircle,
  FaCamera,
  FaSpinner,
  FaExclamationTriangle
} from "react-icons/fa";
import { useNavigate, Link } from "react-router-dom";

const Profil = () => {
    const [profil, setProfil] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const navigate = useNavigate();

    useEffect(() => {
        const fetchProfil = async () => {
            try {
                setLoading(true);
                const result = await axios.get("http://localhost:3000/auth/profil");
                
                if (result.data.Status) {
                    setProfil(result.data.Result);
                } else {
                    setError(result.data.Error || "Erreur lors du chargement du profil");
                }
            } catch (err) {
                setError("Erreur de connexion au serveur");
                console.error("Erreur API:", err);
            } finally {
                setLoading(false);
            }
        };

        fetchProfil();
    }, []);

    const handleDelete = async (id) => {
        if (window.confirm("Êtes-vous sûr de vouloir supprimer définitivement votre compte ?")) {
            try {
                const result = await axios.delete(`http://localhost:3000/auth/delete_profil/${id}`);
                
                if (result.data.Status) {
                    navigate('/connexion');
                } else {
                    alert(result.data.Error || "Erreur lors de la suppression");
                }
            } catch (err) {
                alert("Erreur lors de la suppression du compte");
                console.error("Erreur API:", err);
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
                    <h2 className="text-xl font-bold text-gray-800 mb-2">Erreur de chargement</h2>
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

    if (!profil) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <div className="max-w-md bg-white p-8 rounded-xl shadow-md text-center">
                    <FaUserCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <h2 className="text-xl font-bold text-gray-800 mb-2">Profil non trouvé</h2>
                    <p className="text-gray-600 mb-6">Aucune donnée de profil disponible</p>
                    <Link
                        to="/connexion"
                        className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition-colors"
                    >
                        Retour à la connexion
                    </Link>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
            <div className="max-w-4xl mx-auto">
                <div className="text-center mb-12">
                    <h1 className="text-3xl font-extrabold text-gray-900 flex items-center justify-center">
                        <FaUserCircle className="text-indigo-600 mr-3" />
                        Mon Profil
                    </h1>
                    <p className="mt-2 text-lg text-gray-600">
                        Données chargées depuis votre compte
                    </p>
                </div>

                <div className="bg-white shadow-xl rounded-2xl overflow-hidden">
                    <div className="md:flex">
                        {/* Section photo de profil */}
                        <div className="md:w-1/3 bg-gray-100 p-8 flex flex-col items-center">
                            <div className="relative mb-6 group">
                                <img 
                                    src={profil.photo || "/images/profil-default.jpg"} 
                                    alt="Profil" 
                                    className="w-40 h-40 rounded-full object-cover border-4 border-white shadow-lg"
                                    onError={(e) => {
                                        e.target.src = "/images/profil-default.jpg";
                                    }}
                                />
                                <button className="absolute bottom-2 right-2 bg-indigo-600 text-white p-3 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-300 shadow-md hover:bg-indigo-700">
                                    <FaCamera className="text-sm" />
                                </button>
                            </div>
                            <h3 className="text-xl font-bold text-gray-800">{profil.nom || 'Non spécifié'}</h3>
                            <p className="text-gray-500 text-sm">@{profil.nomUtilisateur || 'non défini'}</p>
                            
                            <div className="mt-6 w-full">
                                <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
                                    <h4 className="font-medium text-gray-700 text-sm mb-2">Statut du compte</h4>
                                    <div className="flex items-center">
                                        <span className="h-2 w-2 bg-green-500 rounded-full mr-2"></span>
                                        <span className="text-sm text-gray-600">Actif</span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Section informations */}
                        <div className="md:w-2/3 p-8">
                            <div className="mb-8">
                                <h2 className="text-xl font-bold text-gray-800 mb-6 flex items-center">
                                    <FaIdCard className="text-indigo-600 mr-2" />
                                    Informations du compte
                                </h2>
                                
                                <div className="space-y-5">
                                    {/* Champ Nom Complet */}
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-start">
                                        <label className="md:col-span-1 pt-2 text-sm font-medium text-gray-700 flex items-center">
                                            <FaUser className="text-indigo-500 mr-2" />
                                            Nom Complet
                                        </label>
                                        <div className="md:col-span-2">
                                            <div className="mt-1 relative rounded-md shadow-sm">
                                                <input
                                                    type="text"
                                                    className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg bg-gray-50 focus:ring-indigo-500 focus:border-indigo-500"
                                                    value={profil.nom || 'Non spécifié'}
                                                    readOnly
                                                />
                                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                                    <FaUser className="h-5 w-5 text-gray-400" />
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Champ Nom d'utilisateur */}
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-start">
                                        <label className="md:col-span-1 pt-2 text-sm font-medium text-gray-700 flex items-center">
                                            <FaUserEdit className="text-indigo-500 mr-2" />
                                            Nom d'utilisateur
                                        </label>
                                        <div className="md:col-span-2">
                                            <div className="mt-1 relative rounded-md shadow-sm">
                                                <input
                                                    type="text"
                                                    className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg bg-gray-50 focus:ring-indigo-500 focus:border-indigo-500"
                                                    value={profil.nomUtilisateur || 'non défini'}
                                                    readOnly
                                                />
                                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                                    <FaUserEdit className="h-5 w-5 text-gray-400" />
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Champ Email */}
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-start">
                                        <label className="md:col-span-1 pt-2 text-sm font-medium text-gray-700 flex items-center">
                                            <FaEnvelope className="text-indigo-500 mr-2" />
                                            Adresse Email
                                        </label>
                                        <div className="md:col-span-2">
                                            <div className="mt-1 relative rounded-md shadow-sm">
                                                <input
                                                    type="text"
                                                    className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg bg-gray-50 focus:ring-indigo-500 focus:border-indigo-500"
                                                    value={profil.email || 'non spécifié'}
                                                    readOnly
                                                />
                                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                                    <FaEnvelope className="h-5 w-5 text-gray-400" />
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Champ Mot de passe */}
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-start">
                                        <label className="md:col-span-1 pt-2 text-sm font-medium text-gray-700 flex items-center">
                                            <FaLock className="text-indigo-500 mr-2" />
                                            Mot de passe
                                        </label>
                                        <div className="md:col-span-2">
                                            <div className="mt-1 relative rounded-md shadow-sm">
                                                <input
                                                    type="password"
                                                    className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg bg-gray-50 focus:ring-indigo-500 focus:border-indigo-500"
                                                    value="••••••••"
                                                    readOnly
                                                />
                                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                                    <FaLock className="h-5 w-5 text-gray-400" />
                                                </div>
                                            </div>
                                            <p className="mt-2 text-xs text-gray-500">
                                                Pour des raisons de sécurité, le mot de passe n'est pas affiché
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Boutons d'action */}
                            <div className="flex flex-col sm:flex-row justify-end gap-4 pt-6 border-t border-gray-200">
                                <Link 
                                    to={`/dashboarddirecteur/modify_profil/${profil.id}`}
                                    className="inline-flex items-center justify-center px-6 py-3 border border-transparent text-base font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors duration-200"
                                >
                                    <FaUserEdit className="mr-2 -ml-1" />
                                    Modifier le Profil
                                </Link>
                                <button
                                    onClick={() => handleDelete(profil.id)}
                                    className="inline-flex items-center justify-center px-6 py-3 border border-gray-300 text-base font-medium rounded-md shadow-sm text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 transition-colors duration-200"
                                >
                                    <FaTrashAlt className="mr-2 -ml-1 text-red-600" />
                                    <span className="text-red-600">Supprimer le Compte</span>
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Profil;
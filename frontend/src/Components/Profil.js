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
  FaEye,
  FaEyeSlash
} from "react-icons/fa";
import { useNavigate, Link } from "react-router-dom";

const Profil = () => {
    const [profil, setProfil] = useState({
        id: 1,
        nom: "Charlene Reed",
        nomUtilisateur: "charlene_reed",
        email: "charlenereed@gmail.com",
        motDePasse: "••••••••"
    });
    const [showPassword, setShowPassword] = useState(false);
    const [hoverPhoto, setHoverPhoto] = useState(false);
    const navigate = useNavigate();

    useEffect(() => {
        axios.get("http://localhost:3000/auth/profil")
            .then((result) => {
                if (result.data.Status) {
                    setProfil(result.data.Result);
                } else {
                    alert(result.data.Error);
                }
            })
            .catch((err) => console.log(err));
    }, []);

    const handleDelete = (id) => {
        if (window.confirm("Êtes-vous sûr de vouloir supprimer définitivement votre compte ? Cette action est irréversible.")) {
            axios.delete(`http://localhost:3000/auth/delete_profil/${id}`)
                .then(result => {
                    if (result.data.Status) {
                        navigate('/login');
                    } else {
                        alert(result.data.Error);
                    }
                });
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
            <div className="max-w-6xl mx-auto">
                {/* En-tête amélioré */}
                <div className="text-center mb-12">
                    <h1 className="text-3xl font-bold text-gray-800 flex items-center justify-center">
                        <FaUserCircle className="text-blue-500 mr-3 text-4xl" />
                        <span>Mon Profil</span>
                    </h1>
                    <p className="text-gray-500 mt-2 text-lg">Gérez vos informations personnelles et paramètres de compte</p>
                </div>

                {/* Conteneur principal */}
                <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
                    <div className="grid grid-cols-1 lg:grid-cols-4 gap-0">
                        {/* Colonne photo avec effet interactif */}
                        <div className="lg:col-span-1 bg-gradient-to-b from-blue-50 to-blue-100 p-8 flex flex-col items-center justify-center border-r border-gray-200">
                            <div 
                                className="relative w-48 h-48 rounded-full overflow-hidden border-4 border-white shadow-lg group"
                                onMouseEnter={() => setHoverPhoto(true)}
                                onMouseLeave={() => setHoverPhoto(false)}
                            >
                                <img 
                                    src="/images/profil.jpg" 
                                    alt="Profil" 
                                    className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
                                />
                                <div className={`absolute inset-0 bg-black bg-opacity-30 flex items-center justify-center transition-opacity duration-300 ${hoverPhoto ? 'opacity-100' : 'opacity-0'}`}>
                                    <div className="text-center">
                                        <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-white text-blue-600 mb-2">
                                            <FaCamera className="text-xl" />
                                        </div>
                                        <p className="text-white font-medium">Changer la photo</p>
                                    </div>
                                </div>
                            </div>
                            
                            <h2 className="text-xl font-semibold text-gray-800 mt-6">{profil.nom}</h2>
                            <p className="text-blue-600">{profil.email}</p>
                            
                            {/* Stats ou badges */}
                            <div className="mt-6 grid grid-cols-2 gap-4 w-full">
                                <div className="bg-white p-3 rounded-lg shadow-xs text-center">
                                    <p className="text-sm text-gray-500">Membre depuis</p>
                                    <p className="font-semibold">2022</p>
                                </div>
                                <div className="bg-white p-3 rounded-lg shadow-xs text-center">
                                    <p className="text-sm text-gray-500">Rôle</p>
                                    <p className="font-semibold">Utilisateur</p>
                                </div>
                            </div>
                        </div>

                        {/* Colonne informations */}
                        <div className="lg:col-span-3 p-8">
                            <div className="space-y-8">
                                {/* Section Informations Personnelles */}
                                <div className="border-b border-gray-200 pb-6">
                                    <div className="flex items-center justify-between mb-6">
                                        <h2 className="text-xl font-semibold text-gray-800 flex items-center">
                                            <FaIdCard className="text-blue-500 mr-3" />
                                            Informations Personnelles
                                        </h2>
                                        <Link 
                                            to={`/dashboard/modify_profil/${profil.id}`}
                                            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all"
                                        >
                                            <FaUserEdit className="mr-2" />
                                            Modifier
                                        </Link>
                                    </div>
                                    
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        {/* Champ Nom Complet */}
                                        <div>
                                            <label className="block text-sm font-medium text-gray-600 mb-2 flex items-center">
                                                <FaUser className="text-blue-400 mr-2" />
                                                Nom Complet
                                            </label>
                                            <div className="mt-1 relative rounded-md shadow-sm">
                                                <input
                                                    type="text"
                                                    className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg bg-gray-50 focus:ring-blue-500 focus:border-blue-500"
                                                    value={profil.nom}
                                                    readOnly
                                                />
                                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                                    <FaUser className="h-5 w-5 text-gray-400" />
                                                </div>
                                            </div>
                                        </div>

                                        {/* Champ Nom d'utilisateur */}
                                        <div>
                                            <label className="block text-sm font-medium text-gray-600 mb-2 flex items-center">
                                                <FaUserEdit className="text-purple-400 mr-2" />
                                                Nom d'utilisateur
                                            </label>
                                            <div className="mt-1 relative rounded-md shadow-sm">
                                                <input
                                                    type="text"
                                                    className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg bg-gray-50 focus:ring-blue-500 focus:border-blue-500"
                                                    value={profil.nomUtilisateur}
                                                    readOnly
                                                />
                                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                                    <FaUserEdit className="h-5 w-5 text-gray-400" />
                                                </div>
                                            </div>
                                        </div>

                                        {/* Champ Email */}
                                        <div>
                                            <label className="block text-sm font-medium text-gray-600 mb-2 flex items-center">
                                                <FaEnvelope className="text-red-400 mr-2" />
                                                Adresse Email
                                            </label>
                                            <div className="mt-1 relative rounded-md shadow-sm">
                                                <input
                                                    type="text"
                                                    className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg bg-gray-50 focus:ring-blue-500 focus:border-blue-500"
                                                    value={profil.email}
                                                    readOnly
                                                />
                                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                                    <FaEnvelope className="h-5 w-5 text-gray-400" />
                                                </div>
                                            </div>
                                        </div>

                                        {/* Champ Mot de passe */}
                                        <div>
                                            <label className="block text-sm font-medium text-gray-600 mb-2 flex items-center">
                                                <FaLock className="text-green-400 mr-2" />
                                                Mot de passe
                                            </label>
                                            <div className="mt-1 relative rounded-md shadow-sm">
                                                <input
                                                    type={showPassword ? "text" : "password"}
                                                    className="block w-full pl-10 pr-10 py-3 border border-gray-300 rounded-lg bg-gray-50 focus:ring-blue-500 focus:border-blue-500"
                                                    value={profil.motDePasse}
                                                    readOnly
                                                />
                                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                                    <FaLock className="h-5 w-5 text-gray-400" />
                                                </div>
                                                <button
                                                    type="button"
                                                    className="absolute inset-y-0 right-0 pr-3 flex items-center"
                                                    onClick={() => setShowPassword(!showPassword)}
                                                >
                                                    {showPassword ? (
                                                        <FaEyeSlash className="text-gray-400 hover:text-gray-500" />
                                                    ) : (
                                                        <FaEye className="text-gray-400 hover:text-gray-500" />
                                                    )}
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Section Actions */}
                                <div>
                                    <h2 className="text-xl font-semibold text-gray-800 mb-6">Actions du compte</h2>
                                    <div className="flex flex-col sm:flex-row gap-4">
                                        <Link 
                                            to={`/dashboard/modify_profil/${profil.id}`}
                                            className="inline-flex items-center justify-center px-6 py-3 border border-transparent text-base font-medium rounded-lg shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all flex-1 text-center"
                                        >
                                            <FaUserEdit className="mr-2" />
                                            Modifier le profil
                                        </Link>
                                        <button
                                            onClick={() => handleDelete(profil.id)}
                                            className="inline-flex items-center justify-center px-6 py-3 border border-gray-300 text-base font-medium rounded-lg shadow-sm text-gray-700 bg-white hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 transition-all flex-1"
                                        >
                                            <FaTrashAlt className="mr-2 text-red-600" />
                                            <span className="text-red-600">Supprimer le compte</span>
                                        </button>
                                    </div>
                                    <p className="text-sm text-gray-500 mt-4">
                                        <FaLock className="inline mr-1" />
                                        Vos données sont sécurisées et ne seront jamais partagées avec des tiers.
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Profil;
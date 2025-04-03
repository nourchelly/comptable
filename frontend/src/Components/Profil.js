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
        if (window.confirm("Êtes-vous sûr de vouloir supprimer définitivement votre compte ?")) {
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
      
            <div className="max-w-5xl mx-auto">
              
                    {/* En-tête amélioré */}
                    <div className="flex flex-col items-center mb-10">
                       
                    
                        <h1 className="text-2xl font-bold text-gray-800 flex items-center">
                            <FaUserCircle className="text-blue-500 mr-2" />
                            Mon Profil
                        </h1>
                        <p className="text-gray-500 mt-1">Gérez vos informations personnelles</p>
                    </div>

                    {/* Grille responsive améliorée */}
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
                        {/* Colonne photo */}
                        <div className="lg:col-span-1 flex justify-center">
                            <div className="relative w-full max-w-xs">
                                <img 
                                    src="/images/profil.jpg" 
                                    alt="Profil" 
                                    className="w-full h-auto rounded-xl object-cover shadow-md border border-gray-200"
                                />
                              
                            </div>
                        </div>

                        {/* Colonne informations */}
                        <div className="lg:col-span-2 space-y-6">
                            {/* Carte d'information */}
                            <div className="bg-gray-50 p-6 rounded-xl border border-gray-200">
                                <h2 className="text-lg font-semibold text-gray-700 mb-4 flex items-center">
                                    <FaIdCard className="text-blue-500 mr-2" />
                                    Informations Personnelles
                                </h2>
                                
                                <div className="space-y-5">
                                    {/* Champ Nom Complet */}
                                    <div>
                                        <label className="block text-sm font-medium text-gray-600 mb-1 flex items-center">
                                            <FaUser className="text-blue-400 mr-2 text-sm" />
                                            Nom Complet
                                        </label>
                                        <div className="mt-1 relative rounded-md shadow-sm">
                                            <input
                                                type="text"
                                                className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md bg-white focus:ring-blue-500 focus:border-blue-500"
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
                                        <label className="block text-sm font-medium text-gray-600 mb-1 flex items-center">
                                            <FaUserEdit className="text-purple-400 mr-2 text-sm" />
                                            Nom d'utilisateur
                                        </label>
                                        <div className="mt-1 relative rounded-md shadow-sm">
                                            <input
                                                type="text"
                                                className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md bg-white focus:ring-blue-500 focus:border-blue-500"
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
                                        <label className="block text-sm font-medium text-gray-600 mb-1 flex items-center">
                                            <FaEnvelope className="text-red-400 mr-2 text-sm" />
                                            Adresse Email
                                        </label>
                                        <div className="mt-1 relative rounded-md shadow-sm">
                                            <input
                                                type="text"
                                                className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md bg-white focus:ring-blue-500 focus:border-blue-500"
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
                                        <label className="block text-sm font-medium text-gray-600 mb-1 flex items-center">
                                            <FaLock className="text-green-400 mr-2 text-sm" />
                                            Mot de passe
                                        </label>
                                        <div className="mt-1 relative rounded-md shadow-sm">
                                            <input
                                                type="password"
                                                className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md bg-white focus:ring-blue-500 focus:border-blue-500"
                                                value={profil.motDePasse}
                                                readOnly
                                            />
                                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                                <FaLock className="h-5 w-5 text-gray-400" />
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Boutons d'action */}
                            <div className="flex flex-col sm:flex-row justify-end gap-3 pt-4">
                                <Link 
                                    to={`/dashboard/modify_profil/${profil.id}`}
                                    className="inline-flex items-center justify-center px-5 py-2.5 border border-transparent text-sm font-medium rounded-lg shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all duration-200"
                                >
                                    <FaUserEdit className="mr-2 -ml-1" />
                                    Modifier le Profil
                                </Link>
                                <button
                                    onClick={() => handleDelete(profil.id)}
                                    className="inline-flex items-center justify-center px-5 py-2.5 border border-gray-300 text-sm font-medium rounded-lg shadow-sm text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 transition-all duration-200"
                                >
                                    <FaTrashAlt className="mr-2 -ml-1 text-red-600" />
                                    <span className="text-red-600">Supprimer le Compte</span>
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
       
        
    );
};

export default Profil;
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useUser } from './UserContext';
import { useNavigate, Link } from 'react-router-dom';
import { motion } from "framer-motion";
import { 
  FaSave, 
  FaTimes,
  FaUser,
  FaEnvelope,
  FaIdCard,
  FaPhone,
  FaUserEdit,
  FaUserCircle,
  FaCheckCircle
} from "react-icons/fa";

const EditProfile = () => {
    const { user } = useUser();
    const [formData, setFormData] = useState({
        username: '',
        email: '',
        nom_complet: "",
        telephone: ""
    });
    const [error, setError] = useState(null);
    const [success, setSuccess] = useState(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const navigate = useNavigate();

    useEffect(() => {
        const fetchProfile = async () => {
            if (!user?.id) {
                setError("Utilisateur non connecté");
                return;
            }
            
            try {
                const response = await axios.get(`http://127.0.0.1:8000/api/profiladmin/${user.id}/`, {
                    withCredentials: true
                });
                
                setFormData({
                    username: response.data.username,
                    email: response.data.email,
                    nom_complet: response.data.nom_complet,
                    telephone: response.data.telephone,
                });
            } catch (err) {
                console.error("Erreur lors de la récupération du profil:", err);
                setError("Impossible de charger les informations du profil");
            }
        };

        fetchProfile();
    }, [user]);

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData({
            ...formData,
            [name]: value
        });
    };
 
    const handleSubmit = async (e) => {
        e.preventDefault();
        setError(null);
        setSuccess(null);
        setIsSubmitting(true);
        
        try {
            const response = await axios.put(`http://127.0.0.1:8000/api/profiladmin/${user.id}/`, formData, {
                withCredentials: true,
                headers: {
                    'Content-Type': 'application/json'
                }
            });
            
            if (response.data.status === 'success') {
                setSuccess("Profil mis à jour avec succès");
                setTimeout(() => {
                    navigate('/dashboard/profile');
                }, 1500);
            }
        } catch (err) {
            console.error("Erreur lors de la mise à jour du profil:", err);
            setError(err.response?.data?.message || "Impossible de mettre à jour le profil");
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-12 px-4 sm:px-6 lg:px-8">
            <div className="max-w-6xl mx-auto">
                <motion.div 
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5 }}
                    className="bg-white rounded-2xl shadow-xl overflow-hidden"
                >
                    <div className="flex flex-col md:flex-row">
                        {/* Colonne de gauche avec l'illustration */}
                        <div className="md:w-1/3 bg-gradient-to-b from-indigo-500 to-blue-600 p-8 flex flex-col items-center justify-center">
                            <div className="w-64 h-64 mb-6">
                                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 512" fill="currentColor" className="text-white">
                                    <path d="M224 256A128 128 0 1 0 224 0a128 128 0 1 0 0 256zm-45.7 48C79.8 304 0 383.8 0 482.3C0 498.7 13.3 512 29.7 512H418.3c16.4 0 29.7-13.3 29.7-29.7C448 383.8 368.2 304 269.7 304H178.3zM528 240c17.7 0 32 14.3 32 32v48H496V272c0-17.7 14.3-32 32-32zm-80 32v48c-17.7 0-32 14.3-32 32V480c0 17.7 14.3 32 32 32H608c17.7 0 32-14.3 32-32V352c0-17.7-14.3-32-32-32V272c0-44.2-35.8-80-80-80s-80 35.8-80 80z"/>
                                </svg>
                            </div>
                            <h2 className="text-2xl font-bold text-white mb-2">Mise à jour du profil</h2>
                            <p className="text-blue-100 text-lg">
                                Vos informations personnelles sont sécurisées avec nous
                            </p>
                            <div className="mt-6 flex space-x-2">
                                <FaCheckCircle className="text-green-300 text-xl" />
                                <FaCheckCircle className="text-green-300 text-xl" />
                                <FaCheckCircle className="text-green-300 text-xl" />
                            </div>
                        </div>
                        
                        {/* Colonne de droite avec le formulaire */}
                        <div className="md:w-2/3 p-10">
                            <div className="flex items-center mb-8">
                                <div className="p-3 bg-indigo-100 rounded-full mr-4">
                                    <FaUserEdit className="text-indigo-600 text-2xl" />
                                </div>
                                <div>
                                    <h1 className="text-3xl font-bold text-gray-800">Modifier votre profil</h1>
                                    <p className="text-gray-500">Remplissez les champs ci-dessous</p>
                                </div>
                            </div>
                            
                            {error && (
                                <motion.div 
                                    initial={{ opacity: 0, y: -10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    className="mb-6 p-4 bg-red-50 border-l-4 border-red-400 rounded-lg flex items-start"
                                >
                                    <FaTimes className="text-red-500 mt-1 mr-3 flex-shrink-0" />
                                    <p className="text-red-700">{error}</p>
                                </motion.div>
                            )}
                            
                            {success && (
                                <motion.div 
                                    initial={{ opacity: 0, y: -10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    className="mb-6 p-4 bg-green-50 border-l-4 border-green-400 rounded-lg flex items-start"
                                >
                                    <FaCheckCircle className="text-green-500 mt-1 mr-3 flex-shrink-0" />
                                    <p className="text-green-700">{success}</p>
                                </motion.div>
                            )}
                            
                            <form onSubmit={handleSubmit} className="space-y-6">
                                <div className="space-y-5">
                                    {/* Champ Username */}
                                    <div className="relative group">
                                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                            <FaUser className="text-indigo-400 group-focus-within:text-indigo-600 transition-colors" />
                                        </div>
                                        <input
                                            type="text"
                                            className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg bg-gray-50 focus:ring-2 focus:ring-indigo-300 focus:border-indigo-400 transition-all"
                                            placeholder="Nom d'utilisateur"
                                            name="username"
                                            value={formData.username}
                                            onChange={handleInputChange}
                                            required
                                        />
                                    </div>
                                    
                                    {/* Champ Email */}
                                    <div className="relative group">
                                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                            <FaEnvelope className="text-blue-400 group-focus-within:text-blue-600 transition-colors" />
                                        </div>
                                        <input
                                            type="email"
                                            className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg bg-gray-50 focus:ring-2 focus:ring-blue-300 focus:border-blue-400 transition-all"
                                            placeholder="Adresse email"
                                            name="email"
                                            value={formData.email}
                                            onChange={handleInputChange}
                                            required
                                        />
                                    </div>
                                    
                                    {/* Champ Nom Complet */}
                                    <div className="relative group">
                                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                            <FaIdCard className="text-purple-400 group-focus-within:text-purple-600 transition-colors" />
                                        </div>
                                        <input
                                            type="text"
                                            className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg bg-gray-50 focus:ring-2 focus:ring-purple-300 focus:border-purple-400 transition-all"
                                            placeholder="Nom complet"
                                            name="nom_complet"
                                            value={formData.nom_complet}
                                            onChange={handleInputChange}
                                            required
                                        />
                                    </div>
                                    
                                    {/* Champ Téléphone */}
                                    <div className="relative group">
                                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                            <FaPhone className="text-green-400 group-focus-within:text-green-600 transition-colors" />
                                        </div>
                                        <input
                                            type="tel"
                                            className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg bg-gray-50 focus:ring-2 focus:ring-green-300 focus:border-green-400 transition-all"
                                            placeholder="Numéro de téléphone"
                                            name="telephone"
                                            value={formData.telephone}
                                            onChange={handleInputChange}
                                            required
                                        />
                                    </div>
                                </div>
                                
                                {/* Boutons */}
                                <div className="flex flex-col sm:flex-row justify-end space-y-4 sm:space-y-0 sm:space-x-4 pt-8 border-t border-gray-200">
                                    <motion.div 
                                        whileHover={{ scale: 1.03 }} 
                                        whileTap={{ scale: 0.98 }}
                                        transition={{ duration: 0.1 }}
                                    >
                                        <Link
                                            to="/dashboard/profile"
                                            className="flex items-center justify-center px-6 py-3 bg-white text-gray-600 rounded-lg font-medium border border-gray-300 hover:bg-gray-50 transition duration-300 shadow-sm"
                                        >
                                            <FaTimes className="mr-2 text-red-500" /> Annuler
                                        </Link>
                                    </motion.div>
                                    <motion.div 
                                        whileHover={{ scale: 1.03 }} 
                                        whileTap={{ scale: 0.98 }}
                                        transition={{ duration: 0.1 }}
                                    >
                                        <button
                                            type="submit"
                                            disabled={isSubmitting}
                                            className={`flex items-center justify-center px-6 py-3 bg-gradient-to-r from-indigo-600 to-blue-600 text-white rounded-lg font-medium hover:from-indigo-700 hover:to-blue-700 transition duration-300 shadow-md hover:shadow-lg ${isSubmitting ? 'opacity-80 cursor-not-allowed' : ''}`}
                                        >
                                            {isSubmitting ? (
                                                <>
                                                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                                    </svg>
                                                    Enregistrement...
                                                </>
                                            ) : (
                                                <>
                                                    <FaSave className="mr-2" /> Enregistrer les modifications
                                                </>
                                            )}
                                        </button>
                                    </motion.div>
                                </div>
                            </form>
                        </div>
                    </div>
                </motion.div>
            </div>
        </div>
    );
};

export default EditProfile;
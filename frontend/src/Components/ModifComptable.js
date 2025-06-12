import React, { useState, useEffect } from "react";
import axios from "axios";
import { useNavigate, useParams, Link } from "react-router-dom";
import { useUser } from './UserContext';
import { 
  FaSave, 
  FaTimes, 
  FaUser, 
  FaEnvelope, 
  FaPhoneAlt, 
  FaUserEdit,
  FaBuilding
} from "react-icons/fa";
import { motion } from "framer-motion";

const ModifierProfilComptable = () => {
  const { user } = useUser();
  const [formData, setFormData] = useState({
    username: "",
    email: "",
    nom_complet: "",
    telephone: "",
    departement: ""
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const navigate = useNavigate();
  const { id } = useParams();

  useEffect(() => {
    const fetchProfile = async () => {
      if (!user?.id) {
        setError("Utilisateur non connecté");
        return;
      }
      
      try {
        const response = await axios.get(`http://127.0.0.1:8000/api/profilcomptable/${user.id}/`, {
          withCredentials: true
        });
        
        setFormData({
          username: response.data.username,
          email: response.data.email,
          nom_complet: response.data.nom_complet,
          telephone: response.data.telephone,
          departement: response.data.departement
        });
        setLoading(false);
      } catch (error) {
        console.error("Erreur chargement profil:", error);
        setError("Impossible de charger les informations du profil");
        setLoading(false);
      }
    };

    fetchProfile();
  }, [user]);

  const handleChange = (e) => {
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
    try {
      const response = await axios.put(`http://127.0.0.1:8000/api/profilcomptable/${user.id}/`, formData, {
        withCredentials: true,
        headers: {
          'Content-Type': 'application/json'
        }
      });
      if (response.data.status === 'success') {
        setSuccess("Profil mis à jour avec succès");
        setTimeout(() => {
          navigate('/dashboardcomptable/profilcomptable');
        }, 1500);
      }
    } catch (err) {
      console.error("Erreur lors de la mise à jour du profil:", err);
      setError("Impossible de mettre à jour le profil");
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
          className="h-12 w-12 border-t-4 border-b-4 border-indigo-600 rounded-full"
        />
      </div>
    );
  }

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="max-w-6xl mx-auto p-4"
    >
      <div className="bg-white rounded-xl shadow-xl overflow-hidden">
        <div className="md:flex">
          {/* Colonne de gauche - Formulaire */}
          <div className="md:w-2/3 p-8">
            <div className="flex items-center mb-8">
              <div className="bg-indigo-100 p-3 rounded-full mr-4">
                <FaUserEdit className="text-indigo-600 text-2xl" />
              </div>
              <h1 className="text-3xl font-bold text-gray-800">Modifier le Profil</h1>
            </div>

            <form id="profilForm" onSubmit={handleSubmit} className="space-y-6">
              <motion.div 
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.1 }}
                className="grid grid-cols-1 md:grid-cols-2 gap-6"
              >
                {/* Username */}
                <motion.div 
                  whileHover={{ scale: 1.02 }}
                  className="space-y-2"
                >
                  <label className="flex items-center text-sm font-medium text-gray-700">
                    <FaUser className="mr-2 text-indigo-500" />
                    Identifiant
                  </label>
                  <input
                    type="text"
                    name="username"
                    value={formData.username}
                    onChange={handleChange}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition duration-200"
                    placeholder="Votre identifiant"
                    required
                  />
                </motion.div>

                {/* Nom complet */}
                <motion.div 
                  whileHover={{ scale: 1.02 }}
                  className="space-y-2"
                >
                  <label className="flex items-center text-sm font-medium text-gray-700">
                    <FaUser className="mr-2 text-indigo-500" />
                    Nom complet
                  </label>
                  <input
                    type="text"
                    name="nom_complet"
                    value={formData.nom_complet}
                    onChange={handleChange}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition duration-200"
                    placeholder="Votre nom complet"
                    required
                  />
                </motion.div>

                {/* Email */}
                <motion.div 
                  whileHover={{ scale: 1.02 }}
                  className="md:col-span-2 space-y-2"
                >
                  <label className="flex items-center text-sm font-medium text-gray-700">
                    <FaEnvelope className="mr-2 text-blue-500" />
                    Email
                  </label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition duration-200"
                    placeholder="exemple@domaine.com"
                    required
                  />
                </motion.div>

                {/* Téléphone */}
                <motion.div 
                  whileHover={{ scale: 1.02 }}
                  className="space-y-2"
                >
                  <label className="flex items-center text-sm font-medium text-gray-700">
                    <FaPhoneAlt className="mr-2 text-green-500" />
                    Téléphone
                  </label>
                  <input
                    type="tel"
                    name="telephone"
                    value={formData.telephone}
                    onChange={handleChange}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 transition duration-200"
                    placeholder="+212 6 00 00 00 00"
                  />
                </motion.div>
                
                {/* Département */}
                <motion.div 
                  whileHover={{ scale: 1.02 }}
                  className="space-y-2"
                >
                  <label className="flex items-center text-sm font-medium text-gray-700">
                    <FaBuilding className="mr-2 text-orange-500" />
                    Département
                  </label>
                  <input
                    type="text"
                    name="departement"
                    value={formData.departement}
                    onChange={handleChange}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition duration-200"
                    placeholder="Votre département"
                  />
                </motion.div>
              </motion.div>

              <div className="flex justify-end space-x-4 pt-6 border-t border-gray-200">
                <motion.div whileHover={{ scale: 1.05 }}>
                  <Link 
                    to="/dashboardcomptable/profilcomptable"
                    className="flex items-center px-6 py-3 bg-gray-100 text-gray-700 rounded-lg font-medium hover:bg-gray-200 transition duration-300"
                  >
                    <FaTimes className="mr-2" /> Annuler
                  </Link>
                </motion.div>
                <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                  <button 
                    type="submit"
                    className="flex items-center px-6 py-3 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700 transition duration-300 shadow-md hover:shadow-lg"
                  >
                    <FaSave className="mr-2" /> Enregistrer les modifications
                  </button>
                </motion.div>
              </div>
            </form>
          </div>

          {/* Colonne de droite - Image */}
          <div className="md:w-1/3 bg-indigo-600 p-8 flex flex-col items-center justify-center">
            <motion.img 
              src="/images/nou.jpg" 
              alt="Modification profil comptable"
              initial={{ scale: 0.9 }}
              animate={{ scale: 1 }}
              transition={{ duration: 0.5 }}
              className="w-64 h-64 rounded-full object-cover border-4 border-white shadow-lg mb-6"
            />
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3 }}
              className="text-center"
            >
              <h3 className="text-xl font-semibold text-white mb-2">Mettez à jour vos informations</h3>
              <p className="text-indigo-100">Assurez-vous que toutes vos informations sont à jour pour une meilleure expérience.</p>
            </motion.div>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default ModifierProfilComptable;
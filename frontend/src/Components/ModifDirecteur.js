import React, { useState, useEffect } from "react";
import axios from "axios";
import { useNavigate, useParams, Link } from "react-router-dom";
import { 
  FaSave, 
  FaTimes, 
  FaUser, 
  FaEnvelope, 
  FaPhoneAlt, 
  FaGraduationCap,
  FaUserEdit
} from "react-icons/fa";
import { motion } from "framer-motion"; // Importez motion depuis framer-motion

const ModifierProfilDirecteur = () => {
  const [formData, setFormData] = useState({
    nom: "",
    prenom: "",
    email: "",
    telephone: "",
    specialite: "Comptabilité générale"
  });
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const { id } = useParams();

  useEffect(() => {
    const chargerProfil = async () => {
      try {
        const token = localStorage.getItem('valid');
        const response = await axios.get(`http://127.0.0.1:8000/api/directeur/${id}/`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setFormData(response.data);
      } catch (error) {
        console.error("Erreur chargement profil:", error);
        if (error.response?.status === 401) {
          navigate("/login");
        }
      } finally {
        setLoading(false);
      }
    };

    chargerProfil();
  }, [id, navigate]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('valid');
      await axios.put(`http://127.0.0.1:8000/api/directeur/${id}/`, formData, {
        headers: { Authorization: `Bearer ${token}` }
      });
      alert("Profil mis à jour avec succès");
      navigate("/dashboarddirecteur/profildirecteur");
    } catch (error) {
      console.error("Erreur mise à jour:", error);
      alert("Erreur lors de la mise à jour du profil");
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
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-8 px-4 sm:px-6 lg:px-8">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="max-w-6xl mx-auto"
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
                  {/* Nom */}
                  <motion.div 
                    whileHover={{ scale: 1.02 }}
                    className="space-y-2"
                  >
                    <label className="flex items-center text-sm font-medium text-gray-700">
                      <FaUser className="mr-2 text-indigo-500" />
                      Nom
                    </label>
                    <input
                      type="text"
                      name="nom"
                      value={formData.nom}
                      onChange={handleChange}
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition duration-200"
                      placeholder="Entrez votre nom"
                      required
                    />
                  </motion.div>

                  {/* Prénom */}
                  <motion.div 
                    whileHover={{ scale: 1.02 }}
                    className="space-y-2"
                  >
                    <label className="flex items-center text-sm font-medium text-gray-700">
                      <FaUser className="mr-2 text-indigo-500" />
                      Prénom
                    </label>
                    <input
                      type="text"
                      name="prenom"
                      value={formData.prenom}
                      onChange={handleChange}
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition duration-200"
                      placeholder="Entrez votre prénom"
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

                  {/* Spécialité */}
                  <motion.div 
                    whileHover={{ scale: 1.02 }}
                    className="space-y-2"
                  >
                    <label className="flex items-center text-sm font-medium text-gray-700">
                      <FaGraduationCap className="mr-2 text-purple-500" />
                      Spécialité
                    </label>
                    <select
                      name="specialite"
                      value={formData.specialite}
                      onChange={handleChange}
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition duration-200 appearance-none bg-white"
                    >
                      <option value="Comptabilité générale">Comptabilité générale</option>
                      <option value="Comptabilité analytique">Comptabilité analytique</option>
                      <option value="Gestion fiscale">Gestion fiscale</option>
                      <option value="Audit comptable">Audit comptable</option>
                    </select>
                  </motion.div>
                </motion.div>

                <div className="flex justify-end space-x-4 pt-6 border-t border-gray-200">
                  <motion.div whileHover={{ scale: 1.05 }}>
                    <Link 
                      to="/dashboarddirecteur/profildirecteur"
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
                src="/images/profil.jpg" 
                alt="Modification profil comptable"
                initial={{ scale: 0.9 }}
                animate={{ scale: 1 }}
                transition={{ duration: 0.5 }}
                className="w-full max-w-xs rounded-lg shadow-2xl mb-6"
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
    </div>
  );
};

export default ModifierProfilDirecteur;
import axios from 'axios';
import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { 
  FaUserEdit, 
  FaEyeSlash, 
  FaEye, 
  FaSave, 
  FaCheckCircle, 
  FaTimes, 
  FaUser, 
  FaAt, 
  FaKey, 
  FaIdBadge, 
  FaLock,
  FaShieldAlt,
  FaInfoCircle,
  FaCamera
} from 'react-icons/fa';
import { motion } from 'framer-motion';

const EditProfil = () => {
  const { id } = useParams();
  const [profil, setProfil] = useState({
    nom: '',
    nomUtilisateur: '',
    email: '',
    motDePasse: ''
  });
  const [initialProfil, setInitialProfil] = useState({});
  const [isLoading, setIsLoading] = useState(true);
  const [errors, setErrors] = useState({});
  const [showPassword, setShowPassword] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');

  const navigate = useNavigate();

  useEffect(() => {
    const fetchProfil = async () => {
      try {
        const response = await axios.get(`http://localhost:3000/auth/profil/${id}`);
        const profilData = response.data.Result[0];
        setProfil(profilData);
        setInitialProfil(profilData);
      } catch (err) {
        console.error("Erreur lors du chargement du profil:", err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchProfil();
  }, [id]);

  const validateForm = () => {
    const newErrors = {};
    
    if (!profil.nomUtilisateur.trim()) {
      newErrors.nomUtilisateur = 'Le nom d\'utilisateur est requis';
    }
    
    if (!profil.email.trim()) {
      newErrors.email = 'L\'email est requis';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(profil.email)) {
      newErrors.email = 'Email invalide';
    }
    
    if (profil.motDePasse && profil.motDePasse.length < 8) {
      newErrors.motDePasse = 'Le mot de passe doit contenir au moins 8 caractères';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }
    
    try {
      const response = await axios.put(`http://localhost:3000/auth/modify_profil/${id}`, profil);
      if (response.data.Status) {
        setSuccessMessage('Profil mis à jour avec succès!');
        setTimeout(() => {
          navigate('/dashboard/profil');
        }, 1500);
      } else {
        alert(response.data.Error);
      }
    } catch (err) {
      console.error("Erreur lors de la mise à jour:", err);
      alert('Une erreur est survenue lors de la mise à jour du profil');
    }
  };

  const handleCancel = () => {
    setProfil(initialProfil);
    navigate('/dashboard/profil');
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-screen bg-gray-50">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
          className="h-12 w-12 border-t-4 border-b-4 border-blue-600 rounded-full"
        />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 py-12 px-4 sm:px-6 lg:px-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="max-w-6xl mx-auto"
      >
        <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
          <div className="md:flex">
            {/* Formulaire */}
            <div className="w-full md:w-2/3 p-10">
              <div className="flex items-center mb-10">
                <div className="p-3 rounded-xl bg-gradient-to-r from-blue-500 to-indigo-600 text-white shadow-lg mr-6">
                  <FaUserEdit className="text-2xl" />
                </div>
                <div>
                  <h2 className="text-3xl font-bold text-gray-800">Modifier le Profil</h2>
                  <p className="text-gray-500 mt-1">Mettez à jour vos informations personnelles</p>
                </div>
              </div>
              
              {successMessage && (
                <motion.div
                  initial={{ opacity: 0, y: -20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mb-6 p-4 bg-green-50 text-green-700 rounded-lg border border-green-200 flex items-center"
                >
                  <FaCheckCircle className="text-green-500 mr-3 text-xl" />
                  <span>{successMessage}</span>
                </motion.div>
              )}
              
              <form onSubmit={handleSubmit} className="space-y-8">
                {/* Nom d'utilisateur */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-3 flex items-center">
                    <FaIdBadge className="text-blue-500 mr-2" />
                    <span>Nom d'utilisateur</span>
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <FaUser className={`${errors.nomUtilisateur ? 'text-red-400' : 'text-gray-400'}`} />
                    </div>
                    <input
                      type="text"
                      className={`block w-full pl-10 pr-3 py-3 border ${
                        errors.nomUtilisateur 
                          ? 'border-red-300 focus:ring-red-500 focus:border-red-500' 
                          : 'border-gray-300 focus:ring-blue-500 focus:border-blue-500'
                      } rounded-lg shadow-sm focus:ring-2 focus:outline-none transition duration-200`}
                      placeholder="Entrez votre nom d'utilisateur"
                      value={profil.nomUtilisateur}
                      onChange={(e) => setProfil({ ...profil, nomUtilisateur: e.target.value })}
                      required
                    />
                  </div>
                  {errors.nomUtilisateur && (
                    <p className="mt-2 text-sm text-red-600 flex items-center">
                      <FaInfoCircle className="mr-1" /> {errors.nomUtilisateur}
                    </p>
                  )}
                </div>
                
                {/* Email */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-3 flex items-center">
                    <FaAt className="text-blue-500 mr-2" />
                    <span>Email professionnel</span>
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <FaAt className={`${errors.email ? 'text-red-400' : 'text-gray-400'}`} />
                    </div>
                    <input
                      type="email"
                      className={`block w-full pl-10 pr-3 py-3 border ${
                        errors.email 
                          ? 'border-red-300 focus:ring-red-500 focus:border-red-500' 
                          : 'border-gray-300 focus:ring-blue-500 focus:border-blue-500'
                      } rounded-lg shadow-sm focus:ring-2 focus:outline-none transition duration-200`}
                      placeholder="exemple@entreprise.com"
                      value={profil.email}
                      onChange={(e) => setProfil({ ...profil, email: e.target.value })}
                      required
                    />
                  </div>
                  {errors.email && (
                    <p className="mt-2 text-sm text-red-600 flex items-center">
                      <FaInfoCircle className="mr-1" /> {errors.email}
                    </p>
                  )}
                </div>
                
                {/* Mot de passe */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-3 flex items-center">
                    <FaLock className="text-blue-500 mr-2" />
                    <span>Mot de passe</span>
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <FaKey className={`${errors.motDePasse ? 'text-red-400' : 'text-gray-400'}`} />
                    </div>
                    <input
                      type={showPassword ? "text" : "password"}
                      className={`block w-full pl-10 pr-10 py-3 border ${
                        errors.motDePasse 
                          ? 'border-red-300 focus:ring-red-500 focus:border-red-500' 
                          : 'border-gray-300 focus:ring-blue-500 focus:border-blue-500'
                      } rounded-lg shadow-sm focus:ring-2 focus:outline-none transition duration-200`}
                      placeholder="Entrez votre nouveau mot de passe"
                      value={profil.motDePasse}
                      onChange={(e) => setProfil({ ...profil, motDePasse: e.target.value })}
                    />
                    <button
                      type="button"
                      className="absolute inset-y-0 right-0 pr-3 flex items-center"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? (
                        <FaEyeSlash className="text-gray-500 hover:text-gray-700 transition-colors" />
                      ) : (
                        <FaEye className="text-gray-500 hover:text-gray-700 transition-colors" />
                      )}
                    </button>
                  </div>
                  {errors.motDePasse && (
                    <p className="mt-2 text-sm text-red-600 flex items-center">
                      <FaInfoCircle className="mr-1" /> {errors.motDePasse}
                    </p>
                  )}
                  <p className="mt-2 text-xs text-gray-500 flex items-center">
                    <FaInfoCircle className="mr-1" /> Laissez vide pour ne pas modifier le mot de passe
                  </p>
                </div>
                
                {/* Boutons */}
                <div className="flex justify-end space-x-4 pt-8 border-t border-gray-200">
                  <motion.button
                    type="button"
                    onClick={handleCancel}
                    whileHover={{ scale: 1.03 }}
                    whileTap={{ scale: 0.98 }}
                    className="inline-flex items-center px-6 py-3 border border-gray-300 shadow-sm text-base font-medium rounded-xl text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all duration-200"
                  >
                    <FaTimes className="mr-2 text-red-500" />
                    Annuler
                  </motion.button>
                  <motion.button
                    type="submit"
                    whileHover={{ scale: 1.03 }}
                    whileTap={{ scale: 0.98 }}
                    className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-xl shadow-sm text-white bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all duration-200"
                  >
                    <FaSave className="mr-2" />
                    Enregistrer les modifications
                  </motion.button>
                </div>
              </form>
            </div>
            
            {/* Section Informations */}
            <div className="hidden md:block md:w-1/3 bg-gradient-to-b from-blue-50 to-indigo-50 p-10 flex flex-col">
              <div className="flex-1">
                <div className="relative w-40 h-40 rounded-full overflow-hidden border-4 border-white shadow-xl mx-auto mb-8">
                  <img 
                    src="/images/profil-professionnel.jpg" 
                    alt="Profil" 
                    className="w-full h-full object-cover"
                  />
                  <button className="absolute bottom-0 right-0 bg-white p-2 rounded-full shadow-md hover:bg-gray-100 transition-colors">
                    <FaCamera className="text-blue-500" />
                  </button>
                </div>
                
                <div className="text-center mb-8">
                  <h3 className="text-xl font-semibold text-gray-800 mb-1">{profil.nom || 'Nom complet'}</h3>
                  <p className="text-blue-600">{profil.email}</p>
                </div>
                
                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
                  <h4 className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-4 flex items-center">
                    <FaShieldAlt className="mr-2 text-blue-500" />
                    Sécurité du compte
                  </h4>
                  <ul className="space-y-4">
                    <li className="flex items-start">
                      <FaCheckCircle className="text-green-500 mr-3 mt-0.5 flex-shrink-0" />
                      <span className="text-sm text-gray-700">
                        <span className="font-medium">Mot de passe fort</span> - Utilisez une combinaison de lettres, chiffres et symboles
                      </span>
                    </li>
                    <li className="flex items-start">
                      <FaCheckCircle className="text-green-500 mr-3 mt-0.5 flex-shrink-0" />
                      <span className="text-sm text-gray-700">
                        <span className="font-medium">Email vérifié</span> - Assurez-vous que votre email est à jour et valide
                      </span>
                    </li>
                    <li className="flex items-start">
                      <FaCheckCircle className="text-green-500 mr-3 mt-0.5 flex-shrink-0" />
                      <span className="text-sm text-gray-700">
                        <span className="font-medium">Authentification</span> - Considérez l'authentification à deux facteurs
                      </span>
                    </li>
                  </ul>
                </div>
              </div>
              
              <div className="mt-auto pt-6 border-t border-gray-200">
                <p className="text-xs text-gray-500 text-center">
                  Dernière mise à jour: {new Date().toLocaleDateString('fr-FR')}
                </p>
              </div>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default EditProfil;
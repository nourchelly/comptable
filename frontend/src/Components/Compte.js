import axios from "axios";
import React, { useEffect, useState } from "react";
import { useUser } from './UserContext';
import { toast } from "react-toastify";
import { useNavigate, Link } from 'react-router-dom';
import { 
  FaUserShield, 
  FaTrash, 
  FaExclamationTriangle, 
  FaSearch, 
  FaFilter,
  FaEdit,
  FaEye,
  FaUserCog
} from "react-icons/fa";
import { motion } from "framer-motion";

const Compte = () => {
  const { user, logout } = useUser();
  const [users, setUsers] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [profile, setProfile] = useState(null);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  // Récupérer le profil de l'utilisateur connecté
  useEffect(() => {
    const fetchProfile = async () => {
        if (!user?.id) {
            setError("Utilisateur non connecté");
            setIsLoading(false);
            return;
        }
        
        try {
            const response = await axios.get(`http://127.0.0.1:8000/api/compte/${user.id}/`, {
                withCredentials: true
            });
            
            setProfile(response.data);
        } catch (err) {
            console.error("Erreur lors de la récupération du profil:", err);
            setError("Impossible de charger les informations du profil");
        } finally {
            setIsLoading(false);
        }
    };

    fetchProfile();
  }, [user]);

  // Récupérer la liste des utilisateurs
  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const response = await axios.get('http://127.0.0.1:8000/api/comptes/', {
          withCredentials: true  // Gardez les credentials si nécessaire
        });
        
        // Debug: affiche la réponse complète
        console.log('Réponse complète:', response);
        console.log('Données reçues:', response.data);
        
        // Filtre côté client pour ne garder que comptables et directeurs
        const filteredUsers = response.data.users.filter(user => 
          ['comptable', 'directeur'].includes(user.role)
        );
        
        setUsers(filteredUsers);
        
      } catch (err) {
        // Gestion détaillée des erreurs
        console.error("Erreur complète:", err);
        console.error("Détails de la réponse:", err.response);
        
        toast.error("Impossible de charger la liste des utilisateurs");
      }
    };
  
    fetchUsers();
  }, []);  // Tableau de dépendances vide = exécuté une fois au montage

  const handleDeleteAccount = async (userId) => {
    if (window.confirm("Êtes-vous sûr de vouloir supprimer ce compte ? Cette action est irréversible.")) {
      try {
        const response = await axios.delete(`http://127.0.0.1:8000/api/compte/${userId}/`, {
          withCredentials: true
        });
        
        if (response.data.status === 'success') {
          toast.success("Compte supprimé avec succès");
          // Mettre à jour la liste des utilisateurs
          setUsers(users.filter(u => u.id !== userId));
        }
      } catch (err) {
        console.error("Erreur lors de la suppression du compte:", err);
        toast.error("Impossible de supprimer le compte");
      }
    }
  };

  const filteredUsers = users.filter(user => 
    (user.nom?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
    (user.email?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
    (user.role?.toLowerCase() || '').includes(searchTerm.toLowerCase())
  );

  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: {
        duration: 0.5
      }
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
      className="p-6 bg-gray-50 min-h-screen"
    >
      {/* Header avec titre et statistiques */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8">
        <div className="flex items-center mb-4 md:mb-0">
          <div className="p-3 bg-indigo-100 rounded-lg mr-4">
            <FaUserShield className="text-2xl text-indigo-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-800">Gestion des Comptes</h1>
            <p className="text-gray-500">Administration des utilisateurs de la plateforme</p>
          </div>
        </div>
        
        <div className="flex items-center space-x-4">
          <div className="bg-white px-4 py-3 rounded-xl shadow-sm border border-gray-100">
            <div className="text-sm text-gray-500">Utilisateurs</div>
            <div className="text-2xl font-bold text-indigo-600">{users.length}</div>
          </div>
        </div>
      </div>

      {/* Carte principale */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden mb-8">
        {/* Barre d'outils */}
        <div className="p-6 border-b border-gray-100">
          <div className="flex flex-col md:flex-row gap-4 items-start md:items-center">
            <div className="relative flex-1 w-full">
              <FaSearch className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Rechercher un utilisateur..."
                className="w-full pl-12 pr-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <div className="flex space-x-3">
              <button className="flex items-center justify-center px-4 py-3 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition-colors shadow-sm">
                <FaFilter className="mr-2" />
                Filtres
              </button>
              <button className="flex items-center justify-center px-4 py-3 border border-indigo-600 text-indigo-600 rounded-xl hover:bg-indigo-50 transition-colors">
                <FaUserCog className="mr-2" />
                Rôles
              </button>
            </div>
          </div>
        </div>

        {/* Tableau des utilisateurs */}
        {isLoading ? (
          <div className="p-8 flex justify-center">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
          </div>
        ) : (
          <motion.div 
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="overflow-x-auto"
          >
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Utilisateur</th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Rôle</th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Statut</th>
                  <th className="px-6 py-4 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredUsers.length > 0 ? (
                  filteredUsers.map((user) => (
                    <motion.tr 
                      key={user.id} 
                      variants={itemVariants}
                      className="hover:bg-gray-50 transition-colors"
                    >
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="flex-shrink-0 h-10 w-10 bg-indigo-100 rounded-full flex items-center justify-center">
                            <span className="text-indigo-600 font-medium">
                              {user.nom ? user.nom.charAt(0).toUpperCase() : 'U'}
                            </span>
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-gray-900">{user.nom || 'Utilisateur'}</div>
                            <div className="text-sm text-gray-500">ID: {user.id}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{user.email}</td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                          user.role === 'admin' 
                            ? 'bg-purple-100 text-purple-800' 
                            : user.role === 'moderator'
                            ? 'bg-blue-100 text-blue-800'
                            : 'bg-green-100 text-green-800'
                        }`}>
                          {user.role}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                          user.statut === 'Actif' 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-red-100 text-red-800'
                        }`}>
                          {user.statut}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <div className="flex justify-end space-x-2">
                          <Link
                            to={`/dashboard/signalercompte/${user.id}`}
                            className="text-yellow-600 hover:text-yellow-800 p-2 rounded-lg hover:bg-yellow-50 transition-colors"
                            title="Signaler"
                          >
                            <FaExclamationTriangle />
                          </Link>
                          
                          <button
                            className="text-blue-600 hover:text-blue-800 p-2 rounded-lg hover:bg-blue-50 transition-colors"
                            title="Voir"
                          >
                            <FaEye />
                          </button>
                        
                          <button
                            onClick={() => handleDeleteAccount(user.id)}
                            className="text-red-600 hover:text-red-800 p-2 rounded-lg hover:bg-red-50 transition-colors"
                            title="Supprimer"
                          >
                            <FaTrash />
                          </button>
                        </div>
                      </td>
                    </motion.tr>
                  ))
                ) : (
                  <motion.tr variants={itemVariants}>
                    <td colSpan="5" className="px-6 py-12 text-center">
                      <div className="text-gray-400 flex flex-col items-center">
                        <FaSearch className="text-3xl mb-3" />
                        <h3 className="text-lg font-medium">Aucun utilisateur trouvé</h3>
                        <p className="mt-1">Essayez de modifier vos critères de recherche</p>
                      </div>
                    </td>
                  </motion.tr>
                )}
              </tbody>
            </table>
          </motion.div>
        )}
      </div>

      {/* Pagination (optionnel) */}
      <div className="flex justify-between items-center bg-white px-6 py-4 rounded-xl shadow-sm border border-gray-100">
        <div className="text-sm text-gray-500">
          Affichage de <span className="font-medium">1</span> à <span className="font-medium">{Math.min(10, filteredUsers.length)}</span> sur <span className="font-medium">{filteredUsers.length}</span> résultats
        </div>
        <div className="flex space-x-2">
          <button className="px-3 py-1 border border-gray-200 rounded-lg text-gray-600 hover:bg-gray-50 disabled:opacity-50">
            Précédent
          </button>
          <button className="px-3 py-1 border border-gray-200 rounded-lg text-gray-600 hover:bg-gray-50 disabled:opacity-50">
            Suivant
          </button>
        </div>
      </div>
    </motion.div>
  );
};

export default Compte;
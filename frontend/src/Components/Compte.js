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
  FaUserCog,
  FaTimes
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
  const [deleteModal, setDeleteModal] = useState({
    isOpen: false,
    userId: null,
    userName: ""
  });
  const [viewModal, setViewModal] = useState({
    isOpen: false,
    user: null
  });

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
          withCredentials: true
        });
        
        const filteredUsers = response.data.users.filter(user => 
          ['comptable', 'directeur'].includes(user.role)
        );
        
        setUsers(filteredUsers);
        
      } catch (err) {
        console.error("Erreur complète:", err);
        toast.error("Impossible de charger la liste des utilisateurs");
      }
    };
  
    fetchUsers();
  }, []);

  const openDeleteModal = (userId, userName) => {
    setDeleteModal({
      isOpen: true,
      userId,
      userName
    });
  };

  const closeDeleteModal = () => {
    setDeleteModal({
      isOpen: false,
      userId: null,
      userName: ""
    });
  };
  
  const openViewModal = (user) => {
    setViewModal({
      isOpen: true,
      user
    });
  };

  const closeViewModal = () => {
    setViewModal({
      isOpen: false,
      user: null
    });
  };

  const confirmDelete = async () => {
    if (!deleteModal.userId) return;
    
    try {
      const response = await axios.delete(`http://127.0.0.1:8000/api/compte/${deleteModal.userId}/`, {
        withCredentials: true
      });
      
      if (response.data.status === 'success') {
        toast.success("Compte supprimé avec succès");
        setUsers(users.filter(u => u.id !== deleteModal.userId));
      }
    } catch (err) {
      console.error("Erreur lors de la suppression du compte:", err);
      toast.error("Impossible de supprimer le compte");
    } finally {
      closeDeleteModal();
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
                            onClick={() => openViewModal(user)}
                            className="text-blue-600 hover:text-blue-800 p-2 rounded-lg hover:bg-blue-50 transition-colors"
                            title="Voir détails"
                          >
                            <FaEye />
                          </button>
                          
                          <button
                            onClick={() => openDeleteModal(user.id, user.nom || user.email)}
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

      {/* Modale de suppression */}
      {deleteModal.isOpen && (
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
          onClick={closeDeleteModal}
        >
          <motion.div 
            initial={{ scale: 0.9, y: 20 }}
            animate={{ scale: 1, y: 0 }}
            onClick={(e) => e.stopPropagation()}
            className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden"
          >
            <div className="p-6">
              <div className="flex items-center justify-center w-16 h-16 mx-auto bg-red-100 rounded-full mb-4">
                <FaExclamationTriangle className="text-2xl text-red-600" />
              </div>
              <h3 className="text-xl font-bold text-center text-gray-800 mb-2">Confirmer la suppression</h3>
              <p className="text-gray-600 text-center mb-6">
                Êtes-vous sûr de vouloir supprimer le compte de <span className="font-semibold">{deleteModal.userName}</span> ? Cette action est irréversible.
              </p>
              
              <div className="flex justify-center space-x-4">
                <button
                  onClick={closeDeleteModal}
                  className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
                >
                  Annuler
                </button>
                <button
                  onClick={confirmDelete}
                  className="px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-medium flex items-center"
                >
                  <FaTrash className="mr-2" />
                  Supprimer
                </button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}

      {/* View Modal */}
      {viewModal.isOpen && viewModal.user && (
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
          onClick={closeViewModal}
        >
          <motion.div 
            initial={{ scale: 0.9, y: 20 }}
            animate={{ scale: 1, y: 0 }}
            onClick={(e) => e.stopPropagation()}
            className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden"
          >
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-bold text-gray-800">Détails de l'utilisateur</h3>
                <button
                  onClick={closeViewModal}
                  className="text-gray-400 hover:text-gray-500"
                >
                  <FaTimes />
                </button>
              </div>

              <div className="space-y-4">
                <div className="flex items-center">
                  <div className="flex-shrink-0 h-12 w-12 bg-blue-100 rounded-full flex items-center justify-center">
                    <span className="text-blue-600 font-medium">
                      {viewModal.user.nom ? viewModal.user.nom.charAt(0).toUpperCase() : 'U'}
                    </span>
                  </div>
                  <div className="ml-4">
                    <h4 className="text-lg font-medium text-gray-900">{viewModal.user.nom || 'Utilisateur'}</h4>
                    <p className="text-sm text-gray-500">ID: {viewModal.user.id}</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 pt-4">
                  <div>
                    <p className="text-sm text-gray-500">Email</p>
                    <p className="text-sm font-medium text-gray-900">{viewModal.user.email || '-'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Rôle</p>
                    <p className="text-sm font-medium text-gray-900 capitalize">{viewModal.user.role || '-'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Statut</p>
                    <p className={`text-sm font-medium ${
                      viewModal.user.statut === 'Actif' ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {viewModal.user.statut || '-'}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Date de création</p>
                    <p className="text-sm font-medium text-gray-900">
                      {viewModal.user.created_at ? new Date(viewModal.user.created_at).toLocaleDateString() : '-'}
                    </p>
                  </div>
                </div>

                {viewModal.user.last_login && (
                  <div className="pt-4">
                    <p className="text-sm text-gray-500">Dernière connexion</p>
                    <p className="text-sm font-medium text-gray-900">
                      {new Date(viewModal.user.last_login).toLocaleString()}
                    </p>
                  </div>
                )}
              </div>

              <div className="mt-6 pt-4 border-t border-gray-200 flex justify-end">
                <button
                  onClick={closeViewModal}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Fermer
                </button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </motion.div>
  );
};

export default Compte;
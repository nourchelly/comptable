import React, { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useUser } from './UserContext';
import axios from 'axios';
import { 
  FaUserEdit, 
  FaTrashAlt, 
  FaUser, 
  FaEnvelope, 
  FaPhone, 
  FaUserTie,
  FaBuilding,
  FaIdCard,
  FaPlusCircle
} from "react-icons/fa";

const ProfilComptable = () => {
  const { user, logout } = useUser();
  const [profile, setProfile] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [showDeleteConfirmation, setShowDeleteConfirmation] = useState(false);
  const [formData, setFormData] = useState({
    nom_complet: '',
    telephone: '',
    matricule: '',
    departement: ''
  });
  const navigate = useNavigate();

  useEffect(() => {
    const fetchProfile = async () => {
      if (!user?.id) {
        setError("Utilisateur non connecté");
        setLoading(false);
        return;
      }
    
      try {
        const response = await axios.get(`http://127.0.0.1:8000/api/profilcomptable/${user.id}/`, {
          withCredentials: true
        });
        
        if (!response.data) {
          throw new Error("Aucune donnée reçue");
        }

        setProfile({
          username: response.data.username || 'Non spécifié',
          email: response.data.email || 'Non spécifié',
          nom_complet: response.data.nom_complet || 'Non spécifié',
          telephone: response.data.telephone || 'Non spécifié',
          matricule: response.data.matricule || 'Non spécifié',
          departement: response.data.departement || 'Non spécifié',
          role: response.data.role || 'Comptable'
        });
        
      } catch (err) {
        console.error("Erreur lors de la récupération du profil:", err);
        setError(err.message || "Impossible de charger les informations du profil");
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, [user]);

  const handleDelete = () => {
    setShowDeleteConfirmation(true);
  };

  const confirmDelete = async () => {
    try {
      const response = await axios.delete(`http://127.0.0.1:8000/api/profilcomptable/${user.id}/`, {
        withCredentials: true
      });
      
      if (response.data?.status === 'success') {
        alert("Votre compte a été supprimé avec succès");
        logout();
        navigate('/connexion');
      }
    } catch (err) {
      console.error("Erreur lors de la suppression du compte:", err);
      setError("Impossible de supprimer le compte");
    } finally {
      setShowDeleteConfirmation(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await axios.post(
        `http://127.0.0.1:8000/api/profilcomptable/`,
        {
          user_id: user.id,
          nom_complet: formData.nom_complet,
          telephone: formData.telephone,
          matricule: formData.matricule,
          departement: formData.departement,
        },
        { withCredentials: true }
      );

      if (response.data.status === 'success') {
        const profileResponse = await axios.get(
          `http://127.0.0.1:8000/api/profilcomptable/${user.id}/`,
          { withCredentials: true }
        );
        setProfile({
          ...profile,
          nom_complet: profileResponse.data.nom_complet,
          telephone: profileResponse.data.telephone,
          matricule: profileResponse.data.matricule,
          departement: profileResponse.data.departement
        });
        setShowAddForm(false);
        setError(null);
      }
    } catch (err) {
      console.error("Erreur lors de l'ajout des informations:", err);
      setError(err.response?.data?.error || "Erreur lors de l'ajout des informations");
    }
  };

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="bg-white p-8 rounded-lg shadow-lg max-w-md w-full text-center">
          <h2 className="text-xl font-bold text-red-600 mb-4">Accès non autorisé</h2>
          <p className="text-gray-700 mb-6">Veuillez vous connecter pour accéder à cette page</p>
          <Link 
            to="/connexion" 
            className="px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700 transition"
          >
            Se connecter
          </Link>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="bg-white p-8 rounded-lg shadow-lg max-w-md w-full text-center">
          <h2 className="text-xl font-bold text-red-600 mb-4">Erreur</h2>
          <p className="text-gray-700 mb-6">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700 transition"
          >
            Réessayer
          </button>
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="bg-white p-8 rounded-lg shadow-lg max-w-md w-full text-center">
          <h2 className="text-xl font-bold text-yellow-600 mb-4">Aucune donnée</h2>
          <p className="text-gray-700 mb-6">Aucune information de profil disponible</p>
          <button
            onClick={() => setShowAddForm(true)}
            className="flex items-center justify-center w-full px-6 py-3 bg-indigo-600 text-white rounded-full font-medium hover:bg-indigo-700 transition duration-300"
          >
            <FaPlusCircle className="mr-2 text-lg" /> Ajouter des informations
          </button>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="max-w-6xl mx-auto p-4">
        <div className="bg-white rounded-3xl shadow-xl overflow-hidden">
          <div className="md:flex flex-row-reverse">
            <div className="md:w-1/3 bg-indigo-600 p-8 flex flex-col items-center justify-center">
              <img 
                src="/images/nou.jpg" 
                alt="Comptable" 
                className="w-64 h-64 rounded-full object-cover border-4 border-white shadow-lg"
              />
              <h2 className="mt-6 text-2xl font-bold text-white text-center">
                {profile.nom_complet}
              </h2>
              <p className="mt-2 text-indigo-100">{profile.role}</p>
              <div className="mt-8 space-y-4 w-full">
                <Link 
                  to={`/dashboardcomptable/modif_profil`}
                  className="flex items-center justify-center px-6 py-3 bg-white text-indigo-600 rounded-full font-medium hover:bg-indigo-50 transition duration-300"
                >
                  <FaUserEdit className="mr-2 text-lg" /> Modifier le profil
                </Link>
                
                <button
                  onClick={() => setShowAddForm(true)}
                  className="flex items-center justify-center w-full px-6 py-3 bg-green-500 text-white rounded-full font-medium hover:bg-green-600 transition duration-300"
                >
                  <FaPlusCircle className="mr-2 text-lg" /> Ajouter des informations
                </button>
              </div>
            </div>

            <div className="md:w-2/3 p-8">
              <div className="flex flex-col items-center mb-6">
                <FaUserTie className="h-8 w-8 text-indigo-600 mr-3" />
                <h1 className="text-2xl font-bold text-gray-800">Profil Comptable</h1>
              </div>

              <div className="space-y-6">
                <Item icon={<FaUser />} label="Identifiant" value={profile.username} color="indigo" />
                <Item icon={<FaEnvelope />} label="Email" value={profile.email} color="blue" />
                <Item icon={<FaIdCard />} label="Matricule" value={profile.matricule} color="purple" />
                <Item icon={<FaPhone />} label="Téléphone" value={profile.telephone} color="green" />
                <Item icon={<FaBuilding />} label="Département" value={profile.departement} color="orange" />
              </div>

              <div className="mt-12 pt-6 border-t border-gray-200 flex justify-end">
                <button 
                  onClick={handleDelete}
                  className="flex items-center px-6 py-3 bg-red-100 text-red-600 rounded-full font-medium hover:bg-red-200 transition duration-300"
                >
                  <FaTrashAlt className="mr-2" /> Supprimer le compte
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Modal d'ajout d'informations */}
      {showAddForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md">
            <div className="flex justify-between items-center border-b p-4">
              <h3 className="text-xl font-bold text-gray-800">Ajouter des informations</h3>
              <button 
                onClick={() => setShowAddForm(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                &times;
              </button>
            </div>
            
            <form onSubmit={handleSubmit} className="p-6">
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Nom complet <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="nom_complet"
                    value={formData.nom_complet}
                    onChange={handleChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Téléphone <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="tel"
                    name="telephone"
                    value={formData.telephone}
                    onChange={handleChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Matricule <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="matricule"
                    value={formData.matricule}
                    onChange={handleChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Département <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="departement"
                    value={formData.departement}
                    onChange={handleChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    required
                  />
                </div>
              </div>
              
              {error && (
                <div className="mt-4 p-3 bg-red-100 text-red-700 rounded-lg">
                  {error}
                </div>
              )}
              
              <div className="mt-6 flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setShowAddForm(false)}
                  className="px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition-colors"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors flex items-center"
                >
                  <FaPlusCircle className="mr-2" />
                  Enregistrer
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal de confirmation de suppression */}
      {showDeleteConfirmation && (
  <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
    <div className="bg-white rounded-xl shadow-2xl w-full max-w-md overflow-hidden">
      {/* Header avec fond rouge */}
      <div className="bg-red-50 p-5 border-b border-red-100">
        <div className="flex flex-col items-center">
          <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100">
            <svg 
              className="h-6 w-6 text-red-600" 
              fill="none" 
              viewBox="0 0 24 24" 
              stroke="currentColor"
              strokeWidth="2"
            >
              <path 
                strokeLinecap="round" 
                strokeLinejoin="round" 
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" 
              />
            </svg>
          </div>
          <h3 className="mt-4 text-xl font-bold text-red-600">Confirmation requise</h3>
        </div>
      </div>

      {/* Corps du message */}
      <div className="p-6 space-y-4">
        <div className="flex items-start">
          <div className="flex-shrink-0 text-red-500">
            <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
          </div>
          <div className="ml-3">
            <h3 className="text-lg font-medium text-gray-900">Êtes-vous sûr de vouloir supprimer ce compte ?</h3>
          </div>
        </div>

        <div className="bg-yellow-50 rounded-lg p-4">
          <div className="flex">
            <div className="flex-shrink-0 text-yellow-500">
              <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <div className="text-sm text-yellow-700">
                <p className="font-medium">Cette action est irréversible !</p>
                <ul className="mt-1 list-disc list-inside space-y-1">
                  <li>L'utilisateur perdra immédiatement l'accès</li>
                  <li>Toutes les données seront définitivement supprimées</li>
                  <li>Cette opération ne peut pas être annulée</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Boutons d'action */}
      <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse rounded-b-lg">
        <button
          type="button"
          onClick={confirmDelete}
          className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-red-600 text-base font-medium text-white hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 sm:ml-3 sm:w-auto sm:text-sm transition-colors duration-150"
        >
          <svg className="-ml-1 mr-2 h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
          </svg>
          Confirmer la suppression
        </button>
        <button
          type="button"
          onClick={() => setShowDeleteConfirmation(false)}
          className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm transition-colors duration-150"
        >
          <svg className="-ml-1 mr-2 h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
          </svg>
          Annuler
        </button>
      </div>
    </div>
  </div>
)}
    </>
  );
};

const Item = ({ icon, label, value, color }) => {
  const bgColors = {
    indigo: "bg-indigo-100 text-indigo-600",
    blue: "bg-blue-100 text-blue-600",
    green: "bg-green-100 text-green-600",
    orange: "bg-orange-100 text-orange-600",
    purple: "bg-purple-100 text-purple-600",
  };

  const colors = bgColors[color] || "bg-gray-100 text-gray-600";

  return (
    <div className="flex items-start">
      <div className={`flex-shrink-0 p-3 rounded-full ${colors}`}>
        {React.cloneElement(icon, { className: "h-5 w-5" })}
      </div>
      <div className="ml-4">
        <h3 className="text-sm font-medium text-gray-500">{label}</h3>
        <p className="mt-1 text-lg font-semibold text-gray-900">{value}</p>
      </div>
    </div>
  );
};

export default ProfilComptable;
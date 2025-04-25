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

  const handleDelete = async () => {
    if (window.confirm("Êtes-vous sûr de vouloir supprimer votre compte ? Cette action est irréversible.")) {
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
      }
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
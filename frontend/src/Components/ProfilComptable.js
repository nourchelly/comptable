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
  FaPlusCircle,
  FaBirthdayCake,
  FaVenusMars
} from "react-icons/fa";

// Fonction utilitaire pour gérer dynamiquement la couleur Tailwind
const IconWrapper = ({ icon, color }) => {
  const colors = {
    indigo: "text-indigo-600",
    blue: "text-blue-600",
    purple: "text-purple-600",
    green: "text-green-600",
    orange: "text-orange-600",
    red: "text-red-600",
    gray: "text-gray-600"
  };

  const colorClass = colors[color] || "text-gray-600";

  return <div className={`${colorClass} text-xl`}>{icon}</div>;
};

const Item = ({ icon, label, value, color }) => (
  <div className="flex items-center space-x-4">
    <IconWrapper icon={icon} color={color} />
    <div>
      <p className="text-sm text-gray-500 font-medium">{label}</p>
      <p className="text-lg text-gray-900 font-semibold">
        {value || <span className="text-gray-400">Non spécifié</span>}
      </p>
    </div>
  </div>
);

const ProfilComptable = () => {
  const { user, logout } = useUser();
  const [profile, setProfile] = useState({
    username: '',
    email: '',
    nom_complet: '',
    telephone: '',
    date_naissance: '',
    sexe: '',
    last_login: '',
    date_creation: '',
    role: '',
    departement: '',
    niveau_formation: ''
  });
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [showDeleteConfirmation, setShowDeleteConfirmation] = useState(false);
  const [formData, setFormData] = useState({
    nom_complet: '',
    telephone: '',
    date_naissance: '',
    sexe: '',
    departement: '',
    niveau_formation: 'débutant'
  });

  const navigate = useNavigate();
  const GENDER_CHOICES = [
    { value: 'Homme', label: 'Homme' },
    { value: 'Femme', label: 'Femme' },
    { value: 'Autre', label: 'Autre' },
  ];
  const DEPARTEMENT_OPTIONS = [
    { value: 'Générale', label: 'Comptabilité Générale' },
    { value: 'Comptabilité F', label: 'Comptabilité Fournisseurs' },
    { value: 'CR', label: 'Comptabilité Client' },
    { value: 'Agent', label: 'Paie' },
    { value: 'F', label: 'Fiscalité' }
];

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

        const profileData = response.data || {};
        console.log("Données reçues:", profileData); // Debug

        // Vérifier si c'est un message d'erreur ou de statut
        if (profileData.comptable_profile_status) {
          console.log("Statut profil comptable:", profileData.comptable_profile_status);
        }

        setFormData({
          nom_complet: profileData.nom_complet || '',
          telephone: profileData.telephone || '',
          date_naissance: profileData.date_naissance 
            ? new Date(profileData.date_naissance).toISOString().split('T')[0] 
            : '',
          sexe: profileData.sexe || '',
          departement: profileData.departement || '',
          niveau_formation: profileData.niveau_formation || 'débutant'
        });

        setProfile({
          username: profileData.username || 'Non spécifié',
          email: profileData.email || 'Non spécifié',
          nom_complet: profileData.nom_complet || null,
          telephone: profileData.telephone || null,
          date_naissance: profileData.date_naissance || null,
          sexe: profileData.sexe || null,
          last_login: profileData.last_login || 'Non spécifié',
          date_creation: profileData.date_joined || 'Non spécifié',
          role: profileData.role || 'Comptable',
          departement: profileData.departement || null,
          niveau_formation: profileData.niveau_formation || null
        });

      } catch (err) {
        console.error("Erreur lors de la récupération du profil:", err);
        console.error("Détails de l'erreur:", err.response?.data);
        
        // Gestion plus spécifique des erreurs
        if (err.response?.status === 404) {
          setError("Profil comptable non trouvé");
        } else if (err.response?.status === 403) {
          setError("Accès non autorisé - vérifiez votre rôle");
        } else {
          setError(err.response?.data?.error || err.message || "Impossible de charger les informations du profil");
        }
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
      const response = await axios.delete(
        `http://127.0.0.1:8000/api/profilcomptable/${user.id}/`,
        { withCredentials: true }
      );

      if (response.status === 200 || response.data?.status === 'success') {
        alert("Votre compte a été supprimé avec succès");
        logout();
        navigate('/connexion');
      }
    } catch (err) {
      console.error("Erreur lors de la suppression du compte:", err);
      setError(err.response?.data?.error || "Impossible de supprimer le compte");
    } finally {
      setShowDeleteConfirmation(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null); // Reset error state
    
    try {
      const payload = {
        user_id: user?.id,
        nom_complet: formData.nom_complet,
        telephone: formData.telephone,
        date_naissance: formData.date_naissance,
        sexe: formData.sexe,
        departement: formData.departement,
        niveau_formation: formData.niveau_formation
      };

      console.log("Envoi du payload:", payload); // Debug

      const response = await axios.post(
        `http://127.0.0.1:8000/api/profilcomptable/`,
        payload,
        { 
          withCredentials: true,
          headers: {
            'Content-Type': 'application/json'
          }
        }
      );

      console.log("Réponse POST:", response.data); // Debug

      if (response.data?.status === 'success') {
        // Recharger les données du profil
        const profileResponse = await axios.get(
          `http://127.0.0.1:8000/api/profilcomptable/${user?.id}/`,
          { withCredentials: true }
        );
        
        const newProfileData = profileResponse.data;
        
        setProfile(prev => ({
          ...prev,
          nom_complet: newProfileData.nom_complet || null,
          telephone: newProfileData.telephone || null,
          date_naissance: newProfileData.date_naissance || null,
          sexe: newProfileData.sexe || null,
          departement: newProfileData.departement || null,
          niveau_formation: newProfileData.niveau_formation || null
        }));
        
        setShowAddForm(false);
        
        // Afficher un message si le profil comptable a été créé
        if (response.data.comptable_created) {
          alert("Profil comptable créé avec succès");
        } else {
          alert("Profil comptable mis à jour avec succès");
        }
      }
    } catch (err) {
      console.error("Erreur lors de la mise à jour:", err);
      console.error("Détails de l'erreur:", err.response?.data);
      
      setError(err.response?.data?.error || 
        "Erreur lors de la mise à jour du profil");
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
          <div className="space-y-2">
            <button
              onClick={() => window.location.reload()}
              className="px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700 transition block w-full"
            >
              Réessayer
            </button>
            <button
              onClick={() => setError(null)}
              className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700 transition block w-full"
            >
              Continuer quand même
            </button>
          </div>
        </div>
      </div>
    );
  }

  const hasMissingInfo = !profile.nom_complet || !profile.telephone || !profile.departement;

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
                {profile.nom_complet || profile.username}
              </h2>
              <p className="mt-2 text-indigo-100">{profile.role}</p>
              <div className="mt-8 space-y-4 w-full">
                <Link
                  to={`/dashboardcomptable/modif_profil`}
                  className="flex items-center justify-center px-6 py-3 bg-white text-indigo-600 rounded-full font-medium hover:bg-indigo-50 transition duration-300"
                >
                  <FaUserEdit className="mr-2 text-lg" /> Modifier le profil
                </Link>

                {hasMissingInfo && (
                  <button
                    onClick={() => setShowAddForm(true)}
                    className="flex items-center justify-center w-full px-6 py-3 bg-green-500 text-white rounded-full font-medium hover:bg-green-600 transition duration-300"
                  >
                    <FaPlusCircle className="mr-2 text-lg" /> 
                    {profile.nom_complet ? "Compléter les informations" : "Ajouter des informations"}
                  </button>
                )}
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
                <Item icon={<FaPhone />} label="Téléphone" value={profile.telephone} color="green" />
                <Item 
                  icon={<FaBirthdayCake />} 
                  label="Date de naissance" 
                  value={profile.date_naissance ? new Date(profile.date_naissance).toLocaleDateString() : null} 
                  color="green" 
                />
                <Item icon={<FaVenusMars />} label="Sexe" value={profile.sexe} color="orange" />
                <Item icon={<FaBuilding />} label="Département" value={profile.departement} color="orange" />
                <Item icon={<FaUserTie />} label="Niveau de formation" value={profile.niveau_formation} color="purple" />
              </div>

              <div className="mt-12 pt-6 border-t border-gray-200 flex justify-end">
                <button
                  onClick={handleDelete}
                  className="px-6 py-2 rounded bg-red-600 text-white hover:bg-red-700 transition duration-300"
                >
                  Supprimer mon compte
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Formulaire d'ajout/mise à jour des informations */}
      {showAddForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-6 max-w-md w-full shadow-lg max-h-[90vh] overflow-y-auto">
            <h2 className="text-xl font-bold mb-4">
              {profile.nom_complet ? "Mettre à jour le profil" : "Compléter votre profil"}
            </h2>

            {error && (
              <div className="mb-4 p-3 bg-red-100 text-red-700 rounded">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label htmlFor="nom_complet" className="block text-sm font-medium text-gray-700">
                  Nom complet *
                </label>
                <input
                  id="nom_complet"
                  name="nom_complet"
                  type="text"
                  value={formData.nom_complet}
                  onChange={handleInputChange}
                  required
                  className="mt-1 block w-full border border-gray-300 rounded-md p-2 focus:ring-indigo-500 focus:border-indigo-500"
                />
              </div>

              <div>
                <label htmlFor="telephone" className="block text-sm font-medium text-gray-700">
                  Téléphone *
                </label>
                <input
                  id="telephone"
                  name="telephone"
                  type="tel"
                  value={formData.telephone}
                  onChange={handleInputChange}
                  required
                  pattern="[0-9+ -]{7,15}"
                  title="Entrez un numéro valide"
                  className="mt-1 block w-full border border-gray-300 rounded-md p-2 focus:ring-indigo-500 focus:border-indigo-500"
                />
              </div>

              <div>
                <label htmlFor="departement" className="block text-sm font-medium text-gray-700">
                  Département *
                </label>
               <select
    name="departement"
    value={formData.departement}
    onChange={handleInputChange}
    required
    className="mt-1 block w-full border border-gray-300 rounded-md p-2 focus:ring-indigo-500 focus:border-indigo-500"
>
    <option value="">Sélectionnez un département</option>
    {DEPARTEMENT_OPTIONS.map(option => (
        <option key={option.value} value={option.value}>
            {option.label}
        </option>
    ))}
</select>
              </div>

              <div>
                <label htmlFor="date_naissance" className="block text-sm font-medium text-gray-700">
                  Date de naissance
                </label>
                <input
                  id="date_naissance"
                  name="date_naissance"
                  type="date"
                  value={formData.date_naissance}
                  onChange={handleInputChange}
                  className="mt-1 block w-full border border-gray-300 rounded-md p-2 focus:ring-indigo-500 focus:border-indigo-500"
                />
              </div>

              <div>
                <label htmlFor="sexe" className="block text-sm font-medium text-gray-700">
                  Sexe
                </label>
                <select
                  id="sexe"
                  name="sexe"
                  value={formData.sexe}
                  onChange={handleInputChange}
                  className="mt-1 block w-full border border-gray-300 rounded-md p-2 focus:ring-indigo-500 focus:border-indigo-500"
                >
                  <option value="">Sélectionnez...</option>
                  {GENDER_CHOICES.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label htmlFor="niveau_formation" className="block text-sm font-medium text-gray-700">
                  Niveau de formation *
                </label>
                <select
                  id="niveau_formation"
                  name="niveau_formation"
                  value={formData.niveau_formation}
                  onChange={handleInputChange}
                  required
                  className="mt-1 block w-full border border-gray-300 rounded-md p-2 focus:ring-indigo-500 focus:border-indigo-500"
                >
                  <option value="débutant">Débutant</option>
                  <option value="confirmé">Confirmé</option>
                  <option value="expert">Expert</option>
                </select>
              </div>

              <div className="flex justify-end space-x-4 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowAddForm(false);
                    setError(null);
                  }}
                  className="px-4 py-2 rounded border border-gray-300 hover:bg-gray-100 transition"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded bg-indigo-600 text-white hover:bg-indigo-700 transition"
                >
                  Enregistrer
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Confirmation suppression */}
      {showDeleteConfirmation && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-6 max-w-sm w-full shadow-lg text-center">
            <h3 className="text-lg font-semibold mb-4">Confirmer la suppression</h3>
            <p className="mb-6">Êtes-vous sûr de vouloir supprimer votre compte ? Cette action est irréversible.</p>
            <div className="flex justify-center space-x-4">
              <button
                onClick={() => setShowDeleteConfirmation(false)}
                className="px-4 py-2 rounded border border-gray-300 hover:bg-gray-100 transition"
              >
                Annuler
              </button>
              <button
                onClick={confirmDelete}
                className="px-4 py-2 rounded bg-red-600 text-white hover:bg-red-700 transition"
              >
                Confirmer
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default ProfilComptable;
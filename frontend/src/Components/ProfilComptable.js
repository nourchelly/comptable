import React, { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useUser } from './UserContext';
// Importer l'instance Axios
import { 
  FaUserEdit, 
  FaTrashAlt, 
  FaUser, 
  FaEnvelope, 
  FaPhone, 
  FaUserTie,
  FaBuilding,
  FaIdCard
} from "react-icons/fa";

const ProfilComptable = () => {
  const { user, logout } = useUser();
  const [profile, setProfile] = useState(null);
  const [profil, setProfil] = useState({
    username: "",
    email: "",
    role: "Comptable",
    nom_complet: "",
    telephone: "",
    matricule: "",
    departement: "",
   

  });
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [loading, setLoading] = useState(true);
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
          
          setProfile(response.data);
          setFormData({
              username: response.data.username,
              email: response.data.email,
              nom_complet: response.data.nom_complet,
              telephone: response.data.telephone,
              matricule: response.data.matricule,
              departement: response.data.departement
          });
      } catch (err) {
          console.error("Erreur lors de la récupération du profil:", err);
          setError("Impossible de charger les informations du profil");
      }
  };

  const handleDelete = async () => {
    if (window.confirm("Êtes-vous sûr de vouloir supprimer votre compte ? Cette action est irréversible.")) {
        try {
            const response = await axios.delete(`http://127.0.0.1:8000/api/profiladmin/${user.id}/`, {
                withCredentials: true
            });
            
            if (response.data.status === 'success') {
                alert("Votre compte a été supprimé avec succès");
                logout(); // Déconnexion de l'utilisateur
                navigate('/connexion'); // Redirection vers la page de connexion
            }
        } catch (err) {
            console.error("Erreur lors de la suppression du compte:", err);
            setError("Impossible de supprimer le compte");
        }
    }
};


  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto p-4">
      <div className="bg-white rounded-3xl shadow-xl overflow-hidden">
        <div className="md:flex flex-row-reverse">
          <div className="md:w-1/3 bg-indigo-600 p-8 flex flex-col items-center justify-center">
            <img 
              src="/images/comptable.jpg" 
              alt="Comptable" 
              className="w-64 h-64 rounded-full object-cover border-4 border-white shadow-lg"
            />
            <h2 className="mt-6 text-2xl font-bold text-white text-center">
              {profil.nom_complet}
            </h2>
            <p className="mt-2 text-indigo-100">Comptable</p>
            <div className="mt-8">
              <Link 
                to={`/dashboardcomptable/modif_profil/${profil.id}`}
                className="flex items-center justify-center px-6 py-3 bg-white text-indigo-600 rounded-full font-medium hover:bg-indigo-50 transition duration-300"
              >
                <FaUserEdit className="mr-2 text-lg" /> Modifier le profil
              </Link>
            </div>
          </div>

          <div className="md:w-2/3 p-8">
            <div className="flex flex-col items-center mb-6">
              <FaUserTie className="h-8 w-8 text-indigo-600 mr-3" />
              <h1 className="text-2xl font-bold text-gray-800">Profil Comptable</h1>
            </div>

            <div className="space-y-6">
              <Item icon={<FaUser />} label="Identifiant" value={profil.username} color="indigo" />
              <Item icon={<FaEnvelope />} label="Email" value={profil.email} color="blue" />
              <Item icon={<FaIdCard />} label="Matricule" value={profil.matricule} color="purple" />
              <Item icon={<FaPhone />} label="Téléphone" value={profil.telephone} color="green" />
              <Item icon={<FaBuilding />} label="Département" value={profil.departement} color="orange" />
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

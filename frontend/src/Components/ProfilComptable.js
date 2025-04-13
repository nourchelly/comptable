import React, { useState, useEffect } from "react";
import axios from "axios";
import { useNavigate, Link } from "react-router-dom";
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
  const [profil, setProfil] = useState({
    username: "",
    email: "",
    role: "Comptable",
    nom_complet: "",
    telephone: "",
    matricule: "",
    departement: ""
  
  });

  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const chargerProfil = async () => {
      try {
        const token = localStorage.getItem("access_token");
        if (!token) {
          console.error("Aucun token trouvé");
          ///navigate("/login");
          return;
        }

        const response = await axios.get("http://127.0.0.1:8000/api/profil/", {
          headers: {
            Authorization: `Bearer ${token}`,
          }
        });

        console.log("Profil récupéré:", response.data);

        setProfil(prev => ({
          ...prev,
          username: response.data.username,
          email: response.data.email,
          role: response.data.role,
          nom_complet: response.data.nom_complet || `${response.data.prenom || ""} ${response.data.nom || ""}`,
          telephone: response.data.telephone ?? "Non renseigné",
          matricule: response.data.matricule ?? "Non défini",
          departement: response.data.departement ?? "Comptabilité",
          id: response.data._id || "",
        }));

      } catch (error) {
        console.error("Erreur chargement profil:", error);
        if (error.response?.status === 401) {
          localStorage.removeItem("access_token");
          navigate("/login");
        }
      } finally {
        setLoading(false);
      }
    };

    chargerProfil();
  }, [navigate]);

  const handleDelete = () => {
    if (!window.confirm("Confirmer la suppression définitive de votre profil ?")) return;

    const token = localStorage.getItem("access_token");

    axios
      .delete(`http://127.0.0.1:8000/api/profil/delete`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      .then((result) => {
        if (result.status === 204 || result.data.Status) {
          localStorage.removeItem("access_token");
          navigate("/login");
        } else {
          alert(result.data.Error || "Erreur inconnue");
        }
      })
      .catch((err) => {
        console.error("Erreur suppression:", err);
        alert("Erreur lors de la suppression du profil");
      });
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
                to="/comptable/modifier-profil"
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

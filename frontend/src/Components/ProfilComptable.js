import React, { useState, useEffect } from "react";
import axios from "axios";
import { useNavigate, Link } from "react-router-dom";
import { 
  FaUserEdit, 
  FaTrashAlt, 
  FaUser, 
  FaEnvelope, 
  FaPhone, 
  FaGraduationCap,
  FaUserTie 
} from "react-icons/fa";

const ProfilComptable = () => {
  const [profil, setProfil] = useState({
    nom: "",
    prenom: "",
    email: "",
    telephone: "",
    specialite: ""
  });
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const chargerProfil = async () => {
      try {
        const token = localStorage.getItem('valid');
        const response = await axios.get("http://127.0.0.1:8000/api/comptable/", {
          headers: { Authorization: `Bearer ${token}` }
        });
        setProfil(response.data);
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
  }, [navigate]);

  const supprimerProfil = async () => {
    if (!window.confirm("Confirmer la suppression définitive de votre profil ?")) return;
    
    try {
      const token = localStorage.getItem('valid');
      await axios.delete("http://127.0.0.1:8000/api/comptable/", {
        headers: { Authorization: `Bearer ${token}` }
      });
      localStorage.removeItem("valid");
      localStorage.removeItem("refresh_token");
      navigate("/login");
    } catch (error) {
      console.error("Erreur suppression:", error);
      alert("Erreur lors de la suppression du profil");
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
    <div className="min-h-screen bg-gradient-to-r from-blue-50 to-indigo-50 py-6 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto">
        <div className="bg-white rounded-3xl shadow-xl overflow-hidden">
          <div className="md:flex flex-row-reverse"> {/* Changement ici avec flex-row-reverse */}
            {/* Colonne de droite - Image */}
            <div className="md:w-1/3 bg-indigo-600 p-8 flex flex-col items-center justify-center">
              <img 
                src="/images/profil.jpg" 
                alt="Comptable" 
                className="w-64 h-64 rounded-full object-cover border-4 border-white shadow-lg"
              />
              <h2 className="mt-6 text-2xl font-bold text-white text-center">
                {profil.prenom} {profil.nom}
              </h2>
              <p className="mt-2 text-indigo-100">{profil.specialite}</p>
              
              <div className="mt-8">
                <Link 
                  to={`/dashboardcomptable/modif_profil/${profil.id}`}
                  className="flex items-center justify-center px-6 py-3 bg-white text-indigo-600 rounded-full font-medium hover:bg-indigo-50 transition duration-300"
                >
                  <FaUserEdit className="mr-2 text-lg" /> Modifier le profil
                </Link>
              </div>
            </div>

            {/* Colonne de gauche - Détails */}
            <div className="md:w-2/3 p-3">
            <div className="flex flex-col items-center mb-4">
                <FaUserTie className="h-8 w-8 text-indigo-600 mr-3" />
                <h1 className="text-2xl font-bold text-gray-800 text-center">Mon Profil Comptable</h1>
              </div>
              <div className="border-b border-gray-200 pb-6 mb-6"></div>

              <div className="space-y-6">
                {/* Nom */}
                <div className="flex items-start">
                  <div className="flex-shrink-0 bg-indigo-100 p-3 rounded-full">
                    <FaUser className="h-5 w-5 text-indigo-600" />
                  </div>
                  <div className="ml-4">
                    <h3 className="text-sm font-medium text-gray-500">Nom complet</h3>
                    <p className="mt-1 text-lg font-semibold text-gray-900">
                      {profil.prenom} {profil.nom}
                    </p>
                  </div>
                </div>

                {/* Email */}
                <div className="flex items-start">
                  <div className="flex-shrink-0 bg-blue-100 p-3 rounded-full">
                    <FaEnvelope className="h-5 w-5 text-blue-600" />
                  </div>
                  <div className="ml-4">
                    <h3 className="text-sm font-medium text-gray-500">Email</h3>
                    <p className="mt-1 text-lg font-semibold text-gray-900">
                      {profil.email}
                    </p>
                  </div>
                </div>

                {/* Téléphone */}
                <div className="flex items-start">
                  <div className="flex-shrink-0 bg-green-100 p-3 rounded-full">
                    <FaPhone className="h-5 w-5 text-green-600" />
                  </div>
                  <div className="ml-4">
                    <h3 className="text-sm font-medium text-gray-500">Téléphone</h3>
                    <p className="mt-1 text-lg font-semibold text-gray-900">
                      {profil.telephone || "Non renseigné"}
                    </p>
                  </div>
                </div>

                {/* Spécialité */}
                <div className="flex items-start">
                  <div className="flex-shrink-0 bg-purple-100 p-3 rounded-full">
                    <FaGraduationCap className="h-5 w-5 text-purple-600" />
                  </div>
                  <div className="ml-4">
                    <h3 className="text-sm font-medium text-gray-500">Spécialité</h3>
                    <p className="mt-1 text-lg font-semibold text-gray-900">
                      {profil.specialite}
                    </p>
                  </div>
                </div>
              </div>

              {/* Bouton Supprimer */}
              <div className="mt-12 pt-6 border-t border-gray-200 flex justify-end">
                <button 
                  onClick={supprimerProfil}
                  className="flex items-center px-6 py-3 bg-red-100 text-red-600 rounded-full font-medium hover:bg-red-200 transition duration-300"
                >
                  <FaTrashAlt className="mr-2" /> Supprimer mon compte
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfilComptable;
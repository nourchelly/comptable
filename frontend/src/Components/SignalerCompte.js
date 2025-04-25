import axios from "axios";
import React, { useEffect, useState } from "react";
import { 
  FaExclamationTriangle, 
  FaCheckCircle, 
  FaTimesCircle, 
  FaPaperclip,
  FaInfoCircle,
  FaFileUpload,
  FaUserShield,
  FaCommentAlt
} from "react-icons/fa";
import { useNavigate, useParams } from "react-router-dom";
import { toast } from "react-toastify";


const Signaler = () => {
  const { userId } = useParams();
  const [motif, setMotif] = useState("");
  const [description, setDescription] = useState("");
  const [file, setFile] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [userData, setUserData] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchUserData = async () => {
      if (!userId) {
        toast.error("ID utilisateur manquant");
        navigate('/dashboard/comptes');
        return;
      }

      try {
        const response = await axios.get(`http://127.0.0.1:8000/api/compte/${userId}/`, {
          withCredentials: true
        });
        setUserData(response.data);
      } catch (err) {
        console.error("Erreur lors de la récupération des données utilisateur:", err);
        toast.error("Impossible de charger les informations de l'utilisateur");
        navigate('/dashboard/comptes');
      }
    };

    fetchUserData();
  }, [userId, navigate]);

  const handleCancel = () => {
    setMotif("");
    setDescription("");
    setFile(null);
    navigate('/dashboard/comptes');
  };

  const handleSubmit = async () => {
    if (!motif || !description) {
      toast.error("Veuillez remplir tous les champs obligatoires.");
      return;
    }

    setIsSubmitting(true);
    const formData = new FormData();
    formData.append("user_id", userId);
    formData.append("motif", motif);
    formData.append("description", description);
    if (file) formData.append("file", file);

    try {
      const response = await axios.post("http://127.0.0.1:8000/api/signaler-compte/", formData, {
        headers: { "Content-Type": "multipart/form-data" },
        withCredentials: true
      });

      if (response.data.status === 'success') {
        toast.success("Signalement envoyé avec succès !");
        navigate('/dashboard/comptes');
      } else {
        toast.error(response.data.message || "Erreur lors du signalement");
      }
    } catch (error) {
      toast.error("Erreur lors de l'envoi du signalement : " + 
              (error.response?.data?.message || error.message));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto">
        <div className="bg-white shadow-xl rounded-2xl overflow-hidden flex flex-col md:flex-row">
          {/* Colonne gauche - Formulaire */}
          <div className="w-full md:w-2/3 p-8">
            <div className="flex items-center mb-8">
              <div className="p-3 bg-red-100 rounded-full mr-4">
                <FaExclamationTriangle className="text-red-500 text-2xl" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-gray-800">Signaler un Compte</h2>
                {userData && (
                  <p className="text-gray-600">
                    Vous signalez <span className="font-semibold text-blue-600">{userData.username}</span> ({userData.email})
                  </p>
                )}
              </div>
            </div>

            <div className="space-y-6">
              {/* Section Motif */}
              <div className="bg-blue-50 p-4 rounded-lg border border-blue-100">
                <div className="flex items-center mb-3">
                  <FaInfoCircle className="text-blue-500 mr-2" />
                  <label className="block text-sm font-medium text-blue-800">
                    Motif du signalement <span className="text-red-500">*</span>
                  </label>
                </div>
                <input
                  type="text"
                  className="block w-full px-4 py-3 border border-blue-200 rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Ex: Contenu inapproprié, Activité suspecte..."
                  value={motif}
                  onChange={(e) => setMotif(e.target.value)}
                  required
                />
              </div>

              {/* Section Description */}
              <div className="bg-purple-50 p-4 rounded-lg border border-purple-100">
                <div className="flex items-center mb-3">
                  <FaCommentAlt className="text-purple-500 mr-2" />
                  <label className="block text-sm font-medium text-purple-800">
                    Description détaillée <span className="text-red-500">*</span>
                  </label>
                </div>
                <textarea
                  className="block w-full px-4 py-3 border border-purple-200 rounded-lg shadow-sm focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                  placeholder="Décrivez précisément le problème rencontré..."
                  rows="5"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  required
                ></textarea>
              </div>

              {/* Section Pièce jointe */}
              <div className="bg-green-50 p-4 rounded-lg border border-green-100">
                <div className="flex items-center mb-3">
                  <FaPaperclip className="text-green-500 mr-2" />
                  <label className="block text-sm font-medium text-green-800">
                    Pièce jointe (Optionnel)
                  </label>
                </div>
                <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-dashed border-green-300 rounded-xl">
                  <div className="space-y-1 text-center">
                    <div className="flex justify-center">
                      <FaFileUpload className="h-12 w-12 text-green-400" />
                    </div>
                    <div className="flex text-sm text-gray-600 justify-center">
                      <label
                        htmlFor="file-upload"
                        className="relative cursor-pointer bg-white rounded-md font-medium text-green-600 hover:text-green-500 focus-within:outline-none"
                      >
                        <span>Téléverser un fichier</span>
                        <input
                          id="file-upload"
                          name="file-upload"
                          type="file"
                          className="sr-only"
                          onChange={(e) => setFile(e.target.files[0])}
                        />
                      </label>
                      <p className="pl-1">ou glisser-déposer</p>
                    </div>
                    <p className="text-xs text-gray-500">
                      Formats supportés: PDF, JPG, PNG (Max 5MB)
                    </p>
                    {file && (
                      <p className="text-sm text-green-700 mt-2 flex items-center justify-center">
                        <FaCheckCircle className="mr-2 text-green-600" />
                        {file.name}
                      </p>
                    )}
                  </div>
                </div>
              </div>

              {/* Boutons d'action */}
              <div className="flex flex-col sm:flex-row justify-end space-y-3 sm:space-y-0 sm:space-x-4 pt-6">
                <button
                  type="button"
                  onClick={handleCancel}
                  className="inline-flex items-center justify-center px-6 py-3 border border-gray-300 shadow-sm text-base font-medium rounded-lg text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all"
                >
                  <FaTimesCircle className="mr-2 text-red-500" />
                  Annuler
                </button>
                <button
                  type="button"
                  onClick={handleSubmit}
                  disabled={isSubmitting}
                  className={`inline-flex items-center justify-center px-6 py-3 border border-transparent text-base font-medium rounded-lg shadow-sm text-white bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-700 hover:to-blue-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all ${isSubmitting ? 'opacity-75 cursor-not-allowed' : ''}`}
                >
                  {isSubmitting ? (
                    <>
                      <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Envoi en cours...
                    </>
                  ) : (
                    <>
                      <FaCheckCircle className="mr-2" />
                      Envoyer le signalement
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>

       {/* Colonne droite - Illustration thématique */}
{/* Colonne droite - Illustration thématique améliorée */}
<div className="hidden md:block md:w-1/3 bg-gradient-to-b from-red-50 to-white p-8 flex flex-col items-center justify-center border-l border-gray-100">
  <div className="relative w-full max-w-xs h-64 mb-8">
    {/* Illustration SVG moderne */}
    <svg 
      xmlns="http://www.w3.org/2000/svg" 
      viewBox="0 0 24 24"
      className="w-full h-full text-red-400"
    >
      <path fill="none" d="M0 0h24v24H0z"/>
      <path 
        fill="currentColor" 
        d="M12 22C6.477 22 2 17.523 2 12S6.477 2 12 2s10 4.477 10 10-4.477 10-10 10zm-1-13v6h2V9h-2zm0 8v2h2v-2h-2z"
      />
    </svg>
  </div>
  
  <div className="text-center space-y-6">
    <h2 className="text-2xl font-bold text-gray-800">Votre signalement compte</h2>
    
    <div className="space-y-4">
      <div className="flex items-start">
        <div className="flex-shrink-0 mt-1">
          <div className="w-6 h-6 bg-red-100 rounded-full flex items-center justify-center">
            <FaExclamationTriangle className="text-red-500 text-xs" />
          </div>
        </div>
        <p className="ml-3 text-sm text-gray-600 text-left">
          Chaque signalement est examiné par notre équipe de modération
        </p>
      </div>
      
      <div className="flex items-start">
        <div className="flex-shrink-0 mt-1">
          <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center">
            <FaUserShield className="text-blue-500 text-xs" />
          </div>
        </div>
        <p className="ml-3 text-sm text-gray-600 text-left">
          Nous protégeons votre anonymat lors du traitement
        </p>
      </div>
      
      <div className="flex items-start">
        <div className="flex-shrink-0 mt-1">
          <div className="w-6 h-6 bg-green-100 rounded-full flex items-center justify-center">
            <FaCheckCircle className="text-green-500 text-xs" />
          </div>
        </div>
        <p className="ml-3 text-sm text-gray-600 text-left">
          Temps de réponse moyen : moins de 24 heures
        </p>
      </div>
    </div>

    <div className="pt-4 border-t border-gray-200">
      <p className="text-xs text-gray-500">
        En cas d'urgence, contactez directement notre support
      </p>
    </div>
  </div>
</div>

        {/* Avertissement en bas */}
        
      </div>
      <div className="mt-8 bg-yellow-50 border-l-4 border-yellow-400 p-4 rounded-r-lg">
          <div className="flex">
            <div className="flex-shrink-0">
              <FaInfoCircle className="h-5 w-5 text-yellow-500" />
            </div>
            <div className="ml-3">
              <p className="text-sm text-yellow-700">
                <span className="font-medium">Note importante :</span> Les signalements abusifs peuvent entraîner des restrictions sur votre compte.
              </p>
            </div>
          </div>
        </div>
    </div>
    </div>

  );
};

export default Signaler;
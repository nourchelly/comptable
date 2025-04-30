import axios from "axios";
import React, { useEffect, useState } from "react";
import { 
  FaExclamationTriangle, 
  FaCheck, 
  FaTimes, 
  FaPaperclip,
  FaInfoCircle,
  FaFileUpload,
  FaShieldAlt,
  FaListAlt,
  FaAlignLeft,
  FaFileAlt
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
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-5xl mx-auto">
        <div className="bg-white shadow-sm rounded-xl overflow-hidden border border-gray-200">
          {/* En-tête bleu foncé */}
          <div className="bg-blue-800 px-8 py-6">
            <div className="flex items-center">
              <div className="p-3 bg-blue-700/20 rounded-lg mr-4">
                <FaExclamationTriangle className="text-blue-300 text-xl" />
              </div>
              <div>
                <h2 className="text-xl font-semibold text-white">Signaler un utilisateur</h2>
                {userData && (
                  <p className="text-blue-200 text-sm">
                    Vous signalez : <span className="font-medium text-white">{userData.username || userData.email}</span>
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Contenu principal */}
          <div className="flex flex-col md:flex-row">
            {/* Formulaire - Colonne gauche */}
            <div className="w-full md:w-2/3 p-8">
              <div className="space-y-8">
                {/* Section Motif avec icône violette */}
                <div className="relative">
                  <div className="absolute -left-2 top-0 flex items-center justify-center w-10 h-10 bg-purple-100 rounded-lg">
                    <FaListAlt className="text-purple-600 text-lg" />
                  </div>
                  <div className="ml-10 pl-2">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Motif du signalement <span className="text-red-500">*</span>
                    </label>
                    <select
                      className="block w-full px-4 py-3 border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      value={motif}
                      onChange={(e) => setMotif(e.target.value)}
                      required
                    >
                      <option value="">Sélectionnez un motif</option>
                      <option value="Contenu inapproprié">Contenu inapproprié</option>
                      <option value="Harcèlement">Harcèlement</option>
                      <option value="Activité suspecte">Activité suspecte</option>
                      <option value="Violation des règles">Violation des règles</option>
                      <option value="Autre">Autre</option>
                    </select>
                  </div>
                </div>

                {/* Section Description avec icône bleue */}
                <div className="relative">
                  <div className="absolute -left-2 top-0 flex items-center justify-center w-10 h-10 bg-blue-100 rounded-lg">
                    <FaAlignLeft className="text-blue-600 text-lg" />
                  </div>
                  <div className="ml-10 pl-2">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Description détaillée <span className="text-red-500">*</span>
                    </label>
                    <textarea
                      className="block w-full px-4 py-3 border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="Décrivez précisément le problème rencontré..."
                      rows="5"
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      required
                    ></textarea>
                    <p className="mt-1 text-xs text-gray-500">
                      Soyez aussi précis que possible pour faciliter notre enquête
                    </p>
                  </div>
                </div>

                {/* Section Preuve avec icône verte */}
                <div className="relative">
                  <div className="absolute -left-2 top-0 flex items-center justify-center w-10 h-10 bg-green-100 rounded-lg">
                    <FaFileAlt className="text-green-600 text-lg" />
                  </div>
                  <div className="ml-10 pl-2">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Preuve (optionnelle)
                    </label>
                    <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-lg hover:border-blue-400 transition-colors">
                      <div className="space-y-1 text-center">
                        <FaFileUpload className="mx-auto h-10 w-10 text-gray-400 mb-3" />
                        <div className="flex text-sm text-gray-600 justify-center">
                          <label
                            htmlFor="file-upload"
                            className="relative cursor-pointer bg-white rounded-md font-medium text-blue-600 hover:text-blue-500 focus-within:outline-none"
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
                          <div className="flex items-center justify-center mt-3 text-sm text-gray-900 bg-gray-50 px-3 py-2 rounded-md">
                            <FaPaperclip className="mr-2 text-gray-500" />
                            <span className="truncate max-w-xs">{file.name}</span>
                            <button
                              onClick={() => setFile(null)}
                              className="ml-2 text-gray-400 hover:text-gray-500"
                            >
                              <FaTimes />
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Boutons d'action */}
                <div className="flex justify-end space-x-4 pt-6">
                  <button
                    type="button"
                    onClick={handleCancel}
                    className="inline-flex items-center px-5 py-2.5 border border-gray-300 shadow-sm text-sm font-medium rounded-lg text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all"
                  >
                    <FaTimes className="mr-2" />
                    Annuler
                  </button>
                  <button
                    type="button"
                    onClick={handleSubmit}
                    disabled={isSubmitting}
                    className="inline-flex items-center px-5 py-2.5 border border-transparent text-sm font-medium rounded-lg shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all disabled:opacity-75"
                  >
                    {isSubmitting ? (
                      <>
                        <svg className="animate-spin -ml-1 mr-3 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Envoi en cours...
                      </>
                    ) : (
                      <>
                        <FaCheck className="mr-2" />
                        Envoyer le signalement
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>

            {/* Sidebar informative - Colonne droite */}
            <div className="w-full md:w-1/3 bg-blue-50 p-8 border-t md:border-t-0 md:border-l border-blue-100">
              <div className="space-y-8">
                <div>
                  <h3 className="text-lg font-medium text-blue-800 mb-4 flex items-center">
                    <FaShieldAlt className="mr-2 text-blue-600" />
                    Processus de traitement
                  </h3>
                  <div className="space-y-4">
                    <div className="flex items-start">
                      <div className="flex-shrink-0 mt-1">
                        <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center">
                          <span className="text-blue-600 text-xs font-bold">1</span>
                        </div>
                      </div>
                      <p className="ml-3 text-sm text-blue-800">
                        <span className="font-medium">Examen initial</span> - Notre équipe vérifie votre signalement sous 24h
                      </p>
                    </div>
                    
                    <div className="flex items-start">
                      <div className="flex-shrink-0 mt-1">
                        <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center">
                          <span className="text-blue-600 text-xs font-bold">2</span>
                        </div>
                      </div>
                      <p className="ml-3 text-sm text-blue-800">
                        <span className="font-medium">Investigation</span> - Analyse approfondie des preuves
                      </p>
                    </div>
                    
                    <div className="flex items-start">
                      <div className="flex-shrink-0 mt-1">
                        <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center">
                          <span className="text-blue-600 text-xs font-bold">3</span>
                        </div>
                      </div>
                      <p className="ml-3 text-sm text-blue-800">
                        <span className="font-medium">Résolution</span> - Action appropriée et notification
                      </p>
                    </div>
                  </div>
                </div>

                <div className="border-t border-blue-200 pt-6">
                  <h3 className="text-lg font-medium text-blue-800 mb-4 flex items-center">
                    <FaInfoCircle className="mr-2 text-blue-600" />
                    Informations importantes
                  </h3>
                  <div className="bg-white p-4 rounded-lg border border-blue-200 shadow-xs">
                    <div className="flex items-start">
                      <div className="flex-shrink-0 text-blue-500">
                        <FaExclamationTriangle />
                      </div>
                      <div className="ml-3">
                        <p className="text-sm text-blue-800">
                          <span className="font-medium">Confidentialité:</span> Votre identité ne sera pas révélée à l'utilisateur signalé.
                        </p>
                      </div>
                    </div>
                  </div>
                  <div className="bg-white p-4 rounded-lg border border-blue-200 shadow-xs mt-3">
                    <div className="flex items-start">
                      <div className="flex-shrink-0 text-yellow-500">
                        <FaExclamationTriangle />
                      </div>
                      <div className="ml-3">
                        <p className="text-sm text-blue-800">
                          <span className="font-medium">Signalements abusifs:</span> Peuvent entraîner des restrictions sur votre compte.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="bg-blue-100/50 p-4 rounded-lg border border-blue-200">
                  <h4 className="text-sm font-medium text-blue-800 mb-2">Besoin d'aide urgente ?</h4>
                  <p className="text-xs text-blue-700">
                    Contactez directement notre support à <span className="font-medium">support@votredomaine.com</span>
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Signaler;
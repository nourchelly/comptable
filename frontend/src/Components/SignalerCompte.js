import axios from "axios";
import React, { useEffect, useState } from "react";
import { 
  FaExclamationTriangle, 
  FaCheckCircle, 
  FaTimesCircle, 
  FaPaperclip,
  FaInfoCircle,
  FaFileUpload
} from "react-icons/fa";
import { useNavigate } from "react-router-dom";

const Signaler = () => {
  const [motif, setMotif] = useState("");
  const [description, setDescription] = useState("");
  const [file, setFile] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    axios
      .get("http://localhost:3000/auth/signalercompte")
      .catch((err) => console.log("Erreur lors du chargement des comptes :", err));
  }, []);

  const handleCancel = () => {
    setMotif("");
    setDescription("");
    setFile(null);
    navigate('/dashboard/comptes');
  };

  const handleSubmit = async () => {
    if (!motif || !description) {
      alert("Veuillez remplir tous les champs obligatoires.");
      return;
    }

    setIsSubmitting(true);
    const formData = new FormData();
    formData.append("motif", motif);
    formData.append("description", description);
    if (file) {
      formData.append("file", file);
    }

    try {
      const response = await axios.post("http://localhost:3000/auth/signalercompte", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      if (response.data.Status) {
        alert("Signalement envoyé avec succès !");
        handleCancel();
      } else {
        alert(response.data.Error);
      }
    } catch (error) {
      alert("Erreur lors de l'envoi du signalement : " + error.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    
      <div className="max-w-4xl mx-auto">
        <div className="bg-white shadow-xl rounded-lg overflow-hidden relative">
          {/* En-tête */}
          <div className="bg-gradient-to-r from-blue-800 to-blue-600 px-6 py-5">
            <div className="flex items-center justify-center">
              <FaExclamationTriangle className="text-yellow-300 text-2xl mr-3" />
              <h2 className="text-2xl font-bold text-white">Signaler un Compte</h2>
            </div>
          </div>

          {/* Contenu du formulaire */}
          <div className="px-6 py-8 sm:px-8">
            <form className="space-y-6">
              {/* Motif */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center">
                  <FaInfoCircle className="text-blue-500 mr-2" />
                  <span>Motif du signalement <span className="text-red-500">*</span></span>
                </label>
                <input
                  type="text"
                  className="block w-full px-4 py-3 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  placeholder="Ex: Contenu inapproprié, Activité suspecte"
                  value={motif}
                  onChange={(e) => setMotif(e.target.value)}
                  required
                />
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center">
                  <FaInfoCircle className="text-blue-500 mr-2" />
                  <span>Description détaillée <span className="text-red-500">*</span></span>
                </label>
                <textarea
                  className="block w-full px-4 py-3 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  placeholder="Décrivez en détail le problème rencontré"
                  rows="4"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  required
                ></textarea>
              </div>

              {/* Pièce jointe */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center">
                  <FaPaperclip className="text-blue-500 mr-2" />
                  <span>Pièce jointe (Optionnel)</span>
                </label>
                <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-md">
                  <div className="space-y-1 text-center">
                    <FaFileUpload className="mx-auto h-10 w-10 text-blue-400" />
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
                      <p className="text-sm text-green-600 mt-2 flex items-center justify-center">
                        <FaCheckCircle className="mr-2 text-green-500" />
                        Fichier sélectionné: {file.name}
                      </p>
                    )}
                  </div>
                </div>
              </div>

              {/* Boutons d'action */}
              <div className="pt-6 border-t border-gray-200">
                <div className="flex justify-end space-x-3">
                  <button
                    type="button"
                    onClick={handleCancel}
                    className="inline-flex items-center px-6 py-3 border border-gray-300 text-sm font-medium rounded-md shadow-sm text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                  >
                    <FaTimesCircle className="mr-2 text-red-500" /> Annuler
                  </button>
                  <button
                    type="button"
                    onClick={handleSubmit}
                    disabled={isSubmitting}
                    className={`inline-flex items-center px-6 py-3 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 ${isSubmitting ? 'opacity-75 cursor-not-allowed' : ''}`}
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
                        <FaCheckCircle className="mr-2 text-green-200" /> Confirmer
                      </>
                    )}
                  </button>
                </div>
              </div>
            </form>
          </div>

          {/* Image d'illustration */}
          <div className="absolute right-8 bottom-8 hidden lg:block">
            <img 
              src="/images/co.jpg" 
              alt="Alerte" 
              className="w-64 h-auto rounded-lg shadow-md border-2 border-blue-100" 
            />
          </div>
        </div>
      </div>
    
  );
};

export default Signaler;
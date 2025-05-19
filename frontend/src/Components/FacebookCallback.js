// CallbackFacebook.js (à créer dans votre dossier de composants, par exemple)
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { FaSpinner } from 'react-icons/fa';

const CallbackFacebook = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const authenticateWithFacebook = async () => {
      try {
        const urlParams = new URLSearchParams(window.location.search);
        const code = urlParams.get('code');

        if (!code) {
          const errorDescription = urlParams.get('error_description');
          const errorMessage = urlParams.get('error');
          throw new Error(`Échec de l'authentification Facebook: ${errorMessage || 'inconnu'} - ${errorDescription || 'aucune description'}`);
        }

        const response = await axios.post(
          'http://127.0.0.1:8000/api/auth/facebook/callback/', // L'endpoint de votre backend pour gérer le callback Facebook
          { code },
          {
            headers: {
              'Content-Type': 'application/json',
            },
            withCredentials: true
          }
        );

        const { token, role, user_id, email } = response.data;

        // Stockage sécurisé des tokens
        localStorage.setItem("token", token);
        localStorage.setItem("userRole", role);
        localStorage.setItem("userId", user_id);
        localStorage.setItem("userEmail", email);

        console.log("Rôle reçu:", role); // Pour débogage

        // Redirection basée sur le rôle (similaire à la callback Google)
        switch(role.toLowerCase()) {
          case 'admin':
            navigate('/dashboard');
            break;
          case 'comptable':
            navigate('/dashboardcomptable');
            break;
          case 'directeur':
            navigate('/dashboarddirecteur');
            break;
          default:
            console.log("Rôle non reconnu:", role);
            navigate('/'); // Redirection par défaut
            break;
        }

        toast.success(`Connexion réussie en tant que ${role}`);
      } catch (err) {
        console.error("Erreur d'authentification Facebook:", err);
        setError(err.response?.data?.error || err.message);
        toast.error("Échec de la connexion avec Facebook");
        navigate('/connexion');
      } finally {
        setLoading(false);
      }
    };

    authenticateWithFacebook();
  }, [navigate]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen">
        <FaSpinner className="animate-spin text-4xl text-blue-500 mb-4" />
        <p className="text-lg">Connexion en cours...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen">
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          <p>Erreur: {error}</p>
        </div>
        <button
          onClick={() => navigate('/connexion')}
          className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
        >
          Retour à la page de connexion
        </button>
      </div>
    );
  }

  return null;
};

export default CallbackFacebook;
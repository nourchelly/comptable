import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { FaSpinner } from 'react-icons/fa';

const Callback = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const authenticateWithGoogle = async () => {
      try {
        const urlParams = new URLSearchParams(window.location.search);
        const code = urlParams.get('code');
        const state = urlParams.get('state');

        if (!code) {
          throw new Error("Code d'autorisation manquant");
        }

        // Vérification CSRF basique
        const storedState = localStorage.getItem('oauth_state');
        if (state !== storedState) {
          throw new Error("Erreur de sécurité: état invalide");
        }

        const response = await axios.post(
          'http://127.0.0.1:8000/api/auth/google/callback/', 
          { code, state },
          {
            headers: {
              'Content-Type': 'application/json',
              //'X-CSRFToken': localStorage.getItem('csrftoken') || ''
            },
            withCredentials: true
          }
        );

        const { token, role, user_id } = response.data;

        
        // Stockage sécurisé des tokens
        localStorage.setItem("token", token);

        //localStorage.setItem("refresh_token", refresh_token);
        localStorage.setItem("userRole", role);
        localStorage.setItem("userId", user_id);

        // Redirection basée sur le rôle
        const redirectPaths = {
          admin: '/dashboard',
          comptable: '/dashboardcomptable',
          directeur: '/dashboarddirecteur'
        };

        navigate(redirectPaths[role] || '/');
        
      } catch (err) {
        console.error("Erreur d'authentification Google:", err);
        setError(err.response?.data?.message || err.message);
        toast.error("Échec de la connexion avec Google");
        navigate('/connexion');
      } finally {
        setLoading(false);
      }
    };

    authenticateWithGoogle();
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

export default Callback;
import React, { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import axios from 'axios';
import { toast } from 'react-toastify';

const Callback = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  useEffect(() => {
    const authenticateWithGoogle = async () => {
      const code = searchParams.get('code');
      const state = searchParams.get('state');
      const error = searchParams.get('error');

      if (error) {
        toast.error(`Erreur Google: ${error}`);
        return navigate('/connexion');
      }

      if (!code) {
        toast.error("Code d'autorisation manquant");
        return navigate('/connexion');
      }

      try {
        const response = await axios.post(
          'http://127.0.0.1:8000/api/auth/google/callback/',
          { code, state },
          {
            headers: { 'Content-Type': 'application/json' },
            withCredentials: true
          }
        );

        // Stockage des informations utilisateur
        localStorage.setItem("auth_token", response.data.token);
        localStorage.setItem("userRole", response.data.role);
        localStorage.setItem("userId", response.data.user_id);

        // Redirection basée sur le rôle
        const redirectPath = {
          admin: '/dashboard',
          comptable: '/dashboardcomptable',
          directeur: '/dashboarddirecteur'
        }[response.data.role.toLowerCase()] || '/';

        navigate(redirectPath);
        toast.success(`Connecté en tant que ${response.data.role}`);

      } catch (err) {
        console.error("Erreur d'authentification:", err);
        toast.error(err.response?.data?.error || "Échec de la connexion");
        navigate('/connexion');
      }
    };

    authenticateWithGoogle();
  }, [navigate, searchParams]);

  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="text-center">
        <p className="text-lg">Traitement de la connexion Google...</p>
      </div>
    </div>
  );
};

export default Callback;
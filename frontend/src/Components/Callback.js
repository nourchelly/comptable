import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

const Callback = () => {
  const navigate = useNavigate();

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const code = urlParams.get('code');

    if (code) {
      console.log("Code Google reçu:", code);
      // Envoyer le code à l'API Google Callback sans en-tête d'authentification
      axios.post('http://127.0.0.1:8000/api/auth/google/callback/', { code })
        .then(response => {
          const { token, role, user_id } = response.data;
          
          // Stocker les informations de l'utilisateur dans localStorage
          localStorage.setItem("authToken", token);
          localStorage.setItem("userRole", role);
          localStorage.setItem("userId", user_id);
      
          // Redirection en fonction du rôle
          if (role === "admin") navigate('/dashboard');
          else if (role === "comptable") navigate('/dashboardcomptable');
          else if (role === "directeur") navigate('/dashboarddirecteur');
          else navigate('/');
        })
        .catch(err => {
          console.error("Erreur Google Callback:", err.response?.data);
        });
    }
  }, [navigate]);

  return <div>Connexion en cours...</div>;
};

export default Callback;
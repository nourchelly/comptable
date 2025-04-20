/*
import axios from "axios";

const api = axios.create({
  baseURL: "http://127.0.0.1:8000/api/",
});

// Fonction pour rafraîchir le token
const refreshAccessToken = async () => {
  const refresh = localStorage.getItem("refresh_token");
  try {
    const res = await axios.post("http://127.0.0.1:8000/api/token/refresh/", {
      refresh: refresh
    });
    if (res.data.access_token) {
      localStorage.setItem("access_token", res.data.access_token);
      return res.data.access_token;
    } else {
      throw new Error("Aucun token reçu");
    }
  } catch (err) {
    console.error("Échec du rafraîchissement :", err);
    // Optionnel : déconnecter l'utilisateur ici
    localStorage.clear();
    window.location.href = "/login";
    return null;
  }
};

// Intercepteur de requête : ajoute le token à chaque requête
api.interceptors.request.use(
  async (config) => {
    const token = localStorage.getItem("access_token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Intercepteur de réponse : tente de rafraîchir le token en cas d’erreur 401
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // Vérifie si c'est une erreur d'accès refusé (token expiré)
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      const newToken = await refreshAccessToken();
      if (newToken) {
        originalRequest.headers.Authorization = `Bearer ${newToken}`;
        return api(originalRequest);  // Refaire la requête avec le nouveau token
      }
    }

    return Promise.reject(error);
  }
);

export default api;*/

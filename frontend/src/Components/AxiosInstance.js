import axios from 'axios';

const axiosInstance = axios.create({
  baseURL: 'http://127.0.0.1:8000/api', // Pas de slash final
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true
});

// ➤ Initialisation CSRF (à appeler au mount de l'app)
export const initCSRF = async () => {
  try {
    await axiosInstance.get('/get-csrf/');
  } catch (error) {
    console.error("CSRF init error:", error);
  }
};

// ➤ Logout centralisé
const logoutUser = () => {
  localStorage.clear();
  window.location.href = '/connexion'; // Assurez-vous que cette route existe dans React Router
};

// ➤ Intercepteur de requête (simplifié pour plus de stabilité)
axiosInstance.interceptors.request.use(config => {
  // 1. Récupération simple du token
  const token = localStorage.getItem('access_token');
  if (token) {
    // Configuration simplifiée des headers
    config.headers = {
      ...config.headers,
      'Accept': 'application/json',
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    };
  }
  
  // 2. Gestion CSRF séparée
  if (!['get', 'head'].includes(config.method?.toLowerCase())) {
    const csrfToken = document.cookie.match(/csrftoken=([^;]+)/)?.[1];
    if (csrfToken) {
      config.headers['X-CSRFToken'] = csrfToken.trim();
    }
  }
  
  return config;
}, error => {
  console.error('[AXIOS] Erreur intercepteur:', error);
  return Promise.reject(error);
});

// ➤ Intercepteur de réponse
axiosInstance.interceptors.response.use(
  response => response,
  async error => {
    const originalRequest = error.config;
    
    // Exclusion des endpoints sensibles
    if (originalRequest.url.includes('/connexion') || 
        originalRequest.url.includes('/refresh')) {
      return Promise.reject(error);
    }
    
    // Token expiré
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      
      try {
        const refreshToken = localStorage.getItem('refresh_token');
        if (!refreshToken) {
          // Si pas de refresh token, déconnexion
          logoutUser();
          return Promise.reject(error);
        }
        
        const { data } = await axiosInstance.post('/token/refresh/', {
          refresh: refreshToken
        });
        
        // Mise à jour du token dans localStorage
        localStorage.setItem('access_token', data.access);
        
        // Mettre à jour également dans userData pour la cohérence
        const userData = localStorage.getItem('userData');
        if (userData) {
          const parsedUserData = JSON.parse(userData);
          parsedUserData.token = data.access;
          localStorage.setItem('userData', JSON.stringify(parsedUserData));
        }
        
        originalRequest.headers.Authorization = `Bearer ${data.access}`;
        return axiosInstance(originalRequest);
      } catch (e) {
        console.error("Échec du refresh token:", e);
        logoutUser();
        return Promise.reject(e);
      }
    }
    
    return Promise.reject(error);
  }
);

export default axiosInstance;
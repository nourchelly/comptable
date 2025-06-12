// src/services/authService.js
import axios from 'axios';

const API_URL = 'http://127.0.0.1:8000/api';

// Configuration par défaut d'axios
//axios.defaults.withCredentials = true; // Pour gérer les cookies (refresh token)

// Créer une instance axios avec une configuration spécifique
const apiClient = axios.create({
    baseURL: API_URL,
    timeout: 10000,
    headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
    }
    // Ne pas inclure withCredentials: true ici
});
// Helper function for logout that can be used in multiple places
const performLogout = async () => {
    try {
        // Utiliser apiClient au lieu d'axios
        await apiClient.post('/logout/');
    } catch (e) {
        console.error('Logout API error:', e);
    }
    localStorage.removeItem('auth_token');
    localStorage.removeItem('userRole');
    localStorage.removeItem('userId');
};

// Intercepteur pour gérer le token d'autorisation
apiClient.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('auth_token');
        if (token) {
            config.headers['Authorization'] = `Bearer ${token}`;
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

// Intercepteur pour gérer les erreurs sans déclencher la popup
apiClient.interceptors.response.use(
    (response) => {
        return response;
    },
    async (error) => {
        const originalRequest = error.config;
        
        // Gérer les erreurs 401 sans déclencher la popup du navigateur
        if (error.response?.status === 401 && !originalRequest._retry) {
            originalRequest._retry = true;
            
            try {
                // Utiliser l'instance apiClient au lieu d'axios
                const response = await apiClient.post('/refresh-token/');
                
                if (response.data.status === 'success') {
                    const newToken = response.data.access_token;
                    localStorage.setItem('auth_token', newToken);
                    originalRequest.headers['Authorization'] = `Bearer ${newToken}`;
                    return apiClient(originalRequest);
                }
            } catch (refreshError) {
                console.error('Erreur lors du rafraîchissement du token', refreshError);
                await performLogout();
                window.location.href = '/login?session=expired';
                return Promise.reject(refreshError);
            }
        }
        
        return Promise.reject(error);
    }
);


const authService = {
    login: async (email, password, role) => {
        const response = await apiClient.post('/login/', {
            email,
            password,
            role
        });
        return response.data;
    },
    
    logout: performLogout,
    
    refreshToken: async () => {
        const response = await apiClient.post('/refresh-token/');
        if (response.data.status === 'success') {
            localStorage.setItem('auth_token', response.data.access_token);
        }
        return response.data;
    },    
    getCurrentUser: () => {
        const token = localStorage.getItem('auth_token');
        if (token) {
            try {
                const base64Url = token.split('.')[1];
                const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
                const jsonPayload = decodeURIComponent(atob(base64).split('').map(function(c) {
                    return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
                }).join(''));
                return JSON.parse(jsonPayload);
            } catch (e) {
                console.error('Erreur de décodage du token:', e);
                return null;
            }
        }
        return null;
    },
    
    isAuthenticated: () => {
        const token = localStorage.getItem('auth_token');
        if (!token) return false;
        
        try {
            const payload = JSON.parse(atob(token.split('.')[1]));
            const expirationTime = payload.exp * 1000;
            return Date.now() < expirationTime;
        } catch (e) {
            return false;
        }
    }
};

export default authService;
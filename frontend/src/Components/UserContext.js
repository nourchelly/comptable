// src/context/UserContext.js
import React, { createContext, useContext, useState, useEffect } from 'react';
import authService from './authService';
import { useNavigate } from 'react-router-dom';
import { jwtDecode } from 'jwt-decode';
 // Correction ici

const UserContext = createContext(null);

export const useUser = () => useContext(UserContext);

export const UserProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();

useEffect(() => {
    const initAuth = async () => {
        try {
            if (authService.isAuthenticated()) {
                const token = localStorage.getItem('auth_token');
                if (!token) throw new Error("Token introuvable");

                const decoded = jwtDecode(token);

                const role = decoded.role || localStorage.getItem('userRole');
                const id = decoded.user_id || localStorage.getItem('userId');
                const is_superuser = typeof decoded.is_superuser !== 'undefined' ? decoded.is_superuser : false;

                if (token && role && id) {
                    setUser({
                        id,
                        email: decoded.email,
                        role,
                        is_superuser,
                        token
                    });
                } else {
                    console.warn("Données d'authentification incomplètes");
                    await logout();
                }
            }
        } catch (error) {
            console.error("Erreur lors de l'initialisation:", error);
            localStorage.removeItem('auth_token');
            localStorage.removeItem('userRole');
            localStorage.removeItem('userId');
        } finally {
            setLoading(false);
        }
    };

    initAuth();
}, []);


    const login = (userData) => {
        setUser(userData);
    };

    const logout = async () => {
        try {
            await Promise.race([
                authService.logout(),
                new Promise((_, reject) =>
                    setTimeout(() => reject(new Error('Timeout')), 3000)
                )
            ]);
        } catch (error) {
            console.warn("Déconnexion côté serveur échouée, nettoyage local:", error);
        } finally {
            setUser(null);
            localStorage.removeItem('auth_token');
            localStorage.removeItem('userRole');
            localStorage.removeItem('userId');
            navigate('/connexion');
        }
    };

    const value = {
        user,
        login,
        logout,
        isAuthenticated: !!user,
        loading
    };

    return <UserContext.Provider value={value}>{children}</UserContext.Provider>;
};

export default UserContext;

// src/UserContext.js
import React, { createContext, useContext, useState } from 'react';

// Créer le contexte
const UserContext = createContext();

// Créer un provider pour envelopper l'application et gérer l'état de l'utilisateur
export const UserProvider = ({ children }) => {
  const [user, setUser] = useState(null); // L'état initial de l'utilisateur

  const login = (userData) => {
    setUser(userData);
    localStorage.setItem("userData", JSON.stringify(userData)); // Fonction pour mettre à jour l'utilisateur
  };

  const logout = () => {
    setUser(null); 
    localStorage.removeItem("userData"); // Fonction pour déconnecter l'utilisateur
  };

  return (
    <UserContext.Provider value={{ user, login, logout }}>
      {children}
    </UserContext.Provider>
  );
};

// Créer un hook personnalisé pour accéder facilement au contexte utilisateur
export const useUser = () => {
  return useContext(UserContext);
};

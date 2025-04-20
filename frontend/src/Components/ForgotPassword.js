import React, { useState } from 'react';
import axios from 'axios';
import validator from 'validator'; 
import { useNavigate } from "react-router-dom";
import { FaEnvelope, FaLock, FaSpinner } from 'react-icons/fa';

const ForgotPassword = () => {
    const navigate = useNavigate();
    const [email, setEmail] = useState('');
    const [message, setMessage] = useState('');
    const [error, setError] = useState('');
    const [role, setRole] = useState(''); // Add role state
    const [isLoading, setIsLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
     
        
    if (!validator.isEmail(email)) { // Use validator for email validation
        setError('Email invalide');
        return;
      }
    if (!role) { // Validate role
        setError('Role est requis');
        return;
    }

        setIsLoading(true);
        try {
            const response = await axios.post(
                'http://127.0.0.1:8000/api/forgot-password/',
                { email , role },
                { headers:
                     {
                         'Content-Type': 'application/json'}}
                         
            );
            setMessage(response.data.detail || 'Lien envoyé avec succès');
            setTimeout(() => navigate('/connexion'), 3000);
        } catch (err) {
            setError(err.response?.data?.detail || 'Erreur serveur');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
            <div className="sm:mx-auto sm:w-full sm:max-w-md">
                <h2 className="mt-6 text-center text-3xl font-extrabold text-indigo-600">
                    Mot de passe oublié ?
                </h2>
            </div>

            <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
                <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
                    {message && (
                        <div className="mb-4 p-3 bg-green-100 text-green-700 rounded-md">
                            {message}
                        </div>
                    )}
                    {error && (
                        <div className="mb-4 p-3 bg-red-100 text-red-700 rounded-md">
                            {error}
                        </div>
                    )}

                    <form className="space-y-6" onSubmit={handleSubmit}>
                        <div>
                            <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                                Email
                            </label>
                            <div className="mt-1 relative rounded-md shadow-sm">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                    <FaEnvelope className="h-5 w-5 text-gray-400" />
                                </div>
                                <input
                                    id="email"
                                    name="email"
                                    type="email"
                                    autoComplete="email"
                                    required
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    className="py-2 pl-10 block w-full border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                                    placeholder="votre@email.com"
                                />
                            </div>
                        </div>
                        <div>
                <label htmlFor="role" className="block text-sm font-medium text-gray-700">
                    Role
                </label>
                <select
                    id="role"
                    name="role"
                    required
                    value={role}
                    onChange={(e) => setRole(e.target.value)}
                    className="mt-1 block w-full py-2 px-3 border border-gray-300 bg-white rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                >
                    <option value="">Sélectionner un rôle</option>
                    <option value="admin">ADMIN</option>
                    <option value="directeur">DIRECTEUR</option>
                    <option value="comptable">COMPTABLE</option>
                    {/* Add other roles */}
                </select>
            </div>

                        <div>
                            <button
                                type="submit"
                                disabled={isLoading}
                                className={`w-full flex justify-center items-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 ${isLoading ? 'opacity-75 cursor-not-allowed' : ''}`}
                            >
                                {isLoading ? (
                                    <>
                                        <FaSpinner className="animate-spin mr-2 h-4 w-4" />
                                        Envoi en cours...
                                    </>
                                ) : (
                                    <>
                                        <FaLock className="mr-2 h-4 w-4" />
                                        Envoyer le lien
                                    </>
                                )}
                            </button>
                        </div>
                    </form>

                    <div className="mt-6 text-center">
                        <a 
                            href="/connexion" 
                            className="text-sm font-medium text-indigo-600 hover:text-indigo-500"
                        >
                            ← Retour à la connexion
                        </a>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ForgotPassword;
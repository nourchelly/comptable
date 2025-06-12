import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import axios from 'axios';
import { FaEye, FaEyeSlash, FaGoogle, FaEnvelope, FaLock, FaArrowRight } from 'react-icons/fa';
import { useUser } from './UserContext'; // En supposant que UserContext est correctement implémenté

const Login = () => {
    const [values, setValues] = useState({ email: '', password: '' });
    const [error, setError] = useState(null); // Changé à null initialement
    const [showPassword, setShowPassword] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const navigate = useNavigate();
    const location = useLocation();
    const { login } = useUser();

    const handleSubmit = async (event) => {
        event.preventDefault();
        setError(null); // Effacer les erreurs précédentes
        setIsLoading(true);

        if (!values.email || !values.password) {
            setError("Veuillez remplir tous les champs.");
            setIsLoading(false);
            return;
        }

        try {
            const response = await axios.post('http://127.0.0.1:8000/api/login/', {
                email: values.email.trim().toLowerCase(),
                password: values.password,
            }, {
                withCredentials: true,
                headers: { 'Content-Type': 'application/json' }
            });

            if (response.data.status === 'success') {
                const token = response.data.access_token; // Assurez-vous que votre backend renvoie ceci
                const userData = {
                    id: response.data.user.id,
                    email: response.data.user.email,
                    username: response.data.user.username,
                    role: response.data.user.role,
                    is_superuser: response.data.user.is_superuser,
                    token: token
                };

                login(userData); // Mettre à jour le contexte utilisateur
                localStorage.setItem('auth_token', token);
                localStorage.setItem('userRole', userData.role);
                localStorage.setItem('userId', userData.id);
                localStorage.setItem('isSuperuser', userData.is_superuser);
                
                const redirectPath = location.state?.from || getDashboardByRole(userData.role);
                navigate(redirectPath, { replace: true });
            } else {
                // Ce cas ne devrait idéalement pas être atteint si le backend renvoie toujours 200 pour le succès
                // mais bon pour la robustesse si le backend envoie un statut 'error' avec un 200 OK.
                setError(response.data.message || "Une erreur inattendue est survenue.");
            }
        } catch (err) {
            let errorMessage = "Erreur de connexion. Veuillez réessayer.";

            // Messages d'erreur spécifiques du backend (codes de statut et corps)
            if (err.response) {
                switch (err.response.status) {
                    case 400: // Bad Request (ex: champs manquants)
                        errorMessage = err.response.data.message || "Requête invalide.";
                        break;
                    case 401: // Unauthorized (ex: identifiants incorrects)
                        errorMessage = err.response.data.message || "Email ou mot de passe incorrect.";
                        break;
                    case 403: // Forbidden (ex: compte non actif, en attente ou rejeté)
                        // C'est ici que les messages spécifiques de votre backend provenant de login_view sont cruciaux
                        errorMessage = err.response.data.message || "Votre compte n'est pas actif. Veuillez contacter l'administrateur.";
                        break;
                    case 500: // Internal Server Error
                        errorMessage = "Erreur interne du serveur. Veuillez réessayer plus tard.";
                        break;
                    default:
                        errorMessage = err.response.data.message || `Une erreur est survenue (Code: ${err.response.status}).`;
                }
            } else if (err.request) {
                // La requête a été faite mais aucune réponse n'a été reçue
                errorMessage = "Impossible de se connecter au serveur. Vérifiez votre connexion.";
            } else {
                // Quelque chose s'est produit lors de la configuration de la requête qui a déclenché une erreur
                errorMessage = err.message || "Une erreur inattendue est survenue.";
            }
            
            setError(errorMessage);
            console.error("Erreur de connexion:", err);
        } finally {
            setIsLoading(false);
        }
    };

    const getDashboardByRole = (role) => {
        const routes = {
            'admin': '/dashboard',
            'comptable': '/dashboardcomptable',
            'directeur': '/dashboarddirecteur'
        };
        return routes[role] || '/'; // Retour par défaut à '/' si le rôle n'est pas trouvé
    };

    const reachGoogle = () => {
        const clientID = "11479995049-09n7oceljn4sgmodv5til5uj7bd072jp.apps.googleusercontent.com";
        const redirectURI = encodeURIComponent("http://localhost:3000/auth/google/callback");
        const scope = encodeURIComponent("email profile");
        const authURL = `https://accounts.google.com/o/oauth2/v2/auth?response_type=code&client_id=${clientID}&redirect_uri=${redirectURI}&scope=${scope}&access_type=offline&prompt=consent`;
        window.location.href = authURL;
    };

    const togglePasswordVisibility = () => {
        setShowPassword(!showPassword);
    };

    const handleForgotPassword = () => {
        navigate('/forgot-password');
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center px-4 py-12">
            <div className="w-full max-w-6xl bg-white shadow-2xl rounded-2xl overflow-hidden">
                <div className="flex flex-col md:flex-row">
                    {/* Côté gauche Illustration */}
                    <div className="hidden md:flex md:w-1/2 bg-gradient-to-tr from-indigo-600 to-blue-600 items-center justify-center p-8">
                        <div className="text-center">
                            <img
                                src="images/login.png" // Assurez-vous que ce chemin est correct
                                alt="Illustration connexion"
                                className="w-full max-w-sm mx-auto"
                            />
                            <h2 className="text-3xl font-bold text-white mt-6">Bienvenue</h2>
                            <p className="text-white text-opacity-80 mt-2">Connectez-vous pour accéder à votre espace personnel</p>
                        </div>
                    </div>

                    {/* Côté droit Formulaire */}
                    <div className="w-full md:w-1/2 p-8 md:p-12">
                        <div className="text-center mb-8">
                            <h1 className="text-3xl font-bold text-gray-800">Connexion</h1>
                            <p className="text-gray-500 mt-2">Entrez vos informations pour continuer</p>
                        </div>

                        {error && (
                            <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 mb-6 rounded-md" role="alert">
                                <p className="font-semibold">Erreur :</p>
                                <p>{error}</p>
                            </div>
                        )}

                        <form onSubmit={handleSubmit} className="space-y-5">
                            {/* Email */}
                            <div className="relative">
                                <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-gray-400">
                                    <FaEnvelope />
                                </span>
                                <input
                                    type="email"
                                    placeholder="Adresse e-mail"
                                    onChange={(e) => setValues({ ...values, email: e.target.value })}
                                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                                    required
                                    aria-label="Adresse e-mail"
                                />
                            </div>

                            {/* Mot de passe */}
                            <div className="relative">
                                <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-gray-400">
                                    <FaLock />
                                </span>
                                <input
                                    type={showPassword ? 'text' : 'password'}
                                    placeholder="Mot de passe"
                                    onChange={(e) => setValues({ ...values, password: e.target.value })}
                                    className="w-full pl-10 pr-12 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                                    required
                                    aria-label="Mot de passe"
                                />
                                <button
                                    type="button"
                                    onClick={togglePasswordVisibility}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 p-1 rounded-full focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                    aria-label={showPassword ? 'Masquer le mot de passe' : 'Afficher le mot de passe'}
                                >
                                    {showPassword ? <FaEyeSlash /> : <FaEye />}
                                </button>
                            </div>

                            {/* Mot de passe oublié */}
                            <div className="text-right">
                                <button
                                    type="button"
                                    onClick={handleForgotPassword}
                                    className="text-sm text-indigo-600 hover:text-indigo-800 font-medium hover:underline"
                                >
                                    Mot de passe oublié ?
                                </button>
                            </div>

                            {/* Soumettre */}
                            <button
                                type="submit"
                                className={`w-full flex justify-center items-center py-3 text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-md transition duration-300 ease-in-out ${isLoading ? 'opacity-75 cursor-not-allowed' : ''}`}
                                disabled={isLoading}
                            >
                                {isLoading ? (
                                    <span className="flex items-center">
                                        <svg className="animate-spin h-5 w-5 mr-2 text-white" viewBox="0 0 24 24" fill="none">
                                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
                                        </svg>
                                        Connexion...
                                    </span>
                                ) : (
                                    <span className="flex items-center">
                                        Se connecter <FaArrowRight className="ml-2" />
                                    </span>
                                )}
                            </button>

                            {/* Séparateur */}
                            <div className="relative my-4">
                                <div className="absolute inset-0 flex items-center">
                                    <div className="w-full border-t border-gray-300"></div>
                                </div>
                                <div className="relative flex justify-center text-sm">
                                    <span className="bg-white px-2 text-gray-500">OU</span>
                                </div>
                            </div>

                            {/* Connexion Google */}
                            <button
                                type="button"
                                onClick={reachGoogle}
                                className="w-full flex items-center justify-center py-3 border border-gray-300 rounded-lg shadow-sm bg-white text-gray-700 hover:bg-gray-50 transition duration-300 ease-in-out"
                                aria-label="Continuer avec Google"
                            >
                                <FaGoogle className="text-red-500 mr-3" />
                                Continuer avec Google
                            </button>
                        </form>

                        <div className="mt-8 text-center">
                            <p className="text-gray-600">
                                Vous n'avez pas de compte ?{' '}
                                <a href="/signup" className="text-indigo-600 hover:text-indigo-500 font-medium hover:underline">
                                    S'inscrire
                                </a>
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Login;
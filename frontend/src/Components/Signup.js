import React, { useState } from 'react';
import axios from 'axios';
import { Link, useNavigate } from 'react-router-dom';
import { FaEye, FaEyeSlash, FaUser, FaEnvelope, FaLock, FaCheck, FaUserTie, FaChartLine, FaCheckCircle, FaExclamationTriangle, FaClock, FaShieldAlt } from 'react-icons/fa';
import { ClipLoader } from 'react-spinners';

const Signup = () => {
    const [values, setValues] = useState({
        username: '',
        email: '',
        password: '',
        confirmPassword: '',
        role: 'comptable'
    });

    const [error, setError] = useState('');
    const [success, setSuccess] = useState(null);
    const [passwordValid, setPasswordValid] = useState(false);
    const [passwordStrength, setPasswordStrength] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    
    const navigate = useNavigate();
    
    const togglePasswordVisibility = () => {
        setShowPassword(!showPassword);
    };

    const toggleConfirmPasswordVisibility = () => {
        setShowConfirmPassword(!showConfirmPassword);
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        setValues(prev => ({ ...prev, [name]: value }));

        if (name === "password") {
            validatePassword(value);
        }
    };

    const validatePassword = (password) => {
        const passwordRegEx = /^(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*])[A-Za-z\d!@#$%^&*]{8,}$/;
        setPasswordValid(passwordRegEx.test(password));

        // Calcul de la force du mot de passe
        const length = password.length >= 8;
        const number = /\d/.test(password);
        const specialChar = /[!@#$%^&*]/.test(password);
        const upperCase = /[A-Z]/.test(password);

        if (length && number && specialChar && upperCase) {
            setPasswordStrength('Fort');
        } else if (length && (number || specialChar)) {
            setPasswordStrength('Moyen');
        } else {
            setPasswordStrength('Faible');
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        setSuccess(null);

        // Validation côté client
        if (values.password !== values.confirmPassword) {
            setError("Les mots de passe ne correspondent pas !");
            setLoading(false);
            return;
        }

        if (!passwordValid) {
            setError("Le mot de passe doit contenir 8 caractères minimum, une majuscule, un chiffre et un caractère spécial");
            setLoading(false);
            return;
        }

        try {
            const response = await axios.post('http://127.0.0.1:8000/api/signup/', {
                username: values.username,
                email: values.email,
                password: values.password,
                confirmPassword: values.confirmPassword,
                role: values.role
            }, {
                headers: { 'Content-Type': 'application/json' }
            });

            if (response.data.success) {
                setSuccess({
                    message: response.data.message,
                    status: response.data.status,
                    compte_id: response.data.compte_id
                });
                // Réinitialisation complète du formulaire après succès
                setValues({
                    username: '',
                    email: '',
                    password: '',
                    confirmPassword: '',
                    role: 'comptable'
                });
                setPasswordValid(false);
                setPasswordStrength('');
            } else {
                setError(response.data.error || "Une erreur s'est produite lors de l'inscription.");
            }
        } catch (err) {
            setError(err.response?.data?.error || "Erreur de connexion au serveur");
        } finally {
            setLoading(false);
        }
    };

    // Composant pour l'affichage du succès avec statut d'approbation
    const SuccessMessage = ({ success }) => (
        <div className="mb-6 p-6 bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-lg shadow-sm">
            <div className="flex items-start space-x-3">
                <FaCheckCircle className="text-green-600 text-xl mt-1 flex-shrink-0" />
                <div className="flex-1">
                    <h3 className="text-lg font-semibold text-green-800 mb-2">
                        Inscription réussie !
                    </h3>
                    <p className="text-green-700 mb-4">{success.message}</p>
                    
                    {success.status === 'pending_approval' && (
                        <div className="space-y-4">
                            {/* Étape 1 : Approbation admin */}
                            <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                                <div className="flex items-start space-x-3">
                                    <FaClock className="text-amber-600 text-lg mt-0.5 flex-shrink-0" />
                                    <div>
                                        <h4 className="font-semibold text-amber-800 mb-2 flex items-center">
                                            Étape 1 : En attente d'approbation
                                        </h4>
                                        <ul className="text-sm text-amber-700 space-y-1.5">
                                            <li className="flex items-start">
                                                <span className="w-1.5 h-1.5 bg-amber-500 rounded-full mt-2 mr-2 flex-shrink-0"></span>
                                                Votre demande est actuellement en cours d'examen par un administrateur
                                            </li>
                                            <li className="flex items-start">
                                                <span className="w-1.5 h-1.5 bg-amber-500 rounded-full mt-2 mr-2 flex-shrink-0"></span>
                                                Cette étape peut prendre quelques heures à quelques jours
                                            </li>
                                            <li className="flex items-start">
                                                <span className="w-1.5 h-1.5 bg-amber-500 rounded-full mt-2 mr-2 flex-shrink-0"></span>
                                                Vous recevrez un email une fois votre demande approuvée
                                            </li>
                                        </ul>
                                    </div>
                                </div>
                            </div>

                            {/* Étape 2 : Activation par email */}
                            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                                <div className="flex items-start space-x-3">
                                    <FaEnvelope className="text-blue-600 text-lg mt-0.5 flex-shrink-0" />
                                    <div>
                                        <h4 className="font-semibold text-blue-800 mb-2">
                                            Étape 2 : Activation du compte
                                        </h4>
                                        <ul className="text-sm text-blue-700 space-y-1.5">
                                            <li className="flex items-start">
                                                <span className="w-1.5 h-1.5 bg-blue-500 rounded-full mt-2 mr-2 flex-shrink-0"></span>
                                                Après approbation, vous recevrez un email avec un lien d'activation
                                            </li>
                                            <li className="flex items-start">
                                                <span className="w-1.5 h-1.5 bg-blue-500 rounded-full mt-2 mr-2 flex-shrink-0"></span>
                                                Cliquez sur ce lien pour activer définitivement votre compte
                                            </li>
                                            <li className="flex items-start">
                                                <span className="w-1.5 h-1.5 bg-blue-500 rounded-full mt-2 mr-2 flex-shrink-0"></span>
                                                Le lien d'activation sera valide pendant 7 jours
                                            </li>
                                            <li className="flex items-start">
                                                <span className="w-1.5 h-1.5 bg-blue-500 rounded-full mt-2 mr-2 flex-shrink-0"></span>
                                                Une fois activé, vous pourrez vous connecter normalement
                                            </li>
                                        </ul>
                                    </div>
                                </div>
                            </div>

                            {/* Instructions importantes */}
                            <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-4">
                                <div className="flex items-start space-x-3">
                                    <FaExclamationTriangle className="text-indigo-600 text-lg mt-0.5 flex-shrink-0" />
                                    <div>
                                        <h4 className="font-semibold text-indigo-800 mb-2">
                                            Points importants
                                        </h4>
                                        <ul className="text-sm text-indigo-700 space-y-1.5">
                                            <li className="flex items-start">
                                                <span className="w-1.5 h-1.5 bg-indigo-500 rounded-full mt-2 mr-2 flex-shrink-0"></span>
                                                Vérifiez régulièrement votre boîte email (y compris les spams)
                                            </li>
                                            <li className="flex items-start">
                                                <span className="w-1.5 h-1.5 bg-indigo-500 rounded-full mt-2 mr-2 flex-shrink-0"></span>
                                                Conservez cet email pour référence future
                                            </li>
                                            <li className="flex items-start">
                                                <span className="w-1.5 h-1.5 bg-indigo-500 rounded-full mt-2 mr-2 flex-shrink-0"></span>
                                                En cas de problème, contactez l'administrateur
                                            </li>
                                        </ul>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                    
                    <div className="flex space-x-3 mt-6">
                        <button 
                            className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition duration-200 text-sm font-medium flex items-center"
                            onClick={() => navigate('/connexion')}
                        >
                            <FaUser className="mr-2" />
                            Aller à la connexion
                        </button>
                        <button 
                            className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition duration-200 text-sm font-medium"
                            onClick={() => {
                                setSuccess(null);
                                setError('');
                            }}
                        >
                            Nouvelle inscription
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );

    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-7">
            <div className="w-full max-w-7xl bg-white rounded-xl shadow-2xl overflow-hidden">
                <div className="flex flex-row">
                    {/* Left Side - Image */}
                    <div className="w-2/5 bg-indigo-800 hidden md:flex items-center justify-center p-8">
                        <div className="text-center text-white">
                            <img
                                src="images/106375912_10075609.jpg"
                                alt="Accounting Theme"
                                className="w-full h-auto rounded-lg shadow-xl object-cover"
                                style={{ height: '400px' }}
                            />
                            <h3 className="mt-6 text-2xl font-bold">Gestion Financière Simplifiée</h3>
                            <p className="mt-2 opacity-80">
                                Rejoignez notre plateforme pour une gestion comptable moderne et efficace
                            </p>
                        </div>
                    </div>
                    
                    {/* Right Side - Form */}
                    <div className="w-full md:w-3/5 p-8">
                        <div className="flex items-center justify-center mb-8">
                            <FaShieldAlt className="text-indigo-600 text-3xl mr-3" />
                            <h2 className="text-3xl font-bold text-indigo-800">Créer un compte</h2>
                        </div>
                        
                        {error && (
                            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start space-x-3">
                                <FaExclamationTriangle className="text-red-500 text-lg mt-0.5 flex-shrink-0" />
                                <p className="text-red-700">{error}</p>
                            </div>
                        )}
                        
                        {success && <SuccessMessage success={success} />}
                        
                        {!success && (
                            <form onSubmit={handleSubmit} className="space-y-4">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    {/* Username Field */}
                                    <div className="space-y-2">
                                        <label className="block text-sm font-medium text-gray-700 flex items-center">
                                            <FaUser className="mr-2 text-gray-500" />
                                            Nom d'utilisateur*
                                        </label>
                                        <div className="relative">
                                            <input
                                                type="text"
                                                name="username"
                                                autoComplete="off"
                                                placeholder="Entrez votre nom"
                                                value={values.username}
                                                onChange={handleChange}
                                                className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition duration-200"
                                                required
                                            />
                                        </div>
                                    </div>
                                    
                                    {/* Email Field */}
                                    <div className="space-y-2">
                                        <label className="block text-sm font-medium text-gray-700 flex items-center">
                                            <FaEnvelope className="mr-2 text-gray-500" />
                                            Email*
                                        </label>
                                        <div className="relative">
                                            <input
                                                type="email"
                                                name="email"
                                                autoComplete="off"
                                                placeholder="Entrez votre email"
                                                value={values.email}
                                                onChange={handleChange}
                                                className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition duration-200"
                                                required
                                            />
                                        </div>
                                    </div>
                                    
                                    {/* Password Field */}
                                    <div className="space-y-2">
                                        <label className="block text-sm font-medium text-gray-700 flex items-center">
                                            <FaLock className="mr-2 text-gray-500" />
                                            Mot de passe*
                                        </label>
                                        <div className="relative">
                                            <input
                                                type={showPassword ? 'text' : 'password'}
                                                name="password"
                                                placeholder="Entrez votre mot de passe"
                                                value={values.password}
                                                onChange={handleChange}
                                                className="w-full px-4 py-3 pr-12 rounded-lg border border-gray-300 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition duration-200"
                                                required
                                            />
                                            <button 
                                                type="button"
                                                className="absolute inset-y-0 right-0 pr-3 flex items-center"
                                                onClick={togglePasswordVisibility}
                                            >
                                                {showPassword ? (
                                                    <FaEyeSlash className="text-gray-500 hover:text-indigo-600 transition duration-200" />
                                                ) : (
                                                    <FaEye className="text-gray-500 hover:text-indigo-600 transition duration-200" />
                                                )}
                                            </button>
                                        </div>
                                        <div className="flex items-center justify-between mt-2">
                                            <span className={`text-xs font-medium px-2 py-1 rounded ${
                                                passwordStrength === 'Fort' ? 'bg-green-100 text-green-700' : 
                                                passwordStrength === 'Moyen' ? 'bg-yellow-100 text-yellow-700' : 
                                                passwordStrength === 'Faible' ? 'bg-red-100 text-red-700' : 'bg-gray-100 text-gray-500'
                                            }`}>
                                                {passwordStrength ? `Sécurité: ${passwordStrength}` : 'Sécurité'}
                                            </span>
                                            <span className="text-xs text-gray-500">
                                                {passwordValid ? (
                                                    <span className="flex items-center text-green-600 font-medium">
                                                        <FaCheck className="mr-1" /> Valide
                                                    </span>
                                                ) : (
                                                    "8+ car., maj., chiffre, spécial"
                                                )}
                                            </span>
                                        </div>
                                    </div>
                                    
                                    {/* Confirm Password Field */}
                                    <div className="space-y-2">
                                        <label className="block text-sm font-medium text-gray-700 flex items-center">
                                            <FaShieldAlt className="mr-2 text-gray-500" />
                                            Confirmez le mot de passe*
                                        </label>
                                        <div className="relative">
                                            <input
                                                type={showConfirmPassword ? 'text' : 'password'}
                                                name="confirmPassword"
                                                placeholder="Confirmez votre mot de passe"
                                                value={values.confirmPassword}
                                                onChange={handleChange}
                                                className="w-full px-4 py-3 pr-12 rounded-lg border border-gray-300 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition duration-200"
                                                required
                                            />
                                            <button 
                                                type="button"
                                                className="absolute inset-y-0 right-0 pr-3 flex items-center"
                                                onClick={toggleConfirmPasswordVisibility}
                                            >
                                                {showConfirmPassword ? (
                                                    <FaEyeSlash className="text-gray-500 hover:text-indigo-600 transition duration-200" />
                                                ) : (
                                                    <FaEye className="text-gray-500 hover:text-indigo-600 transition duration-200" />
                                                )}
                                            </button>
                                        </div>
                                    </div>
                                </div>
                                
                                {/* Role Field - Radio Buttons */}
                                <div className="space-y-3 pt-2">
                                    <label className="block text-sm font-medium text-gray-700 flex items-center">
                                        <FaUserTie className="mr-2 text-gray-500" />
                                        Rôle professionnel*
                                    </label>
                                    <div className="grid grid-cols-2 gap-4">
                                        <label className={`flex items-center p-4 rounded-lg border-2 transition duration-200 cursor-pointer ${
                                            values.role === 'comptable' 
                                                ? 'border-indigo-500 bg-indigo-50 shadow-sm' 
                                                : 'border-gray-200 hover:border-gray-300'
                                        }`}>
                                            <input
                                                type="radio"
                                                name="role"
                                                value="comptable"
                                                checked={values.role === 'comptable'}
                                                onChange={handleChange}
                                                className="h-4 w-4 text-indigo-600 focus:ring-indigo-500"
                                            />
                                            <div className="ml-3 flex items-center">
                                                <FaUserTie className={`mr-2 text-lg ${
                                                    values.role === 'comptable' ? 'text-indigo-600' : 'text-gray-400'
                                                }`} />
                                                <span className={`text-sm font-medium ${
                                                    values.role === 'comptable' ? 'text-indigo-800' : 'text-gray-700'
                                                }`}>
                                                    Comptable
                                                </span>
                                            </div>
                                        </label>
                                        <label className={`flex items-center p-4 rounded-lg border-2 transition duration-200 cursor-pointer ${
                                            values.role === 'directeur' 
                                                ? 'border-indigo-500 bg-indigo-50 shadow-sm' 
                                                : 'border-gray-200 hover:border-gray-300'
                                        }`}>
                                            <input
                                                type="radio"
                                                name="role"
                                                value="directeur"
                                                checked={values.role === 'directeur'}
                                                onChange={handleChange}
                                                className="h-4 w-4 text-indigo-600 focus:ring-indigo-500"
                                            />
                                            <div className="ml-3 flex items-center">
                                                <FaChartLine className={`mr-2 text-lg ${
                                                    values.role === 'directeur' ? 'text-indigo-600' : 'text-gray-400'
                                                }`} />
                                                <span className={`text-sm font-medium ${
                                                    values.role === 'directeur' ? 'text-indigo-800' : 'text-gray-700'
                                                }`}>
                                                    Directeur financier
                                                </span>
                                            </div>
                                        </label>
                                    </div>
                                </div>
                                
                                {/* Submit Button */}
                                <div className="pt-6">
                                    <button 
                                        type="submit" 
                                        className="w-full py-3 px-4 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-lg transition duration-200 flex items-center justify-center shadow-md hover:shadow-lg"
                                        disabled={loading}
                                    >
                                        {loading ? (
                                            <ClipLoader size={20} color="#ffffff" />
                                        ) : (
                                            <>
                                                <FaShieldAlt className="mr-2" /> 
                                                Créer mon compte
                                            </>
                                        )}
                                    </button>
                                </div>
                            </form>
                        )}
                        
                        <div className="mt-6 text-center">
                            <p className="text-gray-600">
                                Vous avez déjà un compte ?{' '}
                                <Link to="/connexion" className="text-indigo-600 hover:text-indigo-800 font-medium inline-flex items-center">
                                    <FaUser className="mr-1" />
                                    Connectez-vous ici
                                </Link>
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Signup;
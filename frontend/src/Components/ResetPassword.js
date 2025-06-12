import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { FaCheck, FaSpinner, FaEye, FaEyeSlash, FaLock, FaShieldAlt } from 'react-icons/fa';

const ResetPassword = () => {
    const { token } = useParams();
    const navigate = useNavigate();
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [message, setMessage] = useState('');
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [redirectCountdown, setRedirectCountdown] = useState(null);

    const getPasswordStrength = (pwd) => {
        let strength = 0;
        if (pwd.length >= 8) strength++;
        if (/[A-Z]/.test(pwd)) strength++;
        if (/[a-z]/.test(pwd)) strength++;
        if (/[0-9]/.test(pwd)) strength++;
        if (/[^A-Za-z0-9]/.test(pwd)) strength++;
        return strength;
    };

    const passwordStrength = getPasswordStrength(password);
    const strengthColors = ['bg-red-500', 'bg-orange-400', 'bg-yellow-400', 'bg-blue-400', 'bg-green-500'];
    const strengthLabels = ['Très faible', 'Faible', 'Moyen', 'Fort', 'Très fort'];

    const handleSubmit = async (e) => {
        e?.preventDefault();
        
        if (!token) {
            setError('Token invalide ou manquant');
            return;
        }
        
        if (password.length < 8) {
            setError('Le mot de passe doit contenir au moins 8 caractères');
            return;
        }
        if (password !== confirmPassword) {
            setError('Les mots de passe ne correspondent pas');
            return;
        }

        setIsLoading(true);
        setError('');

        try {
            const response = await fetch('http://127.0.0.1:8000/api/reset-password/', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    token,
                    new_password: password,
                    confirm_password: confirmPassword
                }),
            });

            const data = await response.json();

            if (response.ok) {
                setMessage(data.detail || 'Mot de passe modifié avec succès !');
                
                let countdown = 5;
                setRedirectCountdown(countdown);
                
                const countdownInterval = setInterval(() => {
                    countdown--;
                    setRedirectCountdown(countdown);
                    
                    if (countdown <= 0) {
                        clearInterval(countdownInterval);
                        navigate('/connexion');
                    }
                }, 1000);
                
            } else {
                throw new Error(data.detail || 'Erreur lors de la réinitialisation');
            }
        } catch (err) {
            setError(
                err.message || 
                'Une erreur est survenue. Veuillez vérifier votre lien de réinitialisation.'
            );
        } finally {
            setIsLoading(false);
        }
    };

    const isPasswordMatch = confirmPassword && password === confirmPassword;
    const hasPasswordMismatch = confirmPassword && password !== confirmPassword;

    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8 relative overflow-hidden">
            {/* Éléments décoratifs de fond améliorés */}
            <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
                <div className="absolute -top-40 -right-40 w-96 h-96 bg-gradient-to-br from-blue-100 to-indigo-200 rounded-full opacity-40 blur-3xl"></div>
                <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-gradient-to-tr from-indigo-100 to-blue-200 rounded-full opacity-40 blur-3xl"></div>
                <div className="absolute top-1/2 left-1/4 w-64 h-64 bg-gradient-to-r from-purple-100 to-pink-100 rounded-full opacity-30 blur-2xl"></div>
            </div>

            <div className="relative z-10 sm:mx-auto sm:w-full sm:max-w-md px-4">
                <div className="flex justify-center mb-6">
                    <div className="w-20 h-20 bg-gradient-to-br from-blue-600 to-indigo-700 rounded-2xl flex items-center justify-center shadow-lg">
                        <FaLock className="text-white text-3xl" />
                    </div>
                </div>
                <h2 className="text-center text-3xl font-bold text-gray-800 mb-2">
                    Nouveau mot de passe
                </h2>
                <p className="text-center text-gray-600 text-sm">
                    Choisissez un mot de passe sécurisé pour votre compte
                </p>
            </div>

            <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md relative z-10 px-4">
                <div className="bg-white/90 backdrop-blur-sm py-8 px-6 shadow-lg border border-white/30 rounded-xl">
                    {message && (
                        <div className="mb-6 p-4 bg-gradient-to-r from-green-100 to-green-50 border border-green-200 text-green-800 rounded-lg shadow-sm">
                            <div className="flex items-center mb-2">
                                <FaCheck className="mr-3 text-green-600 text-lg" />
                                <span className="font-medium">{message}</span>
                            </div>
                            {redirectCountdown !== null && (
                                <div className="text-sm text-green-700 mt-2 flex items-center justify-between">
                                    <span>Redirection vers la page de connexion...</span>
                                    <div className="flex items-center space-x-2">
                                        <div className="w-6 h-6 rounded-full border-2 border-green-600 flex items-center justify-center">
                                            <span className="text-xs font-bold">{redirectCountdown}</span>
                                        </div>
                                        <button
                                            onClick={() => navigate('/connexion')}
                                            className="text-xs underline hover:no-underline text-green-700 hover:text-green-800"
                                        >
                                            Aller maintenant
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                    
                    {error && (
                        <div className="mb-6 p-4 bg-gradient-to-r from-red-100 to-pink-50 border border-red-200 text-red-800 rounded-lg shadow-sm">
                            <div className="flex items-center">
                                <svg className="w-5 h-5 mr-2 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                                </svg>
                                <span className="font-medium">{error}</span>
                            </div>
                        </div>
                    )}

                    <form className="space-y-6" onSubmit={handleSubmit}>
                        <div>
                            <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                                Nouveau mot de passe
                                <span className="text-red-500 ml-1">*</span>
                            </label>
                            <div className="relative">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                    <FaShieldAlt className="h-5 w-5 text-gray-500" />
                                </div>
                                <input
                                    id="password"
                                    name="password"
                                    type={showPassword ? "text" : "password"}
                                    required
                                    minLength="8"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className="block w-full pl-10 pr-12 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white transition-all duration-200 placeholder-gray-400 shadow-sm"
                                    placeholder="Entrez votre nouveau mot de passe"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute inset-y-0 right-0 pr-3 flex items-center hover:bg-gray-50 rounded-r-lg transition-colors"
                                >
                                    {showPassword ? (
                                        <FaEyeSlash className="h-5 w-5 text-gray-500 hover:text-gray-700" />
                                    ) : (
                                        <FaEye className="h-5 w-5 text-gray-500 hover:text-gray-700" />
                                    )}
                                </button>
                            </div>
                            
                            {password && (
                                <div className="mt-3">
                                    <div className="flex justify-between text-xs text-gray-600 mb-1">
                                        <span>Force du mot de passe</span>
                                        <span className={`font-medium ${
                                            passwordStrength <= 2 ? 'text-red-500' : 
                                            passwordStrength === 3 ? 'text-yellow-500' : 
                                            'text-green-600'
                                        }`}>
                                            {strengthLabels[passwordStrength - 1] || 'Très faible'}
                                        </span>
                                    </div>
                                    <div className="flex space-x-1">
                                        {[1, 2, 3, 4, 5].map((level) => (
                                            <div
                                                key={level}
                                                className={`h-2 flex-1 rounded-full transition-all duration-300 ${
                                                    level <= passwordStrength 
                                                        ? strengthColors[passwordStrength - 1] || 'bg-gray-200'
                                                        : 'bg-gray-200'
                                                }`}
                                            />
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>

                        <div>
                            <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-2">
                                Confirmer le mot de passe
                                <span className="text-red-500 ml-1">*</span>
                            </label>
                            <div className="relative">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                    <FaShieldAlt className="h-5 w-5 text-gray-500" />
                                </div>
                                <input
                                    id="confirmPassword"
                                    name="confirmPassword"
                                    type={showConfirmPassword ? "text" : "password"}
                                    required
                                    minLength="8"
                                    value={confirmPassword}
                                    onChange={(e) => setConfirmPassword(e.target.value)}
                                    className={`block w-full pl-10 pr-12 py-3 border rounded-lg focus:ring-2 bg-white transition-all duration-200 placeholder-gray-400 shadow-sm ${
                                        hasPasswordMismatch 
                                            ? 'border-red-300 focus:border-red-500 focus:ring-red-200' 
                                            : isPasswordMatch 
                                            ? 'border-green-300 focus:border-green-500 focus:ring-green-200'
                                            : 'border-gray-300 focus:border-blue-500 focus:ring-blue-200'
                                    }`}
                                    placeholder="Confirmez votre mot de passe"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                    className="absolute inset-y-0 right-0 pr-3 flex items-center hover:bg-gray-50 rounded-r-lg transition-colors"
                                >
                                    {showConfirmPassword ? (
                                        <FaEyeSlash className="h-5 w-5 text-gray-500 hover:text-gray-700" />
                                    ) : (
                                        <FaEye className="h-5 w-5 text-gray-500 hover:text-gray-700" />
                                    )}
                                </button>
                            </div>
                            
                            {confirmPassword && (
                                <div className="mt-2 text-sm">
                                    {isPasswordMatch ? (
                                        <span className="text-green-600 font-medium flex items-center">
                                            <FaCheck className="mr-1.5" />
                                            Les mots de passe correspondent
                                        </span>
                                    ) : (
                                        <span className="text-red-600 font-medium flex items-center">
                                            <svg className="w-4 h-4 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
                                            </svg>
                                            Les mots de passe ne correspondent pas
                                        </span>
                                    )}
                                </div>
                            )}
                        </div>

                        <div className="pt-2">
                            <button
                                type="submit"
                                disabled={isLoading || !isPasswordMatch || passwordStrength < 2 || redirectCountdown !== null}
                                className={`w-full flex justify-center items-center py-3 px-4 border border-transparent rounded-lg text-base font-medium text-white transition-all duration-200 ${
                                    isLoading || !isPasswordMatch || passwordStrength < 2 || redirectCountdown !== null
                                        ? 'bg-gray-400 cursor-not-allowed'
                                        : 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 shadow-md hover:shadow-lg transform hover:-translate-y-0.5'
                                }`}
                            >
                                {isLoading ? (
                                    <>
                                        <FaSpinner className="animate-spin mr-3 h-4 w-4" />
                                        Modification en cours...
                                    </>
                                ) : redirectCountdown !== null ? (
                                    <>
                                        <FaCheck className="mr-3 h-4 w-4" />
                                        Mot de passe modifié !
                                    </>
                                ) : (
                                    <>
                                        <FaCheck className="mr-3 h-4 w-4" />
                                        Réinitialiser le mot de passe
                                    </>
                                )}
                            </button>
                        </div>
                    </form>

                    <div className="mt-6 pt-6 border-t border-gray-200">
                        <div className="text-sm text-gray-600 space-y-1">
                            <p className="font-medium text-gray-700 mb-2">Conseils pour un mot de passe sécurisé :</p>
                            <ul className="space-y-2">
                                <li className="flex items-start">
                                    <span className={`mr-2 mt-0.5 ${password.length >= 8 ? 'text-green-500' : 'text-gray-400'}`}>
                                        {password.length >= 8 ? '✓' : '○'}
                                    </span>
                                    <span className={password.length >= 8 ? 'text-gray-800' : 'text-gray-600'}>
                                        Au moins 8 caractères
                                    </span>
                                </li>
                                <li className="flex items-start">
                                    <span className={`mr-2 mt-0.5 ${/[A-Z]/.test(password) ? 'text-green-500' : 'text-gray-400'}`}>
                                        {/[A-Z]/.test(password) ? '✓' : '○'}
                                    </span>
                                    <span className={/[A-Z]/.test(password) ? 'text-gray-800' : 'text-gray-600'}>
                                        Une lettre majuscule
                                    </span>
                                </li>
                                <li className="flex items-start">
                                    <span className={`mr-2 mt-0.5 ${/[0-9]/.test(password) ? 'text-green-500' : 'text-gray-400'}`}>
                                        {/[0-9]/.test(password) ? '✓' : '○'}
                                    </span>
                                    <span className={/[0-9]/.test(password) ? 'text-gray-800' : 'text-gray-600'}>
                                        Un chiffre
                                    </span>
                                </li>
                                <li className="flex items-start">
                                    <span className={`mr-2 mt-0.5 ${/[^A-Za-z0-9]/.test(password) ? 'text-green-500' : 'text-gray-400'}`}>
                                        {/[^A-Za-z0-9]/.test(password) ? '✓' : '○'}
                                    </span>
                                    <span className={/[^A-Za-z0-9]/.test(password) ? 'text-gray-800' : 'text-gray-600'}>
                                        Un caractère spécial
                                    </span>
                                </li>
                            </ul>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ResetPassword;
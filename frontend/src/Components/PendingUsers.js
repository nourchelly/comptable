import React, { useState, useEffect, useCallback, useMemo } from 'react';
import axios from 'axios';
import { useUser } from './UserContext';
import { useNavigate } from 'react-router-dom';
import { FaCheckCircle, FaTimesCircle, FaSpinner, FaUsers, FaExclamationTriangle, FaRedo } from 'react-icons/fa';
import Swal from 'sweetalert2';

const PendingUsers = () => {
    const [pendingUsers, setPendingUsers] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);
    const [actionLoading, setActionLoading] = useState({});
    const { user } = useUser();
    const navigate = useNavigate();

    // Base API URL - centralized configuration
    const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://127.0.0.1:8000/api';

    // ✅ Créer l'instance axios avec useMemo pour éviter la recréation
    const apiClient = useMemo(() => {
        const client = axios.create({
            baseURL: API_BASE_URL,
            timeout: 15000,
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            }
        });

        // Add token to requests
        client.interceptors.request.use((config) => {
            const token = localStorage.getItem('auth_token');
            if (token) {
                config.headers.Authorization = `Bearer ${token}`;
            }
            return config;
        });

        // Handle response errors globally
        client.interceptors.response.use(
            (response) => response,
            (error) => {
                if (error.response?.status === 401) {
                    localStorage.removeItem('auth_token');
                    navigate('/connexion');
                    Swal.fire({
                        title: 'Session expirée',
                        text: 'Votre session a expiré. Veuillez vous reconnecter.',
                        icon: 'warning',
                        confirmButtonText: 'Se reconnecter',
                        allowOutsideClick: false
                    });
                }
                return Promise.reject(error);
            }
        );

        return client;
    }, [API_BASE_URL, navigate]); // ✅ Dépendances stables

    // Simplified permission check
    const hasAdminPermissions = useCallback(() => {
        return user && (user.is_superuser === true || user.role === 'admin');
    }, [user]);

    // Simplified token validation
    const validateToken = useCallback(() => {
        const token = localStorage.getItem('auth_token');
        if (!token) return false;

        try {
            const payload = JSON.parse(atob(token.split('.')[1]));
            const now = Math.floor(Date.now() / 1000);
            return payload.exp > now;
        } catch {
            return false;
        }
    }, []);

    // ✅ Fetch pending users avec dépendances correctes
    const fetchPendingUsers = useCallback(async () => {
        if (!hasAdminPermissions()) {
            setError("Accès refusé. Seuls les administrateurs peuvent voir cette page.");
            setIsLoading(false);
            return;
        }

        if (!validateToken()) {
            setError("Token invalide ou expiré. Veuillez vous reconnecter.");
            setIsLoading(false);
            navigate('/connexion');
            return;
        }

        setIsLoading(true);
        setError(null);

        try {
            const response = await apiClient.get('/pending-users/');
            
            if (response.data.success) {
                setPendingUsers(response.data.pending_users || []);
            } else {
                throw new Error(response.data.error || "Erreur lors du chargement des données");
            }
        } catch (err) {
            console.error("Error fetching pending users:", err);
            
            if (err.response?.status === 403) {
                setError("Accès refusé. Vous n'avez pas les permissions d'administrateur.");
            } else if (err.code === 'ECONNABORTED') {
                setError("Le serveur met trop de temps à répondre. Veuillez réessayer.");
            } else if (err.code === 'ERR_NETWORK') {
                setError("Impossible de contacter le serveur. Vérifiez votre connexion.");
            } else {
                setError(err.response?.data?.error || err.message || "Erreur lors du chargement des données");
            }
        } finally {
            setIsLoading(false);
        }
    }, [hasAdminPermissions, validateToken, navigate, apiClient]); // ✅ apiClient est maintenant stable

    // Handle user actions (approve/reject)
    const handleAction = useCallback(async (userId, actionType) => {
        const actionText = actionType === 'approve' ? 'Approuver' : 'Rejeter';
        const actionEndpoint = actionType === 'approve' ? 'approve-user' : 'reject-user';
        let reason = '';

        // Get rejection reason if needed
        if (actionType === 'reject') {
            const { value: rejectReason } = await Swal.fire({
                title: 'Raison du rejet',
                input: 'textarea',
                inputPlaceholder: 'Expliquez pourquoi vous rejetez cet utilisateur...',
                inputAttributes: {
                    'aria-label': 'Raison du rejet',
                    'maxlength': 500
                },
                showCancelButton: true,
                confirmButtonText: 'Rejeter',
                cancelButtonText: 'Annuler',
                confirmButtonColor: '#dc2626',
                inputValidator: (value) => {
                    if (!value || value.trim().length < 10) {
                        return 'Veuillez entrer une raison détaillée (min. 10 caractères)';
                    }
                }
            });

            if (!rejectReason) return;
            reason = rejectReason.trim();
        }

        // Confirm action
        const confirmResult = await Swal.fire({
            title: `${actionText} cet utilisateur ?`,
            text: actionType === 'approve' 
                ? "L'utilisateur recevra un email d'activation." 
                : `Raison : ${reason}`,
            icon: actionType === 'approve' ? 'question' : 'warning',
            showCancelButton: true,
            confirmButtonText: actionText,
            cancelButtonText: 'Annuler',
            confirmButtonColor: actionType === 'approve' ? '#16a34a' : '#dc2626'
        });

        if (!confirmResult.isConfirmed) return;

        // Set loading state for specific user
        setActionLoading(prev => ({ ...prev, [userId]: true }));
        
        try {
            const requestData = actionType === 'reject' ? { reason } : {};
            const response = await apiClient.post(`${actionEndpoint}/${userId}/`, requestData);

            if (response.data.success) {
                await Swal.fire({
                    title: 'Succès !',
                    text: `Utilisateur ${actionText.toLowerCase()} avec succès.`,
                    icon: 'success',
                    timer: 2000,
                    showConfirmButton: false
                });
                
                // Reload the list
                await fetchPendingUsers();
            } else {
                throw new Error(response.data.error || `Échec de l'${actionText.toLowerCase()}`);
            }
        } catch (err) {
            console.error(`Error during ${actionType}:`, err);
            
            let errorMessage = `Erreur lors de l'${actionText.toLowerCase()} de l'utilisateur.`;
            
            if (err.response?.status === 404) {
                errorMessage = "Utilisateur non trouvé ou déjà traité.";
            } else if (err.response?.data?.error) {
                errorMessage = err.response.data.error;
            }
            
            Swal.fire({
                title: 'Erreur !',
                text: errorMessage,
                icon: 'error',
                confirmButtonText: 'OK'
            });
        } finally {
            setActionLoading(prev => ({ ...prev, [userId]: false }));
        }
    }, [apiClient, fetchPendingUsers]);

    // ✅ Initialize component - useEffect se déclenche une seule fois
    useEffect(() => {
        fetchPendingUsers();
    }, [fetchPendingUsers]);

    // Loading state
    if (isLoading && !error) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <div className="text-center">
                    <FaSpinner className="animate-spin text-indigo-600 text-6xl mx-auto mb-4" />
                    <p className="text-gray-700 text-lg">Chargement des utilisateurs en attente...</p>
                    <p className="text-gray-500 text-sm mt-2">Veuillez patienter</p>
                </div>
            </div>
        );
    }

    // Error state
    if (error) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-red-50 p-6">
                <div className="bg-white p-8 rounded-lg shadow-lg text-center max-w-md">
                    <FaExclamationTriangle className="text-red-500 text-5xl mx-auto mb-4" />
                    <h2 className="text-red-800 text-xl font-bold mb-4">Erreur d'accès</h2>
                    <p className="text-red-600 text-base mb-6">{error}</p>
                    
                    <div className="space-y-3">
                        <button
                            onClick={() => {
                                setError(null);
                                fetchPendingUsers();
                            }}
                            className="w-full bg-indigo-600 text-white py-2 px-4 rounded-lg hover:bg-indigo-700 transition duration-200"
                        >
                            Réessayer
                        </button>
                        
                        <button
                            onClick={() => navigate('/connexion')}
                            className="w-full bg-gray-600 text-white py-2 px-4 rounded-lg hover:bg-gray-700 transition duration-200"
                        >
                            Retour à la connexion
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    // Access denied for non-admin users
    if (!hasAdminPermissions()) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-red-50">
                <div className="text-center">
                    <FaExclamationTriangle className="text-red-500 text-6xl mx-auto mb-4" />
                    <h2 className="text-red-800 text-2xl font-bold mb-4">Accès refusé</h2>
                    <p className="text-red-600 mb-6">
                        Vous devez être administrateur pour accéder à cette page.
                    </p>
                    <button
                        onClick={() => navigate('/connexion')}
                        className="bg-red-600 text-white px-6 py-3 rounded-lg hover:bg-red-700 transition duration-200"
                    >
                        Retour à la connexion
                    </button>
                </div>
            </div>
        );
    }

    // Main render
    return (
        <div className="min-h-screen bg-gray-50 p-4 md:p-8">
            <div className="max-w-6xl mx-auto">
                {/* Header */}
                <div className="bg-white p-6 rounded-lg shadow-md mb-6">
                    <div className="flex items-center justify-between flex-wrap gap-4">
                        <h1 className="text-3xl font-bold text-gray-800 flex items-center">
                            <FaUsers className="mr-3 text-indigo-600" />
                            Demandes d'inscription en attente
                            <span className="ml-3 bg-indigo-100 text-indigo-800 px-3 py-1 rounded-full text-lg">
                                {pendingUsers.length}
                            </span>
                        </h1>
                        
                        <button
                            onClick={fetchPendingUsers}
                            className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition duration-200 flex items-center"
                            disabled={isLoading}
                        >
                            <FaRedo className={`mr-2 ${isLoading ? 'animate-spin' : ''}`} />
                            Actualiser
                        </button>
                    </div>
                </div>

                {/* Main content */}
                <div className="bg-white rounded-lg shadow-md overflow-hidden">
                    {pendingUsers.length === 0 ? (
                        <div className="p-12 text-center">
                            <FaUsers className="text-gray-300 text-6xl mx-auto mb-4" />
                            <h3 className="text-xl font-semibold text-gray-600 mb-2">
                                Aucune demande en attente
                            </h3>
                            <p className="text-gray-500">
                                Toutes les demandes d'inscription ont été traitées.
                            </p>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-gray-200">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Utilisateur
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Email
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Rôle demandé
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Date d'inscription
                                        </th>
                                        <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Actions
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-200">
                                    {pendingUsers.map((pendingUser) => (
                                        <tr key={pendingUser.id} className="hover:bg-gray-50">
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="flex items-center">
                                                    <div className="flex-shrink-0 h-10 w-10">
                                                        <div className="h-10 w-10 rounded-full bg-indigo-100 flex items-center justify-center">
                                                            <span className="text-indigo-600 font-semibold text-sm">
                                                                {pendingUser.username.charAt(0).toUpperCase()}
                                                            </span>
                                                        </div>
                                                    </div>
                                                    <div className="ml-4">
                                                        <div className="text-sm font-medium text-gray-900">
                                                            {pendingUser.username}
                                                        </div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="text-sm text-gray-900">{pendingUser.email}</div>
                                                {pendingUser.secondary_emails && pendingUser.secondary_emails.length > 0 && (
                                                    <div className="text-xs text-gray-500">
                                                        +{pendingUser.secondary_emails.length} email(s) secondaire(s)
                                                    </div>
                                                )}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800 capitalize">
                                                    {pendingUser.role}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                {new Date(pendingUser.date_joined).toLocaleDateString('fr-FR', {
                                                    year: 'numeric',
                                                    month: 'long',
                                                    day: 'numeric',
                                                    hour: '2-digit',
                                                    minute: '2-digit'
                                                })}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-center">
                                                <div className="flex justify-center space-x-2">
                                                    <button
                                                        onClick={() => handleAction(pendingUser.id, 'approve')}
                                                        className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 transition duration-200 disabled:opacity-50"
                                                        disabled={actionLoading[pendingUser.id]}
                                                    >
                                                        {actionLoading[pendingUser.id] ? (
                                                            <FaSpinner className="animate-spin mr-1" />
                                                        ) : (
                                                            <FaCheckCircle className="mr-1" />
                                                        )}
                                                        Approuver
                                                    </button>
                                                    <button
                                                        onClick={() => handleAction(pendingUser.id, 'reject')}
                                                        className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 transition duration-200 disabled:opacity-50"
                                                        disabled={actionLoading[pendingUser.id]}
                                                    >
                                                        {actionLoading[pendingUser.id] ? (
                                                            <FaSpinner className="animate-spin mr-1" />
                                                        ) : (
                                                            <FaTimesCircle className="mr-1" />
                                                        )}
                                                        Rejeter
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default PendingUsers;
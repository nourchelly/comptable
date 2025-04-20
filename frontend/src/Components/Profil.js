import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useUser } from './UserContext';
import { useNavigate, Link } from 'react-router-dom';

const UserProfileView = () => {
    const { user, logout } = useUser();
    const [profile, setProfile] = useState(null);
    const [error, setError] = useState(null);
    const navigate = useNavigate();

    useEffect(() => {
        const fetchProfile = async () => {
            if (!user?.id) {
                setError("Utilisateur non connecté");
                return;
            }
            
            try {
                const response = await axios.get(`http://127.0.0.1:8000/api/profiladmin/${user.id}/`, {
                    withCredentials: true
                });
                
                setProfile(response.data);
            } catch (err) {
                console.error("Erreur lors de la récupération du profil:", err);
                setError("Impossible de charger les informations du profil");
            }
        };

        fetchProfile();
    }, [user]);

    const handleDeleteAccount = async () => {
        if (window.confirm("Êtes-vous sûr de vouloir supprimer votre compte ? Cette action est irréversible.")) {
            try {
                const response = await axios.delete(`http://127.0.0.1:8000/api/profiladmin/${user.id}/`, {
                    withCredentials: true
                });
                
                if (response.data.status === 'success') {
                    alert("Votre compte a été supprimé avec succès");
                    logout();
                    navigate('/connexion');
                }
            } catch (err) {
                console.error("Erreur lors de la suppression du compte:", err);
                setError("Impossible de supprimer le compte");
            }
        }
    };

    if (!user) {
        return <div className="alert alert-warning">Veuillez vous connecter pour accéder à votre profil</div>;
    }

    if (error && !profile) {
        return <div className="alert alert-danger">{error}</div>;
    }

    if (!profile) {
        return <div className="spinner-border" role="status"><span className="visually-hidden">Chargement...</span></div>;
    }

    return (
        <div className="container mt-5">
            <div className="row justify-content-center">
                <div className="col-md-8">
                    <div className="card shadow">
                        <div className="card-header bg-primary text-white">
                            <h3 className="mb-0">Mon Profil</h3>
                        </div>
                        <div className="card-body">
                            {error && <div className="alert alert-danger">{error}</div>}
                            
                            <div>
                                <div className="mb-3">
                                    <strong>Nom d'utilisateur:</strong> {profile.username}
                                </div>
                                <div className="mb-3">
                                    <strong>Email:</strong> {profile.email}
                                </div>
                                <div className="mb-3">
                                    <strong>Rôle:</strong> {profile.role}
                                </div>
                                
                                <div className="d-flex justify-content-between">
                                <Link 
                                               to={`/dashboard/edit-profile`}
                                               className="flex items-center justify-center px-6 py-3 bg-white text-indigo-600 rounded-full font-medium hover:bg-indigo-50 transition duration-300"
                                             >
                                              Modifier le profil
                                             </Link>
                                    <button 
                                        className="btn btn-danger" 
                                        onClick={handleDeleteAccount}
                                    >
                                        Supprimer mon compte
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default UserProfileView;
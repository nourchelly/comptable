import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useUser } from './UserContext';
import { useNavigate } from 'react-router-dom';

const UserProfile = () => {
    const { user, logout } = useUser();
    const [profile, setProfile] = useState(null);
    const [editMode, setEditMode] = useState(false);
    const [formData, setFormData] = useState({
        username: '',
        email: ''
    });
    const [error, setError] = useState(null);
    const [success, setSuccess] = useState(null);
    const navigate = useNavigate();

    // Récupérer les données du profil
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
                setFormData({
                    username: response.data.username,
                    email: response.data.email
                });
            } catch (err) {
                console.error("Erreur lors de la récupération du profil:", err);
                setError("Impossible de charger les informations du profil");
            }
        };

        fetchProfile();
    }, [user]);

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData({
            ...formData,
            [name]: value
        });
    };
 
    const handleSubmit = async (e) => {
        e.preventDefault();
        setError(null);
        setSuccess(null);
        
        try {
            const response = await axios.put(`http://127.0.0.1:8000/api/profiladmin/${user.id}/`, formData, {
                withCredentials: true,
                headers: {
                    'Content-Type': 'application/json'
                }
            });
            
            if (response.data.status === 'success') {
                setSuccess("Profil mis à jour avec succès");
                setProfile({
                    ...profile,
                    ...formData
                });
                setEditMode(false);
            }
        } catch (err) {
            console.error("Erreur lors de la mise à jour du profil:", err);
            setError("Impossible de mettre à jour le profil");
        }
    };

    const handleDeleteAccount = async () => {
        if (window.confirm("Êtes-vous sûr de vouloir supprimer votre compte ? Cette action est irréversible.")) {
            try {
                const response = await axios.delete(`http://127.0.0.1:8000/api/profiladmin/${user.id}/`, {
                    withCredentials: true
                });
                
                if (response.data.status === 'success') {
                    alert("Votre compte a été supprimé avec succès");
                    logout(); // Déconnexion de l'utilisateur
                    navigate('/connexion'); // Redirection vers la page de connexion
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
                            {success && <div className="alert alert-success">{success}</div>}
                            
                            {editMode ? (
                                <form onSubmit={handleSubmit}>
                                    <div className="mb-3">
                                        <label className="form-label">Nom d'utilisateur</label>
                                        <input 
                                            type="text" 
                                            className="form-control" 
                                            name="username" 
                                            value={formData.username} 
                                            onChange={handleInputChange} 
                                            required 
                                        />
                                    </div>
                                    <div className="mb-3">
                                        <label className="form-label">Email</label>
                                        <input 
                                            type="email" 
                                            className="form-control" 
                                            name="email" 
                                            value={formData.email} 
                                            onChange={handleInputChange} 
                                            required 
                                        />
                                    </div>
                                    <div className="d-flex justify-content-between">
                                        <button type="submit" className="btn btn-primary">Enregistrer</button>
                                        <button 
                                            type="button" 
                                            className="btn btn-secondary" 
                                            onClick={() => setEditMode(false)}
                                        >
                                            Annuler
                                        </button>
                                    </div>
                                </form>
                            ) : (
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
                                        <button 
                                            className="btn btn-primary" 
                                            onClick={() => setEditMode(true)}
                                        >
                                            Modifier
                                        </button>
                                        <button 
                                            className="btn btn-danger" 
                                            onClick={handleDeleteAccount}
                                        >
                                            Supprimer mon compte
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default UserProfile;
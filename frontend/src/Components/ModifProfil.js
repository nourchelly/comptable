import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useUser } from './UserContext';
import { useNavigate,Link } from 'react-router-dom';
import { motion } from "framer-motion";
import { 
  FaSave, 
  FaTimes
 
} from "react-icons/fa";
const EditProfile = () => {
    const { user } = useUser();
    const [formData, setFormData] = useState({
        username: '',
        email: ''
    });
    const [error, setError] = useState(null);
    const [success, setSuccess] = useState(null);
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
                setTimeout(() => {
                    navigate('/dashboard/profile');
                }, 1500);
            }
        } catch (err) {
            console.error("Erreur lors de la mise à jour du profil:", err);
            setError("Impossible de mettre à jour le profil");
        }
    };

    return (
        <div className="container mt-5">
            <div className="row justify-content-center">
                <div className="col-md-8">
                    <div className="card shadow">
                        <div className="card-header bg-primary text-white">
                            <h3 className="mb-0">Modifier mon Profil</h3>
                        </div>
                        <div className="card-body">
                            {error && <div className="alert alert-danger">{error}</div>}
                            {success && <div className="alert alert-success">{success}</div>}
                            
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
                                <div className="flex justify-end space-x-4 pt-6 border-t border-gray-200">
                <motion.div whileHover={{ scale: 1.05 }}>
                  <Link 
                    to="/dashboard/profile"
                    className="flex items-center px-6 py-3 bg-gray-100 text-gray-700 rounded-lg font-medium hover:bg-gray-200 transition duration-300"
                  >
                    <FaTimes className="mr-2" /> Annuler
                  </Link>
                </motion.div>
                <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                  <button 
                    type="submit"
                    className="flex items-center px-6 py-3 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700 transition duration-300 shadow-md hover:shadow-lg"
                  >
                    <FaSave className="mr-2" /> Enregistrer les modifications
                  </button>
                </motion.div>
              </div>

                            </form>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default EditProfile;
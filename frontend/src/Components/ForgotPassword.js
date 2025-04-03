import React, { useState } from 'react';
import axios from 'axios';
import {  useNavigate } from "react-router-dom";
import { FaEnvelope, FaLock, FaQuestionCircle, FaSpinner } from 'react-icons/fa';
import 'animate.css';


const ForgotPassword = () => {
    const navigate = useNavigate();
    const [email, setEmail] = useState('');
    const [message, setMessage] = useState(null);
    const [error, setError] = useState(null);
    const [isLoading, setIsLoading] = useState(false); // État de chargement

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsLoading(true);
        
        try {
            const response = await axios.post(
                'http://127.0.0.1:8000/api/forgot-password/',
                { email },
                {
                    headers: {
                        'Content-Type': 'application/json',
                        'Accept': 'application/json'
                    },
                    withCredentials: true
                }
            );
            setMessage(response.data.detail);
            setTimeout(() => navigate('/login'), 3000);
        } catch (err) {
            setError(err.response?.data?.detail || "Erreur lors de l'envoi");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className='container d-flex justify-content-center align-items-center vh-100'>
            <div className='row col-lg-8 col-md-10 shadow-lg rounded p-4 animate__animated animate__fadeIn' style={{ backgroundColor: '#ffffff' }}>
                <div className='col-md-6 d-flex align-items-center justify-content-center'>
                    <div className='p-3' style={{ width: '100%' }}>
                        <h3 className='text-start mb-4' style={{ color: '#011BAD', fontFamily: "'Montserrat', sans-serif" }}>
                            <FaQuestionCircle className="me-2" /> Mot de passe oublié
                        </h3>
                        {message && <div className='alert alert-success text-center' role='alert'>{message}</div>}
                        {error && <div className='alert alert-danger text-center' role='alert'>{error}</div>}
                        <form onSubmit={handleSubmit} className='text-start'>
                            <div className='mb-4'>
                                <label htmlFor='email' className='form-label text-muted'>Adresse e-mail</label>
                                <div className='input-group'>
                                    <span className='input-group-text bg-light border-end-0'><FaEnvelope className="text-muted" /></span>
                                    <input 
                                        type='email' 
                                        name='email' 
                                        placeholder='Entrez votre adresse e-mail' 
                                        onChange={(e) => setEmail(e.target.value)}
                                        className='form-control border-start-0' 
                                        required 
                                    />
                                </div>
                            </div>
                            <div className='d-flex justify-content-center mb-4'>
                                <button 
                                    type='submit' 
                                    className='btn text-white d-flex align-items-center justify-content-center' 
                                    style={{ 
                                        backgroundColor: '#011BAD', 
                                        padding: '12px 24px', 
                                        borderRadius: '8px',
                                        transition: 'background-color 0.3s ease'
                                    }}
                                    disabled={isLoading} // Désactiver le bouton pendant le chargement
                                >
                                    {isLoading ? (
                                        <FaSpinner className="me-2 animate-spin" /> // Spinner de chargement
                                    ) : (
                                        <>
                                            <FaLock className='me-2' /> Réinitialiser
                                        </>
                                    )}
                                </button>
                            </div>
                        </form>
                        <div className='text-start mt-3'>
                            <p className='text-muted' style={{ fontFamily: "'Roboto', sans-serif" }}>
                                Vous souvenez-vous de votre mot de passe ? <br />
                                <a href='/login' className='text-primary text-decoration-none fw-bold'>Se connecter</a>
                            </p>
                        </div>
                    </div>
                </div>
                <div className='col-md-6 d-none d-md-block'>
                    <img 
                        src='images/f.png' 
                        alt='Forgot Password' 
                        className='img-fluid rounded-end' 
                        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    />
                </div>
            </div>
        </div>
    );
};

export default ForgotPassword;
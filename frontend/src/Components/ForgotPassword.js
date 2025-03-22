import React, { useState } from 'react';
import axios from 'axios';
import { FaEnvelope, FaLock, FaQuestionCircle } from 'react-icons/fa'; // Ajout de l'icône

const ForgotPassword = () => {
    const [email, setEmail] = useState('');
    const [message, setMessage] = useState(null);
    const [error, setError] = useState(null);

    const handleSubmit = (event) => {
        event.preventDefault();
        axios.post('http://localhost:3000/auth/forgot-password', { email })
            .then(response => {
                setMessage(response.data.message);
                setError(null);
            })
            .catch(err => {
                setError('Une erreur est survenue. Veuillez réessayer.');
                setMessage(null);
            });
    };

    return (
        <div className='container d-flex justify-content-center align-items-center vh-100'>
            <div className='row col-lg-8 col-md-10 shadow-lg rounded p-3' style={{ backgroundColor: '#f8f9fa' }}>
                <div className='col-md-6 d-flex align-items-center justify-content-center'>
                    <div className='p-3' style={{ width: '100%' }}>
                        {/* Ajout de l'icône avant le texte */}
                        <h3 className='text-start' style={{ color: '#011BAD' }}>
                            Mot de passe oublié <FaQuestionCircle className="me-2" /> 
                        </h3>
                        {message && <div className='alert alert-success text-center' role='alert'>{message}</div>}
                        {error && <div className='alert alert-danger text-center' role='alert'>{error}</div>}
                        <form onSubmit={handleSubmit} className='text-start'>
                            <div className='mb-3'>
                                <label htmlFor='email' className='form-label text-muted'>Adresse e-mail</label>
                                <div className='input-group'>
                                    <span className='input-group-text'><FaEnvelope /></span>
                                    <input 
                                        type='email' 
                                        name='email' 
                                        placeholder='Entrez votre adresse e-mail' 
                                        onChange={(e) => setEmail(e.target.value)}
                                        className='form-control' 
                                        required 
                                    />
                                </div>
                            </div>
                            <div className='d-flex justify-content-center mb-3'>
                                <button 
                                    type='submit' 
                                    className='btn text-white d-flex align-items-center justify-content-center' 
                                    style={{ backgroundColor: '#011BAD', padding: '10px', width: '60%' }}
                                >
                                    <FaLock className='me-2' /> Réinitialiser
                                </button>
                            </div>
                        </form>
                        <div className='text-start mt-2'>
                            <p className='text-muted'>Vous souvenez-vous de votre mot de passe ? <br></br>
                                <a href='/login' className='text-primary text-decoration-none'> Se connecter</a>
                            </p>
                        </div>
                    </div>
                </div>
                <div className='col-md-6'>
                    <img 
                        src='images/f.png' 
                        alt='Forgot Password' 
                        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    />
                </div>
            </div>
        </div>
    );
};

export default ForgotPassword;

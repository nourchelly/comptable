import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { FaEye, FaEyeSlash } from 'react-icons/fa';

const Login = () => {
    const [values, setValues] = useState({
        email: '',
        password: ''
    });
    const [role, setRole] = useState('');
    const [error, setError] = useState(null);
    const [showPassword, setShowPassword] = useState(false);
    const navigate = useNavigate();

    useEffect(() => {
        axios.get('http://127.0.0.1:8000/api/csrf/')
            .then(response => {
                console.log("CSRF Token:", response.data.csrfToken);
                axios.defaults.headers.common['X-CSRFToken'] = response.data.csrfToken;
            })
            .catch(error => console.error("Erreur CSRF:", error));
            axios.defaults.withCredentials = true;
        }, []);
 

    const handleSubmit = async (event) => {
        event.preventDefault();
        console.log("Envoi au serveur:", {
            email: values.email,
            password: values.password,
            role: role
          });
        if (!values.email || !values.password || !role) {
            setError("Veuillez remplir tous les champs");
            return;
        }
    
        try {
            const response = await axios.post('http://127.0.0.1:8000/api/login/', {
                email: values.email.trim(),
                password: values.password,
                role: role
            }, {
                headers: {
                    'Content-Type': 'application/json'
                }
            });
            console.log("Réponse du serveur:", response.data);
    
            if (response.data.loginStatus) {
                localStorage.setItem("authToken", response.data.access);
                localStorage.setItem("userRole", response.data.role);
                localStorage.setItem("userId", response.data.user_id);
                switch(response.data.role) {
                    case 'admin': navigate('/dashboard'); break;
                    case 'comptable': navigate('/dashboardcomptable'); break;
                    case 'directeur': navigate('/dashboarddirecteur'); break;
                    default: navigate('/');
                }
            } else {
                setError(response.data.Error || "Erreur de connexion");
            }
        } catch (err) {
            console.error("Détails erreur:", err.response?.data);
            setError(err.response?.data?.Error || "Le serveur ne répond pas");
        }
    };

    const reachGoogle = () => {
        const ClientID = "568574926215-avudpdrdvbm00nhhe695ufft3gmndhfp.apps.googleusercontent.com";
        const CallBackURI = "http://localhost:3000/";
        window.location.replace("");
    };

    const togglePasswordVisibility = () => {
        setShowPassword(!showPassword);
    };

    const handleForgotPassword = () => {
        navigate('/forgot-password');
    };

    const handleRoleChange = (selectedRole) => {
        setRole(role === selectedRole ? '' : selectedRole);
    };

    return (
        <div className='container d-flex justify-content-center align-items-center vh-100'>
            <div className='row shadow-lg rounded p-4' style={{ maxWidth: '900px', backgroundColor: '#f8f9fa' }}>
                <div className='col-md-5 d-none d-md-flex align-items-center justify-content-center'>
                    <img 
                        src="images/login.png" 
                        alt="illustration comptable" 
                        className="img-fluid rounded" 
                        style={{ maxWidth: '110%', height: '400px' }} 
                    />
                </div>

                <div className='col-md-7'>
                    <div className='p-4'>
                        <h3 className='text-center' style={{ color: '#0056b3' }}>Connexion</h3>
                        {error && <div className="alert alert-danger text-center" role="alert">{error}</div>}
                        <form onSubmit={handleSubmit} className='text-center'>
                            <div className='mb-3 text-start'>
                                <label htmlFor='email' className='form-label text-muted'>Adresse e-mail</label>
                                <input 
                                    type='email'
                                    name='email'
                                    autoComplete='off' 
                                    placeholder="Entrez votre adresse e-mail" 
                                    onChange={(e) => setValues({ ...values, email: e.target.value })}
                                    className='form-control' 
                                    required
                                />
                            </div>
                            <div className='mb-3 text-start'>
                                <label htmlFor='password' className='form-label text-muted'>Votre mot de passe</label>
                                <div className="input-group">
                                    <input 
                                        type={showPassword ? 'text' : 'password'} 
                                        name='password' 
                                        placeholder='Entrez votre mot de passe'
                                        onChange={(e) => setValues({ ...values, password: e.target.value })}
                                        className='form-control' 
                                    />
                                    <span 
                                        className="input-group-text bg-light border" 
                                        style={{ cursor: 'pointer' }} 
                                        onClick={togglePasswordVisibility}
                                    >
                                        {showPassword ? <FaEyeSlash /> : <FaEye />}
                                    </span>
                                </div>
                            </div>

                            <div className="mb-3 text-start">
                                <label className="form-label text-muted">Choisir la profession</label>
                                <div className="d-flex justify-content-start" style={{ gap: '10px', flexWrap: 'nowrap' }}>
                                    <div className="form-check" style={{ width: 'auto' }}>
                                        <input 
                                            type="checkbox" 
                                            className="form-check-input" 
                                            id="admin" 
                                            checked={role === 'admin'}
                                            onChange={() => handleRoleChange('admin')}
                                        />
                                        <label className="form-check-label" htmlFor="admin">
                                            Administrateur
                                        </label>
                                    </div>
                                    <div className="form-check" style={{ width: 'auto' }}>
                                        <input 
                                            type="checkbox" 
                                            className="form-check-input" 
                                            id="comptable" 
                                            checked={role === 'comptable'}
                                            onChange={() => handleRoleChange('comptable')}
                                        />
                                        <label className="form-check-label" htmlFor="comptable">
                                            Comptable
                                        </label>
                                    </div>
                                    <div className="form-check" style={{ width: 'auto' }}>
                                        <input 
                                            type="checkbox" 
                                            className="form-check-input" 
                                            id="directeur" 
                                            checked={role === 'directeur'}
                                            onChange={() => handleRoleChange('directeur')}
                                        />
                                        <label className="form-check-label" htmlFor="directeur">
                                            Directeur Financier
                                        </label>
                                    </div>
                                </div>
                            </div>

                            <div className="mb-3 text-end">
                                <button 
                                    onClick={handleForgotPassword} 
                                    className="text-primary text-decoration-none bg-transparent border-0"
                                    type="button"
                                >
                                    Mot de passe oublié ?
                                </button>
                            </div>
                            <div className='text-center my-3'>
                                <p className='text-muted'><span>OU</span></p>
                            </div>

                            <div className="mb-3 d-flex flex-column">
                                <button 
                                    className="btn mb-2 text-dark border d-flex align-items-center justify-content-center" 
                                    style={{ 
                                        backgroundColor: 'transparent', 
                                        outline: 'none', 
                                        boxShadow: 'none', 
                                        borderColor: '#dee2e6', 
                                        color: '#000', 
                                        transition: 'none'
                                    }}
                                >
                                    <img src="images/google-logo.png" alt="Logo Google" style={{ width: '20px', marginRight: '10px' }} />
                                    Continuer avec Google
                                </button>

                                <button 
                                    className="btn mb-3 text-dark border d-flex align-items-center justify-content-center" 
                                    style={{ 
                                        backgroundColor: 'transparent', 
                                        outline: 'none', 
                                        boxShadow: 'none', 
                                        borderColor: '#dee2e6', 
                                        color: '#000', 
                                        transition: 'none'
                                    }}
                                >
                                    <img src="images/mail-logo.png" alt="Logo Mail" style={{ width: '20px', marginRight: '10px' }} />
                                    S'inscrire avec un e-mail
                                </button>
                            </div>

                            <button 
                                type="submit" 
                                className='btn text-white' 
                                style={{ backgroundColor: '#0056b3', padding: '10px', width: '200px' }}
                            >
                                Se connecter
                            </button>
                        </form>

                        <div className='text-start mt-3'>
                            <p className='text-muted'>Vous n'avez pas de compte ? 
                                <a href="/signup" className="text-primary text-decoration-none"> S'inscrire</a>
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Login;
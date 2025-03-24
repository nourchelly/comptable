import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { FaEye, FaEyeSlash } from 'react-icons/fa';


const Login = () => {
    const [values, setValues] = useState({
        username: '',
        email: '',
        password: '',
    });
    const [role, setRole] = useState(''); // état pour gérer le rôle sélectionné
    const [error, setError] = useState(null);
    const [showPassword, setShowPassword] = useState(false);
    const navigate = useNavigate();

    axios.defaults.withCredentials = true;

    const handleSubmit = (event) => {
        event.preventDefault();
        const data = { ...values, role }; // Ajout du rôle dans les données envoyées
        axios.post('http://127.0.0.1:8000/api/login/', data)
            .then(result => {
                if (result.data.loginStatus) {
                    localStorage.setItem("valid", true);
                    localStorage.setItem("token", result.data.access);
                    
                    // Redirection en fonction du rôle
                    if (role === 'admin') {
                        navigate('/dashboard');
                    } else if (role === 'comptable') {
                        navigate('/dashboard_comptable');
                    } else if (role === 'directeur') {
                        navigate('/dashboard_directeur');
                    }
                } else {
                    setError(result.data.Error);
                }
            })
            .catch(err => console.log(err));
    };

    const togglePasswordVisibility = () => {
        setShowPassword(!showPassword);
    };

    const handleForgotPassword = () => {
        navigate('/forgot-password');
    };

    const handleRoleChange = (selectedRole) => {
        // Si on clique sur un rôle, on l'assigne et on désélectionne les autres
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
                                <label htmlFor='name' className='form-label text-muted'>Nom d'utilisateur ou adresse e-mail</label>
                                <input 
                                    type='text' 
                                    name='name' 
                                    autoComplete='off' 
                                    placeholder="Entrez votre nom d'utilisateur ou adresse e-mail" 
                                    onChange={(e) => setValues({ ...values, name: e.target.value })}
                                    className='form-control' 
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

                            {/* Rôles en checkbox sur la même ligne, mais on les gère de façon exclusive */}
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
    transition: 'none' // Désactiver les transitions
  }}
  onFocus={(e) => {
    e.target.style.backgroundColor = 'transparent';
    e.target.style.color = '#000';
  }}
  onMouseDown={(e) => {
    e.target.style.backgroundColor = 'transparent';
    e.target.style.color = '#000';
  }}
  onMouseUp={(e) => {
    e.target.style.backgroundColor = 'transparent';
    e.target.style.color = '#000';
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
    transition: 'none' // Désactiver les transitions
  }}
  onFocus={(e) => {
    e.target.style.backgroundColor = 'transparent';
    e.target.style.color = '#000';
  }}
  onMouseDown={(e) => {
    e.target.style.backgroundColor = 'transparent';
    e.target.style.color = '#000';
  }}
  onMouseUp={(e) => {
    e.target.style.backgroundColor = 'transparent';
    e.target.style.color = '#000';
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

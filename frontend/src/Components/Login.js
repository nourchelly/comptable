import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import axios from 'axios';
import { FaEye, FaEyeSlash } from 'react-icons/fa';
import { useUser } from './UserContext';

const Login = () => {
    const [values, setValues] = useState({
        email: '',
        password: ''
    });
    const [role, setRole] = useState('');
    const [error, setError] = useState(null);
    const [showPassword, setShowPassword] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const navigate = useNavigate();
    const location = useLocation();
    const { login } = useUser();

    const handleSubmit = async (event) => {
        event.preventDefault();
        setIsLoading(true);
        
        if (!values.email || !values.password || !role) {
            setError("Veuillez remplir tous les champs");
            setIsLoading(false);
            return;
        }

        try {
            const response = await axios.post('http://127.0.0.1:8000/api/login/', {
                email: values.email.trim().toLowerCase(),
                password: values.password,
                role: role
            }, {
                withCredentials: true, // Important pour les cookies de session
                headers: {
                    'Content-Type': 'application/json'
                }
            });

            if (response.data.status === 'success') {
                const userData = {
                    id: response.data.user.id,
                    email: response.data.user.email,
                    username: response.data.user.username,
                    role: response.data.user.role
                };
                
                // Mise à jour du contexte
                login(userData);
                
                // Stockage minimal dans sessionStorage
                sessionStorage.setItem('userRole', userData.role);
                sessionStorage.setItem('userId', userData.id);

                // Redirection vers la page demandée ou le dashboard par défaut
                const redirectPath = location.state?.from || getDashboardByRole(userData.role);
                navigate(redirectPath, { replace: true });
            }
        } catch (err) {
            let errorMsg = "Erreur de connexion";
            if (err.response?.status === 401) {
                errorMsg = "Identifiants incorrects";
            } else if (err.response?.status === 403) {
                errorMsg = "Accès refusé pour ce rôle";
            }
            setError(errorMsg);
        } finally {
            setIsLoading(false);
        }
    };

    const getDashboardByRole = (role) => {
        const routes = {
            'admin': '/dashboard',
            'comptable': '/dashboardcomptable', 
            'directeur': '/dashboarddirecteur'
        };
        return routes[role] || '/';
    };

    const reachGoogle = () => {
        const clientID = "11479995049-09n7oceljn4sgmodv5til5uj7bd072jp.apps.googleusercontent.com";
        const redirectURI = encodeURIComponent("http://localhost:3000/auth/google/callback");
        const scope = encodeURIComponent("email profile");
        const accessType = "offline";
        const prompt = "consent";
        const authURL = `https://accounts.google.com/o/oauth2/v2/auth?response_type=code&client_id=${clientID}&redirect_uri=${redirectURI}&scope=${scope}&access_type=${accessType}&prompt=${prompt}`;
        
        window.location.href = authURL;
    };
    const reachFacebook = () => {
        const clientID = "3737484549889496"; // Vérifiez que cet ID est correct
        const redirectURI = encodeURIComponent("http://localhost:3000/auth/facebook/callback");
        const scope = encodeURIComponent("public_profile email"); // Ordre important
        const authURL = `https://www.facebook.com/v18.0/dialog/oauth?client_id=${clientID}&redirect_uri=${redirectURI}&scope=${scope}&response_type=code`;
        
        window.location.href = authURL;
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
                        {error && <div className="alert alert-danger text-center">{error}</div>}
                        <form onSubmit={handleSubmit} className='text-center'>
                            <div className='mb-3 text-start'>
                                <label className='form-label text-muted'>Adresse e-mail</label>
                                <input 
                                    type='email'
                                    placeholder="Entrez votre adresse e-mail" 
                                    onChange={(e) => setValues({ ...values, email: e.target.value })}
                                    className='form-control' 
                                    required
                                />
                            </div>
                            <div className='mb-3 text-start'>
                                <label className='form-label text-muted'>Votre mot de passe</label>
                                <div className="input-group">
                                    <input 
                                        type={showPassword ? 'text' : 'password'} 
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
                                <div className="d-flex justify-content-start" style={{ gap: '10px' }}>
                                    {['admin', 'comptable', 'directeur'].map((r) => (
                                        <div key={r} className="form-check" style={{ width: 'auto' }}>
                                            <input 
                                                type="checkbox" 
                                                className="form-check-input" 
                                                id={r} 
                                                checked={role === r}
                                                onChange={() => handleRoleChange(r)}
                                            />
                                            <label className="form-check-label" htmlFor={r}>
                                                {r === 'admin' ? 'Administrateur' : r === 'comptable' ? 'Comptable' : 'Directeur Financier'}
                                            </label>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <div className="mb-3 text-end">
                                <button onClick={handleForgotPassword} type="button" className="btn btn-link p-0">Mot de passe oublié ?</button>
                            </div>

                            <div className='text-center my-3'>
                                <p className='text-muted'><span>OU</span></p>
                            </div>

                            <div className="mb-3 d-flex flex-column">
                                <button className="btn mb-2 border d-flex align-items-center justify-content-center" onClick={reachGoogle}>
                                    <img src="images/google-logo.png" alt="Google" style={{ width: '20px', marginRight: '10px' }} />
                                    Continuer avec Google
                                </button>
                                <button className="btn mb-3 border d-flex align-items-center justify-content-center" onClick={reachFacebook}>
                                    <img src="images/facebook.png" alt="Facebbok" style={{ width: '20px', marginRight: '10px' }} />
                                    Continuer avec Facebook
                                </button>
                            </div>

                            <button type="submit" className='btn text-white' style={{ backgroundColor: '#0056b3', width: '200px' }}>
                                Se connecter
                            </button>
                        </form>

                        <div className='text-start mt-3'>
                            <p className='text-muted'>
                                Vous n'avez pas de compte ? 
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
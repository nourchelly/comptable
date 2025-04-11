import React, { useState } from 'react';
import axios from 'axios';
import { Link, useNavigate } from 'react-router-dom';
import { FaEye, FaEyeSlash } from 'react-icons/fa';
import { ClipLoader } from 'react-spinners';

const Signup = () => {
    const [values, setValues] = useState({
        username: '',
        email: '',
        password: '',
        confirmPassword: '',
        role: 'comptable'
    });

    const [error, setError] = useState('');
    const [passwordValid, setPasswordValid] = useState(false);
    const [passwordStrength, setPasswordStrength] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    
    const navigate = useNavigate();

    // Fonction pour récupérer le token CSRF depuis les cookies
 

    const handleChange = (e) => {
        const { name, value } = e.target;
        setValues(prevState => ({
            ...prevState,
            [name]: value 
        }));

        if (name === "password") {
            validatePassword(value);
        }
    };

    const validatePassword = (password) => {
        const passwordRegEx = /^(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*])[A-Za-z\d!@#$%^&*]{8,}$/;
        setPasswordValid(passwordRegEx.test(password));

        const lengthCriteria = password.length >= 8;
        const numberCriteria = /[0-9]/.test(password);
        const specialCharCriteria = /[!@#$%^&*]/.test(password);
        const uppercaseCriteria = /[A-Z]/.test(password);

        if (lengthCriteria && numberCriteria && specialCharCriteria && uppercaseCriteria) {
            setPasswordStrength('Fort');
        } else if (lengthCriteria && (numberCriteria || specialCharCriteria)) {
            setPasswordStrength('Moyen');
        } else {
            setPasswordStrength('Faible');
        }
    };

    const handleSubmit = async (event) => {
        event.preventDefault();
        
        setLoading(true);
        setError('');

        // Validation côté client
        if (values.password !== values.confirmPassword) {
            setError("Les mots de passe ne correspondent pas !");
            setLoading(false);
            return;
        }
        if (!passwordValid) {
            setError("Le mot de passe doit contenir 8 caractères minimum, une majuscule, un chiffre et un caractère spécial");
            setLoading(false);
            return;
        }
    
        const userData = {
            username: values.username,
            email: values.email,
            password: values.password,
            confirmPassword: values.confirmPassword,
            role: values.role,
        };
        axios.defaults.withCredentials = true;

        try {
            const response = await axios.post('http://127.0.0.1:8000/api/signup/', userData, {
                headers: { 
                    'Content-Type': 'application/json',
                },
                withCredentials: true,
            });
        
            if (response.status === 200 || response.status === 201) {
                alert("Votre compte a été créé avec succès !");
                navigate('/login');
            } else {
                setError(response.data?.error || "Une erreur s'est produite.");
            }
        } catch (error) {
            console.error("Erreur d'inscription:", error);
            
            if (error.response) {
                // Erreur spécifique côté backend
                setError(error.response.data?.error || "Erreur inconnue");
            } else {
                setError("Problème de connexion au serveur");
            }
        }
        
         finally {
            setLoading(false);
        }
    };

    const togglePasswordVisibility = () => {
        setShowPassword(!showPassword);
    };

    const toggleConfirmPasswordVisibility = () => {
        setShowConfirmPassword(!showConfirmPassword);
    };

    return (
        <div className="container d-flex justify-content-center align-items-center vh-100">
            <div className="row shadow-lg rounded p-3" style={{ maxWidth: '940px', backgroundColor: '#f8f9fa' }}>
                <div className="col-md-7">
                    <div className="p-4">
                        <h3 className="text-center" style={{ color: '#1D3557' }}>Créer un compte individuel !</h3>
                        {error && <div className="alert alert-danger text-center" role="alert">{error}</div>}
                        <form onSubmit={handleSubmit} className="text-center">
                            {/* Champ Nom d'utilisateur */}
                            <div className="mb-3 text-start">
                                <label htmlFor="username" className="form-label text-muted">Nom d'utilisateur*</label>
                                <input
                                    type="text"
                                    name="username"
                                    autoComplete="off"
                                    placeholder="Entrez votre nom"
                                    value={values.username}
                                    onChange={handleChange}
                                    className="form-control"
                                    required
                                />
                            </div>
                            {/* Champ Email */}
                            <div className="mb-3 text-start">
                                <label htmlFor="email" className="form-label text-muted">Email*</label>
                                <input
                                    type="email"
                                    name="email"
                                    autoComplete="off"
                                    placeholder="Entrez votre email"
                                    value={values.email}
                                    onChange={handleChange}
                                    className="form-control"
                                    required
                                />
                            </div>
                            {/* Champ Role */}
                            <div className="mb-3 text-start">
                                <label htmlFor="role" className="form-label text-muted">Profession*</label>
                                <select
                                    name="role"
                                    value={values.role}
                                    onChange={handleChange}
                                    className="form-control"
                                    required
                                >
                                    <option value="comptable" disabled hidden>Sélectionnez votre profession</option>
                                    <option value="comptable">Comptable</option>
                                    <option value="directeur">Directeur financier</option>
                                </select>
                            </div>
                            {/* Champ Mot de passe */}
                            <div className="mb-3 text-start">
                                <label htmlFor="password" className="form-label text-muted">Mot de passe*</label>
                                <div className="input-group">
                                    <input
                                        type={showPassword ? 'text' : 'password'}
                                        name="password"
                                        placeholder="Entrez votre mot de passe"
                                        value={values.password}
                                        onChange={handleChange}
                                        className="form-control"
                                        required
                                    />
                                    <span className="input-group-text bg-light border" style={{ cursor: 'pointer' }} onClick={togglePasswordVisibility}>
                                        {showPassword ? <FaEyeSlash /> : <FaEye />}
                                    </span>
                                </div>
                                <small className={`form-text text-${passwordStrength === 'Fort' ? 'success' : passwordStrength === 'Moyen' ? 'warning' : 'danger'} text-start`}>
                                    Sécurité du mot de passe : {passwordStrength}
                                </small>
                                <small className="form-text text-muted text-start">
                                    Le mot de passe doit contenir au moins 8 caractères, un chiffre et un caractère spécial.
                                </small>
                            </div>
                            {/* Champ Confirmer le mot de passe */}
                            <div className="mb-3 text-start">
                                <label htmlFor="confirmPassword" className="form-label text-muted">Confirmez le mot de passe*</label>
                                <div className="input-group">
                                    <input
                                        type={showConfirmPassword ? 'text' : 'password'}
                                        name="confirmPassword"
                                        placeholder="Confirmez votre mot de passe"
                                        value={values.confirmPassword}
                                        onChange={handleChange}
                                        className="form-control"
                                        required
                                    />
                                    <span className="input-group-text bg-light border" style={{ cursor: 'pointer' }} onClick={toggleConfirmPasswordVisibility}>
                                        {showConfirmPassword ? <FaEyeSlash /> : <FaEye />}
                                    </span>
                                </div>
                            </div>
                            {/* Bouton d'envoi */}
                            <button type="submit" className="btn text-white" style={{ backgroundColor: '#1D3557', padding: '10px', width: '200px' }} disabled={loading}>
                                {loading ? <ClipLoader size={20} color="#ffffff" /> : 'S\'inscrire'}
                            </button>
                        </form>
                        <div className="text-center mt-3">
                            <p className="text-muted">Vous avez déjà un compte ? 
                                <Link to="/login" className="text-primary text-decoration-none"> Connectez-vous ici</Link>
                            </p>
                        </div>
                    </div>
                </div>
                <div className="col-md-5 d-none d-md-flex align-items-center justify-content-center">
                    <img
                        src="images/106375912_10075609.jpg"
                        alt="Accounting Theme"
                        className="img-fluid rounded"
                        style={{ maxWidth: '110%', height: '400px' }}
                    />
                </div>
            </div>
        </div>
    );
};

export default Signup;
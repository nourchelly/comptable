import React, { useState } from 'react';
import axios from 'axios';
import { Link, useNavigate } from 'react-router-dom';
import { FaEye, FaEyeSlash, FaPlus, FaTimes } from 'react-icons/fa';
import { ClipLoader } from 'react-spinners';

const Signup = () => {
    const [values, setValues] = useState({
        username: '',
        email: '',
        password: '',
        confirmPassword: '',
        role: 'comptable',
        secondary_emails: ['']
    });

    const [error, setError] = useState('');
    const [success, setSuccess] = useState(null);
    const [passwordValid, setPasswordValid] = useState(false);
    const [passwordStrength, setPasswordStrength] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    
    const navigate = useNavigate();
      // Ajout des fonctions manquantes
      const togglePasswordVisibility = () => {
        setShowPassword(!showPassword);
    };

    const toggleConfirmPasswordVisibility = () => {
        setShowConfirmPassword(!showConfirmPassword);
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        setValues(prev => ({ ...prev, [name]: value }));

        if (name === "password") {
            validatePassword(value);
        }
    };

    const handleSecondaryEmailChange = (index, value) => {
        const newEmails = [...values.secondary_emails];
        newEmails[index] = value;
        setValues({ ...values, secondary_emails: newEmails });
    };

    const addSecondaryEmail = () => {
        setValues({ ...values, secondary_emails: [...values.secondary_emails, ''] });
    };

    const removeSecondaryEmail = (index) => {
        const newEmails = values.secondary_emails.filter((_, i) => i !== index);
        setValues({ ...values, secondary_emails: newEmails });
    };

    const validatePassword = (password) => {
        const passwordRegEx = /^(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*])[A-Za-z\d!@#$%^&*]{8,}$/;
        setPasswordValid(passwordRegEx.test(password));

        // Calcul de la force du mot de passe
        const length = password.length >= 8;
        const number = /\d/.test(password);
        const specialChar = /[!@#$%^&*]/.test(password);
        const upperCase = /[A-Z]/.test(password);

        if (length && number && specialChar && upperCase) {
            setPasswordStrength('Fort');
        } else if (length && (number || specialChar)) {
            setPasswordStrength('Moyen');
        } else {
            setPasswordStrength('Faible');
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        setSuccess(null);

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

        // Nettoyage des emails secondaires (suppression des vides)
        const cleanSecondaryEmails = values.secondary_emails.filter(email => email.trim() !== '');

        try {
            const response = await axios.post('http://127.0.0.1:8000/api/signup/', {
                username: values.username,
                email: values.email,
                password: values.password,
                confirmPassword: values.confirmPassword,
                role: values.role,
                secondary_emails: cleanSecondaryEmails
            }, {
                headers: { 'Content-Type': 'application/json' }
            });

            if (response.data.success) {
                setSuccess({
                    message: response.data.message,
                    emails: response.data.emails_sent_to
                });
                // Réinitialisation partielle du formulaire
                setValues(prev => ({
                    ...prev,
                    password: '',
                    confirmPassword: '',
                    secondary_emails: ['']
                }));
            } else {
                setError(response.data.error || "Une erreur s'est produite lors de l'inscription.");
            }
        } catch (err) {
            setError(err.response?.data?.error || "Erreur de connexion au serveur");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="container d-flex justify-content-center align-items-center vh-100">
            <div className="row shadow-lg rounded p-3" style={{ maxWidth: '1000px', backgroundColor: '#f8f9fa' }}>
                <div className="col-md-7">
                    <div className="p-4">
                        <h3 className="text-center" style={{ color: '#1D3557' }}>Créer un compte</h3>
                        
                        {error && <div className="alert alert-danger text-center">{error}</div>}
                        
                        {success && (
                            <div className="alert alert-success">
                                <p>{success.message}</p>
                                <p>Emails notifiés :</p>
                                <ul>
                                    {success.emails.map((email, i) => (
                                        <li key={i}>{email}</li>
                                    ))}
                                </ul>
                                <button 
                                    className="btn btn-sm btn-outline-primary"
                                    onClick={() => navigate('/connexion')}
                                >
                                    Aller à la page de connexion
                                </button>
                            </div>
                        )}
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
                            <div className="mb-3 text-start">
                                    <label className="form-label text-muted">
                                        Emails supplémentaires à notifier (optionnel)
                                    </label>
                                    {values.secondary_emails.map((email, index) => (
                                        <div key={index} className="input-group mb-2">
                                            <input
                                                type="email"
                                                value={email}
                                                onChange={(e) => handleSecondaryEmailChange(index, e.target.value)}
                                                className="form-control"
                                                placeholder="email@exemple.com"
                                            />
                                            {values.secondary_emails.length > 1 && (
                                                <button
                                                    type="button"
                                                    className="btn btn-outline-danger"
                                                    onClick={() => removeSecondaryEmail(index)}
                                                >
                                                    <FaTimes />
                                                </button>
                                            )}
                                        </div>
                                    ))}
                                    <button
                                        type="button"
                                        className="btn btn-sm btn-outline-secondary"
                                        onClick={addSecondaryEmail}
                                    >
                                        <FaPlus /> Ajouter un email
                                    </button>
                                    <small className="form-text text-muted">
                                        Ces emails recevront aussi le lien d'activation
                                    </small>
                                </div>

                                <button 
                                    type="submit" 
                                    className="btn text-white" 
                                    style={{ backgroundColor: '#1D3557', padding: '10px', width: '200px' }} 
                                    disabled={loading}
                                >
                                    {loading ? <ClipLoader size={20} color="#ffffff" /> : "S'inscrire"}
                                </button>
                            </form>
                        

                        <div className="text-center mt-3">
                            <p className="text-muted">
                                Vous avez déjà un compte ? 
                                <Link to="/connexion" className="text-primary text-decoration-none"> Connectez-vous ici</Link>
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
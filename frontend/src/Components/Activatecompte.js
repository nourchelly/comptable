import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { ClipLoader } from 'react-spinners';

const ActivateAccount = () => {
    const { token } = useParams();
    const navigate = useNavigate();
    const [message, setMessage] = useState('Activation du compte en cours...');
    const [isSuccess, setIsSuccess] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [redirectCountdown, setRedirectCountdown] = useState(8);
    const [activationStatus, setActivationStatus] = useState(''); // 'pending_approval', 'already_active', 'error'

    useEffect(() => {
        const activateAccount = async () => {
            try {
                const response = await axios.get(`http://127.0.0.1:8000/api/activate/${token}/`);
                setMessage(response.data.message);
                setIsSuccess(true);
                
                // Déterminer le statut selon le message reçu
                if (response.data.message.includes('en attente d\'approbation')) {
                    setActivationStatus('pending_approval');
                    // Pas de redirection automatique, utilisateur doit attendre l'approbation
                } else if (response.data.message.includes('déjà activé')) {
                    setActivationStatus('already_active');
                    // Redirection vers la connexion
                    startRedirectCountdown();
                } else {
                    setActivationStatus('activated');
                    // Compte activé, en attente d'approbation - pas de redirection automatique
                }

            } catch (error) {
                console.error('Activation error:', error);
                setActivationStatus('error');
                
                if (error.response?.status === 400) {
                    const errorMessage = error.response.data?.error || "Échec de l'activation du compte";
                    setMessage(errorMessage);
                    
                    // Gestion spécifique des différents types d'erreurs
                    if (errorMessage.includes('déjà activé')) {
                        setIsSuccess(true);
                        setActivationStatus('already_active');
                        startRedirectCountdown();
                    } else if (errorMessage.includes('expiré')) {
                        setIsSuccess(false);
                        setActivationStatus('expired');
                    } else if (errorMessage.includes('rejeté')) {
                        setIsSuccess(false);
                        setActivationStatus('rejected');
                    } else {
                        setIsSuccess(false);
                    }
                } else {
                    setMessage("Erreur de connexion au serveur. Veuillez réessayer plus tard.");
                    setIsSuccess(false);
                }
            } finally {
                setIsLoading(false);
            }
        };

        if (token) {
            activateAccount();
        } else {
            setMessage("Token d'activation manquant");
            setIsSuccess(false);
            setIsLoading(false);
            setActivationStatus('error');
        }
    }, [token, navigate]);

    const startRedirectCountdown = () => {
        const countdownInterval = setInterval(() => {
            setRedirectCountdown(prev => {
                if (prev <= 1) {
                    clearInterval(countdownInterval);
                    navigate('/connexion');
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);
    };

    const getAlertClass = () => {
        if (isSuccess) {
            if (activationStatus === 'pending_approval' || activationStatus === 'activated') {
                return 'alert-info'; // Bleu pour info
            }
            return 'alert-success'; // Vert pour succès complet
        }
        return 'alert-danger'; // Rouge pour erreur
    };

    const getIconClass = () => {
        switch (activationStatus) {
            case 'pending_approval':
            case 'activated':
                return 'fa fa-hourglass-half text-info';
            case 'already_active':
                return 'fa fa-check-circle text-success';
            case 'expired':
                return 'fa fa-clock text-warning';
            case 'rejected':
                return 'fa fa-times-circle text-danger';
            case 'error':
                return 'fa fa-exclamation-triangle text-danger';
            default:
                return 'fa fa-info-circle text-primary';
        }
    };

    const getButtonText = () => {
        switch (activationStatus) {
            case 'pending_approval':
            case 'activated':
                return 'Compris';
            case 'expired':
                return 'Se réinscrire';
            case 'rejected':
                return 'Contacter le support';
            case 'already_active':
                return 'Aller à la connexion maintenant';
            default:
                return 'Retour à l\'inscription';
        }
    };

    const handleButtonClick = () => {
        switch (activationStatus) {
            case 'pending_approval':
            case 'activated':
                // Rediriger vers une page d'information ou fermer
                navigate('/'); // Page d'accueil ou page d'info
                break;
            case 'expired':
                navigate('/inscription');
                break;
            case 'rejected':
                // Rediriger vers contact ou support
                navigate('/contact');
                break;
            case 'already_active':
                navigate('/connexion');
                break;
            default:
                navigate('/inscription');
                break;
        }
    };

    const getAdditionalInfo = () => {
        switch (activationStatus) {
            case 'pending_approval':
            case 'activated':
                return (
                    <div className="mt-3 p-3 bg-light rounded">
                        <h6><i className="fa fa-info-circle"></i> Prochaines étapes :</h6>
                        <ul className="text-start mb-0">
                            <li>Votre email a été confirmé avec succès</li>
                            <li>Un administrateur doit maintenant approuver votre compte</li>
                            <li>Vous recevrez un email dès que votre compte sera approuvé</li>
                            <li>Vous pourrez alors vous connecter normalement</li>
                        </ul>
                    </div>
                );
            case 'expired':
                return (
                    <div className="mt-3 p-3 bg-warning bg-opacity-10 rounded">
                        <i className="fa fa-clock"></i> Le lien d'activation a une validité de 7 jours. 
                        Veuillez vous réinscrire pour obtenir un nouveau lien.
                    </div>
                );
            case 'rejected':
                return (
                    <div className="mt-3 p-3 bg-danger bg-opacity-10 rounded">
                        <i className="fa fa-envelope"></i> Contactez notre équipe support pour plus d'informations 
                        sur le motif du rejet de votre demande.
                    </div>
                );
            default:
                return null;
        }
    };

    return (
        <div className="container d-flex justify-content-center align-items-center vh-100">
            <div className="card p-4 text-center" style={{ maxWidth: '600px' }}>
                <h3 className="mb-4">
                    <i className={getIconClass()}></i> Activation du compte
                </h3>
                
                {isLoading ? (
                    <div className="text-center">
                        <ClipLoader size={50} color="#1D3557" />
                        <p className="mt-3">Vérification en cours...</p>
                    </div>
                ) : (
                    <>
                        <div className={`alert ${getAlertClass()}`}>
                            {message}
                            {activationStatus === 'already_active' && (
                                <p className="mt-3 mb-0">
                                    <i className="fa fa-clock"></i> Redirection automatique dans {redirectCountdown} seconde{redirectCountdown > 1 ? 's' : ''}...
                                </p>
                            )}
                        </div>

                        {/* Informations additionnelles contextuelles */}
                        {getAdditionalInfo()}
                        
                        {/* Boutons d'action */}
                        <div className="mt-4">
                            <button 
                                className={`btn ${isSuccess && activationStatus !== 'pending_approval' ? 'btn-success' : 'btn-primary'} me-2`}
                                onClick={handleButtonClick}
                            >
                                {getButtonText()}
                            </button>
                            
                            {/* Bouton secondaire pour certains cas */}
                            {(activationStatus === 'expired' || activationStatus === 'error') && (
                                <button 
                                    className="btn btn-outline-secondary"
                                    onClick={() => navigate('/')}
                                >
                                    Retour à l'accueil
                                </button>
                            )}
                        </div>

                        {/* Message d'aide */}
                        {activationStatus === 'pending_approval' && (
                            <div className="mt-3">
                                <small className="text-muted">
                                    <i className="fa fa-question-circle"></i> Questions ? 
                                    <a href="/contact" className="ms-1">Contactez-nous</a>
                                </small>
                            </div>
                        )}
                    </>
                )}
            </div>
        </div>
    );
};

export default ActivateAccount;
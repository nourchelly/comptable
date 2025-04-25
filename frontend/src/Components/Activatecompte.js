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

    useEffect(() => {
        const activateAccount = async () => {
            try {
                const response = await axios.get(`http://127.0.0.1:8000/api/activate/${token}/`);
                setMessage(response.data.message);
                setIsSuccess(true);
                setTimeout(() => navigate('/connexion'), 5000);
            } catch (error) {
                setMessage(error.response?.data?.error || "Échec de l'activation du compte");
                setIsSuccess(false);
            } finally {
                setIsLoading(false);
            }
        };

        activateAccount();
    }, [token, navigate]);

    return (
        <div className="container d-flex justify-content-center align-items-center vh-100">
            <div className="card p-4 text-center" style={{ maxWidth: '500px' }}>
                <h3 className="mb-4">Activation du compte</h3>
                {isLoading ? (
                    <div className="text-center">
                        <ClipLoader size={50} color="#1D3557" />
                        <p className="mt-3">Vérification en cours...</p>
                    </div>
                ) : (
                    <div className={`alert ${isSuccess ? 'alert-success' : 'alert-danger'}`}>
                        {message}
                        {isSuccess && (
                            <p className="mt-3">Redirection automatique vers la page de connexion...</p>
                        )}
                    </div>
                )}
                {!isSuccess && !isLoading && (
                    <button 
                        className="btn btn-primary mt-3"
                        onClick={() => navigate('/inscription')}
                    >
                        Retour à l'inscription
                    </button>
                )}
            </div>
        </div>
    );
};

export default ActivateAccount;
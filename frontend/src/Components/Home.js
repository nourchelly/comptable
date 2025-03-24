import axios from "axios";
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { FaHome, FaEnvelope, FaTools, FaSignInAlt, FaUserPlus, FaChartLine, FaLightbulb, FaComments, FaStar, FaCheck, FaHandshake } from "react-icons/fa";
import 'bootstrap/dist/css/bootstrap.min.css';
import 'animate.css';
import './Home.css';  // Fichier CSS pour les animations personnalisées

const Home = () => {
  const navigate = useNavigate();
  const [homeData, setHomeData] = useState(null);
  const [error, setError] = useState(null);
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    axios
      .get("http://127.0.0.1:8000/api/home/")
      .then((response) => {
        setHomeData(response.data);
        setShowModal(true);
      })
      .catch((err) => {
        setError("Erreur lors de la récupération des données.");
        console.error("Erreur Axios : ", err);
        setShowModal(true);
      });
  }, []);

  return (
    <div className="d-flex flex-column min-vh-100 bg-light">
      {/* Navbar */}
      <nav className="navbar navbar-expand-lg navbar-light bg-white shadow-sm fixed-top">
        <div className="container-fluid">
          <a className="navbar-brand" href="/">
            <span className="fs-4 fw-bold text-primary" style={{ fontFamily: "'Poppins', sans-serif" }}>
              C<span className="text-dark">ompta</span>B<span className="text-dark">OT</span>
            </span>
          </a>
          <div className="collapse navbar-collapse" id="navbarNav">
            <ul className="navbar-nav ms-auto">
              <li className="nav-item">
                <button className="nav-link btn btn-link text-dark d-flex align-items-center" onClick={() => navigate('/home')}>
                  <FaHome className="me-2" /> Accueil
                </button>
              </li>
              <li className="nav-item">
                <button className="nav-link btn btn-link text-dark d-flex align-items-center" onClick={() => navigate('/contact')}>
                  <FaEnvelope className="me-2" /> Contact
                </button>
              </li>
              <li className="nav-item">
                <button className="nav-link btn btn-link text-dark d-flex align-items-center" onClick={() => navigate('/services')}>
                  <FaTools className="me-2" /> Services
                </button>
              </li>
              <li className="nav-item">
                <button className="btn btn-dark px-4 py-2 ms-3 d-flex align-items-center" style={{ backgroundColor: "#04629D", borderColor: "#04629D" }} onClick={() => navigate('/login')}>
                  <FaSignInAlt className="me-2" /> Connexion
                </button>
              </li>
            </ul>
          </div>
        </div>
      </nav>

      {/* Section Hero */}
      <div className="container mt-5 pt-5 d-flex align-items-center animate__animated animate__fadeIn" style={{ minHeight: "80vh" }}>
        <div className="row w-100 align-items-center">
          <div className="col-md-6 text-center">
            <h2 className="fw-bold text-dark animate__animated animate__fadeInUp" style={{ fontFamily: "'Montserrat', sans-serif", fontSize: "2.5rem", textAlign: 'center' }}>
              "Simplifiez votre <br /> comptabilité, <br /> maximisez votre <br /> succès !"
            </h2>
            <p className="text-primary animate__animated animate__fadeInUp" style={{ fontFamily: "'Roboto', sans-serif", fontSize: "1.1rem", textAlign: 'center' }}>
              Découvrez une nouvelle ère de comptabilité avec <br /> l'Intelligence Artificielle !
            </p>
            <p className="text-dark animate__animated animate__fadeInUp" style={{ fontFamily: "'Open Sans', sans-serif", fontSize: "1rem", textAlign: 'center' }}>
              Automatisez vos tâches, analysez vos finances en <br /> temps réel et recevez des recommandations pour <br /> optimiser votre entreprise !
            </p>
            <div className="d-flex justify-content-center mt-4">
              <button className="btn px-4 py-2 text-white animate__animated animate__fadeInUp d-flex align-items-center"
                style={{
                  backgroundColor: "#04629D",
                  borderColor: "#04629D",
                  boxShadow: "0px 4px 6px rgba(0, 0, 0, 0.1)"
                }}
                onClick={() => navigate('/signup')}>
                <FaUserPlus className="me-2" /> Inscription
              </button>
            </div>
          </div>

          <div className="col-md-6 text-center">
            <div className="image-container" style={{
              backgroundColor: "#f8f9fa",
              borderRadius: "15px",
              animation: 'zoomIn 1s ease-in-out'
            }}>
              <img src="images/accueil1.png" alt="Illustration comptabilité" className="img-fluid" style={{
                maxWidth: "700px",
                height: "700px",
              }} />
            </div>
          </div>
        </div>
      </div>

      {/* Section Fonctionnalités */}
      <div className="container my-5 py-5">
        <h2 className="text-center fw-bold mb-5" style={{ fontFamily: "'Poppins', sans-serif", fontSize: "2rem" }}>Nos Fonctionnalités</h2>
        <div className="row">
          <div className="col-md-4 text-center">
            <div className="p-4 bg-white rounded shadow-sm animate__animated animate__fadeInUp">
              <FaChartLine className="text-primary mb-3" size={50} />
              <h5 style={{ fontFamily: "'Montserrat', sans-serif" }}>Analyse en temps réel</h5>
              <p style={{ fontFamily: "'Roboto', sans-serif" }}>Visualisez vos données financières en temps réel.</p>
            </div>
          </div>
          <div className="col-md-4 text-center">
            <div className="p-4 bg-white rounded shadow-sm animate__animated animate__fadeInUp">
              <FaLightbulb className="text-primary mb-3" size={50} />
              <h5 style={{ fontFamily: "'Montserrat', sans-serif" }}>Recommandations intelligentes</h5>
              <p style={{ fontFamily: "'Roboto', sans-serif" }}>Recevez des conseils pour optimiser vos finances.</p>
            </div>
          </div>
          <div className="col-md-4 text-center">
            <div className="p-4 bg-white rounded shadow-sm animate__animated animate__fadeInUp">
              <FaComments className="text-primary mb-3" size={50} />
              <h5 style={{ fontFamily: "'Montserrat', sans-serif" }}>Support 24/7</h5>
              <p style={{ fontFamily: "'Roboto', sans-serif" }}>Notre équipe est disponible pour vous aider.</p>
            </div>
          </div>
        </div>
      </div>

      {/* Section Pourquoi nous choisir ? */}
      <div className="container my-5 py-5 bg-white">
        <h2 className="text-center fw-bold mb-5" style={{ fontFamily: "'Poppins', sans-serif", fontSize: "2rem" }}>Pourquoi nous choisir ?</h2>
        <div className="row">
          <div className="col-md-4 text-center">
            <div className="p-4 bg-light rounded shadow-sm animate__animated animate__fadeInUp">
              <FaCheck className="text-primary mb-3" size={50} />
              <h5 style={{ fontFamily: "'Montserrat', sans-serif" }}>Simplicité</h5>
              <p style={{ fontFamily: "'Roboto', sans-serif" }}>Une interface intuitive pour une prise en main facile.</p>
            </div>
          </div>
          <div className="col-md-4 text-center">
            <div className="p-4 bg-light rounded shadow-sm animate__animated animate__fadeInUp">
              <FaStar className="text-primary mb-3" size={50} />
              <h5 style={{ fontFamily: "'Montserrat', sans-serif" }}>Fiabilité</h5>
              <p style={{ fontFamily: "'Roboto', sans-serif" }}>Des solutions éprouvées par des milliers d'entreprises.</p>
            </div>
          </div>
          <div className="col-md-4 text-center">
            <div className="p-4 bg-light rounded shadow-sm animate__animated animate__fadeInUp">
              <FaHandshake className="text-primary mb-3" size={50} />
              <h5 style={{ fontFamily: "'Montserrat', sans-serif" }}>Engagement</h5>
              <p style={{ fontFamily: "'Roboto', sans-serif" }}>Nous nous engageons à vos côtés pour votre réussite.</p>
            </div>
          </div>
        </div>
      </div>

      {/* Section Témoignages */}
      <div className="container my-5 py-5">
        <h2 className="text-center fw-bold mb-5" style={{ fontFamily: "'Poppins', sans-serif", fontSize: "2rem" }}>Ce que disent nos clients</h2>
        <div className="row">
          <div className="col-md-4 text-center">
            <div className="p-4 bg-white rounded shadow-sm animate__animated animate__fadeInUp">
              <p style={{ fontFamily: "'Roboto', sans-serif" }}>"Une solution révolutionnaire qui a transformé notre gestion financière."</p>
              <p className="text-primary fw-bold">- Jean Dupont</p>
            </div>
          </div>
          <div className="col-md-4 text-center">
            <div className="p-4 bg-white rounded shadow-sm animate__animated animate__fadeInUp">
              <p style={{ fontFamily: "'Roboto', sans-serif" }}>"Un outil indispensable pour toute entreprise moderne."</p>
              <p className="text-primary fw-bold">- Marie Curie</p>
            </div>
          </div>
          <div className="col-md-4 text-center">
            <div className="p-4 bg-white rounded shadow-sm animate__animated animate__fadeInUp">
              <p style={{ fontFamily: "'Roboto', sans-serif" }}>"Le support est réactif et les fonctionnalités sont top !"</p>
              <p className="text-primary fw-bold">- Paul Martin</p>
            </div>
          </div>
        </div>
      </div>

      {/* Pied de page */}
      <footer className="bg-dark text-white mt-auto py-4">
        <div className="container text-center">
          <p style={{ fontFamily: "'Roboto', sans-serif" }}>© 2023 ComptaBOT. Tous droits réservés.</p>
          <div className="d-flex justify-content-center gap-3">
            <a href="/contact" className="text-white text-decoration-underline">Contact</a>
            <a href="/services" className="text-white text-decoration-underline">Services</a>
            <a href="/privacy" className="text-white text-decoration-underline">Politique de confidentialité</a>
          </div>
        </div>
      </footer>

      {/* Modal */}
      <div className={`modal fade ${showModal ? 'show' : ''}`} tabIndex="-1" style={{ display: showModal ? 'block' : 'none' }} aria-hidden={!showModal}>
        <div className="modal-dialog modal-dialog-centered">
          <div className="modal-content rounded-4 shadow-lg">
            <div className="modal-header" style={{ backgroundColor: '#04629D', color: '#fff' }}>
              <h5 className="modal-title">Données récupérées</h5>
              <button type="button" className="btn-close" onClick={() => setShowModal(false)} aria-label="Close"></button>
            </div>
            <div className="modal-body" style={{ backgroundColor: '#f4f6f9' }}>
              {error ? (
                <div className="alert alert-danger">{error}</div>
              ) : (
                <pre style={{ whiteSpace: 'pre-wrap', wordWrap: 'break-word', fontSize: '1rem', color: '#333' }}>
                  {JSON.stringify(homeData, null, 2)}
                </pre>
              )}
            </div>
            <div className="modal-footer">
              <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)} style={{ backgroundColor: "#04629D", borderColor: "#04629D" }}>Fermer</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Home;
import axios from "axios";
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { FaHome, FaEnvelope, FaTools, FaSignInAlt, FaUserPlus, FaChartLine, FaLightbulb, FaComments, FaStar, FaCheck, FaHandshake } from "react-icons/fa";
import 'bootstrap/dist/css/bootstrap.min.css';
import "bootstrap/dist/js/bootstrap.bundle.min";
import 'animate.css';

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
    <div className="d-flex flex-column min-vh-100 bg-light" style={{ paddingTop: "56px" }}>
      {/* Navbar simplifiée */}
      <nav className="navbar navbar-light bg-white shadow-sm fixed-top">
        <div className="container-fluid d-flex justify-content-between align-items-center">
          <a className="navbar-brand" href="/">
            <span className="fs-4 fw-bold" style={{ fontFamily: "'Poppins', sans-serif", color: "#04629D" }}>
              C<span style={{ color: "#000" }}>ompta</span>B<span style={{ color: "#000" }}>OT</span>
            </span>
          </a>
          
          <div className="d-flex gap-3 align-items-center">
            <button 
              className="btn btn-link text-dark d-flex align-items-center p-2" 
              onClick={() => navigate('/home')}
              style={{ border: "none", background: "transparent", textDecoration: "none" }}
            >
              <FaHome className="me-2" /> Accueil
            </button>
            
            <button 
              className="btn btn-link text-dark d-flex align-items-center p-2" 
              onClick={() => navigate('/contact')}
              style={{ border: "none", background: "transparent", textDecoration: "none" }}
            >
              <FaEnvelope className="me-2" /> Contact
            </button>
            
            <button 
              className="btn btn-link text-dark d-flex align-items-center p-2" 
              onClick={() => navigate('/services')}
              style={{ border: "none", background: "transparent", textDecoration: "none" }}
            >
              <FaTools className="me-2" /> Services
            </button>
            
            <button 
              className="btn px-4 py-2 d-flex align-items-center" 
              onClick={() => navigate('/connexion')}
              style={{ 
                backgroundColor: "#04629D", 
                borderColor: "#04629D",
                color: "white"
              }}
            >
              <FaSignInAlt className="me-2" /> Connexion
            </button>
          </div>
        </div>
      </nav>

      {/* Le reste du code reste inchangé */}
      {/* Section Hero */}
      <div className="container d-flex align-items-center" style={{ minHeight: "80vh", paddingTop: "3rem", paddingBottom: "3rem" }}>
        <div className="row w-100 align-items-center">
          <div className="col-md-6 text-center">
            <h2 
              className="fw-bold text-dark animate__animated animate__fadeInUp" 
              style={{ 
                fontFamily: "'Montserrat', sans-serif", 
                fontSize: "2.5rem", 
                textAlign: 'center',
                lineHeight: "1.3",
                marginBottom: "1.5rem"
              }}
            >
              "Simplifiez votre <br /> comptabilité, <br /> maximisez votre <br /> succès !"
            </h2>
            <p 
              className="animate__animated animate__fadeInUp" 
              style={{ 
                fontFamily: "'Roboto', sans-serif", 
                fontSize: "1.1rem", 
                textAlign: 'center',
                color: "#04629D",
                marginBottom: "1rem"
              }}
            >
              Découvrez une nouvelle ère de comptabilité avec <br /> l'Intelligence Artificielle !
            </p>
            <p 
              className="text-dark animate__animated animate__fadeInUp" 
              style={{ 
                fontFamily: "'Open Sans', sans-serif", 
                fontSize: "1rem", 
                textAlign: 'center',
                marginBottom: "2rem"
              }}
            >
              Automatisez vos tâches, analysez vos finances en <br /> temps réel et recevez des recommandations pour <br /> optimiser votre entreprise !
            </p>
            <div className="d-flex justify-content-center mt-4">
              <button 
                className="btn px-4 py-2 text-white animate__animated animate__fadeInUp d-flex align-items-center"
                style={{
                  backgroundColor: "#04629D",
                  borderColor: "#04629D",
                  boxShadow: "0px 4px 6px rgba(0, 0, 0, 0.1)"
                }}
                onClick={() => navigate('/signup')}
              >
                <FaUserPlus className="me-2" /> Inscription
              </button>
            </div>
          </div>

          <div className="col-md-6 text-center animate__animated animate__zoomIn">
            <div 
              style={{
                backgroundColor: "#f8f9fa",
                borderRadius: "15px",
                padding: "1rem",
                display: "inline-block"
              }}
            >
              <img 
                src="images/accueil1.png" 
                alt="Illustration comptabilité" 
                className="img-fluid" 
                style={{
                  maxWidth: "100%",
                  height: "auto"
                }} 
              />
            </div>
          </div>
        </div>
      </div>

      {/* Section Fonctionnalités */}
      <div className="container py-5 my-5">
        <h2 
          className="text-center fw-bold mb-5" 
          style={{ 
            fontFamily: "'Poppins', sans-serif", 
            fontSize: "2rem",
            color: "#212529"
          }}
        >
          Nos Fonctionnalités
        </h2>
        <div className="row">
          {[
            { icon: <FaChartLine size={50} />, title: "Analyse en temps réel", text: "Visualisez vos données financières en temps réel." },
            { icon: <FaLightbulb size={50} />, title: "Recommandations intelligentes", text: "Recevez des conseils pour optimiser vos finances." },
            { icon: <FaComments size={50} />, title: "Support 24/7", text: "Notre équipe est disponible pour vous aider." }
          ].map((feature, index) => (
            <div className="col-md-4 text-center mb-4" key={index}>
              <div 
                className="p-4 bg-white rounded shadow-sm animate__animated animate__fadeInUp" 
                style={{ height: "100%" }}
              >
                <div className="mb-3" style={{ color: "#04629D" }}>{feature.icon}</div>
                <h5 style={{ fontFamily: "'Montserrat', sans-serif" }}>{feature.title}</h5>
                <p style={{ fontFamily: "'Roboto', sans-serif" }}>{feature.text}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Section Pourquoi nous choisir ? */}
      <div className="container py-5 my-5 bg-white">
        <h2 
          className="text-center fw-bold mb-5" 
          style={{ 
            fontFamily: "'Poppins', sans-serif", 
            fontSize: "2rem",
            color: "#212529"
          }}
        >
          Pourquoi nous choisir ?
        </h2>
        <div className="row">
          {[
            { icon: <FaCheck size={50} />, title: "Simplicité", text: "Une interface intuitive pour une prise en main facile." },
            { icon: <FaStar size={50} />, title: "Fiabilité", text: "Des solutions éprouvées par des milliers d'entreprises." },
            { icon: <FaHandshake size={50} />, title: "Engagement", text: "Nous nous engageons à vos côtés pour votre réussite." }
          ].map((reason, index) => (
            <div className="col-md-4 text-center mb-4" key={index}>
              <div 
                className="p-4 bg-light rounded shadow-sm animate__animated animate__fadeInUp" 
                style={{ height: "100%" }}
              >
                <div className="mb-3" style={{ color: "#04629D" }}>{reason.icon}</div>
                <h5 style={{ fontFamily: "'Montserrat', sans-serif" }}>{reason.title}</h5>
                <p style={{ fontFamily: "'Roboto', sans-serif" }}>{reason.text}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Section Témoignages */}
      <div className="container py-5 my-5">
        <h2 
          className="text-center fw-bold mb-5" 
          style={{ 
            fontFamily: "'Poppins', sans-serif", 
            fontSize: "2rem",
            color: "#212529"
          }}
        >
          Ce que disent nos clients
        </h2>
        <div className="row">
          {[
            { text: `"Une solution révolutionnaire qui a transformé notre gestion financière."`, author: "Jean Dupont" },
            { text: `"Un outil indispensable pour toute entreprise moderne."`, author: "Marie Curie" },
            { text: `"Le support est réactif et les fonctionnalités sont top !"`, author: "Paul Martin" }
          ].map((testimonial, index) => (
            <div className="col-md-4 text-center mb-4" key={index}>
              <div 
                className="p-4 bg-white rounded shadow-sm animate__animated animate__fadeInUp" 
                style={{ height: "100%" }}
              >
                <p style={{ fontFamily: "'Roboto', sans-serif" }}>{testimonial.text}</p>
                <p className="fw-bold" style={{ color: "#04629D" }}>- {testimonial.author}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Pied de page */}
      <footer className="bg-dark text-white mt-auto py-4">
        <div className="container text-center">
          <p style={{ fontFamily: "'Roboto', sans-serif", marginBottom: "1rem" }}>
            © {new Date().getFullYear()} ComptaBOT. Tous droits réservés.
          </p>
          <div className="d-flex justify-content-center gap-3">
            <a href="/contact" className="text-white text-decoration-underline">Contact</a>
            <a href="/services" className="text-white text-decoration-underline">Services</a>
            <a href="/privacy" className="text-white text-decoration-underline">Politique de confidentialité</a>
          </div>
        </div>
      </footer>

      {/* Modal */}
      {showModal && (
        <div 
          className="modal-backdrop fade show"
          style={{ zIndex: 1050 }}
        ></div>
      )}
      <div 
        className={`modal fade ${showModal ? 'show d-block' : ''}`} 
        tabIndex="-1" 
        style={{ zIndex: 1060, display: showModal ? 'block' : 'none' }}
      >
        <div className="modal-dialog modal-dialog-centered">
          <div className="modal-content rounded-4 shadow-lg">
            <div className="modal-header" style={{ backgroundColor: '#04629D', color: '#fff' }}>
              <h5 className="modal-title">Données récupérées</h5>
              <button 
                type="button" 
                className="btn-close" 
                onClick={() => setShowModal(false)} 
                aria-label="Close"
                style={{ filter: "invert(1)" }}
              ></button>
            </div>
            <div className="modal-body" style={{ backgroundColor: '#f4f6f9' }}>
              {error ? (
                <div className="alert alert-danger">{error}</div>
              ) : (
                <pre style={{ 
                  whiteSpace: 'pre-wrap', 
                  wordWrap: 'break-word', 
                  fontSize: '1rem', 
                  color: '#333',
                  margin: 0
                }}>
                  {JSON.stringify(homeData, null, 2)}
                </pre>
              )}
            </div>
            <div className="modal-footer">
              <button 
                type="button" 
                className="btn text-white" 
                onClick={() => setShowModal(false)} 
                style={{ 
                  backgroundColor: "#04629D", 
                  borderColor: "#04629D" 
                }}
              >
                Fermer
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Home;
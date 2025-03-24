import React from 'react';
import { useNavigate } from 'react-router-dom';
import { FaHome, FaEnvelope, FaTools, FaRobot, FaChartLine, FaLightbulb } from 'react-icons/fa';
import 'bootstrap/dist/css/bootstrap.min.css';
import 'animate.css';
import './Services.css'; // Fichier CSS pour les styles personnalisés

const Services = () => {
  const navigate = useNavigate();

  return (
    <div className="d-flex flex-column min-vh-100 bg-light">
      {/* Navigation */}
      <nav className="navbar navbar-expand-lg navbar-light bg-white shadow-sm fixed-top">
        <div className="container-fluid">
          <a className="navbar-brand" href="/">
            <span className="fs-4 fw-bold text-primary" style={{ fontFamily: "'Poppins', sans-serif" }}>
              C<span className="text-dark">ompta</span>B<span className="text-dark">OT</span>
            </span>
          </a>
          <button className="navbar-toggler" type="button" data-bs-toggle="collapse" data-bs-target="#navbarNav">
            <span className="navbar-toggler-icon"></span>
          </button>
          <div className="collapse navbar-collapse" id="navbarNav">
            <ul className="navbar-nav ms-auto">
              <li className="nav-item">
                <a className="nav-link d-flex align-items-center" href="/home">
                  <FaHome className="me-2" /> Accueil
                </a>
              </li>
              <li className="nav-item">
                <a className="nav-link active d-flex align-items-center" href="/services">
                  <FaTools className="me-2" /> Services
                </a>
              </li>
              <li className="nav-item">
                <a className="nav-link d-flex align-items-center" href="/contact">
                  <FaEnvelope className="me-2" /> Contact
                </a>
              </li>
            </ul>
          </div>
        </div>
      </nav>

      {/* Section d'Introduction */}
      <div className="container mt-5 pt-5">
        <div className="row justify-content-center">
          <div className="col-md-8 text-center">
            <h1 className="fw-bold mb-4 animate__animated animate__fadeIn" style={{ fontFamily: "'Montserrat', sans-serif", fontSize: "2.5rem" }}>
              Nos Services
            </h1>
            <p className="lead text-muted animate__animated animate__fadeInUp" style={{ fontFamily: "'Roboto', sans-serif" }}>
              Découvrez comment notre solution d'Intelligence Artificielle peut transformer votre comptabilité et booster votre entreprise.
            </p>
          </div>
        </div>
      </div>

      {/* Section des Services */}
      <div className="container my-5">
        <div className="row">
          {[
            {
              icon: <FaRobot className="text-primary mb-3" size={50} />,
              title: "Automatisation de la Comptabilité",
              text: "Optimisez vos processus comptables grâce à l'IA. Automatisez les tâches répétitives et obtenez des résultats précis.",
              color: "#04629D",
            },
            {
              icon: <FaChartLine className="text-primary mb-3" size={50} />,
              title: "Analyse en Temps Réel",
              text: "Suivez vos finances en temps réel avec des rapports automatisés, offrant une vision claire de votre situation.",
              color: "#034a7a",
            },
            {
              icon: <FaLightbulb className="text-primary mb-3" size={50} />,
              title: "Recommandations Personnalisées",
              text: "Recevez des recommandations pour optimiser vos finances et votre stratégie d'entreprise.",
              color: "#02395c",
            },
          ].map((service, index) => (
            <div className="col-md-4 mb-4" key={index}>
              <div className="card h-100 shadow-sm animate__animated animate__fadeInUp" style={{ border: "none", borderRadius: "15px" }}>
                <div className="card-body text-center p-4">
                  <div className="icon-container mb-4" style={{ color: service.color }}>
                    {service.icon}
                  </div>
                  <h5 className="card-title fw-bold mb-3" style={{ fontFamily: "'Montserrat', sans-serif" }}>
                    {service.title}
                  </h5>
                  <p className="card-text text-muted" style={{ fontFamily: "'Roboto', sans-serif" }}>
                    {service.text}
                  </p>
                  <button
                    className="btn btn-primary mt-3"
                    style={{ backgroundColor: service.color, border: "none" }}
                    onClick={() => navigate(`/services/${index + 1}`)}
                  >
                    En savoir plus
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Section CTA (Call to Action) */}
      <div className="container my-5 py-5 bg-white">
        <div className="row justify-content-center">
          <div className="col-md-8 text-center">
            <h2 className="fw-bold mb-4" style={{ fontFamily: "'Montserrat', sans-serif", fontSize: "2rem" }}>
              Prêt à transformer votre comptabilité ?
            </h2>
            <p className="lead text-muted mb-4" style={{ fontFamily: "'Roboto', sans-serif" }}>
              Rejoignez-nous dès aujourd'hui et découvrez comment notre solution peut vous aider.
            </p>
            <button
              className="btn btn-primary px-5 py-3"
              style={{ backgroundColor: "#04629D", border: "none", fontSize: "1.1rem" }}
              onClick={() => navigate('/signup')}
            >
              Commencer Maintenant
            </button>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-dark text-white mt-auto py-4">
        <div className="container text-center">
          <p style={{ fontFamily: "'Roboto', sans-serif" }}>© 2025 ComptaBOT. Tous droits réservés.</p>
          <div className="d-flex justify-content-center gap-3">
            <a href="/contact" className="text-white text-decoration-underline">Contact</a>
            <a href="/services" className="text-white text-decoration-underline">Services</a>
            <a href="/privacy" className="text-white text-decoration-underline">Politique de confidentialité</a>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Services;
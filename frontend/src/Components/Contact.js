import React from 'react';
import { useNavigate } from 'react-router-dom';
import { FaHome, FaEnvelope, FaTools, FaMapMarkerAlt, FaPhone, FaPaperPlane, FaSignInAlt } from 'react-icons/fa';
import 'bootstrap/dist/css/bootstrap.min.css';
import 'animate.css';
import './Contact.css'; // Fichier CSS pour les animations personnalisées

const Contact = () => {
  const navigate = useNavigate();

  return (
    <div className="d-flex flex-column min-vh-100 bg-light" style={{ paddingTop: "56px" }}>
      {/* Navigation Bar simplifiée */}
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
            </div>
            </div>
            </nav>

      {/* Contact Section */}
      <div className="container mt-5 pt-5">
        <h2 className="text-center fw-bold mb-5 animate__animated animate__fadeIn" style={{ fontFamily: "'Montserrat', sans-serif", fontSize: "2.5rem" }}>
          Contactez-Nous
        </h2>
        <div className="row justify-content-center">
          {/* Formulaire de Contact */}
          <div className="col-md-6 mb-5 animate__animated animate__fadeInLeft">
            <form className="bg-white p-4 rounded shadow-sm">
              <div className="mb-3">
                <label htmlFor="name" className="form-label fw-bold">Nom</label>
                <input
                  type="text"
                  className="form-control"
                  id="name"
                  placeholder="Entrez votre nom"
                  required
                />
              </div>
              <div className="mb-3">
                <label htmlFor="email" className="form-label fw-bold">Email</label>
                <input
                  type="email"
                  className="form-control"
                  id="email"
                  placeholder="Entrez votre email"
                  required
                />
              </div>
              <div className="mb-3">
                <label htmlFor="message" className="form-label fw-bold">Message</label>
                <textarea
                  className="form-control"
                  id="message"
                  rows="5"
                  placeholder="Votre message..."
                  required
                ></textarea>
              </div>
              <button
                type="submit"
                className="btn btn-primary w-100 d-flex align-items-center justify-content-center"
                style={{ backgroundColor: "#04629D", borderColor: "#04629D" }}
              >
                <FaPaperPlane className="me-2" /> Envoyer
              </button>
            </form>
          </div>

          {/* Informations de Contact */}
          <div className="col-md-6 mb-5 animate__animated animate__fadeInRight">
            <div className="bg-white p-4 rounded shadow-sm">
              <h3 className="fw-bold mb-4" style={{ fontFamily: "'Montserrat', sans-serif" }}>
                Informations de Contact
              </h3>
              <div className="mb-4">
                <FaMapMarkerAlt className="text-primary me-2" size={20} />
                <span style={{ fontFamily: "'Roboto', sans-serif" }}>
                  123 Rue de l'Innovation, 75001 Paris, France
                </span>
              </div>
              <div className="mb-4">
                <FaPhone className="text-primary me-2" size={20} />
                <span style={{ fontFamily: "'Roboto', sans-serif" }}>
                  +33 1 23 45 67 89
                </span>
              </div>
              <div className="mb-4">
                <FaEnvelope className="text-primary me-2" size={20} />
                <span style={{ fontFamily: "'Roboto', sans-serif" }}>
                  contact@comptabot.com
                </span>
              </div>
            </div>

            {/* Carte Google Maps */}
            <div className="mt-4 rounded shadow-sm overflow-hidden">
              <iframe
                title="Google Maps"
                src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d2624.9916256937595!2d2.292292615674389!3d48.858370079287475!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x47e66e2964e34e2d%3A0x8ddca9ee380ef7e0!2sTour%20Eiffel!5e0!3m2!1sfr!2sfr!4v1623762906787!5m2!1sfr!2sfr"
                width="100%"
                height="300"
                style={{ border: 0 }}
                allowFullScreen
                loading="lazy"
              ></iframe>
            </div>
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

export default Contact;
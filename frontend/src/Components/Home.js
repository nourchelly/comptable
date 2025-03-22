import axios from "axios"
import { useNavigate } from "react-router-dom";
import 'bootstrap/dist/css/bootstrap.min.css';

const Home = () => {
  const navigate = useNavigate();
  axios.defaults.withCredentials = true;

  

  return (
    <div className="d-flex flex-column min-vh-100 bg-light">
      <nav className="navbar navbar-expand-lg navbar-light bg-white shadow-sm fixed-top">
        <div className="container-fluid">
          <a className="navbar-brand" href="/">
            <span className="fs-4 fw-bold text-primary" style={{ fontFamily: "'Baloo Thambi 2', sans-serif" }}>
              C<span className="text-dark">ompta</span>B<span className="text-dark">OT</span>
            </span>
          </a>
          <div className="collapse navbar-collapse" id="navbarNav">
            <ul className="navbar-nav ms-auto">
              <li className="nav-item">
                <button className="nav-link btn btn-link text-dark text-decoration-underline" onClick={() => navigate('/')}>Accueil</button>
              </li>
              <li className="nav-item">
                <button className="nav-link btn btn-link text-dark text-decoration-underline" onClick={() => navigate('/contact')}>Contact</button>
              </li>
              <li className="nav-item">
                <button className="nav-link btn btn-link text-dark text-decoration-underline" onClick={() => navigate('/services')}>Services</button>
              </li>
              <li className="nav-item">
                <button className="btn btn-dark px-4 py-2 ms-3"
                  style={{ backgroundColor: "#04629D", borderColor: "#04629D" }}
                  onClick={() => navigate('/login')}>Connexion</button>
              </li>
            </ul>
          </div>
        </div>
      </nav>

      <div className="container mt-5 pt-5 d-flex align-items-center" style={{ minHeight: "80vh" }}>
        <div className="row w-100 align-items-center">
          <div className="col-md-6 text-center">
            <h2 className="fw-bold text-dark" style={{ fontFamily: "'Montserrat', sans-serif", fontSize: "2.5rem", textAlign: 'center' }}>
              "Simplifiez votre <br /> comptabilité, <br /> maximisez votre <br /> succès !"
            </h2>
            <p className="text-primary" style={{ fontFamily: "'Roboto', sans-serif", fontSize: "1.1rem", textAlign: 'center' }}>
              Découvrez une nouvelle ère de comptabilité avec <br /> l'Intelligence Artificielle !
            </p>
            <p className="text-dark" style={{ fontFamily: "'Open Sans', sans-serif", fontSize: "1rem", textAlign: 'center' }}>
              Automatisez vos tâches, analysez vos finances en <br /> temps réel et recevez des recommandations pour <br /> optimiser votre entreprise !
            </p>
            <div className="d-flex justify-content-center mt-4">
              <button className="btn px-4 py-2 text-white"
                style={{
                  backgroundColor: "#04629D",
                  borderColor: "#04629D",
                  boxShadow: "0px 4px 6px rgba(0, 0, 0, 0.1)"
                }}
                onClick={() => navigate('/signup')}>
                Inscription
              </button>
            </div>
          </div>

          <div className="col-md-6 text-center">
            <div className="image-container" style={{
              backgroundColor: "#f8f9fa", // Le fond de l'interface
              borderRadius: "15px", // Ajout d'une bordure arrondie
            }}>
              <img src="images/accueil1.png" alt="Illustration comptabilité" className="img-fluid" style={{
                maxWidth: "700px", 
                height: "700px", // Pour s'adapter au conteneur
                borderRadius: "15px", // Image avec des bords arrondis
              }} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Home;

import axios from "axios";
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { FaHome, FaEnvelope, FaTools, FaSignInAlt, FaQrcode, FaUserPlus, FaChartLine, FaLightbulb, FaComments, FaStar, FaCheck, FaHandshake } from "react-icons/fa";

const Home = () => {
  const navigate = useNavigate();
  const [homeData, setHomeData] = useState(null);
  const [error, setError] = useState(null);
  const [showModal, setShowModal] = useState(false);



  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Navigation */}
      <nav className="bg-white shadow-md fixed w-full z-10">
        <div className="container mx-auto px-4 py-3 flex justify-between items-center">
          <div className="flex items-center space-x-2">
            <FaQrcode className="text-3xl text-indigo-600" />
            <span className="text-2xl font-bold">
              <span className="text-gray-800">Compta</span>
              <span className="text-indigo-600">BoT</span>
            </span>
          </div>
          
          <div className="hidden md:flex items-center space-x-6">
            <button 
              className="flex items-center text-gray-700 hover:text-indigo-600 transition-colors"
              onClick={() => navigate('/home')}
            >
              <FaHome className="mr-2" /> Accueil
            </button>
            
            <button 
              className="flex items-center text-gray-700 hover:text-indigo-600 transition-colors"
              onClick={() => navigate('/contact')}
            >
              <FaEnvelope className="mr-2" /> Contact
            </button>
            
            <button 
              className="flex items-center text-gray-700 hover:text-indigo-600 transition-colors"
              onClick={() => navigate('/services')}
            >
              <FaTools className="mr-2" /> Services
            </button>
            
            <button 
              className="flex items-center px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
              onClick={() => navigate('/connexion')}
            >
              <FaSignInAlt className="mr-2" /> Connexion
            </button>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-32 pb-20 px-4">
        <div className="container mx-auto flex flex-col md:flex-row items-center">
          <div className="md:w-1/2 mb-12 md:mb-0 text-center md:text-left">
            <h1 className="text-4xl md:text-5xl font-bold text-gray-800 leading-tight mb-6 animate-fade-in-up">
              Simplifiez votre comptabilité, <br className="hidden md:block" />
              maximisez votre succès !
            </h1>
            <p className="text-xl text-indigo-600 mb-6 animate-fade-in-up">
              Découvrez une nouvelle ère de comptabilité avec l'Intelligence Artificielle !
            </p>
            <p className="text-gray-600 mb-8 text-lg animate-fade-in-up">
              Automatisez vos tâches, analysez vos finances en temps réel et recevez des recommandations pour optimiser votre entreprise !
            </p>
            <button 
              className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-3 rounded-lg shadow-md transition-colors flex items-center mx-auto md:mx-0 animate-fade-in-up"
              onClick={() => navigate('/signup')}
            >
              <FaUserPlus className="mr-2" /> Inscription
            </button>
          </div>
          
          <div className="md:w-1/2 animate-zoom-in">
            <div className="bg-gradient-to-br from-indigo-50 to-blue-50 rounded-2xl p-6 inline-block">
              <img 
                src="images/accueil1.png" 
                alt="Illustration comptabilité" 
                className="w-full max-w-md mx-auto" 
              />
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16 bg-white">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center text-gray-800 mb-12">
            Nos Fonctionnalités
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              { icon: <FaChartLine size={40} />, title: "Analyse en temps réel", text: "Visualisez vos données financières en temps réel." },
              { icon: <FaLightbulb size={40} />, title: "Recommandations intelligentes", text: "Recevez des conseils pour optimiser vos finances." },
              { icon: <FaComments size={40} />, title: "Support 24/7", text: "Notre équipe est disponible pour vous aider." }
            ].map((feature, index) => (
              <div 
                key={index}
                className="bg-gray-50 rounded-xl p-8 shadow-sm hover:shadow-md transition-shadow text-center"
              >
                <div className="text-indigo-600 mb-4 flex justify-center">{feature.icon}</div>
                <h3 className="text-xl font-semibold text-gray-800 mb-3">{feature.title}</h3>
                <p className="text-gray-600">{feature.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Why Choose Us Section */}
      <section className="py-16 bg-indigo-50">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center text-gray-800 mb-12">
            Pourquoi nous choisir ?
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              { icon: <FaCheck size={40} />, title: "Simplicité", text: "Une interface intuitive pour une prise en main facile." },
              { icon: <FaStar size={40} />, title: "Fiabilité", text: "Des solutions éprouvées par des milliers d'entreprises." },
              { icon: <FaHandshake size={40} />, title: "Engagement", text: "Nous nous engageons à vos côtés pour votre réussite." }
            ].map((reason, index) => (
              <div 
                key={index}
                className="bg-white rounded-xl p-8 shadow-sm hover:shadow-md transition-shadow text-center"
              >
                <div className="text-indigo-600 mb-4 flex justify-center">{reason.icon}</div>
                <h3 className="text-xl font-semibold text-gray-800 mb-3">{reason.title}</h3>
                <p className="text-gray-600">{reason.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="py-16 bg-white">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center text-gray-800 mb-12">
            Ce que disent nos clients
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              { text: `"Une solution révolutionnaire qui a transformé notre gestion financière."`, author: "Jean Dupont" },
              { text: `"Un outil indispensable pour toute entreprise moderne."`, author: "Marie Curie" },
              { text: `"Le support est réactif et les fonctionnalités sont top !"`, author: "Paul Martin" }
            ].map((testimonial, index) => (
              <div 
                key={index}
                className="bg-gray-50 rounded-xl p-8 shadow-sm hover:shadow-md transition-shadow"
              >
                <p className="text-gray-700 italic mb-4">"{testimonial.text}"</p>
                <p className="font-semibold text-indigo-600">- {testimonial.author}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 bg-indigo-600 text-white">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold mb-6">Prêt à révolutionner votre comptabilité ?</h2>
          <p className="text-xl mb-8 max-w-2xl mx-auto">Rejoignez des milliers d'entreprises qui font confiance à notre solution.</p>
          <button 
            className="bg-white text-indigo-600 hover:bg-gray-100 px-8 py-3 rounded-lg shadow-md font-semibold transition-colors"
            onClick={() => navigate('/signup')}
          >
            Commencer maintenant
          </button>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-800 text-white py-8 mt-auto">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="flex items-center space-x-2 mb-4 md:mb-0">
              <FaQrcode className="text-2xl text-indigo-400" />
              <span className="text-xl font-bold">
                <span>Compta</span>
                <span className="text-indigo-400">BoT</span>
              </span>
            </div>
            
            <div className="flex flex-wrap justify-center gap-4 md:gap-6">
              <a href="/contact" className="hover:text-indigo-300 transition-colors">Contact</a>
              <a href="/services" className="hover:text-indigo-300 transition-colors">Services</a>
              <a href="/privacy" className="hover:text-indigo-300 transition-colors">Politique de confidentialité</a>
            </div>
          </div>
          
          <div className="border-t border-gray-700 mt-6 pt-6 text-center text-gray-400">
            <p>© {new Date().getFullYear()} ComptaBOT. Tous droits réservés.</p>
          </div>
        </div>
      </footer>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl">
            <div className="bg-indigo-600 text-white rounded-t-xl px-6 py-4 flex justify-between items-center">
              <h3 className="text-xl font-semibold">Données récupérées</h3>
              <button 
                onClick={() => setShowModal(false)}
                className="text-white hover:text-gray-200"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            <div className="p-6 max-h-96 overflow-y-auto">
              {error ? (
                <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4">
                  {error}
                </div>
              ) : (
                <pre className="bg-gray-50 p-4 rounded-lg overflow-x-auto text-sm">
                  {JSON.stringify(homeData, null, 2)}
                </pre>
              )}
            </div>
            
            <div className="px-6 py-4 bg-gray-50 rounded-b-xl flex justify-end">
              <button 
                onClick={() => setShowModal(false)}
                className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg transition-colors"
              >
                Fermer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Home;
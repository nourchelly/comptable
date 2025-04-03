import axios from 'axios';
import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { FaUserEdit, FaSave, FaTimes, FaUser, FaAt, FaKey, FaIdBadge } from 'react-icons/fa';

const EditProfil = () => {
  const { id } = useParams();
  const [profil, setProfil] = useState({
    nom: '',
    nomUtilisateur: '',
    email: '',
    motDePasse: ''
  });
  const [initialProfil, setInitialProfil] = useState({});

  const navigate = useNavigate();

  useEffect(() => {
    axios.get(`http://localhost:3000/auth/profil/${id}`)
      .then(result => {
        const profilData = result.data.Result[0];
        setProfil(profilData);
        setInitialProfil(profilData);
      })
      .catch(err => console.log(err));
  }, [id]);

  const handleSubmit = (e) => {
    e.preventDefault();
    axios.put(`http://localhost:3000/auth/modify_profil/${id}`, profil)
      .then(result => {
        if (result.data.Status) {
          navigate('/dashboard/profil');
        } else {
          alert(result.data.Error);
        }
      })
      .catch(err => console.log(err));
  };

  const handleCancel = () => {
    setProfil(initialProfil);
    navigate('/dashboard/profil');
  };

  return (
    <div className="flex">
      {/* Formulaire */}
      <div className="w-full md:w-2/3 p-8">
        <div className="flex items-center justify-start mb-8">
          <FaUserEdit className="text-blue-600 text-2xl mr-3" />
          <h2 className="text-2xl font-bold text-blue-600 text-center">Modifier Profil</h2>
        </div>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Nom */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center">
              <FaIdBadge className="text-blue-500 mr-2" />
              Nom
            </label>
            <div className="mt-1 relative rounded-md shadow-sm">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <FaUser className="text-gray-400" />
              </div>
              <input
                type="text"
                className="focus:ring-blue-500 focus:border-blue-500 block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md"
                placeholder="Entrez votre nom"
                value={profil.nom}
                onChange={(e) => setProfil({ ...profil, nom: e.target.value })}
              />
            </div>
          </div>
          
          {/* Nom d'utilisateur */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center">
              <FaIdBadge className="text-blue-500 mr-2" />
              Nom d'utilisateur
            </label>
            <div className="mt-1 relative rounded-md shadow-sm">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <FaUser className="text-gray-400" />
              </div>
              <input
                type="text"
                className="focus:ring-blue-500 focus:border-blue-500 block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md"
                placeholder="Entrez votre nom d'utilisateur"
                value={profil.nomUtilisateur}
                onChange={(e) => setProfil({ ...profil, nomUtilisateur: e.target.value })}
              />
            </div>
          </div>
          
          {/* Email */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center">
              <FaAt className="text-blue-500 mr-2" />
              Email
            </label>
            <div className="mt-1 relative rounded-md shadow-sm">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <FaAt className="text-gray-400" />
              </div>
              <input
                type="email"
                className="focus:ring-blue-500 focus:border-blue-500 block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md"
                placeholder="Entrez votre email"
                value={profil.email}
                onChange={(e) => setProfil({ ...profil, email: e.target.value })}
              />
            </div>
          </div>
          
          {/* Mot de passe */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center">
              <FaKey className="text-blue-500 mr-2" />
              Mot de passe
            </label>
            <div className="mt-1 relative rounded-md shadow-sm">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <FaKey className="text-gray-400" />
              </div>
              <input
                type="password"
                className="focus:ring-blue-500 focus:border-blue-500 block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md"
                placeholder="Entrez votre mot de passe"
                value={profil.motDePasse}
                onChange={(e) => setProfil({ ...profil, motDePasse: e.target.value })}
              />
            </div>
          </div>
          
          {/* Boutons */}
          <div className="flex justify-end space-x-4 pt-4">
            <button
              type="button"
              onClick={handleCancel}
              className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              <FaTimes className="mr-2 text-red-500" />
              Annuler
            </button>
            <button
              type="submit"
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              <FaSave className="mr-2" />
              Enregistrer
            </button>
          </div>
        </form>
      </div>
      
      {/* Image */}
      <div className="hidden md:flex md:w-1/3 items-center justify-center p-8">
        <div className="relative w-64 h-64 rounded-full overflow-hidden border-4 border-blue-100 shadow-lg transform hover:scale-105 transition-transform duration-300">
          <img 
            src="/images/profil.jpg" 
            alt="Profil" 
            className="w-full h-full object-cover hover:opacity-90 transition-opacity duration-300"
          />
        </div>
      </div>
    </div>
  );
};

export default EditProfil;
import axios from 'axios';
import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { FaExclamationTriangle } from "react-icons/fa";
import "./style.css";

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
    <div className="container mt-5 d-flex justify-content-center align-items-center">
      <div className="col-md-6 p-5 shadow-lg rounded bg-white position-relative text-start" style={{ borderRadius: "20px" }}>
        <h3 className="text-center mb-4" style={{ color: "#011BAD", textDecoration: "underline" }}>
          <FaExclamationTriangle className="me-2 text-danger" /> Modifier Profil
        </h3>
        <form className="row g-3" onSubmit={handleSubmit}>
          <div className="col-12">
            <label className="form-label fw-bold">Nom</label>
            <input
              type="text"
              className="form-control rounded-3"
              placeholder="admin"
              value={profil.nom}
              onChange={(e) => setProfil({ ...profil, nom: e.target.value })}
            />
          </div>
          <div className="col-12">
            <label className="form-label fw-bold">Nom d'utilisateur</label>
            <input
              type="text"
              className="form-control rounded-3"
              placeholder="admin user"
              value={profil.nomUtilisateur}
              onChange={(e) => setProfil({ ...profil, nomUtilisateur: e.target.value })}
            />
          </div>
          <div className="col-12">
            <label className="form-label fw-bold">Email</label>
            <input
              type="email"
              className="form-control rounded-3"
              placeholder="admin@gmail.com"
              value={profil.email}
              onChange={(e) => setProfil({ ...profil, email: e.target.value })}
            />
          </div>
          <div className="col-12">
            <label className="form-label fw-bold">Mot de passe</label>
            <input
              type="password"
              className="form-control rounded-3"
              placeholder=".................."
              value={profil.motDePasse}
              onChange={(e) => setProfil({ ...profil, motDePasse: e.target.value })}
            />
          </div>
          <div className="d-flex justify-content-center gap-3 mt-4">
            <button type="submit" className="btn" style={{ backgroundColor: "#011BAD", borderColor: "#011BAD", color: "white" }}>Enregistrer</button>
            <button type="button" className="btn btn-danger px-4 py-2" onClick={handleCancel}>Annuler</button>
          </div>
        </form>
        <div className="text-center mt-4">
          <img src="/images/profil.jpg" alt="Profil" className="img-fluid mt-3" style={{ width: "150px" }} />
        </div>
      </div>
    </div>
  );
};

export default EditProfil;

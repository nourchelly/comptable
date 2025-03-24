import axios from 'axios';
import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
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
      <div className="col-md-8 p-4 shadow-lg rounded bg-white position-relative d-flex flex-row" style={{ borderRadius: "20px" }}>
        <div className="w-75 text-start">
          <h3 className="text-center mb-4" style={{ color: "#011BAD", textDecoration: "underline" }}>
            Modifier Profil
          </h3>
          <form className="row g-4" onSubmit={handleSubmit}>
            <div className="col-10">
              <label className="form-label fw-bold">Nom</label>
              <input
                type="text"
                className="form-control rounded-3"
                placeholder="admin"
                value={profil.nom}
                onChange={(e) => setProfil({ ...profil, nom: e.target.value })}
              />
            </div>
            <div className="col-10">
              <label className="form-label fw-bold">Nom d'utilisateur</label>
              <input
                type="text"
                className="form-control rounded-3"
                placeholder="admin user"
                value={profil.nomUtilisateur}
                onChange={(e) => setProfil({ ...profil, nomUtilisateur: e.target.value })}
              />
            </div>
            <div className="col-10">
              <label className="form-label fw-bold">Email</label>
              <input
                type="email"
                className="form-control rounded-3"
                placeholder="admin@gmail.com"
                value={profil.email}
                onChange={(e) => setProfil({ ...profil, email: e.target.value })}
              />
            </div>
            <div className="col-10">
              <label className="form-label fw-bold">Mot de passe</label>
              <input
                type="password"
                className="form-control rounded-3"
                placeholder=".................."
                value={profil.motDePasse}
                onChange={(e) => setProfil({ ...profil, motDePasse: e.target.value })}
              />
            </div>
            <div className="d-flex justify-content-end mt-5">
              <button type="submit" className="btn" style={{ backgroundColor: "#011BAD", borderColor: "#011BAD", color: "white" }}>Enregistrer</button>
              <button type="button" className="btn btn-danger" onClick={handleCancel}>Annuler</button>
            </div>
          </form>
        </div>
        <div className="w-25 d-flex flex-column align-items-center justify-content-center">
          <img src="/images/profil.jpg" alt="Alerte" className="position-absolute" style={{ right: "10px", bottom: "150px", width: "280px" }} />
        </div>
      </div>
    </div>
  );
};

export default EditProfil;
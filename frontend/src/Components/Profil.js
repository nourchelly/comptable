import axios from "axios";
import React, { useEffect, useState } from "react";
import { FaExclamationTriangle } from "react-icons/fa";
import { useNavigate, Link } from "react-router-dom"; // Import useNavigate et Link
import "./style.css";

const Profil = () => {
    const [profil, setProfil] = useState({
        nom: "Charlene Reed",
        nomUtilisateur: "Charlene Reed",
        email: "charlenereed@gmail.com",
        motDePasse: "………"
    });

    const navigate = useNavigate();

    useEffect(() => {
        axios
            .get("http://localhost:3000/auth/profil")
            .then((result) => {
                if (result.data.Status) {
                    setProfil(result.data.Result);
                } else {
                    alert(result.data.Error);
                }
            })
            .catch((err) => console.log(err));
    }, []);

    const handleDelete = (id) => {
        axios.delete("http://localhost:3000/auth/delete_profil/" + id)
            .then(result => {
                if (result.data.Status) {
                    setProfil(profil.filter(emp => emp.id !== id));
                } else {
                    alert(result.data.Error);
                }
            });
    };

    return (
        <div className="container mt-5">
            <div className="row justify-content-center">
                <div className="col-md-9 p-5 shadow rounded bg-white position-relative text-start" style={{ borderRadius: "30px" }}>
                    <h3 className="text-center" style={{ color: "#011BAD", textDecoration: "underline" }}>
                        <FaExclamationTriangle className="me-2 text-danger" /> Consulter profil
                    </h3>
                    <div className="d-flex flex-column align-items-start">
                        <div className="mb-3 w-75">
                            <label className="form-label">Nom</label>
                            <input
                                type="text"
                                className="form-control w-75"
                                value={profil.nom}
                                readOnly
                            />
                        </div>
                        <div className="mb-3 w-75">
                            <label className="form-label">Nom d'utilisateur</label>
                            <input
                                type="text"
                                className="form-control w-75"
                                value={profil.nomUtilisateur}
                                readOnly
                            />
                        </div>
                        <div className="mb-3 w-75">
                            <label className="form-label">Email</label>
                            <input
                                type="text"
                                className="form-control w-75"
                                value={profil.email}
                                readOnly
                            />
                        </div>
                        <div className="mb-3 w-75">
                            <label className="form-label">Mot de passe</label>
                            <input
                                type="password"
                                className="form-control w-75"
                                value={profil.motDePasse}
                                readOnly
                            />
                        </div>
                    </div>
                    {/* Ajout de l'image comme dans la maquette */}
                    <div className="text-center mt-4">
                    <img src="/images/profil.jpg" alt="Alerte" className="position-absolute" style={{ right: "20px", bottom: "120px", width: "290px" }}
                        />
                    </div>
                    <div className="d-flex justify-content-end mt-4">
                    <Link to={`/dashboard/modify_profil/${profil.id}`}

    className="btn btn-info me-4" // Ajout de me-3 pour un espacement plus large
    style={{ backgroundColor: "#011BAD", borderColor: "#011BAD", color: "white" }}
  >
    Modifier Profil
  </Link>
  <button
    className="btn btn-warning"
    onClick={() => handleDelete(profil.id)}
    style={{ backgroundColor: "#F31441", borderColor: "#F31441", color: "white" }}
  >
    Supprimer Profil
  </button>
</div>
                </div>
            </div>
        </div>
    );
};

export default Profil;
import axios from "axios";
import React, { useEffect, useState } from "react";
import { FaExclamationTriangle, FaCheckCircle, FaTimesCircle } from "react-icons/fa";
import "./style.css";
import { useNavigate } from "react-router-dom";

const Signaler = () => {
  const [motif, setMotif] = useState("");
  const [description, setDescription] = useState("");
  const [file, setFile] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    axios
      .get("http://localhost:3000/auth/signalercompte")
      .catch((err) => console.log("Erreur lors du chargement des comptes :", err));
  }, []);

  const handleCancel = () => {
    setMotif("");
    setDescription("");
    setFile(null);
    navigate('/dashboard/comptes');
  };

  const handleSubmit = async () => {
    if (!motif || !description) {
      alert("Veuillez remplir tous les champs obligatoires.");
      return;
    }

    const formData = new FormData();
    formData.append("motif", motif);
    formData.append("description", description);
    if (file) {
      formData.append("file", file);
    }

    try {
      const response = await axios.post("http://localhost:3000/auth/signalercompte", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      if (response.data.Status) {
        alert("Signalement envoyé avec succès !");
        setMotif("");
        setDescription("");
        setFile(null);
      } else {
        alert(response.data.Error);
      }
    } catch (error) {
      alert("Erreur lors de l'envoi du signalement : " + error.message);
    }
  };

  return (
    <div className="container mt-5">
      <div className="row justify-content-center">
        <div className="col-md-12 p-8" style={{ borderRadius: "15px" }}>
          <h3 className="text-center" style={{ color: "#011BAD", textDecoration: "underline" }}>
            <FaExclamationTriangle className="me-2 text-danger" /> Signaler Compte
          </h3>
          <div className="d-flex flex-column align-items-start">
            <div className="mb-3 w-75">
              <label className="form-label">📌 Motif du signalement</label>
              <input
                type="text"
                className="form-control w-75"
                placeholder="EX : Contenu inapproprié, Activité suspecte"
                value={motif}
                onChange={(e) => setMotif(e.target.value)}
              />
            </div>
            <div className="mb-3 w-75">
              <label className="form-label">📄 Description détaillée</label>
              <textarea
                className="form-control w-75"
                placeholder="(Champ texte)"
                rows="3"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              ></textarea>
            </div>
            <div className="mb-3 w-75">
              <label className="form-label">📎 Pièces jointes (Optionnel)</label>
              <input
                type="file"
                className="form-control w-75"
                onChange={(e) => setFile(e.target.files[0])}
              />
            </div>
          </div>
          <div className="d-flex justify-content-end mt-5">
            <button className="btn btn-success me-5" onClick={handleSubmit}>
              <FaCheckCircle className="me-1" /> Confirmer
            </button>
            <button className="btn btn-danger" onClick={handleCancel}>
              <FaTimesCircle className="me-1" /> Annuler
            </button>
          </div>
          <img src="/images/co.jpg" alt="Alerte" className="position-absolute" style={{ right: "25px", bottom: "120px", width: "280px" }} />
        </div>
      </div>
    </div>
  );
};

export default Signaler;
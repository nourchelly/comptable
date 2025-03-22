import axios from "axios";
import React, { useEffect, useState } from "react";
import './style.css';

const Compte = () => {
  const [users, setUsers] = useState([]);

  useEffect(() => {
    axios
      .get("http://localhost:3000/auth/comptes")
      .then((result) => {
        if (result.data.Status) {
          setUsers(result.data.Result);
        } else {
          alert(result.data.Error);
        }
      })
      .catch((err) => console.log(err));
  }, []);

  const handleDelete = (id) => {
    axios.delete("http://localhost:3000/auth/delete_user/" + id)
      .then(result => {
        if (result.data.Status) {
          setUsers(users.filter(user => user.id !== id)); 
        } else {
          alert(result.data.Error);
        }
      });
  };

  const handleSignal = (id) => {
    // Ajoutez la logique pour signaler un compte ici
    alert(`Compte ${id} signalé`);
  };

  return (
    <div className="container mt-5">
      <div className="row">
        <div className="col">
          <div className="d-flex justify-content-start align-items-center">
            <h5 className="text-left" style={{ color: '#011BAD' }}>Liste des Utilisateurs</h5> <br></br>
            <span role="img" aria-label="clipboard" style={{ marginLeft: '10px', fontSize: '20px' }}>📋</span>
          </div>
          <br></br>
          <div className="table-responsive">
            <table className="table table-striped" style={{ borderRadius: '15px', overflow: 'hidden' }}>
              <thead>
                <tr>
                  <th style={{ color: '#011BAD' }}>ID</th>
                  <th style={{ color: '#011BAD' }}>Nom</th>
                  <th style={{ color: '#011BAD' }}>Email</th>
                  <th style={{ color: '#011BAD' }}>Rôle</th>
                  <th style={{ color: '#011BAD' }}>Statut</th>
                  <th style={{ color: '#011BAD' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.map((user) => (
                  <tr key={user.id}>
                    <td>{user.id}</td>
                    <td>{user.nom}</td>
                    <td>{user.email}</td>
                    <td>{user.role}</td>
                    <td>{user.statut}</td>
                    <td>
                      <button
                        className="btn btn-warning btn-sm me-2"
                        onClick={() => handleSignal(user.id)}
                      >
                        🚨
                      </button>
                      <button
                        className="btn btn-danger btn-sm"
                        onClick={() => handleDelete(user.id)}
                      >
                        ❌
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Compte;
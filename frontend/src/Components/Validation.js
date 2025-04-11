import axios from "axios";
import React, { useEffect, useState } from "react";
import { FaClipboardList, FaExclamationTriangle, FaTrash, FaUserCheck, FaUserTimes } from "react-icons/fa";

const Validation = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    axios
      .get("http://localhost:3000/auth/validation")
      .then((result) => {
        if (result.data.Status) {
          setUsers(result.data.Result);
        } else {
          alert(result.data.Error);
        }
      })
      .catch((err) => console.log(err))
      .finally(() => setLoading(false));
  }, []);

  const handleDelete = (id) => {
    if (window.confirm("Êtes-vous sûr de vouloir supprimer cet utilisateur ?")) {
      axios.delete("http://localhost:3000/api/delete_user/" + id)
        .then(result => {
          if (result.data.Status) {
            setUsers(users.filter(user => user.id !== id));
          } else {
            alert(result.data.Error);
          }
        });
    }
  };

  const handleSignal = (id) => {
    if (window.confirm("Signaler ce compte à l'administrateur ?")) {
      // Ajoutez la logique pour signaler un compte ici
      alert(`Compte ${id} signalé avec succès`);
    }
  };

  const handleValidate = (id) => {
    // Logique de validation du compte
    alert(`Compte ${id} validé`);
  };

  const handleReject = (id) => {
    // Logique de rejet du compte
    alert(`Compte ${id} rejeté`);
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
   
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-8">
          <div className="flex items-center mb-4 md:mb-0">
            <FaClipboardList className="text-blue-600 text-2xl mr-3" />
            <h1 className="text-2xl font-bold text-gray-800">Validation des Comptes</h1>
          </div>
          <div className="flex items-center space-x-2">
            <span className="bg-blue-100 text-blue-800 text-xs font-medium px-2.5 py-0.5 rounded-full">
              {users.length} comptes à vérifier
            </span>
          </div>
        </div>

        {/* Table */}
        <div className="bg-white shadow-md rounded-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    ID
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Nom
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Email
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Rôle
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Statut
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {users.length > 0 ? (
                  users.map((user) => (
                    <tr key={user.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {user.id}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {user.nom}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {user.email}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        <span className={`px-2 py-1 text-xs rounded-full ${
                          user.role === 'admin' 
                            ? 'bg-purple-100 text-purple-800' 
                            : 'bg-blue-100 text-blue-800'
                        }`}>
                          {user.role}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        <span className={`px-2 py-1 text-xs rounded-full ${
                          user.statut === 'actif' 
                            ? 'bg-green-100 text-green-800' 
                            : user.statut === 'en attente'
                            ? 'bg-yellow-100 text-yellow-800'
                            : 'bg-red-100 text-red-800'
                        }`}>
                          {user.statut}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex space-x-2">
                          <button
                            onClick={() => handleValidate(user.id)}
                            className="text-green-600 hover:text-green-900 p-1 rounded-full hover:bg-green-50"
                            title="Valider"
                          >
                            <FaUserCheck className="text-lg" />
                          </button>
                          <button
                            onClick={() => handleReject(user.id)}
                            className="text-red-600 hover:text-red-900 p-1 rounded-full hover:bg-red-50"
                            title="Rejeter"
                          >
                            <FaUserTimes className="text-lg" />
                          </button>
                          <button
                            onClick={() => handleSignal(user.id)}
                            className="text-yellow-600 hover:text-yellow-900 p-1 rounded-full hover:bg-yellow-50"
                            title="Signaler"
                          >
                            <FaExclamationTriangle className="text-lg" />
                          </button>
                          <button
                            onClick={() => handleDelete(user.id)}
                            className="text-gray-600 hover:text-gray-900 p-1 rounded-full hover:bg-gray-100"
                            title="Supprimer"
                          >
                            <FaTrash className="text-lg" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="6" className="px-6 py-4 text-center text-sm text-gray-500">
                      Aucun compte à valider pour le moment
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Stats */}
        {users.length > 0 && (
          <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white p-6 rounded-lg shadow-sm border-l-4 border-blue-500">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-500">Comptes en attente</p>
                  <p className="text-2xl font-bold mt-1">
                    {users.filter(u => u.statut === 'en attente').length}
                  </p>
                </div>
                <div className="p-3 rounded-full bg-blue-100 text-blue-600">
                  <FaUserTimes className="text-xl" />
                </div>
              </div>
            </div>

            <div className="bg-white p-6 rounded-lg shadow-sm border-l-4 border-green-500">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-500">Comptes actifs</p>
                  <p className="text-2xl font-bold mt-1">
                    {users.filter(u => u.statut === 'actif').length}
                  </p>
                </div>
                <div className="p-3 rounded-full bg-green-100 text-green-600">
                  <FaUserCheck className="text-xl" />
                </div>
              </div>
            </div>

            <div className="bg-white p-6 rounded-lg shadow-sm border-l-4 border-red-500">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-500">Comptes rejetés</p>
                  <p className="text-2xl font-bold mt-1">
                    {users.filter(u => u.statut === 'rejeté').length}
                  </p>
                </div>
                <div className="p-3 rounded-full bg-red-100 text-red-600">
                  <FaExclamationTriangle className="text-xl" />
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    
  );
};

export default Validation;
import React, { useState, useEffect } from "react";
import axios from "axios";
import { useUser } from './UserContext';
import { toast } from "react-toastify";
import { 
  FaCalendarAlt, 
  FaUserTie, 
  FaClipboardList, 
  FaSearch, 
  FaFilter, 
  FaPlus, 
  FaTimes,
  FaCheck,
  FaCalendarCheck,
  FaChevronDown,
  FaUser,
  FaTags,
  FaFileAlt,
  FaChartLine,
  FaAlignLeft,
  FaEdit,
  FaPlusCircle,
  FaSave,
} from "react-icons/fa";

const PlanificationAudits = () => {
  const { user } = useUser();
  const [audits, setAudits] = useState([]);
  const [filterType, setFilterType] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [formData, setFormData] = useState({
    nom: "",
    type: "Financier",
    responsable: "",
    date_debut: "",
    date_fin: "",
    statut: "Planifié",
    description: ""
  });
  const [showForm, setShowForm] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("Tous");
  const [editingId, setEditingId] = useState(null);

  // Formatage des dates pour l'affichage
  const formatDate = (dateString) => {
    if (!dateString) return '';
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('fr-FR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
      });
    } catch (e) {
      console.error("Erreur de formatage de date:", e);
      return '';
    }
  };

  // Chargement des audits
  const fetchAudits = async () => {
    try {
      const response = await axios.get('http://127.0.0.1:8000/api/audit/', {
        withCredentials: true
      });

      const normalizedAudits = (response.data.audits || response.data || []).map(audit => ({
        id: audit.id || '',
        nom: audit.nom || 'Nom non défini',
        type: audit.type || 'Financier',
        responsable: audit.responsable || '',
        date_debut: audit.date_debut || '',
        date_fin: audit.date_fin || '',
        statut: audit.statut || 'Planifié',
        description: audit.description || ''
      }));

      setAudits(normalizedAudits);
    } catch (error) {
      toast.error("Erreur lors du chargement des audits");
      console.error("Erreur:", error.response?.data || error.message);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchAudits();
  }, []);

  // Gestion des changements de formulaire
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Soumission du formulaire
  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      // Validation des dates
      if (!formData.date_debut || !formData.date_fin) {
        throw new Error("Les dates sont requises");
      }

      // Convertir les dates en format ISO
      const dataToSend = {
        ...formData,
        date_debut: new Date(formData.date_debut).toISOString(),
        date_fin: new Date(formData.date_fin).toISOString()
      };

      console.log("Données envoyées:", dataToSend);

      let response;
      if (editingId) {
        // Mise à jour d'un audit existant
        response = await axios.put(
          `http://127.0.0.1:8000/api/audit/${editingId}/`, 
          dataToSend,
          { withCredentials: true }
        );
        
        console.log("Réponse PUT:", response.data);
        
        // Correction : Utiliser response.data.audit
        setAudits(audits.map(audit => 
          audit.id === editingId ? response.data.audit : audit
        ));
        toast.success("Audit mis à jour avec succès !");
      } else {
        // Création d'un nouvel audit
        response = await axios.post(
          'http://127.0.0.1:8000/api/audit/', 
          dataToSend,
          { withCredentials: true }
        );
        
        console.log("Réponse POST:", response.data);
        
        // Correction : Si le backend est corrigé, utiliser response.data.audit
        // Sinon, recharger la liste complète
        if (response.data.audit) {
          setAudits([...audits, response.data.audit]);
        } else {
          // Alternative : recharger tous les audits
          await fetchAudits();
        }
        toast.success("Audit créé avec succès !");
      }

      resetForm();
    } catch (error) {
      const errorMessage = error.response?.data?.error || 
                         error.response?.data?.message || 
                         error.message ||
                         "Erreur lors de l'opération";
      toast.error(errorMessage);
      console.error("Erreur:", error.response?.data || error.message);
    }
  };

  // Réinitialisation du formulaire
  const resetForm = () => {
    setFormData({
      nom: "",
      type: "Financier",
      responsable: "",
      date_debut: "",
      date_fin: "",
      statut: "Planifié",
      description: ""
    });
    setEditingId(null);
    setShowForm(false);
  };

  // Initialisation de l'édition
  const handleEdit = (audit) => {
    setFormData({
      nom: audit.nom || '',
      type: audit.type || 'Financier',
      responsable: audit.responsable || '',
      date_debut: audit.date_debut ? audit.date_debut.split('T')[0] : '',
      date_fin: audit.date_fin ? audit.date_fin.split('T')[0] : '',
      statut: audit.statut || 'Planifié',
      description: audit.description || ""
    });
    setEditingId(audit.id);
    setShowForm(true);
  };

  // Suppression d'un audit
  const handleDelete = async (id) => {
    if (window.confirm("Êtes-vous sûr de vouloir supprimer cet audit ?")) {
      try {
        await axios.delete(`http://127.0.0.1:8000/api/audit/${id}/`, {
          withCredentials: true
        });
        setAudits(audits.filter(audit => audit.id !== id));
        toast.success("Audit supprimé avec succès");
      } catch (error) {
        toast.error(error.response?.data?.error || "Erreur lors de la suppression");
        console.error("Erreur:", error.response?.data || error.message);
      }
    }
  };

  // Filtrage des audits
  const filteredAudits = audits.filter(audit => {
    if (!audit || !audit.nom) return false;
    
    const nom = audit.nom.toString().toLowerCase();
    const statut = audit.statut || '';
    const searchTermLower = searchTerm.toLowerCase();

    const matchesSearch = nom.includes(searchTermLower);
    const matchesStatus = filterStatus === "Tous" || statut === filterStatus;
    
    return matchesSearch && matchesStatus;
  });

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6 bg-gray-50 min-h-screen">
      <div className="max-w-7xl mx-auto">
        {/* En-tête avec titre et bouton d'ajout */}
        <div className="bg-gradient-to-r from-blue-600 to-blue-800 text-white rounded-lg p-6 mb-8 shadow-lg">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <h1 className="text-3xl font-bold flex items-center">
              <FaClipboardList className="mr-3 text-white" />
              Planification des Audits
            </h1>
            <button 
              onClick={() => {
                resetForm();
                setShowForm(true);
              }}
              className="bg-white text-blue-700 hover:bg-blue-50 px-5 py-2.5 rounded-lg font-medium flex items-center justify-center transition-all duration-200 shadow-sm"
            >
              <FaPlus className="mr-2" />
              Planifier Audit
            </button>
          </div>
        </div>

        {/* Formulaire */}
        {showForm && (
          <div className="bg-white p-8 rounded-xl shadow-lg mb-8 border-l-4 border-blue-600 animate-fadeIn">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-gray-800 flex items-center">
                {editingId ? (
                  <>
                    <FaEdit className="mr-2 text-blue-600" />
                    Modifier l'audit
                  </>
                ) : (
                  <>
                    <FaPlusCircle className="mr-2 text-blue-600" />
                    Planifier un nouvel audit
                  </>
                )}
              </h2>
              <button 
                onClick={resetForm}
                className="text-gray-500 hover:text-gray-700 bg-gray-100 hover:bg-gray-200 p-2 rounded-full transition-all"
              >
                <FaTimes className="h-5 w-5" />
              </button>
            </div>
            
            <div className="md:flex">
              {/* Formulaire à gauche */}
              <div className="md:w-2/3 md:pr-8">
                <form onSubmit={handleSubmit}>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Nom */}
                    <div className="group">
                      <label className="block text-sm font-medium text-gray-700 mb-1.5 flex items-center">
                        <FaFileAlt className="mr-2 text-blue-500" />
                        Nom de l'audit <span className="text-red-500 ml-1">*</span>
                      </label>
                      <input
                        type="text"
                        name="nom"
                        value={formData.nom}
                        onChange={handleInputChange}
                        className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all pl-10"
                        required
                      />
                    </div>
                    
                    {/* Type */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1.5 flex items-center">
                        <FaTags className="mr-2 text-blue-500" />
                        Type d'audit <span className="text-red-500 ml-1">*</span>
                      </label>
                      <div className="relative">
                        <select
                          name="type"
                          value={formData.type}
                          onChange={handleInputChange}
                          className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all appearance-none pl-10"
                          required
                        >
                          <option value="Financier">Financier</option>
                          <option value="Ressources Humaines">Ressources Humaines</option>
                          <option value="Processus">Processus</option>
                          <option value="Conformité">Conformité</option>
                        </select>
                        <FaChevronDown className="absolute right-3 top-3.5 text-gray-400 pointer-events-none" />
                      </div>
                    </div>
                    
                    {/* Responsable */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1.5 flex items-center">
                        <FaUserTie className="mr-2 text-blue-500" />
                        Responsable <span className="text-red-500 ml-1">*</span>
                      </label>
                      <input
                        type="text"
                        name="responsable"
                        value={formData.responsable}
                        onChange={handleInputChange}
                        className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all pl-10"
                        required
                      />
                    </div>
                    
                    {/* Statut */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1.5 flex items-center">
                        <FaChartLine className="mr-2 text-blue-500" />
                        Statut <span className="text-red-500 ml-1">*</span>
                      </label>
                      <div className="relative">
                        <select
                          name="statut"
                          value={formData.statut}
                          onChange={handleInputChange}
                          className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all appearance-none pl-10"
                          required
                        >
                          <option value="Planifié">Planifié</option>
                          <option value="En cours">En cours</option>
                          <option value="Terminé">Terminé</option>
                          <option value="Annulé">Annulé</option>
                        </select>
                        <FaChevronDown className="absolute right-3 top-3.5 text-gray-400 pointer-events-none" />
                      </div>
                    </div>
                    
                    {/* Date de début */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1.5 flex items-center">
                        <FaCalendarAlt className="mr-2 text-blue-500" />
                        Date de début <span className="text-red-500 ml-1">*</span>
                      </label>
                      <input
                        type="date"
                        name="date_debut"
                        value={formData.date_debut}
                        onChange={handleInputChange}
                        className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all pl-10"
                        required
                      />
                    </div>
                    
                    {/* Date de fin */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1.5 flex items-center">
                        <FaCalendarCheck className="mr-2 text-blue-500" />
                        Date de fin <span className="text-red-500 ml-1">*</span>
                      </label>
                      <input
                        type="date"
                        name="date_fin"
                        value={formData.date_fin}
                        onChange={handleInputChange}
                        min={formData.date_debut}
                        className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all pl-10"
                        required
                      />
                    </div>
                    
                    {/* Description */}
                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-1.5 flex items-center">
                        <FaAlignLeft className="mr-2 text-blue-500" />
                        Description
                      </label>
                      <textarea
                        name="description"
                        value={formData.description}
                        onChange={handleInputChange}
                        rows={4}
                        className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all pl-10"
                        placeholder="Décrivez l'objectif et le périmètre de cet audit..."
                      />
                    </div>
                  </div>
                  
                  <div className="mt-8 flex justify-end space-x-4">
                    <button
                      type="button"
                      onClick={resetForm}
                      className="px-6 py-2.5 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 font-medium transition-all duration-200 flex items-center"
                    >
                      <FaTimes className="mr-2" />
                      Annuler
                    </button>
                    <button
                      type="submit"
                      className="px-6 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium shadow-sm transition-all duration-200 flex items-center"
                    >
                      {editingId ? (
                        <>
                          <FaSave className="mr-2" />
                          Mettre à jour
                        </>
                      ) : (
                        <>
                          <FaCheck className="mr-2" />
                          Enregistrer
                        </>
                      )}
                    </button>
                  </div>
                </form>
              </div>
              
              {/* Image à droite */}
              <div className="md:w-1/3 mt-8 md:mt-0 flex flex-col items-center justify-center border-l border-gray-200 pl-8">
                <div className="bg-blue-50 p-6 rounded-xl w-full">
                  <img 
                    src="/images/a.jpg" 
                    alt="Planification d'audit" 
                    className="rounded-lg shadow-md max-w-full h-auto mb-6 transition-all hover:shadow-lg"
                  />
                  <div className="text-center">
                    <h3 className="text-xl font-bold text-blue-700 mb-3 flex items-center justify-center">
                      {editingId ? (
                        <>
                          <FaEdit className="mr-2" />
                          Mise à jour de l'audit
                        </>
                      ) : (
                        <>
                          <FaPlusCircle className="mr-2" />
                          Nouveau plan d'audit
                        </>
                      )}
                    </h3>
                    <p className="text-gray-600">
                      {editingId 
                        ? "Mettez à jour les détails de l'audit pour refléter les changements actuels."
                        : "La planification précise des audits garantit l'efficacité et la conformité de vos opérations."}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Barre de recherche et filtres */}
        <div className="bg-white p-6 rounded-xl shadow-md mb-8">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div className="relative flex-1">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <FaSearch className="text-blue-500" />
              </div>
              <input
                type="text"
                placeholder="Rechercher un audit par nom, type ou responsable..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-12 pr-4 py-3 w-full border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
              />
            </div>
            
            <div className="flex flex-wrap items-center gap-3">
              <span className="font-medium text-gray-700 flex items-center">
                <FaFilter className="text-blue-500 mr-2" />
                Filtrer par:
              </span>
              
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white transition-all"
              >
                <option value="Tous">Tous les statuts</option>
                <option value="Planifié">Planifié</option>
                <option value="En cours">En cours</option>
                <option value="Terminé">Terminé</option>
                <option value="Annulé">Annulé</option>
              </select>
              
              <select
                value={filterType}
                onChange={(e) => setFilterType(e.target.value)}
                className="border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white transition-all"
              >
                <option value="Tous">Tous les types</option>
                <option value="Financier">Financier</option>
                <option value="Ressources Humaines">Ressources Humaines</option>
                <option value="Processus">Processus</option>
                <option value="Conformité">Conformité</option>
              </select>
            </div>
          </div>
        </div>

        {/* Liste des audits */}
        <div className="bg-white shadow-sm rounded-lg overflow-hidden">
          {filteredAudits.length === 0 ? (
            <div className="p-8 text-center text-gray-500">
              Aucun audit trouvé
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Nom</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Responsable</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Dates</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Statut</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Description</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredAudits.map((audit) => (
                    <tr key={audit.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap font-medium text-gray-900">
                        {audit.nom}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-gray-500">{audit.type}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-gray-500 flex items-center">
                        <FaUserTie className="mr-2 text-blue-500" />
                        {audit.responsable}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-gray-500">
                        <div className="flex items-center">
                          <FaCalendarAlt className="mr-2 text-green-500" />
                          <div>
                            <div>{formatDate(audit.date_debut)}</div>
                            <div className="text-xs text-gray-400">au</div>
                            <div>{formatDate(audit.date_fin)}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                          audit.statut === "Planifié" ? "bg-blue-100 text-blue-800" :
                          audit.statut === "En cours" ? "bg-yellow-100 text-yellow-800" :
                          audit.statut === "Terminé" ? "bg-green-100 text-green-800" :
                          "bg-red-100 text-red-800"
                        }`}>
                          {audit.statut}
                        </span>
                      </td>
                      <td className="px-6 py-4 max-w-xs">
                        <div className="text-sm text-gray-900">
                          {audit.description ? (
                            <div className="truncate" title={audit.description}>
                              {audit.description.length > 50 
                                ? `${audit.description.substring(0, 50)}...` 
                                : audit.description}
                            </div>
                          ) : (
                            <span className="text-gray-400 italic">Aucune description</span>
                          )}
                        </div>
                      </td>
                      <td className="py-3 px-4 flex gap-2">
                        <button
                          onClick={() => handleEdit(audit)}
                          className="text-blue-500 hover:text-blue-700"
                        >
                          ✏️
                        </button>
                        <button
                          onClick={() => handleDelete(audit.id)}
                          className="text-red-500 hover:text-red-700"
                        >
                          🗑️
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Statistiques */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-8">
          <div className="bg-white p-4 rounded-lg shadow-sm border-l-4 border-blue-500">
            <h3 className="text-sm font-medium text-gray-500">Total Audits</h3>
            <p className="text-2xl font-bold mt-1">
              {audits.length}
            </p>
          </div>
          <div className="bg-white p-4 rounded-lg shadow-sm border-l-4 border-blue-500">
            <h3 className="text-sm font-medium text-gray-500">Planifiés</h3>
            <p className="text-2xl font-bold mt-1">
              {audits.filter(a => a.statut === "Planifié").length}
            </p>
          </div>
          <div className="bg-white p-4 rounded-lg shadow-sm border-l-4 border-yellow-500">
            <h3 className="text-sm font-medium text-gray-500">En Cours</h3>
            <p className="text-2xl font-bold mt-1">
              {audits.filter(a => a.statut === "En cours").length}
            </p>
          </div>
          <div className="bg-white p-4 rounded-lg shadow-sm border-l-4 border-green-500">
            <h3 className="text-sm font-medium text-gray-500">Terminés</h3>
            <p className="text-2xl font-bold mt-1">
              {audits.filter(a => a.statut === "Terminé").length}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PlanificationAudits;
import React, { useState, useEffect } from "react";
import { Link, Outlet, useLocation, useNavigate } from "react-router-dom";
import axios from "axios";
import { toast } from "react-toastify";
import { 
  FaHome, FaChartPie, FaFileAlt, FaClipboardCheck, 
  FaUserCircle, FaSignOutAlt, FaSearch, FaBell,
   FaCalendarAlt, FaChartLine,
  FaMoneyBillWave, FaPercentage, FaBalanceScale, FaDatabase, FaQrcode,
  FaEdit, FaTrash, FaPlus
} from "react-icons/fa";
import { AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const DashboardDirecteurFinancier = () => {
  const navigate = useNavigate();
  const [audits, setAudits] = useState([]);
  const location = useLocation();
  const [isLoading, setIsLoading] = useState(true);
  const [User, setUser] = useState();
  
    const handleLogout = () => {
      axios.get(  "http://127.0.0.1:8000/api/logout/")  // L'URL doit être celle du serveur Django
        .then(result => {
          if (result.data.Status) {
            localStorage.removeItem("valid");
            navigate('/connexion');
          }
        })
        .catch(err => console.error(err));
    };
  
 

  // Données pour les graphiques
  const performanceData = [
    { name: 'Jan', revenus: 4000, depenses: 2400 },
    { name: 'Fév', revenus: 3000, depenses: 1800 },
    { name: 'Mar', revenus: 5000, depenses: 2800 },
    { name: 'Avr', revenus: 3780, depenses: 2908 },
    { name: 'Mai', revenus: 5890, depenses: 4800 },
    { name: 'Jun', revenus: 6390, depenses: 3800 },
  ];

  const budgetData = [
    { name: 'Marketing', budget: 4000, utilisé: 3200 },
    { name: 'R&D', budget: 3000, utilisé: 1898 },
    { name: 'Production', budget: 6000, utilisé: 4800 },
  ];

  // États pour les audits
  const [auditsData, setAuditsData] = useState([]);
  const [rapportsData, setRapportsData] = useState([]);
  const [formData, setFormData] = useState({
    nom: "",
    type: "Financier",
    responsable: "",
    dateDebut: "",
    dateFin: "",
    priorite: "Moyenne"
  });
  const [showForm, setShowForm] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("Tous");

  // Chargement initial des données
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [auditsResponse, rapportsResponse] = await Promise.all([
          axios.get('http://127.0.0.1:8000/audit'),
          axios.get('http://votre-api.com/rapports')
        ]);
        setAuditsData(auditsResponse.data);
        setRapportsData(rapportsResponse.data);
      } catch (error) {
        toast.error("Erreur de chargement des données");
        console.error(error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, []);

 
  const saveAudit = async (auditData) => {
    try {
      const response = await axios.post('http://votre-api.com/audits', auditData, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        }
      });
      return response.data;
    } catch (error) {
      console.error("Erreur API:", error.response?.data || error.message);
      throw error;
    }
  };

  const handleSubmitAudit = async (e) => {
    e.preventDefault();
    try {
      const newAudit = await saveAudit(formData);
      setAuditsData([...auditsData, newAudit]);
      setFormData({
        nom: "",
        type: "Financier",
        responsable: "",
        dateDebut: "",
        dateFin: "",
        priorite: "Moyenne"
      });
      setShowForm(false);
      toast.success("Audit créé avec succès !");
    } catch (error) {
      toast.error("Échec de la création de l'audit");
    }
  };

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
  const filteredAudits = auditsData.filter(audit => {
    const matchesSearch = audit.nom.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = filterStatus === "Tous" || audit.statut === filterStatus;
    return matchesSearch && matchesStatus;
  });

  // Sidebar component
  const Sidebar = () => (
    <div className="w-64 bg-gradient-to-b from-indigo-900 to-indigo-800 text-white flex flex-col h-full shadow-xl">
      <div className="p-6 flex items-center justify-center border-b border-indigo-700">
        <FaQrcode className="text-3xl text-white mr-3" />
        <span className="text-2xl font-bold">Compta<span className="text-blue-300">BoT</span></span>
      </div>

      <nav className="flex-1 px-4 py-6 space-y-2">
        <Link 
          to="/dashboarddirecteur" 
          className={`flex items-center p-4 rounded-lg transition-all duration-200 ${
            location.pathname === "/dashboarddirecteur" 
              ? 'bg-white text-indigo-800 shadow-md font-semibold' 
              : 'text-indigo-100 hover:bg-indigo-700 hover:text-white'
          }`}
        >
          <FaHome className={`mr-3 text-lg ${
            location.pathname === "/dashboarddirecteur" ? 'text-indigo-600' : 'text-blue-300'
          }`} />
          <span>Tableau de bord</span>
        </Link>

        <Link 
          to="/dashboarddirecteur/rapports" 
          className={`flex items-center p-4 rounded-lg transition-all duration-200 ${
            location.pathname === "/dashboarddirecteur/rapports" 
              ? 'bg-white text-indigo-800 shadow-md font-semibold' 
              : 'text-indigo-100 hover:bg-indigo-700 hover:text-white'
          }`}
        >
          <FaFileAlt className={`mr-3 text-lg ${
            location.pathname === "/dashboarddirecteur/rapports" ? 'text-indigo-600' : 'text-blue-300'
          }`} />
          <span>Rapports Financiers</span>
        </Link>

        <Link 
          to="/dashboarddirecteur/audits" 
          className={`flex items-center p-4 rounded-lg transition-all duration-200 ${
            location.pathname === "/dashboarddirecteur/audits" 
              ? 'bg-white text-indigo-800 shadow-md font-semibold' 
              : 'text-indigo-100 hover:bg-indigo-700 hover:text-white'
          }`}
        >
          <FaClipboardCheck className={`mr-3 text-lg ${
            location.pathname === "/dashboarddirecteur/audits" ? 'text-indigo-600' : 'text-blue-300'
          }`} />
          <span>Audits Financiers</span>
        </Link>

        <Link 
          to="/dashboarddirecteur/profildirecteur" 
          className={`flex items-center p-4 rounded-lg transition-all duration-200 ${
            location.pathname === "/dashboarddirecteur/profildirecteur" 
              ? 'bg-white text-indigo-800 shadow-md font-semibold' 
              : 'text-indigo-100 hover:bg-indigo-700 hover:text-white'
          }`}
        >
          <FaUserCircle className={`mr-3 text-lg ${
            location.pathname === "/dashboarddirecteur/profildirecteur" ? 'text-indigo-600' : 'text-blue-300'
          }`} />
          <span>Mon Profil</span>
        </Link>
      </nav>

      <div className="p-4 border-t border-indigo-700">
        

        <button 
          onClick={handleLogout}
          className="flex items-center w-full p-3 text-indigo-100 hover:bg-indigo-700 rounded-lg transition-colors duration-200"
        >
          <FaSignOutAlt className="mr-3 text-blue-300" />
          <span>Déconnexion</span>
        </button>
      </div>
    </div>
  );

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-gray-50 font-sans">
      <Sidebar />

      <div className="flex-1 flex flex-col overflow-hidden">
        <header className="bg-white shadow-sm py-4 px-6 flex items-center justify-between">
          <h1 className="text-xl font-bold text-gray-800">
            {location.pathname === "/dashboarddirecteur" && "Tableau de Bord"}
            {location.pathname === "/dashboarddirecteur/rapports" && "Rapports Financiers"}
            {location.pathname === "/dashboarddirecteur/audits" && "Audits Financiers"}
            {location.pathname === "/dashboarddirecteur/profildirecteur" && "Mon Profil"}
          </h1>

          <div className="flex items-center space-x-4">
            <div className="relative hidden md:block">
              <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input 
                type="text" 
                placeholder="Rechercher..." 
                className="pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-gray-50"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <button className="p-2 text-gray-500 hover:text-gray-700 relative">
              <FaBell />
              <span className="absolute top-0 right-0 h-2 w-2 rounded-full bg-red-500"></span>
            </button>
            <div className="flex items-center space-x-2">
              <div className="h-8 w-8 rounded-full bg-indigo-100 flex items-center justify-center">
                <FaUserCircle className="text-indigo-600" />
              </div>
              <span className="hidden md:block font-medium text-sm">Directeur Financier</span>
            </div>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-6 bg-gray-50">
          <Outlet />

          {location.pathname === "/dashboarddirecteur" && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white p-5 rounded-xl shadow-sm border-t-4 border-blue-500">
                  <div className="flex justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-500">Chiffre d'Affaires</p>
                      <p className="text-2xl font-bold text-gray-800 mt-1">2.45M €</p>
                      <div className="flex items-center text-green-500 text-sm mt-1">
                        <FaChartLine className="mr-1" />
                        <span>↑ 12% vs trimestre dernier</span>
                      </div>
                    </div>
                    <div className="h-12 w-12 rounded-full bg-blue-50 flex items-center justify-center">
                      <FaMoneyBillWave className="text-blue-500 text-xl" />
                    </div>
                  </div>
                </div>

                <div className="bg-white p-5 rounded-xl shadow-sm border-t-4 border-green-500">
                  <div className="flex justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-500">Marge Brute</p>
                      <p className="text-2xl font-bold text-gray-800 mt-1">1.12M €</p>
                      <div className="flex items-center text-green-500 text-sm mt-1">
                        <FaPercentage className="mr-1" />
                        <span>45.7% de marge</span>
                      </div>
                    </div>
                    <div className="h-12 w-12 rounded-full bg-green-50 flex items-center justify-center">
                      <FaChartPie className="text-green-500 text-xl" />
                    </div>
                  </div>
                </div>

                <div className="bg-white p-5 rounded-xl shadow-sm border-t-4 border-purple-500">
                  <div className="flex justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-500">Trésorerie</p>
                      <p className="text-2xl font-bold text-gray-800 mt-1">845K €</p>
                      <div className="flex items-center text-blue-500 text-sm mt-1">
                        <FaBalanceScale className="mr-1" />
                        <span>Ratio: 1.8</span>
                      </div>
                    </div>
                    <div className="h-12 w-12 rounded-full bg-purple-50 flex items-center justify-center">
                      <FaDatabase className="text-purple-500 text-xl" />
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-white p-5 rounded-xl shadow-sm">
                <h2 className="text-lg font-semibold text-gray-800 mb-4">Performance Financière</h2>
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={performanceData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                      <defs>
                        <linearGradient id="colorRevenus" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#4F46E5" stopOpacity={0.8}/>
                          <stop offset="95%" stopColor="#4F46E5" stopOpacity={0}/>
                        </linearGradient>
                        <linearGradient id="colorDepenses" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#10B981" stopOpacity={0.8}/>
                          <stop offset="95%" stopColor="#10B981" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <XAxis dataKey="name" />
                      <YAxis />
                      <CartesianGrid strokeDasharray="3 3" vertical={false} />
                      <Tooltip />
                      <Area type="monotone" dataKey="revenus" stroke="#4F46E5" fillOpacity={1} fill="url(#colorRevenus)" />
                      <Area type="monotone" dataKey="depenses" stroke="#10B981" fillOpacity={1} fill="url(#colorDepenses)" />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-white p-5 rounded-xl shadow-sm">
                  <h2 className="text-lg font-semibold text-gray-800 mb-4">Budget vs Dépenses</h2>
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={budgetData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} />
                        <XAxis dataKey="name" />
                        <YAxis />
                        <Tooltip />
                        <Bar dataKey="budget" fill="#4F46E5" radius={[4, 4, 0, 0]} />
                        <Bar dataKey="utilisé" fill="#10B981" radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                <div className="bg-white p-5 rounded-xl shadow-sm">
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-lg font-semibold text-gray-800">Audits à Planifier</h2>
                    <button 
                      onClick={() => setShowForm(true)}
                      className="text-indigo-600 hover:text-indigo-800 text-sm flex items-center"
                    >
                      <FaPlus className="mr-1" /> Nouvel audit
                    </button>
                  </div>
                  
                  <div className="space-y-3">
                    {filteredAudits.slice(0, 3).map((audit) => (
                      <div key={audit.id} className="border border-gray-100 rounded-lg p-3 hover:shadow-sm transition">
                        <div className="flex justify-between items-start">
                          <div>
                            <h3 className="font-medium">{audit.nom}</h3>
                            <div className="flex items-center text-sm text-gray-500 mt-1">
                              <FaCalendarAlt className="mr-1" />
                              <span>{audit.dateDebut} au {audit.dateFin}</span>
                            </div>
                          </div>
                          <span className={`px-2 py-1 text-xs rounded-full ${
                            audit.priorite === 'Haute' ? 'bg-red-100 text-red-800' :
                            'bg-yellow-100 text-yellow-800'
                          }`}>
                            {audit.priorite}
                          </span>
                        </div>
                        <div className="flex justify-between items-center mt-2">
                          <span className={`text-xs px-2 py-1 rounded-full ${
                            audit.statut === 'Planifié' ? 'bg-green-100 text-green-800' :
                            audit.statut === 'En cours' ? 'bg-blue-100 text-blue-800' :
                            'bg-gray-100 text-gray-800'
                          }`}>
                            {audit.statut}
                          </span>
                          <div>
                            <button className="text-blue-600 hover:text-blue-800 mr-2">
                              <FaEdit size={14} />
                            </button>
                            <button 
                              onClick={() => handleDelete(audit.id)}
                              className="text-red-600 hover:text-red-800"
                            >
                              <FaTrash size={14} />
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="bg-white p-5 rounded-xl shadow-sm">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-semibold text-gray-800">Rapports Récents</h2>
                  <Link to="/dashboarddirecteur/rapports" className="text-indigo-600 hover:text-indigo-800 text-sm">
                    Voir tous →
                  </Link>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {rapportsData.slice(0, 3).map((rapport) => (
                    <div key={rapport.id} className="border border-gray-100 rounded-lg p-4 hover:shadow-sm transition">
                      <div className="flex items-center mb-2">
                        <div className={`h-3 w-3 rounded-full mr-2 ${
                          rapport.statut === 'Validé' ? 'bg-green-500' :
                          rapport.statut === 'En révision' ? 'bg-yellow-500' :
                          'bg-gray-500'
                        }`}></div>
                        <h3 className="font-medium text-sm">{rapport.titre}</h3>
                      </div>
                      <div className="text-xs text-gray-500 mb-1">Type: {rapport.type}</div>
                      <div className="text-xs text-gray-500 mb-3">Date: {rapport.date}</div>
                      <div className="flex justify-between items-center">
                        <span className={`text-xs px-2 py-1 rounded-full ${
                          rapport.statut === 'Validé' ? 'bg-green-100 text-green-800' :
                          rapport.statut === 'En révision' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {rapport.statut}
                        </span>
                        <button className="text-indigo-600 text-xs hover:text-indigo-800">
                          Consulter
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </main>
      </div>

      {/* Modal pour nouveau audit */}
      {showForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl">
            <div className="p-6">
              <h2 className="text-xl font-semibold mb-4">Planifier un nouvel audit</h2>
              <form onSubmit={handleSubmitAudit}>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Nom de l'audit</label>
                    <input
                      type="text"
                      name="nom"
                      value={formData.nom}
                      onChange={(e) => setFormData({...formData, nom: e.target.value})}
                      className="w-full p-2 border border-gray-300 rounded-md"
                      required
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Type d'audit</label>
                    <select
                      name="type"
                      value={formData.type}
                      onChange={(e) => setFormData({...formData, type: e.target.value})}
                      className="w-full p-2 border border-gray-300 rounded-md"
                    >
                      <option value="Financier">Financier</option>
                      <option value="RH">Ressources Humaines</option>
                      <option value="Processus">Processus</option>
                      <option value="Conformité">Conformité</option>
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Responsable</label>
                    <input
                      type="text"
                      name="responsable"
                      value={formData.responsable}
                      onChange={(e) => setFormData({...formData, responsable: e.target.value})}
                      className="w-full p-2 border border-gray-300 rounded-md"
                      required
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Priorité</label>
                    <select
                      name="priorite"
                      value={formData.priorite}
                      onChange={(e) => setFormData({...formData, priorite: e.target.value})}
                      className="w-full p-2 border border-gray-300 rounded-md"
                    >
                      <option value="Haute">Haute</option>
                      <option value="Moyenne">Moyenne</option>
                      <option value="Basse">Basse</option>
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Date de début</label>
                    <input
                      type="date"
                      name="dateDebut"
                      value={formData.dateDebut}
                      onChange={(e) => setFormData({...formData, dateDebut: e.target.value})}
                      className="w-full p-2 border border-gray-300 rounded-md"
                      required
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Date de fin</label>
                    <input
                      type="date"
                      name="dateFin"
                      value={formData.dateFin}
                      onChange={(e) => setFormData({...formData, dateFin: e.target.value})}
                      className="w-full p-2 border border-gray-300 rounded-md"
                      required
                    />
                  </div>
                </div>
                
                <div className="mt-6 flex justify-end space-x-3">
                  <button
                    type="button"
                    onClick={() => setShowForm(false)}
                    className="px-4 py-2 border border-gray-300 rounded-md text-gray-700"
                  >
                    Annuler
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                  >
                    Planifier l'audit
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DashboardDirecteurFinancier;
import React from 'react';
import { Routes, Route } from 'react-router-dom';
import './App.css';
import 'bootstrap/dist/css/bootstrap.min.css';
import 'bootstrap/dist/js/bootstrap.bundle.min';
import 'animate.css';

import Callback from './Components/Callback';
import Home from './Components/Home';
import Contact from './Components/Contact';
import Services from './Components/Services';
import Login from './Components/Login';
import Signup from './Components/Signup';
import Dashboard from './Components/Dashboard';
import Compte from './Components/Compte';
import ForgotPassword from './Components/ForgotPassword';
import Validation from './Components/Validation';
import Profil from './Components/Profil';
import PrivateRoute from './Components/PrivateRoute';
import SignalerCompte from './Components/SignalerCompte';
import ModifProfil from './Components/ModifProfil';
import DashboardComptable from './Components/DashboardComptable';
import DashboardDirecteur from './Components/DashboardDirecteur';
import PrivateRouteComptable from './Components/PrivateRouteComptable';
import PrivateRouteDirecteur from './Components/PrivateRouteDirecteur';
import ProfilComptable from './Components/ProfilComptable';
import ModifComptable from './Components/ModifComptable';
import Rapport from './Components/Rapport';
import ModifRapport from './Components/ModifRapport';
import ExporterRapport from './Components/ExporterRapport';
import CreerRapport from './Components/CreerRapport';
import ResetPassword from './Components/ResetPassword';
import ProfilDirecteur from './Components/ProfilDirecteur';
import ModifDirecteur from './Components/ModifDirecteur';
import Facture from './Components/Facture';
import Audit from './Components/Audit';
import Calendar from './Components/Calender';
//import { BrowserRouter, useNavigate, useLocation } from 'react-router-dom';
import { GoogleOAuthProvider } from '@react-oauth/google';
import { UserProvider } from './Components/UserContext';
// Composant pour vérifier l'authentification globale
/*function AuthCheck() {
  const navigate = useNavigate();
  const location = useLocation();
  
 // Dans le composant AuthCheck
React.useEffect(() => {
  const isProtectedRoute = location.pathname.includes('/dashboard');
  if (isProtectedRoute && !localStorage.getItem('access_token')) {
      localStorage.setItem('redirectPath', location.pathname);
      navigate('/connexion');
  }
}, [location])};*/
function App() {
  return (
    <div className="App">
      <GoogleOAuthProvider clientId="11479995049-09n7oceljn4sgmodv5til5uj7bd072jp.apps.googleusercontent.com">
        <UserProvider>
         {/* Ajouter ce composant pour la vérification globale */}
          <Routes>
            {/* Routes publiques */}
            <Route path="/" element={<Home />} />
            <Route path="/contact" element={<Contact />} />
            <Route path="/services" element={<Services />} />
            <Route path="/connexion" element={<Login />} />
            <Route path="/signup" element={<Signup />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route path="/reset-password/:token" element={<ResetPassword />} />
            <Route path="/auth/google/callback" element={<Callback />} />

            {/* Routes Dashboard (admin ou général) */}
            <Route
              path="/dashboard"
              element={
                <PrivateRoute>
                  <Dashboard />
                </PrivateRoute>
              }
            >
              <Route path="comptes" element={<Compte />} />
              <Route path="profil" element={<Profil />} />
              <Route path="validation" element={<Validation />} />
              <Route path="signalercompte" element={<SignalerCompte />} />
              <Route path="modify_profil/:id" element={<ModifProfil />} />
            </Route>

            {/* Routes Comptable */}
            <Route
              path="/dashboardcomptable"
              element={
                <PrivateRouteComptable>
                  <DashboardComptable />
                </PrivateRouteComptable>
              }
            >
              <Route path="profilcomptable" element={<ProfilComptable />} />
              <Route path="rapports" element={<Rapport />} />
              <Route path="creer_rapport" element={<CreerRapport />} />
              <Route path="modif_rapport/:id" element={<ModifRapport />} />
              <Route path="exporter_rapport/:id" element={<ExporterRapport />} />
              <Route path="modif_profil/:id" element={<ModifComptable />} />
              <Route path="facture" element={<Facture />} />
            </Route>

            {/* Routes Directeur */}
            <Route
              path="/dashboarddirecteur"
              element={
                <PrivateRouteDirecteur>
                  <DashboardDirecteur />
                </PrivateRouteDirecteur>
              }
            >
              <Route path="profildirecteur" element={<ProfilDirecteur />} />
              <Route path="modify_profil/:id" element={<ModifDirecteur />} />
              <Route path="audits" element={<Audit />} />
              <Route path="calendar" element={<Calendar/>} />
            </Route>
          </Routes>
        </UserProvider>
      </GoogleOAuthProvider>
    </div>
  );
}

export default App;

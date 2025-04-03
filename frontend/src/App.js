import React from 'react';
import { Routes, Route } from 'react-router-dom';
import './App.css';
import 'bootstrap/dist/css/bootstrap.min.css';
import 'bootstrap/dist/js/bootstrap.bundle.min';
import 'animate.css';

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
import DashboardComptable from './Components/DashboardComptable'; // Correction ici
import DashboardDirecteur from './Components/DashboardDirecteur'; // Correction ici
import PrivateRouteComptable from './Components/PrivateRouteComptable';
import PrivateRouteDirecteur from './Components/PrivateRouteDirecteur';
import ProfilComptable from './Components/ProfilComptable';
import ModifComptable from './Components/ModifComptable';
import Rapport from './Components/Rapport';
import ModifRapport from './Components/ModifRapport';
import ExporterRapport from './Components/ExporterRapport';
import CreerRapport from './Components/CreerRapport';
import ResetPassword from './Components/ResetPassword';
import ProfilDirecteur from './Components/ProfilDirecteur'
import ModifDirecteur from './Components/ModifDirecteur';

function App() {
  return (
    <div className="App">
      <Routes>
        {/* Routes publiques */}
        <Route path="/home" element={<Home />} />
        <Route path="/contact" element={<Contact />} />
        <Route path="/services" element={<Services />} />
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password" element={<ResetPassword />} />

        {/* Route protégée pour le Dashboard */}
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

        {/* Route protégée pour le Dashboard Comptable */}
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
        </Route>

        {/* Route protégée pour le Dashboard Directeur */}
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
        </Route>
      </Routes>
    </div>
  );
}

export default App;

import React from 'react';
import { Routes, Route } from 'react-router-dom';
import './App.css';
import 'bootstrap/dist/css/bootstrap.min.css';
import 'bootstrap/dist/js/bootstrap.bundle.min';
import 'animate.css';
import Activatecompte from './Components/Activatecompte';
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
import PendingUsers from './Components/PendingUsers';
import ModifProfil from './Components/ModifProfil';
import DashboardComptable from './Components/DashboardComptable';
import DashboardDirecteur from './Components/DashboardDirecteur';
import PrivateRouteComptable from './Components/PrivateRouteComptable';
import PrivateRouteDirecteur from './Components/PrivateRouteDirecteur';
import ProfilComptable from './Components/ProfilComptable';
import ModifComptable from './Components/ModifComptable';
import RapportsList from './Components/RapportsList';
import ModifRapport from './Components/ModifRapport';
import ExporterRapport from './Components/ExporterRapport';
import CreerRapport from './Components/CreerRapport';
import ResetPassword from './Components/ResetPassword';
import ProfilDirecteur from './Components/ProfilDirecteur';
import ModifDirecteur from './Components/ModifDirecteur';
import Facture from './Components/Facture';
import Audit from './Components/Audit';
import Calendar from './Components/Calender';
import FactureDetail from './Components/FactureDetail';
//import { BrowserRouter, useNavigate, useLocation } from 'react-router-dom';
import { GoogleOAuthProvider } from '@react-oauth/google';

import { UserProvider } from './Components/UserContext';
import Banque from './Components/Banque';
import Rapprochement from './Components/Rapprochement';

import RapportDetail from './Components/RapportDetail';
import RapportDirecteur from './Components/RapportDirecteur';
import RapportPage from './Components/RapportPage';

import RapportAdmin from './Components/RapportAdmin'; // Importez le bouton de connexion Facebook

function App() {
  return (
    <div className="App">
      <GoogleOAuthProvider clientId="11479995049-09n7oceljn4sgmodv5til5uj7bd072jp.apps.googleusercontent.com">
        <UserProvider>
          <Routes>
            {/* Routes publiques */}
            <Route path="/" element={<Home />} />
            <Route path="/contact" element={<Contact />} />
            <Route path="/services" element={<Services />} />
            <Route path="/connexion" element={<Login />}>
              {/* Ajoutez le bouton de connexion Facebook ici ou dans le composant Login */}
             
            </Route>
            <Route path="/signup" element={<Signup />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route path="/reset-password/:token" element={<ResetPassword />} />
            <Route path="/auth/google/callback" element={<Callback />} />
            
            <Route path="/activate/:token" element={<Activatecompte />} />

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
              <Route path="profile" element={<Profil />} />
              <Route path="validation" element={<Validation />} />
              <Route path="rapports" element={<RapportAdmin />} />
              <Route path="edit-profile" element={<ModifProfil />} />
              <Route path="pending-users" element={<PendingUsers />} />
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

              <Route path="creer_rapport" element={<CreerRapport />} />
              <Route path="modif_rapport/:id" element={<ModifRapport />} />
              <Route path="exporter_rapport/:id" element={<ExporterRapport />} />
              <Route path="modif_profil" element={<ModifComptable />} />
              <Route path="facture" element={<Facture />} />
              <Route path="factures/:id" element={<FactureDetail />} />
              <Route path="banque" element={<Banque />} />
              <Route path="rapprochement" element={<Rapprochement />} />
              <Route path="rapport_detail" element={<RapportDetail />} />
              <Route path="rapport" element={<RapportPage />} />

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
              <Route path="modify_profil" element={<ModifDirecteur />} />
              <Route path="audits" element={<Audit />} />
              <Route path="rapports" element={<RapportDirecteur />} />
              <Route path="rapport_detail" element={<RapportDetail />} />
              <Route path="calendar" element={<Calendar />} />
            </Route>
          </Routes>
        </UserProvider>
      </GoogleOAuthProvider>
    </div>
  );
}

export default App;
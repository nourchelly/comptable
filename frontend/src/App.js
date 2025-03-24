import './App.css';
import 'bootstrap/dist/css/bootstrap.min.css';
import 'animate.css';
import { Routes, Route } from 'react-router-dom';
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
import ModifProfil from './Components/ModifProfil'

function App() {
  return (
    <div className="App">
      <Routes>
        <Route path="/home" element={<Home />} />
        <Route path="/contact" element={<Contact/>} />
        <Route path="/services" element={<Services />} />
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/dashboard" element={
          <PrivateRoute>
            <Dashboard />
          </PrivateRoute>
        }>
          <Route path="comptes" element={<Compte />} />
          <Route path="profil" element={<Profil />} />
          <Route path="validation" element={<Validation />} />
          <Route path="signalercompte" element={<SignalerCompte />} />
          <Route path="modify_profil/:id" element={<ModifProfil />} />
        </Route>
      </Routes>
    </div>
  );
}

export default App;

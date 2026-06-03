import React, { useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { isAuthenticated } from './utils/auth';
import CurtainIntro from './components/CurtainIntro';
import Home from './pages/Home';
import Cars from './pages/Cars';
import Chef from './pages/Chef';
import Gestion from './pages/Gestion';
import Dashboard from './pages/Dashboard';
import Contrat from './pages/Contrat';
import Facture from './pages/Facture';
import Alertes from './pages/Alertes';

const ProtectedRoute = ({ children }) => {
  if (!isAuthenticated()) return <Navigate to="/chef" replace />;
  return children;
};

export default function App() {
  // Rideau uniquement sur la page d'accueil, une seule fois par session
  const [showCurtain, setShowCurtain] = useState(
    () => window.location.pathname === '/'
  );

  return (
    <BrowserRouter>
      {showCurtain && (
        <CurtainIntro onComplete={() => setShowCurtain(false)} />
      )}
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/cars" element={<Cars />} />
        <Route path="/chef" element={<Chef />} />
        <Route path="/chef/gestion" element={<ProtectedRoute><Gestion /></ProtectedRoute>} />
        <Route path="/chef/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
        <Route path="/chef/contrat" element={<ProtectedRoute><Contrat /></ProtectedRoute>} />
        <Route path="/chef/facture" element={<ProtectedRoute><Facture /></ProtectedRoute>} />
        <Route path="/chef/alertes" element={<ProtectedRoute><Alertes /></ProtectedRoute>} />
      </Routes>
    </BrowserRouter>
  );
}

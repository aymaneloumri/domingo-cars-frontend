import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { setToken, isAuthenticated, removeToken } from '../utils/auth';
import { API_BASE } from '../utils/config';
import LogoCircle from '../components/LogoCircle';

const NAV_CARDS = [
  {
    icon: '🗂',
    title: 'GESTION',
    desc: 'Voitures · Annonces · Réservations',
    path: '/chef/gestion',
  },
  {
    icon: '📅',
    title: 'CALENDRIER',
    desc: 'Disponibilité & planning',
    path: '/chef/dashboard',
  },
  {
    icon: '📄',
    title: 'CONTRATS',
    desc: 'Créer & gérer les contrats PDF',
    path: '/chef/contrat',
  },
  {
    icon: '🧾',
    title: 'FACTURATION',
    desc: 'Générer une facture client',
    path: '/chef/facture',
  },
];

export default function Chef() {
  const navigate = useNavigate();
  const [authed, setAuthed] = useState(isAuthenticated());
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setAuthed(isAuthenticated());
  }, []);

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const res = await axios.post(`${API_BASE}/api/auth`, { password });
      setToken(res.data.token);
      setAuthed(true);
    } catch {
      setError('Mot de passe incorrect');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    removeToken();
    setAuthed(false);
    setPassword('');
  };

  if (!authed) {
    return (
      <div className="min-h-screen bg-[#0A0A0A] flex items-center justify-center px-4">
        <div className="w-full max-w-sm">
          <div className="text-center mb-10">
            <div className="flex justify-center mb-3"><LogoCircle size={100} /></div>
            <div className="font-heading text-3xl text-white mb-1">DOMINGO CARS</div>
            <div className="font-heading text-2xl text-[#FF6B00]">LUXURY RENT</div>
            <p className="font-body text-gray-500 text-sm mt-3 tracking-widest uppercase">Espace Gérant</p>
          </div>

          <form onSubmit={handleLogin} className="bg-[#111] border border-[#222] rounded-lg p-8">
            <div className="mb-2">
              <label className="text-xs text-gray-400 font-body block mb-2 uppercase tracking-wider">Mot de passe</label>
              <input
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full bg-[#0A0A0A] border border-[#333] text-white font-body px-4 py-3 rounded focus:border-[#FF6B00] focus:outline-none transition-colors"
                autoFocus
              />
            </div>

            {error && (
              <p className="text-red-400 text-xs font-body mt-2 mb-3 bg-red-900/20 border border-red-800/30 px-3 py-2 rounded">
                {error}
              </p>
            )}

            <button type="submit" disabled={loading || !password}
              className="w-full mt-4 bg-[#FF6B00] text-white font-heading text-xl tracking-wider py-3 rounded hover:bg-orange-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
              {loading ? 'Connexion...' : 'ENTRER'}
            </button>
          </form>

          <div className="text-center mt-6">
            <a href="/" className="text-gray-600 text-xs font-body hover:text-gray-400 transition-colors">
              ← Retour au site
            </a>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0A0A0A] flex flex-col items-center justify-center px-4 py-12">
      <div className="text-center mb-12">
        <div className="flex justify-center mb-3"><LogoCircle size={100} /></div>
        <div className="font-heading text-4xl text-white mb-1">DOMINGO CARS</div>
        <div className="font-heading text-3xl text-[#FF6B00]">LUXURY RENT</div>
        <p className="font-body text-gray-500 text-sm mt-3 tracking-widest uppercase">Espace de gestion</p>
      </div>

      <div className="w-full max-w-lg space-y-4">
        {NAV_CARDS.map(card => (
          <button key={card.path} onClick={() => navigate(card.path)}
            className="group w-full bg-[#1a1a1a] border-l-4 border-[#FF6B00] px-6 py-5 text-left hover:bg-[#FF6B00] transition-all duration-200 rounded-r-lg flex items-center justify-between">
            <div className="flex items-center gap-4">
              <span className="text-2xl">{card.icon}</span>
              <div>
                <div className="font-heading text-xl tracking-wider group-hover:text-white">{card.title}</div>
                <div className="font-body text-sm text-gray-400 group-hover:text-white/80 mt-0.5">{card.desc}</div>
              </div>
            </div>
            <span className="text-[#FF6B00] group-hover:text-white text-xl opacity-0 group-hover:opacity-100 transition-all duration-200 translate-x-2 group-hover:translate-x-0">→</span>
          </button>
        ))}
      </div>

      <button onClick={handleLogout}
        className="mt-10 flex items-center gap-2 border border-[#333] text-gray-500 font-body text-sm px-5 py-2 rounded hover:border-red-600 hover:text-red-400 transition-all">
        🔓 Déconnexion
      </button>

      <div className="mt-6">
        <a href="/" className="text-gray-600 text-xs font-body hover:text-gray-400 transition-colors">
          ← Retour au site public
        </a>
      </div>
    </div>
  );
}

import React from 'react';
import { useNavigate } from 'react-router-dom';
import LogoCircle from './LogoCircle';

export default function ChefHeader({ title }) {
  const navigate = useNavigate();

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-[#0A0A0A] border-b border-[#222] h-14 flex items-center px-4 md:px-6">
      <button
        onClick={() => navigate('/chef')}
        className="flex items-center gap-2 px-3 py-1.5 border border-[#333] text-sm font-body text-gray-300 hover:bg-[#FF6B00] hover:border-[#FF6B00] hover:text-white transition-all duration-200 rounded"
      >
        ← Accueil
      </button>

      <div className="flex-1 flex items-center justify-center gap-2">
        <LogoCircle size={44} />
        <span className="font-heading text-lg tracking-widest text-white hidden sm:inline">DOMINGO CARS</span>
        <span className="font-heading text-lg tracking-widest text-[#FF6B00] hidden sm:inline">LUXURY RENT</span>
      </div>

      <div className="px-3 py-1.5 bg-[#1a1a1a] border border-[#333] rounded">
        <span className="font-heading text-sm tracking-wider text-[#FF6B00]">{title}</span>
      </div>
    </header>
  );
}

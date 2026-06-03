import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import CarCard from '../components/CarCard';
import LogoCircle from '../components/LogoCircle';
import { API_BASE } from '../utils/config';

const WA_LINK = 'https://wa.me/212701050809';

const filterBtn = (active) => ({
  flexShrink: 0,
  padding: '6px 16px',
  borderRadius: 20,
  fontSize: 12,
  fontFamily: '"DM Sans", sans-serif',
  cursor: 'pointer',
  border: 'none',
  background: active ? '#FF6B00' : 'transparent',
  color: active ? '#fff' : '#666',
  outline: active ? 'none' : '0.5px solid #333',
  transition: 'all 0.2s',
});

export default function Cars() {
  const [cars, setCars] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterCategory, setFilterCategory] = useState('Tous');
  const [filterCarburant, setFilterCarburant] = useState('tous');
  const [filterBoite, setFilterBoite] = useState('tous');

  const categories = ['Tous', 'Berline', 'Citadine', 'SUV', 'Utilitaire'];

  useEffect(() => {
    fetch(`${API_BASE}/api/cars`)
      .then(r => r.json())
      .then(data => { setCars(data); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const filteredCars = cars.filter(car => {
    const matchCategory  = filterCategory === 'Tous' || car.category === filterCategory;
    const matchCarburant = filterCarburant === 'tous' || car.carburant === filterCarburant;
    const matchBoite     = filterBoite === 'tous' || car.boite_vitesse === filterBoite;
    return matchCategory && matchCarburant && matchBoite;
  });

  return (
    <div className="min-h-screen bg-[#0A0A0A] text-white">
      {/* Header */}
      <header className="bg-[#0A0A0A] border-b border-[#222] sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2 hover:text-[#FF6B00] transition-colors">
            <LogoCircle size={44} />
            <span className="font-heading text-xl tracking-wider">← DOMINGO CARS</span>
          </Link>
          <h1 className="font-heading text-2xl tracking-widest hidden md:block">NOTRE FLOTTE</h1>
          <a href={WA_LINK} target="_blank" rel="noopener noreferrer"
            className="bg-[#FF6B00] text-white font-body text-sm px-4 py-2 hover:bg-orange-500 transition-colors rounded">
            Réserver
          </a>
        </div>
      </header>

      {/* Hero strip */}
      <div className="bg-[#111] border-b border-[#1e1e1e] py-8 px-4">
        <div className="max-w-7xl mx-auto">
          <p className="text-[#FF6B00] font-heading text-sm tracking-[0.3em] mb-1">DOMINGO CARS LUXURY RENT</p>
          <h2 className="font-heading text-4xl md:text-5xl">NOTRE FLOTTE</h2>
          <p className="font-body text-gray-400 text-sm mt-2">
            {filteredCars.length} véhicule{filteredCars.length !== 1 ? 's' : ''} — Casablanca, Maroc
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="border-b border-[#1e1e1e] sticky top-[65px] z-30 bg-[#0A0A0A]">
        <div className="max-w-7xl mx-auto px-4 py-3 space-y-2">
          {/* Category filter */}
          <div className="flex gap-2 overflow-x-auto pb-1">
            {categories.map(cat => (
              <button key={cat} onClick={() => setFilterCategory(cat)}
                className={`flex-shrink-0 px-4 py-1.5 text-sm font-body rounded transition-all ${
                  filterCategory === cat
                    ? 'bg-[#FF6B00] text-white'
                    : 'bg-[#111] border border-[#333] text-gray-400 hover:border-[#FF6B00] hover:text-white'
                }`}>
                {cat}
              </button>
            ))}
          </div>

          {/* Carburant + Boîte filters */}
          <div className="flex flex-wrap gap-4 items-center">
            <div className="flex gap-2 overflow-x-auto">
              {[
                { value: 'tous', label: 'Tous carburants' },
                { value: 'essence', label: '⛽ Essence' },
                { value: 'diesel', label: '🛢️ Diesel' },
                { value: 'hybride', label: '⚡ Hybride' },
                { value: 'electrique', label: '🔋 Électrique' },
              ].map(f => (
                <button key={f.value} onClick={() => setFilterCarburant(f.value)}
                  style={filterBtn(filterCarburant === f.value)}>
                  {f.label}
                </button>
              ))}
            </div>
            <div className="w-px h-5 bg-[#333] hidden sm:block" />
            <div className="flex gap-2 overflow-x-auto">
              {[
                { value: 'tous', label: 'Toutes boîtes' },
                { value: 'manuelle', label: '🔧 Manuelle' },
                { value: 'automatique', label: '🤖 Automatique' },
              ].map(f => (
                <button key={f.value} onClick={() => setFilterBoite(f.value)}
                  style={filterBtn(filterBoite === f.value)}>
                  {f.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Grid */}
      <main className="max-w-7xl mx-auto px-4 py-10">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="w-10 h-10 border-2 border-[#FF6B00] border-t-transparent rounded-full animate-spin" />
          </div>
        ) : filteredCars.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-gray-500 font-body">Aucun véhicule pour ces filtres.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredCars.map(car => <CarCard key={car.id} car={car} />)}
          </div>
        )}
      </main>

      {/* WhatsApp FAB */}
      <a href={WA_LINK} target="_blank" rel="noopener noreferrer"
        className="fixed bottom-6 right-6 z-50 bg-[#25D366] rounded-full w-14 h-14 flex items-center justify-center shadow-2xl hover:scale-110 transition-transform">
        <svg viewBox="0 0 24 24" className="w-7 h-7 fill-white">
          <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
        </svg>
      </a>
    </div>
  );
}

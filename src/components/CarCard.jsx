import React, { useState } from 'react';
import axios from 'axios';
import { imgUrl, API_BASE } from '../utils/config';

const today = new Date().toISOString().split('T')[0];

const addOneDay = (dateStr) => {
  if (!dateStr) return '';
  const d = new Date(dateStr + 'T00:00:00');
  d.setDate(d.getDate() + 1);
  return d.toISOString().split('T')[0];
};

export default function CarCard({ car }) {
  const [startDate, setStartDate]   = useState('');
  const [endDate, setEndDate]       = useState('');
  const [availability, setAvailability] = useState(null);
  const [checking, setChecking]     = useState(false);
  const [dateError, setDateError]   = useState('');

  const checkAvailability = async () => {
    setDateError('');
    if (!startDate || !endDate) {
      setDateError('Veuillez sélectionner les deux dates');
      return;
    }
    if (new Date(endDate) <= new Date(startDate)) {
      setDateError('La date de retour doit être après la date de départ');
      return;
    }
    setChecking(true);
    setAvailability(null);
    try {
      const res = await axios.get(`${API_BASE}/api/cars/${car.id}/availability`, {
        params: { start: startDate, end: endDate },
      });
      setAvailability(res.data.available);
    } catch { setAvailability(null); }
    finally { setChecking(false); }
  };

  const waMessage = encodeURIComponent(
    `Bonjour, je souhaite réserver la ${car.name} du ${startDate} au ${endDate}. Merci.`
  );

  const endInvalid = endDate && startDate && new Date(endDate) <= new Date(startDate);

  return (
    <div className="bg-[#111] border border-[#222] hover:border-[#FF6B00]/50 transition-all duration-300 flex flex-col">
      <div className="aspect-video overflow-hidden">
        <img src={imgUrl(car.image_url)} alt={car.name}
          className="w-full h-full object-cover hover:scale-105 transition-transform duration-500"
          onError={e => { e.target.src = 'https://images.unsplash.com/photo-1494905998402-395d579af36f?w=600&auto=format&fit=crop'; }} />
      </div>

      <div className="p-4 flex flex-col flex-1 gap-3">
        <div>
          <p className="text-[#FF6B00] text-xs font-body uppercase tracking-widest mb-1">{car.category}</p>
          <h3 className="font-heading text-xl">{car.name}</h3>
          <div className="flex gap-2 mt-2 flex-wrap">
            <span className={`text-xs font-body px-2.5 py-0.5 rounded-full border ${
              car.carburant === 'diesel' ? 'text-gray-400 bg-gray-400/10 border-gray-400/30' :
              car.carburant === 'hybride' ? 'text-green-400 bg-green-400/10 border-green-400/30' :
              car.carburant === 'electrique' ? 'text-blue-400 bg-blue-400/10 border-blue-400/30' :
              'text-[#FF6B00] bg-[#FF6B00]/10 border-[#FF6B00]/30'
            }`}>
              {car.carburant === 'diesel' ? '🛢️' : car.carburant === 'hybride' ? '⚡' : car.carburant === 'electrique' ? '🔋' : '⛽'} {car.carburant ? car.carburant.charAt(0).toUpperCase() + car.carburant.slice(1) : 'Essence'}
            </span>
            <span className="text-xs font-body px-2.5 py-0.5 rounded-full border text-gray-400 bg-gray-400/10 border-gray-400/30">
              {car.boite_vitesse === 'automatique' ? '🤖' : '🔧'} {car.boite_vitesse ? car.boite_vitesse.charAt(0).toUpperCase() + car.boite_vitesse.slice(1) : 'Manuelle'}
            </span>
          </div>
          {car.description && <p className="text-gray-400 text-xs font-body mt-1">{car.description}</p>}
        </div>

        <div className="flex items-baseline gap-1">
          <span className="font-heading text-2xl">{car.price_per_day}</span>
          <span className="text-gray-400 text-sm font-body">MAD / jour</span>
        </div>

        <div className="space-y-2">
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-xs text-gray-400 font-body block mb-1">Départ</label>
              <input type="date" value={startDate} min={today}
                onChange={e => { setStartDate(e.target.value); setEndDate(''); setAvailability(null); setDateError(''); }}
                className={`date-input ${!startDate && dateError ? 'invalid' : ''}`} />
            </div>
            <div>
              <label className="text-xs text-gray-400 font-body block mb-1">Retour</label>
              <input type="date" value={endDate} min={addOneDay(startDate) || today}
                onChange={e => { setEndDate(e.target.value); setAvailability(null); setDateError(''); }}
                className={`date-input ${endInvalid ? 'invalid' : ''}`} />
            </div>
          </div>

          {dateError && <p className="date-error">{dateError}</p>}

          <button onClick={checkAvailability} disabled={checking}
            className="w-full bg-[#1a1a1a] border border-[#333] text-sm font-body py-1.5 hover:border-[#FF6B00] hover:text-[#FF6B00] transition-all disabled:opacity-40 disabled:cursor-not-allowed rounded">
            {checking ? 'Vérification...' : 'Vérifier disponibilité'}
          </button>
        </div>

        {availability !== null && (
          <div className={`text-sm font-body text-center py-1.5 rounded border ${
            availability ? 'text-green-400 border-green-400/30 bg-green-400/10' : 'text-red-400 border-red-400/30 bg-red-400/10'
          }`}>
            {availability ? '✅ Disponible' : '❌ Indisponible pour ces dates'}
          </div>
        )}

        {availability && (
          <a href={`https://wa.me/212701050809?text=${waMessage}`}
            target="_blank" rel="noopener noreferrer"
            className="block w-full bg-[#FF6B00] text-white text-center text-sm font-body font-semibold py-2.5 rounded hover:bg-orange-500 transition-colors">
            Réserver via WhatsApp →
          </a>
        )}
      </div>
    </div>
  );
}

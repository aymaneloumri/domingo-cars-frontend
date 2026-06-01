import React, { useState, useEffect, useCallback } from 'react';
import api from '../utils/api';
import { API_BASE } from '../utils/config';
import ChefHeader from '../components/ChefHeader';
import GanttCalendar from '../components/GanttCalendar';

const MONTH_NAMES = ['Janvier','Février','Mars','Avril','Mai','Juin','Juillet','Août','Septembre','Octobre','Novembre','Décembre'];

export default function Dashboard() {
  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [stats, setStats] = useState({ totalCars: 0, availableToday: 0, rentedToday: 0, monthlyCount: 0 });
  const [cars, setCars] = useState([]);
  const [reservations, setReservations] = useState([]);

  const monthStr = `${year}-${String(month).padStart(2, '0')}`;

  const loadCalendar = useCallback(async () => {
    try {
      console.log('Dashboard API:', `${API_BASE}/api/dashboard`);
      const r = await api.get('/dashboard', { params: { calendar: 1, month: monthStr } });
      console.log('Calendar data:', r.data);
      setCars(r.data.cars);
      setReservations(r.data.reservations);
    } catch (err) {
      console.error('Calendar load error:', err);
    }
  }, [monthStr]);

  const loadStats = useCallback(async () => {
    try {
      const r = await api.get('/dashboard', { params: { stats: 1 } });
      setStats(r.data);
    } catch {}
  }, []);

  useEffect(() => { loadCalendar(); loadStats(); }, [loadCalendar, loadStats]);

  const prevMonth = () => {
    if (month === 1) { setYear(y => y - 1); setMonth(12); }
    else setMonth(m => m - 1);
  };
  const nextMonth = () => {
    if (month === 12) { setYear(y => y + 1); setMonth(1); }
    else setMonth(m => m + 1);
  };
  const goToday = () => { setYear(now.getFullYear()); setMonth(now.getMonth() + 1); };

  const handleNewReservation = async (data) => {
    await api.post('/reservations', data);
    loadCalendar(); loadStats();
  };

  const handleUpdateReservation = async (data) => {
    await api.put(`/reservations/${data.id}`, data);
    loadCalendar(); loadStats();
  };

  const handleDeleteReservation = async (id) => {
    await api.delete(`/reservations/${id}`);
    loadCalendar(); loadStats();
  };

  const STAT_CARDS = [
    { icon: '🚗', label: 'Flotte totale', value: stats.totalCars, color: 'border-blue-500/30 text-blue-400' },
    { icon: '✅', label: 'Disponibles aujourd\'hui', value: stats.availableToday, color: 'border-green-500/30 text-green-400' },
    { icon: '🔴', label: 'En location aujourd\'hui', value: stats.rentedToday, color: 'border-[#FF6B00]/30 text-[#FF6B00]' },
    { icon: '📅', label: 'Réservations ce mois', value: stats.monthlyCount, color: 'border-purple-500/30 text-purple-400' },
  ];

  return (
    <div className="min-h-screen bg-[#0A0A0A] text-white pt-14">
      <ChefHeader title="CALENDRIER" />

      <div className="max-w-full px-4 md:px-6 py-6">
        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          {STAT_CARDS.map(s => (
            <div key={s.label} className={`bg-[#111] border ${s.color} rounded-lg p-4`}>
              <div className="text-2xl mb-1">{s.icon}</div>
              <div className={`font-heading text-3xl ${s.color.split(' ')[1]}`}>{s.value}</div>
              <div className="font-body text-xs text-gray-400 mt-1">{s.label}</div>
            </div>
          ))}
        </div>

        {/* Calendar nav */}
        <div className="flex flex-wrap items-center justify-between gap-4 mb-4">
          <div className="flex items-center gap-2">
            <button onClick={prevMonth}
              className="w-8 h-8 flex items-center justify-center bg-[#111] border border-[#333] rounded hover:border-[#FF6B00] hover:text-[#FF6B00] transition-colors font-body">
              ◀
            </button>
            <span className="font-heading text-xl min-w-[200px] text-center">
              {MONTH_NAMES[month - 1]} {year}
            </span>
            <button onClick={nextMonth}
              className="w-8 h-8 flex items-center justify-center bg-[#111] border border-[#333] rounded hover:border-[#FF6B00] hover:text-[#FF6B00] transition-colors font-body">
              ▶
            </button>
          </div>
          <div className="flex gap-2">
            <button onClick={goToday}
              className="px-4 py-1.5 bg-[#111] border border-[#333] text-sm font-body rounded hover:border-[#FF6B00] hover:text-[#FF6B00] transition-colors">
              Aujourd'hui
            </button>
          </div>
        </div>

        {/* Legend */}
        <div className="flex flex-wrap gap-4 mb-4">
          {[
            { color: 'bg-[#FF6B00]', label: 'Confirmé' },
            { color: 'bg-[#2a2a2a] border border-[#555]', label: 'En attente' },
            { color: 'bg-red-900/40 border border-red-800/50', label: 'Annulé' },
          ].map(l => (
            <div key={l.label} className="flex items-center gap-1.5 font-body text-xs text-gray-400">
              <span className={`inline-block w-4 h-3 rounded ${l.color}`} />
              {l.label}
            </div>
          ))}
          <div className="flex items-center gap-1.5 font-body text-xs text-gray-400">
            <span className="inline-block w-4 h-3 rounded bg-[#FF6B00]/10 border border-[#FF6B00]/30" />
            Aujourd'hui
          </div>
        </div>

        {/* Gantt */}
        <div className="rounded-xl overflow-hidden border border-[#222]">
          {cars.length === 0 ? (
            <div className="flex items-center justify-center py-20 text-gray-500 font-body">
              Aucune voiture dans la flotte.
            </div>
          ) : (
            <GanttCalendar
              cars={cars}
              reservations={reservations}
              year={year}
              month={month}
              onNewReservation={handleNewReservation}
              onUpdateReservation={handleUpdateReservation}
              onDeleteReservation={handleDeleteReservation}
            />
          )}
        </div>
      </div>
    </div>
  );
}

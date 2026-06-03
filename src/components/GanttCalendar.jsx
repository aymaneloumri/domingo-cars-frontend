import React, { useState, useRef, useMemo } from 'react';
import ClientSelector from './ClientSelector';
import { getToken } from '../utils/auth';

const DAY_W = 44;
const ROW_H = 56;
const SIDEBAR_W = 176;

function daysInMonth(year, month) {
  return new Date(year, month, 0).getDate();
}

function isToday(year, month, day) {
  const t = new Date();
  return t.getFullYear() === year && t.getMonth() + 1 === month && t.getDate() === day;
}

function isWeekend(year, month, day) {
  const d = new Date(year, month - 1, day).getDay();
  return d === 0 || d === 6;
}

function getBlockGeometry(res, year, month) {
  const numDays = daysInMonth(year, month);
  const mStart = new Date(year, month - 1, 1);
  const mEnd = new Date(year, month - 1, numDays);

  const rStart = new Date(res.start_date + 'T00:00:00');
  const rEnd = new Date(res.end_date + 'T00:00:00');

  if (rEnd < mStart || rStart > mEnd) return null;

  const effStart = rStart < mStart ? mStart : rStart;
  const effEnd = rEnd > mEnd ? mEnd : rEnd;

  const startDay = effStart.getDate();
  const endDay = effEnd.getDate();

  return {
    left: (startDay - 1) * DAY_W + 2,
    width: (endDay - startDay + 1) * DAY_W - 4,
  };
}

const STATUS_STYLES = {
  confirmed: { bg: 'bg-[#FF6B00]', text: 'text-white', border: '' },
  pending:   { bg: 'bg-[#2a2a2a]', text: 'text-gray-300', border: 'border border-[#555]' },
  cancelled: { bg: 'bg-red-900/40', text: 'text-red-400 line-through', border: 'border border-red-800/50' },
};

export default function GanttCalendar({
  cars, reservations, year, month,
  onNewReservation, onUpdateReservation, onDeleteReservation,
}) {
  const [popover, setPopover] = useState(null);
  const [newResModal, setNewResModal] = useState(null);
  const [editModal, setEditModal] = useState(null);
  const ganttRef = useRef(null);

  const numDays = daysInMonth(year, month);
  const days = Array.from({ length: numDays }, (_, i) => i + 1);

  const monthStr = `${year}-${String(month).padStart(2, '0')}`;

  // Precompute booked dates per car for fast cell lookup
  const bookedDates = useMemo(() => {
    const map = {};
    reservations.forEach(r => {
      if (r.status === 'cancelled') return;
      if (!map[r.car_id]) map[r.car_id] = {};
      let cur = new Date(r.start_date + 'T00:00:00');
      const end = new Date(r.end_date + 'T00:00:00');
      while (cur <= end) {
        map[r.car_id][cur.toISOString().split('T')[0]] = r.id;
        cur.setDate(cur.getDate() + 1);
      }
    });
    return map;
  }, [reservations]);

  const getResForDate = (carId, dateStr) => {
    const resId = bookedDates[carId]?.[dateStr];
    return resId ? reservations.find(r => r.id === resId) : null;
  };

  const handleCellClick = (car, day) => {
    const dateStr = `${monthStr}-${String(day).padStart(2, '0')}`;
    const existing = getResForDate(car.id, dateStr);
    if (existing) {
      // Booked cell → show popover for that reservation
      setNewResModal(null);
      setEditModal(null);
      setPopover(p => p?.id === existing.id ? null : existing);
    } else {
      setPopover(null);
      const todayStr = new Date().toISOString().split('T')[0];
      const startDate = dateStr >= todayStr ? dateStr : todayStr;
      setNewResModal({ car_id: car.id, car_name: car.name, start_date: startDate, end_date: startDate, client_name: '', client_phone: '', status: 'confirmed' });
    }
  };

  const handleBlockClick = (e, res) => {
    e.stopPropagation();
    setNewResModal(null);
    setEditModal(null);
    setPopover(p => p?.id === res.id ? null : res);
  };

  const handleConfirm = async (res) => {
    await onUpdateReservation({ ...res, status: 'confirmed' });
    setPopover(null);
  };

  const handleCancel = async (res) => {
    await onUpdateReservation({ ...res, status: 'cancelled' });
    setPopover(null);
  };

  const handleDelete = async (res) => {
    if (window.confirm('Supprimer cette réservation ?')) {
      await onDeleteReservation(res.id);
      setPopover(null);
    }
  };

  const handleEdit = (res) => {
    setEditModal({ ...res });
    setPopover(null);
  };

  return (
    <div className="flex bg-[#0A0A0A] rounded-lg border border-[#222] overflow-hidden relative"
      onClick={() => setPopover(null)}>

      {/* Sidebar */}
      <div className="flex-shrink-0 z-20 bg-[#0A0A0A] border-r border-[#222]" style={{ width: SIDEBAR_W }}>
        <div className="h-10 border-b border-[#222] flex items-center px-3">
          <span className="text-xs text-gray-500 font-body uppercase tracking-wider">Voiture</span>
        </div>
        {cars.map(car => (
          <div key={car.id} style={{ height: ROW_H }}
            className="flex items-center px-3 gap-2 border-b border-[#1a1a1a]">
            {car.image_url && (
              <img src={car.image_url} alt="" className="w-8 h-6 object-cover rounded flex-shrink-0"
                onError={e => e.target.style.display = 'none'} />
            )}
            <span className="text-xs font-body text-gray-300 truncate">{car.name}</span>
          </div>
        ))}
      </div>

      {/* Gantt grid */}
      <div ref={ganttRef} className="flex-1 overflow-x-auto">
        <div style={{ width: numDays * DAY_W, minWidth: '100%' }}>
          {/* Day headers */}
          <div className="flex sticky top-0 bg-[#0d0d0d] z-10 border-b border-[#222]" style={{ height: 40 }}>
            {days.map(day => (
              <div key={day} style={{ width: DAY_W, flexShrink: 0 }}
                className={`flex flex-col items-center justify-center border-r border-[#1a1a1a] text-xs font-body
                  ${isToday(year, month, day) ? 'text-[#FF6B00] font-bold bg-[#FF6B00]/10' : 'text-gray-500'}
                  ${isWeekend(year, month, day) && !isToday(year, month, day) ? 'bg-[#0d0d0d]' : ''}
                `}>
                <span>{day}</span>
                <span className="text-[9px] opacity-60">
                  {['D','L','M','M','J','V','S'][new Date(year, month - 1, day).getDay()]}
                </span>
              </div>
            ))}
          </div>

          {/* Car rows */}
          {cars.map(car => {
            const carRes = reservations.filter(r => r.car_id === car.id);
            return (
              <div key={car.id} style={{ height: ROW_H, width: numDays * DAY_W }}
                className="relative border-b border-[#1a1a1a]">

                {/* Day cells (click targets) */}
                <div className="absolute inset-0 flex">
                  {days.map(day => {
                    const dateStr = `${monthStr}-${String(day).padStart(2, '0')}`;
                    const booked = !!bookedDates[car.id]?.[dateStr];
                    return (
                      <div key={day} style={{ width: DAY_W, flexShrink: 0 }}
                        className={`h-full border-r border-[#151515]
                          ${isToday(year, month, day) ? 'bg-[#FF6B00]/5' : ''}
                          ${isWeekend(year, month, day) && !isToday(year, month, day) ? 'bg-[#0d0d0d]' : ''}
                          ${booked ? 'cursor-default' : 'cursor-pointer hover:bg-[#FF6B00]/[0.06]'}
                        `}
                        onClick={() => handleCellClick(car, day)}
                      />
                    );
                  })}
                </div>

                {/* Reservation blocks */}
                {carRes.map(res => {
                  const geo = getBlockGeometry(res, year, month);
                  if (!geo) return null;
                  const style = STATUS_STYLES[res.status] || STATUS_STYLES.pending;
                  return (
                    <div key={res.id}
                      className={`absolute rounded text-xs font-body flex items-center px-2 cursor-pointer z-10
                        ${style.bg} ${style.text} ${style.border} hover:opacity-90 transition-opacity`}
                      style={{ left: geo.left, width: geo.width, top: 8, height: ROW_H - 16 }}
                      onClick={(e) => handleBlockClick(e, res)}
                    >
                      <span className="truncate">{res.client_name}</span>
                    </div>
                  );
                })}
              </div>
            );
          })}
        </div>
      </div>

      {/* Popover */}
      {popover && (
        <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-50
          bg-[#1a1a1a] border border-[#333] rounded-lg p-4 shadow-2xl w-72"
          onClick={e => e.stopPropagation()}>
          <div className="flex items-center justify-between mb-3">
            <span className={`text-xs font-body px-2 py-0.5 rounded font-semibold ${
              popover.status === 'confirmed' ? 'bg-[#FF6B00] text-white' :
              popover.status === 'pending' ? 'bg-[#333] text-gray-300' :
              'bg-red-900/50 text-red-400'
            }`}>
              {popover.status === 'confirmed' ? 'Confirmé' : popover.status === 'pending' ? 'En attente' : 'Annulé'}
            </span>
            <button onClick={() => setPopover(null)} className="text-gray-500 hover:text-white text-lg leading-none">×</button>
          </div>

          <div className="space-y-1.5 mb-4 font-body text-sm">
            <div><span className="text-gray-400">Client: </span><span className="font-semibold">{popover.client_name}</span></div>
            <div><span className="text-gray-400">Tél: </span>
              <a href={`https://wa.me/212${popover.client_phone?.replace(/^0/, '')}`}
                target="_blank" rel="noopener noreferrer"
                className="text-green-400 hover:underline">{popover.client_phone}</a>
            </div>
            <div><span className="text-gray-400">Voiture: </span>{popover.car_name}</div>
            <div><span className="text-gray-400">Du: </span>{popover.start_datetime ? new Date(popover.start_datetime).toLocaleString('fr-FR', {dateStyle:'short',timeStyle:'short'}) : popover.start_date}</div>
            <div><span className="text-gray-400">Au: </span>{popover.end_datetime ? new Date(popover.end_datetime).toLocaleString('fr-FR', {dateStyle:'short',timeStyle:'short'}) : popover.end_date}</div>
          </div>

          <div className="grid grid-cols-2 gap-2">
            {popover.status !== 'confirmed' && (
              <button onClick={() => handleConfirm(popover)}
                className="bg-[#FF6B00] text-white text-xs font-body py-1.5 rounded hover:bg-orange-500 transition-colors">
                ✓ Confirmer
              </button>
            )}
            {popover.status !== 'cancelled' && (
              <button onClick={() => handleCancel(popover)}
                className="bg-red-900/50 border border-red-800 text-red-400 text-xs font-body py-1.5 rounded hover:bg-red-900 transition-colors">
                ✗ Annuler
              </button>
            )}
            <button onClick={() => handleEdit(popover)}
              className="bg-[#222] border border-[#444] text-gray-300 text-xs font-body py-1.5 rounded hover:border-[#FF6B00] hover:text-[#FF6B00] transition-colors">
              ✎ Modifier
            </button>
            <button onClick={() => handleDelete(popover)}
              className="bg-[#222] border border-[#444] text-gray-500 text-xs font-body py-1.5 rounded hover:border-red-600 hover:text-red-400 transition-colors">
              🗑 Supprimer
            </button>
          </div>
        </div>
      )}

      {/* New Reservation Modal */}
      {newResModal && (
        <ReservationModal
          title="Nouvelle Réservation"
          data={newResModal}
          cars={cars}
          reservations={reservations}
          onClose={() => setNewResModal(null)}
          onSave={async (d) => { await onNewReservation(d); setNewResModal(null); }}
        />
      )}

      {/* Edit Reservation Modal */}
      {editModal && (
        <ReservationModal
          title="Modifier la Réservation"
          data={editModal}
          cars={cars}
          reservations={reservations}
          onClose={() => setEditModal(null)}
          onSave={async (d) => { await onUpdateReservation(d); setEditModal(null); }}
        />
      )}
    </div>
  );
}

function ReservationModal({ title, data, cars, reservations, onClose, onSave }) {
  const [form, setForm] = useState({ ...data });
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  const today = new Date().toISOString().split('T')[0];
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const addOneDay = (d) => {
    if (!d) return today;
    const dt = new Date(d + 'T00:00:00');
    dt.setDate(dt.getDate() + 1);
    return dt.toISOString().split('T')[0];
  };

  const handleSave = async () => {
    if (!form.client_name || !form.client_phone || !form.start_date || !form.end_date) {
      setError('Veuillez remplir tous les champs obligatoires.');
      return;
    }
    if (new Date(form.end_date) <= new Date(form.start_date)) {
      setError('La date de fin doit être après la date de début.');
      return;
    }
    // Frontend conflict check
    const excludeId = data.id || null;
    const conflict = reservations
      .filter(r => r.car_id === parseInt(form.car_id) && r.status !== 'cancelled' && r.id !== excludeId)
      .some(r => new Date(form.start_date) <= new Date(r.end_date) && new Date(form.end_date) >= new Date(r.start_date));
    if (conflict) {
      setError('Cette voiture est déjà réservée sur ces dates.');
      return;
    }
    setSaving(true);
    setError('');
    try {
      await onSave(form);
    } catch (err) {
      setError(err.response?.data?.conflict ? 'Conflit de dates avec une réservation existante.' : 'Erreur lors de la sauvegarde.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4"
      onClick={onClose}>
      <div className="bg-[#1a1a1a] border border-[#333] rounded-lg p-5 w-full max-w-md shadow-2xl"
        onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-heading text-xl text-[#FF6B00]">{title}</h3>
          <button onClick={onClose} className="text-gray-500 hover:text-white text-2xl leading-none">×</button>
        </div>

        <div className="space-y-3">
          <div>
            <label className="text-xs text-gray-400 font-body block mb-1">Voiture *</label>
            <select value={form.car_id} onChange={e => set('car_id', parseInt(e.target.value))}
              className="w-full bg-[#111] border border-[#333] text-white text-sm font-body px-3 py-2 rounded focus:border-[#FF6B00] focus:outline-none">
              {cars.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-gray-400 font-body block mb-1">Date début *</label>
              <input type="date" value={form.start_date} min={today}
                onChange={e => { set('start_date', e.target.value); set('end_date', ''); }}
                className="w-full bg-[#111] border border-[#333] text-white text-sm font-body px-3 py-2 rounded focus:border-[#FF6B00] focus:outline-none" />
            </div>
            <div>
              <label className="text-xs text-gray-400 font-body block mb-1">Date fin *</label>
              <input type="date" value={form.end_date} min={addOneDay(form.start_date)}
                onChange={e => set('end_date', e.target.value)}
                className="w-full bg-[#111] border border-[#333] text-white text-sm font-body px-3 py-2 rounded focus:border-[#FF6B00] focus:outline-none" />
            </div>
          </div>
          <div>
            <label className="text-xs text-gray-400 font-body block mb-1">Client</label>
            <ClientSelector
              token={getToken()}
              onSelect={(client) => {
                set('client_name', client.nom_prenom);
                set('client_phone', client.telephone || '');
                set('client_id', client.id);
              }}
            />
            {form.client_name && (
              <div style={{ color: '#c9a87c', fontSize: '11px', fontFamily: 'DM Sans', marginTop: '6px', padding: '6px 10px', background: 'rgba(255,107,0,0.05)', borderRadius: '4px' }}>
                ✓ {form.client_name}{form.client_phone ? ` — ${form.client_phone}` : ''}
              </div>
            )}
          </div>
          <div>
            <label className="text-xs text-gray-400 font-body block mb-1">Nom client *</label>
            <input type="text" value={form.client_name} onChange={e => set('client_name', e.target.value)}
              className="w-full bg-[#111] border border-[#333] text-white text-sm font-body px-3 py-2 rounded focus:border-[#FF6B00] focus:outline-none" placeholder="Ou saisissez manuellement" />
          </div>
          <div>
            <label className="text-xs text-gray-400 font-body block mb-1">Téléphone *</label>
            <input type="tel" value={form.client_phone} onChange={e => set('client_phone', e.target.value)}
              className="w-full bg-[#111] border border-[#333] text-white text-sm font-body px-3 py-2 rounded focus:border-[#FF6B00] focus:outline-none" />
          </div>
          <div>
            <label className="text-xs text-gray-400 font-body block mb-1">Statut</label>
            <select value={form.status} onChange={e => set('status', e.target.value)}
              className="w-full bg-[#111] border border-[#333] text-white text-sm font-body px-3 py-2 rounded focus:border-[#FF6B00] focus:outline-none">
              <option value="confirmed">Confirmé</option>
              <option value="pending">En attente</option>
              <option value="cancelled">Annulé</option>
            </select>
          </div>
        </div>

        {error && <p className="mt-3 text-red-400 text-xs font-body bg-red-900/20 border border-red-800/40 p-2 rounded">{error}</p>}

        <div className="flex gap-3 mt-4">
          <button onClick={onClose}
            className="flex-1 border border-[#444] text-gray-400 text-sm font-body py-2 rounded hover:border-[#666] transition-colors">
            Annuler
          </button>
          <button onClick={handleSave} disabled={saving}
            className="flex-1 bg-[#FF6B00] text-white text-sm font-body font-semibold py-2 rounded hover:bg-orange-500 transition-colors disabled:opacity-50">
            {saving ? 'Enregistrement...' : 'Enregistrer'}
          </button>
        </div>
      </div>
    </div>
  );
}

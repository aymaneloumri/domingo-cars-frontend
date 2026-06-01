import React, { useState, useEffect, useRef } from 'react';
import api from '../utils/api';
import { getToken } from '../utils/auth';
import { imgUrl, API_BASE } from '../utils/config';
import ChefHeader from '../components/ChefHeader';

const TABS = ['Voitures', 'Annonces', 'Réservations'];
const CATEGORIES = ['Berline', 'Citadine', 'SUV', 'Utilitaire'];

const statusBadge = (s) => ({
  active:    'text-green-400 bg-green-400/10 border-green-400/30',
  inactive:  'text-gray-400 bg-gray-400/10 border-gray-400/30',
  confirmed: 'text-[#FF6B00] bg-[#FF6B00]/10 border-[#FF6B00]/30',
  pending:   'text-yellow-400 bg-yellow-400/10 border-yellow-400/30',
  cancelled: 'text-red-400 bg-red-400/10 border-red-400/30',
}[s] || 'text-gray-400 bg-gray-400/10 border-gray-400/30');

const statusLabel = (s) => ({
  active: 'Actif', inactive: 'Inactif',
  confirmed: 'Confirmé', pending: 'En attente', cancelled: 'Annulé',
}[s] || s);

function Modal({ title, onClose, children }) {
  return (
    <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-[#111] border border-[#333] rounded-lg w-full max-w-lg max-h-[90vh] overflow-y-auto shadow-2xl"
        onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between p-5 border-b border-[#222] sticky top-0 bg-[#111]">
          <h2 className="font-heading text-xl text-[#FF6B00]">{title}</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-white text-2xl leading-none">×</button>
        </div>
        <div className="p-5">{children}</div>
      </div>
    </div>
  );
}

function Field({ label, children }) {
  return (
    <div>
      <label className="text-xs text-gray-400 font-body block mb-1 uppercase tracking-wider">{label}</label>
      {children}
    </div>
  );
}

const inputCls = "w-full bg-[#0A0A0A] border border-[#333] text-white text-sm font-body px-3 py-2 rounded focus:border-[#FF6B00] focus:outline-none transition-colors";
const selectCls = "w-full bg-[#0A0A0A] border border-[#333] text-white text-sm font-body px-3 py-2 rounded focus:border-[#FF6B00] focus:outline-none transition-colors";

// ── Photo upload zone ────────────────────────────────────────────────────────
function PhotoUpload({ imageUrl, previewUrl, uploading, onFile, onClear }) {
  const fileInputRef = useRef(null);

  return (
    <Field label="Photo">
      {!previewUrl ? (
        <div
          onClick={() => fileInputRef.current.click()}
          onDragOver={e => e.preventDefault()}
          onDrop={e => { e.preventDefault(); onFile(e.dataTransfer.files[0]); }}
          style={{
            border: '2px dashed rgba(255,107,0,0.3)', borderRadius: 8,
            padding: 32, textAlign: 'center', cursor: 'pointer', background: '#0d0b08',
          }}>
          <div style={{ fontSize: 32, color: '#FF6B00', marginBottom: 8 }}>📷</div>
          <div style={{ color: '#5a4a2a', fontSize: 13 }}>Cliquez ou glissez une photo</div>
          <div style={{ color: '#3a2e1e', fontSize: 10, marginTop: 4 }}>JPEG, PNG, WEBP — Toutes tailles acceptées</div>
        </div>
      ) : (
        <div>
          <img src={previewUrl} alt="" style={{ width: '100%', height: 180, objectFit: 'cover', borderRadius: 6 }} />
          {uploading && (
            <div style={{ color: '#FF6B00', fontSize: 11, marginTop: 6, textAlign: 'center' }}>Chargement en cours...</div>
          )}
          {!uploading && imageUrl && (
            <div style={{ color: '#4CAF50', fontSize: 11, marginTop: 6, textAlign: 'center' }}>Photo prête ✓</div>
          )}
          <button type="button" onClick={onClear}
            style={{ marginTop: 8, color: '#FF6B00', background: 'transparent', border: 'none', fontSize: 11, cursor: 'pointer', width: '100%' }}>
            × Changer la photo
          </button>
        </div>
      )}
      <input type="file" ref={fileInputRef} accept="image/jpeg,image/png,image/webp"
        style={{ display: 'none' }} onChange={e => onFile(e.target.files[0])} />
    </Field>
  );
}

export default function Gestion() {
  const [tab, setTab] = useState(0);

  // ── CARS ──
  const [cars, setCars] = useState([]);
  const [carModal, setCarModal] = useState(false);
  const [editCar, setEditCar] = useState(null);
  const [carForm, setCarForm] = useState({ name: '', category: 'Berline', price_per_day: '', description: '', matricule: '', status: 'active' });
  const [imageUrl, setImageUrl]     = useState('');
  const [previewUrl, setPreviewUrl] = useState('');
  const [uploading, setUploading]   = useState(false);

  // ── ANNOUNCEMENTS ──
  const [announcements, setAnnouncements] = useState([]);
  const [annModal, setAnnModal] = useState(false);
  const [editAnn, setEditAnn] = useState(null);
  const [annForm, setAnnForm] = useState({ title: '', message: '', start_date: '', end_date: '', status: 'active' });

  // ── RESERVATIONS ──
  const [reservations, setReservations] = useState([]);
  const [resModal, setResModal] = useState(false);
  const [editRes, setEditRes] = useState(null);
  const [resForm, setResForm] = useState({ car_id: '', client_name: '', client_phone: '', start_date: '', end_date: '', status: 'pending' });
  const [resConflict, setResConflict] = useState('');

  useEffect(() => { loadCars(); loadAnnouncements(); loadReservations(); }, []);

  const loadCars         = () => api.get('/cars?admin=1').then(r => setCars(r.data)).catch(() => {});
  const loadAnnouncements = () => api.get('/announcements?admin=1').then(r => setAnnouncements(r.data)).catch(() => {});
  const loadReservations  = () => api.get('/reservations').then(r => setReservations(r.data)).catch(() => {});

  // ── Photo upload ──
  const handleFile = async (file) => {
    if (!file) return;
    setPreviewUrl(URL.createObjectURL(file));
    setUploading(true);
    const formData = new FormData();
    formData.append('image', file);
    try {
      const res = await fetch('/api/upload', {
        method: 'POST',
        headers: { 'x-admin-token': getToken() },
        body: formData,
      });
      const data = await res.json();
      setImageUrl(data.url);
    } catch (err) {
      console.error('Upload error:', err);
    } finally {
      setUploading(false);
    }
  };

  const clearPhoto = () => { setPreviewUrl(''); setImageUrl(''); };

  // ── CAR handlers ──
  const resetCarForm = () => {
    setCarForm({ name: '', category: 'Berline', price_per_day: '', description: '', matricule: '', status: 'active' });
    clearPhoto();
  };

  const openCarAdd = () => {
    setEditCar(null);
    resetCarForm();
    setCarModal(true);
  };

  const openCarEdit = (c) => {
    setEditCar(c);
    setCarForm({ name: c.name, category: c.category, price_per_day: c.price_per_day, description: c.description || '', matricule: c.matricule || '', status: c.status });
    // If car has an image, show it as preview
    if (c.image_url) {
      setImageUrl(c.image_url);
      setPreviewUrl(imgUrl(c.image_url));
    } else {
      clearPhoto();
    }
    setCarModal(true);
  };

  const saveCar = async (e) => {
    e.preventDefault();
    const payload = { ...carForm, image_url: imageUrl || '' };
    if (editCar) await api.put('/cars', { id: editCar.id, ...payload });
    else await api.post('/cars', payload);
    setCarModal(false);
    loadCars();
  };

  const deleteCar = async (id) => {
    if (window.confirm('Supprimer cette voiture ?')) {
      await api.delete('/cars', { params: { id } });
      loadCars();
    }
  };

  const toggleCarStatus = async (c) => {
    await api.put('/cars', { ...c, status: c.status === 'active' ? 'inactive' : 'active' });
    loadCars();
  };

  // ── ANN handlers ──
  const openAnnAdd  = () => { setEditAnn(null); setAnnForm({ title: '', message: '', start_date: '', end_date: '', status: 'active' }); setAnnModal(true); };
  const openAnnEdit = (a) => { setEditAnn(a); setAnnForm({ title: a.title, message: a.message, start_date: a.start_date, end_date: a.end_date, status: a.status }); setAnnModal(true); };
  const saveAnn = async (e) => {
    e.preventDefault();
    if (editAnn) await api.put('/announcements', { id: editAnn.id, ...annForm });
    else await api.post('/announcements', annForm);
    setAnnModal(false); loadAnnouncements();
  };
  const deleteAnn = async (id) => { if (window.confirm('Supprimer cette annonce ?')) { await api.delete('/announcements', { params: { id } }); loadAnnouncements(); } };
  const toggleAnnStatus = async (a) => { await api.put('/announcements', { ...a, status: a.status === 'active' ? 'inactive' : 'active' }); loadAnnouncements(); };

  // ── RES handlers ──
  const openResAdd  = () => { setEditRes(null); setResConflict(''); setResForm({ car_id: cars[0]?.id || '', client_name: '', client_phone: '', start_date: '', end_date: '', status: 'pending' }); setResModal(true); };
  const openResEdit = (r) => { setEditRes(r); setResConflict(''); setResForm({ car_id: r.car_id, client_name: r.client_name, client_phone: r.client_phone, start_date: r.start_date, end_date: r.end_date, status: r.status }); setResModal(true); };
  const saveRes = async (e) => {
    e.preventDefault(); setResConflict('');
    if (resForm.start_date && resForm.end_date && new Date(resForm.end_date) <= new Date(resForm.start_date)) {
      setResConflict('La date de fin doit être après la date de début');
      return;
    }
    try {
      if (editRes) await api.put('/reservations', { id: editRes.id, ...resForm });
      else await api.post('/reservations', resForm);
      setResModal(false); loadReservations();
    } catch (err) {
      setResConflict(err.response?.data?.conflict ? '⚠️ Conflit: ces dates chevauchent une réservation existante.' : 'Erreur lors de la sauvegarde.');
    }
  };
  const deleteRes = async (id) => { if (window.confirm('Supprimer cette réservation ?')) { await api.delete('/reservations', { params: { id } }); loadReservations(); } };

  const setC = (setter, field) => (e) => setter(prev => ({ ...prev, [field]: e.target.value }));

  return (
    <div className="min-h-screen bg-[#0A0A0A] text-white pt-14">
      <ChefHeader title="GESTION" />

      <div className="max-w-7xl mx-auto px-4 py-6">
        {/* Tabs */}
        <div className="flex gap-1 mb-6 bg-[#111] border border-[#222] rounded-lg p-1 w-fit">
          {TABS.map((t, i) => (
            <button key={t} onClick={() => setTab(i)}
              className={`px-5 py-2 font-heading text-base tracking-wider rounded transition-all ${tab === i ? 'bg-[#FF6B00] text-white' : 'text-gray-400 hover:text-white'}`}>
              {t}
            </button>
          ))}
        </div>

        {/* ── TAB 0: VOITURES ── */}
        {tab === 0 && (
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-heading text-2xl">VOITURES <span className="text-gray-500 text-lg">({cars.length})</span></h2>
              <button onClick={openCarAdd} className="bg-[#FF6B00] text-white font-body text-sm px-4 py-2 rounded hover:bg-orange-500 transition-colors">
                + Ajouter une voiture
              </button>
            </div>

            <div className="overflow-x-auto rounded-lg border border-[#222]">
              <table className="w-full">
                <thead className="bg-[#111] border-b border-[#222]">
                  <tr>
                    {['Photo','Nom','Catégorie','Prix/j','Matricule','Statut','Actions'].map(h => (
                      <th key={h} className="text-left text-xs text-gray-400 font-body uppercase tracking-wider px-4 py-3">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {cars.map(car => (
                    <tr key={car.id} className="border-b border-[#1a1a1a] hover:bg-[#111] transition-colors">
                      <td className="px-4 py-3">
                        {car.image_url ? (
                          <img src={imgUrl(car.image_url)} alt=""
                            style={{ width: 48, height: 36, objectFit: 'cover', borderRadius: 4, border: '0.5px solid rgba(255,107,0,0.2)' }} />
                        ) : (
                          <div style={{ width: 48, height: 36, background: '#1a1508', borderRadius: 4, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16 }}>🚗</div>
                        )}
                      </td>
                      <td className="px-4 py-3 font-body text-sm font-medium">{car.name}</td>
                      <td className="px-4 py-3 font-body text-sm text-gray-400">{car.category}</td>
                      <td className="px-4 py-3 font-body text-sm text-[#FF6B00]">{car.price_per_day} MAD</td>
                      <td className="px-4 py-3 font-body text-xs text-gray-400">{car.matricule || '–'}</td>
                      <td className="px-4 py-3">
                        <span className={`text-xs font-body px-2 py-0.5 rounded border ${statusBadge(car.status)}`}>{statusLabel(car.status)}</span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex gap-1.5">
                          <button onClick={() => openCarEdit(car)} className="text-xs font-body px-2 py-1 bg-[#1a1a1a] border border-[#333] rounded hover:border-[#FF6B00] hover:text-[#FF6B00] transition-colors">Modifier</button>
                          <button onClick={() => toggleCarStatus(car)}
                            className={`text-xs font-body px-2 py-1 rounded border transition-colors ${car.status === 'active' ? 'bg-green-900/20 border-green-800/40 text-green-400 hover:bg-red-900/20 hover:border-red-800/40 hover:text-red-400' : 'bg-[#1a1a1a] border-[#333] text-gray-400 hover:text-green-400 hover:border-green-800/40'}`}>
                            {car.status === 'active' ? 'Désactiver' : 'Activer'}
                          </button>
                          <button onClick={() => deleteCar(car.id)} className="text-xs font-body px-2 py-1 bg-red-900/20 border border-red-800/40 text-red-400 rounded hover:bg-red-900/40 transition-colors">🗑</button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {carModal && (
              <Modal title={editCar ? 'Modifier la voiture' : 'Ajouter une voiture'} onClose={() => setCarModal(false)}>
                <form onSubmit={saveCar} className="space-y-4">
                  <Field label="Nom *">
                    <input required className={inputCls} value={carForm.name} onChange={setC(setCarForm, 'name')} placeholder="Ex: Dacia Logan #1" />
                  </Field>
                  <Field label="Catégorie *">
                    <select required className={selectCls} value={carForm.category} onChange={setC(setCarForm, 'category')}>
                      {CATEGORIES.map(c => <option key={c}>{c}</option>)}
                    </select>
                  </Field>
                  <Field label="Prix par jour (MAD) *">
                    <input required type="number" className={inputCls} value={carForm.price_per_day} onChange={setC(setCarForm, 'price_per_day')} placeholder="200" />
                  </Field>
                  <PhotoUpload
                    imageUrl={imageUrl}
                    previewUrl={previewUrl}
                    uploading={uploading}
                    onFile={handleFile}
                    onClear={clearPhoto}
                  />
                  <Field label="Description">
                    <input className={inputCls} value={carForm.description} onChange={setC(setCarForm, 'description')} />
                  </Field>
                  <Field label="Matricule">
                    <input className={inputCls} value={carForm.matricule} onChange={setC(setCarForm, 'matricule')} placeholder="WW-894-205" />
                  </Field>
                  <Field label="Statut">
                    <select className={selectCls} value={carForm.status} onChange={setC(setCarForm, 'status')}>
                      <option value="active">Actif</option>
                      <option value="inactive">Inactif</option>
                    </select>
                  </Field>
                  <div className="flex gap-3 pt-2">
                    <button type="button" onClick={() => setCarModal(false)} className="flex-1 border border-[#444] text-gray-400 font-body py-2 rounded hover:border-[#666]">Annuler</button>
                    <button type="submit" disabled={uploading}
                      className="flex-1 bg-[#FF6B00] text-white font-body font-semibold py-2 rounded hover:bg-orange-500 disabled:opacity-50">
                      {uploading ? 'Upload en cours…' : editCar ? 'Enregistrer' : 'Créer'}
                    </button>
                  </div>
                </form>
              </Modal>
            )}
          </div>
        )}

        {/* ── TAB 1: ANNONCES ── */}
        {tab === 1 && (
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-heading text-2xl">ANNONCES <span className="text-gray-500 text-lg">({announcements.length})</span></h2>
              <button onClick={openAnnAdd} className="bg-[#FF6B00] text-white font-body text-sm px-4 py-2 rounded hover:bg-orange-500 transition-colors">+ Ajouter une annonce</button>
            </div>

            <div className="overflow-x-auto rounded-lg border border-[#222]">
              <table className="w-full">
                <thead className="bg-[#111] border-b border-[#222]">
                  <tr>
                    {['Titre','Message','Début','Fin','Statut','Actions'].map(h => (
                      <th key={h} className="text-left text-xs text-gray-400 font-body uppercase tracking-wider px-4 py-3">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {announcements.map(a => (
                    <tr key={a.id} className="border-b border-[#1a1a1a] hover:bg-[#111] transition-colors">
                      <td className="px-4 py-3 font-body text-sm font-medium">{a.title}</td>
                      <td className="px-4 py-3 font-body text-sm text-gray-400 max-w-xs truncate">{a.message}</td>
                      <td className="px-4 py-3 font-body text-xs text-gray-400">{a.start_date}</td>
                      <td className="px-4 py-3 font-body text-xs text-gray-400">{a.end_date}</td>
                      <td className="px-4 py-3"><span className={`text-xs font-body px-2 py-0.5 rounded border ${statusBadge(a.status)}`}>{statusLabel(a.status)}</span></td>
                      <td className="px-4 py-3">
                        <div className="flex gap-1.5">
                          <button onClick={() => openAnnEdit(a)} className="text-xs font-body px-2 py-1 bg-[#1a1a1a] border border-[#333] rounded hover:border-[#FF6B00] hover:text-[#FF6B00] transition-colors">Modifier</button>
                          <button onClick={() => toggleAnnStatus(a)} className="text-xs font-body px-2 py-1 bg-[#1a1a1a] border border-[#333] text-gray-400 rounded hover:border-[#FF6B00] hover:text-[#FF6B00] transition-colors">{a.status === 'active' ? 'Désactiver' : 'Activer'}</button>
                          <button onClick={() => deleteAnn(a.id)} className="text-xs font-body px-2 py-1 bg-red-900/20 border border-red-800/40 text-red-400 rounded hover:bg-red-900/40 transition-colors">🗑</button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {annModal && (
              <Modal title={editAnn ? "Modifier l'annonce" : 'Ajouter une annonce'} onClose={() => setAnnModal(false)}>
                <form onSubmit={saveAnn} className="space-y-4">
                  <Field label="Titre *"><input required className={inputCls} value={annForm.title} onChange={setC(setAnnForm, 'title')} /></Field>
                  <Field label="Message *"><textarea required className={inputCls + ' resize-none h-24'} value={annForm.message} onChange={setC(setAnnForm, 'message')} /></Field>
                  <div className="grid grid-cols-2 gap-3">
                    <Field label="Date début *"><input required type="date" className={inputCls} value={annForm.start_date} onChange={setC(setAnnForm, 'start_date')} /></Field>
                    <Field label="Date fin *"><input required type="date" className={inputCls} value={annForm.end_date} onChange={setC(setAnnForm, 'end_date')} /></Field>
                  </div>
                  <Field label="Statut"><select className={selectCls} value={annForm.status} onChange={setC(setAnnForm, 'status')}><option value="active">Active</option><option value="inactive">Inactive</option></select></Field>
                  <div className="flex gap-3 pt-2">
                    <button type="button" onClick={() => setAnnModal(false)} className="flex-1 border border-[#444] text-gray-400 font-body py-2 rounded hover:border-[#666]">Annuler</button>
                    <button type="submit" className="flex-1 bg-[#FF6B00] text-white font-body font-semibold py-2 rounded hover:bg-orange-500">{editAnn ? 'Enregistrer' : 'Créer'}</button>
                  </div>
                </form>
              </Modal>
            )}
          </div>
        )}

        {/* ── TAB 2: RÉSERVATIONS ── */}
        {tab === 2 && (
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-heading text-2xl">RÉSERVATIONS <span className="text-gray-500 text-lg">({reservations.length})</span></h2>
              <button onClick={openResAdd} className="bg-[#FF6B00] text-white font-body text-sm px-4 py-2 rounded hover:bg-orange-500 transition-colors">+ Ajouter une réservation</button>
            </div>

            <div className="overflow-x-auto rounded-lg border border-[#222]">
              <table className="w-full">
                <thead className="bg-[#111] border-b border-[#222]">
                  <tr>
                    {['Voiture','Client','Téléphone','Début','Fin','Statut','Actions'].map(h => (
                      <th key={h} className="text-left text-xs text-gray-400 font-body uppercase tracking-wider px-4 py-3">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {reservations.map(r => (
                    <tr key={r.id} className="border-b border-[#1a1a1a] hover:bg-[#111] transition-colors">
                      <td className="px-4 py-3 font-body text-sm">{r.car_name}</td>
                      <td className="px-4 py-3 font-body text-sm font-medium">{r.client_name}</td>
                      <td className="px-4 py-3">
                        <a href={`https://wa.me/212${r.client_phone?.replace(/^0/, '')}`} target="_blank" rel="noopener noreferrer"
                          className="font-body text-xs text-green-400 hover:underline">{r.client_phone}</a>
                      </td>
                      <td className="px-4 py-3 font-body text-xs text-gray-400">{r.start_date}</td>
                      <td className="px-4 py-3 font-body text-xs text-gray-400">{r.end_date}</td>
                      <td className="px-4 py-3"><span className={`text-xs font-body px-2 py-0.5 rounded border ${statusBadge(r.status)}`}>{statusLabel(r.status)}</span></td>
                      <td className="px-4 py-3">
                        <div className="flex gap-1.5">
                          <button onClick={() => openResEdit(r)} className="text-xs font-body px-2 py-1 bg-[#1a1a1a] border border-[#333] rounded hover:border-[#FF6B00] hover:text-[#FF6B00] transition-colors">Modifier</button>
                          <button onClick={() => deleteRes(r.id)} className="text-xs font-body px-2 py-1 bg-red-900/20 border border-red-800/40 text-red-400 rounded hover:bg-red-900/40 transition-colors">🗑</button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {resModal && (
              <Modal title={editRes ? 'Modifier la réservation' : 'Ajouter une réservation'} onClose={() => setResModal(false)}>
                <form onSubmit={saveRes} className="space-y-4">
                  <Field label="Voiture *">
                    <select required className={selectCls} value={resForm.car_id} onChange={setC(setResForm, 'car_id')}>
                      <option value="">Sélectionner une voiture</option>
                      {cars.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                    </select>
                  </Field>
                  <Field label="Nom client *"><input required className={inputCls} value={resForm.client_name} onChange={setC(setResForm, 'client_name')} /></Field>
                  <Field label="Téléphone *"><input required className={inputCls} value={resForm.client_phone} onChange={setC(setResForm, 'client_phone')} placeholder="0612345678" /></Field>
                  <div className="grid grid-cols-2 gap-3">
                    <Field label="Date début *">
                      <input required type="date" className={inputCls} value={resForm.start_date}
                        min={new Date().toISOString().split('T')[0]}
                        onChange={e => { setResForm(p => ({ ...p, start_date: e.target.value, end_date: '' })); setResConflict(''); }} />
                    </Field>
                    <Field label="Date fin *">
                      <input required type="date" className={inputCls} value={resForm.end_date}
                        min={(() => { if (!resForm.start_date) return new Date().toISOString().split('T')[0]; const d = new Date(resForm.start_date + 'T00:00:00'); d.setDate(d.getDate()+1); return d.toISOString().split('T')[0]; })()}
                        onChange={e => { setResForm(p => ({ ...p, end_date: e.target.value })); setResConflict(''); }} />
                    </Field>
                  </div>
                  <Field label="Statut">
                    <select className={selectCls} value={resForm.status} onChange={setC(setResForm, 'status')}>
                      <option value="pending">En attente</option>
                      <option value="confirmed">Confirmé</option>
                      <option value="cancelled">Annulé</option>
                    </select>
                  </Field>
                  {resConflict && <div className="text-yellow-400 text-xs font-body bg-yellow-400/10 border border-yellow-400/30 p-2 rounded">{resConflict}</div>}
                  <div className="flex gap-3 pt-2">
                    <button type="button" onClick={() => setResModal(false)} className="flex-1 border border-[#444] text-gray-400 font-body py-2 rounded hover:border-[#666]">Annuler</button>
                    <button type="submit" className="flex-1 bg-[#FF6B00] text-white font-body font-semibold py-2 rounded hover:bg-orange-500">{editRes ? 'Enregistrer' : 'Créer'}</button>
                  </div>
                </form>
              </Modal>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

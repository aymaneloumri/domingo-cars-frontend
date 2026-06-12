import React, { useState, useEffect, useRef } from 'react';
import { getToken } from '../utils/auth';
import { imgUrl, API_BASE } from '../utils/config';
import ChefHeader from '../components/ChefHeader';
import ClientSelector from '../components/ClientSelector';
const pdfMake = window.pdfMake;

const TABS = ['Clients', 'Réservations', 'Voitures', 'Rapport', 'Paramètres'];
const CATEGORIES = ['Berline', 'Citadine', 'SUV', 'Utilitaire'];

const MONTH_NAMES_FR = ['Janvier','Février','Mars','Avril','Mai','Juin','Juillet','Août','Septembre','Octobre','Novembre','Décembre'];

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
  const [carForm, setCarForm] = useState({ name: '', category: 'Berline', price_per_day: '', description: '', matricule: '', status: 'active', carburant: 'essence', boite_vitesse: 'manuelle' });
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
  const [sansFinReservation, setSansFinReservation] = useState(false);
  const [resForm, setResForm] = useState({ car_id: '', client_id: '', client_name: '', client_phone: '', start_date: '', end_date: '', start_datetime: '', end_datetime: '', status: 'pending', prix_par_jour: 0, nb_jours: 0, prix_total: 0, caution_type: 'aucune', caution_montant: 0, caution_avance: 0, caution_reste: 0, caution_rendue: false, caution_note: '', caution_cheque_numero: '', caution_document_description: '', caution_document_recu: false });
  const [resConflict, setResConflict] = useState('');
  const [savedReservation, setSavedReservation] = useState(null);

  // ── STATS DASHBOARD ──
  const [stats, setStats] = useState(null);
  const [loadingStats, setLoadingStats] = useState(true);

  // ── RAPPORT ──
  const nowDate = new Date();
  const [rapportMonth, setRapportMonth] = useState(`${nowDate.getFullYear()}-${String(nowDate.getMonth() + 1).padStart(2, '0')}`);
  const [rapportData, setRapportData] = useState(null);
  const [rapportLoading, setRapportLoading] = useState(false);

  // ── CLIENTS ──
  const [clients, setClients] = useState([]);
  const [clientSearch, setClientSearch] = useState('');
  const [clientModal, setClientModal] = useState(false);
  const [editClient, setEditClient] = useState(null);
  const [clientForm, setClientForm] = useState({ nom_prenom: '', date_naissance: '', telephone: '', cin_passport: '', cin_passport_expiry: '', adresse: '', permis: '', permis_expiry: '' });

  // ── RESERVATIONS SEARCH ──
  const [reservationSearch, setReservationSearch] = useState('');

  // ── PARAMÈTRES ──
  const [signatureUrl, setSignatureUrl]           = useState('');
  const [signaturePreview, setSignaturePreview]   = useState('');
  const [uploadingSignature, setUploadingSignature] = useState(false);
  const [sigSaved, setSigSaved]                   = useState(false);
  const signatureInputRef                         = useRef(null);

  // ── BLACKLIST ──
  const [blacklistedClients, setBlacklistedClients] = useState([]);
  const [blacklistSearch, setBlacklistSearch] = useState('');
  const [blacklistSearchResults, setBlacklistSearchResults] = useState([]);
  const [blacklistReason, setBlacklistReason] = useState('');
  const [selectedToBlacklist, setSelectedToBlacklist] = useState(null);

  useEffect(() => {
    loadCars(); loadAnnouncements(); loadReservations();
    const fetchStats = async () => {
      try {
        const res = await fetch(`${API_BASE}/api/dashboard/gestion-stats`, {
          headers: { 'x-admin-token': getToken() },
        });
        const data = await res.json();
        setStats(data);
      } catch (err) {
        console.error('Stats error:', err);
      } finally {
        setLoadingStats(false);
      }
    };
    fetchStats();
  }, []);

  useEffect(() => {
    if (tab === 4 && !signatureUrl) loadSignature();
  }, [tab]);

  const fetchBlacklisted = async () => {
    try {
      const res = await fetch(`${API_BASE}/api/clients/blacklisted/list`, {
        headers: { 'x-admin-token': getToken() },
      });
      const data = await res.json();
      setBlacklistedClients(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('fetchBlacklisted error:', err);
    }
  };

  useEffect(() => { fetchBlacklisted(); }, []);

  // ── Shared fetch helper ──
  const apiFetch = async (path, options = {}) => {
    const res = await fetch(`${API_BASE}/api${path}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        'x-admin-token': getToken(),
        ...(options.headers || {}),
      },
    });
    if (!res.ok) {
      const err = await res.text();
      console.error('API error:', res.status, err);
      throw new Error(err || res.statusText);
    }
    return res.json();
  };

  const loadCars          = () => apiFetch('/cars/admin/all').then(setCars).catch(() => {});
  const loadAnnouncements = () => apiFetch('/announcements/admin/all').then(setAnnouncements).catch(() => {});
  const loadReservations  = () => apiFetch('/reservations').then(setReservations).catch(() => {});

  const calcPricing = (start, end, ppj) => {
    if (!start || !end) return { nb_jours: 0, prix_total: 0 };
    const days = Math.ceil((new Date(end + 'T00:00:00') - new Date(start + 'T00:00:00')) / (1000 * 60 * 60 * 24));
    return { nb_jours: days > 0 ? days : 0, prix_total: days > 0 ? days * (parseFloat(ppj) || 0) : 0 };
  };

  const calculateNbJours = (startDatetime, endDatetime) => {
    if (!startDatetime || !endDatetime) return 0;
    const start = new Date(startDatetime);
    const end = new Date(endDatetime);
    let effectiveStart = new Date(start);
    if (start.getHours() >= 18) {
      effectiveStart.setDate(effectiveStart.getDate() + 1);
      effectiveStart.setHours(0, 0, 0, 0);
    }
    const startDateOnly = new Date(effectiveStart.getFullYear(), effectiveStart.getMonth(), effectiveStart.getDate());
    const endDateOnly = new Date(end.getFullYear(), end.getMonth(), end.getDate());
    const diffMs = endDateOnly - startDateOnly;
    let nb_jours = Math.round(diffMs / (1000 * 60 * 60 * 24)) + 1;
    if (nb_jours < 1) nb_jours = 1;
    return nb_jours;
  };

  const loadRapport = async () => {
    setRapportLoading(true);
    setRapportData(null);
    try {
      const data = await apiFetch(`/reservations/monthly-report?month=${rapportMonth}`);
      setRapportData(data);
    } catch (err) {
      alert('Erreur lors du chargement du rapport: ' + err.message);
    } finally {
      setRapportLoading(false);
    }
  };

  const loadSignature = async () => {
    try {
      const res = await fetch(`${API_BASE}/api/settings/signature_url`, {
        headers: { 'x-admin-token': getToken() },
      });
      const data = await res.json();
      if (data && data.value) {
        setSignatureUrl(data.value);
        setSignaturePreview(data.value);
      }
    } catch (err) {
      console.error('loadSignature error:', err);
    }
  };

  const handleSigFile = async (file) => {
    if (!file) return;
    setSignaturePreview(URL.createObjectURL(file));
    setUploadingSignature(true);
    setSigSaved(false);
    const formData = new FormData();
    formData.append('image', file);
    try {
      const res = await fetch(`${API_BASE}/api/settings/upload-signature`, {
        method: 'POST',
        headers: { 'x-admin-token': getToken() },
        body: formData,
      });
      const data = await res.json();
      if (data.url) {
        setSignatureUrl(data.url);
        setSignaturePreview(data.url);
        setSigSaved(true);
        setTimeout(() => setSigSaved(false), 3000);
      }
    } catch (err) {
      console.error('Signature upload error:', err);
    } finally {
      setUploadingSignature(false);
    }
  };

  const loadClients = async (search = '') => {
    try {
      const url = search ? `/clients?search=${encodeURIComponent(search)}` : '/clients';
      const data = await apiFetch(url);
      setClients(data);
    } catch {}
  };

  const searchToBlacklist = async (q) => {
    if (q.length < 2) { setBlacklistSearchResults([]); return; }
    try {
      const res = await fetch(`${API_BASE}/api/clients?search=${encodeURIComponent(q)}`, {
        headers: { 'x-admin-token': getToken() },
      });
      const data = await res.json();
      setBlacklistSearchResults(data.filter(c => !c.blacklisted));
    } catch {}
  };

  const handleBlacklist = async () => {
    if (!selectedToBlacklist) {
      console.log('No client selected');
      return;
    }
    console.log('Blacklisting client:', selectedToBlacklist.id, selectedToBlacklist.nom_prenom);
    try {
      const res = await fetch(`${API_BASE}/api/clients/${selectedToBlacklist.id}/blacklist`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'x-admin-token': getToken() },
        body: JSON.stringify({ reason: blacklistReason }),
      });
      const data = await res.json();
      console.log('Blacklist response:', data);
      if (data.success) {
        setSelectedToBlacklist(null);
        setBlacklistReason('');
        setBlacklistSearch('');
        setBlacklistSearchResults([]);
        fetchBlacklisted();
      } else {
        alert('Erreur: ' + JSON.stringify(data));
      }
    } catch (err) {
      console.error('Blacklist error:', err);
      alert('Erreur: ' + err.message);
    }
  };

  const handleUnblacklist = async (id) => {
    if (!window.confirm('Retirer ce client de la blacklist ?')) return;
    await fetch(`${API_BASE}/api/clients/${id}/unblacklist`, {
      method: 'PUT',
      headers: { 'x-admin-token': getToken() },
    });
    fetchBlacklisted();
  };

  const saveClient = async (e) => {
    e.preventDefault();
    try {
      if (editClient) {
        await apiFetch(`/clients/${editClient.id}`, { method: 'PUT', body: JSON.stringify(clientForm) });
      } else {
        await apiFetch('/clients', { method: 'POST', body: JSON.stringify(clientForm) });
      }
      setClientModal(false);
      setEditClient(null);
      setClientForm({ nom_prenom: '', date_naissance: '', telephone: '', cin_passport: '', cin_passport_expiry: '', adresse: '', permis: '', permis_expiry: '' });
      loadClients(clientSearch);
    } catch (err) {
      alert('Erreur: ' + err.message);
    }
  };

  const deleteClient = async (id) => {
    if (window.confirm('Supprimer ce client ?')) {
      try {
        await apiFetch(`/clients/${id}`, { method: 'DELETE' });
        loadClients(clientSearch);
      } catch (err) {
        alert('Erreur: ' + err.message);
      }
    }
  };

  const openClientEdit = (c) => {
    setEditClient(c);
    setClientForm({ nom_prenom: c.nom_prenom || '', date_naissance: c.date_naissance || '', telephone: c.telephone || '', cin_passport: c.cin_passport || '', cin_passport_expiry: c.cin_passport_expiry || '', adresse: c.adresse || '', permis: c.permis || '', permis_expiry: c.permis_expiry || '' });
    setClientModal(true);
  };

  // ── Photo upload ──
  const handleFile = async (file) => {
    if (!file) return;
    setPreviewUrl(URL.createObjectURL(file));
    setUploading(true);
    const formData = new FormData();
    formData.append('image', file);
    try {
      const res = await fetch(`${API_BASE}/api/cars/admin/upload`, {
        method: 'POST',
        headers: { 'x-admin-token': getToken() },
        body: formData,
      });
      if (!res.ok) { console.error('Upload error:', await res.text()); return; }
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
    setCarForm({ name: '', category: 'Berline', price_per_day: '', description: '', matricule: '', status: 'active', carburant: 'essence', boite_vitesse: 'manuelle' });
    clearPhoto();
  };

  const openCarAdd = () => {
    setEditCar(null);
    resetCarForm();
    setCarModal(true);
  };

  const openCarEdit = (c) => {
    setEditCar(c);
    setCarForm({ name: c.name, category: c.category, price_per_day: c.price_per_day, description: c.description || '', matricule: c.matricule || '', status: c.status, carburant: c.carburant || 'essence', boite_vitesse: c.boite_vitesse || 'manuelle' });
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
    try {
      if (editCar) await apiFetch(`/cars/admin/${editCar.id}`, { method: 'PUT', body: JSON.stringify(payload) });
      else await apiFetch('/cars/admin', { method: 'POST', body: JSON.stringify(payload) });
      setCarModal(false);
      loadCars();
    } catch (err) {
      alert('Erreur: ' + err.message);
    }
  };

  const deleteCar = async (id) => {
    if (window.confirm('Supprimer cette voiture ?')) {
      try {
        await apiFetch(`/cars/admin/${id}`, { method: 'DELETE' });
        loadCars();
      } catch (err) {
        alert('Erreur: ' + err.message);
      }
    }
  };

  const toggleCarStatus = async (c) => {
    try {
      await apiFetch(`/cars/admin/${c.id}`, { method: 'PUT', body: JSON.stringify({ ...c, status: c.status === 'active' ? 'inactive' : 'active' }) });
      loadCars();
    } catch (err) {
      console.error('Toggle status error:', err);
    }
  };

  // ── ANN handlers ──
  const openAnnAdd  = () => { setEditAnn(null); setAnnForm({ title: '', message: '', start_date: '', end_date: '', status: 'active' }); setAnnModal(true); };
  const openAnnEdit = (a) => { setEditAnn(a); setAnnForm({ title: a.title, message: a.message, start_date: a.start_date, end_date: a.end_date, status: a.status }); setAnnModal(true); };

  const saveAnn = async (e) => {
    e.preventDefault();
    try {
      if (editAnn) await apiFetch(`/announcements/admin/${editAnn.id}`, { method: 'PUT', body: JSON.stringify(annForm) });
      else await apiFetch('/announcements/admin', { method: 'POST', body: JSON.stringify(annForm) });
      setAnnModal(false);
      loadAnnouncements();
    } catch (err) {
      alert('Erreur: ' + err.message);
    }
  };

  const deleteAnn = async (id) => {
    if (window.confirm('Supprimer cette annonce ?')) {
      try {
        await apiFetch(`/announcements/admin/${id}`, { method: 'DELETE' });
        loadAnnouncements();
      } catch (err) {
        alert('Erreur: ' + err.message);
      }
    }
  };

  const toggleAnnStatus = async (a) => {
    try {
      await apiFetch(`/announcements/admin/${a.id}`, { method: 'PUT', body: JSON.stringify({ ...a, status: a.status === 'active' ? 'inactive' : 'active' }) });
      loadAnnouncements();
    } catch (err) {
      console.error('Toggle ann status error:', err);
    }
  };

  // ── RES handlers ──
  const openResAdd = () => {
    const firstCar = cars[0];
    setEditRes(null); setResConflict(''); setSansFinReservation(false);
    setResForm({ car_id: firstCar?.id || '', client_id: '', client_name: '', client_phone: '', start_date: '', end_date: '', start_datetime: '', end_datetime: '', status: 'pending', prix_par_jour: firstCar?.price_per_day || 0, nb_jours: 0, prix_total: 0, caution_type: 'aucune', caution_montant: 0, caution_avance: 0, caution_reste: 0, caution_rendue: false, caution_note: '', caution_cheque_numero: '', caution_document_description: '', caution_document_recu: false });
    setResModal(true);
  };

  const openResEdit = (r) => {
    setEditRes(r); setResConflict('');
    setSansFinReservation(!r.end_date && !r.end_datetime);
    setResForm({ car_id: r.car_id, client_id: r.client_id || '', client_name: r.client_name, client_phone: r.client_phone, start_date: r.start_date, end_date: r.end_date, start_datetime: r.start_datetime || '', end_datetime: r.end_datetime || '', status: r.status, prix_par_jour: r.prix_par_jour || 0, nb_jours: r.nb_jours || 0, prix_total: r.prix_total || 0, caution_type: r.caution_type || 'aucune', caution_montant: r.caution_montant || 0, caution_avance: r.caution_avance || 0, caution_reste: r.caution_reste || 0, caution_rendue: r.caution_rendue || false, caution_note: r.caution_note || '', caution_cheque_numero: r.caution_cheque_numero || '', caution_document_description: r.caution_document_description || '', caution_document_recu: r.caution_document_recu || false });
    setResModal(true);
  };

  const saveRes = async (e) => {
    e.preventDefault(); setResConflict('');
    if (resForm.start_date && resForm.end_date && new Date(resForm.end_date) <= new Date(resForm.start_date)) {
      setResConflict('La date de fin doit être après la date de début');
      return;
    }
    try {
      const car = cars.find(c => c.id == resForm.car_id);
      const resaData = {
        car_id: resForm.car_id,
        car_name: car?.name || '',
        matricule: car?.matricule || '',
        category: car?.category || '',
        brand: car?.name?.split(' ')[0] || '',
        price_per_day: car?.price_per_day || 0,
        client_id: resForm.client_id || null,
        client_name: resForm.client_name,
        client_phone: resForm.client_phone,
        start_datetime: resForm.start_datetime,
        end_datetime: resForm.end_datetime,
        start_date: resForm.start_date,
        end_date: resForm.end_date,
        nb_jours: resForm.nb_jours,
        prix_par_jour: resForm.prix_par_jour,
        prix_total: resForm.prix_total,
      };
      if (editRes) {
        await apiFetch(`/reservations/${editRes.id}`, { method: 'PUT', body: JSON.stringify(resForm) });
        setSavedReservation({ id: editRes.id, ...resaData });
        setResModal(false);
        loadReservations();
      } else {
        const data = await apiFetch('/reservations', { method: 'POST', body: JSON.stringify(resForm) });
        setSavedReservation({ id: data.id, ...resaData });
        setResModal(false);
        loadReservations();
      }
    } catch (err) {
      setResConflict(err.message.includes('Conflit') ? '⚠️ Conflit: ces dates chevauchent une réservation existante.' : 'Erreur: ' + err.message);
    }
  };

  const deleteRes = async (id) => {
    if (window.confirm('Supprimer cette réservation ?')) {
      try {
        await apiFetch(`/reservations/${id}`, { method: 'DELETE' });
        loadReservations();
      } catch (err) {
        alert('Erreur: ' + err.message);
      }
    }
  };

  // ── PDF export ──
  const exportPDF = () => {
    if (!rapportData) return;
    const [y, m] = rapportMonth.split('-');
    const monthLabel = `${MONTH_NAMES_FR[parseInt(m) - 1]} ${y}`;

    const tableBody = [
      [
        { text: 'Voiture', style: 'tableHeader' },
        { text: 'Réservations', style: 'tableHeader' },
        { text: 'Jours', style: 'tableHeader' },
        { text: 'Total (MAD)', style: 'tableHeader' },
      ],
      ...rapportData.cars.map(c => [
        c.car_name,
        String(c.reservations_count),
        `${c.total_jours}j`,
        { text: `${c.total_revenue.toLocaleString('fr-MA')} MAD`, color: '#FF6B00', bold: true },
      ]),
    ];

    const mostRented = rapportData.cars.length
      ? rapportData.cars.reduce((a, b) => a.reservations_count >= b.reservations_count ? a : b)
      : null;

    const docDef = {
      pageSize: 'A4',
      pageMargins: [40, 60, 40, 60],
      background: [{ canvas: [{ type: 'rect', x: 0, y: 0, w: 595, h: 842, color: '#0A0A0A' }] }],
      content: [
        { text: 'DOMINGO CARS LUXURY RENT', style: 'brand' },
        { text: `RAPPORT MENSUEL — ${monthLabel}`, style: 'title' },
        { canvas: [{ type: 'line', x1: 0, y1: 0, x2: 515, y2: 0, lineWidth: 1, lineColor: '#FF6B00' }], margin: [0, 8, 0, 16] },
        {
          columns: [
            { text: [`Total revenus\n`, { text: `${rapportData.total_revenue.toLocaleString('fr-MA')} MAD`, style: 'bigStat' }], style: 'statBox' },
            { text: [`Réservations\n`, { text: String(rapportData.total_reservations), style: 'bigStat' }], style: 'statBox' },
            { text: [`Jours loués\n`, { text: String(rapportData.total_jours), style: 'bigStat' }], style: 'statBox' },
          ],
          margin: [0, 0, 0, 20],
        },
        { text: 'DÉTAIL PAR VOITURE', style: 'sectionTitle' },
        {
          table: { headerRows: 1, widths: ['*', 'auto', 'auto', 'auto'], body: tableBody },
          layout: {
            fillColor: (i) => i === 0 ? '#1a1a1a' : i % 2 === 0 ? '#111' : '#0d0d0d',
            hLineColor: () => '#222',
            vLineColor: () => '#222',
          },
          margin: [0, 8, 0, 20],
        },
        { canvas: [{ type: 'line', x1: 0, y1: 0, x2: 515, y2: 0, lineWidth: 0.5, lineColor: '#333' }], margin: [0, 0, 0, 12] },
        mostRented ? { text: `Voiture la plus louée: ${mostRented.car_name} (${mostRented.reservations_count} rés.)`, style: 'footer' } : {},
        { text: `TOTAL GÉNÉRAL: ${rapportData.total_revenue.toLocaleString('fr-MA')} MAD`, style: 'totalLine' },
        { text: `Généré le ${new Date().toLocaleDateString('fr-MA')} — Domingo Cars Luxury Rent, Casablanca`, style: 'meta' },
      ],
      styles: {
        brand:        { fontSize: 10, color: '#FF6B00', letterSpacing: 4, alignment: 'center', margin: [0, 0, 0, 4] },
        title:        { fontSize: 18, bold: true, color: '#ffffff', alignment: 'center', margin: [0, 0, 0, 4] },
        sectionTitle: { fontSize: 10, color: '#FF6B00', bold: true, letterSpacing: 2, margin: [0, 0, 0, 4] },
        tableHeader:  { fontSize: 9, color: '#FF6B00', bold: true },
        bigStat:      { fontSize: 20, color: '#FF6B00', bold: true },
        statBox:      { fontSize: 10, color: '#888', alignment: 'center' },
        footer:       { fontSize: 10, color: '#888', margin: [0, 0, 0, 6] },
        totalLine:    { fontSize: 13, bold: true, color: '#FF6B00', margin: [0, 0, 0, 8] },
        meta:         { fontSize: 8, color: '#444', margin: [0, 16, 0, 0], alignment: 'center' },
      },
      defaultStyle: { color: '#ccc', fontSize: 10 },
    };

    pdfMake.createPdf(docDef).download(`rapport-${rapportMonth}.pdf`);
  };

  const setC = (setter, field) => (e) => setter(prev => ({ ...prev, [field]: e.target.value }));

  return (
    <div className="min-h-screen bg-[#0A0A0A] text-white pt-14">
      <ChefHeader title="GESTION" />

      <div className="max-w-7xl mx-auto px-4 py-6">

        {/* ── STATS DASHBOARD ── */}
        {loadingStats && (
          <div style={{ textAlign: 'center', padding: '24px 0', color: '#FF6B00', fontFamily: 'DM Sans', fontSize: 13 }}>
            ⏳ Chargement des statistiques...
          </div>
        )}
        {stats && (
          <div style={{ marginBottom: '32px' }}>

            {/* ROW 1 — KPI Cards */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '12px', marginBottom: '16px' }}>
              {[
                { label: 'Réservations ce mois',   value: stats.reservations.ce_mois,                               icon: '📅', color: '#FF6B00' },
                { label: "En cours aujourd'hui",    value: stats.reservations.aujourd_hui,                           icon: '🚗', color: '#FF6B00' },
                { label: 'Revenu ce mois',          value: `${stats.revenus.ce_mois.toLocaleString('fr-MA')} MAD`,   icon: '💰', color: '#4CAF50' },
                { label: 'Clients total',           value: stats.clients.total,                                      icon: '👥', color: '#FF6B00' },
              ].map((kpi, i) => (
                <div key={i} style={{ background: '#111', border: '0.5px solid #2a2010', borderRadius: '8px', padding: '16px', borderLeft: `3px solid ${kpi.color}` }}>
                  <div style={{ fontSize: '24px', marginBottom: '8px' }}>{kpi.icon}</div>
                  <div style={{ fontFamily: 'Bebas Neue', fontSize: '28px', color: kpi.color, lineHeight: 1 }}>{kpi.value}</div>
                  <div style={{ color: '#5a4a2a', fontSize: '10px', textTransform: 'uppercase', letterSpacing: '1px', fontFamily: 'DM Sans', marginTop: '4px' }}>{kpi.label}</div>
                </div>
              ))}
            </div>

            {/* ROW 2 — Secondary KPIs */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '12px', marginBottom: '16px' }}>
              {[
                { label: 'À venir cette semaine',       value: stats.reservations.cette_semaine,                              icon: '📆', color: '#FFC107' },
                { label: 'Nouveaux clients ce mois',    value: stats.clients.nouveaux_ce_mois,                                icon: '🆕', color: '#4CAF50' },
                { label: 'Cautions en attente',         value: stats.cautions.en_attente,                                     icon: '🔐', color: stats.cautions.en_attente > 0 ? '#e24b4a' : '#4CAF50' },
                { label: 'Montant cautions',            value: `${stats.cautions.montant_total.toLocaleString('fr-MA')} MAD`, icon: '💵', color: '#FF6B00' },
              ].map((kpi, i) => (
                <div key={i} style={{ background: '#111', border: '0.5px solid #2a2010', borderRadius: '8px', padding: '16px', borderLeft: `3px solid ${kpi.color}` }}>
                  <div style={{ fontSize: '24px', marginBottom: '8px' }}>{kpi.icon}</div>
                  <div style={{ fontFamily: 'Bebas Neue', fontSize: '28px', color: kpi.color, lineHeight: 1 }}>{kpi.value}</div>
                  <div style={{ color: '#5a4a2a', fontSize: '10px', textTransform: 'uppercase', letterSpacing: '1px', fontFamily: 'DM Sans', marginTop: '4px' }}>{kpi.label}</div>
                </div>
              ))}
            </div>

            {/* ROW 3 — Charts + Tables */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px', marginBottom: '16px' }}>

              {/* Revenus 6 mois */}
              <div style={{ background: '#111', border: '0.5px solid #2a2010', borderRadius: '8px', padding: '16px' }}>
                <div style={{ color: '#FF6B00', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '1px', fontFamily: 'DM Sans', marginBottom: '12px' }}>
                  📈 Revenus 6 derniers mois
                </div>
                {stats.revenus.six_mois.length > 0 ? (
                  <div style={{ display: 'flex', alignItems: 'flex-end', gap: '6px', height: '80px' }}>
                    {stats.revenus.six_mois.map((m, i) => {
                      const maxVal = Math.max(...stats.revenus.six_mois.map(x => x.total));
                      const height = maxVal > 0 ? (m.total / maxVal) * 70 : 4;
                      return (
                        <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px' }}>
                          <div style={{ width: '100%', height: `${height}px`, background: i === stats.revenus.six_mois.length - 1 ? '#FF6B00' : '#2a2010', borderRadius: '2px', minHeight: '4px' }} />
                          <div style={{ color: '#3a2e1e', fontSize: '9px', fontFamily: 'DM Sans', textAlign: 'center' }}>{m.mois?.slice(5)}</div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div style={{ color: '#3a2e1e', fontSize: '12px', fontFamily: 'DM Sans', textAlign: 'center', paddingTop: '20px' }}>Pas encore de données</div>
                )}
              </div>

              {/* Top voitures */}
              <div style={{ background: '#111', border: '0.5px solid #2a2010', borderRadius: '8px', padding: '16px' }}>
                <div style={{ color: '#FF6B00', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '1px', fontFamily: 'DM Sans', marginBottom: '12px' }}>
                  🚗 Revenus par voiture ce mois
                </div>
                {stats.revenus.par_voiture.slice(0, 5).map((car, i) => (
                  <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '6px 0', borderBottom: '0.5px solid #1a1a1a' }}>
                    <div style={{ color: car.total > 0 ? '#c9a87c' : '#3a2e1e', fontSize: '12px', fontFamily: 'DM Sans' }}>
                      {i === 0 && car.total > 0 ? '🏆 ' : ''}{car.car_name}{car.matricule ? ` — ${car.matricule}` : ''}
                    </div>
                    <div style={{ color: car.total > 0 ? '#FF6B00' : '#3a2e1e', fontSize: '12px', fontFamily: 'Bebas Neue' }}>
                      {car.total > 0 ? `${parseInt(car.total).toLocaleString('fr-MA')} MAD` : '—'}
                    </div>
                  </div>
                ))}
              </div>

              {/* Top clients */}
              <div style={{ background: '#111', border: '0.5px solid #2a2010', borderRadius: '8px', padding: '16px' }}>
                <div style={{ color: '#FF6B00', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '1px', fontFamily: 'DM Sans', marginBottom: '12px' }}>
                  👥 Clients les plus fréquents
                </div>
                {stats.clients.frequents.length > 0 ? (
                  stats.clients.frequents.map((cl, i) => (
                    <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '6px 0', borderBottom: '0.5px solid #1a1a1a' }}>
                      <div style={{ color: '#c9a87c', fontSize: '12px', fontFamily: 'DM Sans' }}>{i === 0 ? '⭐ ' : ''}{cl.nom_prenom}</div>
                      <div style={{ color: '#5a4a2a', fontSize: '11px', fontFamily: 'DM Sans' }}>{cl.nb_reservations} rés.</div>
                    </div>
                  ))
                ) : (
                  <div style={{ color: '#3a2e1e', fontSize: '12px', fontFamily: 'DM Sans', textAlign: 'center', paddingTop: '20px' }}>Pas encore de données</div>
                )}
              </div>
            </div>

            {/* ROW 4 — Alerts */}
            {(stats.reservations.sans_fin > 0 || stats.cautions.en_attente > 0 || stats.flotte.indisponibles_aujourd_hui > 0) && (
              <div style={{ padding: '14px 16px', background: 'rgba(226,75,74,0.05)', border: '0.5px solid rgba(226,75,74,0.3)', borderRadius: '8px', display: 'flex', gap: '20px', flexWrap: 'wrap' }}>
                <div style={{ color: '#e24b4a', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '1px', fontFamily: 'DM Sans', width: '100%', marginBottom: '8px' }}>⚠️ Points d'attention</div>
                {stats.reservations.sans_fin > 0 && (
                  <div style={{ color: '#FFC107', fontSize: '12px', fontFamily: 'DM Sans' }}>📌 {stats.reservations.sans_fin} réservation(s) sans date de fin</div>
                )}
                {stats.cautions.en_attente > 0 && (
                  <div style={{ color: '#e24b4a', fontSize: '12px', fontFamily: 'DM Sans' }}>🔐 {stats.cautions.en_attente} caution(s) en attente de retour</div>
                )}
                {stats.flotte.indisponibles_aujourd_hui > 0 && (
                  <div style={{ color: '#FF6B00', fontSize: '12px', fontFamily: 'DM Sans' }}>🚗 {stats.flotte.indisponibles_aujourd_hui}/{stats.flotte.total} voiture(s) en location aujourd'hui</div>
                )}
              </div>
            )}

          </div>
        )}

        {/* Tabs */}
        <div className="flex gap-1 mb-6 bg-[#111] border border-[#222] rounded-lg p-1 w-fit">
          {TABS.map((t, i) => (
            <button key={t} onClick={() => setTab(i)}
              className={`px-5 py-2 font-heading text-base tracking-wider rounded transition-all ${tab === i ? 'bg-[#FF6B00] text-white' : 'text-gray-400 hover:text-white'}`}>
              {t}
            </button>
          ))}
        </div>

        {/* ── TAB 2: VOITURES ── */}
        {tab === 2 && (
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
                    {['Photo','Nom','Catégorie','Prix/j','Matricule','Carburant','Boîte','Statut','Actions'].map(h => (
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
                        <span className={`text-xs font-body px-2 py-0.5 rounded border ${
                          car.carburant === 'diesel' ? 'text-gray-400 bg-gray-400/10 border-gray-400/30' :
                          car.carburant === 'hybride' ? 'text-green-400 bg-green-400/10 border-green-400/30' :
                          car.carburant === 'electrique' ? 'text-blue-400 bg-blue-400/10 border-blue-400/30' :
                          'text-[#FF6B00] bg-[#FF6B00]/10 border-[#FF6B00]/30'
                        }`}>
                          {car.carburant === 'diesel' ? '🛢️' : car.carburant === 'hybride' ? '⚡' : car.carburant === 'electrique' ? '🔋' : '⛽'} {car.carburant || 'essence'}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`text-xs font-body px-2 py-0.5 rounded border ${
                          car.boite_vitesse === 'automatique' ? 'text-[#FF6B00] bg-[#FF6B00]/10 border-[#FF6B00]/30' : 'text-gray-400 bg-gray-400/10 border-gray-400/30'
                        }`}>
                          {car.boite_vitesse === 'automatique' ? '🤖' : '🔧'} {car.boite_vitesse || 'manuelle'}
                        </span>
                      </td>
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
                  <div className="grid grid-cols-2 gap-3">
                    <Field label="Carburant">
                      <select className={selectCls} value={carForm.carburant} onChange={setC(setCarForm, 'carburant')}>
                        <option value="essence">⛽ Essence</option>
                        <option value="diesel">🛢️ Diesel</option>
                        <option value="hybride">⚡ Hybride</option>
                        <option value="electrique">🔋 Électrique</option>
                      </select>
                    </Field>
                    <Field label="Boîte à vitesse">
                      <select className={selectCls} value={carForm.boite_vitesse} onChange={setC(setCarForm, 'boite_vitesse')}>
                        <option value="manuelle">🔧 Manuelle</option>
                        <option value="automatique">🤖 Automatique</option>
                      </select>
                    </Field>
                  </div>
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


        {/* ── TAB 1: RÉSERVATIONS ── */}
        {tab === 1 && (
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-heading text-2xl">RÉSERVATIONS <span className="text-gray-500 text-lg">({reservations.length})</span></h2>
              <button onClick={openResAdd} className="bg-[#FF6B00] text-white font-body text-sm px-4 py-2 rounded hover:bg-orange-500 transition-colors">+ Ajouter une réservation</button>
            </div>

            <input
              value={reservationSearch}
              onChange={(e) => setReservationSearch(e.target.value)}
              placeholder="🔍 Rechercher par nom, téléphone, CIN ou voiture..."
              style={{ width: '100%', background: '#0d0b08', border: '0.5px solid #2a2010', color: '#c9a87c', padding: '10px 14px', borderRadius: '4px', fontFamily: 'DM Sans', fontSize: '13px', marginBottom: '16px', boxSizing: 'border-box', outline: 'none' }}
            />

            <div className="overflow-x-auto rounded-lg border border-[#222]">
              <table className="w-full">
                <thead className="bg-[#111] border-b border-[#222]">
                  <tr>
                    {['Voiture','Client','Téléphone','Début','Fin','Prix/j','Jours','Total','Statut','Caution','Actions'].map(h => (
                      <th key={h} className="text-left text-xs text-gray-400 font-body uppercase tracking-wider px-4 py-3">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {reservations.filter(r => {
                    if (!reservationSearch) return true;
                    const q = reservationSearch.toLowerCase();
                    return (r.client_name?.toLowerCase().includes(q)) ||
                           (r.client_phone?.includes(q)) ||
                           (r.car_name?.toLowerCase().includes(q));
                  }).map(r => (
                    <tr key={r.id} className="border-b border-[#1a1a1a] hover:bg-[#111] transition-colors">
                      <td className="px-4 py-3 font-body text-sm">{r.car_name}</td>
                      <td className="px-4 py-3 font-body text-sm font-medium">{r.client_name}</td>
                      <td className="px-4 py-3">
                        <a href={`https://wa.me/212${r.client_phone?.replace(/^0/, '')}`} target="_blank" rel="noopener noreferrer"
                          className="font-body text-xs text-green-400 hover:underline">{r.client_phone}</a>
                      </td>
                      <td className="px-4 py-3 font-body text-xs text-gray-400">{r.start_datetime ? new Date(r.start_datetime).toLocaleString('fr-FR', {dateStyle:'short',timeStyle:'short'}) : r.start_date}</td>
                      <td className="px-4 py-3 font-body text-xs text-gray-400">
                        {r.end_datetime || r.end_date
                          ? new Date(r.end_datetime || r.end_date).toLocaleString('fr-FR', { dateStyle: 'short', timeStyle: 'short' })
                          : <span style={{ color: '#FF6B00', fontSize: '11px', fontFamily: 'DM Sans', fontStyle: 'italic' }}>📌 Sans fin</span>}
                      </td>
                      <td className="px-4 py-3 font-body text-xs text-gray-400">{r.prix_par_jour ? `${r.prix_par_jour} MAD` : '–'}</td>
                      <td className="px-4 py-3 font-body text-xs text-gray-400">{r.nb_jours ? `${r.nb_jours}j` : '–'}</td>
                      <td className="px-4 py-3 font-body text-xs text-[#FF6B00] font-semibold">{r.prix_total ? `${r.prix_total} MAD` : '–'}</td>
                      <td className="px-4 py-3"><span className={`text-xs font-body px-2 py-0.5 rounded border ${statusBadge(r.status)}`}>{statusLabel(r.status)}</span></td>
                      <td className="px-4 py-3">
                        {r.caution_type && r.caution_type !== 'aucune' ? (
                          <span style={{ background: r.caution_rendue ? 'rgba(76,175,80,0.15)' : 'rgba(226,75,74,0.15)', border: `0.5px solid ${r.caution_rendue ? '#4CAF50' : '#e24b4a'}`, color: r.caution_rendue ? '#4CAF50' : '#e24b4a', padding: '2px 8px', borderRadius: '20px', fontSize: '10px', fontFamily: 'DM Sans', whiteSpace: 'nowrap' }}>
                            {r.caution_type === 'cash' ? '💵' : r.caution_type === 'cheque' ? '🏦' : '📄'}{' '}
                            {r.caution_rendue ? 'Rendue' : 'En attente'}
                            {r.caution_montant > 0 && ` — ${r.caution_montant} MAD`}
                          </span>
                        ) : (
                          <span style={{ color: '#3a2e1e', fontSize: '11px', fontFamily: 'DM Sans' }}>Aucune</span>
                        )}
                      </td>
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
                    <select required className={selectCls} value={resForm.car_id}
                      onChange={e => {
                        const car = cars.find(c => c.id === parseInt(e.target.value));
                        const ppj = car?.price_per_day || 0;
                        const pricing = calcPricing(resForm.start_date, resForm.end_date, ppj);
                        setResForm(p => ({ ...p, car_id: parseInt(e.target.value), prix_par_jour: ppj, ...pricing }));
                      }}>
                      <option value="">Sélectionner une voiture</option>
                      {cars.map(c => <option key={c.id} value={c.id}>{c.name}{c.matricule ? ` — ${c.matricule}` : ''}</option>)}
                    </select>
                  </Field>
                  <Field label="Client existant">
                    <ClientSelector token={getToken()} onSelect={(client) => {
                      setResForm(p => ({ ...p, client_id: client.id, client_name: client.nom_prenom, client_phone: client.telephone || '' }));
                    }} />
                    <div className="text-xs text-gray-600 mt-1 font-body">Ou saisissez manuellement ci-dessous</div>
                  </Field>
                  <Field label="Nom client *"><input required className={inputCls} value={resForm.client_name} onChange={setC(setResForm, 'client_name')} /></Field>
                  <Field label="Téléphone *"><input required className={inputCls} value={resForm.client_phone} onChange={setC(setResForm, 'client_phone')} placeholder="0612345678" /></Field>
                  <div className="grid grid-cols-2 gap-3">
                    <Field label="Date et heure de début *">
                      <input required type="datetime-local" className={inputCls} value={resForm.start_datetime}
                        onChange={e => {
                          const val = e.target.value;
                          const startDate = val ? val.slice(0, 10) : '';
                          setResForm(p => ({ ...p, start_datetime: val, start_date: startDate, end_datetime: '', end_date: '', nb_jours: 0, prix_total: 0 }));
                          setResConflict('');
                        }} />
                    </Field>
                    <div style={{ marginBottom: '0' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                        <label style={{ color: '#5a4a2a', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '1px', fontFamily: 'DM Sans' }}>
                          Date et heure de fin
                        </label>
                        <label style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer' }}>
                          <input
                            type="checkbox"
                            checked={sansFinReservation}
                            onChange={e => {
                              setSansFinReservation(e.target.checked);
                              if (e.target.checked) {
                                setResForm(p => ({ ...p, end_datetime: '', end_date: '', nb_jours: 0, prix_total: 0 }));
                                setResConflict('');
                              }
                            }}
                            style={{ accentColor: '#FF6B00' }}
                          />
                          <span style={{ color: '#FF6B00', fontSize: '11px', fontFamily: 'DM Sans' }}>Sans fin</span>
                        </label>
                      </div>
                      <input
                        type="datetime-local"
                        value={resForm.end_datetime || ''}
                        disabled={sansFinReservation}
                        required={!sansFinReservation}
                        min={resForm.start_datetime || ''}
                        onChange={e => {
                          const val = e.target.value;
                          const endDate = val ? val.slice(0, 10) : '';
                          if (resForm.start_datetime && val) {
                            const d = calculateNbJours(resForm.start_datetime, val);
                            const total = d * (resForm.prix_par_jour || 0);
                            setResForm(p => ({ ...p, end_datetime: val, end_date: endDate, nb_jours: d, prix_total: total }));
                          } else {
                            setResForm(p => ({ ...p, end_datetime: val, end_date: endDate }));
                          }
                          setResConflict('');
                        }}
                        style={{ width: '100%', background: sansFinReservation ? '#1a1a1a' : '#0A0A0A', border: '1px solid #333', color: sansFinReservation ? '#3a3a3a' : '#fff', padding: '8px 12px', borderRadius: '4px', fontFamily: 'DM Sans', fontSize: '12px', cursor: sansFinReservation ? 'not-allowed' : 'pointer', opacity: sansFinReservation ? 0.5 : 1 }}
                      />
                      {sansFinReservation && (
                        <div style={{ color: '#FF6B00', fontSize: '11px', fontFamily: 'DM Sans', marginTop: '4px', fontStyle: 'italic' }}>
                          📌 Réservation sans date de fin définie
                        </div>
                      )}
                    </div>
                  </div>
                  {(resForm.nb_jours > 0 || resForm.prix_total > 0) && (
                    <div style={{ display: 'flex', gap: '24px', padding: '10px 14px', background: 'rgba(255,107,0,0.05)', border: '0.5px solid rgba(255,107,0,0.2)', borderRadius: '4px' }}>
                      <div>
                        <div style={{ color: '#5a4a2a', fontSize: '10px' }}>DURÉE</div>
                        <div style={{ color: '#FF6B00', fontFamily: '"Bebas Neue", cursive', fontSize: '22px' }}>{resForm.nb_jours || 0} jours</div>
                      </div>
                      <div>
                        <div style={{ color: '#5a4a2a', fontSize: '10px' }}>TOTAL</div>
                        <div style={{ color: '#FF6B00', fontFamily: '"Bebas Neue", cursive', fontSize: '22px' }}>{resForm.prix_total || 0} MAD</div>
                      </div>
                    </div>
                  )}
                  <div className="grid grid-cols-3 gap-3">
                    <Field label="Prix/jour (MAD)">
                      <input type="number" className={inputCls} value={resForm.prix_par_jour}
                        onChange={e => {
                          const ppj = parseFloat(e.target.value) || 0;
                          const total = (resForm.nb_jours || 0) * ppj;
                          setResForm(p => ({ ...p, prix_par_jour: ppj, prix_total: total }));
                        }} />
                    </Field>
                    <Field label="Nb jours">
                      <div className={inputCls + ' text-gray-400 select-none'}>{resForm.nb_jours || 0}</div>
                    </Field>
                    <Field label="Total (MAD)">
                      <div className={inputCls + ' text-[#FF6B00] font-semibold select-none'}>{resForm.prix_total || 0}</div>
                    </Field>
                  </div>
                  <Field label="Statut">
                    <select className={selectCls} value={resForm.status} onChange={setC(setResForm, 'status')}>
                      <option value="pending">En attente</option>
                      <option value="confirmed">Confirmé</option>
                      <option value="cancelled">Annulé</option>
                    </select>
                  </Field>
                  {/* CAUTION SECTION */}
                  <div style={{ marginTop: '16px', padding: '16px', background: 'rgba(255,107,0,0.03)', border: '0.5px solid rgba(255,107,0,0.2)', borderRadius: '6px' }}>
                    <div style={{ color: '#FF6B00', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '2px', marginBottom: '14px', fontFamily: 'DM Sans' }}>
                      🔐 Caution
                    </div>

                    {/* Type dropdown */}
                    <div style={{ marginBottom: '12px' }}>
                      <label style={{ color: '#5a4a2a', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '1px', display: 'block', marginBottom: '6px', fontFamily: 'DM Sans' }}>Type de caution</label>
                      <select
                        value={resForm.caution_type}
                        onChange={e => setResForm(p => ({ ...p, caution_type: e.target.value, caution_montant: 0, caution_avance: 0, caution_reste: 0 }))}
                        style={{ width: '100%', background: '#0d0b08', border: '0.5px solid #2a2010', color: '#c9a87c', padding: '8px 12px', borderRadius: '4px', fontFamily: 'DM Sans', fontSize: '12px' }}
                      >
                        <option value="aucune">Aucune</option>
                        <option value="cash">💵 Cash</option>
                        <option value="cheque">🏦 Chèque</option>
                        <option value="document">📄 Document légalisé</option>
                      </select>
                    </div>

                    {/* CASH */}
                    {resForm.caution_type === 'cash' && (
                      <div>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '12px' }}>
                          <div>
                            <label style={{ color: '#5a4a2a', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '1px', display: 'block', marginBottom: '6px', fontFamily: 'DM Sans' }}>Montant caution (MAD)</label>
                            <input type="number" value={resForm.caution_montant}
                              onChange={e => { const m = parseFloat(e.target.value) || 0; setResForm(p => ({ ...p, caution_montant: m, caution_reste: m - (p.caution_avance || 0) })); }}
                              style={{ width: '100%', background: '#0d0b08', border: '0.5px solid #2a2010', color: '#c9a87c', padding: '8px 12px', borderRadius: '4px', fontFamily: 'DM Sans', fontSize: '12px' }} />
                          </div>
                          <div>
                            <label style={{ color: '#5a4a2a', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '1px', display: 'block', marginBottom: '6px', fontFamily: 'DM Sans' }}>Montant avance (MAD)</label>
                            <input type="number" value={resForm.caution_avance}
                              onChange={e => { const a = parseFloat(e.target.value) || 0; setResForm(p => ({ ...p, caution_avance: a, caution_reste: (p.caution_montant || 0) - a })); }}
                              style={{ width: '100%', background: '#0d0b08', border: '0.5px solid #2a2010', color: '#c9a87c', padding: '8px 12px', borderRadius: '4px', fontFamily: 'DM Sans', fontSize: '12px' }} />
                          </div>
                        </div>
                        <div style={{ padding: '10px 14px', background: 'rgba(255,107,0,0.05)', border: '0.5px solid rgba(255,107,0,0.2)', borderRadius: '4px', marginBottom: '12px', display: 'flex', justifyContent: 'space-between' }}>
                          <span style={{ color: '#5a4a2a', fontSize: '12px', fontFamily: 'DM Sans' }}>Reste à rendre</span>
                          <span style={{ color: resForm.caution_reste > 0 ? '#e24b4a' : '#4CAF50', fontSize: '16px', fontFamily: 'Bebas Neue' }}>{resForm.caution_reste || 0} MAD</span>
                        </div>
                        <label style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer', padding: '8px 0' }}>
                          <input type="checkbox" checked={resForm.caution_rendue} onChange={e => setResForm(p => ({ ...p, caution_rendue: e.target.checked }))} style={{ width: '16px', height: '16px', accentColor: '#FF6B00' }} />
                          <span style={{ color: '#c9a87c', fontSize: '13px', fontFamily: 'DM Sans' }}>✅ Caution rendue au client</span>
                        </label>
                      </div>
                    )}

                    {/* CHEQUE */}
                    {resForm.caution_type === 'cheque' && (
                      <div>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '12px' }}>
                          <div>
                            <label style={{ color: '#5a4a2a', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '1px', display: 'block', marginBottom: '6px', fontFamily: 'DM Sans' }}>Montant du chèque (MAD)</label>
                            <input type="number" value={resForm.caution_montant}
                              onChange={e => { const m = parseFloat(e.target.value) || 0; setResForm(p => ({ ...p, caution_montant: m, caution_reste: m - (p.caution_avance || 0) })); }}
                              style={{ width: '100%', background: '#0d0b08', border: '0.5px solid #2a2010', color: '#c9a87c', padding: '8px 12px', borderRadius: '4px', fontFamily: 'DM Sans', fontSize: '12px' }} />
                          </div>
                          <div>
                            <label style={{ color: '#5a4a2a', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '1px', display: 'block', marginBottom: '6px', fontFamily: 'DM Sans' }}>N° Chèque (optionnel)</label>
                            <input type="text" value={resForm.caution_cheque_numero} onChange={e => setResForm(p => ({ ...p, caution_cheque_numero: e.target.value }))} placeholder="Ex: 0012345"
                              style={{ width: '100%', background: '#0d0b08', border: '0.5px solid #2a2010', color: '#c9a87c', padding: '8px 12px', borderRadius: '4px', fontFamily: 'DM Sans', fontSize: '12px' }} />
                          </div>
                        </div>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '12px' }}>
                          <div>
                            <label style={{ color: '#5a4a2a', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '1px', display: 'block', marginBottom: '6px', fontFamily: 'DM Sans' }}>Montant avance (MAD)</label>
                            <input type="number" value={resForm.caution_avance}
                              onChange={e => { const a = parseFloat(e.target.value) || 0; setResForm(p => ({ ...p, caution_avance: a, caution_reste: (p.caution_montant || 0) - a })); }}
                              style={{ width: '100%', background: '#0d0b08', border: '0.5px solid #2a2010', color: '#c9a87c', padding: '8px 12px', borderRadius: '4px', fontFamily: 'DM Sans', fontSize: '12px' }} />
                          </div>
                          <div style={{ display: 'flex', alignItems: 'flex-end', paddingBottom: '4px' }}>
                            <div style={{ padding: '10px 14px', background: 'rgba(255,107,0,0.05)', border: '0.5px solid rgba(255,107,0,0.2)', borderRadius: '4px', width: '100%', display: 'flex', justifyContent: 'space-between' }}>
                              <span style={{ color: '#5a4a2a', fontSize: '12px', fontFamily: 'DM Sans' }}>Reste</span>
                              <span style={{ color: resForm.caution_reste > 0 ? '#e24b4a' : '#4CAF50', fontSize: '16px', fontFamily: 'Bebas Neue' }}>{resForm.caution_reste || 0} MAD</span>
                            </div>
                          </div>
                        </div>
                        <label style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer', padding: '8px 0' }}>
                          <input type="checkbox" checked={resForm.caution_rendue} onChange={e => setResForm(p => ({ ...p, caution_rendue: e.target.checked }))} style={{ width: '16px', height: '16px', accentColor: '#FF6B00' }} />
                          <span style={{ color: '#c9a87c', fontSize: '13px', fontFamily: 'DM Sans' }}>✅ Chèque rendu au client</span>
                        </label>
                      </div>
                    )}

                    {/* DOCUMENT */}
                    {resForm.caution_type === 'document' && (
                      <div>
                        <div style={{ marginBottom: '12px' }}>
                          <label style={{ color: '#5a4a2a', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '1px', display: 'block', marginBottom: '6px', fontFamily: 'DM Sans' }}>Description du document</label>
                          <input type="text" value={resForm.caution_document_description} onChange={e => setResForm(p => ({ ...p, caution_document_description: e.target.value }))} placeholder="Ex: CIN originale, Passeport..."
                            style={{ width: '100%', background: '#0d0b08', border: '0.5px solid #2a2010', color: '#c9a87c', padding: '8px 12px', borderRadius: '4px', fontFamily: 'DM Sans', fontSize: '12px' }} />
                        </div>
                        <label style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer', padding: '8px 0', marginBottom: '8px' }}>
                          <input type="checkbox" checked={resForm.caution_document_recu} onChange={e => setResForm(p => ({ ...p, caution_document_recu: e.target.checked }))} style={{ width: '16px', height: '16px', accentColor: '#FF6B00' }} />
                          <span style={{ color: '#c9a87c', fontSize: '13px', fontFamily: 'DM Sans' }}>📥 Document reçu du client</span>
                        </label>
                        <label style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer', padding: '8px 0' }}>
                          <input type="checkbox" checked={resForm.caution_rendue} onChange={e => setResForm(p => ({ ...p, caution_rendue: e.target.checked }))} style={{ width: '16px', height: '16px', accentColor: '#FF6B00' }} />
                          <span style={{ color: '#c9a87c', fontSize: '13px', fontFamily: 'DM Sans' }}>✅ Document rendu au client</span>
                        </label>
                      </div>
                    )}
                  </div>

                  {resConflict && <div className="text-yellow-400 text-xs font-body bg-yellow-400/10 border border-yellow-400/30 p-2 rounded">{resConflict}</div>}
                  <div className="flex gap-3 pt-2">
                    <button type="button" onClick={() => { setResModal(false); setSavedReservation(null); }} className="flex-1 border border-[#444] text-gray-400 font-body py-2 rounded hover:border-[#666]">Annuler</button>
                    <button type="submit" className="flex-1 bg-[#FF6B00] text-white font-body font-semibold py-2 rounded hover:bg-orange-500">{editRes ? 'Enregistrer' : 'Créer'}</button>
                  </div>
                </form>
              </Modal>
            )}

            {savedReservation && (
              <div style={{ padding: '16px', background: 'rgba(76,175,80,0.1)', border: '0.5px solid #4CAF50', borderRadius: '6px', marginTop: '16px' }}>
                <div style={{ color: '#4CAF50', fontSize: '13px', fontFamily: 'DM Sans', marginBottom: '12px', fontWeight: 500 }}>
                  ✅ Réservation enregistrée avec succès !
                </div>
                <div style={{ display: 'flex', gap: '10px' }}>
                  <button type="button" onClick={() => { sessionStorage.setItem('contractFromReservation', JSON.stringify(savedReservation)); window.location.href = '/chef/contrat'; }}
                    style={{ background: '#FF6B00', color: '#fff', border: 'none', padding: '10px 20px', borderRadius: '4px', cursor: 'pointer', fontFamily: 'DM Sans', fontSize: '12px', letterSpacing: '1px' }}>
                    📄 Générer le contrat →
                  </button>
                  <button type="button" onClick={() => setSavedReservation(null)}
                    style={{ background: 'transparent', color: '#666', border: '0.5px solid #333', padding: '10px 20px', borderRadius: '4px', cursor: 'pointer', fontFamily: 'DM Sans', fontSize: '12px' }}>
                    Fermer
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ── TAB 3: RAPPORT ── */}
        {tab === 3 && (
          <div>
            <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
              <h2 className="font-heading text-2xl">RAPPORT MENSUEL</h2>
              <div className="flex items-center gap-3">
                <input
                  type="month"
                  value={rapportMonth}
                  onChange={e => { setRapportMonth(e.target.value); setRapportData(null); }}
                  className={inputCls + ' w-44'}
                />
                <button onClick={loadRapport} disabled={rapportLoading}
                  className="bg-[#FF6B00] text-white font-body text-sm px-5 py-2 rounded hover:bg-orange-500 disabled:opacity-50 transition-colors">
                  {rapportLoading ? 'Chargement…' : 'Générer le rapport'}
                </button>
                {rapportData && (
                  <button onClick={exportPDF}
                    className="bg-[#111] border border-[#FF6B00] text-[#FF6B00] font-body text-sm px-5 py-2 rounded hover:bg-[#FF6B00] hover:text-white transition-colors">
                    📄 Exporter PDF
                  </button>
                )}
              </div>
            </div>

            {rapportData && (() => {
              const [y, m] = rapportMonth.split('-');
              const monthLabel = `${MONTH_NAMES_FR[parseInt(m) - 1]} ${y}`;
              const mostRented = rapportData.cars.length
                ? rapportData.cars.reduce((a, b) => a.reservations_count >= b.reservations_count ? a : b)
                : null;
              const totalDaysInMonth = new Date(parseInt(y), parseInt(m), 0).getDate();
              const maxPossibleDays = cars.length * totalDaysInMonth;
              const occupancyRate = maxPossibleDays > 0
                ? Math.round((rapportData.total_jours / maxPossibleDays) * 100)
                : 0;

              return (
                <div className="space-y-6">
                  {/* Header card */}
                  <div className="bg-[#111] border border-[#FF6B00]/30 rounded-lg p-6">
                    <div className="font-heading text-xl mb-1">RAPPORT MENSUEL — {monthLabel}</div>
                    <div className="text-3xl font-heading text-[#FF6B00]">
                      {rapportData.total_revenue.toLocaleString('fr-MA')} MAD
                    </div>
                    <div className="text-xs text-gray-400 font-body mt-1">Total revenus du mois</div>
                  </div>

                  {/* Stats row */}
                  <div className="grid grid-cols-3 gap-4">
                    {[
                      { label: 'Réservations', value: rapportData.total_reservations, color: 'text-blue-400' },
                      { label: 'Jours loués', value: rapportData.total_jours, color: 'text-purple-400' },
                      { label: "Taux d'occupation", value: `${occupancyRate}%`, color: 'text-green-400' },
                    ].map(s => (
                      <div key={s.label} className="bg-[#111] border border-[#222] rounded-lg p-4 text-center">
                        <div className={`font-heading text-2xl ${s.color}`}>{s.value}</div>
                        <div className="text-xs text-gray-400 font-body mt-1">{s.label}</div>
                      </div>
                    ))}
                  </div>

                  {/* Per-car table */}
                  {rapportData.cars.length > 0 ? (
                    <div className="overflow-x-auto rounded-lg border border-[#222]">
                      <table className="w-full">
                        <thead className="bg-[#111] border-b border-[#222]">
                          <tr>
                            {['Voiture','Réservations','Jours','Total MAD'].map(h => (
                              <th key={h} className="text-left text-xs text-gray-400 font-body uppercase tracking-wider px-4 py-3">{h}</th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {rapportData.cars.map((c, i) => (
                            <tr key={i} className="border-b border-[#1a1a1a] hover:bg-[#111] transition-colors">
                              <td className="px-4 py-3 font-body text-sm font-medium">{c.car_name}</td>
                              <td className="px-4 py-3 font-body text-sm text-gray-400">{c.reservations_count}</td>
                              <td className="px-4 py-3 font-body text-sm text-gray-400">{c.total_jours}j</td>
                              <td className="px-4 py-3 font-body text-sm text-[#FF6B00] font-semibold">{c.total_revenue.toLocaleString('fr-MA')} MAD</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <div className="text-center py-12 text-gray-500 font-body">Aucune réservation ce mois.</div>
                  )}

                  {/* Footer summary */}
                  <div className="bg-[#111] border border-[#222] rounded-lg p-5 space-y-2 font-body text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-400">TOTAL GÉNÉRAL</span>
                      <span className="text-[#FF6B00] font-semibold text-base">{rapportData.total_revenue.toLocaleString('fr-MA')} MAD</span>
                    </div>
                    {mostRented && (
                      <div className="flex justify-between">
                        <span className="text-gray-400">Voiture la plus louée</span>
                        <span className="text-white">{mostRented.car_name} ({mostRented.reservations_count} rés.)</span>
                      </div>
                    )}
                    <div className="flex justify-between">
                      <span className="text-gray-400">Taux d'occupation</span>
                      <span className="text-green-400">{occupancyRate}%</span>
                    </div>
                  </div>
                </div>
              );
            })()}

            {!rapportData && !rapportLoading && (
              <div className="text-center py-20 text-gray-500 font-body">
                Sélectionnez un mois et cliquez sur "Générer le rapport".
              </div>
            )}
          </div>
        )}

        {/* ── TAB 4: PARAMÈTRES ── */}
        {tab === 4 && (
          <div style={{ maxWidth: 560 }}>
            <h2 className="font-heading text-2xl mb-6">PARAMÈTRES</h2>

            <div style={{ background: '#111', border: '0.5px solid #222', borderRadius: 8, padding: 24 }}>
              <div style={{ fontSize: 11, color: '#666', textTransform: 'uppercase', letterSpacing: 2, fontFamily: 'DM Sans', marginBottom: 16 }}>
                Signature &amp; Cachet — PDF Contrats
              </div>

              {signaturePreview ? (
                <div style={{ marginBottom: 16 }}>
                  <img
                    src={signaturePreview}
                    alt="Signature"
                    style={{ maxHeight: 120, maxWidth: 320, objectFit: 'contain', border: '0.5px solid rgba(255,107,0,0.3)', borderRadius: 6, background: '#fff', padding: 8, display: 'block' }}
                  />
                  {sigSaved && (
                    <div style={{ color: '#4CAF50', fontSize: 12, fontFamily: 'DM Sans', marginTop: 8 }}>✓ Signature enregistrée avec succès</div>
                  )}
                  {uploadingSignature && (
                    <div style={{ color: '#FF6B00', fontSize: 12, fontFamily: 'DM Sans', marginTop: 8 }}>⏳ Chargement en cours...</div>
                  )}
                </div>
              ) : (
                <div
                  onClick={() => signatureInputRef.current?.click()}
                  onDragOver={e => e.preventDefault()}
                  onDrop={e => { e.preventDefault(); handleSigFile(e.dataTransfer.files[0]); }}
                  style={{ border: '2px dashed rgba(255,107,0,0.3)', borderRadius: 8, padding: 32, textAlign: 'center', cursor: 'pointer', background: '#0d0b08', marginBottom: 16 }}
                >
                  <div style={{ fontSize: 28, marginBottom: 8 }}>✍️</div>
                  <div style={{ color: '#5a4a2a', fontSize: 13, fontFamily: 'DM Sans' }}>Cliquez ou glissez votre signature / cachet</div>
                  <div style={{ color: '#3a2e1e', fontSize: 11, marginTop: 4, fontFamily: 'DM Sans' }}>PNG (fond transparent recommandé) · JPEG · WEBP</div>
                </div>
              )}

              <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                <button
                  onClick={() => signatureInputRef.current?.click()}
                  style={{ background: '#FF6B00', color: '#fff', border: 'none', padding: '10px 20px', borderRadius: 4, cursor: 'pointer', fontSize: 13, fontFamily: 'DM Sans', letterSpacing: 1 }}
                >
                  {signaturePreview ? '↺ Changer la signature' : '+ Uploader la signature'}
                </button>
                {signaturePreview && (
                  <button
                    onClick={() => { setSignatureUrl(''); setSignaturePreview(''); setSigSaved(false); }}
                    style={{ background: 'transparent', color: '#e24b4a', border: '0.5px solid #e24b4a', padding: '10px 16px', borderRadius: 4, cursor: 'pointer', fontSize: 12, fontFamily: 'DM Sans' }}
                  >
                    Supprimer
                  </button>
                )}
              </div>
              <input
                ref={signatureInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp"
                style={{ display: 'none' }}
                onChange={e => handleSigFile(e.target.files[0])}
              />
              <div style={{ color: '#3a2e1e', fontSize: 11, fontFamily: 'DM Sans', marginTop: 12 }}>
                Format recommandé : PNG transparent, fond blanc, 400 × 200 px minimum.
              </div>
            </div>

            {/* ── BLACKLIST SECTION ── */}
            <div style={{ marginTop: 32 }}>
              <h3 style={{ fontFamily: '"Bebas Neue", cursive', fontSize: 20, color: '#e24b4a', letterSpacing: 2, marginBottom: 16 }}>🚫 Clients Blacklistés</h3>

              <div style={{ background: '#111', border: '0.5px solid #2a2010', borderRadius: 8, padding: 24, marginBottom: 16 }}>
                <div style={{ fontSize: 11, color: '#666', textTransform: 'uppercase', letterSpacing: 2, fontFamily: 'DM Sans', marginBottom: 12 }}>
                  Ajouter un client à la blacklist
                </div>
                <div style={{ position: 'relative', marginBottom: 12 }}>
                  <input
                    value={blacklistSearch}
                    onChange={e => { setBlacklistSearch(e.target.value); setSelectedToBlacklist(null); searchToBlacklist(e.target.value); }}
                    placeholder="Rechercher un client (nom, CIN, téléphone)..."
                    style={{ width: '100%', background: '#0d0b08', border: '0.5px solid #2a2010', color: '#c9a87c', padding: '10px 14px', borderRadius: 4, fontFamily: 'DM Sans', fontSize: 13, boxSizing: 'border-box', outline: 'none' }}
                  />
                  {blacklistSearchResults.length > 0 && !selectedToBlacklist && (
                    <div style={{ position: 'absolute', top: '100%', left: 0, right: 0, background: '#111', border: '0.5px solid #2a2010', borderRadius: 4, zIndex: 999, maxHeight: 200, overflowY: 'auto', boxShadow: '0 4px 20px rgba(0,0,0,0.5)' }}>
                      {blacklistSearchResults.map(c => (
                        <div key={c.id}
                          onClick={() => { setSelectedToBlacklist(c); setBlacklistSearch(c.nom_prenom); setBlacklistSearchResults([]); }}
                          style={{ padding: '10px 14px', cursor: 'pointer', borderBottom: '0.5px solid #1a1a1a' }}
                          onMouseEnter={e => e.currentTarget.style.background = '#1a1508'}
                          onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                          <div style={{ color: '#fff', fontSize: 13, fontFamily: 'DM Sans' }}>{c.nom_prenom}</div>
                          <div style={{ color: '#5a4a2a', fontSize: 11, fontFamily: 'DM Sans' }}>
                            {c.cin_passport && `CIN: ${c.cin_passport}`}{c.cin_passport && c.telephone && ' — '}{c.telephone}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
                {selectedToBlacklist && (
                  <>
                    <textarea
                      value={blacklistReason}
                      onChange={e => setBlacklistReason(e.target.value)}
                      placeholder="Raison du blacklistage (optionnel)..."
                      rows={3}
                      style={{ width: '100%', background: '#0d0b08', border: '0.5px solid #2a2010', color: '#c9a87c', padding: '10px 14px', borderRadius: 4, fontFamily: 'DM Sans', fontSize: 13, boxSizing: 'border-box', outline: 'none', resize: 'vertical', marginBottom: 10 }}
                    />
                    <button
                      onClick={handleBlacklist}
                      style={{ background: '#e24b4a', color: '#fff', border: 'none', padding: '10px 20px', borderRadius: 4, cursor: 'pointer', fontSize: 13, fontFamily: 'DM Sans', letterSpacing: 1 }}>
                      🚫 Blacklister {selectedToBlacklist.nom_prenom}
                    </button>
                  </>
                )}
              </div>

              {blacklistedClients.length === 0 ? (
                <div style={{ color: '#5a4a2a', fontSize: 13, fontFamily: 'DM Sans', textAlign: 'center', padding: '20px 0' }}>Aucun client blacklisté</div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {blacklistedClients.map(c => (
                    <div key={c.id} style={{ background: '#111', border: '0.5px solid rgba(226,75,74,0.3)', borderRadius: 6, padding: '14px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12 }}>
                      <div>
                        <div style={{ color: '#e24b4a', fontSize: 14, fontFamily: 'DM Sans', fontWeight: 600 }}>🚫 {c.nom_prenom}</div>
                        {c.cin_passport && <div style={{ color: '#5a4a2a', fontSize: 11, fontFamily: 'DM Sans', marginTop: 2 }}>CIN: {c.cin_passport}</div>}
                        {c.blacklist_reason && <div style={{ color: '#8a7a5a', fontSize: 12, fontFamily: 'DM Sans', marginTop: 4, fontStyle: 'italic' }}>"{c.blacklist_reason}"</div>}
                        {c.blacklisted_at && <div style={{ color: '#3a2e1e', fontSize: 11, fontFamily: 'DM Sans', marginTop: 2 }}>{new Date(c.blacklisted_at).toLocaleDateString('fr-FR')}</div>}
                      </div>
                      <button
                        onClick={() => handleUnblacklist(c.id)}
                        style={{ background: 'transparent', color: '#FF6B00', border: '0.5px solid #FF6B00', padding: '6px 12px', borderRadius: 4, cursor: 'pointer', fontSize: 11, fontFamily: 'DM Sans', whiteSpace: 'nowrap', flexShrink: 0 }}>
                        Retirer
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* ── ANNONCES SECTION ── */}
            <div style={{ marginTop: 32 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                <h3 style={{ fontFamily: '"Bebas Neue", cursive', fontSize: 20, color: '#FF6B00', letterSpacing: 2, margin: 0 }}>📢 Annonces</h3>
                <button onClick={openAnnAdd} style={{ background: '#FF6B00', color: '#fff', border: 'none', padding: '8px 16px', borderRadius: 4, cursor: 'pointer', fontSize: 12, fontFamily: 'DM Sans', letterSpacing: 1 }}>+ Ajouter</button>
              </div>

              {announcements.length === 0 ? (
                <div style={{ color: '#5a4a2a', fontSize: 13, fontFamily: 'DM Sans', textAlign: 'center', padding: '20px 0' }}>Aucune annonce</div>
              ) : (
                <div style={{ background: '#111', border: '0.5px solid #222', borderRadius: 8, overflow: 'hidden' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead>
                      <tr style={{ borderBottom: '0.5px solid #222' }}>
                        {['Titre', 'Début', 'Fin', 'Statut', 'Actions'].map(h => (
                          <th key={h} style={{ textAlign: 'left', fontSize: 10, color: '#666', textTransform: 'uppercase', letterSpacing: 1, fontFamily: 'DM Sans', padding: '10px 12px' }}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {announcements.map(a => (
                        <tr key={a.id} style={{ borderBottom: '0.5px solid #1a1a1a' }}>
                          <td style={{ padding: '10px 12px', fontFamily: 'DM Sans', fontSize: 13, color: '#c9a87c', maxWidth: 160, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{a.title}</td>
                          <td style={{ padding: '10px 12px', fontFamily: 'DM Sans', fontSize: 11, color: '#5a4a2a' }}>{a.start_date}</td>
                          <td style={{ padding: '10px 12px', fontFamily: 'DM Sans', fontSize: 11, color: '#5a4a2a' }}>{a.end_date}</td>
                          <td style={{ padding: '10px 12px' }}><span className={`text-xs font-body px-2 py-0.5 rounded border ${statusBadge(a.status)}`}>{statusLabel(a.status)}</span></td>
                          <td style={{ padding: '10px 12px' }}>
                            <div style={{ display: 'flex', gap: 6 }}>
                              <button onClick={() => openAnnEdit(a)} style={{ fontSize: 11, fontFamily: 'DM Sans', padding: '4px 8px', background: '#1a1a1a', border: '0.5px solid #333', color: '#c9a87c', borderRadius: 4, cursor: 'pointer' }}>Modifier</button>
                              <button onClick={() => toggleAnnStatus(a)} style={{ fontSize: 11, fontFamily: 'DM Sans', padding: '4px 8px', background: '#1a1a1a', border: '0.5px solid #333', color: '#888', borderRadius: 4, cursor: 'pointer' }}>{a.status === 'active' ? 'Désactiver' : 'Activer'}</button>
                              <button onClick={() => deleteAnn(a.id)} style={{ fontSize: 11, fontFamily: 'DM Sans', padding: '4px 8px', background: 'rgba(180,40,40,0.15)', border: '0.5px solid rgba(200,60,60,0.3)', color: '#e24b4a', borderRadius: 4, cursor: 'pointer' }}>🗑</button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

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
          </div>
        )}

        {/* ── TAB 0: CLIENTS ── */}
        {tab === 0 && (
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-heading text-2xl">CLIENTS <span className="text-gray-500 text-lg">({clients.length})</span></h2>
              <button onClick={() => { setEditClient(null); setClientForm({ nom_prenom: '', date_naissance: '', telephone: '', cin_passport: '', cin_passport_expiry: '', adresse: '', permis: '', permis_expiry: '' }); setClientModal(true); }}
                className="bg-[#FF6B00] text-white font-body text-sm px-5 py-2 rounded hover:bg-orange-500 transition-colors">
                + Nouveau Client
              </button>
            </div>

            <input
              value={clientSearch}
              onChange={e => { setClientSearch(e.target.value); loadClients(e.target.value); }}
              onFocus={() => { if (clients.length === 0) loadClients(''); }}
              placeholder="Rechercher par nom, CIN ou téléphone..."
              className={inputCls + ' mb-4'}
            />

            {clients.length === 0 && (
              <div className="text-center py-12 text-gray-500 font-body">
                <button onClick={() => loadClients('')} className="text-[#FF6B00] hover:underline">Charger tous les clients</button>
              </div>
            )}

            {clients.length > 0 && (
              <div className="overflow-x-auto rounded-lg border border-[#222]">
                <table className="w-full">
                  <thead className="bg-[#111] border-b border-[#222]">
                    <tr>
                      {['Nom & Prénom','Date naissance','Téléphone','CIN / Passeport','Permis','Actions'].map(h => (
                        <th key={h} className="text-left text-xs text-gray-400 font-body uppercase tracking-wider px-4 py-3">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {clients.map(c => (
                      <tr key={c.id} className="border-b border-[#1a1a1a] hover:bg-[#111] transition-colors">
                        <td className="px-4 py-3 font-body text-sm font-medium">{c.nom_prenom}</td>
                        <td className="px-4 py-3 font-body text-xs text-gray-400">{c.date_naissance || '–'}</td>
                        <td className="px-4 py-3">
                          <a href={`https://wa.me/212${c.telephone?.replace(/^0/, '')}`} target="_blank" rel="noopener noreferrer"
                            className="font-body text-xs text-green-400 hover:underline">{c.telephone || '–'}</a>
                        </td>
                        <td className="px-4 py-3 font-body text-xs text-gray-400">{c.cin_passport || '–'}</td>
                        <td className="px-4 py-3 font-body text-xs text-gray-400">{c.permis || '–'}</td>
                        <td className="px-4 py-3">
                          <div className="flex gap-1.5">
                            <button onClick={() => openClientEdit(c)} className="text-xs font-body px-2 py-1 bg-[#1a1a1a] border border-[#333] rounded hover:border-[#FF6B00] hover:text-[#FF6B00] transition-colors">Modifier</button>
                            <button onClick={() => deleteClient(c.id)} className="text-xs font-body px-2 py-1 bg-red-900/20 border border-red-800/40 text-red-400 rounded hover:bg-red-900/40 transition-colors">🗑</button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {clientModal && (
              <Modal title={editClient ? 'Modifier le client' : 'Nouveau client'} onClose={() => setClientModal(false)}>
                <form onSubmit={saveClient} className="space-y-4">
                  <Field label="Nom & Prénom *">
                    <input required className={inputCls} value={clientForm.nom_prenom} onChange={e => setClientForm(p => ({ ...p, nom_prenom: e.target.value }))} />
                  </Field>
                  <div className="grid grid-cols-2 gap-3">
                    <Field label="Date de naissance">
                      <input type="date" className={inputCls} value={clientForm.date_naissance} onChange={e => setClientForm(p => ({ ...p, date_naissance: e.target.value }))} />
                    </Field>
                    <Field label="Téléphone">
                      <input className={inputCls} value={clientForm.telephone} onChange={e => setClientForm(p => ({ ...p, telephone: e.target.value }))} placeholder="0612345678" />
                    </Field>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <Field label="CIN / Passeport">
                      <input className={inputCls} value={clientForm.cin_passport} onChange={e => setClientForm(p => ({ ...p, cin_passport: e.target.value }))} />
                    </Field>
                    <Field label="Expiration CIN/Passeport">
                      <input type="date" className={inputCls} value={clientForm.cin_passport_expiry} onChange={e => setClientForm(p => ({ ...p, cin_passport_expiry: e.target.value }))} />
                    </Field>
                  </div>
                  <Field label="Adresse">
                    <input className={inputCls} value={clientForm.adresse} onChange={e => setClientForm(p => ({ ...p, adresse: e.target.value }))} />
                  </Field>
                  <div className="grid grid-cols-2 gap-3">
                    <Field label="N° Permis">
                      <input className={inputCls} value={clientForm.permis} onChange={e => setClientForm(p => ({ ...p, permis: e.target.value }))} />
                    </Field>
                    <Field label="Expiration Permis">
                      <input type="date" className={inputCls} value={clientForm.permis_expiry} onChange={e => setClientForm(p => ({ ...p, permis_expiry: e.target.value }))} />
                    </Field>
                  </div>
                  <div className="flex gap-3 pt-2">
                    <button type="button" onClick={() => setClientModal(false)} className="flex-1 border border-[#444] text-gray-400 font-body py-2 rounded hover:border-[#666]">Annuler</button>
                    <button type="submit" className="flex-1 bg-[#FF6B00] text-white font-body font-semibold py-2 rounded hover:bg-orange-500">{editClient ? 'Enregistrer' : 'Créer'}</button>
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

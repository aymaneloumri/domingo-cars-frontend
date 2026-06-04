import React, { useState, useEffect, useCallback } from 'react';
import api from '../utils/api';
import ChefHeader from '../components/ChefHeader';
import { previewContractPDF, downloadContractPDF } from '../components/PdfGenerator';
import ClientSelector from '../components/ClientSelector';
import { getToken } from '../utils/auth';
import { API_BASE } from '../utils/config';

const FUEL_OPTIONS = ['1/8','2/8','3/8','4/8','5/8','6/8','7/8','8/8'];
const CATEGORIES = ['Economie','Berline','SUV','Utilitaire'];

const inputCls = "w-full bg-[#0A0A0A] border border-[#333] text-white text-sm font-body px-3 py-2 rounded focus:border-[#FF6B00] focus:outline-none transition-colors";
const selectCls = "w-full bg-[#0A0A0A] border border-[#333] text-white text-sm font-body px-3 py-2 rounded focus:border-[#FF6B00] focus:outline-none transition-colors";

function SectionTitle({ children }) {
  return (
    <div className="flex items-center gap-3 mb-4 mt-6">
      <div className="h-[2px] w-6 bg-[#FF6B00]" />
      <h3 className="font-heading text-lg tracking-widest text-[#FF6B00]">{children}</h3>
      <div className="flex-1 h-[1px] bg-[#1e1e1e]" />
    </div>
  );
}

function Field({ label, required: req, children, className = '' }) {
  return (
    <div className={className}>
      <label className="text-xs text-gray-400 font-body block mb-1 uppercase tracking-wider">
        {label}{req && <span className="text-[#FF6B00] ml-0.5">*</span>}
      </label>
      {children}
    </div>
  );
}

function emptyForm() {
  const nextNum = 'Auto-généré';
  const now = new Date().toISOString().slice(0, 16);
  return {
    contract_number: nextNum,
    contract_date: now,
    car_id: '',
    brand: '',
    model: '',
    category: 'Economie',
    matricule: '',
    client_name: '',
    client_dob: '',
    client_phone: '',
    client_cin: '',
    client_cin_expiry: '',
    client_address: '',
    client_permis: '',
    client_permis_expiry: '',
    driver2_enabled: false,
    driver2_name: '',
    driver2_dob: '',
    driver2_phone: '',
    driver2_cin: '',
    driver2_cin_expiry: '',
    driver2_address: '',
    driver2_permis: '',
    driver2_permis_expiry: '',
    nb_days: '',
    price_per_day: '',
    total: '',
    avance: '',
    reste: '',
    depart_datetime: now,
    depart_km: '',
    depart_inspection: 'Aucun point signalé',
    depart_fuel: '4/8',
    retour_prevu: '',
    retour_effectif: '',
    retour_km: '',
    retour_fuel: '4/8',
  };
}

export default function Contrat() {
  const [cars, setCars] = useState([]);
  const [contracts, setContracts] = useState([]);
  const [form, setForm] = useState(emptyForm());
  const [editId, setEditId] = useState(null);
  const [saving, setSaving] = useState(false);
  const [saveMsg, setSaveMsg] = useState('');
  const [clientReservations, setClientReservations] = useState([]);
  const [showReservationPicker, setShowReservationPicker] = useState(false);
  const [emailList, setEmailList] = useState(['']);
  const [sendingEmail, setSendingEmail] = useState(false);
  const [emailSent, setEmailSent] = useState(false);
  const [autoFilled, setAutoFilled] = useState(false);

  useEffect(() => {
    const stored = sessionStorage.getItem('contractFromReservation');
    if (!stored) return;
    try {
      const resa = JSON.parse(stored);
      setForm(prev => ({
        ...prev,
        car_id: resa.car_id || '',
        brand: resa.brand || '',
        model: resa.car_name || '',
        matricule: resa.matricule || '',
        category: resa.category || '',
        nb_days: resa.nb_jours || 0,
        price_per_day: resa.prix_par_jour || resa.price_per_day || 0,
        total: resa.prix_total || 0,
        avance: 0,
        reste: resa.prix_total || 0,
        depart_datetime: resa.start_datetime || (resa.start_date + 'T08:00'),
        retour_prevu: resa.end_datetime || (resa.end_date + 'T18:00'),
      }));
      if (resa.client_id) {
        const token = localStorage.getItem('token') || 'domingo2024';
        fetch(`${API_BASE}/api/clients/${resa.client_id}`, {
          headers: { 'x-admin-token': token },
        })
          .then(r => r.json())
          .then(client => {
            if (client) {
              setForm(prev => ({
                ...prev,
                client_id: client.id,
                client_name: client.nom_prenom,
                client_dob: client.date_naissance || '',
                client_phone: client.telephone || '',
                client_cin: client.cin_passport || '',
                client_cin_expiry: client.cin_passport_expiry || '',
                client_address: client.adresse || '',
                client_permis: client.permis || '',
                client_permis_expiry: client.permis_expiry || '',
              }));
            }
          });
      } else if (resa.client_name) {
        setForm(prev => ({
          ...prev,
          client_name: resa.client_name,
          client_phone: resa.client_phone || '',
        }));
      }
      setAutoFilled(true);
      setTimeout(() => setAutoFilled(false), 5000);
      sessionStorage.removeItem('contractFromReservation');
    } catch (err) {
      sessionStorage.removeItem('contractFromReservation');
    }
  }, []);

  useEffect(() => {
    api.get('/cars?admin=1').then(r => setCars(r.data)).catch(() => {});
    loadContracts();
  }, []);

  const loadContracts = () => {
    api.get('/contracts').then(r => setContracts(r.data)).catch(() => {});
  };

  const set = (field) => (e) => {
    const val = e.target.type === 'checkbox' ? e.target.checked : e.target.value;
    setForm(f => {
      const next = { ...f, [field]: val };
      // Auto-calc
      if (field === 'depart_datetime' || field === 'retour_prevu') {
        const dep = new Date(field === 'depart_datetime' ? val : next.depart_datetime);
        const ret = new Date(field === 'retour_prevu' ? val : next.retour_prevu);
        if (!isNaN(dep) && !isNaN(ret) && ret > dep) {
          const days = Math.ceil((ret - dep) / (1000 * 60 * 60 * 24));
          next.nb_days = days;
          if (next.price_per_day) {
            next.total = (days * parseFloat(next.price_per_day)).toFixed(2);
            next.reste = (parseFloat(next.total) - (parseFloat(next.avance) || 0)).toFixed(2);
          }
        }
      }
      if (field === 'price_per_day' || field === 'nb_days') {
        const days = parseFloat(field === 'nb_days' ? val : next.nb_days) || 0;
        const ppd = parseFloat(field === 'price_per_day' ? val : next.price_per_day) || 0;
        if (days && ppd) {
          next.total = (days * ppd).toFixed(2);
          next.reste = (parseFloat(next.total) - (parseFloat(next.avance) || 0)).toFixed(2);
        }
      }
      if (field === 'avance') {
        next.reste = (parseFloat(next.total || 0) - parseFloat(val || 0)).toFixed(2);
      }
      if (field === 'car_id') {
        const car = cars.find(c => c.id === parseInt(val));
        if (car) {
          next.matricule = car.matricule || '';
          next.price_per_day = car.price_per_day;
          next.model = car.name;
          if (next.nb_days) {
            next.total = (parseFloat(next.nb_days) * car.price_per_day).toFixed(2);
            next.reste = (parseFloat(next.total) - (parseFloat(next.avance) || 0)).toFixed(2);
          }
        }
      }
      return next;
    });
  };

  const handleSendEmail = async () => {
    const validEmails = emailList.filter(e => e && e.includes('@'));
    if (validEmails.length === 0) {
      alert('Veuillez saisir au moins une adresse email valide');
      return;
    }
    setSendingEmail(true);
    setEmailSent(false);
    try {
      const res = await fetch(`${API_BASE}/api/contracts/send-email`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-admin-token': getToken() },
        body: JSON.stringify({ emails: validEmails, contract: form }),
      });
      const data = await res.json();
      if (data.success) {
        setEmailSent(true);
        setTimeout(() => setEmailSent(false), 5000);
      } else {
        alert('Erreur: ' + (data.error || 'Envoi échoué'));
      }
    } catch (err) {
      alert('Erreur réseau: ' + err.message);
    } finally {
      setSendingEmail(false);
    }
  };

  const handleClientSelect = async (client) => {
    if (client.email) setEmailList([client.email]);
    setForm(prev => ({
      ...prev,
      client_id: client.id,
      client_name: client.nom_prenom,
      client_dob: client.date_naissance || '',
      client_phone: client.telephone || '',
      client_cin: client.cin_passport || '',
      client_cin_expiry: client.cin_passport_expiry || '',
      client_address: client.adresse || '',
      client_permis: client.permis || '',
      client_permis_expiry: client.permis_expiry || '',
    }));
    try {
      const res = await fetch(
        `${API_BASE}/api/reservations/by-client/${client.id}`,
        { headers: { 'x-admin-token': getToken() } }
      );
      const reservations = await res.json();
      console.log('[by-client] response:', reservations);
      if (Array.isArray(reservations) && reservations.length > 0) {
        setClientReservations(reservations);
        setShowReservationPicker(true);
      } else {
        setClientReservations([]);
        setShowReservationPicker(false);
      }
    } catch (err) {
      console.error('Error fetching reservations:', err);
    }
  };

  const handleReservationSelect = (resa) => {
    setForm(prev => ({
      ...prev,
      car_id: resa.car_id,
      brand: resa.car_name ? resa.car_name.split(' ')[0] : '',
      model: resa.car_name || '',
      matricule: resa.matricule || '',
      category: resa.category || prev.category,
      nb_days: resa.nb_jours || 0,
      price_per_day: resa.prix_par_jour || resa.price_per_day || 0,
      total: resa.prix_total || 0,
      avance: 0,
      reste: resa.prix_total || 0,
      depart_datetime: resa.start_datetime
        ? resa.start_datetime.slice(0, 16)
        : resa.start_date ? resa.start_date + 'T08:00' : prev.depart_datetime,
      retour_prevu: resa.end_datetime
        ? resa.end_datetime.slice(0, 16)
        : resa.end_date ? resa.end_date + 'T18:00' : prev.retour_prevu,
    }));
    setShowReservationPicker(false);
  };

  const handleSave = async () => {
    setSaving(true);
    setSaveMsg('');
    if (form.depart_datetime && form.retour_prevu && new Date(form.retour_prevu) <= new Date(form.depart_datetime)) {
      setSaveMsg('❌ La date de retour doit être après la date de départ');
      setSaving(false);
      return;
    }
    try {
      const payload = { ...form };
      if (!payload.driver2_enabled) {
        ['driver2_name','driver2_dob','driver2_phone','driver2_cin','driver2_cin_expiry','driver2_address','driver2_permis','driver2_permis_expiry'].forEach(k => payload[k] = null);
      }
      if (editId) {
        await api.put(`/contracts/${editId}`, payload);
        setSaveMsg('✅ Contrat mis à jour.');
        loadContracts();
      } else {
        const r = await api.post('/contracts', payload);
        const data = r.data;
        setSaveMsg(`✅ Contrat ${data.contract_number || ''} enregistré !`);
        setEditId(data.id);
        setForm(prev => ({ ...prev, contract_number: data.contract_number, id: data.id }));
        loadContracts();
      }
    } catch (err) {
      setSaveMsg('❌ Erreur: ' + (err.response?.data?.error || 'Sauvegarde échouée.'));
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = async (id) => {
    try {
      const r = await api.get(`/contracts/${id}`);
      const d = r.data;
      setEditId(id);
      setForm({ ...d, driver2_enabled: !!(d.driver2_name) });
    } catch {}
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Supprimer ce contrat ?')) return;
    await api.delete('/contracts', { params: { id } });
    loadContracts();
    if (editId === id) { setEditId(null); setForm(emptyForm()); }
  };

  const handleNewContract = () => {
    setEditId(null);
    setForm(emptyForm());
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="min-h-screen bg-[#0A0A0A] text-white pt-14">
      <ChefHeader title="CONTRATS" />
      {autoFilled && (
        <div style={{ position: 'fixed', top: '80px', right: '20px',
          background: 'rgba(255,107,0,0.15)', border: '0.5px solid #FF6B00',
          borderRadius: '8px', padding: '14px 20px', zIndex: 9999,
          fontFamily: 'DM Sans', fontSize: '13px', color: '#FF6B00',
          boxShadow: '0 4px 20px rgba(0,0,0,0.4)' }}>
          ✅ Données de la réservation importées automatiquement !
        </div>
      )}
      <div className="max-w-5xl mx-auto px-4 py-8">

        {/* ── FORM ── */}
        <div className="bg-[#0d0d0d] border border-[#222] rounded-xl p-6 mb-10">
          <div className="flex items-center justify-between mb-2">
            <h2 className="font-heading text-2xl text-white">
              {editId ? `MODIFIER CONTRAT #${editId}` : 'NOUVEAU CONTRAT'}
            </h2>
            {editId && (
              <button onClick={handleNewContract}
                className="text-xs font-body text-gray-400 border border-[#333] px-3 py-1 rounded hover:text-white hover:border-[#FF6B00] transition-colors">
                + Nouveau contrat
              </button>
            )}
          </div>

          {/* S1 — Infos Contrat */}
          <SectionTitle>1. INFOS CONTRAT</SectionTitle>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Field label="N° Contrat">
              <input
                readOnly
                value={form.contract_number || ''}
                placeholder="Généré après enregistrement"
                style={{
                  width: '100%',
                  background: '#0d0b08',
                  border: `0.5px solid ${form.contract_number && form.contract_number !== 'Auto-généré' ? '#FF6B00' : '#2a2010'}`,
                  color: form.contract_number && form.contract_number !== 'Auto-généré' ? '#FF6B00' : '#5a4a2a',
                  padding: '10px 14px',
                  borderRadius: '4px',
                  fontFamily: 'DM Sans',
                  fontSize: form.contract_number && form.contract_number !== 'Auto-généré' ? '16px' : '12px',
                  fontWeight: form.contract_number && form.contract_number !== 'Auto-généré' ? 'bold' : 'normal',
                }}
              />
            </Field>
            <Field label="Date du contrat" className="col-span-2">
              <input type="datetime-local" className={inputCls} value={form.contract_date} onChange={set('contract_date')} />
            </Field>
            <Field label="Réalisé par">
              <input className={inputCls} value="Domingo Cars Luxury Rent" readOnly />
            </Field>
          </div>

          {/* S2 — Locataire */}
          <SectionTitle>2. LOCATAIRE</SectionTitle>
          <div style={{ marginBottom: '20px', padding: '14px', background: 'rgba(255,107,0,0.05)', border: '0.5px solid rgba(255,107,0,0.2)', borderRadius: '6px' }}>
            <label style={{ color: '#FF6B00', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '1px', display: 'block', marginBottom: '8px' }}>
              🔍 Sélectionner un client existant
            </label>
            <ClientSelector token={getToken()} onSelect={handleClientSelect} />
            <div style={{ color: '#3a2e1e', fontSize: '11px', marginTop: '8px', fontFamily: 'DM Sans' }}>
              Tous les champs seront remplis automatiquement. Vous pouvez les modifier si nécessaire.
            </div>
            {showReservationPicker && clientReservations.length > 0 && (
              <div style={{ marginTop: '12px', padding: '14px', background: 'rgba(255,107,0,0.05)', border: '0.5px solid rgba(255,107,0,0.3)', borderRadius: '6px' }}>
                <div style={{ color: '#FF6B00', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '10px', fontFamily: 'DM Sans' }}>
                  📅 Réservations trouvées — Sélectionnez pour remplir le contrat
                </div>
                {clientReservations.map(resa => (
                  <div key={resa.id} onClick={() => handleReservationSelect(resa)}
                    style={{ padding: '10px 14px', background: '#111', border: '0.5px solid #2a2010', borderRadius: '4px', marginBottom: '8px', cursor: 'pointer', transition: 'border-color 0.2s' }}
                    onMouseEnter={e => e.currentTarget.style.borderColor = '#FF6B00'}
                    onMouseLeave={e => e.currentTarget.style.borderColor = '#2a2010'}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div>
                        <span style={{ color: '#fff', fontSize: '13px', fontFamily: 'DM Sans', fontWeight: 500 }}>{resa.car_name}</span>
                        {resa.matricule && <span style={{ color: '#5a4a2a', fontSize: '11px', marginLeft: '8px' }}>({resa.matricule})</span>}
                      </div>
                      <span style={{ background: resa.status === 'confirmed' ? '#FF6B00' : '#2a2a2a', color: '#fff', padding: '2px 8px', borderRadius: '20px', fontSize: '10px', fontFamily: 'DM Sans' }}>
                        {resa.status}
                      </span>
                    </div>
                    <div style={{ color: '#5a4a2a', fontSize: '11px', fontFamily: 'DM Sans', marginTop: '4px' }}>
                      {resa.start_datetime ? new Date(resa.start_datetime).toLocaleString('fr-FR') : resa.start_date}
                      {' → '}
                      {resa.end_datetime ? new Date(resa.end_datetime).toLocaleString('fr-FR') : resa.end_date}
                      {resa.nb_jours ? ` — ${resa.nb_jours} jours` : ''}
                      {resa.prix_total ? ` — ${resa.prix_total} MAD` : ''}
                    </div>
                  </div>
                ))}
                <button onClick={() => setShowReservationPicker(false)}
                  style={{ background: 'transparent', border: '0.5px solid #333', color: '#666', padding: '6px 14px', borderRadius: '4px', cursor: 'pointer', fontSize: '11px', fontFamily: 'DM Sans' }}>
                  Ignorer — remplir manuellement
                </button>
              </div>
            )}
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <Field label="Nom & Prénom" required className="md:col-span-2">
              <input required className={inputCls} value={form.client_name} onChange={set('client_name')} placeholder="Mohammed Alami" />
            </Field>
            <Field label="Date de naissance">
              <input type="date" className={inputCls} value={form.client_dob} onChange={set('client_dob')} />
            </Field>
            <Field label="Téléphone" required>
              <input className={inputCls} value={form.client_phone} onChange={set('client_phone')} placeholder="0612345678" />
            </Field>
            <Field label="CIN / Passeport">
              <input className={inputCls} value={form.client_cin} onChange={set('client_cin')} />
            </Field>
            <Field label="Expiration CIN/Passeport">
              <input type="date" className={inputCls} value={form.client_cin_expiry} onChange={set('client_cin_expiry')} />
            </Field>
            <Field label="Adresse complète" className="md:col-span-3">
              <input className={inputCls} value={form.client_address} onChange={set('client_address')} />
            </Field>
            <Field label="N° Permis de conduire">
              <input className={inputCls} value={form.client_permis} onChange={set('client_permis')} />
            </Field>
            <Field label="Expiration Permis">
              <input type="date" className={inputCls} value={form.client_permis_expiry} onChange={set('client_permis_expiry')} />
            </Field>
          </div>

          {/* S3 — 2ème Conducteur */}
          <SectionTitle>3. 2ÈME CONDUCTEUR</SectionTitle>
          <div className="flex items-center gap-3 mb-4">
            <button
              type="button"
              onClick={() => setForm(f => ({ ...f, driver2_enabled: !f.driver2_enabled }))}
              className={`relative w-12 h-6 rounded-full transition-colors ${form.driver2_enabled ? 'bg-[#FF6B00]' : 'bg-[#333]'}`}>
              <span className={`absolute top-0.5 w-5 h-5 bg-white rounded-full transition-all duration-200 ${form.driver2_enabled ? 'left-6.5' : 'left-0.5'}`}
                style={{ left: form.driver2_enabled ? 26 : 2 }} />
            </button>
            <span className="font-body text-sm text-gray-400">
              {form.driver2_enabled ? 'Activé' : 'Désactivé'}
            </span>
          </div>
          {form.driver2_enabled && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <div className="md:col-span-3 mb-2">
                <ClientSelector
                  token={getToken()}
                  placeholder="🔍 Rechercher le 2ème conducteur..."
                  onSelect={(client) => {
                    setForm(prev => ({
                      ...prev,
                      driver2_name: client.nom_prenom,
                      driver2_dob: client.date_naissance || '',
                      driver2_phone: client.telephone || '',
                      driver2_cin: client.cin_passport || '',
                      driver2_cin_expiry: client.cin_passport_expiry || '',
                      driver2_address: client.adresse || '',
                      driver2_permis: client.permis || '',
                      driver2_permis_expiry: client.permis_expiry || '',
                    }));
                  }}
                />
              </div>
              <Field label="Nom & Prénom" className="md:col-span-2">
                <input className={inputCls} value={form.driver2_name} onChange={set('driver2_name')} />
              </Field>
              <Field label="Date de naissance">
                <input type="date" className={inputCls} value={form.driver2_dob} onChange={set('driver2_dob')} />
              </Field>
              <Field label="Téléphone">
                <input className={inputCls} value={form.driver2_phone} onChange={set('driver2_phone')} />
              </Field>
              <Field label="CIN / Passeport">
                <input className={inputCls} value={form.driver2_cin} onChange={set('driver2_cin')} />
              </Field>
              <Field label="Expiration CIN/Passeport">
                <input type="date" className={inputCls} value={form.driver2_cin_expiry} onChange={set('driver2_cin_expiry')} />
              </Field>
              <Field label="Adresse" className="md:col-span-2">
                <input className={inputCls} value={form.driver2_address} onChange={set('driver2_address')} />
              </Field>
              <Field label="N° Permis">
                <input className={inputCls} value={form.driver2_permis} onChange={set('driver2_permis')} />
              </Field>
              <Field label="Expiration Permis">
                <input type="date" className={inputCls} value={form.driver2_permis_expiry} onChange={set('driver2_permis_expiry')} />
              </Field>
            </div>
          )}

          {/* S4 — Véhicule */}
          <SectionTitle>4. VÉHICULE</SectionTitle>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Field label="Marque">
              <input className={inputCls} value={form.brand} onChange={set('brand')} placeholder="Dacia" />
            </Field>
            <Field label="Voiture (DB)">
              <select className={selectCls} value={form.car_id} onChange={set('car_id')}>
                <option value="">– Sélectionner –</option>
                {cars.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </Field>
            <Field label="Modèle">
              <input className={inputCls} value={form.model} onChange={set('model')} placeholder="Logan" />
            </Field>
            <Field label="Catégorie">
              <select className={selectCls} value={form.category} onChange={set('category')}>
                {CATEGORIES.map(c => <option key={c}>{c}</option>)}
              </select>
            </Field>
            <Field label="N° Matricule" className="md:col-span-2">
              <input className={inputCls} value={form.matricule} onChange={set('matricule')} placeholder="WW-894-205" />
            </Field>
          </div>

          {/* S5 — Frais */}
          <SectionTitle>5. FRAIS DE LOCATION</SectionTitle>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            <Field label="Nb. de jours">
              <input type="number" className={inputCls} value={form.nb_days} onChange={set('nb_days')} />
            </Field>
            <Field label="Prix / jour (DHS)">
              <input type="number" className={inputCls} value={form.price_per_day} onChange={set('price_per_day')} />
            </Field>
            <Field label="Total DHS">
              <input className={inputCls + ' bg-[#111] text-[#FF6B00] font-semibold'} value={form.total} readOnly />
            </Field>
            <Field label="Avance DHS">
              <input type="number" className={inputCls} value={form.avance} onChange={set('avance')} />
            </Field>
            <Field label="Reste DHS">
              <input className={inputCls + ' bg-[#111] text-yellow-400 font-semibold'} value={form.reste} readOnly />
            </Field>
          </div>

          {/* S6 — Départ */}
          <SectionTitle>6. DÉPART</SectionTitle>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Field label="Date / Heure départ" className="md:col-span-2">
              <input type="datetime-local" className={inputCls} value={form.depart_datetime}
                min={new Date().toISOString().slice(0,16)}
                onChange={set('depart_datetime')} />
            </Field>
            <Field label="Kilométrage départ">
              <input type="number" className={inputCls} value={form.depart_km} onChange={set('depart_km')} placeholder="12000" />
            </Field>
            <Field label="Carburant départ">
              <select className={selectCls} value={form.depart_fuel} onChange={set('depart_fuel')}>
                {FUEL_OPTIONS.map(f => <option key={f}>{f}</option>)}
              </select>
            </Field>
            <Field label="Inspection" className="md:col-span-4">
              <input className={inputCls} value={form.depart_inspection} onChange={set('depart_inspection')} />
            </Field>
          </div>

          {/* S7 — Retour */}
          <SectionTitle>7. RETOUR</SectionTitle>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Field label="Date / Heure prévu" className="md:col-span-2">
              <input type="datetime-local" className={inputCls} value={form.retour_prevu}
                min={form.depart_datetime || new Date().toISOString().slice(0,16)}
                onChange={set('retour_prevu')} />
            </Field>
            <Field label="Date / Heure effectif" className="md:col-span-2">
              <input type="datetime-local" className={inputCls} value={form.retour_effectif}
                min={form.depart_datetime || new Date().toISOString().slice(0,16)}
                onChange={set('retour_effectif')} />
            </Field>
            <Field label="Kilométrage retour">
              <input type="number" className={inputCls} value={form.retour_km} onChange={set('retour_km')} />
            </Field>
            <Field label="Carburant retour">
              <select className={selectCls} value={form.retour_fuel} onChange={set('retour_fuel')}>
                {FUEL_OPTIONS.map(f => <option key={f}>{f}</option>)}
              </select>
            </Field>
          </div>

          {/* Actions */}
          {saveMsg && (
            <div className={`mt-4 text-sm font-body px-4 py-3 rounded border ${
              saveMsg.startsWith('✅')
                ? 'text-green-400 bg-green-400/10 border-green-400/30'
                : 'text-red-400 bg-red-400/10 border-red-400/30'
            }`}>{saveMsg}</div>
          )}

          <div className="flex flex-wrap gap-3 mt-6">
            <button onClick={() => previewContractPDF(form)}
              className="flex items-center gap-2 px-5 py-2.5 bg-[#1a1a1a] border border-[#333] text-sm font-body rounded hover:border-[#FF6B00] hover:text-[#FF6B00] transition-colors">
              👁 Aperçu PDF
            </button>
            <button onClick={async () => { await downloadContractPDF(form); }}
              className="flex items-center gap-2 px-5 py-2.5 bg-[#1a1a1a] border border-[#333] text-sm font-body rounded hover:border-[#FF6B00] hover:text-[#FF6B00] transition-colors">
              📄 Télécharger PDF
            </button>
            <button onClick={handleSave} disabled={saving}
              className="flex items-center gap-2 px-6 py-2.5 bg-[#FF6B00] text-white text-sm font-body font-semibold rounded hover:bg-orange-500 transition-colors disabled:opacity-50 ml-auto">
              {saving ? 'Enregistrement...' : editId ? '💾 Mettre à jour' : '💾 Enregistrer'}
            </button>
          </div>

          {/* EMAIL SENDING SECTION */}
          <div style={{ marginTop: '24px', padding: '20px', background: 'rgba(255,107,0,0.03)', border: '0.5px solid rgba(255,107,0,0.2)', borderRadius: '8px' }}>
            <div style={{ color: '#FF6B00', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '2px', marginBottom: '14px', fontFamily: 'DM Sans', display: 'flex', alignItems: 'center', gap: '8px' }}>
              📧 Envoyer le contrat par email
            </div>

            {emailList.map((email, index) => (
              <div key={index} style={{ display: 'flex', gap: '8px', marginBottom: '8px' }}>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => { const n = [...emailList]; n[index] = e.target.value; setEmailList(n); }}
                  placeholder={`Email ${index + 1} (ex: client@email.com)`}
                  style={{ flex: 1, background: '#0d0b08', border: '0.5px solid #2a2010', color: '#c9a87c', padding: '10px 14px', borderRadius: '4px', fontFamily: 'DM Sans', fontSize: '13px', outline: 'none' }}
                />
                {emailList.length > 1 && (
                  <button onClick={() => setEmailList(emailList.filter((_, i) => i !== index))}
                    style={{ background: 'transparent', border: '0.5px solid #3a1a1a', color: '#e24b4a', padding: '0 12px', borderRadius: '4px', cursor: 'pointer', fontSize: '16px' }}>
                    ×
                  </button>
                )}
              </div>
            ))}

            {emailList.length < 4 && (
              <button onClick={() => setEmailList([...emailList, ''])}
                style={{ background: 'transparent', border: '0.5px dashed #2a2010', color: '#5a4a2a', padding: '8px 16px', borderRadius: '4px', cursor: 'pointer', fontSize: '12px', fontFamily: 'DM Sans', width: '100%', marginBottom: '14px' }}>
                + Ajouter un email
              </button>
            )}

            <button onClick={handleSendEmail} disabled={sendingEmail || emailList.every(e => !e)}
              style={{ background: sendingEmail ? '#333' : '#FF6B00', color: '#fff', border: 'none', padding: '12px 24px', borderRadius: '4px', cursor: sendingEmail ? 'not-allowed' : 'pointer', fontFamily: 'DM Sans', fontSize: '13px', letterSpacing: '1px', width: '100%', transition: 'background 0.2s' }}>
              {sendingEmail ? '⏳ Envoi en cours...' : '📧 Envoyer le contrat'}
            </button>

            {emailSent && (
              <div style={{ marginTop: '10px', padding: '10px 14px', background: 'rgba(76,175,80,0.1)', border: '0.5px solid #4CAF50', borderRadius: '4px', color: '#4CAF50', fontSize: '12px', fontFamily: 'DM Sans', textAlign: 'center' }}>
                ✅ Contrat envoyé avec succès !
              </div>
            )}
          </div>
        </div>

        {/* ── CONTRACT LIST ── */}
        <div>
          <h2 className="font-heading text-2xl mb-4">CONTRATS ENREGISTRÉS <span className="text-gray-500 text-lg">({contracts.length})</span></h2>
          {contracts.length === 0 ? (
            <p className="text-gray-500 font-body text-sm">Aucun contrat enregistré.</p>
          ) : (
            <div className="overflow-x-auto rounded-lg border border-[#222]">
              <table className="w-full">
                <thead className="bg-[#111] border-b border-[#222]">
                  <tr>
                    {['N° Contrat','Date','Client','Voiture','Total','Actions'].map(h => (
                      <th key={h} className="text-left text-xs text-gray-400 font-body uppercase tracking-wider px-4 py-3">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {contracts.map(c => (
                    <tr key={c.id} className={`border-b border-[#1a1a1a] hover:bg-[#111] transition-colors ${editId === c.id ? 'bg-[#FF6B00]/5 border-l-2 border-l-[#FF6B00]' : ''}`}>
                      <td className="px-4 py-3 font-body text-sm font-medium text-[#FF6B00]">{c.contract_number}</td>
                      <td className="px-4 py-3 font-body text-xs text-gray-400">{c.contract_date?.substring(0, 10)}</td>
                      <td className="px-4 py-3 font-body text-sm">{c.client_name}</td>
                      <td className="px-4 py-3 font-body text-sm text-gray-400">{c.car_name || c.model}</td>
                      <td className="px-4 py-3 font-body text-sm">{c.total ? `${c.total} DHS` : '–'}</td>
                      <td className="px-4 py-3">
                        <div className="flex gap-1.5">
                          <button onClick={() => handleEdit(c.id)}
                            className="text-xs font-body px-2 py-1 bg-[#1a1a1a] border border-[#333] rounded hover:border-[#FF6B00] hover:text-[#FF6B00] transition-colors">
                            {editId === c.id ? '✎ Édition' : '✎ Modifier'}
                          </button>
                          <button onClick={async () => { await downloadContractPDF(c); }}
                            className="text-xs font-body px-2 py-1 bg-[#1a1a1a] border border-[#333] rounded hover:border-[#FF6B00] hover:text-[#FF6B00] transition-colors">
                            📄 PDF
                          </button>
                          <button onClick={() => handleDelete(c.id)}
                            className="text-xs font-body px-2 py-1 bg-red-900/20 border border-red-800/40 text-red-400 rounded hover:bg-red-900/40 transition-colors">
                            🗑
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

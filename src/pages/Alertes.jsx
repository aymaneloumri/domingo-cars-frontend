import { useState, useEffect } from 'react';
import ChefHeader from '../components/ChefHeader';
import { API_BASE } from '../utils/config';
import { getToken } from '../utils/auth';

const TYPES = [
  'Assurance', 'Visite technique', 'Permis de conduire',
  'CIN / Passeport', 'Vignette', 'Contrat', 'Autre',
];

const getDaysLeft = (endDate) => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const end = new Date(endDate);
  end.setHours(0, 0, 0, 0);
  return Math.ceil((end - today) / (1000 * 60 * 60 * 24));
};

const getUrgencyStyle = (daysLeft, status) => {
  if (status === 'resolved') return { bg: 'rgba(76,175,80,0.1)', border: 'rgba(76,175,80,0.3)', badge: '#4CAF50', badgeText: '✅ Résolue', icon: '✅' };
  if (daysLeft < 0) return { bg: 'rgba(100,0,0,0.2)', border: '#5a0000', badge: '#e24b4a', badgeText: '❌ Expirée', icon: '❌' };
  if (daysLeft <= 2) return { bg: 'rgba(226,75,74,0.1)', border: 'rgba(226,75,74,0.4)', badge: '#e24b4a', badgeText: `🚨 ${daysLeft}j restants`, icon: '🚨' };
  if (daysLeft <= 5) return { bg: 'rgba(255,107,0,0.08)', border: 'rgba(255,107,0,0.4)', badge: '#FF6B00', badgeText: `⚠️ ${daysLeft}j restants`, icon: '⚠️' };
  if (daysLeft <= 15) return { bg: 'rgba(255,193,7,0.05)', border: 'rgba(255,193,7,0.3)', badge: '#FFC107', badgeText: `🔔 ${daysLeft}j restants`, icon: '🔔' };
  return { bg: 'rgba(255,255,255,0.02)', border: '#2a2010', badge: '#4CAF50', badgeText: `🟢 ${daysLeft}j restants`, icon: '🟢' };
};

export default function Alertes() {
  const token = getToken();

  const [alerts, setAlerts] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [editAlert, setEditAlert] = useState(null);
  const [resolveModal, setResolveModal] = useState(null);
  const [resolveNote, setResolveNote] = useState('');
  const [filter, setFilter] = useState('active');
  const [form, setForm] = useState({ title: '', type: 'Assurance', end_date: '', notes: '' });

  const fetchAlerts = async () => {
    try {
      const res = await fetch(`${API_BASE}/api/alerts`, { headers: { 'x-admin-token': token } });
      const data = await res.json();
      setAlerts(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => { fetchAlerts(); }, []);

  const handleSave = async () => {
    if (!form.title || !form.end_date) { alert('Titre et date de fin sont obligatoires'); return; }
    try {
      const url = editAlert ? `${API_BASE}/api/alerts/${editAlert.id}` : `${API_BASE}/api/alerts`;
      const method = editAlert ? 'PUT' : 'POST';
      await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json', 'x-admin-token': token },
        body: JSON.stringify(form),
      });
      setShowForm(false);
      setEditAlert(null);
      setForm({ title: '', type: 'Assurance', end_date: '', notes: '' });
      fetchAlerts();
    } catch (err) { console.error(err); }
  };

  const handleResolve = async () => {
    if (!resolveModal) return;
    try {
      await fetch(`${API_BASE}/api/alerts/${resolveModal.id}/resolve`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'x-admin-token': token },
        body: JSON.stringify({ resolved_note: resolveNote }),
      });
      setResolveModal(null);
      setResolveNote('');
      fetchAlerts();
    } catch (err) { console.error(err); }
  };

  const handleReactivate = async (id) => {
    try {
      await fetch(`${API_BASE}/api/alerts/${id}/reactivate`, { method: 'PUT', headers: { 'x-admin-token': token } });
      fetchAlerts();
    } catch (err) { console.error(err); }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Supprimer cette alerte ?')) return;
    try {
      await fetch(`${API_BASE}/api/alerts/${id}`, { method: 'DELETE', headers: { 'x-admin-token': token } });
      fetchAlerts();
    } catch (err) { console.error(err); }
  };

  const handleEdit = (alert) => {
    setEditAlert(alert);
    setForm({ title: alert.title, type: alert.type, end_date: alert.end_date, notes: alert.notes || '' });
    setShowForm(true);
  };

  const filteredAlerts = alerts.filter(a => {
    if (filter === 'active') return a.status === 'active';
    if (filter === 'resolved') return a.status === 'resolved';
    return true;
  });

  const urgentCount = alerts.filter(a => a.status === 'active' && getDaysLeft(a.end_date) <= 5).length;

  const inputStyle = {
    width: '100%', background: '#0d0b08', border: '0.5px solid #2a2010',
    color: '#c9a87c', padding: '10px 14px', borderRadius: '4px',
    fontFamily: 'DM Sans', fontSize: '13px', boxSizing: 'border-box', outline: 'none',
  };
  const labelStyle = {
    color: '#5a4a2a', fontSize: '11px', textTransform: 'uppercase',
    letterSpacing: '1px', display: 'block', marginBottom: '6px', fontFamily: 'DM Sans',
  };

  return (
    <div style={{ minHeight: '100vh', background: '#0a0a0a', color: '#fff' }}>
      <ChefHeader title="ALERTES & ÉCHÉANCES" />

      <div style={{ maxWidth: '900px', margin: '0 auto', padding: '80px 20px 40px' }}>

        {/* Stats */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px', marginBottom: '24px' }}>
          {[
            { label: 'Alertes actives', value: alerts.filter(a => a.status === 'active').length, color: '#fff' },
            { label: 'Urgentes (≤5j)', value: urgentCount, color: urgentCount > 0 ? '#e24b4a' : '#4CAF50' },
            { label: 'Résolues', value: alerts.filter(a => a.status === 'resolved').length, color: '#4CAF50' },
          ].map((stat, i) => (
            <div key={i} style={{ background: '#111', border: '0.5px solid #2a2010', borderRadius: '8px', padding: '16px', textAlign: 'center' }}>
              <div style={{ fontFamily: '"Bebas Neue", cursive', fontSize: '36px', color: stat.color }}>{stat.value}</div>
              <div style={{ color: '#5a4a2a', fontSize: '10px', textTransform: 'uppercase', letterSpacing: '1px', fontFamily: 'DM Sans' }}>{stat.label}</div>
            </div>
          ))}
        </div>

        {/* Actions bar */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <div style={{ display: 'flex', gap: '8px' }}>
            {[{ key: 'active', label: 'Actives' }, { key: 'resolved', label: 'Résolues' }, { key: 'all', label: 'Toutes' }].map(f => (
              <button key={f.key} onClick={() => setFilter(f.key)}
                style={{ padding: '6px 16px', background: filter === f.key ? '#FF6B00' : 'transparent', border: `0.5px solid ${filter === f.key ? '#FF6B00' : '#333'}`, color: filter === f.key ? '#fff' : '#666', borderRadius: '20px', cursor: 'pointer', fontFamily: 'DM Sans', fontSize: '12px' }}>
                {f.label}
              </button>
            ))}
          </div>
          <button onClick={() => { setShowForm(true); setEditAlert(null); setForm({ title: '', type: 'Assurance', end_date: '', notes: '' }); }}
            style={{ background: '#FF6B00', color: '#fff', border: 'none', padding: '10px 20px', borderRadius: '4px', cursor: 'pointer', fontFamily: 'DM Sans', fontSize: '12px', letterSpacing: '1px' }}>
            + Nouvelle Alerte
          </button>
        </div>

        {/* Add/Edit Form */}
        {showForm && (
          <div style={{ background: '#111', border: '0.5px solid rgba(255,107,0,0.3)', borderRadius: '8px', padding: '24px', marginBottom: '24px' }}>
            <div style={{ color: '#FF6B00', fontSize: '12px', textTransform: 'uppercase', letterSpacing: '2px', marginBottom: '20px', fontFamily: 'DM Sans' }}>
              {editAlert ? "✏️ Modifier l'alerte" : '+ Nouvelle Alerte'}
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
              <div>
                <label style={labelStyle}>Titre / Tâche *</label>
                <input value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} placeholder="Ex: Assurance Dacia Logan #1" style={inputStyle} />
              </div>
              <div>
                <label style={labelStyle}>Type</label>
                <select value={form.type} onChange={e => setForm({ ...form, type: e.target.value })} style={inputStyle}>
                  {TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>
            </div>
            <div style={{ marginBottom: '16px' }}>
              <label style={labelStyle}>Date de fin / Échéance *</label>
              <input type="date" value={form.end_date} onChange={e => setForm({ ...form, end_date: e.target.value })} style={{ ...inputStyle, width: '50%' }} />
            </div>
            <div style={{ marginBottom: '20px' }}>
              <label style={labelStyle}>Notes</label>
              <textarea value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} placeholder="Informations complémentaires..." rows={3} style={{ ...inputStyle, resize: 'vertical' }} />
            </div>
            <div style={{ display: 'flex', gap: '10px' }}>
              <button onClick={handleSave} style={{ background: '#FF6B00', color: '#fff', border: 'none', padding: '10px 24px', borderRadius: '4px', cursor: 'pointer', fontFamily: 'DM Sans', fontSize: '12px' }}>
                {editAlert ? 'Mettre à jour' : 'Enregistrer'}
              </button>
              <button onClick={() => { setShowForm(false); setEditAlert(null); }} style={{ background: 'transparent', color: '#666', border: '0.5px solid #333', padding: '10px 24px', borderRadius: '4px', cursor: 'pointer', fontFamily: 'DM Sans', fontSize: '12px' }}>
                Annuler
              </button>
            </div>
          </div>
        )}

        {/* Alerts list */}
        {filteredAlerts.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '60px', color: '#3a2e1e', fontFamily: 'DM Sans' }}>
            Aucune alerte {filter === 'active' ? 'active' : filter === 'resolved' ? 'résolue' : ''}
          </div>
        ) : (
          filteredAlerts.map(alert => {
            const daysLeft = getDaysLeft(alert.end_date);
            const style = getUrgencyStyle(daysLeft, alert.status);
            return (
              <div key={alert.id} style={{ background: style.bg, border: `0.5px solid ${style.border}`, borderRadius: '8px', padding: '16px 20px', marginBottom: '10px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '6px', flexWrap: 'wrap' }}>
                      <span style={{ fontSize: '18px' }}>{style.icon}</span>
                      <span style={{ color: '#fff', fontSize: '15px', fontFamily: 'DM Sans', fontWeight: 500 }}>{alert.title}</span>
                      <span style={{ background: '#1a1508', color: '#FF6B00', padding: '2px 8px', borderRadius: '20px', fontSize: '10px', fontFamily: 'DM Sans' }}>{alert.type}</span>
                      <span style={{ background: style.badge, color: '#fff', padding: '2px 10px', borderRadius: '20px', fontSize: '10px', fontFamily: 'DM Sans', fontWeight: 500 }}>{style.badgeText}</span>
                    </div>
                    <div style={{ color: '#5a4a2a', fontSize: '12px', fontFamily: 'DM Sans', marginLeft: '28px' }}>
                      📅 Échéance: {new Date(alert.end_date).toLocaleDateString('fr-FR')}
                      {alert.notes && ` — ${alert.notes}`}
                    </div>
                    {alert.status === 'resolved' && (
                      <div style={{ color: '#4CAF50', fontSize: '11px', fontFamily: 'DM Sans', marginLeft: '28px', marginTop: '4px' }}>
                        ✅ Résolue le {new Date(alert.resolved_at).toLocaleDateString('fr-FR')}
                        {alert.resolved_note && ` — ${alert.resolved_note}`}
                      </div>
                    )}
                  </div>
                  <div style={{ display: 'flex', gap: '6px', marginLeft: '12px', flexShrink: 0 }}>
                    {alert.status === 'active' && (
                      <>
                        <button onClick={() => { setResolveModal(alert); setResolveNote(''); }}
                          style={{ background: 'rgba(76,175,80,0.15)', border: '0.5px solid #4CAF50', color: '#4CAF50', padding: '6px 12px', borderRadius: '4px', cursor: 'pointer', fontFamily: 'DM Sans', fontSize: '11px', whiteSpace: 'nowrap' }}>
                          ✅ Résoudre
                        </button>
                        <button onClick={() => handleEdit(alert)}
                          style={{ background: 'transparent', border: '0.5px solid #2a2010', color: '#c9a87c', padding: '6px 12px', borderRadius: '4px', cursor: 'pointer', fontFamily: 'DM Sans', fontSize: '11px' }}>
                          ✏️
                        </button>
                      </>
                    )}
                    {alert.status === 'resolved' && (
                      <button onClick={() => handleReactivate(alert.id)}
                        style={{ background: 'transparent', border: '0.5px solid #FF6B00', color: '#FF6B00', padding: '6px 12px', borderRadius: '4px', cursor: 'pointer', fontFamily: 'DM Sans', fontSize: '11px', whiteSpace: 'nowrap' }}>
                        🔄 Réactiver
                      </button>
                    )}
                    <button onClick={() => handleDelete(alert.id)}
                      style={{ background: 'transparent', border: '0.5px solid #3a1a1a', color: '#e24b4a', padding: '6px 10px', borderRadius: '4px', cursor: 'pointer', fontFamily: 'DM Sans', fontSize: '11px' }}>
                      🗑️
                    </button>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Resolve Modal */}
      {resolveModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999 }}>
          <div style={{ background: '#111', border: '0.5px solid rgba(76,175,80,0.4)', borderRadius: '12px', padding: '28px', width: '420px', maxWidth: '90vw' }}>
            <h3 style={{ color: '#4CAF50', fontFamily: 'DM Sans', margin: '0 0 8px' }}>✅ Résoudre l'alerte</h3>
            <p style={{ color: '#666', fontSize: '13px', fontFamily: 'DM Sans', margin: '0 0 20px' }}>"{resolveModal.title}"</p>
            <label style={labelStyle}>Note de résolution (optionnel)</label>
            <textarea value={resolveNote} onChange={e => setResolveNote(e.target.value)} placeholder="Ex: Assurance renouvelée le 04/06/2026" rows={3} style={{ ...inputStyle, marginBottom: '20px', resize: 'vertical' }} />
            <div style={{ display: 'flex', gap: '10px' }}>
              <button onClick={handleResolve} style={{ flex: 1, background: '#4CAF50', color: '#fff', border: 'none', padding: '12px', borderRadius: '4px', cursor: 'pointer', fontFamily: 'DM Sans', fontSize: '13px' }}>
                ✅ Confirmer la résolution
              </button>
              <button onClick={() => setResolveModal(null)} style={{ background: 'transparent', color: '#666', border: '0.5px solid #333', padding: '12px 20px', borderRadius: '4px', cursor: 'pointer', fontFamily: 'DM Sans', fontSize: '13px' }}>
                Annuler
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

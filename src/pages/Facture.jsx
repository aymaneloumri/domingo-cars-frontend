import { useState, useEffect } from 'react';
import ChefHeader from '../components/ChefHeader';
import ClientSelector from '../components/ClientSelector';
import { API_BASE } from '../utils/config';
import { getToken } from '../utils/auth';
const pdfMake = window.pdfMake;

const toBase64FromUrl = (url) => new Promise((resolve, reject) => {
  const img = new Image();
  img.crossOrigin = 'anonymous';
  img.onload = () => {
    const canvas = document.createElement('canvas');
    canvas.width = img.width;
    canvas.height = img.height;
    const ctx = canvas.getContext('2d');
    ctx.drawImage(img, 0, 0);
    resolve(canvas.toDataURL('image/png'));
  };
  img.onerror = reject;
  img.src = url;
});

const formatDate = (str) => {
  if (!str) return '—';
  try { return new Date(str).toLocaleString('fr-FR'); } catch { return str; }
};

const buildInvoiceDocDef = (resa, client, invoiceNumber, invoiceDate, logoBase64) => {
  const prixHT = resa.prix_total || 0;
  const tva = Math.round(prixHT * 0.20 * 100) / 100;
  const ttc = Math.round((prixHT + tva) * 100) / 100;

  const headerColumns = [
    {
      stack: [
        { text: 'DOMINGO CARS', style: 'companyNameMain' },
        { text: 'LUXURY RENT', style: 'companyNameSub' },
      ],
      width: '*',
    },
  ];
  if (logoBase64) {
    headerColumns.push({
      image: logoBase64,
      width: 60,
      height: 60,
      alignment: 'right',
      margin: [0, 5, 0, 0],
    });
  }

  return {
    pageSize: 'A4',
    pageMargins: [40, 40, 40, 80],
    footer: () => ({
      margin: [40, 0, 40, 20],
      stack: [
        { canvas: [{ type: 'line', x1: 0, y1: 0, x2: 515, y2: 0, lineWidth: 2, lineColor: '#FF6B00' }], margin: [0, 0, 0, 8] },
        { text: 'DOMINGO CARS LUXURY RENT — R.C.: 710225 | ICE: 003820019000072 | I.F.: 37601415', style: 'footerLine', alignment: 'center' },
        { text: 'Tél: +212 701 050 809 | www.domingocars.ma | @Domingocarsrent', style: 'footerLine', alignment: 'center' },
        { text: 'SG: IMM 8 MG 3 RDC, LOTISSEMENT JARDIN, Casablanca, Maroc | Domingocarsrent@gmail.com', style: 'footerLine', alignment: 'center' },
      ],
    }),
    content: [
      {
        columns: headerColumns,
        margin: [0, 0, 0, 20],
      },
      { canvas: [{ type: 'line', x1: 0, y1: 0, x2: 515, y2: 0, lineWidth: 2, lineColor: '#FF6B00' }], margin: [0, 0, 0, 16] },
      {
        columns: [
          {
            stack: [
              { text: 'CLIENT', style: 'sectionTitle' },
              { text: client.nom_prenom || '—', style: 'fieldValue' },
              { text: `Tél: ${client.telephone || '—'}`, style: 'fieldInfo' },
              { text: `CIN/Passeport: ${client.cin_passport || '—'}`, style: 'fieldInfo' },
              { text: `Permis: ${client.permis || '—'}`, style: 'fieldInfo' },
              { text: `Adresse: ${client.adresse || '—'}`, style: 'fieldInfo' },
            ],
            width: '*',
          },
          {
            stack: [
              { text: 'VÉHICULE', style: 'sectionTitle' },
              { text: resa.car_name || '—', style: 'fieldValue' },
              { text: `Matricule: ${resa.matricule || '—'}`, style: 'fieldInfo' },
              { text: `Catégorie: ${resa.category || '—'}`, style: 'fieldInfo' },
            ],
            width: '*',
          },
        ],
        margin: [0, 0, 0, 20],
      },
      { canvas: [{ type: 'line', x1: 0, y1: 0, x2: 515, y2: 0, lineWidth: 0.5, lineColor: '#ccc' }], margin: [0, 0, 0, 16] },
      { text: 'DÉTAILS DE LOCATION', style: 'sectionTitle', margin: [0, 0, 0, 10] },
      {
        table: {
          widths: ['*', '*'],
          body: [
            [{ text: 'Date de départ', style: 'tableHeader' }, { text: 'Date de retour', style: 'tableHeader' }],
            [
              { text: formatDate(resa.start_datetime || resa.start_date), style: 'tableCell' },
              { text: formatDate(resa.end_datetime || resa.end_date), style: 'tableCell' },
            ],
          ],
        },
        layout: { fillColor: (i) => i === 0 ? '#FF6B00' : '#f9f9f9', hLineColor: () => '#ddd', vLineColor: () => '#ddd' },
        margin: [0, 0, 0, 16],
      },
      { text: 'DÉTAILS DE FACTURATION', style: 'sectionTitle', margin: [0, 0, 0, 10] },
      {
        table: {
          widths: ['*', 150],
          body: [
            [
              { text: 'Description', style: 'tableHeader' },
              { text: 'Montant', style: 'tableHeader', alignment: 'right' },
            ],
            [
              { text: `Location ${resa.car_name} — ${resa.nb_jours || 0} jour(s) × ${resa.prix_par_jour || 0} MAD/jour`, style: 'tableCell' },
              { text: `${prixHT} MAD`, style: 'tableCell', alignment: 'right' },
            ],
            [
              { text: 'Total HT', style: 'tableCell', color: '#666' },
              { text: `${prixHT} MAD`, style: 'tableCell', alignment: 'right', color: '#333' },
            ],
            [
              { text: 'TVA (20%)', style: 'tableCell', color: '#666' },
              { text: `${tva} MAD`, style: 'tableCell', alignment: 'right', color: '#666' },
            ],
            [
              { text: 'TOTAL À PAYER', style: 'totalLabel' },
              { text: `${ttc} MAD`, style: 'totalAmount' },
            ],
          ],
        },
        layout: {
          fillColor: (i) => i === 0 ? '#FF6B00' : i === 4 ? '#0a0a0a' : i % 2 === 0 ? '#f9f9f9' : '#fff',
          hLineColor: () => '#ddd',
          vLineColor: () => '#ddd',
        },
        margin: [0, 0, 0, 24],
      },
    ],
    styles: {
      companyNameMain: { fontSize: 22, bold: true, color: '#0a0a0a', margin: [0, 0, 0, 0] },
      companyNameSub:  { fontSize: 12, color: '#FF6B00', characterSpacing: 2, margin: [0, 2, 0, 0] },
      invoiceTitle:    { fontSize: 28, bold: true, color: '#FF6B00', margin: [0, 0, 0, 4] },
      invoiceNumber:   { fontSize: 14, bold: true, color: '#333', margin: [0, 0, 0, 4] },
      invoiceInfo:     { fontSize: 10, color: '#666' },
      sectionTitle:    { fontSize: 11, bold: true, color: '#FF6B00' },
      fieldValue:      { fontSize: 13, bold: true, color: '#333', margin: [0, 4, 0, 2] },
      fieldInfo:       { fontSize: 10, color: '#666', margin: [0, 1, 0, 0] },
      tableHeader:     { fontSize: 10, bold: true, color: '#fff', margin: [6, 6, 6, 6] },
      tableCell:       { fontSize: 11, color: '#333', margin: [6, 6, 6, 6] },
      totalLabel:      { fontSize: 12, bold: true, color: '#fff', margin: [6, 8, 6, 8] },
      totalAmount:     { fontSize: 14, bold: true, color: '#FF6B00', margin: [6, 8, 6, 8], alignment: 'right' },
      footerCompany:   { fontSize: 11, bold: true, color: '#FF6B00', margin: [0, 0, 0, 4] },
      footerInfo:      { fontSize: 9, color: '#888', margin: [0, 1, 0, 0] },
      footerLine:      { fontSize: 8, color: '#888', margin: [0, 2, 0, 0] },
    },
    defaultStyle: { font: 'Roboto' },
  };
};

export default function Facture() {
  const token = getToken();

  const [selectedClient, setSelectedClient] = useState(null);
  const [clientReservations, setClientReservations] = useState([]);
  const [selectedResa, setSelectedResa] = useState(null);
  const [invoiceNumber, setInvoiceNumber] = useState('');
  const [invoiceDate, setInvoiceDate] = useState(new Date().toISOString().slice(0, 10));
  const [generating, setGenerating] = useState(false);
  const [saved, setSaved] = useState(false);
  const [allInvoices, setAllInvoices] = useState([]);
  const [invoiceSearch, setInvoiceSearch] = useState('');
  const [loadingInvoices, setLoadingInvoices] = useState(false);

  useEffect(() => {
    fetch(`${API_BASE}/api/contracts/next-invoice-number`, {
      headers: { 'x-admin-token': token },
    })
      .then(r => r.json())
      .then(data => setInvoiceNumber(data.invoice_number || 'FAC-0001'))
      .catch(() => setInvoiceNumber('FAC-0001'));
  }, []);

  const fetchInvoices = async () => {
    setLoadingInvoices(true);
    try {
      const res = await fetch(`${API_BASE}/api/reservations`, {
        headers: { 'x-admin-token': token },
      });
      const data = await res.json();
      const withInvoice = (Array.isArray(data) ? data : [])
        .filter(r => r.invoice_number)
        .sort((a, b) => new Date(b.invoice_date) - new Date(a.invoice_date));
      setAllInvoices(withInvoice);
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingInvoices(false);
    }
  };

  useEffect(() => { fetchInvoices(); }, []);

  const filteredInvoices = allInvoices.filter(inv => {
    if (!invoiceSearch) return true;
    const q = invoiceSearch.toLowerCase();
    return (inv.client_name?.toLowerCase().includes(q)) ||
           (inv.client_phone?.includes(q)) ||
           (inv.invoice_number?.toLowerCase().includes(q));
  });

  const handleClientSelect = async (client) => {
    setSelectedClient(client);
    setSelectedResa(null);
    setSaved(false);
    try {
      const res = await fetch(`${API_BASE}/api/reservations/by-client/${client.id}`, {
        headers: { 'x-admin-token': token },
      });
      const data = await res.json();
      setClientReservations(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error(err);
      setClientReservations([]);
    }
  };

  const handleResaSelect = (resa) => {
    setSelectedResa(resa);
    setSaved(false);
  };

  const loadLogo = async () => {
    try { return await toBase64FromUrl('/logo.jpg'); } catch { return null; }
  };

  const fetchClientById = async (clientId, fallback) => {
    if (!clientId) return fallback;
    try {
      const res = await fetch(`${API_BASE}/api/clients/${clientId}`, {
        headers: { 'x-admin-token': token },
      });
      const data = await res.json();
      return data || fallback;
    } catch { return fallback; }
  };

  const generatePDF = async () => {
    if (!selectedResa || !selectedClient) {
      alert('Veuillez sélectionner un client et une réservation');
      return;
    }
    setGenerating(true);

    const logoBase64 = await loadLogo();

    try {
      await fetch(`${API_BASE}/api/reservations/${selectedResa.id}/invoice`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'x-admin-token': token },
        body: JSON.stringify({ invoice_number: invoiceNumber, invoice_date: invoiceDate }),
      });
      setSaved(true);
      fetchInvoices();
    } catch (err) {
      console.error(err);
    }

    const docDef = buildInvoiceDocDef(selectedResa, selectedClient, invoiceNumber, invoiceDate, logoBase64);
    pdfMake.createPdf(docDef).download(`Facture_${invoiceNumber}_${selectedClient.nom_prenom}.pdf`);
    setGenerating(false);
  };

  const handlePreviewInvoice = async (inv) => {
    const [client, logoBase64] = await Promise.all([
      fetchClientById(inv.client_id, { nom_prenom: inv.client_name, telephone: inv.client_phone }),
      loadLogo(),
    ]);
    const docDef = buildInvoiceDocDef(inv, client, inv.invoice_number, inv.invoice_date, logoBase64);
    pdfMake.createPdf(docDef).open();
  };

  const handleDownloadInvoice = async (inv) => {
    const [client, logoBase64] = await Promise.all([
      fetchClientById(inv.client_id, { nom_prenom: inv.client_name, telephone: inv.client_phone }),
      loadLogo(),
    ]);
    const docDef = buildInvoiceDocDef(inv, client, inv.invoice_number, inv.invoice_date, logoBase64);
    const name = (client.nom_prenom || inv.client_name || '').replace(/\s+/g, '_');
    pdfMake.createPdf(docDef).download(`Facture_${inv.invoice_number}_${name}.pdf`);
  };

  const inputStyle = {
    background: '#0d0b08', border: '0.5px solid #2a2010', color: '#c9a87c',
    padding: '8px 12px', borderRadius: '4px', fontFamily: 'DM Sans', fontSize: '13px',
    width: '100%', outline: 'none',
  };

  return (
    <div style={{ minHeight: '100vh', background: '#0a0a0a', color: '#fff' }}>
      <ChefHeader title="FACTURATION" />

      <div style={{ maxWidth: '800px', margin: '0 auto', padding: '80px 20px 40px' }}>

        {/* Invoice number + date */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '24px', padding: '20px', background: '#111', border: '0.5px solid #2a2010', borderRadius: '8px' }}>
          <div>
            <label style={{ color: '#5a4a2a', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '1px', display: 'block', marginBottom: '6px' }}>N° Facture</label>
            <div style={{ color: '#FF6B00', fontFamily: '"Bebas Neue", cursive', fontSize: '28px' }}>{invoiceNumber || 'FAC-…'}</div>
          </div>
          <div>
            <label style={{ color: '#5a4a2a', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '1px', display: 'block', marginBottom: '6px' }}>Date</label>
            <input type="date" value={invoiceDate} onChange={e => setInvoiceDate(e.target.value)} style={inputStyle} />
          </div>
        </div>

        {/* Step 1 — Client */}
        <div style={{ marginBottom: '24px' }}>
          <label style={{ color: '#FF6B00', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '2px', display: 'block', marginBottom: '10px' }}>
            1. Sélectionner le client
          </label>
          <ClientSelector token={token} onSelect={handleClientSelect} placeholder="🔍 Rechercher un client (nom, CIN, téléphone...)" />
        </div>

        {/* Step 2 — Reservation */}
        {clientReservations.length > 0 && (
          <div style={{ marginBottom: '24px' }}>
            <label style={{ color: '#FF6B00', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '2px', display: 'block', marginBottom: '10px' }}>
              2. Sélectionner la réservation
            </label>
            {clientReservations.map(resa => (
              <div key={resa.id} onClick={() => handleResaSelect(resa)}
                style={{ padding: '14px 16px', background: selectedResa?.id === resa.id ? 'rgba(255,107,0,0.1)' : '#111', border: `0.5px solid ${selectedResa?.id === resa.id ? '#FF6B00' : '#2a2010'}`, borderRadius: '6px', marginBottom: '8px', cursor: 'pointer', transition: 'all 0.2s' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <span style={{ color: '#fff', fontSize: '14px', fontFamily: 'DM Sans', fontWeight: 500 }}>{resa.car_name}</span>
                    {resa.matricule && <span style={{ color: '#5a4a2a', fontSize: '11px', marginLeft: '8px' }}>({resa.matricule})</span>}
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    {resa.invoice_number && (
                      <span style={{ background: '#1a2a1a', color: '#4CAF50', padding: '2px 8px', borderRadius: '20px', fontSize: '10px', fontFamily: 'DM Sans' }}>{resa.invoice_number}</span>
                    )}
                    <span style={{ background: resa.status === 'confirmed' ? '#FF6B00' : '#2a2a2a', color: '#fff', padding: '2px 8px', borderRadius: '20px', fontSize: '10px', fontFamily: 'DM Sans' }}>
                      {resa.status}
                    </span>
                  </div>
                </div>
                <div style={{ color: '#5a4a2a', fontSize: '11px', fontFamily: 'DM Sans', marginTop: '6px' }}>
                  {resa.start_datetime ? new Date(resa.start_datetime).toLocaleString('fr-FR') : resa.start_date}
                  {' → '}
                  {resa.end_datetime ? new Date(resa.end_datetime).toLocaleString('fr-FR') : resa.end_date}
                  {resa.nb_jours ? ` — ${resa.nb_jours} jours` : ''}
                  {resa.prix_total ? ' — ' : ''}
                  {resa.prix_total ? <span style={{ color: '#FF6B00', fontWeight: 500 }}>{resa.prix_total} MAD</span> : null}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Generate button */}
        {selectedResa && selectedClient && (
          <button onClick={generatePDF} disabled={generating}
            style={{ width: '100%', padding: '16px', background: generating ? '#333' : '#FF6B00', color: '#fff', border: 'none', borderRadius: '6px', fontFamily: 'DM Sans', fontSize: '14px', letterSpacing: '2px', cursor: generating ? 'not-allowed' : 'pointer', textTransform: 'uppercase', transition: 'background 0.2s' }}>
            {generating ? '⏳ Génération...' : '🧾 Générer & Télécharger la Facture'}
          </button>
        )}

        {saved && (
          <div style={{ marginTop: '12px', padding: '12px', background: 'rgba(76,175,80,0.1)', border: '0.5px solid #4CAF50', borderRadius: '4px', color: '#4CAF50', fontSize: '13px', textAlign: 'center', fontFamily: 'DM Sans' }}>
            ✅ Facture {invoiceNumber} générée et enregistrée !
          </div>
        )}

        {/* ── Invoice list ── */}
        <div style={{ marginTop: '48px' }}>
          <div style={{ color: '#FF6B00', fontSize: '12px', textTransform: 'uppercase', letterSpacing: '2px', marginBottom: '16px', fontFamily: 'DM Sans' }}>
            📋 Factures générées
          </div>

          <input
            value={invoiceSearch}
            onChange={e => setInvoiceSearch(e.target.value)}
            placeholder="🔍 Rechercher par nom, téléphone ou N° facture..."
            style={{ width: '100%', background: '#0d0b08', border: '0.5px solid #2a2010', color: '#c9a87c', padding: '10px 14px', borderRadius: '4px', fontFamily: 'DM Sans', fontSize: '13px', marginBottom: '16px', boxSizing: 'border-box', outline: 'none' }}
          />

          {loadingInvoices ? (
            <div style={{ textAlign: 'center', padding: '30px', color: '#FF6B00', fontFamily: 'DM Sans' }}>
              ⏳ Chargement...
            </div>
          ) : filteredInvoices.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '30px', color: '#3a2e1e', fontFamily: 'DM Sans' }}>
              Aucune facture trouvée
            </div>
          ) : (
            filteredInvoices.map(inv => (
              <div key={inv.id} style={{ padding: '14px 16px', background: '#111', border: '0.5px solid #2a2010', borderRadius: '6px', marginBottom: '8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
                <div>
                  <div style={{ color: '#FF6B00', fontSize: '13px', fontFamily: '"Bebas Neue", cursive' }}>
                    {inv.invoice_number} — {inv.client_name}
                  </div>
                  <div style={{ color: '#5a4a2a', fontSize: '11px', fontFamily: 'DM Sans', marginTop: '2px' }}>
                    {inv.car_name} — {inv.prix_total} MAD — {inv.invoice_date}
                  </div>
                </div>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button onClick={() => handlePreviewInvoice(inv)}
                    style={{ background: 'transparent', border: '0.5px solid #FF6B00', color: '#FF6B00', padding: '6px 14px', borderRadius: '4px', cursor: 'pointer', fontFamily: 'DM Sans', fontSize: '11px' }}>
                    👁️ Aperçu
                  </button>
                  <button onClick={() => handleDownloadInvoice(inv)}
                    style={{ background: '#FF6B00', border: 'none', color: '#fff', padding: '6px 14px', borderRadius: '4px', cursor: 'pointer', fontFamily: 'DM Sans', fontSize: '11px' }}>
                    ⬇️ PDF
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

      </div>
    </div>
  );
}

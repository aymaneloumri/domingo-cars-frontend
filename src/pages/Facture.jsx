import { useState, useEffect } from 'react';
import ChefHeader from '../components/ChefHeader';
import ClientSelector from '../components/ClientSelector';
import { API_BASE } from '../utils/config';
import { getToken } from '../utils/auth';
const pdfMake = window.pdfMake;

export default function Facture() {
  const token = getToken();

  const [selectedClient, setSelectedClient] = useState(null);
  const [clientReservations, setClientReservations] = useState([]);
  const [selectedResa, setSelectedResa] = useState(null);
  const [invoiceNumber, setInvoiceNumber] = useState('');
  const [invoiceDate, setInvoiceDate] = useState(new Date().toISOString().slice(0, 10));
  const [avance, setAvance] = useState(0);
  const [reste, setReste] = useState(0);
  const [generating, setGenerating] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    fetch(`${API_BASE}/api/contracts/next-invoice-number`, {
      headers: { 'x-admin-token': token },
    })
      .then(r => r.json())
      .then(data => setInvoiceNumber(data.invoice_number || 'FAC-0001'))
      .catch(() => setInvoiceNumber('FAC-0001'));
  }, []);

  useEffect(() => {
    if (selectedResa) {
      const prixHT = selectedResa.prix_total || 0;
      const tva = Math.round(prixHT * 0.20 * 100) / 100;
      const ttc = Math.round((prixHT + tva) * 100) / 100;
      setReste(Math.round((ttc - avance) * 100) / 100);
    }
  }, [avance, selectedResa]);

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
    setAvance(0);
    const prixHT = resa.prix_total || 0;
    const tva = Math.round(prixHT * 0.20 * 100) / 100;
    const ttc = Math.round((prixHT + tva) * 100) / 100;
    setReste(ttc);
    setSaved(false);
  };

  const formatDate = (str) => {
    if (!str) return '—';
    try { return new Date(str).toLocaleString('fr-FR'); } catch { return str; }
  };

  const generatePDF = async () => {
    if (!selectedResa || !selectedClient) {
      alert('Veuillez sélectionner un client et une réservation');
      return;
    }
    setGenerating(true);

    try {
      await fetch(`${API_BASE}/api/reservations/${selectedResa.id}/invoice`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'x-admin-token': token },
        body: JSON.stringify({ invoice_number: invoiceNumber, invoice_date: invoiceDate, avance, reste }),
      });
      setSaved(true);
    } catch (err) {
      console.error(err);
    }

    const docDefinition = {
      pageSize: 'A4',
      pageMargins: [40, 40, 40, 40],
      content: [
        {
          columns: [
            {
              stack: [
                { text: 'FACTURE', style: 'invoiceTitle' },
                { text: `N°: ${invoiceNumber}`, style: 'invoiceNumber' },
                { text: `Date: ${invoiceDate}`, style: 'invoiceInfo' },
              ],
              width: '*',
            },
          ],
          margin: [0, 0, 0, 20],
        },
        { canvas: [{ type: 'line', x1: 0, y1: 0, x2: 515, y2: 0, lineWidth: 2, lineColor: '#FF6B00' }], margin: [0, 0, 0, 16] },
        {
          columns: [
            {
              stack: [
                { text: 'CLIENT', style: 'sectionTitle' },
                { text: selectedClient.nom_prenom || '—', style: 'fieldValue' },
                { text: `Tél: ${selectedClient.telephone || '—'}`, style: 'fieldInfo' },
                { text: `CIN/Passeport: ${selectedClient.cin_passport || '—'}`, style: 'fieldInfo' },
                { text: `Permis: ${selectedClient.permis || '—'}`, style: 'fieldInfo' },
                { text: `Adresse: ${selectedClient.adresse || '—'}`, style: 'fieldInfo' },
              ],
              width: '*',
            },
            {
              stack: [
                { text: 'VÉHICULE', style: 'sectionTitle' },
                { text: selectedResa.car_name || '—', style: 'fieldValue' },
                { text: `Matricule: ${selectedResa.matricule || '—'}`, style: 'fieldInfo' },
                { text: `Catégorie: ${selectedResa.category || '—'}`, style: 'fieldInfo' },
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
                { text: formatDate(selectedResa.start_datetime || selectedResa.start_date), style: 'tableCell' },
                { text: formatDate(selectedResa.end_datetime || selectedResa.end_date), style: 'tableCell' },
              ],
            ],
          },
          layout: { fillColor: (i) => i === 0 ? '#FF6B00' : '#f9f9f9', hLineColor: () => '#ddd', vLineColor: () => '#ddd' },
          margin: [0, 0, 0, 16],
        },
        { text: 'DÉTAILS DE FACTURATION', style: 'sectionTitle', margin: [0, 0, 0, 10] },
        (() => {
          const prixHT = selectedResa.prix_total || 0;
          const tva = Math.round(prixHT * 0.20 * 100) / 100;
          const ttc = Math.round((prixHT + tva) * 100) / 100;
          const resteAPayer = Math.round((ttc - avance) * 100) / 100;
          return {
            table: {
              widths: ['*', 150],
              body: [
                [{ text: 'Description', style: 'tableHeader' }, { text: 'Montant', style: 'tableHeader', alignment: 'right' }],
                [
                  { text: `Location ${selectedResa.car_name} — ${selectedResa.nb_jours || 0} jour(s) × ${selectedResa.prix_par_jour || 0} MAD/jour`, style: 'tableCell' },
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
                  { text: 'Total TTC', style: 'tableCell', bold: true },
                  { text: `${ttc} MAD`, style: 'tableCell', alignment: 'right', bold: true, color: '#333' },
                ],
                [
                  { text: 'Avance versée', style: 'tableCell', color: '#666' },
                  { text: `- ${avance} MAD`, style: 'tableCell', alignment: 'right', color: '#4CAF50' },
                ],
                [
                  { text: 'RESTE À PAYER', style: 'totalLabel' },
                  { text: `${resteAPayer} MAD`, style: 'totalAmount' },
                ],
              ],
            },
            layout: {
              fillColor: (i) => i === 0 ? '#FF6B00' : i === 6 ? '#0a0a0a' : i % 2 === 0 ? '#f9f9f9' : '#fff',
              hLineColor: () => '#ddd',
              vLineColor: () => '#ddd',
            },
            margin: [0, 0, 0, 24],
          };
        })(),
        { canvas: [{ type: 'line', x1: 0, y1: 0, x2: 515, y2: 0, lineWidth: 2, lineColor: '#FF6B00' }], margin: [0, 20, 0, 12] },
        {
          columns: [
            {
              stack: [
                { text: 'DOMINGO CARS LUXURY RENT', style: 'footerCompany' },
                { text: 'R.C.: 710225 | ICE: 003820019000072 | I.F.: 37601415', style: 'footerInfo' },
              ],
              width: '*',
            },
            {
              stack: [
                { text: 'Tél: +212 701 050 809', style: 'footerInfo', alignment: 'right' },
                { text: 'Email: Domingocarsrent@gmail.com', style: 'footerInfo', alignment: 'right' },
                { text: 'Instagram: @Domingocarsrent', style: 'footerInfo', alignment: 'right' },
                { text: 'Casablanca, Maroc', style: 'footerInfo', alignment: 'right' },
              ],
              width: 'auto',
            },
          ],
        },
      ],
      styles: {
        invoiceTitle: { fontSize: 28, bold: true, color: '#FF6B00', margin: [0, 0, 0, 4] },
        invoiceNumber:{ fontSize: 14, bold: true, color: '#333', margin: [0, 0, 0, 4] },
        invoiceInfo:  { fontSize: 10, color: '#666' },
        sectionTitle: { fontSize: 11, bold: true, color: '#FF6B00' },
        fieldValue:   { fontSize: 13, bold: true, color: '#333', margin: [0, 4, 0, 2] },
        fieldInfo:    { fontSize: 10, color: '#666', margin: [0, 1, 0, 0] },
        tableHeader:  { fontSize: 10, bold: true, color: '#fff', margin: [6, 6, 6, 6] },
        tableCell:    { fontSize: 11, color: '#333', margin: [6, 6, 6, 6] },
        totalLabel:   { fontSize: 12, bold: true, color: '#fff', margin: [6, 8, 6, 8] },
        totalAmount:  { fontSize: 14, bold: true, color: '#FF6B00', margin: [6, 8, 6, 8], alignment: 'right' },
        footerCompany: { fontSize: 11, bold: true, color: '#FF6B00', margin: [0, 0, 0, 4] },
        footerInfo:    { fontSize: 9, color: '#888', margin: [0, 1, 0, 0] },
      },
      defaultStyle: { font: 'Roboto' },
    };

    pdfMake.createPdf(docDefinition).download(`Facture_${invoiceNumber}_${selectedClient.nom_prenom}.pdf`);
    setGenerating(false);
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

        {/* Step 3 — Payment */}
        {selectedResa && (
          <div style={{ marginBottom: '24px', padding: '20px', background: '#111', border: '0.5px solid #2a2010', borderRadius: '8px' }}>
            <label style={{ color: '#FF6B00', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '2px', display: 'block', marginBottom: '16px' }}>
              3. Détails paiement
            </label>
            {(() => {
              const prixHT = selectedResa.prix_total || 0;
              const tva = Math.round(prixHT * 0.20 * 100) / 100;
              const ttc = Math.round((prixHT + tva) * 100) / 100;
              return (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '16px' }}>
              <div>
                <label style={{ color: '#5a4a2a', fontSize: '10px', textTransform: 'uppercase', letterSpacing: '1px', display: 'block', marginBottom: '6px' }}>Total</label>
                <div style={{ color: '#FF6B00', fontFamily: '"Bebas Neue", cursive', fontSize: '28px' }}>{prixHT} MAD</div>
                <div style={{ marginTop: '8px' }}>
                  <div style={{ color: '#5a4a2a', fontSize: '10px', fontFamily: 'DM Sans' }}>HT: {prixHT} MAD + TVA 20%: {tva} MAD</div>
                  <div style={{ color: '#fff', fontSize: '12px', fontFamily: 'DM Sans', fontWeight: 500 }}>TTC: {ttc} MAD</div>
                </div>
              </div>
              <div>
                <label style={{ color: '#5a4a2a', fontSize: '10px', textTransform: 'uppercase', letterSpacing: '1px', display: 'block', marginBottom: '6px' }}>Avance versée</label>
                <input type="number" value={avance} onChange={e => setAvance(parseFloat(e.target.value) || 0)} style={inputStyle} />
              </div>
              <div>
                <label style={{ color: '#5a4a2a', fontSize: '10px', textTransform: 'uppercase', letterSpacing: '1px', display: 'block', marginBottom: '6px' }}>Reste à payer</label>
                <div style={{ color: reste > 0 ? '#e24b4a' : '#4CAF50', fontFamily: '"Bebas Neue", cursive', fontSize: '28px' }}>{reste} MAD</div>
              </div>
            </div>
              );
            })()}
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

      </div>
    </div>
  );
}

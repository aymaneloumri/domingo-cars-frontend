import { useState, useEffect } from 'react';
import ChefHeader from '../components/ChefHeader';
import ClientSelector from '../components/ClientSelector';
import Contrat from './Contrat';
import Facture from './Facture';
import { API_BASE } from '../utils/config';
import { getToken } from '../utils/auth';
import html2canvas from 'html2canvas';

const pdfMake = window.pdfMake;

// ── Shared helpers ────────────────────────────────────────────────────────────

const toBase64FromUrl = (url) => new Promise((resolve, reject) => {
  const img = new Image();
  img.crossOrigin = 'anonymous';
  img.onload = () => {
    const canvas = document.createElement('canvas');
    canvas.width = img.width;
    canvas.height = img.height;
    canvas.getContext('2d').drawImage(img, 0, 0);
    resolve(canvas.toDataURL('image/png'));
  };
  img.onerror = reject;
  img.src = url;
});

const loadLogo = async () => {
  try { return await toBase64FromUrl('/logo.jpg'); } catch { return null; }
};

const formatDateFr = (str) => {
  if (!str) return '—';
  const [y, m, d] = String(str).slice(0, 10).split('-');
  return `${d}/${m}/${y}`;
};

// ── Arabic canvas → base64 ────────────────────────────────────────────────────

const generateArabicCanvas = async (data) => {
  const div = document.createElement('div');
  div.style.cssText = [
    'position:fixed', 'top:-9999px', 'left:-9999px',
    'width:650px', 'background:white', 'padding:28px 36px 28px',
    'direction:rtl', 'text-align:right',
    "font-family:'Tahoma','Arial',sans-serif",
    'font-size:14px', 'line-height:1.5', 'color:#000', 'box-sizing:border-box',
  ].join(';');

  div.innerHTML = `
    <div style="text-align:center;font-size:14px;font-weight:bold;margin-bottom:12px;padding-bottom:8px;border-bottom:2px solid #FF6B00;">
      التزام بتحمل مسؤولية سيارة وكل تبعياتها
    </div>
    <p style="margin-bottom:7px;">أنا الموقع أسفله؛</p>
    <p style="margin-bottom:7px;">
      السيد : <strong>${data.client_name}</strong>
      &nbsp;&nbsp;الحامل لبطاقة التعريف الوطنية رقم : <strong>${data.client_cin || '—'}</strong>
      &nbsp;&nbsp;الساكن بـ : <strong>${data.client_address || '—'}</strong>
    </p>
    <p style="margin-bottom:7px;">
      بمقتضى هذا الالتزام، وتحت جميع الضمانات الفعلية والقانونية في أوسع نطاقها ومفهومها العام الجاري بها
      العمل والسارية المفعول والجاري بها حسب قانون الالتزامات والعقود، أشهد وأصرح وألتزم بأني المسؤول
      الوحيد عن السيارة ابتداء من توقيع هذا الالتزام، كما أنني ألتزم بتحمل جميع المسؤوليات القانونية
      والمدنية الخاصة بالسيارة ذات المزايا والأوصاف التالية :
    </p>
    <p style="margin-bottom:7px;">
      مسجلة تحت رقم : <strong>${data.matricule || '—'}</strong>
      &nbsp;&nbsp;العلامة : <strong>${data.brand || '—'}</strong>
      &nbsp;&nbsp;النوع : <strong>${data.model || '—'}</strong>
      &nbsp;&nbsp;الصنف : <strong>${data.category || '—'}</strong>
    </p>
    <p style="margin-bottom:7px;">
      كما أنني المسؤول الوحيد في أداء الرسوم وكل ما يتعلق بها بما في ذلك الحوادث والدعائر ومخالفات
      المرور التي تتعرض لها السيارة السالفة الذكر وأنني المسؤول عنها والمكلف بها ابتداء من تاريخ الامضاء.
    </p>
    <p style="margin-bottom:7px;">
      كما أنني ألتزم بأداء مستحقات وواجبات كراء السيارة عن كل يوم تأخير ناتج عن عدم ارجاع السيارة
      في موعدها المحدد.
    </p>
    <p style="margin-bottom:7px;">
      اشهد بتحمل مسؤولية السيارة المذكورة أعلاه وتحمل مسؤولية سياقتها أمام الادارات العمومية
      والشبه العمومية والسلطات القضائية ابتداء من تاريخ التوقيع على هذا الالتزام.
    </p>
    <div style="margin-top:20px;">
      <p>حرر بتاريخ : <strong>${data.document_date}</strong></p>
      <p style="margin-top:15px;">إمضاء : ......................................................</p>
    </div>
  `;

  document.body.appendChild(div);
  const canvas = await html2canvas(div, {
    scale: 1.3,
    useCORS: true,
    allowTaint: true,
    backgroundColor: '#ffffff',
  });
  document.body.removeChild(div);
  return canvas.toDataURL('image/png');
};

// ── PDF document definition for Prise en charge ───────────────────────────────

const buildPecDocDef = (arabicImageBase64, logoBase64, documentNumber) => {
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
    pageMargins: [40, 30, 40, 70],
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
      { columns: headerColumns, margin: [0, 0, 0, 20] },
      { canvas: [{ type: 'line', x1: 0, y1: 0, x2: 515, y2: 0, lineWidth: 2, lineColor: '#FF6B00' }], margin: [0, 0, 0, 16] },
      { image: arabicImageBase64, width: 500 },
    ],
    styles: {
      companyNameMain: { fontSize: 22, bold: true, color: '#0a0a0a' },
      companyNameSub:  { fontSize: 12, color: '#FF6B00', characterSpacing: 2, margin: [0, 2, 0, 0] },
      footerLine:      { fontSize: 8, color: '#888', margin: [0, 2, 0, 0] },
    },
    defaultStyle: { font: 'Roboto' },
  };
};

// ── Styles ────────────────────────────────────────────────────────────────────

const tabBtnStyle = (active) => ({
  padding: '12px 24px',
  background: 'none',
  border: 'none',
  borderBottom: active ? '2px solid #FF6B00' : '2px solid transparent',
  color: active ? '#FF6B00' : '#5a4a2a',
  fontFamily: 'DM Sans',
  fontSize: '12px',
  letterSpacing: '1.5px',
  textTransform: 'uppercase',
  cursor: 'pointer',
  whiteSpace: 'nowrap',
  transition: 'color 0.2s',
});

const inputSt = {
  background: '#0d0b08', border: '0.5px solid #2a2010', color: '#c9a87c',
  padding: '8px 12px', borderRadius: '4px', fontFamily: 'DM Sans', fontSize: '13px',
  width: '100%', outline: 'none', boxSizing: 'border-box',
};

const labelSt = {
  color: '#5a4a2a', fontSize: '11px', textTransform: 'uppercase',
  letterSpacing: '1px', display: 'block', marginBottom: '6px', fontFamily: 'DM Sans',
};

const TABS = ['Contrats', 'Facturation', 'Prise en charge'];

// ── Main component ────────────────────────────────────────────────────────────

export default function Documents() {
  const token = getToken();
  const [tab, setTab] = useState(0);

  // ── PEC state ──────────────────────────────────────────────────────────────
  const [pecClient, setPecClient] = useState(null);
  const [cars, setCars] = useState([]);
  const [pecCarId, setPecCarId] = useState('');
  const [pecDate, setPecDate] = useState(new Date().toISOString().slice(0, 10));
  const [pecGenerating, setPecGenerating] = useState(false);
  const [pecList, setPecList] = useState([]);
  const [pecSearch, setPecSearch] = useState('');
  const [loadingPec, setLoadingPec] = useState(false);

  useEffect(() => {
    fetch(`${API_BASE}/api/cars`, { headers: { 'x-admin-token': token } })
      .then(r => r.json())
      .then(data => setCars(Array.isArray(data) ? data : []))
      .catch(console.error);
    fetchPecList();
  }, []);

  const fetchPecList = async () => {
    setLoadingPec(true);
    try {
      const res = await fetch(`${API_BASE}/api/prises`, { headers: { 'x-admin-token': token } });
      const data = await res.json();
      setPecList(Array.isArray(data) ? data : []);
    } catch (err) { console.error(err); }
    finally { setLoadingPec(false); }
  };

  const filteredPec = pecList.filter(p => {
    if (!pecSearch) return true;
    const q = pecSearch.toLowerCase();
    return (p.client_name?.toLowerCase().includes(q)) ||
           (p.client_cin?.toLowerCase().includes(q)) ||
           (p.document_number?.toLowerCase().includes(q));
  });

  const selectedCar = cars.find(c => c.id === parseInt(pecCarId));

  // ── Generate new PEC PDF ───────────────────────────────────────────────────
  const generatePec = async () => {
    if (!pecClient) { alert('Sélectionnez un client'); return; }
    if (!selectedCar) { alert('Sélectionnez un véhicule'); return; }
    setPecGenerating(true);

    let docNumber = '';
    try {
      const res = await fetch(`${API_BASE}/api/prises`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-admin-token': token },
        body: JSON.stringify({
          document_date: pecDate,
          client_id: pecClient.id,
          client_name: pecClient.nom_prenom,
          client_cin: pecClient.cin_passport,
          client_address: pecClient.adresse,
          car_id: selectedCar.id,
          matricule: selectedCar.matricule || '',
          brand: selectedCar.name?.split(' ')[0] || '',
          model: selectedCar.name || '',
          category: selectedCar.category || '',
        }),
      });
      const saved = await res.json();
      docNumber = saved.document_number;
      fetchPecList();
    } catch (err) {
      console.error(err);
      setPecGenerating(false);
      return;
    }

    try {
      const arabicImg = await generateArabicCanvas({
        client_name: pecClient.nom_prenom,
        client_cin: pecClient.cin_passport || '',
        client_address: pecClient.adresse || '—',
        matricule: selectedCar.matricule || '—',
        brand: selectedCar.name?.split(' ')[0] || '—',
        model: selectedCar.name || '—',
        category: selectedCar.category || '—',
        document_date: formatDateFr(pecDate),
      });

      const logoBase64 = await loadLogo();
      const docDef = buildPecDocDef(arabicImg, logoBase64, docNumber);
      const fileName = `PriseEnCharge_${docNumber}_${pecClient.nom_prenom.replace(/\s+/g, '_')}.pdf`;
      pdfMake.createPdf(docDef).download(fileName);
    } catch (err) {
      console.error('PDF generation error:', err);
    }

    setPecGenerating(false);
  };

  // ── Re-generate PDF from stored data ──────────────────────────────────────
  const buildPecPdfFromRecord = async (rec) => {
    const arabicImg = await generateArabicCanvas({
      client_name: rec.client_name || '—',
      client_cin: rec.client_cin || '—',
      client_address: rec.client_address || '—',
      matricule: rec.matricule || '—',
      brand: rec.brand || '—',
      model: rec.model || '—',
      category: rec.category || '—',
      document_date: formatDateFr(rec.document_date),
    });
    const logoBase64 = await loadLogo();
    return buildPecDocDef(arabicImg, logoBase64, rec.document_number);
  };

  const handlePecPreview = async (rec) => {
    const docDef = await buildPecPdfFromRecord(rec);
    pdfMake.createPdf(docDef).open();
  };

  const handlePecDownload = async (rec) => {
    const docDef = await buildPecPdfFromRecord(rec);
    const name = (rec.client_name || '').replace(/\s+/g, '_');
    pdfMake.createPdf(docDef).download(`PriseEnCharge_${rec.document_number}_${name}.pdf`);
  };

  const handlePecDelete = async (rec) => {
    if (!window.confirm(`Supprimer ${rec.document_number} — ${rec.client_name} ?`)) return;
    try {
      await fetch(`${API_BASE}/api/prises/${rec.id}`, {
        method: 'DELETE',
        headers: { 'x-admin-token': token },
      });
      fetchPecList();
    } catch (err) { console.error(err); }
  };

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div style={{ minHeight: '100vh', background: '#0a0a0a', color: '#fff' }}>
      <ChefHeader title="DOCUMENTS" />

      {/* Tab bar — sits below fixed header */}
      <div style={{ position: 'sticky', top: 56, zIndex: 10, background: '#0a0a0a', borderBottom: '0.5px solid #2a2010', display: 'flex', overflowX: 'auto', paddingTop: '56px' }}>
        {TABS.map((t, i) => (
          <button key={i} onClick={() => setTab(i)} style={tabBtnStyle(tab === i)}>
            {t}
          </button>
        ))}
      </div>

      {/* ── Contrats tab ── */}
      {tab === 0 && <Contrat embedded />}

      {/* ── Facturation tab ── */}
      {tab === 1 && <Facture embedded />}

      {/* ── Prise en charge tab ── */}
      {tab === 2 && (
        <div style={{ maxWidth: '800px', margin: '0 auto', padding: '32px 20px 60px' }}>

          {/* Form */}
          <div style={{ padding: '20px', background: '#111', border: '0.5px solid #2a2010', borderRadius: '8px', marginBottom: '24px' }}>
            <div style={{ color: '#FF6B00', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '2px', marginBottom: '16px', fontFamily: 'DM Sans' }}>
              Nouveau document
            </div>

            {/* Client selector */}
            <div style={{ marginBottom: '16px' }}>
              <label style={labelSt}>Client *</label>
              <ClientSelector
                token={token}
                onSelect={c => setPecClient(c)}
                placeholder="🔍 Rechercher un client..."
              />
              {pecClient && (
                <div style={{ marginTop: '8px', padding: '8px 12px', background: 'rgba(255,107,0,0.05)', border: '0.5px solid rgba(255,107,0,0.2)', borderRadius: '4px', fontSize: '11px', fontFamily: 'DM Sans', color: '#c9a87c' }}>
                  <span style={{ color: '#FF6B00', fontWeight: 600 }}>{pecClient.nom_prenom}</span>
                  {pecClient.cin_passport && <span style={{ color: '#5a4a2a', marginLeft: '10px' }}>CIN: {pecClient.cin_passport}</span>}
                  {pecClient.adresse && <span style={{ color: '#5a4a2a', marginLeft: '10px' }}>Adresse: {pecClient.adresse}</span>}
                </div>
              )}
            </div>

            {/* Car + date row */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
              <div>
                <label style={labelSt}>Véhicule *</label>
                <select value={pecCarId} onChange={e => setPecCarId(e.target.value)}
                  style={{ ...inputSt, appearance: 'none' }}>
                  <option value="">-- Sélectionner --</option>
                  {cars.map(c => (
                    <option key={c.id} value={c.id}>
                      {c.name}{c.matricule ? ` — ${c.matricule}` : ''}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label style={labelSt}>Date du document</label>
                <input type="date" value={pecDate} onChange={e => setPecDate(e.target.value)} style={inputSt} />
              </div>
            </div>

            {/* Selected car preview */}
            {selectedCar && (
              <div style={{ padding: '8px 12px', background: 'rgba(255,107,0,0.05)', border: '0.5px solid rgba(255,107,0,0.2)', borderRadius: '4px', fontSize: '11px', fontFamily: 'DM Sans', color: '#c9a87c', marginBottom: '16px' }}>
                <span style={{ color: '#FF6B00', fontWeight: 600 }}>{selectedCar.name}</span>
                {selectedCar.matricule && <span style={{ color: '#5a4a2a', marginLeft: '10px' }}>Matricule: {selectedCar.matricule}</span>}
                {selectedCar.category && <span style={{ color: '#5a4a2a', marginLeft: '10px' }}>Catégorie: {selectedCar.category}</span>}
              </div>
            )}

            <button onClick={generatePec} disabled={pecGenerating || !pecClient || !selectedCar}
              style={{ width: '100%', padding: '14px', background: pecGenerating || !pecClient || !selectedCar ? '#333' : '#FF6B00', color: '#fff', border: 'none', borderRadius: '6px', fontFamily: 'DM Sans', fontSize: '13px', letterSpacing: '2px', cursor: pecGenerating || !pecClient || !selectedCar ? 'not-allowed' : 'pointer', textTransform: 'uppercase', transition: 'background 0.2s' }}>
              {pecGenerating ? '⏳ Génération en cours...' : '📄 Générer la Prise en Charge'}
            </button>
          </div>

          {/* List */}
          <div>
            <div style={{ color: '#FF6B00', fontSize: '12px', textTransform: 'uppercase', letterSpacing: '2px', marginBottom: '16px', fontFamily: 'DM Sans' }}>
              📋 Documents générés
            </div>

            <input
              value={pecSearch}
              onChange={e => setPecSearch(e.target.value)}
              placeholder="🔍 Rechercher par nom, CIN ou N° document..."
              style={{ ...inputSt, marginBottom: '16px', padding: '10px 14px' }}
            />

            {loadingPec ? (
              <div style={{ textAlign: 'center', padding: '30px', color: '#FF6B00', fontFamily: 'DM Sans' }}>⏳ Chargement...</div>
            ) : filteredPec.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '30px', color: '#3a2e1e', fontFamily: 'DM Sans' }}>Aucun document trouvé</div>
            ) : (
              filteredPec.map(rec => (
                <div key={rec.id} style={{ padding: '14px 16px', background: '#111', border: '0.5px solid #2a2010', borderRadius: '6px', marginBottom: '8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
                  <div>
                    <div style={{ color: '#FF6B00', fontSize: '13px', fontFamily: '"Bebas Neue", cursive' }}>
                      {rec.document_number} — {rec.client_name}
                    </div>
                    <div style={{ color: '#5a4a2a', fontSize: '11px', fontFamily: 'DM Sans', marginTop: '2px' }}>
                      {rec.matricule || '—'} — {formatDateFr(rec.document_date)}
                      {rec.client_cin && <span style={{ marginLeft: '8px' }}>CIN: {rec.client_cin}</span>}
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <button onClick={() => handlePecPreview(rec)}
                      style={{ background: 'transparent', border: '0.5px solid #FF6B00', color: '#FF6B00', padding: '6px 12px', borderRadius: '4px', cursor: 'pointer', fontFamily: 'DM Sans', fontSize: '11px' }}>
                      👁️ Aperçu
                    </button>
                    <button onClick={() => handlePecDownload(rec)}
                      style={{ background: '#FF6B00', border: 'none', color: '#fff', padding: '6px 12px', borderRadius: '4px', cursor: 'pointer', fontFamily: 'DM Sans', fontSize: '11px' }}>
                      ⬇️ PDF
                    </button>
                    <button onClick={() => handlePecDelete(rec)}
                      style={{ background: 'transparent', border: '0.5px solid #e24b4a', color: '#e24b4a', padding: '6px 12px', borderRadius: '4px', cursor: 'pointer', fontFamily: 'DM Sans', fontSize: '11px' }}>
                      🗑️
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>

        </div>
      )}
    </div>
  );
}

// Uses pdfmake loaded via CDN in index.html (window.pdfMake)

const LOUEUR = {
  raisonSociale: 'Domingo Cars Luxury Rent',
  rc: '710225',
  ice: '003820019000072',
  if_: '37601415',
  tel: '07 01 05 08 09',
  insta: 'Domingocarsrent',
  email: 'Domingocarsrent@gmail.com',
};

async function getLogoDataUrl() {
  try {
    const r = await fetch('/logo.jpg?v=2');
    if (!r.ok) return null;
    const blob = await r.blob();
    return new Promise(resolve => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result);
      reader.readAsDataURL(blob);
    });
  } catch {
    return null;
  }
}

async function getImageDataUrl(url) {
  if (!url) return null;
  try {
    const r = await fetch(url);
    if (!r.ok) return null;
    const blob = await r.blob();
    return new Promise(resolve => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result);
      reader.readAsDataURL(blob);
    });
  } catch {
    return null;
  }
}

// Label: value on a single line — no nested columns, safe in any context
function field(label, value) {
  return {
    text: [
      { text: label + ': ', bold: true, fontSize: 8.5 },
      { text: value || '–', fontSize: 8.5 },
    ],
    margin: [0, 2, 0, 2],
  };
}

function sectionHeader(title) {
  return {
    table: {
      widths: ['*'],
      body: [[{
        text: title,
        fontSize: 9.5, bold: true,
        color: '#FFFFFF', fillColor: '#444444',
        alignment: 'center',
        margin: [0, 4, 0, 4],
      }]],
    },
    layout: 'noBorders',
    margin: [0, 5, 0, 0],
  };
}

const CELL_PAD = [7, 7, 7, 7];
const tLayout = {
  hLineWidth: () => 0.8, vLineWidth: () => 0.8,
  hLineColor: () => '#BBBBBB', vLineColor: () => '#BBBBBB',
};
const tLayoutV0 = {
  hLineWidth: () => 0.8, vLineWidth: (i, node) => (i === 0 || i === node.table.widths.length) ? 0.8 : 0.5,
  hLineColor: () => '#BBBBBB', vLineColor: () => '#BBBBBB',
};

function buildDocDef(d, logo, signatureImg) {
  const fmt = (dt) => dt ? dt.replace('T', ' ') : '–';

  const logoCell = logo
    ? { image: logo, width: 80, alignment: 'center', margin: [0, 4, 0, 4] }
    : {
        stack: [
          { text: 'DOMINGO', bold: true, fontSize: 13, color: '#FF6B00', alignment: 'center' },
          { text: 'CARS RENT', bold: true, fontSize: 10, color: '#FF6B00', alignment: 'center' },
        ],
        margin: [0, 8, 0, 4],
      };

  return {
    pageSize: 'A4',
    pageMargins: [22, 22, 22, 22],
    content: [

      // ━━━ TITRE ━━━
      {
        table: {
          widths: ['*'],
          body: [[{
            text: 'CONTRAT DE LOCATION DE VOITURE',
            fontSize: 14, bold: true, alignment: 'center',
            color: '#FFFFFF', fillColor: '#FF6B00',
            margin: [0, 7, 0, 7],
            characterSpacing: 1,
          }]],
        },
        layout: 'noBorders',
        margin: [0, 0, 0, 5],
      },

      // ━━━ EN-TÊTE 3 COLONNES ━━━
      {
        table: {
          widths: ['36%', '28%', '36%'],
          body: [[
            {
              stack: [
                { text: 'LOUEUR', bold: true, fontSize: 9, color: '#FF6B00', margin: [0, 0, 0, 3] },
                { text: `Raison sociale: ${LOUEUR.raisonSociale}`, fontSize: 8 },
                { text: `R.C.: ${LOUEUR.rc}`, fontSize: 8 },
                { text: `ICE: ${LOUEUR.ice}`, fontSize: 8 },
                { text: `I.F.: ${LOUEUR.if_}`, fontSize: 8 },
                { text: `Tél: ${LOUEUR.tel}`, fontSize: 8 },
                { text: `Instagram: ${LOUEUR.insta}`, fontSize: 8 },
                { text: `Email: ${LOUEUR.email}`, fontSize: 8 },
              ],
              margin: CELL_PAD,
            },
            { ...logoCell },
            {
              stack: [
                { text: 'CONTRAT', bold: true, fontSize: 9, color: '#FF6B00', margin: [0, 0, 0, 4] },
                { text: `N°: ${d.contract_number || '–'}`, fontSize: 9.5, bold: true },
                { text: `Date: ${d.contract_date ? d.contract_date.substring(0, 10) : '–'}`, fontSize: 8.5, margin: [0, 3, 0, 3] },
                { text: 'Réalisé par:', fontSize: 8, bold: true, margin: [0, 3, 0, 1] },
                { text: 'Domingo Cars Luxury Rent', fontSize: 8 },
                { text: 'Agence:', fontSize: 8, bold: true, margin: [0, 3, 0, 1] },
                { text: 'Domingo Cars Luxury Rent', fontSize: 8 },
              ],
              margin: CELL_PAD,
            },
          ]],
        },
        layout: tLayout,
        margin: [0, 0, 0, 0],
      },

      // ━━━ LOCATAIRE / 2ÈME CONDUCTEUR ━━━
      sectionHeader('LOCATAIRE / 2ÈME CONDUCTEUR'),
      {
        table: {
          widths: ['50%', '50%'],
          body: [[
            {
              stack: [
                { text: 'LOCATAIRE', bold: true, fontSize: 9, color: '#FF6B00', alignment: 'center', margin: [0, 0, 0, 3] },
                field('Nom & Prénom', d.client_name),
                field('Date de naissance', d.client_dob),
                field('Téléphone', d.client_phone),
                field('CIN / Passeport', d.client_cin),
                field('Date expiration', d.client_cin_expiry),
                field('Adresse', d.client_address),
                field('N° Permis', d.client_permis),
                field('Expiration permis', d.client_permis_expiry),
              ],
              margin: CELL_PAD,
            },
            {
              stack: [
                { text: '2ÈME CONDUCTEUR', bold: true, fontSize: 9, color: '#FF6B00', alignment: 'center', margin: [0, 0, 0, 3] },
                field('Nom & Prénom', d.driver2_name),
                field('Date de naissance', d.driver2_dob),
                field('Téléphone', d.driver2_phone),
                field('CIN / Passeport', d.driver2_cin),
                field('Date expiration', d.driver2_cin_expiry),
                field('Adresse', d.driver2_address),
                field('N° Permis', d.driver2_permis),
                field('Expiration permis', d.driver2_permis_expiry),
              ],
              margin: CELL_PAD,
            },
          ]],
        },
        layout: tLayout,
        margin: [0, 0, 0, 0],
      },

      // ━━━ VÉHICULE ━━━
      sectionHeader('VÉHICULE'),
      {
        table: {
          widths: ['25%', '25%', '25%', '25%'],
          body: [[
            { stack: [field('Marque', d.brand)], margin: CELL_PAD },
            { stack: [field('Modèle', d.model)], margin: CELL_PAD },
            { stack: [field('Catégorie', d.category)], margin: CELL_PAD },
            { stack: [field('Matricule', d.matricule)], margin: CELL_PAD },
          ]],
        },
        layout: tLayoutV0,
        margin: [0, 0, 0, 0],
      },

      // ━━━ FRAIS DE LOCATION ━━━
      sectionHeader('FRAIS DE LOCATION'),
      {
        table: {
          widths: ['20%', '20%', '20%', '20%', '20%'],
          body: [[
            {
              stack: [
                { text: 'Nb. de jours', bold: true, fontSize: 8, color: '#555' },
                { text: d.nb_days ? `${d.nb_days}` : '–', fontSize: 11, bold: true, color: '#FF6B00', margin: [0, 2, 0, 0] },
              ],
              alignment: 'center', margin: CELL_PAD,
            },
            {
              stack: [
                { text: 'Prix / jour', bold: true, fontSize: 8, color: '#555' },
                { text: d.price_per_day ? `${d.price_per_day} DHS` : '–', fontSize: 11, bold: true, margin: [0, 2, 0, 0] },
              ],
              alignment: 'center', margin: CELL_PAD,
            },
            {
              stack: [
                { text: 'Total à payer', bold: true, fontSize: 8, color: '#555' },
                { text: d.total ? `${d.total} DHS` : '–', fontSize: 11, bold: true, color: '#FF6B00', margin: [0, 2, 0, 0] },
              ],
              alignment: 'center', margin: CELL_PAD,
              fillColor: '#FFF9F5',
            },
            {
              stack: [
                { text: 'Avance versée', bold: true, fontSize: 8, color: '#555' },
                { text: d.avance ? `${d.avance} DHS` : '–', fontSize: 11, bold: true, margin: [0, 2, 0, 0] },
              ],
              alignment: 'center', margin: CELL_PAD,
            },
            {
              stack: [
                { text: 'Reste à payer', bold: true, fontSize: 8, color: '#555' },
                { text: d.reste ? `${d.reste} DHS` : '–', fontSize: 11, bold: true, color: '#333', margin: [0, 2, 0, 0] },
              ],
              alignment: 'center', margin: CELL_PAD,
            },
          ]],
        },
        layout: tLayoutV0,
        margin: [0, 0, 0, 0],
      },

      // ━━━ DÉPART / RETOUR ━━━
      sectionHeader('ÉTAT DU VÉHICULE'),
      {
        table: {
          widths: ['50%', '50%'],
          body: [[
            {
              stack: [
                { text: 'DÉPART', bold: true, fontSize: 9, color: '#FF6B00', alignment: 'center', margin: [0, 0, 0, 3] },
                field('Date / Heure', fmt(d.depart_datetime)),
                field('Kilométrage', d.depart_km ? `${d.depart_km} Km` : '–'),
                field('Inspection', d.depart_inspection || 'Aucun point signalé'),
                field('Carburant', d.depart_fuel || '–'),
              ],
              margin: CELL_PAD,
            },
            {
              stack: [
                { text: 'RETOUR', bold: true, fontSize: 9, color: '#FF6B00', alignment: 'center', margin: [0, 0, 0, 3] },
                field('Date / Heure prévu', fmt(d.retour_prevu)),
                field('Date / Heure effectif', fmt(d.retour_effectif)),
                field('Kilométrage', d.retour_km ? `${d.retour_km} Km` : '–'),
                field('Carburant', d.retour_fuel || '–'),
              ],
              margin: CELL_PAD,
            },
          ]],
        },
        layout: tLayout,
        margin: [0, 0, 0, 0],
      },

      // ━━━ SIGNATURES ━━━
      sectionHeader('SIGNATURES'),
      {
        table: {
          widths: ['33%', '34%', '33%'],
          heights: [70],
          body: [[
            {
              stack: [
                { text: 'Signature Locataire', bold: true, fontSize: 8.5, alignment: 'center' },
                { text: '\n\n_______________________', fontSize: 9, color: '#888', alignment: 'center' },
              ],
              margin: [4, 8, 4, 8],
            },
            {
              stack: [
                { text: 'Signature 2ème conducteur', bold: true, fontSize: 8.5, alignment: 'center' },
                { text: '\n\n_______________________', fontSize: 9, color: '#888', alignment: 'center' },
              ],
              margin: [4, 8, 4, 8],
            },
            {
              stack: [
                { text: 'Signature Loueur', bold: true, fontSize: 8.5, alignment: 'center' },
                signatureImg
                  ? { image: signatureImg, width: 100, alignment: 'center', margin: [0, 6, 0, 0] }
                  : { text: '\n\n_______________________', fontSize: 9, color: '#888', alignment: 'center' },
              ],
              margin: [4, 8, 4, 8],
            },
          ]],
        },
        layout: tLayout,
        margin: [0, 0, 0, 0],
      },

      // ━━━━━━━━━━━━━━━━━━━━━━━━━
      // PAGE 2 — CONDITIONS GÉNÉRALES
      // ━━━━━━━━━━━━━━━━━━━━━━━━━
      { text: '', pageBreak: 'before' },

      {
        table: {
          widths: ['*'],
          body: [[{
            text: 'CONDITIONS GÉNÉRALES DE LOCATION',
            fontSize: 15, bold: true, alignment: 'center',
            color: '#FFFFFF', fillColor: '#FF6B00',
            margin: [0, 10, 0, 10], characterSpacing: 1,
          }]],
        },
        layout: 'noBorders',
        margin: [0, 0, 0, 4],
      },
      { text: 'Contrat de location de voiture', fontSize: 9.5, alignment: 'center', color: '#555', margin: [0, 0, 0, 12] },
      ...buildConditionsGenerales(),
      {
        margin: [0, 16, 0, 0],
        table: {
          widths: ['*'],
          heights: [70],
          body: [[{
            stack: [
              {
                text: "Je soussigné(e), déclare avoir lu, compris et accepté l'ensemble des termes et conditions mentionnés dans le présent contrat de location établi par la société « Domingo Cars Luxury Rent ».",
                fontSize: 9, italics: true, margin: [0, 0, 0, 12],
              },
              { text: 'Signature du locataire :  _________________________________', fontSize: 10 },
            ],
            margin: [10, 10, 10, 10],
          }]],
        },
        layout: tLayout,
      },
    ],
  };
}

function buildConditionsGenerales() {
  const articles = [
    { title: 'Art. 1 - UTILISATION DE LA VOITURE', text: "Le locataire s'engage à ne pas laisser conduire la voiture par d'autres personnes que lui-même ou celles agréées par le loueur et dont il se porte garant, et à utiliser le véhicule que pour ses besoins personnels. Il est interdit de participer à toute compétition, quelle qu'elle soit, et d'utiliser le véhicule à des fins illicites ou des transports de marchandises. Le locataire s'engage à ne pas solliciter directement des documents douaniers. Il est interdit au locataire de surcharger le véhicule loué en transportant un nombre de passagers supérieur à celui porté sur le contrat, sous peine d'être déchu de l'Assurance." },
    { title: 'Art. 2 - ETAT DE LA VOITURE', text: "La voiture est livrée en parfait état de marche et propreté. Les compteurs et leurs prises sont plombés, et les plombs ne pourront être enlevés ou violés sous peine de devoir payer la location sur la base de 0 kilomètres par jour. La voiture sera rendue dans le même état de propreté, à défaut le locataire devra acquitter le montant de ces nettoyages et remises en état. Les 5 pneus sont en bon état sans coupures, l'assure est normale. En cas de détérioration de l'un d'eux pour une cause autre que l'usure normale, le locataire s'engage à le remplacer immédiatement par un pneu de mêmes dimensions et d'usure sensiblement égale, ou d'en payer le montant." },
    { title: 'Art. 3 - ESSENCE ET HUILE', text: "L'essence est à la charge du client. Le locataire doit vérifier en permanence les niveaux de la boite de vitesse et du pont arrière tous les 1000 kilomètres. Il justifiera de ces travaux par des factures correspondantes (qui lui seront remboursées) sous peine d'avoir à payer une indemnité pour usure anormale." },
    { title: 'Art. 4 - ENTRETIEN ET REPARATION', text: "L'usure mécanique normale est à la charge du loueur. Toutes les réparations provenant, soit d'une usure anormale, soit d'une négligence de la part du locataire ou d'une cause accidentelle, seront à sa charge et exécutées par nos soins. Dans le cas où le véhicule serait immobilisé en dehors de la région, les réparations qu'elles soient dues à l'usure normale ou à une cause accidentelle, ne seront exécutées qu'après accord téléphonique du loueur ou par l'Agent régional de la marque du véhicule. Elles devront faire l'objet d'une facture acquittée et très détaillée. Les pièces défectueuses remplacées devront être présentées avec la facture acquittée. En aucun cas et en aucune circonstance, le locataire ne pourra réclamer des dommages et intérêts pour retard de remise de voiture, annulation de location, ou immobilisation due à des réparations nécessitées par l'usure normale. La responsabilité du loueur ne pourra jamais être invoquée en cas d'accidents résultant de vices ou défauts de construction ou de réparations antérieures." },
    { title: 'Art. 6 - ASSURANCE', text: "Le locataire est garanti pour les risques suivants : assurance responsabilité civile illimitée, vol et incendie inclus dans le prix de location. Une assurance complémentaire peut être souscrite au tarif de 35 DHS par jour. L'assurance des personnes transportées peut être souscrite au tarif de 15 DHS par jour. Le locataire est le seul conducteur autorisé du véhicule, sauf stipulation contraire prévue au présent contrat. Il s'engage à ne pas céder ou prêter le véhicule à un tiers non autorisé. Les frais de rapatriement et d'immobilisation du véhicule restent toujours à la charge du locataire.\nEn cas d'accident dont le locataire est reconnu responsable : franchise forfaitaire de 5 000 DHS, majoration de 20% du montant de l'assurance annuelle, et montant d'immobilisation calculé sur la base du tarif journalier. La voiture n'est assurée que pour la durée de la location. Aucune assurance ne couvre un conducteur sans permis valide ou titulaire d'un permis de moins d'un an. Le loueur décline toute responsabilité en cas de fausses informations fournies par le locataire." },
    { title: 'Art. 7 - RAPATRIEMENT DE LA VOITURE', text: "Le locataire s'interdit formellement d'abandonner le véhicule. En cas d'impossibilité matérielle, celui-ci sera rapatrié aux frais et par les soins du locataire, la location restant due jusqu'au retour du véhicule." },
    { title: 'Art. 8 - RESPONSABILITE', text: "Le locataire demeure seul responsable des amendes, contraventions et procès-verbaux établis contre lui." },
  ];

  return articles.map(a => ({
    stack: [
      { text: a.title, bold: true, fontSize: 9, margin: [0, 6, 0, 2], color: '#222' },
      { text: a.text, fontSize: 8.5, lineHeight: 1.5 },
    ],
  }));
}

function getPdfMake() {
  if (typeof window !== 'undefined' && window.pdfMake) return window.pdfMake;
  throw new Error('pdfMake not loaded — vérifiez les scripts CDN dans index.html');
}

export async function previewContractPDF(data, signatureUrl) {
  const pdfMake = getPdfMake();
  const [logo, signatureImg] = await Promise.all([
    getLogoDataUrl(),
    getImageDataUrl(signatureUrl || null),
  ]);
  pdfMake.createPdf(buildDocDef(data, logo, signatureImg)).open();
}

export async function downloadContractPDF(data, signatureUrl) {
  const pdfMake = getPdfMake();
  const [logo, signatureImg] = await Promise.all([
    getLogoDataUrl(),
    getImageDataUrl(signatureUrl || null),
  ]);
  pdfMake.createPdf(buildDocDef(data, logo, signatureImg)).download(`Contrat-${data.contract_number || 'DCR'}.pdf`);
}

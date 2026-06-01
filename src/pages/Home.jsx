import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import LogoCircle from '../components/LogoCircle';
import { imgUrl, API_BASE } from '../utils/config';

const WA = 'https://wa.me/212701050809';
const today = new Date().toISOString().split('T')[0];

// ─── Per-car availability card ───────────────────────────────────────────────
const addOneDay = (d) => {
  if (!d) return '';
  const dt = new Date(d + 'T00:00:00');
  dt.setDate(dt.getDate() + 1);
  return dt.toISOString().split('T')[0];
};

function CarPreviewCard({ car }) {
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate]     = useState('');
  const [status, setStatus]       = useState(null);
  const [checking, setChecking]   = useState(false);
  const [dateError, setDateError] = useState('');

  const check = async () => {
    setDateError('');
    if (!startDate || !endDate) {
      setDateError('Veuillez sélectionner les deux dates');
      return;
    }
    if (new Date(endDate) <= new Date(startDate)) {
      setDateError('La date de retour doit être après la date de départ');
      return;
    }
    setChecking(true);
    setStatus(null);
    try {
      const { data } = await axios.get(`/api/cars/${car.id}/availability`, {
        params: { start: startDate, end: endDate },
      });
      setStatus(data.available);
    } catch { setStatus(null); }
    finally { setChecking(false); }
  };

  const waMsg = encodeURIComponent(
    `Bonjour, je souhaite réserver la ${car.name} du ${startDate} au ${endDate}.`
  );

  const endInvalid = endDate && startDate && new Date(endDate) <= new Date(startDate);

  const inputStyle = {
    background: '#0d0b08',
    border: `0.5px solid ${endInvalid ? '#E24B4A' : '#2a2010'}`,
    color: '#c9a87c', padding: '8px 12px', borderRadius: 4,
    fontFamily: '"DM Sans", sans-serif', fontSize: 12,
    width: '100%', outline: 'none', colorScheme: 'dark', cursor: 'pointer',
  };

  return (
    <div style={{
      background: '#131008',
      border: '0.5px solid rgba(255,107,0,0.15)',
      borderRadius: 8, overflow: 'hidden',
      transition: 'all 0.3s',
    }}
    onMouseEnter={e => {
      e.currentTarget.style.borderColor = '#FF6B00';
      e.currentTarget.style.transform = 'translateY(-4px)';
    }}
    onMouseLeave={e => {
      e.currentTarget.style.borderColor = 'rgba(255,107,0,0.15)';
      e.currentTarget.style.transform = 'translateY(0)';
    }}>
      {/* Image */}
      {car.image_url ? (
        <img src={imgUrl(car.image_url)} alt={car.name}
          style={{ height: 160, width: '100%', objectFit: 'cover', display: 'block' }}
          onError={e => { e.target.style.display = 'none'; }} />
      ) : (
        <div style={{ height: 160, background: '#1a1508', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <span style={{ fontSize: 40, opacity: 0.3 }}>🚗</span>
        </div>
      )}

      {/* Body */}
      <div style={{ padding: 16 }}>
        <div style={{ fontFamily: '"DM Sans", sans-serif', fontSize: 9, color: '#FF6B00', letterSpacing: 2, textTransform: 'uppercase', marginBottom: 6 }}>
          {car.category}
        </div>
        <div style={{ fontFamily: '"Playfair Display", serif', fontSize: 18, color: '#fff', marginBottom: 8 }}>
          {car.name}
        </div>
        <div>
          <span style={{ fontFamily: '"Bebas Neue", cursive', fontSize: 28, color: '#FF6B00' }}>{car.price_per_day}</span>
          <span style={{ fontFamily: '"DM Sans", sans-serif', fontSize: 11, color: '#5a4a2a', marginLeft: 4 }}>/jour</span>
        </div>

        {/* Date pickers */}
        <div style={{ display: 'flex', gap: 6, marginTop: 12 }}>
          <input type="date" value={startDate} min={today}
            onChange={e => { setStartDate(e.target.value); setEndDate(''); setStatus(null); setDateError(''); }}
            style={{ ...inputStyle, border: `0.5px solid ${!startDate && dateError ? '#E24B4A' : '#2a2010'}` }} />
          <input type="date" value={endDate} min={addOneDay(startDate) || today}
            onChange={e => { setEndDate(e.target.value); setStatus(null); setDateError(''); }}
            style={inputStyle} />
        </div>
        {dateError && <div style={{ color: '#E24B4A', fontFamily: '"DM Sans",sans-serif', fontSize: 11, marginTop: 6 }}>{dateError}</div>}

        {/* Check button */}
        <button onClick={check} disabled={checking}
          style={{
            width: '100%', marginTop: 8, padding: 8,
            background: '#1a1008', border: '0.5px solid #FF6B00', color: '#FF6B00',
            fontFamily: '"DM Sans", sans-serif', fontSize: 11, borderRadius: 3,
            cursor: (!startDate || !endDate || checking) ? 'not-allowed' : 'pointer',
            opacity: (!startDate || !endDate || checking) ? 0.5 : 1,
          }}>
          {checking ? 'Vérification…' : 'Vérifier disponibilité'}
        </button>

        {/* Result */}
        {status !== null && (
          <div style={{ marginTop: 8 }}>
            <div style={{ fontFamily: '"DM Sans", sans-serif', fontSize: 12, color: status ? '#4CAF50' : '#E24B4A', marginBottom: status ? 6 : 0 }}>
              {status ? 'Disponible ✅' : 'Indisponible ❌'}
            </div>
            {status && (
              <a href={`${WA}?text=${waMsg}`} target="_blank" rel="noopener noreferrer"
                style={{
                  display: 'block', width: '100%', padding: 8,
                  background: '#25D366', color: '#fff', textAlign: 'center',
                  fontFamily: '"DM Sans", sans-serif', fontSize: 11, borderRadius: 3,
                  textDecoration: 'none',
                }}>
                Réserver via WhatsApp →
              </a>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────
export default function Home() {
  const [cars, setCars]               = useState([]);
  const [announcements, setAnnouncements] = useState([]);
  const fleetRef = useRef(null);

  useEffect(() => {
    fetch(`${API_BASE}/api/cars`)
      .then(r => r.json())
      .then(data => {
        console.log('Cars from API:', data.map(c => c.name));
        setCars(data.slice(0, 4));
      })
      .catch(() => {});
    axios.get(`${API_BASE}/api/announcements`).then(r => setAnnouncements(r.data)).catch(() => {});
  }, []);

  const scrollToFleet = () => fleetRef.current?.scrollIntoView({ behavior: 'smooth' });

  // Corner bracket helper
  const corner = (pos) => {
    const s = { position: 'absolute', width: 24, height: 24, zIndex: 2 };
    if (pos === 'tl') { s.top = 20; s.left = 20; s.borderTop = '2px solid #FF6B00'; s.borderLeft = '2px solid #FF6B00'; }
    if (pos === 'tr') { s.top = 20; s.right = 20; s.borderTop = '2px solid #FF6B00'; s.borderRight = '2px solid #FF6B00'; }
    if (pos === 'bl') { s.bottom = 20; s.left = 20; s.borderBottom = '2px solid #FF6B00'; s.borderLeft = '2px solid #FF6B00'; }
    if (pos === 'br') { s.bottom = 20; s.right = 20; s.borderBottom = '2px solid #FF6B00'; s.borderRight = '2px solid #FF6B00'; }
    return <div key={pos} style={s} />;
  };

  return (
    <div style={{ background: '#0a0806', minHeight: '100vh', fontFamily: '"DM Sans", sans-serif' }}>

      {/* ══════════════ HERO ══════════════ */}
      <section style={{
        position: 'relative', height: '100vh', minHeight: '700px',
        display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center',
        background: '#0a0806', overflow: 'hidden',
        padding: '60px 20px',
      }}>
        {/* Watermark */}
        <div className="hidden md:block" style={{
          position: 'absolute', bottom: -20, left: '50%', transform: 'translateX(-50%)',
          fontFamily: '"Bebas Neue", cursive', fontSize: 220,
          color: 'rgba(255,107,0,0.05)', letterSpacing: 8,
          whiteSpace: 'nowrap', zIndex: 0, userSelect: 'none', pointerEvents: 'none',
          lineHeight: 1,
        }}>
          DOMINGO
        </div>

        {/* Corner brackets */}
        {['tl','tr','bl','br'].map(corner)}

        {/* Inner border */}
        <div style={{
          position: 'absolute', inset: 16,
          border: '1px solid rgba(255,107,0,0.15)',
          borderRadius: 4, pointerEvents: 'none', zIndex: 1,
        }} />

        {/* Radial glow */}
        <div style={{
          position: 'absolute', inset: 0, zIndex: 0, pointerEvents: 'none',
          background: 'radial-gradient(ellipse 60% 50% at 50% 50%, rgba(255,107,0,0.08) 0%, rgba(255,107,0,0.03) 40%, transparent 70%)',
        }} />

        {/* Content */}
        <div style={{ position: 'relative', zIndex: 2, textAlign: 'center', maxWidth: 480, width: '100%' }}>

          {/* Logo */}
          <div style={{ marginBottom: 28, display: 'flex', justifyContent: 'center' }}>
            <LogoCircle size={160} shadow="0 0 60px rgba(255,107,0,0.3), 0 0 120px rgba(255,107,0,0.1)" />
          </div>

          {/* Pre-title */}
          <div style={{ fontFamily: '"DM Sans", sans-serif', fontSize: 11, color: '#FF6B00', letterSpacing: 6, textTransform: 'uppercase', marginBottom: 16 }}>
            Casablanca · Maroc
          </div>

          {/* Main title */}
          <div style={{ fontFamily: '"Playfair Display", serif', fontSize: 'clamp(48px, 8vw, 72px)', fontWeight: 700, lineHeight: 1, marginBottom: 0 }}>
            <span style={{ color: '#ffffff' }}>DOMINGO </span>
            <span style={{ color: '#FF6B00' }}>CARS</span>
          </div>

          {/* Decorative line */}
          <div style={{ width: 80, height: 1, background: '#FF6B00', margin: '20px auto' }} />

          {/* Subtitle */}
          <div style={{ fontFamily: '"DM Sans", sans-serif', fontSize: 13, color: '#5a4a2a', letterSpacing: 6, textTransform: 'uppercase', marginBottom: 36 }}>
            Luxury Cars Rent
          </div>

          {/* Buttons */}
          <div className="flex flex-col sm:flex-row gap-3 justify-center items-center w-full">
            <button onClick={scrollToFleet}
              className="w-full sm:w-auto"
              style={{
                background: '#FF6B00', color: '#fff',
                padding: '14px 36px', borderRadius: 3, border: 'none',
                fontFamily: '"DM Sans", sans-serif', fontSize: 13, letterSpacing: 2,
                cursor: 'pointer',
              }}>
              Voir la flotte
            </button>
            <a href={WA} target="_blank" rel="noopener noreferrer"
              className="w-full sm:w-auto text-center"
              style={{
                background: 'transparent', border: '1px solid #3a2e1e',
                color: '#8a7a5a', padding: '14px 36px', borderRadius: 3,
                fontFamily: '"DM Sans", sans-serif', fontSize: 13, letterSpacing: 2,
                textDecoration: 'none', display: 'block',
              }}>
              Nous contacter
            </a>
          </div>

          {/* Scroll indicator */}
          <div style={{ marginTop: 48 }}>
            <div className="animate-scroll-bounce"
              style={{ color: '#FF6B00', opacity: 0.6, fontSize: 22, cursor: 'pointer' }}
              onClick={scrollToFleet}>
              ↓
            </div>
          </div>
        </div>
      </section>

      {/* ══════════════ ANNOUNCEMENTS ══════════════ */}
      {announcements.length > 0 && (
        <div style={{ background: '#FF6B00', padding: '12px 24px', textAlign: 'center' }}>
          <span style={{ fontFamily: '"DM Sans", sans-serif', fontSize: 13, color: '#fff', fontWeight: 500 }}>
            {announcements.map(a => `${a.title} — ${a.message}`).join(' · ')}
          </span>
        </div>
      )}

      {/* ══════════════ FLEET PREVIEW ══════════════ */}
      <section ref={fleetRef} style={{ background: '#0d0b08', padding: '80px 40px' }}>
        {/* Section header */}
        <div style={{ textAlign: 'center', marginBottom: 48 }}>
          <div style={{ fontFamily: '"DM Sans", sans-serif', fontSize: 10, color: '#FF6B00', letterSpacing: 4, textTransform: 'uppercase', marginBottom: 10 }}>
            Notre Flotte
          </div>
          <div style={{ width: 40, height: 1, background: '#FF6B00', margin: '0 auto 16px' }} />
          <div style={{ fontFamily: '"Playfair Display", serif', fontSize: 'clamp(26px, 5vw, 36px)', color: '#fff' }}>
            Véhicules Disponibles
          </div>
        </div>

        {/* Cars grid */}
        {cars.length === 0 ? (
          <div style={{ textAlign: 'center', color: '#5a4a2a', fontFamily: '"DM Sans", sans-serif', fontSize: 13 }}>
            Chargement…
          </div>
        ) : (
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
            gap: 20, maxWidth: 1100, margin: '0 auto',
          }}>
            {cars.map(car => <CarPreviewCard key={car.id} car={car} />)}
          </div>
        )}

        {/* See all button */}
        <div style={{ textAlign: 'center', marginTop: 40 }}>
          <Link to="/cars" style={{
            border: '1px solid #FF6B00', color: '#FF6B00',
            background: 'transparent', padding: '12px 32px', borderRadius: 3,
            fontFamily: '"DM Sans", sans-serif', fontSize: 12,
            textDecoration: 'none', display: 'inline-block',
          }}>
            Voir toutes les voitures
          </Link>
        </div>
      </section>

      {/* ══════════════ FOOTER ══════════════ */}
      <footer style={{ background: '#080604', borderTop: '1px solid #1a1208', padding: 40 }}>
        <div style={{
          maxWidth: 1100, margin: '0 auto',
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: 40, marginBottom: 32,
        }}>
          {/* Col 1 — Logo + desc */}
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
              <LogoCircle size={60} />
              <div>
                <div style={{ fontFamily: '"Playfair Display", serif', fontSize: 18, color: '#fff' }}>DOMINGO CARS</div>
                <div style={{ fontFamily: '"DM Sans", sans-serif', fontSize: 10, color: '#5a4a2a' }}>Luxury Cars Rent</div>
              </div>
            </div>
            <p style={{ fontFamily: '"DM Sans", sans-serif', fontSize: 12, color: '#3a2e1e', lineHeight: 1.7 }}>
              Votre partenaire de confiance pour la location de voiture à Casablanca.
            </p>
          </div>

          {/* Col 2 — Contact */}
          <div>
            <div style={{ fontFamily: '"DM Sans", sans-serif', fontSize: 11, color: '#FF6B00', textTransform: 'uppercase', letterSpacing: 2, marginBottom: 14 }}>Contact</div>
            {[
              { icon: '📞', text: '+212 701 050 809', href: WA },
              { icon: '📧', text: 'Domingocarsrent@gmail.com', href: 'mailto:Domingocarsrent@gmail.com' },
              { icon: '📸', text: '@Domingocarsrent', href: 'https://instagram.com/Domingocarsrent' },
            ].map(({ icon, text, href }) => (
              <a key={text} href={href} target="_blank" rel="noopener noreferrer"
                style={{ display: 'block', fontFamily: '"DM Sans", sans-serif', fontSize: 12, color: '#5a4a2a', textDecoration: 'none', marginBottom: 8 }}>
                {icon} {text}
              </a>
            ))}
          </div>

          {/* Col 3 — Navigation */}
          <div>
            <div style={{ fontFamily: '"DM Sans", sans-serif', fontSize: 11, color: '#FF6B00', textTransform: 'uppercase', letterSpacing: 2, marginBottom: 14 }}>Navigation</div>
            {[
              { label: 'Accueil', href: '/' },
              { label: 'Flotte', href: '/cars' },
              { label: 'WhatsApp', href: WA },
            ].map(({ label, href }) => (
              <a key={label} href={href}
                style={{ display: 'block', fontFamily: '"DM Sans", sans-serif', fontSize: 12, color: '#5a4a2a', textDecoration: 'none', marginBottom: 8 }}>
                {label}
              </a>
            ))}
          </div>
        </div>

        {/* Bottom bar */}
        <div style={{ borderTop: '1px solid #1a1208', paddingTop: 20, textAlign: 'center' }}>
          <span style={{ fontFamily: '"DM Sans", sans-serif', fontSize: 10, color: '#3a2e1e' }}>
            © {new Date().getFullYear()} Domingo Cars Luxury Rent — Casablanca, Maroc
          </span>
        </div>
      </footer>

      {/* ══════════════ WHATSAPP FAB ══════════════ */}
      <a href={WA} target="_blank" rel="noopener noreferrer"
        className="animate-wa-pulse"
        style={{
          position: 'fixed', bottom: 20, right: 20, zIndex: 999,
          width: 52, height: 52, borderRadius: '50%',
          background: '#25D366', display: 'flex', alignItems: 'center', justifyContent: 'center',
          boxShadow: '0 4px 16px rgba(37,211,102,0.3)',
          textDecoration: 'none',
        }}>
        <svg viewBox="0 0 24 24" style={{ width: 26, height: 26, fill: '#fff' }}>
          <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
        </svg>
      </a>
    </div>
  );
}

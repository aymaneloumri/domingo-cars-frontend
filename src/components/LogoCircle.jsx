import React from 'react';

export default function LogoCircle({ size = 60, shadow = '0 0 20px rgba(255,107,0,0.2)' }) {
  return (
    <div style={{
      width: size, height: size,
      borderRadius: '50%',
      border: '3px solid #FF6B00',
      background: '#fff',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      overflow: 'hidden',
      boxShadow: shadow,
      flexShrink: 0,
    }}>
      <img
        src="/logo.jpg?v=2"
        alt="Domingo Cars Logo"
        style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '50%' }}
      />
    </div>
  );
}

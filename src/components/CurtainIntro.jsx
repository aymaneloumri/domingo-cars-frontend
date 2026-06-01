import React from 'react';

const STYLES = `
  @keyframes openLeft {
    0%   { transform: translateX(0); }
    100% { transform: translateX(-100%); }
  }
  @keyframes openRight {
    0%   { transform: translateX(0); }
    100% { transform: translateX(100%); }
  }
  @keyframes logoFadeOut {
    0%   { opacity: 1; transform: translate(-50%, -50%) scale(1); }
    100% { opacity: 0; transform: translate(-50%, -50%) scale(0.8); }
  }
  .curtain-left {
    animation: openLeft 0.8s cubic-bezier(0.77,0,0.18,1) 0.2s forwards;
  }
  .curtain-right {
    animation: openRight 0.8s cubic-bezier(0.77,0,0.18,1) 0.2s forwards;
  }
  .curtain-logo {
    animation: logoFadeOut 0.3s ease-in 0.1s forwards;
  }
`;

const CURTAIN_BG = `repeating-linear-gradient(
  90deg,
  #FF6B00 0px,
  #CC5500 8px,
  #FF6B00 16px,
  #E05500 24px,
  #FF6B00 32px
)`;

export default function CurtainIntro({ onComplete }) {
  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: STYLES }} />
      <div style={{
        position: 'fixed', inset: 0,
        zIndex: 9999,
        display: 'flex',
        pointerEvents: 'none',
      }}>
        {/* Left curtain */}
        <div className="curtain-left"
          style={{ width: '50vw', height: '100vh', background: CURTAIN_BG }} />

        {/* Logo — fades out at 0.1s, before curtains move at 0.2s */}
        <div style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          zIndex: 10000,
          width: '70px',
          height: '70px',
          minWidth: '70px',
          minHeight: '70px',
          maxWidth: '70px',
          maxHeight: '70px',
          borderRadius: '50%',
          border: '2px solid #FF6B00',
          background: '#fff',
          overflow: 'hidden',
          animation: 'logoFadeOut 0.3s ease-in 0.1s forwards',
        }}>
          <img
            src="/logo.jpg?v=2"
            alt="logo"
            style={{
              width: '70px',
              height: '70px',
              objectFit: 'cover',
              borderRadius: '50%',
              display: 'block',
            }}
          />
        </div>

        {/* Right curtain — fires onComplete when animation ends */}
        <div className="curtain-right"
          style={{ width: '50vw', height: '100vh', background: CURTAIN_BG }}
          onAnimationEnd={onComplete} />
      </div>
    </>
  );
}

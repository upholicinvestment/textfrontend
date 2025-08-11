import React from 'react';
import BUTTON from '../../pages/Intro3D/Button';

const TickerBanner: React.FC = () => {
  return (
    <div
      style={{
        position: 'absolute',
        bottom: '8%',
        width: '100%',
        overflow: 'hidden',
        zIndex: 3,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '1rem',
        background: 'transparent',
        opacity: 0,
        animation: 'fadeIn 2s ease-out 2s forwards',
      }}
    >
      {/* ✅ Bigger Button with Always-Scrolling Text */}
      <div style={{ transform: 'scale(1.5)' }}>
        <BUTTON
          href="/about"
          text="Explore the algo world 🚀"
          marqueeText="Explore the algo world 🚀"
          alwaysScroll
        />
      </div>

      <style>
        {`
          @keyframes fadeIn {
            from { opacity: 0; transform: translateY(20px); }
            to { opacity: 1; transform: translateY(0); }
          }
        `}
      </style>
    </div>
  );
};

export default TickerBanner;

import React from 'react';

export default function CountyLogo({ size = 80, showTagline = true }) {
  const imgSize = size * 0.8;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
      <img
        src="/assets/transnzoia-logo.webp"
        alt="Trans-Nzoia County"
        style={{ width: imgSize * 1.5, height: 'auto', maxHeight: imgSize * 0.75, objectFit: 'contain' }}
        onError={(e) => {
          e.target.style.display = 'none';
        }}
      />
      <div style={{ fontSize: size * 0.13, fontWeight: 700, color: '#004d26', letterSpacing: 2, marginTop: 2, textAlign: 'center' }}>
        TRANS-NZOIA COUNTY
      </div>
      {showTagline && (
        <div style={{ fontSize: size * 0.11, fontStyle: 'italic', color: '#888', letterSpacing: 1, marginTop: 1 }}>
          Unity in Diversity
        </div>
      )}
    </div>
  );
}

import React from 'react';

export default function BrandLogo({ size = 'normal' }) {
  const isLarge = size === 'large';
  const isSmall = size === 'small';

  const imgHeight = isLarge ? '48px' : isSmall ? '24px' : '34px';

  return (
    <div style={{ display: 'inline-flex', alignItems: 'center', userSelect: 'none' }}>
      <img
        src="/spar-savemor-logo.png"
        alt="SPAR SaveMor"
        style={{
          height: imgHeight,
          width: 'auto',
          objectFit: 'contain',
          display: 'block'
        }}
      />
    </div>
  );
}

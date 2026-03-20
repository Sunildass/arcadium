import React from 'react';
import { useTheme } from '../ThemeProvider';

export function ScanlineOverlay() {
  const { theme } = useTheme();

  if (!theme.effects.scanlines) return null;

  return (
    <div 
      className="pointer-events-none fixed inset-0 z-50 opacity-10 mix-blend-overlay"
      style={{
        background: `linear-gradient(
          to bottom,
          rgba(255,255,255,0),
          rgba(255,255,255,0) 50%,
          rgba(0,0,0,0.5) 50%,
          rgba(0,0,0,0.5)
        )`,
        backgroundSize: '100% 4px',
      }}
      aria-hidden="true"
    />
  );
}

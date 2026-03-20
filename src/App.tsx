import React from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { ThemeProvider } from './theme/ThemeProvider';
import { ScanlineOverlay } from './theme/effects/ScanlineOverlay';
import { GrainOverlay } from './theme/effects/GrainOverlay';
import { NeonGlow } from './theme/effects/NeonGlow';
import { Footer } from './components/layout/Footer';

// Known route prefixes that should show the footer
const KNOWN_PREFIXES = ['/', '/boot', '/dashboard', '/game/'];

function isKnownRoute(pathname: string): boolean {
  return KNOWN_PREFIXES.some((prefix) =>
    prefix === '/'
      ? pathname === '/'
      : pathname === prefix || pathname.startsWith(prefix)
  );
}

function AppRoot() {
  const { pathname } = useLocation();
  const showFooter = isKnownRoute(pathname);

  return (
    <div
      className="w-full min-h-screen overflow-x-hidden selection:bg-white/30 selection:text-white transition-colors duration-700 relative flex flex-col"
      style={{
        background: 'var(--bg-gradient)',
        color: 'var(--color-text-primary)',
        fontFamily: 'var(--font-body)'
      }}
    >
      <ScanlineOverlay />
      <GrainOverlay />
      <NeonGlow />
      <div className="flex-1 flex flex-col relative z-10">
        <Outlet />
      </div>
      {showFooter && <Footer />}
    </div>
  );
}

function App() {
  return (
    <ThemeProvider>
       <AppRoot />
    </ThemeProvider>
  );
}

export default App;

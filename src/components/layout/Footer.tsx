import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Heart, Shield, Zap } from 'lucide-react';
import { ArcadiumLogo } from './ArcadiumLogo';

const YEAR = new Date().getFullYear();

const NAV_LINKS = [
  { label: 'Dashboard', path: '/dashboard' },
  { label: 'Board Games', path: '/dashboard/category/board' },
  { label: 'Card Games', path: '/dashboard/category/cards' },
  { label: 'Puzzle', path: '/dashboard/category/puzzle' },
  { label: 'Arcade', path: '/dashboard/category/arcade' },
  { label: 'Relax', path: '/dashboard/category/relax' },
];

const META_LINKS = [
  { label: 'Privacy Policy', path: '#' },
  { label: 'Terms of Use', path: '#' },
  { label: 'Cookie Policy', path: '#' },
];

export function Footer() {
  const navigate = useNavigate();

  return (
    <footer
      className="w-full relative mt-auto border-t"
      style={{
        background: 'linear-gradient(180deg, transparent 0%, rgba(0,0,0,0.6) 100%)',
        borderColor: 'rgba(255,255,255,0.06)',
      }}
    >
      {/* Top glow line */}
      <div
        className="absolute top-0 left-0 right-0 h-px"
        style={{
          background: 'linear-gradient(90deg, transparent 0%, #4f46e5 30%, #818cf8 50%, #4f46e5 70%, transparent 100%)',
          opacity: 0.6,
        }}
      />

      <div className="max-w-7xl mx-auto px-6 py-10">
        {/* Main footer grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-10 mb-8">

          {/* Brand column */}
          <div className="flex flex-col gap-4">
            <ArcadiumLogo forceGlobalTheme />
            <p
              className="text-sm leading-relaxed max-w-xs"
              style={{ color: '#52525b', fontFamily: '"Inter", sans-serif' }}
            >
              A curated collection of browser-based classics — board games,
              card games, puzzles, arcade, and relaxation experiences.
              No installs. No accounts. Just play.
            </p>
            <div className="flex items-center gap-4 mt-1">
              {[
                { icon: <Zap size={14} />, label: 'Fast' },
                { icon: <Shield size={14} />, label: 'Private' },
                { icon: <Heart size={14} />, label: 'Free' },
              ].map(({ icon, label }) => (
                <div
                  key={label}
                  className="flex items-center gap-1.5 text-xs"
                  style={{ color: '#3f3f46' }}
                >
                  <span style={{ color: '#4f46e5' }}>{icon}</span>
                  {label}
                </div>
              ))}
            </div>
          </div>

          {/* Navigation column */}
          <div className="flex flex-col gap-3">
            <h3
              className="text-xs font-bold uppercase tracking-widest mb-1"
              style={{ color: '#4f46e5', fontFamily: 'monospace' }}
            >
              ⬡ &nbsp;Navigate
            </h3>
            {NAV_LINKS.map(({ label, path }) => (
              <button
                key={label}
                onClick={() => navigate(path)}
                className="text-left text-sm transition-colors duration-150 hover:text-indigo-400 w-fit"
                style={{ color: '#52525b', fontFamily: '"Inter", sans-serif' }}
              >
                {label}
              </button>
            ))}
          </div>

          {/* Stats / ambient column */}
          <div className="flex flex-col gap-3">
            <h3
              className="text-xs font-bold uppercase tracking-widest mb-1"
              style={{ color: '#4f46e5', fontFamily: 'monospace' }}
            >
              ⬡ &nbsp;Platform
            </h3>
            {[
              { label: 'Total Games', value: '50+' },
              { label: 'Categories', value: '5' },
              { label: 'Browser-based', value: '100%' },
              { label: 'Account Required', value: 'None' },
              { label: 'Cost', value: 'Free Forever' },
            ].map(({ label, value }) => (
              <div key={label} className="flex items-center justify-between max-w-[220px]">
                <span className="text-xs" style={{ color: '#3f3f46' }}>{label}</span>
                <span
                  className="text-xs font-bold"
                  style={{ color: '#818cf8' }}
                >
                  {value}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Divider */}
        <div
          className="w-full h-px mb-6"
          style={{ background: 'linear-gradient(90deg, transparent, rgba(79,70,229,0.3), transparent)' }}
        />

        {/* Bottom bar */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <div
            className="text-xs"
            style={{ color: '#3f3f46', fontFamily: 'monospace' }}
          >
            © {YEAR} <span style={{ color: '#52525b' }}>Arcadium</span>. All rights reserved.
            &nbsp;·&nbsp; Built for fun, not profit.
          </div>

          {/* Meta links */}
          <div className="flex items-center gap-5">
            {META_LINKS.map(({ label, path }) => (
              <a
                key={label}
                href={path}
                className="text-xs transition-colors hover:text-indigo-400"
                style={{ color: '#3f3f46' }}
                onClick={(e) => e.preventDefault()}
              >
                {label}
              </a>
            ))}
          </div>

          {/* Made with love */}
          <div
            className="flex items-center gap-1.5 text-xs"
            style={{ color: '#3f3f46' }}
          >
            Made with
            <Heart size={10} className="text-rose-500 fill-rose-500 animate-pulse" />
            for gamers
          </div>
        </div>
      </div>
    </footer>
  );
}

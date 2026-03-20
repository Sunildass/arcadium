import React, { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';

// ── Pixel particle type ────────────────────────────────────────────────────────
interface Particle {
  id: number;
  x: number;
  y: number;
  size: number;
  color: string;
  vx: number;
  vy: number;
  opacity: number;
}

const COLORS = ['#4f46e5', '#818cf8', '#f43f5e', '#facc15', '#00ff99', '#ff2fd1'];
const COUNTDOWN_START = 10;

function makeParticle(id: number): Particle {
  return {
    id,
    x: Math.random() * 100,
    y: Math.random() * 100,
    size: Math.random() * 4 + 2,
    color: COLORS[Math.floor(Math.random() * COLORS.length)],
    vx: (Math.random() - 0.5) * 0.06,
    vy: (Math.random() - 0.5) * 0.06,
    opacity: Math.random() * 0.6 + 0.2,
  };
}

// ── Glitch text animation hook ─────────────────────────────────────────────────
const GLITCH_CHARS = '!@#$%^&*<>?/\\|{}[]~`0123456789ABCDEF';
function useGlitch(text: string, interval = 80, duration = 600) {
  const [display, setDisplay] = useState(text);
  useEffect(() => {
    let ticks = 0;
    const maxTicks = duration / interval;
    const timer = setInterval(() => {
      ticks++;
      if (ticks >= maxTicks) {
        clearInterval(timer);
        setDisplay(text);
        return;
      }
      setDisplay(
        text
          .split('')
          .map((ch) =>
            Math.random() < 0.4 && ch !== ' '
              ? GLITCH_CHARS[Math.floor(Math.random() * GLITCH_CHARS.length)]
              : ch
          )
          .join('')
      );
    }, interval);
    return () => clearInterval(timer);
  }, [text, interval, duration]);
  return display;
}

// ── Main component ─────────────────────────────────────────────────────────────
export default function NotFound() {
  const navigate = useNavigate();
  const [particles, setParticles] = useState<Particle[]>(() =>
    Array.from({ length: 30 }, (_, i) => makeParticle(i))
  );
  const [countdown, setCountdown] = useState(COUNTDOWN_START);
  const [coinBlink, setCoinBlink] = useState(true);
  const [glitching, setGlitching] = useState(false);
  const rafRef = useRef<number>(0);
  const lastRef = useRef<number>(0);
  const glitchLabel = useGlitch(glitching ? '404' : '404', 60, glitching ? 800 : 0);

  // Animate particles
  useEffect(() => {
    const animate = (ts: number) => {
      if (ts - lastRef.current > 33) {
        lastRef.current = ts;
        setParticles((prev) =>
          prev.map((p) => {
            let x = p.x + p.vx;
            let y = p.y + p.vy;
            if (x < 0 || x > 100) p.vx *= -1;
            if (y < 0 || y > 100) p.vy *= -1;
            x = Math.max(0, Math.min(100, x));
            y = Math.max(0, Math.min(100, y));
            return { ...p, x, y };
          })
        );
      }
      rafRef.current = requestAnimationFrame(animate);
    };
    rafRef.current = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(rafRef.current);
  }, []);

  // Countdown → auto-redirect
  useEffect(() => {
    if (countdown <= 0) {
      navigate('/dashboard');
      return;
    }
    const t = setTimeout(() => setCountdown((c) => c - 1), 1000);
    return () => clearTimeout(t);
  }, [countdown, navigate]);

  // Coin blink
  useEffect(() => {
    const t = setInterval(() => setCoinBlink((b) => !b), 700);
    return () => clearInterval(t);
  }, []);

  // Random glitch bursts
  useEffect(() => {
    const t = setInterval(() => {
      setGlitching(true);
      setTimeout(() => setGlitching(false), 900);
    }, 3500);
    return () => clearInterval(t);
  }, []);

  const progressPct = ((COUNTDOWN_START - countdown) / COUNTDOWN_START) * 100;

  return (
    <div
      className="relative min-h-screen w-full flex flex-col items-center justify-center overflow-hidden select-none"
      style={{ background: 'linear-gradient(135deg, #09090b 0%, #0f0f1a 100%)' }}
    >
      {/* ── Scanlines ── */}
      <div
        className="pointer-events-none absolute inset-0 z-10"
        style={{
          backgroundImage:
            'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0,0,0,0.18) 2px, rgba(0,0,0,0.18) 4px)',
        }}
      />

      {/* ── Floating pixel particles ── */}
      <div className="pointer-events-none absolute inset-0 z-0 overflow-hidden">
        {particles.map((p) => (
          <div
            key={p.id}
            className="absolute"
            style={{
              left: `${p.x}%`,
              top: `${p.y}%`,
              width: p.size,
              height: p.size,
              backgroundColor: p.color,
              opacity: p.opacity,
              boxShadow: `0 0 ${p.size * 2}px ${p.color}`,
              borderRadius: Math.random() > 0.5 ? '0' : '50%',
            }}
          />
        ))}
      </div>

      {/* ── Corner decorations ── */}
      {['top-0 left-0', 'top-0 right-0', 'bottom-0 left-0', 'bottom-0 right-0'].map((pos) => (
        <div key={pos} className={`absolute ${pos} p-4 z-20`}>
          <div className="w-8 h-8 opacity-30" style={{
            borderTop: pos.includes('bottom') ? 'none' : '2px solid #4f46e5',
            borderBottom: pos.includes('top') ? 'none' : '2px solid #4f46e5',
            borderLeft: pos.includes('right') ? 'none' : '2px solid #4f46e5',
            borderRight: pos.includes('left') ? 'none' : '2px solid #4f46e5',
          }} />
        </div>
      ))}

      {/* ── Content ── */}
      <div className="relative z-20 flex flex-col items-center gap-6 px-8 text-center">

        {/* Game Over label */}
        <div
          className="text-sm font-bold tracking-[0.5em] uppercase mb-2"
          style={{
            color: '#f43f5e',
            fontFamily: '"Press Start 2P", monospace',
            textShadow: '0 0 10px #f43f5e, 0 0 20px #f43f5e88',
          }}
        >
          G A M E &nbsp; O V E R
        </div>

        {/* Giant 404 with glitch */}
        <div className="relative">
          {/* Ghost / glitch layer */}
          {glitching && (
            <>
              <div
                className="absolute inset-0 text-[10rem] sm:text-[14rem] font-black leading-none pointer-events-none"
                style={{
                  fontFamily: '"Bebas Neue", Impact, sans-serif',
                  color: '#ff2fd1',
                  transform: 'translate(-4px, 2px)',
                  clipPath: 'inset(20% 0 60% 0)',
                  opacity: 0.7,
                }}
              >
                404
              </div>
              <div
                className="absolute inset-0 text-[10rem] sm:text-[14rem] font-black leading-none pointer-events-none"
                style={{
                  fontFamily: '"Bebas Neue", Impact, sans-serif',
                  color: '#00ff99',
                  transform: 'translate(4px, -3px)',
                  clipPath: 'inset(60% 0 20% 0)',
                  opacity: 0.5,
                }}
              >
                404
              </div>
            </>
          )}
          {/* Main 404 */}
          <div
            className="text-[10rem] sm:text-[14rem] font-black leading-none"
            style={{
              fontFamily: '"Bebas Neue", Impact, sans-serif',
              color: glitching ? '#818cf8' : '#4f46e5',
              textShadow: glitching
                ? '0 0 30px #818cf8, 0 0 60px #4f46e588, 4px 0 #ff2fd1, -4px 0 #00ff99'
                : '0 0 30px #4f46e5, 0 0 60px #4f46e588',
              transition: 'color 0.1s, text-shadow 0.1s',
              letterSpacing: '-0.02em',
            }}
          >
            {glitching ? glitchLabel : '404'}
          </div>
        </div>

        {/* Subtitle */}
        <div
          className="text-base sm:text-xl font-bold tracking-widest uppercase"
          style={{
            fontFamily: '"Press Start 2P", monospace',
            color: '#a1a1aa',
            textShadow: '0 0 8px #4f46e544',
            lineHeight: 1.8,
          }}
        >
          PAGE NOT FOUND
        </div>

        {/* Divider */}
        <div className="flex items-center gap-4 w-full max-w-sm">
          <div className="flex-1 h-px" style={{ background: 'linear-gradient(90deg, transparent, #4f46e5)' }} />
          <div className="w-2 h-2 bg-indigo-500 rotate-45" />
          <div className="flex-1 h-px" style={{ background: 'linear-gradient(90deg, #4f46e5, transparent)' }} />
        </div>

        {/* Flavor text */}
        <p
          className="text-sm max-w-xs"
          style={{ color: '#71717a', fontFamily: '"Inter", sans-serif', lineHeight: 1.7 }}
        >
          This level doesn't exist.<br />
          The map has a gap here. Try a different route, Commander.
        </p>

        {/* Action buttons */}
        <div className="flex flex-col sm:flex-row gap-3 mt-2">
          <button
            onClick={() => navigate('/dashboard')}
            className="px-8 py-3 font-bold uppercase tracking-widest text-sm rounded-lg transition-all duration-200 hover:scale-105 active:scale-95"
            style={{
              fontFamily: '"Press Start 2P", monospace',
              fontSize: '0.6rem',
              background: 'linear-gradient(135deg, #4f46e5, #7c3aed)',
              color: '#fff',
              boxShadow: '0 0 20px #4f46e566, 0 4px 12px rgba(0,0,0,0.5)',
              border: '1px solid #818cf844',
            }}
          >
            ▶ &nbsp;Back to Arcade
          </button>
          <button
            onClick={() => navigate(-1)}
            className="px-8 py-3 font-bold uppercase tracking-widest text-sm rounded-lg transition-all duration-200 hover:scale-105 active:scale-95"
            style={{
              fontFamily: '"Press Start 2P", monospace',
              fontSize: '0.6rem',
              background: 'transparent',
              color: '#a1a1aa',
              border: '1px solid #3f3f46',
              boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
            }}
          >
            ◀ &nbsp;Go Back
          </button>
        </div>

        {/* Coin insert prompt */}
        <div
          className="mt-4 text-xs tracking-[0.3em] uppercase transition-opacity duration-300"
          style={{
            fontFamily: '"Press Start 2P", monospace',
            fontSize: '0.55rem',
            color: '#facc15',
            textShadow: '0 0 10px #facc15',
            opacity: coinBlink ? 1 : 0,
          }}
        >
          🪙 &nbsp;Insert Coin to Continue
        </div>

        {/* Progress bar countdown */}
        <div className="w-full max-w-xs mt-1">
          <div className="flex justify-between text-xs mb-1" style={{ color: '#52525b', fontFamily: 'monospace' }}>
            <span>AUTO-RETURN</span>
            <span style={{ color: countdown <= 3 ? '#f43f5e' : '#52525b' }}>{countdown}s</span>
          </div>
          <div
            className="w-full h-2 rounded-full overflow-hidden"
            style={{ background: '#27272a' }}
          >
            <div
              className="h-full rounded-full transition-all duration-1000 ease-linear"
              style={{
                width: `${progressPct}%`,
                background: countdown <= 3
                  ? 'linear-gradient(90deg, #f43f5e, #ff6b6b)'
                  : 'linear-gradient(90deg, #4f46e5, #818cf8)',
                boxShadow: countdown <= 3
                  ? '0 0 8px #f43f5e'
                  : '0 0 8px #4f46e5',
              }}
            />
          </div>
          <div className="text-center text-xs mt-1" style={{ color: '#3f3f46', fontFamily: 'monospace' }}>
            Returning to dashboard...
          </div>
        </div>

        {/* Easter egg score */}
        <div className="mt-2" style={{ color: '#3f3f46', fontFamily: '"Press Start 2P", monospace', fontSize: '0.45rem' }}>
          HI-SCORE: 00404 &nbsp;|&nbsp; SCORE: 00000
        </div>
      </div>

      {/* ── Bottom credit bar ── */}
      <div
        className="absolute bottom-4 left-0 right-0 text-center z-20"
        style={{ color: '#3f3f46', fontFamily: 'monospace', fontSize: '0.65rem', letterSpacing: '0.2em' }}
      >
        © ARCADIUM &nbsp;·&nbsp; ALL RIGHTS RESERVED &nbsp;·&nbsp; 1UP
      </div>
    </div>
  );
}

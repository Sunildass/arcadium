import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArcadiumLogo } from '../components/layout/ArcadiumLogo';
import { useTheme } from '../theme/ThemeProvider';

export default function LandingScreen() {
    const navigate = useNavigate();
    const { setThemeContext } = useTheme();
    const [ready, setReady] = useState(false);
    const [coinBlink, setCoinBlink] = useState(true);
    const [coinVisible, setCoinVisible] = useState(false);
    const [coinInserted, setCoinInserted] = useState(false);

    useEffect(() => {
        setThemeContext(undefined, undefined);
        const t1 = setTimeout(() => setReady(true), 60);
        // Coin prompt appears last, after all other animations settle (~1.6s)
        const t2 = setTimeout(() => setCoinVisible(true), 1600);
        return () => { clearTimeout(t1); clearTimeout(t2); };
    }, [setThemeContext]);

    // Coin insert blink
    useEffect(() => {
        const t = setInterval(() => setCoinBlink(b => !b), 650);
        return () => clearInterval(t);
    }, []);

    const handleEnter = () => {
        if (coinInserted) return;
        setCoinInserted(true);
        // Navigate after coin drop animation completes
        setTimeout(() => navigate('/boot'), 780);
    };

    return (
        <div className="min-h-screen w-full flex flex-col items-center justify-center relative overflow-hidden bg-zinc-950 z-10">

            {/* ── Core Backlight Drop ── */}
            <div
                className="absolute inset-0 z-0 radial-gradient-halo"
                style={{
                    opacity: ready ? 1 : 0,
                    transition: 'opacity 1.2s ease',
                }}
            />

            {/* ── Animated Grid Floor ── same markup as before, just animated in ── */}
            <div
                className="absolute inset-x-0 bottom-0 h-1/2 z-0 perspective-[1000px] overflow-hidden"
                style={{
                    opacity: ready ? 0.4 : 0,
                    transform: ready ? 'translateY(0)' : 'translateY(50px)',
                    transition: 'opacity 1s ease 0.1s, transform 1s cubic-bezier(0.22,1,0.36,1) 0.1s',
                }}
            >
                <div
                    className="absolute inset-x-0 bottom-[-50%] h-[200%] border-t-2"
                    style={{
                        borderColor: 'var(--color-primary)',
                        transform: 'rotateX(75deg) scale(2.5)',
                        transformOrigin: 'top center',
                        backgroundImage: `
                            linear-gradient(to bottom, transparent 0%, rgba(79, 70, 229, 0.4) 100%),
                            linear-gradient(rgba(79, 70, 229, 0.3) 2px, transparent 2px),
                            linear-gradient(90deg, rgba(79, 70, 229, 0.3) 2px, transparent 2px)
                        `,
                        backgroundSize: '100% 100%, 60px 60px, 60px 60px',
                        animation: 'gridMove 15s linear infinite',
                    }}
                />
            </div>

            {/* ── Logo ── exact original layout, animation via CSS keyframe ── */}
            <div
                className="z-10 flex flex-col items-center transform scale-[1.8] sm:scale-[2.5] mb-24 mt-[-10vh] drop-shadow-[0_0_30px_rgba(79,70,229,0.5)]"
                style={{
                    animation: ready ? 'logoDrop 0.7s cubic-bezier(0.34,1.56,0.64,1) forwards, logoFlicker 0.8s steps(1) forwards' : 'none',
                    opacity: ready ? undefined : 0,
                }}
            >
                <ArcadiumLogo />
            </div>

            {/* ── ENTER THE ARCADE button + coin slot ── */}
            <div
                className="z-10 flex flex-col items-center"
                style={{
                    opacity: ready ? 1 : 0,
                    transform: ready ? 'translateY(0)' : 'translateY(24px)',
                    transition: 'opacity 0.45s ease 0.55s, transform 0.5s cubic-bezier(0.34,1.4,0.64,1) 0.55s',
                    position: 'relative',
                }}
            >
                {/* Falling coin — absolutely positioned over the slot */}
                {coinInserted && (
                    <div style={{
                        position: 'absolute',
                        top: '10px',
                        left: '50%',
                        transform: 'translateX(-50%)',
                        width: '22px',
                        height: '22px',
                        borderRadius: '50%',
                        background: 'radial-gradient(circle at 35% 30%, #ffe066, #f59e0b, #92400e)',
                        border: '2px solid #b45309',
                        boxShadow: '0 0 12px #fbbf2488, inset 0 2px 4px rgba(255,255,255,0.4)',
                        zIndex: 30,
                        animation: 'coinDrop 0.72s cubic-bezier(0.45,0.05,0.55,0.95) forwards',
                    }} />
                )}

                <button
                    onClick={handleEnter}
                    disabled={coinInserted}
                    className="group relative px-12 py-6 bg-zinc-950/80 backdrop-blur-sm overflow-hidden text-2xl"
                >
                    {/* Pixelated Border */}
                    <div
                        className="absolute inset-0 border-4 transition-all duration-300 group-hover:bg-[var(--color-primary)]/20 group-hover:shadow-[0_0_30px_var(--color-primary)] group-hover:border-[var(--color-secondary)]"
                        style={{ borderColor: coinInserted ? 'var(--color-secondary)' : 'var(--color-primary)' }}
                    />
                    {/* Scanline on button */}
                    <div
                        className="absolute inset-0 opacity-20 pointer-events-none mix-blend-overlay"
                        style={{ background: 'repeating-linear-gradient(0deg, transparent, transparent 2px, #000 2px, #000 4px)' }}
                    />
                    <span
                        className="relative font-black tracking-[0.4em] uppercase transition-colors duration-300 drop-shadow-[0_0_8px_currentColor] group-hover:text-white"
                        style={{
                            fontFamily: 'var(--font-heading)',
                            color: coinInserted ? 'var(--color-primary)' : 'var(--color-secondary)',
                            transition: 'color 0.3s ease',
                        }}
                    >
                        {coinInserted ? 'LOADING...' : 'ENTER THE ARCADE'}
                    </span>
                </button>

                {/* Coin slot — sits below the button */}
                <div style={{ position: 'relative', marginTop: '10px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px' }}>
                    {/* Slot housing */}
                    <div style={{
                        width: '48px',
                        height: '10px',
                        background: '#111',
                        border: '2px solid #4f46e5',
                        borderRadius: '2px',
                        boxShadow: '0 0 8px #4f46e544, inset 0 2px 4px rgba(0,0,0,0.8)',
                        position: 'relative',
                        overflow: 'hidden',
                    }}>
                        {/* Slot opening line */}
                        <div style={{
                            position: 'absolute',
                            top: '50%',
                            left: '10%',
                            right: '10%',
                            height: '2px',
                            background: 'linear-gradient(90deg, transparent, #4f46e5, #818cf8, #4f46e5, transparent)',
                            transform: 'translateY(-50%)',
                            boxShadow: '0 0 6px #818cf8',
                        }} />
                        {/* Glow when coin inserted */}
                        {coinInserted && (
                            <div style={{
                                position: 'absolute',
                                inset: 0,
                                background: 'radial-gradient(ellipse at center, #fbbf2488, transparent)',
                                animation: 'slotGlow 0.3s ease 0.5s forwards',
                                opacity: 0,
                            }} />
                        )}
                    </div>
                    <span style={{ fontSize: '0.42rem', color: '#4f46e566', fontFamily: 'monospace', letterSpacing: '0.2em' }}>COIN SLOT</span>
                </div>
            </div>

            {/* ── Coin insert blink ── */}
            <div
                className="z-10 mt-4 text-xs tracking-[0.35em] uppercase"
                style={{
                    fontFamily: '"Press Start 2P", monospace',
                    fontSize: '0.55rem',
                    color: '#facc15',
                    textShadow: '0 0 10px #facc15',
                    opacity: coinInserted ? 0 : coinVisible ? (coinBlink ? 0.9 : 0) : 0,
                    transition: 'opacity 0.22s ease',
                }}
            >
                🪙 &nbsp;Insert Coin to Continue
            </div>

            {/* ── HUD corners ── */}
            <div
                className="absolute top-6 left-6 z-20 flex flex-col gap-1"
                style={{
                    opacity: ready ? 1 : 0,
                    transform: ready ? 'translate(0,0)' : 'translate(-10px,-6px)',
                    transition: 'opacity 0.5s ease 0.9s, transform 0.5s cubic-bezier(0.22,1,0.36,1) 0.9s',
                }}
            >
                <div className="text-[0.45rem] tracking-widest uppercase" style={{ color: '#4f46e566', fontFamily: 'monospace' }}>ARCADIUM v2.0</div>
                <div className="text-[0.45rem] tracking-widest uppercase" style={{ color: '#4f46e544', fontFamily: 'monospace' }}>50+ GAMES LOADED</div>
            </div>

            <div
                className="absolute top-6 right-6 z-20 text-right"
                style={{
                    opacity: ready ? 1 : 0,
                    transform: ready ? 'translate(0,0)' : 'translate(10px,-6px)',
                    transition: 'opacity 0.5s ease 0.9s, transform 0.5s cubic-bezier(0.22,1,0.36,1) 0.9s',
                }}
            >
                <div className="text-[0.45rem] tracking-widest uppercase" style={{ color: '#4f46e566', fontFamily: 'monospace' }}>HI-SCORE</div>
                <div className="text-[0.65rem] font-bold" style={{ color: '#818cf8', fontFamily: '"Press Start 2P", monospace', textShadow: '0 0 8px #4f46e5' }}>999999</div>
            </div>

            <div
                className="absolute bottom-6 left-6 z-20 flex items-center gap-2"
                style={{
                    opacity: ready ? 1 : 0,
                    transform: ready ? 'translate(0,0)' : 'translate(-10px,6px)',
                    transition: 'opacity 0.5s ease 1s, transform 0.5s cubic-bezier(0.22,1,0.36,1) 1s',
                }}
            >
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                <span className="text-[0.45rem] tracking-widest uppercase" style={{ color: '#4f46e566', fontFamily: 'monospace' }}>SYSTEM READY</span>
            </div>

            <div
                className="absolute bottom-6 right-6 z-20 text-right"
                style={{
                    opacity: ready ? 1 : 0,
                    transform: ready ? 'translate(0,0)' : 'translate(10px,6px)',
                    transition: 'opacity 0.5s ease 1s, transform 0.5s cubic-bezier(0.22,1,0.36,1) 1s',
                }}
            >
                <div className="text-[0.45rem] tracking-widest uppercase" style={{ color: '#4f46e566', fontFamily: 'monospace' }}>© 2026 ARCADIUM</div>
            </div>

            {/* ── CRT vignette ── */}
            <div className="pointer-events-none absolute inset-0 z-50 bg-[radial-gradient(ellipse_at_center,transparent_50%,rgba(0,0,0,0.8)_100%)]" />

            <style>{`
                @keyframes gridMove {
                    0%   { background-position: 0 0, 0 0, 0 0; }
                    100% { background-position: 0 0, 0 120px, 0 0; }
                }
                .radial-gradient-halo {
                    background: radial-gradient(circle at center 30%, rgba(79, 70, 229, 0.15) 0%, transparent 60%);
                }
                /* Logo drops from above with spring overshoot */
                @keyframes logoDrop {
                    from { opacity: 0; transform: translateY(-30px); }
                    to   { opacity: 1; transform: translateY(0); }
                }
                /* CRT power-on flicker — only opacity/filter, no transform */
                @keyframes logoFlicker {
                    0%   { opacity: 0;   filter: brightness(8) saturate(0); }
                    12%  { opacity: 1;   filter: brightness(5) saturate(0.3); }
                    25%  { opacity: 0.5; filter: brightness(7); }
                    40%  { opacity: 1;   filter: brightness(2); }
                    60%  { opacity: 0.8; filter: brightness(3); }
                    80%  { opacity: 1;   filter: brightness(1.4); }
                    100% { opacity: 1;   filter: brightness(1) drop-shadow(0 0 16px rgba(79,70,229,0.55)); }
                }
                /* Coin drop into slot */
                @keyframes coinDrop {
                    0%   { transform: translateX(-50%) translateY(0px)  scaleX(1)   scaleY(1);   opacity: 1; }
                    55%  { transform: translateX(-50%) translateY(62px) scaleX(1)   scaleY(1);   opacity: 1; }
                    72%  { transform: translateX(-50%) translateY(70px) scaleX(1.1) scaleY(0.35); opacity: 0.9; }
                    88%  { transform: translateX(-50%) translateY(73px) scaleX(0.6) scaleY(0.15); opacity: 0.5; }
                    100% { transform: translateX(-50%) translateY(75px) scaleX(0)   scaleY(0);   opacity: 0; }
                }
                /* Slot flash when coin enters */
                @keyframes slotGlow {
                    0%   { opacity: 0; }
                    50%  { opacity: 1; }
                    100% { opacity: 0; }
                }
            `}</style>
        </div>
    );
}

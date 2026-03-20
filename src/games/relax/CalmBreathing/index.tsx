import React, { useState, useEffect, useRef } from 'react';

type Phase = 'idle' | 'inhale' | 'hold' | 'exhale' | 'rest';

const CYCLES: Record<string, { inhale: number; hold: number; exhale: number; rest: number; name: string }> = {
    '4-7-8': { inhale: 4, hold: 7, exhale: 8, rest: 0, name: '4-7-8 Relaxing' },
    'box':   { inhale: 4, hold: 4, exhale: 4, rest: 4, name: 'Box Breathing' },
    'calm':  { inhale: 5, hold: 0, exhale: 5, rest: 0, name: 'Simple Calm' },
};

const PHASE_COLORS: Record<Phase, string> = {
    idle:   '#3f3f46',
    inhale: '#22c55e',
    hold:   '#f59e0b',
    exhale: '#60a5fa',
    rest:   '#c084fc',
};

const PHASE_LABELS: Record<Phase, string> = {
    idle:   'Tap Start',
    inhale: 'Breathe In',
    hold:   'Hold',
    exhale: 'Breathe Out',
    rest:   'Rest',
};

export default function CalmBreathing() {
    const [pattern, setPattern] = useState('box');
    const [phase, setPhase] = useState<Phase>('idle');
    const [timeLeft, setTimeLeft] = useState(0);
    const [totalSecs, setTotalSecs] = useState(0);
    const [cycles, setCycles] = useState(0);
    const [running, setRunning] = useState(false);
    const phaseRef = useRef<Phase>('idle');
    const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

    const cycle = CYCLES[pattern];

    const PHASES: Phase[] = ['inhale', ...(cycle.hold > 0 ? ['hold' as Phase] : []), 'exhale', ...(cycle.rest > 0 ? ['rest' as Phase] : [])];
    const DURATIONS: Record<Phase, number> = { idle: 0, inhale: cycle.inhale, hold: cycle.hold, exhale: cycle.exhale, rest: cycle.rest };

    const nextPhase = (current: Phase): Phase => {
        const idx = PHASES.indexOf(current);
        if (idx === PHASES.length - 1) {
            setCycles(c => c + 1);
            return PHASES[0];
        }
        return PHASES[idx + 1];
    };

    useEffect(() => {
        if (!running) return;
        const p = PHASES[0];
        phaseRef.current = p;
        setPhase(p);
        setTimeLeft(DURATIONS[p]);

        timerRef.current = setInterval(() => {
            setTimeLeft(t => {
                if (t <= 1) {
                    const next = nextPhase(phaseRef.current);
                    phaseRef.current = next;
                    setPhase(next);
                    setTotalSecs(s => s + 1);
                    return DURATIONS[next];
                }
                setTotalSecs(s => s + 1);
                return t - 1;
            });
        }, 1000);

        return () => { if (timerRef.current) clearInterval(timerRef.current); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [running, pattern]);

    const stop = () => {
        setRunning(false);
        setPhase('idle');
        if (timerRef.current) clearInterval(timerRef.current);
    };

    const phaseDur = DURATIONS[phase] || 1;
    const progress = phase === 'idle' ? 0 : (phaseDur - timeLeft) / phaseDur;
    const currentColor = PHASE_COLORS[phase];

    // Breathing circle scale - inhale expands, exhale contracts
    const scale = phase === 'inhale' ? 0.6 + progress * 0.4 :
                  phase === 'exhale' ? 1 - progress * 0.4 :
                  phase === 'hold' || phase === 'rest' ? 1 : 0.6;

    return (
        <div className="flex flex-col items-center justify-center p-6 min-h-[90vh] bg-gradient-to-b from-slate-950 to-zinc-950 text-zinc-100 font-sans gap-6 select-none">
            <h1 className="text-4xl font-black tracking-widest uppercase" style={{ color: currentColor }}>Calm Breath</h1>

            {/* Stats */}
            <div className="flex gap-8 text-center font-mono">
                <div><div className="text-3xl font-black text-zinc-300">{cycles}</div><div className="text-xs text-zinc-500 uppercase">Cycles</div></div>
                <div><div className="text-3xl font-black text-zinc-400">{Math.floor(totalSecs / 60)}:{String(totalSecs % 60).padStart(2, '0')}</div><div className="text-xs text-zinc-500 uppercase">Duration</div></div>
            </div>

            {/* Pattern selector */}
            {!running && (
                <div className="flex gap-2 flex-wrap justify-center">
                    {Object.entries(CYCLES).map(([k, v]) => (
                        <button key={k} onClick={() => setPattern(k)}
                            className={`px-3 py-1 rounded-full border text-sm font-bold transition-colors ${pattern === k ? 'text-white border-white bg-zinc-700' : 'border-zinc-600 text-zinc-400 hover:border-zinc-400'}`}>
                            {v.name}
                        </button>
                    ))}
                </div>
            )}

            {/* Breathing circle */}
            <div className="relative flex items-center justify-center w-64 h-64">
                {/* Outer glow ring */}
                <div className="absolute w-64 h-64 rounded-full opacity-20 blur-2xl transition-all duration-1000" style={{ backgroundColor: currentColor, transform: `scale(${scale})` }} />
                {/* Timer ring */}
                <svg width="256" height="256" className="absolute">
                    <circle cx="128" cy="128" r="120" fill="none" stroke={currentColor + '22'} strokeWidth="8" />
                    <circle cx="128" cy="128" r="120" fill="none" stroke={currentColor} strokeWidth="8"
                        strokeDasharray={`${Math.PI * 2 * 120}`}
                        strokeDashoffset={Math.PI * 2 * 120 * (1 - progress)}
                        strokeLinecap="round"
                        transform="rotate(-90 128 128)"
                        className="transition-all duration-1000" />
                </svg>
                {/* Main circle */}
                <div className="rounded-full flex flex-col items-center justify-center text-white text-center transition-all duration-1000 shadow-xl"
                    style={{ width: `${scale * 170}px`, height: `${scale * 170}px`, backgroundColor: currentColor + '44', border: `3px solid ${currentColor}` }}>
                    <div className="font-black text-xl uppercase tracking-widest">{PHASE_LABELS[phase]}</div>
                    {phase !== 'idle' && <div className="text-3xl font-black mt-1">{timeLeft}</div>}
                </div>
            </div>

            {/* Controls */}
            {!running ? (
                <button onClick={() => { setCycles(0); setTotalSecs(0); setRunning(true); }}
                    className="px-10 py-4 text-white font-black text-xl uppercase tracking-widest rounded-xl shadow-xl transition-all active:scale-95"
                    style={{ backgroundColor: currentColor }}>
                    ▶ Start
                </button>
            ) : (
                <button onClick={stop}
                    className="px-10 py-4 bg-zinc-800 hover:bg-zinc-700 text-white font-black text-xl uppercase tracking-widest rounded-xl shadow transition-all">
                    ⏹ Stop
                </button>
            )}
            <p className="text-zinc-600 text-xs max-w-xs text-center">{CYCLES[pattern].name} — follow the expanding circle to breathe.</p>
        </div>
    );
}

import React, { useState, useEffect, useRef, useCallback } from 'react';

const MOLES = 9;
const MOLE_SHOW_MS = 900;

interface MoleSlot { active: boolean; hitFlash: boolean; missFlash: boolean; timer: number; }

export default function WhackAMole() {
    const [moles, setMoles] = useState<MoleSlot[]>(Array(MOLES).fill(null).map(() => ({ active: false, hitFlash: false, missFlash: false, timer: 0 })));
    const [score, setScore] = useState(0);
    const [misses, setMisses] = useState(0);
    const [timeLeft, setTimeLeft] = useState(30);
    const [started, setStarted] = useState(false);
    const [gameOver, setGameOver] = useState(false);
    const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
    const moleTimers = useRef<(ReturnType<typeof setTimeout> | null)[]>(Array(MOLES).fill(null));

    const popMole = useCallback(() => {
        const idx = Math.floor(Math.random() * MOLES);
        setMoles(prev => {
            if (prev[idx].active) return prev;
            const next = prev.map((m, i) => i === idx ? { ...m, active: true, hitFlash: false, missFlash: false } : m);
            return next;
        });
        // Auto-retract after MOLE_SHOW_MS
        moleTimers.current[idx] = setTimeout(() => {
            setMoles(prev => {
                const m = prev[idx];
                if (m.active && !m.hitFlash) {
                    setMisses(ms => ms + 1);
                    return prev.map((mo, i) => i === idx ? { ...mo, active: false, missFlash: true } : mo);
                }
                return prev.map((mo, i) => i === idx ? { ...mo, active: false } : mo);
            });
            // Clear miss flash
            setTimeout(() => setMoles(prev => prev.map((m, i) => i === idx ? { ...m, missFlash: false } : m)), 300);
        }, MOLE_SHOW_MS);
    }, []);

    const startGame = useCallback(() => {
        setScore(0); setMisses(0); setTimeLeft(30); setGameOver(false); setStarted(true);
        setMoles(Array(MOLES).fill(null).map(() => ({ active: false, hitFlash: false, missFlash: false, timer: 0 })));
    }, []);

    useEffect(() => {
        if (!started || gameOver) return;
        // Mole pop interval
        const moleInterval = setInterval(() => { popMole(); }, 700);
        // Countdown
        timerRef.current = setInterval(() => {
            setTimeLeft(t => {
                if (t <= 1) { setGameOver(true); setStarted(false); return 0; }
                return t - 1;
            });
        }, 1000);
        return () => { clearInterval(moleInterval); if (timerRef.current) clearInterval(timerRef.current); };
    }, [started, gameOver, popMole]);

    const whack = (idx: number) => {
        if (!started || gameOver) return;
        setMoles(prev => {
            if (!prev[idx].active) return prev;
            if (moleTimers.current[idx]) { clearTimeout(moleTimers.current[idx]!); moleTimers.current[idx] = null; }
            setScore(s => s + 10);
            const next = prev.map((m, i) => i === idx ? { ...m, active: false, hitFlash: true } : m);
            setTimeout(() => setMoles(p => p.map((m, i) => i === idx ? { ...m, hitFlash: false } : m)), 250);
            return next;
        });
    };

    const moleEmoji = ['🐹','🐭','🐾','🦔','🐿️','🦫','🐰','🦡','🦦'];

    return (
        <div className="flex flex-col items-center justify-center p-6 min-h-[90vh] bg-gradient-to-b from-lime-950 to-zinc-950 text-zinc-100 font-sans gap-6">
            <h1 className="text-5xl font-black tracking-widest text-lime-400 uppercase drop-shadow-[0_0_10px_rgba(163,230,53,0.5)]">Whack-a-Mole</h1>

            {/* HUD */}
            <div className="flex gap-8 font-mono text-center">
                <div><div className={`text-3xl font-black ${timeLeft <= 10 ? 'text-red-400 animate-pulse' : 'text-lime-400'}`}>{timeLeft}s</div><div className="text-xs text-zinc-500 uppercase">Time</div></div>
                <div><div className="text-3xl font-black text-yellow-400">{score}</div><div className="text-xs text-zinc-500 uppercase">Score</div></div>
                <div><div className="text-3xl font-black text-red-400">{misses}</div><div className="text-xs text-zinc-500 uppercase">Escaped</div></div>
            </div>

            {/* Mole Grid */}
            <div className="grid grid-cols-3 gap-4">
                {moles.map((mole, idx) => (
                    <button
                        key={idx}
                        onClick={() => whack(idx)}
                        className={`w-28 h-28 rounded-2xl border-4 text-5xl flex items-center justify-center transition-all duration-150 select-none
                            ${mole.hitFlash ? 'bg-yellow-500 border-yellow-300 scale-90 shadow-[0_0_20px_rgba(234,179,8,0.8)]' :
                              mole.missFlash ? 'bg-red-900 border-red-600' :
                              mole.active ? 'bg-lime-800 border-lime-500 scale-105 shadow-lg cursor-crosshair hover:scale-110 active:scale-95' :
                              'bg-zinc-800 border-zinc-700 cursor-default'}`}
                    >
                        {mole.hitFlash ? '💥' : mole.active ? moleEmoji[idx] : mole.missFlash ? '💨' : ''}
                    </button>
                ))}
            </div>

            {!started && !gameOver && (
                <button onClick={startGame} className="px-12 py-4 bg-lime-600 hover:bg-lime-500 text-white font-black text-xl uppercase tracking-widest rounded-xl shadow transition-all">
                    🔨 Start Whacking!
                </button>
            )}

            {gameOver && (
                <div className="flex flex-col items-center gap-4">
                    <div className="text-3xl font-black text-lime-400">Time's Up! Score: {score}</div>
                    <button onClick={startGame} className="px-12 py-4 bg-lime-600 hover:bg-lime-500 text-white font-black text-xl uppercase tracking-widest rounded-xl shadow transition-all">
                        🔄 Play Again
                    </button>
                </div>
            )}
        </div>
    );
}

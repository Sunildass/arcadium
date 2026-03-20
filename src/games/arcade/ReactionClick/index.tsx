import React, { useState, useEffect, useRef } from 'react';

const ROUND_COUNT = 10;
const COLORS = ['#ef4444','#3b82f6','#22c55e','#f59e0b','#8b5cf6','#ec4899'];

export default function ReactionClick() {
    const [phase, setPhase] = useState<'idle'|'waiting'|'go'|'result'|'done'>('idle');
    const [round, setRound] = useState(0);
    const [times, setTimes] = useState<number[]>([]);
    const [goTime, setGoTime] = useState<number | null>(null);
    const [bgColor, setBgColor] = useState('#1c1917');
    const [earlyClick, setEarlyClick] = useState(false);
    const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    const startRound = () => {
        setEarlyClick(false);
        setPhase('waiting');
        setBgColor('#1c1917');
        const delay = 1500 + Math.random() * 3000;
        timeoutRef.current = setTimeout(() => {
            const color = COLORS[Math.floor(Math.random() * COLORS.length)];
            setBgColor(color);
            setGoTime(Date.now());
            setPhase('go');
        }, delay);
    };

    const handleClick = () => {
        if (phase === 'idle') { setRound(0); setTimes([]); startRound(); return; }
        if (phase === 'done') { setRound(0); setTimes([]); startRound(); return; }
        if (phase === 'waiting') {
            // Early click
            if (timeoutRef.current) clearTimeout(timeoutRef.current);
            setEarlyClick(true);
            setPhase('result');
            setBgColor('#1c1917');
            setTimeout(() => { startRound(); }, 1200);
            return;
        }
        if (phase === 'go') {
            const rt = Date.now() - (goTime || Date.now());
            const newTimes = [...times, rt];
            setTimes(newTimes);
            setBgColor('#1c1917');
            if (round + 1 >= ROUND_COUNT) {
                setPhase('done'); setRound(ROUND_COUNT);
            } else {
                setPhase('result');
                setRound(r => r + 1);
                setTimeout(() => startRound(), 1000);
            }
        }
    };

    const avg = times.length > 0 ? Math.round(times.reduce((a, b) => a + b, 0) / times.length) : 0;
    const best = times.length > 0 ? Math.min(...times) : 0;

    const rating = avg < 200 ? '⚡ Lightning' : avg < 300 ? '🚀 Fast' : avg < 450 ? '👍 Good' : '🐢 Keep Practicing';

    return (
        <div
            onClick={handleClick}
            className="flex flex-col items-center justify-center min-h-[90vh] font-sans gap-4 cursor-pointer select-none transition-colors duration-100"
            style={{ backgroundColor: bgColor }}
        >
            <h1 className="text-4xl font-black tracking-widest text-white uppercase drop-shadow-lg">Reaction Click</h1>

            <div className="flex gap-8 font-mono text-center">
                <div><div className="text-3xl font-black text-white">{round}/{ROUND_COUNT}</div><div className="text-xs text-white/60 uppercase">Round</div></div>
                {avg > 0 && <div><div className="text-3xl font-black text-white">{avg}ms</div><div className="text-xs text-white/60 uppercase">Avg</div></div>}
                {best > 0 && <div><div className="text-3xl font-black text-yellow-300">{best}ms</div><div className="text-xs text-white/60 uppercase">Best</div></div>}
            </div>

            <div className="flex flex-col items-center gap-3">
                {phase === 'idle' && <div className="text-2xl font-black text-white/80">Click anywhere to start!</div>}
                {phase === 'waiting' && <div className="text-2xl font-black text-white/70 animate-pulse">Wait for the color...</div>}
                {phase === 'go' && <div className="text-5xl font-black text-white drop-shadow-[0_0_20px_rgba(255,255,255,0.8)] animate-bounce">CLICK!</div>}
                {phase === 'result' && !earlyClick && times.length > 0 && (
                    <div className="text-3xl font-black text-white drop-shadow">{times[times.length - 1]}ms</div>
                )}
                {earlyClick && <div className="text-2xl font-black text-red-300">Too early! Wait for color...</div>}
            </div>

            {phase === 'done' && (
                <div className="bg-black/50 backdrop-blur rounded-2xl p-6 text-center flex flex-col gap-3">
                    <div className="text-2xl font-black text-white">{rating}</div>
                    <div className="text-white/80">Average: <b>{avg}ms</b> · Best: <b>{best}ms</b></div>
                    <div className="text-sm text-white/50 mt-2">Click to play again</div>
                </div>
            )}
        </div>
    );
}

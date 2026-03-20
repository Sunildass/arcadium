import React, { useState, useRef, useEffect, useCallback } from 'react';

const SPINNERS = [
    { name: 'Classic', emoji: '🌀', color: '#60a5fa' },
    { name: 'Star', emoji: '⭐', color: '#fbbf24' },
    { name: 'Flower', emoji: '🌸', color: '#f9a8d4' },
    { name: 'Fire',   emoji: '🔥', color: '#fb923c' },
];

export default function DigitalFidgetSpinner() {
    const [angle, setAngle] = useState(0);
    const [velocity, setVelocity] = useState(0);
    const [spins, setSpins] = useState(0);
    const [selected, setSelected] = useState(0);
    const [rpm, setRpm] = useState(0);
    const angleRef = useRef(0);
    const velocityRef = useRef(0);
    const lastAngle = useRef<number | null>(null);
    const spinCountRef = useRef(0);
    const prevRemainder = useRef(0);
    const rafRef = useRef<number>(0);
    const lastTime = useRef<number | null>(null);

    // Physics loop
    useEffect(() => {
        const tick = (now: number) => {
            const dt = lastTime.current ? (now - lastTime.current) / 1000 : 0.016;
            lastTime.current = now;

            velocityRef.current *= Math.pow(0.992, dt * 60); // friction
            if (Math.abs(velocityRef.current) < 0.001) velocityRef.current = 0;

            angleRef.current += velocityRef.current * dt;

            // Count full rotations
            const cur = ((angleRef.current % (Math.PI * 2)) + Math.PI * 2) % (Math.PI * 2);
            if (prevRemainder.current > 5 && cur < 1) { spinCountRef.current++; setSpins(spinCountRef.current); }
            prevRemainder.current = cur;

            const rpmVal = Math.abs(velocityRef.current) * 60 / (Math.PI * 2);
            setRpm(Math.round(rpmVal));
            setAngle(angleRef.current);
            setVelocity(velocityRef.current);

            rafRef.current = requestAnimationFrame(tick);
        };
        rafRef.current = requestAnimationFrame(tick);
        return () => cancelAnimationFrame(rafRef.current);
    }, []);

    // Mouse/touch drag to spin
    const spinnerRef = useRef<HTMLDivElement>(null);
    const drag = useRef<{ startAngle: number; spinning: boolean }>({ startAngle: 0, spinning: false });

    const getAngleFromCenter = useCallback((e: React.MouseEvent | React.TouchEvent) => {
        const el = spinnerRef.current!;
        const rect = el.getBoundingClientRect();
        const cx = rect.left + rect.width / 2, cy = rect.top + rect.height / 2;
        const { clientX, clientY } = 'touches' in e ? e.touches[0] : e;
        return Math.atan2(clientY - cy, clientX - cx);
    }, []);

    const onPointerDown = useCallback((e: React.MouseEvent | React.TouchEvent) => {
        drag.current = { startAngle: getAngleFromCenter(e), spinning: true };
        lastAngle.current = getAngleFromCenter(e);
    }, [getAngleFromCenter]);

    const onPointerMove = useCallback((e: React.MouseEvent | React.TouchEvent) => {
        if (!drag.current.spinning || lastAngle.current === null) return;
        const newA = getAngleFromCenter(e);
        let delta = newA - lastAngle.current;
        // Handle wrap-around
        if (delta > Math.PI) delta -= Math.PI * 2;
        if (delta < -Math.PI) delta += Math.PI * 2;
        velocityRef.current = delta * 60; // approx rad/s boost
        lastAngle.current = newA;
    }, [getAngleFromCenter]);

    const onPointerUp = useCallback(() => {
        drag.current.spinning = false;
        lastAngle.current = null;
    }, []);

    const onFlick = () => {
        velocityRef.current += (Math.random() > 0.5 ? 1 : -1) * (8 + Math.random() * 12);
    };

    const spinner = SPINNERS[selected];
    const speedLabel = Math.abs(rpm) > 300 ? '🔥 Blazing' : Math.abs(rpm) > 150 ? '⚡ Fast' : Math.abs(rpm) > 60 ? '💨 Steady' : Math.abs(rpm) > 10 ? '🌿 Slow' : '😴 Idle';

    return (
        <div className="flex flex-col items-center justify-center p-6 min-h-[90vh] bg-gradient-to-b from-indigo-950 to-zinc-950 text-zinc-100 font-sans gap-6 select-none">
            <h1 className="text-4xl font-black tracking-widest text-indigo-400 uppercase">Fidget Spinner</h1>

            <div className="flex gap-6 text-center font-mono">
                <div><div className="text-3xl font-black text-yellow-400">{spins}</div><div className="text-xs text-zinc-500">Spins</div></div>
                <div><div className="text-3xl font-black" style={{ color: spinner.color }}>{Math.abs(rpm)}</div><div className="text-xs text-zinc-500">RPM</div></div>
                <div><div className="text-3xl font-black text-zinc-300">{speedLabel}</div><div className="text-xs text-zinc-500">Status</div></div>
            </div>

            {/* Skin selector */}
            <div className="flex gap-3">
                {SPINNERS.map((s, i) => (
                    <button key={i} onClick={() => setSelected(i)}
                        className={`w-12 h-12 text-2xl rounded-full border-2 transition-all ${selected === i ? 'border-white scale-110' : 'border-zinc-600 opacity-60 hover:opacity-90'}`}>
                        {s.emoji}
                    </button>
                ))}
            </div>

            {/* Spinner graphic */}
            <div
                ref={spinnerRef}
                className="cursor-grab active:cursor-grabbing"
                onMouseDown={onPointerDown} onMouseMove={onPointerMove} onMouseUp={onPointerUp} onMouseLeave={onPointerUp}
                onTouchStart={onPointerDown} onTouchMove={onPointerMove} onTouchEnd={onPointerUp}
            >
                <div
                    className="w-56 h-56 relative flex items-center justify-center"
                    style={{ transform: `rotate(${angle}rad)` }}
                >
                    {/* 3 arms */}
                    {[0, 120, 240].map(deg => (
                        <div key={deg} className="absolute flex items-center justify-center"
                            style={{ transform: `rotate(${deg}deg)` }}>
                            <div className="absolute w-20 h-20 rounded-full border-8 shadow-xl"
                                style={{
                                    top: '-70px', left: '-40px',
                                    backgroundColor: spinner.color + '33',
                                    borderColor: spinner.color,
                                    boxShadow: `0 0 20px ${spinner.color}88`
                                }}>
                                <span className="flex items-center justify-center w-full h-full text-3xl">{spinner.emoji}</span>
                            </div>
                        </div>
                    ))}
                    {/* Center hub */}
                    <div className="w-12 h-12 rounded-full border-4 z-10 flex items-center justify-center font-black text-sm"
                        style={{ backgroundColor: spinner.color + '44', borderColor: spinner.color }}>
                    </div>
                </div>
            </div>

            <button onClick={onFlick}
                className="px-8 py-3 bg-indigo-700 hover:bg-indigo-600 text-white font-black uppercase tracking-widest rounded-xl shadow transition-all active:scale-95">
                ⚡ Flick!
            </button>
            <p className="text-zinc-600 text-xs">Drag to spin or click Flick for a boost!</p>
        </div>
    );
}

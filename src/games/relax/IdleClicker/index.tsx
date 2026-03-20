import React, { useState, useEffect, useRef } from 'react';

const UPGRADES = [
    { id: 'cursor',   name: 'Auto Clicker',     baseCost: 15,   baseRate: 0.1,  emoji: '🖱️' },
    { id: 'farm',     name: 'Zen Garden',        baseCost: 100,  baseRate: 0.5,  emoji: '🌿' },
    { id: 'mine',     name: 'Crystal Mine',      baseCost: 800,  baseRate: 4,    emoji: '💎' },
    { id: 'factory',  name: 'Om Factory',        baseCost: 4500, baseRate: 20,   emoji: '🏭' },
    { id: 'temple',   name: 'Tranquil Temple',   baseCost: 25000,baseRate: 100,  emoji: '⛩️' },
];

type OwnedMap = Record<string, number>;

function costOf(baseC: number, owned: number) {
    return Math.floor(baseC * Math.pow(1.15, owned));
}

function totalRate(owned: OwnedMap): number {
    return UPGRADES.reduce((acc, u) => acc + (owned[u.id] || 0) * u.baseRate, 0);
}

export default function IdleClicker() {
    const [clicks, setClicks] = useState(0);
    const [total, setTotal] = useState(0);
    const [owned, setOwned] = useState<OwnedMap>({});
    const [particles, setParticles] = useState<{ id: number; x: number; y: number }[]>([]);
    const particleId = useRef(0);
    const tickRef = useRef<ReturnType<typeof setInterval> | null>(null);

    // Auto-click tick
    useEffect(() => {
        tickRef.current = setInterval(() => {
            const rate = totalRate(owned);
            if (rate > 0) {
                setClicks(c => c + rate / 20);
                setTotal(t => t + rate / 20);
            }
        }, 50);
        return () => { if (tickRef.current) clearInterval(tickRef.current); };
    }, [owned]);

    const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
        const rect = e.currentTarget.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        const id = particleId.current++;
        setParticles(p => [...p, { id, x, y }]);
        setTimeout(() => setParticles(p => p.filter(pp => pp.id !== id)), 700);
        setClicks(c => c + 1);
        setTotal(t => t + 1);
    };

    const buy = (upgradeId: string) => {
        const upg = UPGRADES.find(u => u.id === upgradeId)!;
        const n = owned[upgradeId] || 0;
        const cost = costOf(upg.baseCost, n);
        if (clicks < cost) return;
        setClicks(c => c - cost);
        setOwned(o => ({ ...o, [upgradeId]: (o[upgradeId] || 0) + 1 }));
    };

    const perSec = totalRate(owned).toFixed(1);
    const fmt = (n: number) => n >= 1e6 ? (n / 1e6).toFixed(2) + 'M' : n >= 1e3 ? (n / 1e3).toFixed(1) + 'K' : Math.floor(n).toString();

    return (
        <div className="flex flex-col lg:flex-row items-start justify-center p-6 min-h-[90vh] bg-gradient-to-b from-emerald-950 to-zinc-950 text-zinc-100 font-sans gap-6">
            {/* Left: clicker */}
            <div className="flex flex-col items-center gap-4 flex-1">
                <h1 className="text-4xl font-black tracking-widest text-emerald-400 uppercase">Idle Clicker</h1>
                <div className="text-center">
                    <div className="text-5xl font-black text-yellow-400">{fmt(clicks)}</div>
                    <div className="text-zinc-400 text-sm">Orbs &nbsp;|&nbsp; {perSec}/s</div>
                </div>
                {/* Big click button */}
                <div className="relative">
                    <button onClick={handleClick}
                        className="w-44 h-44 rounded-full bg-emerald-700 hover:bg-emerald-600 active:scale-95 border-4 border-emerald-400 text-6xl shadow-[0_0_30px_rgba(52,211,153,0.4)] hover:shadow-[0_0_50px_rgba(52,211,153,0.6)] transition-all select-none">
                        🌟
                    </button>
                    {particles.map(p => (
                        <div key={p.id} className="absolute pointer-events-none text-yellow-300 font-black text-lg animate-ping"
                            style={{ left: p.x, top: p.y, transform: 'translate(-50%, -50%)', animationDuration: '0.6s' }}>
                            +1
                        </div>
                    ))}
                </div>
                <div className="text-zinc-500 text-sm">All time: {fmt(total)} orbs</div>
            </div>

            {/* Right: upgrades */}
            <div className="flex flex-col gap-3 w-full max-w-xs">
                <div className="text-emerald-400 font-black uppercase tracking-widest text-sm border-b border-emerald-900 pb-2">Upgrades</div>
                {UPGRADES.map(upg => {
                    const n = owned[upg.id] || 0;
                    const cost = costOf(upg.baseCost, n);
                    const canAfford = clicks >= cost;
                    return (
                        <button key={upg.id} onClick={() => buy(upg.id)} disabled={!canAfford}
                            className={`flex items-center gap-3 px-4 py-3 rounded-xl border transition-all text-left ${canAfford ? 'bg-zinc-800 border-emerald-700 hover:bg-zinc-700 cursor-pointer' : 'bg-zinc-900 border-zinc-800 opacity-50 cursor-default'}`}>
                            <span className="text-2xl">{upg.emoji}</span>
                            <div className="flex-1">
                                <div className="font-bold text-sm text-zinc-200">{upg.name}</div>
                                <div className="text-xs text-zinc-500">{upg.baseRate}/s each · Owned: {n}</div>
                            </div>
                            <div className={`text-xs font-black ${canAfford ? 'text-yellow-400' : 'text-zinc-600'}`}>{fmt(cost)}</div>
                        </button>
                    );
                })}
            </div>
        </div>
    );
}

import React, { useState, useCallback } from 'react';

type Shape = 'circle' | 'square' | 'triangle' | 'star' | 'heart' | 'diamond';
type Color = 'red' | 'blue' | 'green' | 'yellow' | 'purple' | 'orange';

interface ShapeItem { id: number; shape: Shape; color: Color; }
interface SlotItem { shape: Shape; color: Color; filled: boolean; }

const SHAPES: Shape[] = ['circle', 'square', 'triangle', 'star', 'heart', 'diamond'];
const COLORS: Color[] = ['red', 'blue', 'green', 'yellow', 'purple', 'orange'];

const COLOR_MAP: Record<Color, string> = {
    red: '#ef4444', blue: '#3b82f6', green: '#22c55e',
    yellow: '#eab308', purple: '#8b5cf6', orange: '#f97316'
};

function ShapeIcon({ shape, color, size = 40 }: { shape: Shape; color: Color; size?: number }) {
    const fill = COLOR_MAP[color];
    const s = size;
    switch (shape) {
        case 'circle': return <svg width={s} height={s}><circle cx={s/2} cy={s/2} r={s/2-2} fill={fill} /></svg>;
        case 'square': return <svg width={s} height={s}><rect x={2} y={2} width={s-4} height={s-4} fill={fill} rx={4} /></svg>;
        case 'triangle': return <svg width={s} height={s}><polygon points={`${s/2},2 ${s-2},${s-2} 2,${s-2}`} fill={fill} /></svg>;
        case 'star': {
            const pts = Array.from({ length: 10 }, (_, i) => {
                const r = i % 2 === 0 ? s/2-2 : s/4;
                const a = (i * Math.PI / 5) - Math.PI / 2;
                return `${s/2 + r * Math.cos(a)},${s/2 + r * Math.sin(a)}`;
            }).join(' ');
            return <svg width={s} height={s}><polygon points={pts} fill={fill} /></svg>;
        }
        case 'heart': return <svg width={s} height={s} viewBox="0 0 24 24"><path d="M12 21.593c-5.63-5.539-11-10.297-11-14.402 0-3.791 3.068-5.191 5.281-5.191 1.312 0 4.151.501 5.719 4.457 1.59-3.968 4.464-4.447 5.726-4.447 2.54 0 5.274 1.621 5.274 5.181 0 4.069-5.136 8.625-11 14.402z" fill={fill}/></svg>;
        case 'diamond': return <svg width={s} height={s}><polygon points={`${s/2},2 ${s-2},${s/2} ${s/2},${s-2} 2,${s/2}`} fill={fill} /></svg>;
    }
}

function generateLevel(difficulty: number): { shapes: ShapeItem[]; slots: SlotItem[] } {
    const count = 4 + difficulty * 2;
    const shapes: ShapeItem[] = Array.from({ length: count }, (_, i) => ({
        id: i,
        shape: SHAPES[Math.floor(Math.random() * (2 + difficulty))],
        color: COLORS[Math.floor(Math.random() * (2 + difficulty))],
    }));
    const slotDefs = [...shapes].sort(() => Math.random() - 0.5);
    const slots: SlotItem[] = slotDefs.map(s => ({ shape: s.shape, color: s.color, filled: false }));
    // Shuffle tray order
    shapes.sort(() => Math.random() - 0.5);
    return { shapes, slots };
}

let nextId = 0;

export default function ShapeSorting() {
    const [difficulty, setDifficulty] = useState(0);
    const [{ shapes, slots }, setLevel] = useState(() => generateLevel(0));
    const [tray, setTray] = useState<ShapeItem[]>(() => generateLevel(0).shapes.map(s => ({ ...s, id: nextId++ })));
    const [slotState, setSlotState] = useState<SlotItem[]>(() => generateLevel(0).slots);
    const [selected, setSelected] = useState<number | null>(null); // tray index
    const [score, setScore] = useState(0);

    const newLevel = useCallback((diff: number) => {
        const { shapes: sh, slots: sl } = generateLevel(diff);
        setTray(sh.map(s => ({ ...s, id: nextId++ })));
        setSlotState(sl);
        setSelected(null);
    }, []);

    const startGame = (d: number) => { setDifficulty(d); setScore(0); newLevel(d); };

    const handleTrayClick = (i: number) => setSelected(selected === i ? null : i);

    const handleSlotClick = (i: number) => {
        if (selected === null) return;
        const piece = tray[selected];
        const slot = slotState[i];
        if (slot.filled) return;
        if (piece.shape === slot.shape && piece.color === slot.color) {
            // Correct!
            setSlotState(prev => {
                const n = [...prev]; n[i] = { ...slot, filled: true }; return n;
            });
            setTray(prev => prev.filter((_, idx) => idx !== selected));
            setScore(s => s + 50);
            setSelected(null);

            // Check level complete
            const newSlotsFilled = slotState.map((s, idx) => idx === i ? { ...s, filled: true } : s);
            if (newSlotsFilled.every(s => s.filled)) {
                setTimeout(() => { setScore(s => s + 200); newLevel(difficulty); }, 600);
            }
        } else {
            // Wrong — shake feedback via re-selection
            setSelected(null);
        }
    };

    return (
        <div className="flex flex-col items-center justify-center p-6 min-h-[90vh] bg-gradient-to-b from-sky-950 to-zinc-950 text-zinc-100 font-sans gap-6">
            <h1 className="text-4xl font-black tracking-widest uppercase text-sky-400">Shape Sorting</h1>

            <div className="flex gap-8 text-center font-mono">
                <div><div className="text-3xl font-black text-yellow-400">{score}</div><div className="text-xs text-zinc-500 uppercase">Score</div></div>
                <div><div className="text-3xl font-black text-sky-400">Lv {difficulty + 1}</div><div className="text-xs text-zinc-500 uppercase">Level</div></div>
            </div>

            {/* Difficulty */}
            <div className="flex gap-2">
                {['Easy', 'Medium', 'Hard'].map((d, i) => (
                    <button key={d} onClick={() => startGame(i)}
                        className={`px-4 py-1 rounded-full border text-sm font-bold uppercase tracking-widest transition-colors ${difficulty === i ? 'bg-sky-700 border-sky-400 text-white' : 'bg-zinc-800 border-zinc-600 hover:bg-zinc-700'}`}>
                        {d}
                    </button>
                ))}
            </div>

            {/* Slots */}
            <div>
                <div className="text-xs text-zinc-500 uppercase mb-2 text-center">Match these shapes:</div>
                <div className="flex flex-wrap gap-3 justify-center bg-zinc-900 p-3 rounded-2xl border border-zinc-700 max-w-md">
                    {slotState.map((slot, i) => (
                        <button key={i} onClick={() => handleSlotClick(i)}
                            className={`w-16 h-16 flex items-center justify-center rounded-xl border-2 transition-all
                                ${slot.filled ? 'border-green-500 bg-green-900/20 cursor-default' :
                                  'border-dashed border-zinc-600 bg-zinc-800 hover:border-sky-500 cursor-pointer'}`}>
                            {slot.filled ? <ShapeIcon shape={slot.shape} color={slot.color} size={36} /> :
                             <div className="opacity-20"><ShapeIcon shape={slot.shape} color={slot.color} size={36} /></div>}
                        </button>
                    ))}
                </div>
            </div>

            {/* Tray */}
            <div>
                <div className="text-xs text-zinc-500 uppercase mb-2 text-center">Your pieces (select then click slot):</div>
                <div className="flex flex-wrap gap-3 justify-center bg-zinc-900 p-3 rounded-2xl border border-zinc-700 max-w-md">
                    {tray.map((piece, i) => (
                        <button key={piece.id} onClick={() => handleTrayClick(i)}
                            className={`w-16 h-16 flex items-center justify-center rounded-xl border-2 transition-all
                                ${selected === i ? 'border-white ring-2 ring-sky-400 scale-110 bg-zinc-700' :
                                  'border-zinc-600 bg-zinc-800 hover:bg-zinc-700 hover:scale-105 cursor-pointer active:scale-95'}`}>
                            <ShapeIcon shape={piece.shape} color={piece.color} size={36} />
                        </button>
                    ))}
                    {tray.length === 0 && <div className="text-zinc-600 text-sm px-4">Level complete! 🎉</div>}
                </div>
            </div>
        </div>
    );
}

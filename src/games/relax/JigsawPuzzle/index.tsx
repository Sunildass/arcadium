import React, { useState, useCallback, useEffect } from 'react';

// 4x4 Jigsaw puzzle — we slice a colorful abstract SVG into pieces
// Each piece is an emoji "tile" that the player sorts into the right slot

const GRID = 4;
const TOTAL = GRID * GRID;

// 16 visually distinct emoji that form a "picture" in order
const PICTURE: string[] = [
    '🌅','🌤','☁','🌙',
    '🏔','🌲','🌿','🌾',
    '🏡','🛖','🪨','🌊',
    '🌷','🦋','🐝','🌻',
];

function shuffle<T>(arr: T[]): T[] {
    const a = [...arr];
    for (let i = a.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
}

export default function JigsawPuzzle() {
    const [pieces, setPieces] = useState<(string | null)[]>(() => shuffle(PICTURE));
    const [slots, setSlots] = useState<(string | null)[]>(Array(TOTAL).fill(null));
    const [selected, setSelected] = useState<{ from: 'tray' | 'slot'; index: number } | null>(null);
    const [moves, setMoves] = useState(0);
    const [startTime] = useState(Date.now());
    const [elapsed, setElapsed] = useState(0);

    const solvedCount = slots.filter((s, i) => s === PICTURE[i]).length;
    const isComplete = solvedCount === TOTAL;

    useEffect(() => {
        if (isComplete) return;
        const t = setInterval(() => setElapsed(Math.floor((Date.now() - startTime) / 1000)), 1000);
        return () => clearInterval(t);
    }, [isComplete, startTime]);

    const clickTray = useCallback((i: number) => {
        if (!pieces[i]) return;
        if (!selected) { setSelected({ from: 'tray', index: i }); return; }
        if (selected.from === 'tray') {
            // Swap two tray pieces
            setPieces(prev => {
                const n = [...prev];
                [n[i], n[selected.index]] = [n[selected.index], n[i]];
                return n;
            });
            setMoves(m => m + 1);
            setSelected(null);
        } else {
            // Move from slot back to tray position
            const slotPiece = slots[selected.index];
            setPieces(prev => { const n = [...prev]; n[i] = slotPiece; return n; });
            setSlots(prev => { const n = [...prev]; n[selected.index] = null; return n; });
            setMoves(m => m + 1);
            setSelected(null);
        }
    }, [selected, pieces, slots]);

    const clickSlot = useCallback((i: number) => {
        if (!selected) {
            if (!slots[i]) return;
            setSelected({ from: 'slot', index: i });
            return;
        }
        if (selected.from === 'tray') {
            const piece = pieces[selected.index];
            if (slots[i]) {
                // Swap: put slot piece back to tray
                setPieces(prev => { const n = [...prev]; n[selected.index] = slots[i]; return n; });
            } else {
                setPieces(prev => { const n = [...prev]; n[selected.index] = null; return n; });
            }
            setSlots(prev => { const n = [...prev]; n[i] = piece; return n; });
            setMoves(m => m + 1);
            setSelected(null);
        } else {
            // Swap two slots
            setSlots(prev => {
                const n = [...prev];
                [n[i], n[selected.index]] = [n[selected.index], n[i]];
                return n;
            });
            setMoves(m => m + 1);
            setSelected(null);
        }
    }, [selected, pieces, slots]);

    const reset = () => {
        setPieces(shuffle(PICTURE));
        setSlots(Array(TOTAL).fill(null));
        setSelected(null);
        setMoves(0);
    };

    return (
        <div className="flex flex-col items-center justify-center p-6 min-h-[90vh] bg-gradient-to-b from-pink-950 to-zinc-950 text-zinc-100 font-sans gap-6">
            <h1 className="text-4xl font-black tracking-widest uppercase text-pink-400 drop-shadow-[0_0_10px_rgba(244,114,182,0.5)]">Jigsaw Puzzle</h1>

            <div className="flex gap-8 text-center font-mono">
                <div><div className="text-3xl font-black text-yellow-400">{moves}</div><div className="text-xs text-zinc-500 uppercase">Moves</div></div>
                <div><div className="text-3xl font-black text-pink-400">{solvedCount}/{TOTAL}</div><div className="text-xs text-zinc-500 uppercase">Placed</div></div>
                <div><div className="text-3xl font-black text-zinc-400">{elapsed}s</div><div className="text-xs text-zinc-500 uppercase">Time</div></div>
            </div>

            <div className="flex gap-8 flex-wrap justify-center">
                {/* Target grid */}
                <div>
                    <div className="text-xs text-zinc-500 uppercase mb-2 text-center">Puzzle Board</div>
                    <div className="grid grid-cols-4 gap-1 bg-zinc-900 p-2 rounded-xl border border-zinc-700">
                        {slots.map((piece, i) => {
                            const isCorrect = piece === PICTURE[i];
                            const isSel = selected?.from === 'slot' && selected.index === i;
                            return (
                                <button key={i} onClick={() => clickSlot(i)}
                                    className={`w-14 h-14 flex items-center justify-center text-3xl rounded-lg border-2 transition-all
                                        ${isSel ? 'border-white ring-2 ring-pink-400 scale-110' :
                                          piece ? (isCorrect ? 'border-green-500 bg-green-900/30' : 'border-zinc-600 bg-zinc-800') :
                                          'border-dashed border-zinc-700 bg-zinc-950'}`}>
                                    {piece}
                                </button>
                            );
                        })}
                    </div>
                </div>

                {/* Piece tray */}
                <div>
                    <div className="text-xs text-zinc-500 uppercase mb-2 text-center">Pieces</div>
                    <div className="grid grid-cols-4 gap-1 bg-zinc-900 p-2 rounded-xl border border-zinc-700">
                        {pieces.map((piece, i) => {
                            const isSel = selected?.from === 'tray' && selected.index === i;
                            return (
                                <button key={i} onClick={() => piece && clickTray(i)}
                                    className={`w-14 h-14 flex items-center justify-center text-3xl rounded-lg border-2 transition-all
                                        ${!piece ? 'border-transparent opacity-0' :
                                          isSel ? 'border-white ring-2 ring-pink-400 scale-110 bg-zinc-700' :
                                          'border-zinc-600 bg-zinc-800 hover:bg-zinc-700 hover:scale-105 cursor-pointer'}`}>
                                    {piece}
                                </button>
                            );
                        })}
                    </div>
                </div>
            </div>

            {isComplete && (
                <div className="text-2xl font-black text-green-400 animate-bounce">🎉 Puzzle Complete! ({moves} moves, {elapsed}s)</div>
            )}

            <p className="text-zinc-600 text-xs text-center max-w-sm">Click a piece, then click a slot to place it. Arrange all tiles to match the picture (left-to-right, top-to-bottom).</p>
            <button onClick={reset} className="px-6 py-2 bg-pink-800 hover:bg-pink-700 text-white rounded-xl font-bold text-sm uppercase tracking-widest transition-all">
                🔄 New Puzzle
            </button>
        </div>
    );
}

import React, { useState, useEffect } from 'react';
import { NumberMatchEngine, NumberMatchState } from './NumberMatchEngine';

const COLORS = [
    '#ef4444','#f97316','#eab308','#22c55e','#06b6d4','#3b82f6','#8b5cf6','#ec4899',
    '#f43f5e','#a78bfa','#34d399','#fbbf24','#60a5fa','#fb923c','#a3e635','#5eead4',
    '#c084fc','#f472b6',
];

export default function NumberMatch() {
    const [difficulty, setDifficulty] = useState<'Easy' | 'Medium' | 'Hard'>('Easy');
    const [engine, setEngine] = useState(() => new NumberMatchEngine(difficulty));
    const [state, setState] = useState<NumberMatchState>(() => engine.initialize());
    const [wrongPair, setWrongPair] = useState(false);

    const dispatch = (action: Parameters<typeof engine.update>[1]) =>
        setState(s => engine.update(s, action));

    const start = (d: 'Easy' | 'Medium' | 'Hard') => {
        const eng = new NumberMatchEngine(d);
        setEngine(eng);
        setDifficulty(d);
        setState(eng.initialize());
    };

    // After showing 2 wrong selections, clear them after a brief delay
    useEffect(() => {
        if (state.selected.length === 2) {
            const a = state.selected[0], b = state.selected[1];
            if (state.grid[a] !== state.grid[b]) {
                setWrongPair(true);
                const t = setTimeout(() => {
                    setState(s => engine.update(s, { type: 'CLEAR_WRONG' }));
                    setWrongPair(false);
                }, 800);
                return () => clearTimeout(t);
            }
        }
    }, [state.selected, engine, state.grid]);

    const cols = state.gridSize === 36 ? 6 : 4;

    return (
        <div className="flex flex-col items-center justify-center p-4 min-h-[90vh] bg-gradient-to-b from-sky-950 to-zinc-950 text-zinc-100 font-sans gap-5">
            <h1 className="text-5xl font-black tracking-widest uppercase text-sky-400 drop-shadow-[0_0_10px_rgba(56,189,248,0.5)]">Number Match</h1>

            <div className="flex gap-8 font-mono text-center">
                <div><div className="text-3xl font-black text-yellow-400">{state.score}</div><div className="text-xs text-zinc-500 uppercase">Score</div></div>
                <div><div className="text-3xl font-black text-zinc-400">{state.moves}</div><div className="text-xs text-zinc-500 uppercase">Moves</div></div>
                <div><div className="text-3xl font-black text-green-400">{state.matched.length / 2}/{state.grid.length / 2}</div><div className="text-xs text-zinc-500 uppercase">Pairs</div></div>
            </div>

            {/* Difficulty Selector */}
            <div className="flex gap-2">
                {(['Easy', 'Medium', 'Hard'] as const).map(d => (
                    <button key={d} onClick={() => start(d)}
                        className={`px-4 py-1 rounded-full border text-sm font-bold uppercase tracking-widest transition-colors ${difficulty === d ? 'bg-sky-600 border-sky-400 text-white' : 'bg-zinc-800 border-zinc-600 hover:bg-zinc-700'}`}>
                        {d} {d === 'Easy' ? '4×4' : d === 'Medium' ? '4×4+' : '6×6'}
                    </button>
                ))}
            </div>

            {/* Grid */}
            <div className={`grid gap-2`} style={{ gridTemplateColumns: `repeat(${cols}, 1fr)` }}>
                {state.grid.map((num, idx) => {
                    const isSelected = state.selected.includes(idx);
                    const isMatched = state.matched.includes(idx);
                    const isWrong = wrongPair && isSelected;
                    const colorIdx = (num! - 1) % COLORS.length;
                    const color = COLORS[colorIdx];

                    return (
                        <button
                            key={idx}
                            onClick={() => !wrongPair && dispatch({ type: 'SELECT', index: idx })}
                            disabled={isMatched || wrongPair}
                            className={`w-16 h-16 rounded-xl flex items-center justify-center font-black text-2xl select-none transition-all duration-200
                                ${isMatched ? 'opacity-20 scale-90 cursor-default' :
                                  isWrong ? 'bg-red-900 border-2 border-red-600 scale-95' :
                                  isSelected ? 'scale-110 ring-4 ring-white shadow-xl' :
                                  'bg-zinc-800 border border-zinc-600 hover:scale-105 hover:bg-zinc-700 cursor-pointer'}`}
                            style={isSelected && !isWrong ? { backgroundColor: color, border: `3px solid ${color}` } : 
                                   isMatched ? { backgroundColor: color, border: `3px solid ${color}` } : {}}
                        >
                            {isMatched ? '✓' : (isSelected ? num : num)}
                        </button>
                    );
                })}
            </div>

            <div className="text-zinc-400 text-sm text-center px-4 py-2 bg-zinc-900 rounded-xl border border-zinc-800 max-w-sm">
                {state.message}
            </div>

            {state.isGameOver && (
                <button onClick={() => start(difficulty)}
                    className="px-10 py-3 bg-sky-600 hover:bg-sky-500 text-white font-black uppercase tracking-widest rounded-xl transition-all">
                    🔄 Play Again
                </button>
            )}
        </div>
    );
}

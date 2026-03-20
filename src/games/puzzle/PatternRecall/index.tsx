import React, { useState, useEffect } from 'react';
import { PatternRecallEngine, PatternRecallState } from './PatternRecallEngine';

export default function PatternRecall() {
    const [difficulty, setDifficulty] = useState<'Easy' | 'Medium' | 'Hard'>('Medium');
    const [engine, setEngine] = useState(() => new PatternRecallEngine('Medium'));
    const [state, setState] = useState<PatternRecallState>(() => engine.initialize());
    const [isShowing, setIsShowing] = useState(false);

    const dispatch = (action: Parameters<typeof engine.update>[1]) =>
        setState(s => engine.update(s, action));

    const start = (d: 'Easy' | 'Medium' | 'Hard') => {
        const eng = new PatternRecallEngine(d);
        setEngine(eng);
        setDifficulty(d);
        setState(eng.initialize());
    };

    // Auto-hide pattern after 2s
    useEffect(() => {
        if (state.phase === 'watching') {
            setIsShowing(true);
            const t = setTimeout(() => {
                setIsShowing(false);
                setState(s => engine.update({ ...s, phase: 'recall' }, { type: 'SUBMIT' }));
                // Switch to recall manually
                setState(s => ({ ...s, phase: 'recall', message: 'Recreate the pattern! Click cells, then Submit.' }));
            }, 2500);
            return () => clearTimeout(t);
        }
    }, [state.phase, engine]);

    const cols = state.gridSize;

    return (
        <div className="flex flex-col items-center justify-center p-6 min-h-[90vh] bg-gradient-to-b from-cyan-950 to-zinc-950 text-zinc-100 font-sans gap-6">
            
            <h1 className="text-4xl font-black tracking-widest uppercase text-cyan-400 drop-shadow-[0_0_10px_rgba(34,211,238,0.5)]">Pattern Recall</h1>

            <div className="flex gap-8 font-mono text-center">
                <div><div className="text-3xl font-black text-yellow-400">{state.score}</div><div className="text-xs text-zinc-500 uppercase">Score</div></div>
                <div><div className="text-3xl font-black text-cyan-400">Round {state.round}</div><div className="text-xs text-zinc-500 uppercase">Round</div></div>
                <div><div className="text-3xl font-black text-red-400">{'❤'.repeat(state.lives)}{'🖤'.repeat(3 - state.lives)}</div><div className="text-xs text-zinc-500 uppercase">Lives</div></div>
            </div>

            {/* Difficulty */}
            <div className="flex gap-2">
                {(['Easy', 'Medium', 'Hard'] as const).map(d => (
                    <button key={d} onClick={() => start(d)}
                        className={`px-4 py-1 rounded-full border text-sm font-bold uppercase tracking-widest transition-colors ${difficulty === d ? 'bg-cyan-700 border-cyan-400 text-white' : 'bg-zinc-800 border-zinc-600 hover:bg-zinc-700'}`}>
                        {d} {d === 'Easy' ? '3×3' : d === 'Medium' ? '4×4' : '5×5'}
                    </button>
                ))}
            </div>

            {/* Grid */}
            <div className="grid gap-2" style={{ gridTemplateColumns: `repeat(${cols}, 1fr)` }}>
                {Array(state.gridSize * state.gridSize).fill(null).map((_, idx) => {
                    const showPattern = (state.phase === 'watching' && isShowing) || state.phase === 'gameover';
                    const isLit = showPattern ? state.pattern[idx] : state.playerSelection[idx];
                    const canClick = state.phase === 'recall';

                    return (
                        <button
                            key={idx}
                            onClick={() => canClick && dispatch({ type: 'TOGGLE_CELL', index: idx })}
                            disabled={!canClick}
                            className={`w-16 h-16 rounded-xl border-2 transition-all duration-200
                                ${isLit 
                                  ? 'bg-cyan-500 border-cyan-300 shadow-[0_0_15px_rgba(34,211,238,0.6)] scale-105'
                                  : 'bg-zinc-800 border-zinc-700'}
                                ${canClick ? 'hover:bg-zinc-700 cursor-pointer active:scale-95' : 'cursor-default'}`}
                        />
                    );
                })}
            </div>

            {/* Message */}
            <div className={`text-center px-5 py-3 rounded-xl font-bold max-w-md text-sm border transition-all
                ${state.phase === 'watching' ? 'bg-cyan-900/40 border-cyan-700 text-cyan-300 animate-pulse' :
                  'bg-zinc-900 border-zinc-700 text-zinc-300'}`}>
                {state.phase === 'watching' ? `👁 Memorize the ${state.litCount} lit cells...` : state.message}
            </div>

            {/* Controls */}
            {state.phase === 'recall' && (
                <button onClick={() => dispatch({ type: 'SUBMIT' })}
                    className="px-10 py-4 bg-cyan-700 hover:bg-cyan-600 text-white font-black text-xl uppercase tracking-widest rounded-xl shadow transition-all active:scale-95">
                    ✅ Submit Pattern
                </button>
            )}
            {state.phase === 'intermission' && !state.isGameOver && (
                <button onClick={() => dispatch({ type: 'START_ROUND' })}
                    className="px-10 py-4 bg-cyan-700 hover:bg-cyan-600 text-white font-black text-xl uppercase tracking-widest rounded-xl shadow transition-all">
                    {state.round === 1 ? '🎮 Start' : `▶ Round ${state.round}`}
                </button>
            )}
            {state.isGameOver && (
                <button onClick={() => start(difficulty)}
                    className="px-10 py-4 bg-cyan-700 hover:bg-cyan-600 text-white font-black text-xl uppercase tracking-widest rounded-xl shadow transition-all">
                    🔄 Play Again
                </button>
            )}
        </div>
    );
}

import React, { useState, useEffect, useCallback } from 'react';
import { ReactionMemoryEngine, ReactionMemoryState, ReactionColor } from './ReactionMemoryEngine';

const COLOR_MAP: Record<ReactionColor, { bg: string; active: string; label: string }> = {
    red:    { bg: 'bg-red-900/40 border-red-800',     active: 'bg-red-500 border-red-300 shadow-[0_0_30px_rgba(239,68,68,0.8)]',    label: 'Red'    },
    blue:   { bg: 'bg-blue-900/40 border-blue-800',   active: 'bg-blue-500 border-blue-300 shadow-[0_0_30px_rgba(59,130,246,0.8)]', label: 'Blue'   },
    green:  { bg: 'bg-green-900/40 border-green-800', active: 'bg-green-500 border-green-300 shadow-[0_0_30px_rgba(34,197,94,0.8)]',label: 'Green'  },
    yellow: { bg: 'bg-yellow-900/40 border-yellow-800',active:'bg-yellow-400 border-yellow-200 shadow-[0_0_30px_rgba(234,179,8,0.8)]',label:'Yellow'},
    purple: { bg: 'bg-purple-900/40 border-purple-800',active:'bg-purple-500 border-purple-300 shadow-[0_0_30px_rgba(168,85,247,0.8)]',label:'Purple'},
    orange: { bg: 'bg-orange-900/40 border-orange-800',active:'bg-orange-500 border-orange-300 shadow-[0_0_30px_rgba(249,115,22,0.8)]',label:'Orange'},
};

const COLORS: ReactionColor[] = ['red', 'blue', 'green', 'yellow', 'purple', 'orange'];

export default function ReactionMemory() {
    const [engine] = useState(() => new ReactionMemoryEngine('Medium'));
    const [state, setState] = useState<ReactionMemoryState>(() => engine.initialize());
    const [flashActive, setFlashActive] = useState<ReactionColor | null>(null);

    const dispatch = useCallback((action: Parameters<typeof engine.update>[1]) =>
        setState(s => engine.update(s, action)), [engine]);

    // Auto-run flash sequence when in 'watching' phase
    useEffect(() => {
        if (state.phase !== 'watching') return;
        const flashDuration = 600;
        const pauseDuration = 200;

        const step = (idx: number) => {
            if (idx >= state.sequence.length) {
                // Done flashing - short pause then switch to recall
                setTimeout(() => {
                    setFlashActive(null);
                    dispatch({ type: 'START_RECALL' });
                }, pauseDuration * 2);
                return;
            }
            // Show color
            const color = state.sequence[idx];
            setFlashActive(color);
            dispatch({ type: 'FLASH_NEXT' });

            setTimeout(() => {
                setFlashActive(null);
                setTimeout(() => step(idx + 1), pauseDuration);
            }, flashDuration);
        };

        // Delay before starting
        const t = setTimeout(() => step(0), 500);
        return () => clearTimeout(t);
    }, [state.phase, state.sequence, dispatch]);

    return (
        <div className="flex flex-col items-center justify-center p-6 min-h-[90vh] bg-gradient-to-b from-violet-950 to-zinc-950 text-zinc-100 font-sans gap-6">
            
            <h1 className="text-4xl font-black tracking-widest uppercase text-violet-400 drop-shadow-[0_0_10px_rgba(167,139,250,0.5)]">Reaction Memory</h1>

            {/* HUD */}
            <div className="flex gap-8 font-mono text-center">
                <div><div className="text-3xl font-black text-yellow-400">{state.score}</div><div className="text-xs text-zinc-500 uppercase">Score</div></div>
                <div><div className="text-3xl font-black text-violet-400">Round {state.round}</div><div className="text-xs text-zinc-500 uppercase">Round</div></div>
                <div><div className="text-3xl font-black text-red-400">{'❤'.repeat(state.lives)}{'🖤'.repeat(3 - state.lives)}</div><div className="text-xs text-zinc-500 uppercase">Lives</div></div>
            </div>

            {/* Color Grid */}
            <div className="grid grid-cols-3 gap-4">
                {COLORS.map(color => {
                    const isFlashing = flashActive === color;
                    const { bg, active, label } = COLOR_MAP[color];
                    const canClick = state.phase === 'recall';
                    return (
                        <button
                            key={color}
                            onClick={() => canClick && dispatch({ type: 'INPUT', color })}
                            disabled={!canClick}
                            className={`w-28 h-28 rounded-2xl border-2 font-black text-white uppercase tracking-widest text-sm transition-all duration-150
                                ${isFlashing ? active : bg}
                                ${canClick ? 'hover:scale-105 cursor-pointer active:scale-95' : 'cursor-default'}`}
                        >
                            {label}
                        </button>
                    );
                })}
            </div>

            {/* Message */}
            <div className={`text-center px-5 py-3 rounded-xl font-bold max-w-md text-sm border
                ${state.phase === 'watching' ? 'bg-violet-900/40 border-violet-700 text-violet-300 animate-pulse' :
                  state.phase === 'recall' ? 'bg-blue-900/40 border-blue-700 text-blue-300' :
                  'bg-zinc-900 border-zinc-700 text-zinc-300'}`}>
                {state.phase === 'watching' ? `👁 Watch the sequence (${state.sequence.length} colors)...` : state.message}
            </div>

            {/* Progress pips */}
            {state.phase === 'recall' && (
                <div className="flex gap-2">
                    {state.sequence.map((c, i) => (
                        <div key={i} className={`w-4 h-4 rounded-full border-2 transition-colors ${
                            i < state.playerInput.length ? 'bg-green-500 border-green-400' : 'bg-zinc-700 border-zinc-600'
                        }`} />
                    ))}
                </div>
            )}

            {/* Controls */}
            {state.phase === 'intermission' && !state.isGameOver && (
                <button onClick={() => dispatch({ type: 'START_ROUND' })}
                    className="px-10 py-4 bg-violet-700 hover:bg-violet-600 text-white font-black text-xl uppercase tracking-widest rounded-xl shadow transition-all">
                    {state.round === 1 ? '🎮 Start' : `▶ Round ${state.round}`}
                </button>
            )}

            {state.isGameOver && (
                <button onClick={() => setState(engine.initialize())}
                    className="px-12 py-4 bg-violet-700 hover:bg-violet-600 text-white font-black text-xl uppercase tracking-widest rounded-xl shadow transition-all">
                    🔄 Play Again
                </button>
            )}
        </div>
    );
}

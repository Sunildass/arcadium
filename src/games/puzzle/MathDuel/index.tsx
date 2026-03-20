import React, { useState, useEffect, useCallback } from 'react';
import { MathDuelEngine, MathDuelState } from './MathDuelEngine';

export default function MathDuel() {
    const [difficulty, setDifficulty] = useState<'Easy' | 'Medium' | 'Hard'>('Medium');
    const [engine, setEngine] = useState(() => new MathDuelEngine('Medium'));
    const [state, setState] = useState<MathDuelState>(() => engine.initialize());

    const start = (d: 'Easy' | 'Medium' | 'Hard') => {
        const eng = new MathDuelEngine(d);
        setEngine(eng);
        setDifficulty(d);
        setState(eng.initialize());
    };

    // Countdown tick
    useEffect(() => {
        if (state.isGameOver) return;
        const t = setInterval(() => {
            setState(s => engine.update(s, { type: 'TICK' }));
        }, 1000);
        return () => clearInterval(t);
    }, [engine, state.isGameOver]);

    const answer = useCallback((v: number) => {
        setState(s => engine.update(s, { type: 'ANSWER', value: v }));
    }, [engine]);

    const baseTime = difficulty === 'Easy' ? 15 : difficulty === 'Medium' ? 10 : 7;
    const timerPct = (state.timeLeft / baseTime) * 100;

    return (
        <div className="flex flex-col items-center justify-center p-6 min-h-[90vh] bg-gradient-to-b from-rose-950 to-zinc-950 text-zinc-100 font-sans gap-6">

            <h1 className="text-5xl font-black tracking-widest uppercase text-rose-400 drop-shadow-[0_0_10px_rgba(251,113,133,0.5)]">Math Duel</h1>

            {/* HUD */}
            <div className="flex gap-8 font-mono text-center">
                <div><div className="text-3xl font-black text-yellow-400">{state.score}</div><div className="text-xs text-zinc-500 uppercase">Score</div></div>
                <div><div className="text-3xl font-black text-orange-400">×{state.streak}</div><div className="text-xs text-zinc-500 uppercase">Streak</div></div>
                <div><div className="text-3xl font-black text-red-400">{'❤'.repeat(state.lives)}{'🖤'.repeat(3 - state.lives)}</div><div className="text-xs text-zinc-500 uppercase">Lives</div></div>
                <div><div className="text-3xl font-black text-zinc-400">{state.totalCorrect}/{state.totalAnswered}</div><div className="text-xs text-zinc-500 uppercase">Correct</div></div>
            </div>

            {/* Difficulty Selector */}
            <div className="flex gap-2">
                {(['Easy', 'Medium', 'Hard'] as const).map(d => (
                    <button key={d} onClick={() => start(d)}
                        className={`px-4 py-1 rounded-full border text-sm font-bold uppercase tracking-widest transition-colors ${difficulty === d ? 'bg-rose-700 border-rose-400 text-white' : 'bg-zinc-800 border-zinc-600 hover:bg-zinc-700'}`}>
                        {d}
                    </button>
                ))}
            </div>

            {/* Timer bar */}
            <div className="w-full max-w-md h-3 bg-zinc-800 rounded-full overflow-hidden">
                <div
                    className={`h-full rounded-full transition-all duration-1000 ${timerPct > 50 ? 'bg-green-500' : timerPct > 25 ? 'bg-yellow-500' : 'bg-red-500'}`}
                    style={{ width: `${timerPct}%` }}
                />
            </div>

            {/* Question */}
            <div className="bg-zinc-900 border-2 border-zinc-700 rounded-3xl px-12 py-8 text-center shadow-2xl w-full max-w-md">
                <div className="text-7xl font-black text-white tracking-tight mb-2">
                    {state.currentQuestion.question}
                </div>
                <div className="text-rose-400 font-mono text-sm">= ?</div>
            </div>

            {/* Options */}
            {!state.isGameOver && (
                <div className="grid grid-cols-2 gap-4 w-full max-w-md">
                    {state.currentQuestion.options.map((opt, i) => (
                        <button key={i} onClick={() => answer(opt)}
                            className="py-5 text-3xl font-black bg-zinc-800 hover:bg-rose-800 border-2 border-zinc-700 hover:border-rose-500 rounded-2xl transition-all duration-150 active:scale-95 shadow-lg">
                            {opt}
                        </button>
                    ))}
                </div>
            )}

            {/* Message */}
            <div className={`text-center px-5 py-3 rounded-xl font-bold max-w-md text-sm border transition-colors
                ${state.lastResult === 'correct' ? 'bg-green-900/40 border-green-700 text-green-300' :
                  state.lastResult === 'wrong' ? 'bg-red-900/40 border-red-700 text-red-300' :
                  'bg-zinc-900 border-zinc-800 text-zinc-400'}`}>
                {state.message}
            </div>

            {state.isGameOver && (
                <button onClick={() => start(difficulty)}
                    className="px-12 py-4 bg-rose-700 hover:bg-rose-600 text-white font-black text-xl uppercase tracking-widest rounded-xl shadow transition-all">
                    🔄 Play Again
                </button>
            )}
        </div>
    );
}

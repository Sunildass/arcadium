import React, { useState, useEffect, useRef, useCallback } from 'react';

const WORD_LISTS: Record<string, string[]> = {
    Easy: ['cat','dog','sun','run','big','sky','blue','tree','fish','hat','cup','red','hot','ice','box','fun','map','car','pen','egg'],
    Medium: ['apple','table','stone','house','plant','climb','brave','storm','tiger','flame','quick','batch','chess','crisp','drone'],
    Hard: ['architect','algorithm','eloquent','synthesize','precision','benchmark','integrate','eloquence','frequency','mechanism'],
};

interface TypingState {
    words: string[];
    wordIndex: number;
    typed: string;
    correctChars: number;
    totalChars: number;
    errors: number;
    startTime: number | null;
    timeLeft: number;
    gameOver: boolean;
    wpm: number;
}

export default function TypingSpeedRace() {
    const [difficulty, setDifficulty] = useState<'Easy' | 'Medium' | 'Hard'>('Medium');
    const [state, setState] = useState<TypingState>(() => getInitialState('Medium'));
    const inputRef = useRef<HTMLInputElement>(null);

    function getInitialState(diff: string): TypingState {
        const words = [...WORD_LISTS[diff]].sort(() => Math.random() - 0.5).slice(0, 20);
        return { words, wordIndex: 0, typed: '', correctChars: 0, totalChars: 0, errors: 0, startTime: null, timeLeft: 60, gameOver: false, wpm: 0 };
    }

    const start = (d: 'Easy' | 'Medium' | 'Hard') => {
        setDifficulty(d);
        setState(getInitialState(d));
        setTimeout(() => inputRef.current?.focus(), 100);
    };

    // Countdown
    useEffect(() => {
        if (!state.startTime || state.gameOver) return;
        const t = setInterval(() => {
            setState(s => {
                const newTime = s.timeLeft - 1;
                if (newTime <= 0) {
                    const elapsed = (Date.now() - (s.startTime || Date.now())) / 60000;
                    const wpm = Math.round(s.correctChars / 5 / (elapsed || 0.01));
                    return { ...s, timeLeft: 0, gameOver: true, wpm };
                }
                return { ...s, timeLeft: newTime };
            });
        }, 1000);
        return () => clearInterval(t);
    }, [state.startTime, state.gameOver]);

    const handleInput = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
        const val = e.target.value;
        setState(s => {
            if (s.gameOver) return s;
            const startTime = s.startTime || Date.now();
            const currentWord = s.words[s.wordIndex];
            if (val.endsWith(' ')) {
                // Submit word
                const typed = val.trim();
                const correct = typed === currentWord;
                const newIdx = s.wordIndex + 1;
                const correctChars = s.correctChars + (correct ? currentWord.length + 1 : 0);
                const errors = s.errors + (correct ? 0 : 1);
                const totalChars = s.totalChars + typed.length + 1;
                if (newIdx >= s.words.length) {
                    const elapsed = (Date.now() - startTime) / 60000;
                    const wpm = Math.round(correctChars / 5 / (elapsed || 0.01));
                    return { ...s, wordIndex: newIdx, typed: '', correctChars, totalChars, errors, startTime, gameOver: true, wpm };
                }
                return { ...s, wordIndex: newIdx, typed: '', correctChars, totalChars, errors, startTime };
            }
            return { ...s, typed: val, startTime };
        });
    }, []);

    const remaining = state.words.slice(state.wordIndex, state.wordIndex + 8);
    const currentWord = state.words[state.wordIndex] || '';
    const typedOk = currentWord.startsWith(state.typed);

    return (
        <div className="flex flex-col items-center justify-center p-6 min-h-[90vh] bg-gradient-to-b from-zinc-900 to-black text-zinc-100 font-mono gap-6">
            <h1 className="text-5xl font-black tracking-widest text-green-400 uppercase drop-shadow-[0_0_10px_rgba(74,222,128,0.5)]">Typing Race</h1>

            <div className="flex gap-8 text-center">
                <div><div className={`text-3xl font-black ${state.timeLeft <= 10 ? 'text-red-400 animate-pulse' : 'text-green-400'}`}>{state.timeLeft}s</div><div className="text-xs text-zinc-500 uppercase">Time</div></div>
                <div><div className="text-3xl font-black text-yellow-400">{state.wpm > 0 ? state.wpm : state.wordIndex === 0 ? 0 : Math.round(state.correctChars / 5 / ((Date.now() - (state.startTime || Date.now())) / 60000)) || 0}</div><div className="text-xs text-zinc-500 uppercase">WPM</div></div>
                <div><div className="text-3xl font-black text-red-400">{state.errors}</div><div className="text-xs text-zinc-500 uppercase">Errors</div></div>
                <div><div className="text-3xl font-black text-zinc-400">{state.wordIndex}/{state.words.length}</div><div className="text-xs text-zinc-500 uppercase">Words</div></div>
            </div>

            {/* Difficulty */}
            <div className="flex gap-2">
                {(['Easy', 'Medium', 'Hard'] as const).map(d => (
                    <button key={d} onClick={() => start(d)}
                        className={`px-4 py-1 rounded-full border text-sm font-bold uppercase tracking-widest transition-colors ${difficulty === d ? 'bg-green-700 border-green-400 text-white' : 'bg-zinc-800 border-zinc-600 hover:bg-zinc-700'}`}>
                        {d}
                    </button>
                ))}
            </div>

            {/* Word display */}
            <div className="bg-zinc-900 border border-zinc-700 rounded-2xl p-6 w-full max-w-2xl min-h-[80px] flex flex-wrap gap-3 items-center">
                {remaining.map((word, i) => (
                    <span key={i} className={`text-xl font-bold ${i === 0 ? (typedOk ? 'text-white underline underline-offset-4 decoration-green-500' : 'text-red-400 underline underline-offset-4 decoration-red-500') : 'text-zinc-500'}`}>
                        {i === 0 ? (
                            <>
                                <span className="text-green-400">{word.slice(0, state.typed.length)}</span>
                                <span>{word.slice(state.typed.length)}</span>
                            </>
                        ) : word}
                    </span>
                ))}
            </div>

            {/* Input */}
            <input
                ref={inputRef}
                value={state.typed}
                onChange={handleInput}
                disabled={state.gameOver}
                placeholder={state.gameOver ? '' : 'Type here and press Space to submit word...'}
                className={`w-full max-w-2xl px-5 py-4 bg-zinc-900 border-2 rounded-xl text-xl font-bold outline-none transition-colors ${typedOk ? 'border-green-500 focus:border-green-400' : 'border-red-500 focus:border-red-400'} text-white`}
                autoComplete="off" spellCheck={false}
            />

            {state.gameOver && (
                <div className="flex flex-col items-center gap-4">
                    <div className="text-3xl font-black text-green-400">Final WPM: {state.wpm}</div>
                    <div className="text-zinc-400 text-sm">Accuracy: {state.totalChars > 0 ? Math.round((state.correctChars / state.totalChars) * 100) : 100}%</div>
                    <button onClick={() => start(difficulty)}
                        className="px-10 py-3 bg-green-700 hover:bg-green-600 text-white font-black uppercase tracking-widest rounded-xl shadow">
                        🔄 Race Again
                    </button>
                </div>
            )}
        </div>
    );
}

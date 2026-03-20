import React, { useState } from 'react';
import { HighLowEngine, HighLowState, Card } from './HighLowEngine';

const suitSymbol: Record<string, string> = { Hearts: '♥', Diamonds: '♦', Clubs: '♣', Spades: '♠' };
const suitColor: Record<string, string> = { Hearts: 'text-red-500', Diamonds: 'text-red-500', Clubs: 'text-zinc-100', Spades: 'text-zinc-100' };

function BigCard({ card, hidden }: { card?: Card; hidden?: boolean }) {
    if (hidden || !card) {
        return (
            <div className="w-32 h-44 bg-blue-900 border-4 border-blue-700 rounded-2xl flex items-center justify-center shadow-2xl">
                <span className="text-5xl text-blue-700">?</span>
            </div>
        );
    }
    return (
        <div className="w-32 h-44 bg-white border-4 border-zinc-300 rounded-2xl flex flex-col items-center justify-center shadow-2xl select-none">
            <div className={`${suitColor[card.suit]} font-black text-3xl`}>{card.rank}</div>
            <div className={`${suitColor[card.suit]} text-5xl`}>{suitSymbol[card.suit]}</div>
        </div>
    );
}

export default function HighLow() {
    const [engine] = useState(() => new HighLowEngine());
    const [state, setState] = useState<HighLowState>(() => engine.initialize());

    const dispatch = (action: Parameters<typeof engine.update>[1]) =>
        setState(s => engine.update(s, action));

    return (
        <div className="flex flex-col items-center justify-center p-6 min-h-[90vh] bg-gradient-to-b from-indigo-950 to-zinc-950 text-zinc-100 font-sans gap-6">

            <h1 className="text-5xl font-black tracking-widest uppercase text-indigo-400 drop-shadow-[0_0_10px_rgba(129,140,248,0.5)]">High — Low</h1>

            {/* HUD */}
            <div className="flex gap-8 font-mono text-center">
                <div>
                    <div className="text-3xl font-black text-yellow-400">{state.score}</div>
                    <div className="text-xs text-zinc-500 uppercase tracking-widest">Score</div>
                </div>
                <div>
                    <div className="text-3xl font-black text-orange-400">x{state.streak}</div>
                    <div className="text-xs text-zinc-500 uppercase tracking-widest">Streak</div>
                </div>
                <div>
                    <div className="text-3xl font-black text-red-400">{'❤'.repeat(state.lives)}</div>
                    <div className="text-xs text-zinc-500 uppercase tracking-widest">Lives</div>
                </div>
                <div>
                    <div className="text-3xl font-black text-zinc-400">{state.deck.length + (state.nextCard ? 1 : 0)}</div>
                    <div className="text-xs text-zinc-500 uppercase tracking-widest">Remaining</div>
                </div>
            </div>

            {/* Card Row */}
            <div className="flex items-center gap-10">
                <div className="flex flex-col items-center gap-2">
                    <div className="text-xs font-bold uppercase tracking-widest text-zinc-500">Current</div>
                    <BigCard card={state.currentCard} />
                </div>
                <div className="text-4xl text-zinc-500">→</div>
                <div className="flex flex-col items-center gap-2">
                    <div className="text-xs font-bold uppercase tracking-widest text-zinc-500">Next</div>
                    <BigCard card={state.nextCard || undefined} hidden={!state.revealed} />
                </div>
            </div>

            {/* Message */}
            <div className={`text-center px-6 py-3 rounded-xl font-bold max-w-md text-sm transition-all
                ${state.message.startsWith('✅') ? 'bg-green-900 border border-green-700 text-green-300' : 
                  state.message.startsWith('❌') ? 'bg-red-900 border border-red-700 text-red-300' :
                  'bg-zinc-900 border border-zinc-700 text-zinc-300'}`}>
                {state.message}
            </div>

            {/* Action Buttons */}
            {!state.isGameOver && (
                <>
                    {!state.revealed ? (
                        <div className="flex gap-6">
                            <button onClick={() => dispatch({ type: 'GUESS', guess: 'higher' })}
                                className="px-10 py-4 bg-green-600 hover:bg-green-500 text-white font-black text-xl uppercase tracking-widest rounded-xl shadow transition-all active:scale-95">
                                ⬆️ Higher
                            </button>
                            <button onClick={() => dispatch({ type: 'GUESS', guess: 'lower' })}
                                className="px-10 py-4 bg-red-700 hover:bg-red-600 text-white font-black text-xl uppercase tracking-widest rounded-xl shadow transition-all active:scale-95">
                                ⬇️ Lower
                            </button>
                        </div>
                    ) : (
                        <button onClick={() => dispatch({ type: 'NEXT' })}
                            className="px-12 py-4 bg-indigo-600 hover:bg-indigo-500 text-white font-black text-xl uppercase tracking-widest rounded-xl shadow transition-all active:scale-95">
                            Next Card →
                        </button>
                    )}
                </>
            )}

            {state.isGameOver && (
                <button onClick={() => setState(engine.initialize())}
                    className="px-12 py-4 bg-indigo-600 hover:bg-indigo-500 text-white font-black text-xl uppercase tracking-widest rounded-xl shadow transition-all active:scale-95">
                    🔄 Play Again
                </button>
            )}
        </div>
    );
}

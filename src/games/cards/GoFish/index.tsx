import React, { useState, useEffect } from 'react';
import { GoFishEngine, GoFishState, Card, Rank } from './GoFishEngine';

const suitSymbol: Record<string, string> = { Hearts: '♥', Diamonds: '♦', Clubs: '♣', Spades: '♠' };
const suitColor: Record<string, string> = { Hearts: 'text-red-500', Diamonds: 'text-red-500', Clubs: 'text-zinc-800', Spades: 'text-zinc-800' };

function MiniCard({ card }: { card: Card }) {
    return (
        <div className={`w-12 h-16 bg-white border border-zinc-300 rounded-md flex flex-col items-center justify-center shadow text-xs font-black select-none ${suitColor[card.suit]}`}>
            <div>{card.rank}</div>
            <div className="text-lg leading-none">{suitSymbol[card.suit]}</div>
        </div>
    );
}

export default function GoFish() {
    const [engine] = useState(() => new GoFishEngine());
    const [state, setState] = useState<GoFishState>(() => engine.initialize());

    const dispatch = (action: Parameters<typeof engine.update>[1]) =>
        setState(s => engine.update(s, action));

    // Auto-trigger AI turn after delay
    useEffect(() => {
        if (state.waitingForOpponent && !state.isGameOver) {
            const timer = setTimeout(() => {
                setState(s => engine.update(s, { type: 'OPPONENT_TURN' }));
            }, 1200);
            return () => clearTimeout(timer);
        }
    }, [state.waitingForOpponent, state.isGameOver, engine]);

    const playerRanks = [...new Set(state.playerHand.map(c => c.rank))];

    const playerWon = state.playerBooks.length > state.opponentBooks.length;

    return (
        <div className="flex flex-col items-center justify-center p-4 min-h-[90vh] bg-teal-950 text-zinc-100 font-sans gap-5">
            
            <h1 className="text-5xl font-black tracking-widest uppercase text-teal-400 drop-shadow-[0_0_10px_rgba(20,184,166,0.5)]">Go Fish</h1>

            {/* Books Score */}
            <div className="flex gap-16 font-mono text-center">
                <div>
                    <div className="text-4xl font-black text-blue-400">{state.playerBooks.length}</div>
                    <div className="text-xs text-zinc-500 uppercase tracking-widest mt-1">Your Books</div>
                </div>
                <div>
                    <div className={`text-4xl font-black ${state.deck.length < 10 ? 'text-red-400' : 'text-zinc-400'}`}>{state.deck.length}</div>
                    <div className="text-xs text-zinc-500 uppercase tracking-widest mt-1">Deck</div>
                </div>
                <div>
                    <div className="text-4xl font-black text-red-400">{state.opponentBooks.length}</div>
                    <div className="text-xs text-zinc-500 uppercase tracking-widest mt-1">Opp. Books</div>
                </div>
            </div>

            {/* Opponent Hand (face down) */}
            <div className="bg-teal-900/50 rounded-xl p-4 w-full max-w-lg border border-teal-800 text-center">
                <div className="text-xs text-zinc-500 uppercase tracking-widest mb-3">Opponent ({state.opponentHand.length} cards)</div>
                <div className="flex flex-wrap justify-center gap-1">
                    {state.opponentHand.map((_, i) => (
                        <div key={i} className="w-8 h-12 bg-blue-900 border border-blue-700 rounded flex items-center justify-center">
                            <span className="text-blue-700 text-xs">✦</span>
                        </div>
                    ))}
                </div>
            </div>

            {/* Message */}
            <div className={`text-center px-6 py-3 rounded-xl font-bold max-w-lg text-sm transition-all border
                ${state.waitingForOpponent ? 'bg-orange-900/50 border-orange-700 text-orange-300 animate-pulse' :
                  'bg-zinc-900 border-zinc-700 text-zinc-300'}`}>
                {state.waitingForOpponent ? '⏳ Opponent is thinking...' : state.message}
            </div>

            {/* Player Hand */}
            <div className="bg-teal-900/50 rounded-xl p-4 w-full max-w-lg border border-teal-800">
                <div className="text-xs text-zinc-500 uppercase tracking-widest mb-3 text-center">Your Hand</div>
                <div className="flex flex-wrap justify-center gap-2">
                    {state.playerHand.map((c, i) => (
                        <MiniCard key={i} card={c} />
                    ))}
                </div>
            </div>

            {/* Ask Buttons */}
            {!state.isGameOver && state.isPlayerTurn && !state.waitingForOpponent && (
                <div className="flex flex-col items-center gap-3 w-full max-w-lg">
                    <div className="text-xs text-zinc-500 uppercase tracking-widest">Ask opponent for:</div>
                    <div className="flex flex-wrap justify-center gap-2">
                        {playerRanks.map(rank => (
                            <button key={rank} onClick={() => dispatch({ type: 'ASK', rank })}
                                className="w-12 h-12 bg-zinc-800 hover:bg-teal-700 border border-zinc-600 rounded-lg font-black text-sm transition-all active:scale-90 hover:border-teal-500">
                                {rank}
                            </button>
                        ))}
                    </div>
                </div>
            )}

            {/* Game Over */}
            {state.isGameOver && (
                <div className="flex flex-col items-center gap-4">
                    <h2 className={`text-4xl font-black tracking-widest uppercase ${playerWon ? 'text-teal-400' : 'text-red-400'}`}>
                        {playerWon ? '🐟 You Win!' : '💀 Opponent Wins!'}
                    </h2>
                    <div className="font-mono text-zinc-400">Your books: {state.playerBooks.join(', ')}</div>
                    <button onClick={() => setState(engine.initialize())}
                        className="px-12 py-4 bg-teal-700 hover:bg-teal-600 text-white font-black text-xl uppercase tracking-widest rounded-xl shadow transition-all">
                        🔄 Play Again
                    </button>
                </div>
            )}
        </div>
    );
}

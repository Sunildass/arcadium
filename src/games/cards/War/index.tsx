import React, { useState } from 'react';
import { WarEngine, WarState, Card } from './WarEngine';

const suitSymbol: Record<string, string> = { Hearts: '♥', Diamonds: '♦', Clubs: '♣', Spades: '♠' };
const suitColor: Record<string, string> = { Hearts: 'text-red-500', Diamonds: 'text-red-500', Clubs: 'text-zinc-100', Spades: 'text-zinc-100' };

function PlayingCard({ card, faceDown = false, size = 'normal' }: { card?: Card; faceDown?: boolean; size?: 'normal' | 'small' }) {
    const sizeClasses = size === 'small' 
        ? 'w-10 h-14 text-xs rounded' 
        : 'w-20 h-28 text-xl rounded-lg';

    if (faceDown || !card) {
        return (
            <div className={`${sizeClasses} bg-blue-800 border-2 border-blue-600 flex items-center justify-center shadow-lg`}>
                <div className="bg-blue-700 rounded inset-2 absolute" />
                <span className="text-blue-500 text-2xl">✦</span>
            </div>
        );
    }

    return (
        <div className={`${sizeClasses} bg-white border-2 border-zinc-300 flex flex-col items-center justify-center shadow-lg select-none`}>
            <div className={`${suitColor[card.suit]} font-black leading-tight`}>
                <div className="text-center">{card.rank}</div>
                <div className="text-center">{suitSymbol[card.suit]}</div>
            </div>
        </div>
    );
}

export default function War() {
    const [engine] = useState(() => new WarEngine());
    const [state, setState] = useState<WarState>(() => engine.initialize());

    const dispatch = (action: Parameters<typeof engine.update>[1]) => {
        setState(s => engine.update(s, action));
    };

    const restart = () => setState(engine.initialize());

    return (
        <div className="flex flex-col items-center justify-center p-6 min-h-[90vh] bg-green-950 text-zinc-100 font-sans gap-6">
            
            <h1 className="text-5xl font-black tracking-widest uppercase text-yellow-400 drop-shadow-[0_0_10px_rgba(234,179,8,0.5)]">WAR</h1>
            <p className="text-zinc-400 -mt-4 text-sm italic">The classic card battle game</p>

            {/* Deck Counts */}
            <div className="flex gap-24 font-mono">
                <div className="text-center">
                    <div className="text-4xl font-black text-blue-400">{state.playerDeck.length}</div>
                    <div className="text-zinc-500 text-xs uppercase tracking-widest mt-1">Your Cards</div>
                </div>
                <div className="text-center">
                    <div className="text-4xl font-black text-red-400">{state.opponentDeck.length}</div>
                    <div className="text-zinc-500 text-xs uppercase tracking-widest mt-1">Opponent</div>
                </div>
            </div>

            {/* Battle Zone */}
            <div className="w-full max-w-lg bg-green-900 border-2 border-green-700 rounded-2xl p-6 shadow-2xl">
                <div className="flex justify-between items-center">
                    
                    {/* Player Side */}
                    <div className="flex flex-col items-center gap-3">
                        <div className="text-sm font-bold text-blue-400 uppercase tracking-widest">You</div>
                        <div className="flex gap-1">
                            {state.playerBattleCards.slice(-4).map((c, i, arr) => (
                                <PlayingCard key={i} card={c} faceDown={i < arr.length - 1} size="small" />
                            ))}
                            {state.playerBattleCards.length === 0 && <PlayingCard faceDown />}
                        </div>
                        {/* Top card big */}
                        {state.playerBattleCards.length > 0 && (
                            <PlayingCard card={state.playerBattleCards[state.playerBattleCards.length - 1]} />
                        )}
                    </div>

                    {/* VS Divider */}
                    <div className="text-3xl font-black text-yellow-500 drop-shadow-md">⚔️</div>

                    {/* Opponent Side */}
                    <div className="flex flex-col items-center gap-3">
                        <div className="text-sm font-bold text-red-400 uppercase tracking-widest">Opponent</div>
                        <div className="flex gap-1">
                            {state.opponentBattleCards.slice(-4).map((c, i, arr) => (
                                <PlayingCard key={i} card={c} faceDown={i < arr.length - 1} size="small" />
                            ))}
                            {state.opponentBattleCards.length === 0 && <PlayingCard faceDown />}
                        </div>
                        {state.opponentBattleCards.length > 0 && (
                            <PlayingCard card={state.opponentBattleCards[state.opponentBattleCards.length - 1]} />
                        )}
                    </div>
                </div>
            </div>

            {/* Message */}
            <div className={`text-center px-6 py-3 rounded-xl font-bold max-w-md 
                ${state.result === 'war' ? 'bg-red-900 text-red-200 border border-red-700' : 'bg-zinc-900 text-zinc-300 border border-zinc-700'}`}>
                {state.message}
            </div>

            {/* Controls */}
            {!state.isGameOver ? (
                <button 
                    onClick={() => dispatch({ type: 'FLIP' })}
                    className="px-12 py-4 bg-yellow-500 hover:bg-yellow-400 text-zinc-900 font-black text-xl uppercase tracking-widest rounded-xl shadow-[0_0_20px_rgba(234,179,8,0.3)] transition-all active:scale-95"
                >
                    {state.result === 'war' ? '⚔️ FLIP for WAR!' : '🃏 FLIP'}
                </button>
            ) : (
                <button 
                    onClick={restart}
                    className="px-12 py-4 bg-green-600 hover:bg-green-500 text-white font-black text-xl uppercase tracking-widest rounded-xl shadow transition-all active:scale-95"
                >
                    🔄 Play Again
                </button>
            )}

            <div className="text-zinc-600 text-sm">Round {state.roundsPlayed}</div>
        </div>
    );
}

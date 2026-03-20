import React, { useState, useEffect } from 'react';
import { CrazyEightsEngine, CrazyEightsState, Card, Suit } from './CrazyEightsEngine';

const SUITS: Suit[] = ['Hearts', 'Diamonds', 'Clubs', 'Spades'];
const suitSymbol: Record<string, string> = { Hearts: '♥', Diamonds: '♦', Clubs: '♣', Spades: '♠' };
const suitColor: Record<string, string> = { Hearts: 'text-red-500', Diamonds: 'text-red-500', Clubs: 'text-zinc-800', Spades: 'text-zinc-800' };

function MiniCard({ card, selectable, onClick }: { card: Card; selectable?: boolean; onClick?: () => void }) {
    return (
        <button
            onClick={onClick}
            disabled={!selectable}
            className={`w-14 h-20 bg-white border-2 rounded-lg flex flex-col items-center justify-center shadow font-black select-none transition-all
                ${suitColor[card.suit]}
                ${selectable ? 'border-indigo-400 hover:scale-110 hover:-translate-y-2 cursor-pointer hover:shadow-lg hover:shadow-indigo-500/30' : 'border-zinc-300 opacity-70 cursor-default'}
            `}
        >
            <div className="text-sm">{card.rank}</div>
            <div className="text-xl leading-none">{suitSymbol[card.suit]}</div>
        </button>
    );
}

function TopCard({ card, currentSuit }: { card: Card; currentSuit: Suit }) {
    return (
        <div className="flex flex-col items-center gap-1">
            <div className={`w-24 h-32 bg-white border-4 border-indigo-400 rounded-xl flex flex-col items-center justify-center shadow-xl font-black ${suitColor[card.suit]}`}>
                <div className="text-2xl">{card.rank}</div>
                <div className="text-4xl leading-none">{suitSymbol[card.suit]}</div>
            </div>
            {card.rank === '8' && (
                <div className="text-xs text-indigo-400 font-bold flex items-center gap-1">
                    Active suit: {suitSymbol[currentSuit]}
                </div>
            )}
        </div>
    );
}

export default function CrazyEights() {
    const [engine] = useState(() => new CrazyEightsEngine());
    const [state, setState] = useState<CrazyEightsState>(() => engine.initialize());

    const dispatch = (action: Parameters<typeof engine.update>[1]) =>
        setState(s => engine.update(s, action));

    // Auto-trigger AI turn after delay
    useEffect(() => {
        if (state.opponentThinking && !state.isGameOver) {
            const timer = setTimeout(() => {
                setState(s => engine.update(s, { type: 'OPPONENT_TURN' }));
            }, 1000);
            return () => clearTimeout(timer);
        }
    }, [state.opponentThinking, state.isGameOver, engine]);

    const topCard = state.discardPile[state.discardPile.length - 1];
    
    function isPlayable(card: Card): boolean {
        if (!state.isPlayerTurn || state.pendingWildSuit || state.opponentThinking) return false;
        if (card.rank === '8') return true;
        if (card.suit === state.currentSuit) return true;
        if (card.rank === topCard.rank) return true;
        return false;
    }

    return (
        <div className="flex flex-col items-center justify-center p-4 min-h-[90vh] bg-gradient-to-b from-purple-950 to-zinc-950 text-zinc-100 font-sans gap-5">
            
            <h1 className="text-5xl font-black tracking-widest uppercase text-purple-400 drop-shadow-[0_0_10px_rgba(192,132,252,0.5)]">Crazy 8s</h1>

            {/* Opponent hand (face down) */}
            <div className="bg-purple-900/30 rounded-xl px-4 py-3 border border-purple-800/50 text-center w-full max-w-xl">
                <div className="text-xs text-zinc-500 uppercase tracking-widest mb-2">Opponent ({state.opponentHand.length} cards)</div>
                <div className="flex flex-wrap justify-center gap-1">
                    {state.opponentHand.map((_, i) => (
                        <div key={i} className="w-8 h-11 bg-purple-900 border border-purple-700 rounded flex items-center justify-center">
                            <span className="text-purple-700 text-xs">✦</span>
                        </div>
                    ))}
                </div>
            </div>

            {/* Table */}
            <div className="flex items-center gap-8">
                {/* Deck */}
                <div className="flex flex-col items-center gap-1">
                    <div className="w-16 h-22 bg-purple-900 border-2 border-purple-700 rounded-lg w-16 h-24 flex items-center justify-center shadow-lg cursor-pointer hover:bg-purple-800 transition-colors"
                        onClick={() => state.isPlayerTurn && !state.pendingWildSuit && dispatch({ type: 'DRAW_CARD' })}>
                        <span className="text-purple-400 font-bold text-sm">{state.deck.length}</span>
                    </div>
                    <div className="text-xs text-zinc-600">Draw</div>
                </div>

                {/* Discard */}
                <TopCard card={topCard} currentSuit={state.currentSuit} />

                {/* Current suit indicator */}
                <div className="flex flex-col items-center gap-1">
                    <div className={`w-16 h-16 rounded-full border-4 ${
                        state.currentSuit === 'Hearts' || state.currentSuit === 'Diamonds' 
                        ? 'border-red-500 bg-red-900/30 text-red-500' 
                        : 'border-zinc-400 bg-zinc-900/30 text-zinc-300'
                    } flex items-center justify-center text-3xl font-black`}>
                        {suitSymbol[state.currentSuit]}
                    </div>
                    <div className="text-xs text-zinc-600">Active suit</div>
                </div>
            </div>

            {/* Message */}
            <div className={`text-center px-5 py-3 rounded-xl font-bold max-w-lg text-sm border transition-all
                ${state.opponentThinking ? 'bg-orange-900/40 border-orange-700 text-orange-300 animate-pulse' :
                  state.message.startsWith('❌') ? 'bg-red-900/40 border-red-700 text-red-300' :
                  'bg-zinc-900 border-zinc-700 text-zinc-300'}`}>
                {state.opponentThinking ? '⏳ Opponent is thinking...' : state.message}
            </div>

            {/* Wild suit selection */}
            {state.pendingWildSuit && (
                <div className="flex flex-col items-center gap-3">
                    <div className="text-sm font-bold uppercase tracking-widest text-purple-400">Choose a suit:</div>
                    <div className="flex gap-3">
                        {SUITS.map(suit => (
                            <button key={suit} onClick={() => dispatch({ type: 'CHOOSE_SUIT', suit })}
                                className={`w-14 h-14 rounded-full border-2 font-black text-2xl transition-all hover:scale-110 ${
                                    suit === 'Hearts' || suit === 'Diamonds'
                                    ? 'border-red-500 bg-red-900/30 text-red-500 hover:bg-red-900'
                                    : 'border-zinc-400 bg-zinc-800 text-zinc-300 hover:bg-zinc-700'
                                }`}>
                                {suitSymbol[suit]}
                            </button>
                        ))}
                    </div>
                </div>
            )}

            {/* Player Hand */}
            <div className="bg-purple-900/30 rounded-xl p-4 w-full max-w-xl border border-purple-800/50">
                <div className="text-xs text-zinc-500 uppercase tracking-widest mb-3 text-center">Your Hand — click playable cards</div>
                <div className="flex flex-wrap justify-center gap-2">
                    {state.playerHand.map((c, i) => (
                        <MiniCard key={i} card={c} selectable={isPlayable(c)} onClick={() => dispatch({ type: 'PLAY_CARD', cardIndex: i })} />
                    ))}
                </div>
            </div>

            {/* Game Over */}
            {state.isGameOver && (
                <button onClick={() => setState(engine.initialize())}
                    className="px-12 py-4 bg-purple-700 hover:bg-purple-600 text-white font-black text-xl uppercase tracking-widest rounded-xl shadow transition-all">
                    🔄 Play Again
                </button>
            )}
        </div>
    );
}

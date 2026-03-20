import React, { useState, useEffect, useCallback, useRef } from 'react';
import { PokerEngine, PokerState, Card, Player } from './PokerEngine';
import { PlayerProfileManager } from '../../../core/ai/PlayerProfileManager';

const engine = new PokerEngine();

export default function Poker() {
    const [gameState, setGameState] = useState<PokerState | null>(null);
    const [raiseAmount, setRaiseAmount] = useState<number>(0);
    const logEndRef = useRef<HTMLDivElement>(null);

    const startGame = useCallback(() => {
        setGameState(engine.initialize());
    }, []);

    useEffect(() => {
        startGame();
    }, [startGame]);

    // Handle AI Turns automatically
    useEffect(() => {
        if (!gameState) return;
        const p = gameState.players[gameState.turnIndex];

        if (gameState.phase !== 'showdown' && p && p.isAI) {
            const t = setTimeout(() => {
                const action = engine.getAIMove(gameState);
                setGameState(engine.update(gameState, action));
            }, 1000); // 1s think time
            return () => clearTimeout(t);
        }
    }, [gameState]);

    // Always keep raise slider updated to minimum valid state
    useEffect(() => {
        if (gameState && gameState.phase !== 'showdown') {
            const p = gameState.players[0]; // Assuming P1 is index 0
            if (raiseAmount < gameState.highestBet + gameState.minRaise) {
                 setRaiseAmount(gameState.highestBet + gameState.minRaise);
            }
            // Cap at all in
             if (raiseAmount > p.chips + p.currentBet) {
                 setRaiseAmount(p.chips + p.currentBet);
             }
        }
    }, [gameState, raiseAmount]);

    // Auto-scroll log
    useEffect(() => {
         logEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [gameState?.log.length]);


    if (!gameState) return null;

    const player = gameState.players[0];
    const isPlayerTurn = gameState.turnIndex === 0 && gameState.phase !== 'showdown';
    const amountToCall = gameState.highestBet - player.currentBet;
    const canCheck = amountToCall === 0;

    const renderCard = (c: Card, hidden: boolean = false) => {
        if (hidden) {
            return (
                <div className="w-10 h-14 sm:w-14 sm:h-20 bg-[url('https://www.transparenttextures.com/patterns/always-grey.png')] bg-blue-900 border-2 border-white rounded shadow-md flex items-center justify-center">
                    <span className="text-white/20 text-xs">Arcadium</span>
                </div>
            );
        }
        const isRed = c.suit === 'hearts' || c.suit === 'diamonds';
        const suitSymbol = {
             'hearts': '♥', 'diamonds': '♦', 'clubs': '♣', 'spades': '♠'
        }[c.suit];

        return (
            <div className={`
                w-10 h-14 sm:w-14 sm:h-20 bg-white border border-gray-300 rounded shadow-md
                flex flex-col justify-between p-1 sm:p-2 font-bold text-sm sm:text-lg
                ${isRed ? 'text-red-500' : 'text-black'}
            `}>
                <div className="leading-none">{c.rank}</div>
                <div className="self-center text-xl sm:text-2xl">{suitSymbol}</div>
            </div>
        );
    };

    const handleAction = (type: 'FOLD' | 'CHECK_CALL' | 'RAISE', amt?: number) => {
        if (!isPlayerTurn) return;
        setGameState(engine.update(gameState, type === 'RAISE' ? { type: 'RAISE', amount: amt || raiseAmount } : { type }));
    };

    return (
        <div className="flex flex-col items-center justify-center h-full min-h-[90vh] bg-zinc-950 font-sans text-zinc-100 p-4">
            
            {/* The Poker Table */}
            <div className="relative w-full max-w-5xl aspect-[16/9] lg:aspect-[21/9] bg-green-800 rounded-[100px] border-[16px] border-[#5e3a23] shadow-[inset_0_0_50px_rgba(0,0,0,0.8),_0_20px_50px_rgba(0,0,0,0.5)] flex flex-col items-center justify-center">
                
                {/* AI Players */}
                {gameState.players.slice(1).map((ai, i) => {
                    // Position them around the top edge natively
                    const positions = [
                        'top-1/4 left-0 -translate-x-1/2', 
                        'top-0 left-1/2 -translate-x-1/2 -translate-y-1/2', 
                        'top-1/4 right-0 translate-x-1/2'
                    ];

                    return (
                        <div key={ai.id} className={`absolute ${positions[i]} flex flex-col items-center drop-shadow-lg z-10`}>
                            <div className={`p-2 rounded-xl text-center bg-zinc-900 border-2 ${gameState.turnIndex === i + 1 ? 'border-yellow-400 shadow-[0_0_15px_rgba(250,204,21,0.5)]' : 'border-zinc-700'} ${ai.folded ? 'opacity-50' : ''}`}>
                                <div className="font-black text-sm text-zinc-300">{ai.name}</div>
                                <div className="text-yellow-500 font-mono text-xs">${ai.chips}</div>
                            </div>
                            
                            {/* AI Cards */}
                            {!ai.folded && (
                                <div className="flex gap-1 mt-2 -rotate-3 scale-75">
                                    {gameState.phase === 'showdown' ? (
                                        <>
                                            {renderCard(ai.hand[0])}
                                            {renderCard(ai.hand[1])}
                                        </>
                                    ) : (
                                        <>
                                            {renderCard(ai.hand[0], true)}
                                            {renderCard(ai.hand[1], true)}
                                        </>
                                    )}
                                </div>
                            )}
                            
                            {/* Current Round Bet */}
                            {ai.currentBet > 0 && (
                                <div className="mt-2 text-xs bg-black/60 px-2 rounded-full text-zinc-300 border border-zinc-500">
                                    Bet: ${ai.currentBet}
                                </div>
                            )}

                            {/* Dealer / Blind Buttons */}
                            {gameState.dealerIndex === i + 1 && <div className="absolute -top-4 -right-4 w-6 h-6 bg-white text-black font-black text-xs rounded-full flex items-center justify-center border-2 border-black">D</div>}
                        </div>
                    );
                })}


                {/* Community Center */}
                <div className="flex flex-col items-center">
                    <div className="text-zinc-300 uppercase tracking-widest text-xs font-bold mb-2 opacity-50">Current Pot</div>
                    <div className="text-4xl sm:text-6xl font-black text-yellow-500 mb-6 drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]">
                        ${gameState.pot}
                    </div>

                    <div className="flex gap-2">
                        {/* Render 5 spots, show cards if dealt */}
                        {[0,1,2,3,4].map(idx => {
                            const c = gameState.communityCards[idx];
                            if (c) return <div key={idx} className="animate-fade-in">{renderCard(c)}</div>;
                            return <div key={idx} className="w-10 h-14 sm:w-14 sm:h-20 border-2 border-white/10 rounded border-dashed" />;
                        })}
                    </div>
                </div>

                {/* Local Player (Bottom) */}
                <div className={`absolute bottom-0 translate-y-1/2 flex flex-col items-center drop-shadow-xl z-20`}>
                    
                    {player.currentBet > 0 && (
                         <div className="mb-4 text-sm bg-black/80 px-4 py-1 rounded-full text-zinc-300 shadow-md border border-zinc-600">
                             Bet: ${player.currentBet}
                         </div>
                    )}
                    
                    <div className="flex gap-2 mb-2 scale-110">
                         {player.hand.map((c, i) => (
                              <div key={i} className={player.folded ? 'opacity-50 grayscale' : ''}>
                                  {renderCard(c)}
                              </div>
                         ))}
                    </div>

                    <div className={`px-8 py-2 rounded-xl text-center bg-zinc-900 border-2 ${isPlayerTurn ? 'border-yellow-400 shadow-[0_0_20px_rgba(250,204,21,0.6)]' : 'border-zinc-700'}`}>
                        <div className="font-black text-white">{player.name}</div>
                        <div className="text-emerald-400 font-mono text-lg">${player.chips}</div>
                    </div>
                </div>
            </div>

            {/* Action Bar */}
            <div className="w-full max-w-4xl mt-16 sm:mt-24 p-4 bg-zinc-900 rounded-xl border border-zinc-800 flex flex-col sm:flex-row gap-4 justify-between items-center shadow-2xl">
                
                {gameState.phase !== 'showdown' ? (
                    <>
                        <div className="flex gap-2 w-full sm:w-auto">
                            <button 
                                disabled={!isPlayerTurn}
                                onClick={() => handleAction('FOLD')}
                                className="flex-1 sm:flex-none px-6 py-3 bg-red-900/50 hover:bg-red-800 text-red-100 font-black tracking-wider rounded-lg disabled:opacity-30 transition-colors border border-red-900/50"
                            >
                                FOLD
                            </button>
                            <button 
                                disabled={!isPlayerTurn || (amountToCall > player.chips)} // Can't call natively if not enough, engine handles all-in implicitly but UI should be clean
                                onClick={() => handleAction('CHECK_CALL')}
                                className={`flex-1 sm:flex-none px-8 py-3 font-black tracking-wider rounded-lg disabled:opacity-30 transition-colors border 
                                    ${canCheck ? 'bg-zinc-700 hover:bg-zinc-600 text-white border-zinc-500' : 'bg-green-700 hover:bg-green-600 text-white border-green-500'}
                                `}
                            >
                                {canCheck ? 'CHECK' : `CALL $${amountToCall}`}
                            </button>
                        </div>
                        
                        <div className="flex items-center gap-4 w-full sm:w-auto px-4 py-2 bg-black/40 rounded-lg border border-white/5">
                            <input 
                                type="range" 
                                min={Math.min(gameState.highestBet + gameState.minRaise, player.chips + player.currentBet)} 
                                max={player.chips + player.currentBet} 
                                step={10}
                                value={raiseAmount}
                                onChange={(e) => setRaiseAmount(Number(e.target.value))}
                                className="w-full sm:w-32 accent-yellow-500"
                                disabled={!isPlayerTurn}
                            />
                            <div className="font-mono text-yellow-500 min-w-[60px] text-right">${raiseAmount}</div>
                            <button 
                                disabled={!isPlayerTurn || raiseAmount > player.chips + player.currentBet}
                                onClick={() => handleAction('RAISE')}
                                className="px-6 py-2 bg-yellow-600 hover:bg-yellow-500 text-black font-black uppercase rounded disabled:opacity-30 transition-colors"
                            >
                                Raise
                            </button>
                        </div>
                    </>
                ) : (
                     <div className="w-full text-center py-2 flex flex-col items-center">
                         <h2 className="text-2xl font-black text-amber-500 mb-2">Showdown Complete</h2>
                         <button 
                             onClick={() => setGameState(engine.update(gameState, { type: 'NEXT_ROUND' }))}
                             className="px-8 py-3 bg-blue-600 hover:bg-blue-500 text-white font-black tracking-widest uppercase rounded-full shadow-lg transition-transform hover:scale-105"
                         >
                             Next Hand
                         </button>
                     </div>
                )}
            </div>

            {/* Event Log */}
            <div className="w-full max-w-4xl mt-4 h-32 bg-black/80 rounded-lg border border-zinc-800 p-4 overflow-y-auto font-mono text-xs sm:text-sm text-zinc-400">
                 {gameState.log.map((entry, idx) => (
                     <div key={idx} className="mb-1">{entry}</div>
                 ))}
                 <div ref={logEndRef} />
            </div>

        </div>
    );
}

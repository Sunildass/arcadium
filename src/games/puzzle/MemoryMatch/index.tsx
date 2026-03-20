import React, { useState, useEffect, useCallback, useRef } from 'react';
import { MemoryEngine, MemoryState, MemoryCard } from './MemoryEngine';
import { PlayerProfileManager } from '../../../core/ai/PlayerProfileManager';

type GameMode = '1P_SOLO' | '1P_VS_AI' | '2P_LOCAL';

export default function MemoryMatch() {
    const [mode, setMode] = useState<GameMode>('1P_SOLO');
    const [pairs, setPairs] = useState<number>(8); // 4x4
    const [engine, setEngine] = useState(() => new MemoryEngine(mode, pairs));
    const [gameState, setGameState] = useState<MemoryState | null>(null);
    const [profileManager] = useState(() => new PlayerProfileManager('memory'));

    // AI memory state: Tracks what it has seen
    const aiMemoryRef = useRef<Record<string, number[]>>({});

    const startGame = useCallback((m?: GameMode, p?: number) => {
        const targetMode = m || mode;
        const targetPairs = p || pairs;
        const newEngine = new MemoryEngine(targetMode, targetPairs);
        setEngine(newEngine);
        setGameState(newEngine.initialize());
        aiMemoryRef.current = {}; // Reset AI memory
    }, [mode, pairs]);

    useEffect(() => {
        startGame();
    }, [startGame]);

    // Handle Evaluation Phase
    useEffect(() => {
        if (!gameState || gameState.isGameOver) return;
        
        if (gameState.phase === 'evaluating') {
             // Record flipped cards in AI memory before they evaluate/flip back
             const [idx1, idx2] = gameState.flippedIndices;
             const c1 = gameState.cards[idx1];
             const c2 = gameState.cards[idx2];
             
             if (!aiMemoryRef.current[c1.symbol]) aiMemoryRef.current[c1.symbol] = [];
             if (!aiMemoryRef.current[c1.symbol].includes(idx1)) aiMemoryRef.current[c1.symbol].push(idx1);
             
             if (!aiMemoryRef.current[c2.symbol]) aiMemoryRef.current[c2.symbol] = [];
             if (!aiMemoryRef.current[c2.symbol].includes(idx2)) aiMemoryRef.current[c2.symbol].push(idx2);

             const timer = setTimeout(() => {
                 setGameState(engine.update(gameState, { type: 'EVALUATE' }));
             }, 1000); // 1s visual delay to see pairs
             return () => clearTimeout(timer);
        }
    }, [gameState, engine]);

    // Handle AI Turn
    useEffect(() => {
        if (!gameState || gameState.isGameOver) return;
        
        if (mode === '1P_VS_AI' && gameState.turn === 'P2' && gameState.phase === 'waiting') {
             const timer = setTimeout(() => {
                 const move = engine.computeAIMove(gameState, aiMemoryRef.current);
                 if (move) {
                     setGameState(engine.update(gameState, move));
                 }
             }, 800);
             return () => clearTimeout(timer);
        }
    }, [gameState, engine, mode]);


    const handleCardClick = (index: number) => {
        if (!gameState || gameState.isGameOver || gameState.phase !== 'waiting') return;
        if (mode === '1P_VS_AI' && gameState.turn === 'P2') return;

        setGameState(engine.update(gameState, { type: 'FLIP', index }));
    };

    if (!gameState) return null;

    const cols = Math.sqrt(pairs * 2);
    const gridClass = pairs === 8 ? 'grid-cols-4' : (pairs === 18 ? 'grid-cols-6' : 'grid-cols-8');

    return (
        <div className="flex flex-col items-center justify-center p-4 min-h-[90vh] bg-neutral-950 font-sans text-neutral-100">
            
            <div className="w-full max-w-4xl flex flex-col md:flex-row justify-between items-center mb-8 gap-4 bg-neutral-900 border border-neutral-800 p-4 rounded-xl shadow-lg">
                
                <div className="flex gap-4">
                    <select value={mode} onChange={e => setMode(e.target.value as GameMode)} className="bg-neutral-800 text-neutral-200 p-2 outline-none rounded">
                         <option value="1P_SOLO">Solo Time Attack</option>
                         <option value="1P_VS_AI">vs Computer</option>
                         <option value="2P_LOCAL">Local 2P</option>
                    </select>
                    <select value={pairs} onChange={e => setPairs(Number(e.target.value))} className="bg-neutral-800 text-neutral-200 p-2 outline-none rounded">
                         <option value={8}>4x4 Grid</option>
                         <option value={18}>6x6 Grid</option>
                         <option value={32}>8x8 Grid</option>
                    </select>
                </div>

                <div className="flex items-center gap-8 text-neutral-400">
                     {mode === '1P_SOLO' ? (
                          <div className="p-2 px-6 bg-neutral-800 rounded-lg text-center shadow-inner">
                              <span className="text-xs uppercase tracking-widest block mb-1">Moves</span>
                              <span className="text-3xl font-black text-white">{gameState.movesCount}</span>
                          </div>
                     ) : (
                          <>
                              <div className={`p-2 px-6 rounded-lg border-b-4 ${gameState.turn === 'P1' ? 'border-pink-500 bg-neutral-800' : 'border-transparent'}`}>
                                   <span className="text-xs uppercase tracking-widest text-pink-400 block mb-1">Player 1</span>
                                   <span className="text-3xl font-black text-white text-center block">{gameState.scores.P1}</span>
                              </div>
                              <div className={`p-2 px-6 rounded-lg border-b-4 ${gameState.turn === 'P2' ? 'border-sky-500 bg-neutral-800' : 'border-transparent'}`}>
                                   <span className="text-xs uppercase tracking-widest text-sky-400 block mb-1">{mode === '1P_VS_AI' ? 'Computer' : 'Player 2'}</span>
                                   <span className="text-3xl font-black text-white text-center block">{gameState.scores.P2}</span>
                              </div>
                          </>
                     )}
                </div>
            </div>

            {/* The Grid */}
            <div className="relative w-full max-w-4xl flex items-center justify-center">
                 
                 <div className={`grid gap-2 sm:gap-3 md:gap-4 ${gridClass} w-full aspect-square max-w-2xl`}>
                      {gameState.cards.map((card, idx) => {
                          const isRevealed = card.isFlipped || card.isMatched;

                          return (
                               <div 
                                    key={card.id}
                                    className="relative w-full h-full cursor-pointer perspective-1000"
                                    onClick={() => handleCardClick(idx)}
                                    style={{ perspective: '1000px' }}
                               >
                                    <div 
                                         className={`w-full h-full rounded-xl transition-all duration-500 transform-style-preserve-3d shadow-lg
                                              ${isRevealed ? 'rotate-y-180' : 'hover:scale-105'}
                                         `}
                                         style={{ 
                                             transformStyle: 'preserve-3d',
                                             transform: isRevealed ? 'rotateY(180deg)' : 'rotateY(0deg)'
                                         }}
                                    >
                                         {/* Back of Card */}
                                         <div className="absolute inset-0 backface-hidden bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl border border-white/20 flex items-center justify-center shadow-[inset_0_0_20px_rgba(0,0,0,0.2)]" style={{ backfaceVisibility: 'hidden' }}>
                                              <div className="w-1/2 h-1/2 bg-white/10 rounded-full flex items-center justify-center text-white/50 text-2xl font-black font-serif">A</div>
                                         </div>
                                         
                                         {/* Front of Card */}
                                         <div 
                                             className={`absolute inset-0 backface-hidden rounded-xl border-2 flex items-center justify-center text-4xl sm:text-5xl md:text-6xl drop-shadow-md
                                                 ${card.isMatched ? 'bg-green-100 border-green-500 shadow-[0_0_20px_rgba(34,197,94,0.4)] animate-pulse' : 'bg-white border-neutral-300'}
                                             `} 
                                             style={{ backfaceVisibility: 'hidden', transform: 'rotateY(180deg)' }}
                                         >
                                              {card.symbol}
                                         </div>
                                    </div>
                               </div>
                          );
                      })}
                 </div>

                 {/* Win Overlay */}
                 {gameState.isGameOver && (
                     <div className="absolute inset-0 z-50 bg-neutral-950/80 backdrop-blur-md rounded-2xl flex flex-col items-center justify-center">
                          <h1 className="text-5xl md:text-7xl font-black mb-4 drop-shadow-[0_4px_10px_rgba(0,0,0,0.8)] text-white">
                               {mode === '1P_SOLO' ? 'Complete!' : (gameState.winner === 'Draw' ? 'Draw!' : (gameState.winner === 'P1' ? 'Player 1 Wins!' : (mode === '1P_VS_AI' ? 'Computer Wins' : 'Player 2 Wins!')))}
                          </h1>
                          {mode === '1P_SOLO' && (
                              <p className="text-2xl text-pink-400 font-bold tracking-widest mb-8">Solved in {gameState.movesCount} moves</p>
                          )}
                          <button onClick={() => startGame()} className="px-10 py-4 bg-white text-black font-black uppercase tracking-widest rounded-full hover:scale-110 transition-transform shadow-[0_0_30px_rgba(255,255,255,0.3)] hover:shadow-[0_0_40px_rgba(255,255,255,0.6)]">
                               Play Again
                          </button>
                     </div>
                 )}
            </div>
            
        </div>
    );
}

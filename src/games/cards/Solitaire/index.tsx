import React, { useState, useEffect, useCallback } from 'react';
import { SolitaireEngine, SolitaireState, MoveAction, PileLocation, Card } from './SolitaireEngine';
import { PlayerProfileManager } from '../../../core/ai/PlayerProfileManager';

const engine = new SolitaireEngine();

export default function Solitaire() {
  const [profileManager] = useState(() => new PlayerProfileManager('solitaire'));
  const [gameState, setGameState] = useState<SolitaireState | null>(null);
  const [selectedPile, setSelectedPile] = useState<PileLocation | null>(null);

  const startGame = useCallback(() => {
    setGameState(engine.initialize());
    setSelectedPile(null);
  }, []);

  useEffect(() => {
    startGame();
  }, [startGame]);

  const handleAction = (action: MoveAction) => {
      if (!gameState || gameState.isGameOver) return;
      const newState = engine.update(gameState, action);
      if (newState !== gameState) {
          setGameState(newState);
          setSelectedPile(null);
          
          // Auto-reveal tableaus after a move
          if (action.type === 'MOVE_CARD') {
             const activeState = newState; // Alias for closure clarity
             if (action.from.type === 'Tableau') {
                 // Check if the source tableau now has a face down top card
                 const tab = activeState.tableaus[action.from.index];
                 if (tab.length > 0 && !tab[tab.length - 1].isFaceUp) {
                     // We safely trigger another update cycle slightly later or immediately 
                     // to reveal it. Let's do it immediately.
                     const revealedState = engine.update(activeState, { type: 'REVEAL_TABLEAU_CARD', colIndex: action.from.index });
                     setGameState(revealedState);
                 }
             }
          }
      } else {
          // If move invalid, deselect
          setSelectedPile(null);
      }
  };

  const handlePileClick = (pile: PileLocation) => {
      if (!gameState || gameState.isGameOver) return;

      if (!selectedPile) {
          // Selection logic
          if (pile.type === 'Stock') {
              if (gameState.stock.length > 0) {
                  handleAction({ type: 'DRAW_STOCK' });
              } else if (gameState.waste.length > 0) {
                  handleAction({ type: 'RECYCLE_WASTE' });
              }
          } else if (pile.type === 'Waste' && gameState.waste.length > 0) {
              setSelectedPile(pile);
          } else if (pile.type === 'Tableau') {
              const tab = gameState.tableaus[pile.index];
              if (tab.length > 0) {
                  // Ensure they clicked a face up card (UI handles setting the precise index if passing it via args)
                  if (pile.cardIndex !== undefined && tab[pile.cardIndex].isFaceUp) {
                      setSelectedPile(pile);
                  }
              }
          } else if (pile.type === 'Foundation' && gameState.foundations[pile.index].length > 0) {
              setSelectedPile(pile);
          }
      } else {
          // Execution Logic: User previously selected a card, and is now clicking a destination
          
          // Clicking the same pile negates selection
          if (selectedPile.type === pile.type && selectedPile.index === pile.index && selectedPile.type !== 'Tableau') {
              setSelectedPile(null);
              return;
          }
          
          if (selectedPile.type === 'Tableau' && pile.type === 'Tableau' && selectedPile.index === pile.index) {
              setSelectedPile(null);
              return;
          }

          // Move attempt
          handleAction({ type: 'MOVE_CARD', from: selectedPile, to: pile });
      }
  };

  useEffect(() => {
      if (gameState?.isGameOver) {
          const result = engine.evaluateWin(gameState);
          if (result) {
               profileManager.recordGameResult(
                   'win',
                   result.score,
                   result.difficulty
               );
          }
      }
  }, [gameState?.isGameOver, gameState, profileManager]);

  if (!gameState) return null;

  // Helpers to calculate visual offsets
  const isSelected = (type: PileType, index: number, cIdx?: number) => {
      if (!selectedPile) return false;
      if (selectedPile.type !== type) return false;
      if (type === 'Tableau') {
          return selectedPile.index === index && selectedPile.cardIndex === cIdx;
      }
      return selectedPile.index === index;
  };

  // Extract purely for typing alias
  type PileType = 'Stock' | 'Waste' | 'Foundation' | 'Tableau';

  const renderCard = (card: Card, isTop: boolean = true) => (
      <div className={`
          w-full h-full rounded-md shadow-md flex flex-col justify-between p-1 bg-white border cursor-pointer select-none
          ${card.color === 'Red' ? 'text-red-500' : 'text-zinc-900'}
          ${isTop ? 'border-zinc-300' : 'border-zinc-400'}
      `}>
          <div className="font-bold leading-none">{card.rank}</div>
          <div className="text-xl self-center">
              {card.suit === 'Hearts' && '♥'}
              {card.suit === 'Diamonds' && '♦'}
              {card.suit === 'Clubs' && '♣'}
              {card.suit === 'Spades' && '♠'}
          </div>
      </div>
  );

  const renderCardBack = () => (
      <div className="w-full h-full rounded-md shadow-md bg-blue-800 border-2 border-white flex items-center justify-center cursor-pointer pattern-dots pattern-blue-900 pattern-bg-blue-800 pattern-size-2 pattern-opacity-100">
         <div className="w-8 h-8 rounded-full border border-blue-600/50" />
      </div>
  );

  const CardSlot = ({ children, onClick, highlight }: { children?: React.ReactNode, onClick: () => void, highlight?: boolean }) => (
      <div 
         onClick={onClick}
         className={`
           w-14 sm:w-20 lg:w-24 aspect-[2.5/3.5] rounded-md relative cursor-pointer
           ${highlight ? 'ring-2 ring-yellow-400 ring-offset-2 ring-offset-green-900' : ''}
           ${!children ? 'border-2 border-green-700/50 bg-green-900/30' : ''}
         `}
      >
          {children}
      </div>
  );

  return (
    <div className="flex flex-col items-center justify-start py-8 px-4 w-full h-full min-h-[100vh]"> 
        <div className="flex justify-between w-full max-w-5xl mb-6 items-center bg-black/30 p-4 rounded-xl shadow-inner border border-white/5">
            <div className="flex flex-col">
                <span className="text-zinc-400 text-xs font-bold uppercase tracking-widest">Score</span>
                <span className="text-2xl font-black text-white">{gameState.score}</span>
            </div>
            <div className="flex flex-col items-center">
                <span className="text-zinc-400 text-xs font-bold uppercase tracking-widest">Moves</span>
                <span className="text-xl font-bold text-zinc-100">{gameState.moves}</span>
            </div>
            <button 
                onClick={startGame}
                className="bg-zinc-800 border border-zinc-700 hover:bg-zinc-700 text-white px-4 py-2 rounded-lg font-bold transition-colors shadow-lg"
            >
                Restart
            </button>
        </div>

        {/* Game Area */}
        <div className="w-full max-w-5xl bg-green-800 p-4 sm:p-8 rounded-2xl shadow-2xl border-4 border-green-900 relative">
            
            {/* Top Row: Stock, Waste, spacer, Foundations */}
            <div className="flex justify-between w-full mb-8">
                <div className="flex gap-4">
                    {/* Stock */}
                    <CardSlot onClick={() => handlePileClick({ type: 'Stock', index: 0 })}>
                        {gameState.stock.length > 0 && renderCardBack()}
                        {gameState.stock.length === 0 && (
                            <div className="absolute inset-0 flex items-center justify-center opacity-30">
                                <span className="text-4xl text-green-900">↺</span>
                            </div>
                        )}
                    </CardSlot>

                    {/* Waste */}
                    <CardSlot 
                        onClick={() => handlePileClick({ type: 'Waste', index: 0 })}
                        highlight={isSelected('Waste', 0)}
                    >
                        {gameState.waste.length > 0 && renderCard(gameState.waste[gameState.waste.length - 1])}
                    </CardSlot>
                </div>

                <div className="flex gap-2 sm:gap-4">
                    {/* Foundations */}
                    {gameState.foundations.map((f, idx) => (
                        <CardSlot 
                            key={`found-${idx}`} 
                            onClick={() => handlePileClick({ type: 'Foundation', index: idx })}
                            highlight={isSelected('Foundation', idx)}
                        >
                            {f.length > 0 && renderCard(f[f.length - 1])}
                            {f.length === 0 && (
                                <div className="absolute inset-0 flex items-center justify-center text-4xl opacity-20 text-green-950">
                                   {idx === 0 && '♥'}
                                   {idx === 1 && '♦'}
                                   {idx === 2 && '♣'}
                                   {idx === 3 && '♠'}
                                </div>
                            )}
                        </CardSlot>
                    ))}
                </div>
            </div>

            {/* Bottom Row: Tableaus */}
            <div className="flex justify-between w-full mt-4 min-h-[400px]">
                {gameState.tableaus.map((tab, colIdx) => (
                    <div 
                        key={`tab-${colIdx}`} 
                        className="w-14 sm:w-20 lg:w-24 relative"
                    >
                         {tab.length === 0 ? (
                             <CardSlot onClick={() => handlePileClick({ type: 'Tableau', index: colIdx })} />
                         ) : (
                             tab.map((card, cardIdx) => {
                                 const topOffset = cardIdx * (card.isFaceUp ? 24 : 12);
                                 const _isSelected = isSelected('Tableau', colIdx, cardIdx);
                                 return (
                                     <div 
                                        key={card.id}
                                        className={`absolute w-full aspect-[2.5/3.5] transition-transform
                                            ${_isSelected || (selectedPile?.type === 'Tableau' && selectedPile.index === colIdx && selectedPile.cardIndex! < cardIdx) ? 'brightness-110 drop-shadow-[0_0_15px_rgba(250,204,21,0.6)]' : ''}
                                        `}
                                        style={{ top: `${topOffset}px`, zIndex: cardIdx }}
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            // Only allow clicking face up cards or the topmost face down
                                            if (card.isFaceUp) {
                                                handlePileClick({ type: 'Tableau', index: colIdx, cardIndex: cardIdx });
                                            } else if (cardIdx === tab.length - 1) {
                                                // Clicking top face-down card... rules handle revealing automatically now, 
                                                // but if it somehow didn't reveal, we could manual reveal here.
                                                // It's mostly just ignored, or we can select as an empty target area.
                                            }
                                        }}
                                     >
                                        <div className={`w-full h-full ${_isSelected ? 'ring-2 ring-yellow-400 rounded-md' : ''}`}>
                                            {card.isFaceUp ? renderCard(card, cardIdx === tab.length - 1) : renderCardBack()}
                                        </div>
                                     </div>
                                 );
                             })
                         )}
                         
                         {/* Invisible overlay for the empty space below cards to accept drops */}
                         {tab.length > 0 && (
                             <div 
                                className="absolute w-full h-[500px]"
                                style={{ top: `${tab.length * 24}px`, zIndex: 0 }}
                                onClick={(e) => {
                                    e.stopPropagation();
                                    handlePileClick({ type: 'Tableau', index: colIdx });
                                }}
                             />
                         )}
                    </div>
                ))}
            </div>

            {/* Game Over Overlay */}
            {gameState.isGameOver && (
                <div className="absolute inset-0 bg-black/60 backdrop-blur-sm flex flex-col items-center justify-center animate-fade-in z-20 rounded-2xl">
                    <span className="text-4xl sm:text-6xl font-black text-transparent bg-clip-text bg-gradient-to-r from-yellow-300 via-amber-400 to-yellow-600 mb-6 drop-shadow-[0_0_15px_rgba(251,191,36,0.6)]">
                        SOLVED!
                    </span>
                    <div className="text-white text-xl font-bold mb-8 text-center bg-black/40 p-6 rounded-2xl border border-white/10">
                        <p>Total Score: <span className="text-amber-400">{gameState.score}</span></p>
                        <p>Moves: <span className="text-zinc-300">{gameState.moves}</span></p>
                    </div>
                    <button 
                        onClick={startGame}
                        className="bg-white text-green-900 px-8 py-3 rounded-full font-bold hover:scale-105 hover:bg-green-100 transition-all shadow-xl"
                    >
                        Play Again
                    </button>
                </div>
            )}
        </div>
    </div>
  );
}

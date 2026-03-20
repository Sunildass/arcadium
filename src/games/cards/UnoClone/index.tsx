import React, { useState, useEffect, useCallback } from 'react';
import { UnoEngine, UnoState, UnoCard, UnoColor } from './UnoEngine';
import { PlayerProfileManager } from '../../../core/ai/PlayerProfileManager';

const engine = new UnoEngine(3); // 3 AI Opponents

export default function UnoClone() {
  const [profileManager] = useState(() => new PlayerProfileManager('uno'));
  const [gameState, setGameState] = useState<UnoState | null>(null);

  const startGame = useCallback(() => {
    setGameState(engine.initialize());
  }, []);

  useEffect(() => {
    startGame();
  }, [startGame]);

  // AI Turn Handling
  useEffect(() => {
    if (!gameState || gameState.isGameOver) return;
    const currentPlayer = gameState.players[gameState.turnIndex];
    
    if (currentPlayer.isAI) {
        const timer = setTimeout(() => {
            const move = engine.getAIBestMove(gameState);
            setGameState(engine.update(gameState, move));
        }, 1200); // 1.2s delay so user can see AI moves
        return () => clearTimeout(timer);
    }
  }, [gameState]);

  const handlePlayCard = (card: UnoCard) => {
      if (!gameState || gameState.isGameOver) return;
      const currentPlayer = gameState.players[gameState.turnIndex];
      if (currentPlayer.isAI) return;

      if (engine.canPlayCard(card, gameState)) {
          if (card.color === 'Wild') {
             // For UI simplicity if they click a wild, we trigger a state demanding color choice
             setGameState(engine.update(gameState, { type: 'PLAY_CARD', cardId: card.id })); // Missing color forces awaitingColorChoice
          } else {
             setGameState(engine.update(gameState, { type: 'PLAY_CARD', cardId: card.id }));
          }
      }
  };

  const handleDraw = () => {
      if (!gameState || gameState.isGameOver) return;
      const currentPlayer = gameState.players[gameState.turnIndex];
      if (currentPlayer.isAI || gameState.awaitingColorChoice) return;
      
      setGameState(engine.update(gameState, { type: 'DRAW_CARD' }));
  };

  const handleColorChoice = (color: UnoColor) => {
      if (!gameState || gameState.isGameOver || !gameState.awaitingColorChoice) return;
      setGameState(engine.update(gameState, { type: 'CHOOSE_COLOR', color }));
  };

  useEffect(() => {
      if (gameState?.isGameOver) {
          const result = engine.evaluateWin(gameState);
          if (result) {
               profileManager.recordGameResult(
                   result.winner === 'Player1' ? 'win' : 'loss',
                   result.score,
                   result.difficulty
               );
          }
      }
  }, [gameState?.isGameOver, gameState, profileManager]);

  if (!gameState) return null;

  const getCardColorClass = (color: UnoColor) => {
      switch (color) {
          case 'Red': return 'bg-red-500 text-white';
          case 'Blue': return 'bg-blue-500 text-white';
          case 'Green': return 'bg-green-500 text-white';
          case 'Yellow': return 'bg-yellow-400 text-black';
          case 'Wild': return 'bg-zinc-800 text-white';
          default: return 'bg-zinc-500 text-white';
      }
  };

  const getActiveColorClass = (color: UnoColor) => {
      switch (color) {
          case 'Red': return 'bg-red-500/20 border-red-500';
          case 'Blue': return 'bg-blue-500/20 border-blue-500';
          case 'Green': return 'bg-green-500/20 border-green-500';
          case 'Yellow': return 'bg-yellow-400/20 border-yellow-400';
          default: return 'bg-zinc-800/20 border-zinc-500';
      }
  }

  const renderCard = (card: UnoCard, interactive: boolean = false) => {
      const isPlayable = interactive && engine.canPlayCard(card, gameState);
      
      return (
          <div 
             onClick={() => interactive && isPlayable && handlePlayCard(card)}
             className={`
               w-16 sm:w-20 md:w-24 aspect-[2.5/3.5] rounded-xl border-4 border-white flex flex-col items-center justify-center font-black shadow-lg relative
               ${getCardColorClass(card.color)}
               ${interactive ? 'hover:-translate-y-4 hover:z-10 transition-transform cursor-pointer' : ''}
               ${interactive && !isPlayable ? 'opacity-50 grayscale cursor-not-allowed hover:-translate-y-0' : ''}
               ${interactive && isPlayable ? 'ring-2 ring-white/50 ring-offset-2 ring-offset-black' : ''}
             `}
          >
              {card.color === 'Wild' && (
                  <div className="absolute inset-0 grid grid-cols-2 grid-rows-2 rounded-lg overflow-hidden m-1 opacity-50">
                      <div className="bg-red-500" /><div className="bg-blue-500" />
                      <div className="bg-yellow-400" /><div className="bg-green-500" />
                  </div>
              )}
              
              <div className="absolute top-1 left-2 text-xs sm:text-sm drop-shadow-md z-10">{card.value.replace('DrawTwo', '+2').replace('WildDrawFour', '+4')}</div>
              <div className="text-xl sm:text-3xl rotate-[-15deg] drop-shadow-lg z-10">
                  {card.value.replace('DrawTwo', '+2').replace('Wild', 'W').replace('WDrawFour', '+4').replace('Reverse', '⇌').replace('Skip', '⊘')}
              </div>
              <div className="absolute bottom-1 right-2 text-xs sm:text-sm rotate-180 drop-shadow-md z-10">{card.value.replace('DrawTwo', '+2').replace('WildDrawFour', '+4')}</div>
          </div>
      );
  }

  const renderCardBack = () => (
      <div className="w-16 sm:w-20 md:w-24 aspect-[2.5/3.5] rounded-xl border-4 border-white bg-black flex items-center justify-center shadow-lg relative">
          <div className="bg-red-600 w-[80%] h-[80%] rounded-lg flex items-center justify-center transform -rotate-12 border-2 border-yellow-400">
              <span className="text-yellow-400 font-black text-xl tracking-tighter shadow-black drop-shadow-md">UNO</span>
          </div>
      </div>
  );

  const topCard = gameState.discardPile[gameState.discardPile.length - 1];
  const p1 = gameState.players[0];
  const ais = gameState.players.slice(1);

  return (
    <div className="flex flex-col items-center justify-between py-4 px-2 sm:px-8 w-full h-full min-h-[100vh] relative overflow-hidden text-white" style={{ fontFamily: 'var(--font-heading)'}}> 
        {/* Dynamic Background Sync based on Active Color */}
        <div className={`absolute inset-0 transition-colors duration-1000 -z-10 ${getActiveColorClass(gameState.activeColor)} border-0`} />

        {/* Header Options */}
        <div className="flex justify-between w-full max-w-5xl mb-2 items-center z-10">
            <h1 className="text-2xl font-black drop-shadow-md tracking-widest text-white/80">COLOR MATCH</h1>
            <button 
                onClick={startGame}
                className="bg-black/50 hover:bg-black text-white px-4 py-1 rounded-full text-sm font-bold transition-colors border border-white/20"
            >
                Restart
            </button>
        </div>

        {/* AI Opponents */}
        <div className="flex justify-around w-full max-w-4xl z-10 mt-2 px-4 gap-2">
            {ais.map((ai, index) => (
                <div key={ai.id} className={`flex flex-col items-center transition-opacity ${gameState.players[gameState.turnIndex].id === ai.id ? 'opacity-100 scale-110' : 'opacity-40'}`}>
                    <div className="bg-black/60 px-4 py-1 rounded-t-lg font-bold border-t border-x border-white/20 whitespace-nowrap text-xs sm:text-base">
                       {ai.name} {ai.hand.length === 1 && <span className="text-red-500 animate-pulse ml-2 font-black">UNO!</span>}
                    </div>
                    <div className="relative h-20 sm:h-24 w-16 sm:w-24">
                        {ai.hand.map((_, i) => (
                            <div key={i} className="absolute top-0 shadow-md" style={{ left: `${Math.min(i * 5, 40)}px`, transform: `rotate(${Math.min(i * 2, 10)}deg)` }}>
                                {renderCardBack()}
                            </div>
                        ))}
                        <div className="absolute -bottom-3 -right-2 bg-white text-black font-black rounded-full w-8 h-8 flex items-center justify-center border-2 border-black z-20 shadow-lg">
                            {ai.hand.length}
                        </div>
                    </div>
                </div>
            ))}
        </div>

        {/* Center Play Area */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-8 w-full max-w-2xl py-8 my-auto z-10 relative">
            
            {/* Direction Indicator Overlay */}
            <div className="absolute inset-0 flex items-center justify-center opacity-10 pointer-events-none -z-10">
                <span className="text-[200px] font-black">{gameState.direction === 1 ? '↻' : '↺'}</span>
            </div>

            <div className="flex flex-col items-center gap-2">
                <span className="text-xs font-bold tracking-widest text-white/50">DRAW PILE</span>
                <div 
                    className={`relative cursor-pointer transition-transform hover:-translate-y-2
                       ${gameState.turnIndex === 0 && !gameState.awaitingColorChoice ? 'ring-4 ring-white ring-offset-4 ring-offset-transparent rounded-xl' : ''}
                    `}
                    onClick={handleDraw}
                >
                    {renderCardBack()}
                    <div className="absolute -top-3 -right-3 bg-rose-500 text-white font-black rounded-full px-2 py-1 text-xs border border-white shadow-lg">
                        {gameState.deck.length}
                    </div>
                </div>
            </div>

            <div className="flex flex-col items-center gap-2">
                <span className="text-xs font-bold tracking-widest text-white/50">ACTIVE</span>
                {topCard && renderCard({ ...topCard, color: gameState.activeColor })}
            </div>
            
            {/* Draw Pending Indicator */}
            {gameState.drawPending > 0 && (
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-5xl font-black text-rose-500 drop-shadow-[0_0_20px_rgba(0,0,0,1)] animate-bounce z-30">
                    +{gameState.drawPending}
                </div>
            )}
        </div>

        {/* Game Info Status */}
        <div className="z-10 font-bold text-center h-8 my-2 drop-shadow-md bg-black/40 px-6 py-1 rounded-full border border-white/10">
            {gameState.turnIndex === 0 
                ? (gameState.drawPending > 0 ? "You must DRAW!" : "YOUR TURN") 
                : `${gameState.players[gameState.turnIndex].name}'s Turn...`}
        </div>

        {/* Player Hand Area */}
        <div className="w-full max-w-5xl bg-black/40 p-4 sm:p-6 rounded-t-3xl border-t border-x border-white/20 z-10 relative">
            
            {/* Color Chooser Overlay */}
            {gameState.awaitingColorChoice && (
                <div className="absolute inset-0 bg-black/80 backdrop-blur-sm flex flex-col items-center justify-center z-30 rounded-t-3xl">
                    <h2 className="text-2xl font-black mb-6 text-white drop-shadow-lg tracking-widest">CHOOSE WILD COLOR</h2>
                    <div className="flex gap-4">
                        {(['Red', 'Blue', 'Green', 'Yellow'] as UnoColor[]).map(c => (
                            <button 
                                key={c}
                                onClick={() => handleColorChoice(c)}
                                className={`w-16 h-16 sm:w-20 sm:h-20 rounded-full shadow-lg border-4 border-white transition-transform hover:scale-110 active:scale-95 ${getCardColorClass(c)}`}
                            />
                        ))}
                    </div>
                </div>
            )}

            <div className="flex justify-between items-center mb-4">
                <span className="font-bold tracking-widest text-white/50 text-sm">YOUR HAND</span>
                {p1.hand.length === 1 && <span className="text-red-500 font-black animate-pulse drop-shadow-md text-xl">UNO!</span>}
            </div>

            <div className="flex flex-wrap justify-center gap-[-20px] sm:gap-2 max-h-[250px] overflow-y-auto w-full p-2">
                {p1.hand.map((card, index) => (
                    <div key={card.id} className="transition-all duration-300 transform sm:hover:mx-2 -ml-6 sm:ml-0 first:ml-0">
                        {renderCard(card, gameState.turnIndex === 0)}
                    </div>
                ))}
            </div>
        </div>

        {/* Game Over Overlay */}
        {gameState.isGameOver && (
            <div className="absolute inset-0 bg-black/80 backdrop-blur-md flex flex-col items-center justify-center animate-fade-in z-50">
                <span className={`text-6xl font-black mb-8 drop-shadow-[0_0_20px_rgba(255,255,255,0.3)] tracking-tighter
                    ${gameState.winner === 'P1' ? 'text-green-400' : 'text-red-500'}`}
                >
                    {gameState.winner === 'P1' ? 'VICTORY!' : 'DEFEAT'}
                </span>
                <span className="text-2xl text-white mb-8 font-bold">
                    {gameState.players.find(p => p.id === gameState.winner)?.name} won the match.
                </span>
                <button 
                    onClick={startGame}
                    className="bg-white text-black px-8 py-3 rounded-full font-black hover:scale-105 transition-transform shadow-xl hover:bg-zinc-200"
                >
                    Play Again
                </button>
            </div>
        )}
    </div>
  );
}

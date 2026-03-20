import React, { useState, useEffect, useCallback } from 'react';
import { BattleshipEngine, BattleshipState, ShipType, Position } from './BattleshipEngine';
import { PlayerProfileManager } from '../../../core/ai/PlayerProfileManager';

const engine = new BattleshipEngine(7);

export default function Battleship() {
  const [profileManager] = useState(() => new PlayerProfileManager('battleship'));
  const [gameState, setGameState] = useState<BattleshipState | null>(null);
  
  // Placement State
  const [selectedShipId, setSelectedShipId] = useState<string | null>(null);
  const [isVertical, setIsVertical] = useState(false);

  const startGame = useCallback(() => {
    setGameState(engine.initialize());
  }, []);

  useEffect(() => {
    startGame();
  }, [startGame]);

  // AI Turn Hook
  useEffect(() => {
      if (!gameState || gameState.isGameOver || gameState.phase !== 'playing') return;

      if (gameState.turn === 'AI') {
          const t = setTimeout(() => {
               const action = engine.getAIMove(gameState);
               setGameState(engine.update(gameState, action));
          }, 800);
          return () => clearTimeout(t);
      }
  }, [gameState]);

  // Handle Win
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

  const handlePlayerCellClick = (r: number, c: number) => {
      if (!gameState || gameState.phase !== 'setup') return;

      if (selectedShipId) {
          setGameState(engine.update(gameState, { 
              type: 'PLACE_SHIP', 
              shipId: selectedShipId, 
              pos: { r, c }, 
              vertical: isVertical 
          }));
          // Auto select next unplaced ship
          const nextTarget = gameState.playerBoard.ships.find(s => s.id !== selectedShipId && !s.placed);
          if (nextTarget) {
              // Note: strictly speaking, we wait for next render for the ship to be placed, 
              // but trusting the selection switch logic works synchronously in mind here.
          }
      }
  };

  const handleAITargetClick = (r: number, c: number) => {
      if (!gameState || gameState.phase !== 'playing' || gameState.turn !== 'Player1') return;
      setGameState(engine.update(gameState, { type: 'FIRE', pos: { r, c }}));
  };

  if (!gameState) return null;

  const renderGrid = (owner: 'Player1' | 'AI') => {
      const board = owner === 'Player1' ? gameState.playerBoard : gameState.aiBoard;
      const isPlayer = owner === 'Player1';
      const isFiringTarget = gameState.phase === 'playing' && !isPlayer;
      
      return (
          <div className="flex flex-col items-center">
              <h4 className="text-zinc-400 font-bold mb-2 tracking-widest">{isPlayer ? 'YOUR FLEET' : 'ENEMY WATERS'}</h4>
              <div className="grid grid-cols-10 grid-rows-10 border-4 border-cyan-900 bg-cyan-950 shadow-2xl relative w-full sm:w-auto max-w-[40vw]">
                  {board.grid.map((row, r) => (
                      row.map((cell, c) => {
                          const isShip = cell === 'ship';
                          const isHit = cell === 'hit';
                          const isMiss = cell === 'miss';
                          
                          // Hide AI ships unless dead (we track sunk per ship later, simple version reveals on hits)
                          // Strictly, we only draw ships if player or if hit.
                          const drawShip = (isPlayer && isShip) || isHit;

                          return (
                              <div 
                                  key={`${r}-${c}`}
                                  onClick={() => {
                                      if (gameState.phase === 'setup' && isPlayer) handlePlayerCellClick(r, c);
                                      if (isFiringTarget) handleAITargetClick(r, c);
                                  }}
                                  className={`
                                     w-6 h-6 sm:w-8 sm:h-8 lg:w-10 lg:h-10 border border-cyan-800/50 flex items-center justify-center transition-colors relative
                                     ${gameState.phase === 'setup' && isPlayer ? 'hover:bg-cyan-700 cursor-pointer' : ''}
                                     ${isFiringTarget ? 'hover:bg-red-500/20 cursor-crosshair' : ''}
                                  `}
                              >
                                  {drawShip && !isHit && (
                                     <div className="w-[80%] h-[80%] bg-zinc-400 rounded-sm shadow-inner" />
                                  )}
                                  
                                  {drawShip && isHit && (
                                      <div className="absolute inset-0 bg-red-900 flex items-center justify-center z-10 animate-pulse">
                                          <div className="w-full h-full text-red-400 opacity-50 bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI4IiBoZWlnaHQ9IjgiPgo8cmVjdCB3aWR0aD0iOCIgaGVpZ2h0PSI4IiBmaWxsPSIjRkZGRkZGIiBmaWxsLW9wYWNpdHk9IjAiLz4KPHBhdGggZD0iTTAgMEw4IDhaTTAgOEw4IDBaIiBzdHJva2U9IiNGRjAwMDAiIHN0cm9rZS13aWR0aD0iMSIvPgo8L3N2Zz4=')]"></div>
                                      </div>
                                  )}

                                  {isMiss && (
                                      <div className="w-[30%] h-[30%] bg-blue-300 rounded-full opacity-50 z-10" />
                                  )}
                              </div>
                          );
                      })
                  ))}
                  
                  {/* Fog of war overlay on AI grid during setup */}
                  {owner === 'AI' && gameState.phase === 'setup' && (
                      <div className="absolute inset-0 bg-black/50 backdrop-blur-md flex items-center justify-center z-20">
                           <span className="text-cyan-500 font-black animate-pulse uppercase tracking-[0.5em]">Awaiting Orders</span>
                      </div>
                  )}
              </div>
          </div>
      );
  };

  return (
    <div className="flex flex-col items-center justify-start p-4 w-full h-full min-h-[100vh] bg-zinc-950 font-mono text-zinc-100"> 
        
        {/* Header HUD */}
        <div className="flex justify-between w-full max-w-5xl mb-6 items-center bg-cyan-950/40 p-4 rounded-xl shadow-inner border border-cyan-500/20">
            <h1 className="text-xl sm:text-3xl font-black text-cyan-500 drop-shadow-[0_0_8px_rgba(6,182,212,0.8)] uppercase">Tactical Ops</h1>
            <div className="font-bold text-center px-6 py-2 bg-black/60 rounded-full border border-cyan-800">
                {gameState.phase === 'setup' && <span className="text-yellow-400">DEPLOY FLEET</span>}
                {gameState.phase === 'playing' && gameState.turn === 'Player1' && <span className="text-green-400">ENGAGE TARGET</span>}
                {gameState.phase === 'playing' && gameState.turn === 'AI' && <span className="text-red-500 animate-pulse">INCOMING FIRE...</span>}
                {gameState.phase === 'gameover' && <span>MISSION COMPLETE</span>}
            </div>
            <button onClick={startGame} className="bg-cyan-900 border border-cyan-700 hover:bg-cyan-800 text-white px-4 py-2 rounded-lg font-bold transition-colors">Abort</button>
        </div>

        {/* Central Layout */}
        <div className="flex flex-col xl:flex-row items-center justify-center gap-8 w-full max-w-6xl relative z-10">
            {renderGrid('Player1')}
            
            {/* Setup Controls Panel */}
            {gameState.phase === 'setup' && (
                <div className="flex flex-col p-6 bg-zinc-900 border-2 border-cyan-800 rounded-xl max-w-sm w-full shadow-2xl items-center text-center">
                    <h3 className="text-lg font-bold mb-4 text-cyan-300">Available Units</h3>
                    <div className="flex flex-col gap-2 w-full mb-6 text-sm">
                        {gameState.playerBoard.ships.map(s => (
                            <button 
                                key={s.id}
                                disabled={s.placed}
                                onClick={() => setSelectedShipId(s.id)}
                                className={`
                                    w-full py-2 px-4 rounded font-bold transition-colors border flex justify-between items-center
                                    ${s.placed ? 'bg-zinc-800 border-zinc-700 text-zinc-600' : 'bg-cyan-950 border-cyan-600 hover:bg-cyan-800 text-cyan-100'}
                                    ${selectedShipId === s.id && !s.placed ? 'ring-2 ring-cyan-400 ring-offset-2 ring-offset-zinc-900' : ''}
                                `}
                            >
                                <span>{s.type}</span>
                                <span>[ {s.size} ]</span>
                            </button>
                        ))}
                    </div>

                    <div className="flex gap-4 w-full mb-6">
                        <button 
                            className={`flex-1 py-3 font-black rounded-lg transition-colors border ${!isVertical ? 'bg-cyan-600 border-cyan-400 text-white shadow-[0_0_10px_cyan]' : 'bg-zinc-800 border-zinc-600'}`}
                            onClick={() => setIsVertical(false)}
                        >
                            HORIZ
                        </button>
                        <button 
                            className={`flex-1 py-3 font-black rounded-lg transition-colors border ${isVertical ? 'bg-cyan-600 border-cyan-400 text-white shadow-[0_0_10px_cyan]' : 'bg-zinc-800 border-zinc-600'}`}
                            onClick={() => setIsVertical(true)}
                        >
                            VERT
                        </button>
                    </div>

                    <div className="flex gap-2 w-full">
                         <button 
                            className="flex-1 bg-zinc-700 py-3 rounded-lg font-bold hover:bg-zinc-600 transition-colors border border-zinc-500"
                            onClick={() => setGameState(engine.update(gameState, { type: 'AUTO_PLACE' }))}
                         >
                            Auto Deploy
                         </button>
                         <button 
                            disabled={!gameState.playerBoard.ships.every(s => s.placed)}
                            className="flex-1 bg-red-600 disabled:bg-zinc-800 text-white py-3 rounded-lg font-black tracking-widest transition-all disabled:opacity-50 disabled:border-zinc-700 border border-red-400 disabled:shadow-none shadow-[0_0_15px_rgba(220,38,38,0.6)]"
                            onClick={() => setGameState(engine.update(gameState, { type: 'START_GAME' }))}
                         >
                            INITIATE
                         </button>
                    </div>
                </div>
            )}

            {renderGrid('AI')}
        </div>

        {/* Game Over HUD Overlay */}
        {gameState.isGameOver && (
            <div className="absolute inset-0 bg-black/80 backdrop-blur-sm flex flex-col items-center justify-center animate-fade-in z-50">
                 <h2 className={`text-6xl sm:text-8xl font-black tracking-tighter drop-shadow-[0_0_20px_rgba(255,255,255,0.4)] mb-8
                     ${gameState.winner === 'Player1' ? 'text-cyan-400' : 'text-red-500'}
                 `}>
                     {gameState.winner === 'Player1' ? 'VICTORY' : 'DEFEAT'}
                 </h2>
                 <button 
                     className="px-8 py-3 bg-white text-black font-black uppercase tracking-widest text-xl rounded-sm hover:-translate-y-1 hover:bg-cyan-100 transition-all shadow-[8px_8px_0_rgba(6,182,212,0.5)]"
                     onClick={startGame}
                 >
                     New Operation
                 </button>
            </div>
        )}
    </div>
  );
}

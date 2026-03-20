import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { ChessEngine, ChessState, Move, Position, Piece } from './ChessEngine';
import { PlayerProfileManager } from '../../../core/ai/PlayerProfileManager';
import { DifficultyManager } from '../../../core/ai/DifficultyManager';

export default function Chess() {
  const [mode, setMode] = useState<'1P' | '2P'>('1P');
  const [difficultyManager] = useState(() => new DifficultyManager('chess', 5));
  const [profileManager] = useState(() => new PlayerProfileManager('chess'));
  
  const [engine, setEngine] = useState(() => new ChessEngine(mode, difficultyManager.getCurrentDifficulty()));
  const [gameState, setGameState] = useState<ChessState | null>(null);

  const [selectedPos, setSelectedPos] = useState<Position | null>(null);
  const [isPromoting, setIsPromoting] = useState<Move | null>(null);

  const startGame = useCallback((newMode?: '1P' | '2P') => {
    const activeMode = newMode || mode;
    const diff = difficultyManager.getCurrentDifficulty();
    const newEngine = new ChessEngine(activeMode, diff);
    setEngine(newEngine);
    setGameState(newEngine.initialize());
    setSelectedPos(null);
    setIsPromoting(null);
  }, [mode, difficultyManager]);

  useEffect(() => {
    startGame();
  }, [startGame]);

  // AI Hook
  useEffect(() => {
    if (!gameState || gameState.isGameOver) return;
    if (mode === '1P' && gameState.turn === 'b' && !isPromoting) {
        const timer = setTimeout(() => {
            const aiMove = engine.computeAIMove(gameState);
            if (aiMove) {
                setGameState(engine.update(gameState, aiMove));
            }
        }, 600);
        return () => clearTimeout(timer);
    }
  }, [gameState, engine, mode, isPromoting]);

  const handleSquareClick = (r: number, c: number) => {
      if (!gameState || gameState.isGameOver || isPromoting) return;
      if (mode === '1P' && gameState.turn === 'b') return; // AI Turn lock

      const piece = gameState.board[r][c];

      if (!selectedPos) {
          if (piece && piece.color === gameState.turn) {
              setSelectedPos({ r, c });
          }
      } else {
          // Deselect if clicking same square or another friendly piece
          if (selectedPos.r === r && selectedPos.c === c) {
              setSelectedPos(null);
              return;
          }
          if (piece && piece.color === gameState.turn) {
              setSelectedPos({ r, c });
              return;
          }

          // Check if valid move target
          const moves = gameState.validMoves.filter(m => 
              m.from.r === selectedPos.r && m.from.c === selectedPos.c && 
              m.to.r === r && m.to.c === c
          );

          if (moves.length > 0) {
              // Handle Promotion trap
              if (moves[0].promotion) {
                  // We require user input to select promotion piece, hold the move
                  setIsPromoting(moves[0]); 
              } else {
                  setGameState(engine.update(gameState, moves[0]));
                  setSelectedPos(null);
              }
          } else {
              setSelectedPos(null);
          }
      }
  };

  const handlePromotionSelect = (type: 'q' | 'r' | 'b' | 'n') => {
      if (!isPromoting || !gameState) return;
      
      const move = gameState.validMoves.find(m => 
          m.from.r === isPromoting.from.r && 
          m.from.c === isPromoting.from.c &&
          m.to.r === isPromoting.to.r &&
          m.to.c === isPromoting.to.c &&
          m.promotion === type
      );

      if (move) {
          setGameState(engine.update(gameState, move));
      }
      setIsPromoting(null);
      setSelectedPos(null);
  }

  // End game stats
  useEffect(() => {
      if (gameState?.isGameOver) {
          const result = engine.evaluateWin(gameState);
          if (result) {
               profileManager.recordGameResult(
                   result.winner === null ? 'draw' : result.winner === 'Player1' ? 'win' : 'loss',
                   result.score,
                   result.difficulty
               );
          }
      }
  }, [gameState?.isGameOver, gameState, profileManager]);

  if (!gameState) return null;

  const validTargets = selectedPos 
       ? gameState.validMoves.filter(m => m.from.r === selectedPos.r && m.from.c === selectedPos.c).map(m => `${m.to.r},${m.to.c}`)
       : [];

  const getPieceSymbol = (piece: Piece) => {
      const isW = piece.color === 'w';
      switch(piece.type) {
          case 'k': return isW ? '♔' : '♚';
          case 'q': return isW ? '♕' : '♛';
          case 'r': return isW ? '♖' : '♜';
          case 'b': return isW ? '♗' : '♝';
          case 'n': return isW ? '♘' : '♞';
          case 'p': return isW ? '♙' : '♟';
      }
  };

  return (
    <div className="flex flex-col items-center justify-center p-4 w-full h-full text-zinc-100" style={{ fontFamily: 'var(--font-heading)' }}> 
        <div className="flex flex-col items-center gap-6 w-full max-w-lg">
            
            {/* Context/Control Bar */}
            <div className="flex justify-between w-full items-center bg-zinc-900/80 p-3 rounded-2xl border border-white/10 shadow-lg backdrop-blur-md">
                <select 
                  className="bg-black/50 border bg-transparent border-white/20 text-white rounded-lg p-2 outline-none font-bold tracking-widest cursor-pointer"
                  value={mode}
                  onChange={(e) => startGame(e.target.value as '1P' | '2P')}
                >
                  <option value="1P">1 Player</option>
                  <option value="2P">2 Player</option>
                </select>
                
                <h3 className="text-xl font-black drop-shadow-md">
                    {gameState.isGameOver 
                        ? <span className="text-emerald-400">{gameState.winner === 'Draw' ? 'Stalemate' : `${gameState.winner === 'w' ? 'White' : 'Black'} Wins!`}</span>
                        : <span className={gameState.turn === 'w' ? 'text-zinc-50' : 'text-zinc-500'}>
                              {gameState.turn === 'w' ? "White's Turn" : "Black's Turn"} {gameState.inCheck && <span className="text-red-500 animate-pulse">+ Check</span>}
                          </span>
                    }
                </h3>
            </div>

            {/* Board Container */}
            <div className={`
                w-full aspect-square relative border-8 border-zinc-800 rounded-lg shadow-2xl bg-zinc-700
                ${mode === '2P' && gameState.turn === 'b' ? 'rotate-180' : ''} transition-transform duration-700
            `}>
                <div className="absolute inset-0 grid grid-cols-8 grid-rows-8">
                    {gameState.board.map((row, r) => (
                        row.map((piece, c) => {
                            const isDark = (r + c) % 2 === 1;
                            const isSelected = selectedPos?.r === r && selectedPos?.c === c;
                            const isTarget = validTargets.includes(`${r},${c}`);
                            const lastMoveHighlight = gameState.lastMove && ((gameState.lastMove.from.r === r && gameState.lastMove.from.c === c) || (gameState.lastMove.to.r === r && gameState.lastMove.to.c === c));

                            return (
                                <div 
                                    key={`${r}-${c}`}
                                    onClick={() => handleSquareClick(r, c)}
                                    className={`
                                        w-full h-full relative flex flex-col items-center justify-center transition-colors
                                        ${isDark ? 'bg-[#5e7760]' : 'bg-[#e2e1c9]'}
                                        ${isSelected ? 'bg-yellow-400/80' : ''}
                                        ${lastMoveHighlight && !isSelected ? 'bg-amber-300/40' : ''}
                                        ${piece && piece.color === gameState.turn ? 'cursor-pointer hover:opacity-90' : ''}
                                    `}
                                >
                                    {/* Piece Label */}
                                    {piece && (
                                        <span className={`
                                            text-4xl sm:text-6xl cursor-pointer select-none drop-shadow-lg transition-transform hover:scale-110
                                            ${piece.color === 'w' ? 'text-white' : 'text-zinc-950'}
                                            ${mode === '2P' && gameState.turn === 'b' ? 'rotate-180' : ''}
                                        `}>
                                            {getPieceSymbol(piece)}
                                        </span>
                                    )}

                                    {/* Valid Target Dot / Overlay */}
                                    {isTarget && (
                                        <div className={`
                                            absolute w-[35%] h-[35%] rounded-full shadow-inner pointer-events-none
                                            ${piece ? 'bg-red-500/50 scale-150 ring-2 ring-red-500' : 'bg-black/20'}
                                        `} />
                                    )}
                                </div>
                            );
                        })
                    ))}
                </div>

                {/* Promotion Menu Overlay */}
                {isPromoting && (
                    <div className="absolute inset-0 z-20 flex bg-black/60 items-center justify-center backdrop-blur-sm">
                        <div className="bg-zinc-800 p-6 rounded-2xl flex gap-4 shadow-2xl border border-white/20">
                            {(['q', 'r', 'n', 'b'] as const).map(p => (
                                <button 
                                    key={p} onClick={() => handlePromotionSelect(p)}
                                    className="w-16 h-16 bg-white/10 hover:bg-white/30 rounded-lg text-4xl text-white outline-none active:scale-95 transition-transform"
                                >
                                    {getPieceSymbol({ type: p, color: gameState.turn })}
                                </button>
                            ))}
                        </div>
                    </div>
                )}
                
                {/* Checkmate Overlay */}
                {gameState.isGameOver && (
                    <div className="absolute inset-0 z-30 bg-black/70 backdrop-blur-sm flex flex-col items-center justify-center animate-fade-in text-white pointer-events-none">
                        <span className="text-6xl font-black drop-shadow-[0_0_15px_rgba(255,255,255,0.5)] mb-4">{gameState.winner === 'Draw' ? 'DRAW' : 'CHECKMATE'}</span>
                        <button 
                            className="pointer-events-auto bg-green-500 text-white px-8 py-3 rounded-full font-black text-xl hover:bg-green-400 active:scale-95 transition-all shadow-xl"
                            onClick={() => startGame()}
                        >
                            Play Again
                        </button>
                    </div>
                )}
            </div>
        </div>
    </div>
  );
}

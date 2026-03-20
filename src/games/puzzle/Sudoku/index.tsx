import React, { useState, useEffect, useCallback } from 'react';
import { SudokuEngine } from './SudokuEngine';
import { SudokuState, SudokuValue } from './types';
import { PlayerProfileManager } from '../../../core/ai/PlayerProfileManager';

export default function Sudoku() {
  const [engine] = useState(() => new SudokuEngine());
  const [gameState, setGameState] = useState<SudokuState>(() => engine.startNewGame('Medium'));
  const [profileManager] = useState(() => new PlayerProfileManager('sudoku'));
  const [selectedCell, setSelectedCell] = useState<{r: number, c: number} | null>(null);

  const [timer, setTimer] = useState(0);
  const [isPlaying, setIsPlaying] = useState(true);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isPlaying && !gameState.isGameOver) {
      interval = setInterval(() => {
        setTimer((t) => t + 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isPlaying, gameState.isGameOver]);

  const handleNewGame = (difficulty: 'Easy' | 'Medium' | 'Hard') => {
    const newState = engine.startNewGame(difficulty);
    setGameState(newState);
    setSelectedCell(null);
    setTimer(0);
    setIsPlaying(true);
  };

  const handleCellClick = (r: number, c: number) => {
    if (gameState.isGameOver) return;
    setSelectedCell({ r, c });
  };

  const handleInput = useCallback((num: number | null) => {
    if (!selectedCell || gameState.isGameOver) return;

    if (gameState.noteMode && num !== null) {
        const newState = engine.update(gameState, { r: selectedCell.r, c: selectedCell.c, v: 'note', num });
        setGameState(newState);
    } else {
        const newState = engine.update(gameState, { r: selectedCell.r, c: selectedCell.c, v: num as SudokuValue });
        setGameState(newState);

        if (newState.isGameOver) {
            setIsPlaying(false);
            profileManager.recordGameResult('win', timer * 1000, newState.difficulty);
        }
    }
  }, [selectedCell, gameState, engine, timer, profileManager]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!selectedCell) return;
      
      if (e.key >= '1' && e.key <= '9') {
        handleInput(parseInt(e.key));
      } else if (e.key === 'Backspace' || e.key === 'Delete') {
        handleInput(null);
      } else if (e.key.toLowerCase() === 'n') {
          setGameState(prev => ({...prev, noteMode: !prev.noteMode }));
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedCell, handleInput]);

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60).toString().padStart(2, '0');
    const s = (seconds % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  return (
    <div className="flex flex-col items-center justify-center p-4">
      <div className="flex flex-col sm:flex-row justify-between w-full max-w-md mb-4 items-center gap-4">
        <h2 className="text-3xl font-bold tracking-tight">Sudoku</h2>
        <div className="flex gap-2 text-sm">
          <button onClick={() => handleNewGame('Easy')} className={`px-3 py-1 rounded ${gameState.difficulty === 'Easy' ? 'bg-indigo-600 text-white' : 'bg-zinc-800 text-zinc-400 hover:text-white'}`}>Easy</button>
          <button onClick={() => handleNewGame('Medium')} className={`px-3 py-1 rounded ${gameState.difficulty === 'Medium' ? 'bg-indigo-600 text-white' : 'bg-zinc-800 text-zinc-400 hover:text-white'}`}>Medium</button>
          <button onClick={() => handleNewGame('Hard')} className={`px-3 py-1 rounded ${gameState.difficulty === 'Hard' ? 'bg-indigo-600 text-white' : 'bg-zinc-800 text-zinc-400 hover:text-white'}`}>Hard</button>
        </div>
      </div>

      <div className="flex justify-between w-full max-w-md text-zinc-400 mb-4 px-2">
         <span>Mistakes: <span className="text-rose-500 font-bold">{gameState.mistakes}</span></span>
         <span className="font-mono text-lg">{formatTime(timer)}</span>
      </div>

      {gameState.isGameOver && (
          <div className="w-full max-w-md bg-emerald-900/50 border border-emerald-500 text-emerald-300 p-4 rounded-lg mb-6 text-center animate-bounce shadow-[0_0_15px_rgba(16,185,129,0.3)]">
              <h3 className="text-2xl font-black mb-1">Puzzle Solved!</h3>
              <p>Time: {formatTime(timer)} | Mistakes: {gameState.mistakes}</p>
          </div>
      )}

      {/* Grid */}
      <div className="bg-zinc-300 p-1 sm:p-2 rounded-xl shadow-2xl touch-none select-none">
        <div className="grid grid-cols-9 gap-[1px] bg-zinc-800 border-2 border-zinc-900">
          {gameState.board.map((row, r) => 
            row.map((cell, c) => {
              const isSelected = selectedCell?.r === r && selectedCell?.c === c;
              const isHighlightRowCol = selectedCell?.r === r || selectedCell?.c === c;
              const isSameNumber = selectedCell && gameState.board[selectedCell.r][selectedCell.c].value === cell.value && cell.value !== null;
              
              // Thicker borders for 3x3 boxes
              const bBottom = r === 2 || r === 5 ? 'border-b-2 border-b-zinc-900 ' : 'border-b border-b-zinc-400 ';
              const bRight = c === 2 || c === 5 ? 'border-r-2 border-r-zinc-900 ' : 'border-r border-r-zinc-400 ';
              
              const baseBg = cell.isInitial ? 'bg-slate-200 text-indigo-900' : 'bg-white text-blue-600';
              const bg = isSelected ? 'bg-indigo-300 text-indigo-900' : isSameNumber ? 'bg-indigo-200' : isHighlightRowCol ? 'bg-slate-300' : baseBg;
              
              const errorStyle = cell.isError ? 'bg-rose-200 text-rose-700 animate-pulse' : '';

              return (
                <div 
                  key={`${r}-${c}`}
                  onClick={() => handleCellClick(r, c)}
                  className={`w-8 h-8 sm:w-12 sm:h-12 flex flex-wrap items-center justify-center text-xl sm:text-3xl font-medium cursor-pointer transition-colors ${bBottom}${bRight}${bg} ${errorStyle} ${!cell.isInitial && !cell.isError ? 'font-light': 'font-black'}`}
                >
                  {cell.value !== null ? cell.value : (
                    <div className="grid grid-cols-3 grid-rows-3 w-full h-full p-[2px]">
                        {[1,2,3,4,5,6,7,8,9].map(n => (
                            <span key={n} className="text-[8px] sm:text-[10px] leading-none text-zinc-500 font-normal flex items-center justify-center">
                                {cell.notes.has(n) ? n : ''}
                            </span>
                        ))}
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>

       {/* Controls */}
       <div className="w-full max-w-md mt-6 select-none">
          <div className="flex justify-between mb-4">
             <button 
                onClick={() => setGameState(prev => ({...prev, noteMode: !prev.noteMode }))}
                className={`py-2 px-4 rounded-lg font-bold shadow transition-colors flex-1 mr-2 ${gameState.noteMode ? 'bg-emerald-600 text-white' : 'bg-zinc-700 text-zinc-300 hover:bg-zinc-600'}`}
              >
                  Notes: {gameState.noteMode ? 'ON' : 'OFF'} (N)
              </button>
              <button 
                onClick={() => handleInput(null)}
                className="py-2 px-4 rounded-lg font-bold shadow transition-colors flex-1 ml-2 bg-red-600/80 hover:bg-red-500 text-white"
              >
                  Erase
              </button>
          </div>
          <div className="grid grid-cols-5 gap-2 sm:gap-3">
             {[1,2,3,4,5,6,7,8,9].map(n => (
                 <button
                    key={`btn-${n}`}
                    onClick={() => handleInput(n)}
                    className="aspect-square bg-zinc-800 hover:bg-zinc-700 text-white rounded-xl text-2xl font-bold border border-zinc-700 shadow-md active:scale-95 transition-transform"
                 >
                     {n}
                 </button>
             ))}
          </div>
       </div>

    </div>
  );
}

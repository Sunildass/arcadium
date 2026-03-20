import React, { useState, useEffect, useCallback } from 'react';
import { MastermindEngine, MastermindState, PegColor } from './MastermindEngine';
import { PlayerProfileManager } from '../../../core/ai/PlayerProfileManager';

export default function Mastermind() {
    const [difficulty, setDifficulty] = useState<'Easy' | 'Medium' | 'Hard'>('Medium');
    const [engine, setEngine] = useState(() => new MastermindEngine(difficulty));
    const [gameState, setGameState] = useState<MastermindState | null>(null);
    const [profileManager] = useState(() => new PlayerProfileManager('mastermind'));
    
    // UI state for selecting a color to place
    const [selectedColor, setSelectedColor] = useState<PegColor | null>(null);

    const startGame = useCallback((diff?: 'Easy' | 'Medium' | 'Hard') => {
        const d = diff || difficulty;
        setDifficulty(d);
        const newEngine = new MastermindEngine(d);
        setEngine(newEngine);
        setGameState(newEngine.initialize());
        setSelectedColor(null);
    }, [difficulty]);

    useEffect(() => {
        startGame();
    }, [startGame]);

    useEffect(() => {
        if (gameState?.isGameOver) {
            const result = engine.evaluateWin(gameState);
            if (result && result.winner) {
                 profileManager.recordGameResult('win', result.score, difficulty);
            } else if (result && !result.winner) {
                 profileManager.recordGameResult('loss', 0, difficulty);
            }
        }
    }, [gameState?.isGameOver, gameState, profileManager, engine, difficulty]);


    const handleHoleClick = (colIndex: number) => {
         if (!gameState || gameState.isGameOver) return;
         if (selectedColor) {
             setGameState(engine.update(gameState, { type: 'PLACE_PEG', colIndex, color: selectedColor }));
         } else {
             // If clicking an existing peg with NO color selected, act as remove
             if (gameState.currentGuess[colIndex] !== null) {
                  setGameState(engine.update(gameState, { type: 'REMOVE_PEG', colIndex }));
             }
         }
    };

    const handleSubmit = () => {
         if (!gameState) return;
         setGameState(engine.update(gameState, { type: 'SUBMIT_GUESS' }));
    };

    if (!gameState) return null;

    const getColorClass = (c: PegColor | null) => {
         if (!c) return 'bg-transparent border border-black/30 shadow-[inset_0_4px_6px_rgba(0,0,0,0.6)]';
         const map: Record<PegColor, string> = {
             'Red': 'bg-red-500 shadow-[inset_-2px_-4px_6px_rgba(0,0,0,0.4),_0_2px_4px_rgba(0,0,0,0.5)]',
             'Blue': 'bg-blue-500 shadow-[inset_-2px_-4px_6px_rgba(0,0,0,0.4),_0_2px_4px_rgba(0,0,0,0.5)]',
             'Green': 'bg-green-500 shadow-[inset_-2px_-4px_6px_rgba(0,0,0,0.4),_0_2px_4px_rgba(0,0,0,0.5)]',
             'Yellow': 'bg-yellow-400 shadow-[inset_-2px_-4px_6px_rgba(0,0,0,0.4),_0_2px_4px_rgba(0,0,0,0.5)]',
             'Orange': 'bg-orange-500 shadow-[inset_-2px_-4px_6px_rgba(0,0,0,0.4),_0_2px_4px_rgba(0,0,0,0.5)]',
             'Purple': 'bg-purple-500 shadow-[inset_-2px_-4px_6px_rgba(0,0,0,0.4),_0_2px_4px_rgba(0,0,0,0.5)]',
             'Pink': 'bg-pink-400 shadow-[inset_-2px_-4px_6px_rgba(0,0,0,0.4),_0_2px_4px_rgba(0,0,0,0.5)]',
             'Cyan': 'bg-cyan-400 shadow-[inset_-2px_-4px_6px_rgba(0,0,0,0.4),_0_2px_4px_rgba(0,0,0,0.5)]'
         };
         return map[c];
    };

    const isGuessFull = !gameState.currentGuess.includes(null);

    return (
        <div className="flex flex-col items-center justify-center p-4 min-h-[90vh] bg-stone-900 font-sans text-stone-200">
            
            <div className="w-full max-w-lg flex justify-between items-center mb-6">
                <h1 className="text-3xl font-black tracking-widest text-amber-500 drop-shadow-md">Mastermind</h1>
                <select value={difficulty} onChange={e=>startGame(e.target.value as any)} className="bg-stone-800 text-stone-200 outline-none p-2 rounded shadow-inner">
                     <option value="Easy">Easy (No Dupes)</option>
                     <option value="Medium">Medium</option>
                     <option value="Hard">Hard (5 Pegs)</option>
                </select>
            </div>

            {/* The Wooden Board */}
            <div className="relative w-full max-w-lg bg-[#5c4033] border-4 border-[#3e2723] rounded-lg p-4 shadow-[0_20px_50px_rgba(0,0,0,0.8),_inset_0_2px_10px_rgba(255,255,255,0.1)] flex flex-col gap-3">
                 
                 {/* Secret Code Area (Hidden until end) */}
                 <div className="flex bg-[#3e2723] p-3 rounded shadow-inner justify-between items-center mb-2">
                     <span className="font-bold text-amber-700 uppercase tracking-widest text-sm w-16">SECRET</span>
                     <div className="flex gap-2">
                          {gameState.secretCode.map((peg, idx) => (
                               <div key={idx} className={`w-8 h-8 rounded-full ${gameState.isGameOver ? getColorClass(peg) : 'bg-black/50'} flex items-center justify-center`}>
                                   {!gameState.isGameOver && <span className="text-amber-900 font-bold">?</span>}
                               </div>
                          ))}
                     </div>
                     <div className="w-16"></div> {/* Spacer for symmetry */}
                 </div>

                 {/* Guesses Rows (Rendered bottom up technically visually, but top down data structure) */}
                 {/* For aesthetics, typical masterminds decode from bottom to top. We will render indices backwards */}
                 {Array.from({length: gameState.maxRows}).map((_, rIdxReversed) => {
                     const rowIdx = (gameState.maxRows - 1) - rIdxReversed;
                     const isCurrent = rowIdx === gameState.currentRow && !gameState.isGameOver;
                     const guessRecord = gameState.guesses[rowIdx];

                     return (
                          <div key={rowIdx} className={`flex items-center justify-between p-2 rounded ${isCurrent ? 'bg-amber-900/40 ring-2 ring-amber-600 shadow-[inset_0_0_15px_rgba(217,119,6,0.2)]' : ''}`}>
                               <span className="font-mono text-amber-800/80 font-bold w-6 text-sm">{rowIdx + 1}</span>
                               
                               {/* Holes */}
                               <div className="flex gap-2">
                                    {Array.from({length: gameState.secretCode.length}).map((_, colIdx) => {
                                        let pegValue: PegColor | null = null;
                                        if (guessRecord) pegValue = guessRecord.guess[colIdx];
                                        else if (isCurrent) pegValue = gameState.currentGuess[colIdx];

                                        return (
                                            <div 
                                                key={colIdx} 
                                                className={`w-8 h-8 rounded-full cursor-pointer transition-transform
                                                    ${getColorClass(pegValue)}
                                                    ${isCurrent ? 'hover:scale-110 ring-1 ring-white/10' : ''}
                                                `}
                                                onClick={() => isCurrent ? handleHoleClick(colIdx) : undefined}
                                            />
                                        );
                                    })}
                               </div>

                               {/* Feedback Pins Matrix (2x2 or 3x2) */}
                               <div className="grid grid-cols-2 lg:grid-cols-3 gap-1 w-16 p-1 bg-black/40 rounded shadow-inner h-8">
                                    {guessRecord && (
                                        <>
                                            {Array.from({length: guessRecord.exactHits}).map((_, i) => <div key={`e-${i}`} className="w-2.5 h-2.5 rounded-full bg-black shadow-[inset_-1px_-1px_2px_rgba(255,255,255,0.4)]" />)}
                                            {Array.from({length: guessRecord.colorHits}).map((_, i) => <div key={`c-${i}`} className="w-2.5 h-2.5 rounded-full bg-white shadow-[inset_-1px_-1px_2px_rgba(0,0,0,0.4)]" />)}
                                            {Array.from({length: gameState.secretCode.length - guessRecord.exactHits - guessRecord.colorHits}).map((_, i) => <div key={`m-${i}`} className="w-2.5 h-2.5 rounded-full bg-black/10" />)}
                                        </>
                                    )}
                                    {!guessRecord && Array.from({length: gameState.secretCode.length}).map((_, i) => <div key={`m-${i}`} className="w-2.5 h-2.5 rounded-full bg-black/10" />)}
                               </div>
                          </div>
                     );
                 })}

                 {/* Win Overlay */}
                 {gameState.isGameOver && (
                     <div className="absolute inset-0 bg-stone-900/80 backdrop-blur-sm z-50 flex flex-col items-center justify-center rounded-lg">
                          <h2 className={`text-5xl font-black mb-4 ${gameState.hasWon ? 'text-green-500 drop-shadow-[0_0_15px_rgba(34,197,94,0.6)]' : 'text-red-500 drop-shadow-[0_0_15px_rgba(239,68,68,0.6)]'}`}>
                              {gameState.hasWon ? 'CODE BROKEN' : 'GAME OVER'}
                          </h2>
                          <button onClick={() => startGame()} className="mt-4 px-8 py-3 bg-amber-600 hover:bg-amber-500 text-white font-bold uppercase tracking-widest rounded shadow-lg transition-transform hover:scale-105 active:scale-95">Play Again</button>
                     </div>
                 )}
            </div>

            {/* Input Palette */}
            <div className="w-full max-w-lg mt-8 flex flex-col items-center gap-4 bg-stone-800 p-4 rounded-xl border border-stone-700 shadow-xl">
                 <div className="w-full flex justify-between items-center text-sm font-bold text-stone-400 px-4">
                     <span>1. Select Color</span>
                     <span>2. Click Hole</span>
                     <span>3. Submit</span>
                 </div>
                 
                 <div className="flex gap-2 sm:gap-4 justify-center flex-wrap">
                      {gameState.availableColors.map(c => (
                          <div 
                              key={c}
                              onClick={() => setSelectedColor(c)}
                              className={`w-10 h-10 sm:w-12 sm:h-12 rounded-full cursor-pointer transition-all transform
                                  ${getColorClass(c)}
                                  ${selectedColor === c ? 'scale-110 ring-4 ring-white shadow-[0_0_20px_rgba(255,255,255,0.4)]' : 'hover:scale-105'}
                              `}
                          />
                      ))}
                 </div>

                 <button 
                     onClick={handleSubmit}
                     disabled={!isGuessFull || gameState.isGameOver}
                     className="w-full mt-2 py-4 bg-zinc-900 hover:bg-zinc-800 disabled:opacity-40 disabled:hover:bg-zinc-900 text-white font-black tracking-widest uppercase rounded shadow-[0_4px_0_rgba(0,0,0,1)] active:shadow-none active:translate-y-1 transition-all border border-zinc-700"
                 >
                     Submit Guess
                 </button>
            </div>

        </div>
    );
}

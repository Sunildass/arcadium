import React, { useState, useEffect, useCallback } from 'react';
import { BackgammonEngine, BackgammonState, PlayerColor } from './BackgammonEngine';
import { PlayerProfileManager } from '../../../core/ai/PlayerProfileManager';

export default function Backgammon() {
    const [mode, setMode] = useState<'1P' | '2P'>('1P');
    const [engine, setEngine] = useState(() => new BackgammonEngine(mode));
    const [gameState, setGameState] = useState<BackgammonState | null>(null);
    const [profileManager] = useState(() => new PlayerProfileManager('backgammon'));

    const [selectedFrom, setSelectedFrom] = useState<number | 'bar' | null>(null);

    const startGame = useCallback((newMode?: '1P' | '2P') => {
        const targetMode = newMode || mode;
        const newEngine = new BackgammonEngine(targetMode);
        setEngine(newEngine);
        setGameState(newEngine.initialize());
        setSelectedFrom(null);
    }, [mode]);

    useEffect(() => {
        startGame();
    }, [startGame]);

    // AI Turn Loop
    useEffect(() => {
        if (!gameState || gameState.isGameOver) return;
        if (mode === '1P' && gameState.turn === 'Black') {
            const timer = setTimeout(() => {
                const action = engine.computeAIMove(gameState);
                if (action) {
                    setGameState(engine.update(gameState, action));
                }
            }, 800);
            return () => clearTimeout(timer);
        }
    }, [gameState, engine, mode]);

    const handleRoll = () => {
        if (!gameState || gameState.isGameOver) return;
        if (mode === '1P' && gameState.turn === 'Black') return;
        if (gameState.phase !== 'rolling') return;
        setGameState(engine.update(gameState, { type: 'ROLL' }));
    };

    const handlePointClick = (idx: number | 'bar' | 'off') => {
        if (!gameState || gameState.isGameOver || gameState.phase !== 'moving') return;
        if (mode === '1P' && gameState.turn === 'Black') return;

        // Selection Phase
        if (selectedFrom === null) {
            if (idx === 'off') return;
            // Check if valid initiator
            if (idx === 'bar' && gameState.bar[gameState.turn] > 0) setSelectedFrom('bar');
            else if (typeof idx === 'number' && gameState.board[idx].color === gameState.turn && gameState.board[idx].count > 0) {
                // Must pull from bar first
                if (gameState.bar[gameState.turn] > 0) return;
                setSelectedFrom(idx);
            }
        } else {
            // Execution Phase
            if (idx === 'bar') return; // Cannot move to bar
            
            if (selectedFrom === idx) {
                setSelectedFrom(null); // Deselect
                return;
            }

            // Attempt move for any valid die
            let moved = false;
            // Try largest die first as a heuristic for player intent if multiple apply, or explicitly test
            // We just loop unique dice and see if one works. 
            const uniqueDice = Array.from(new Set(gameState.dice)).sort((a,b)=>b-a);
            
            for (const d of uniqueDice) {
                if (engine.isValidMove(gameState, selectedFrom, idx, d, gameState.turn)) {
                    setGameState(engine.update(gameState, { type: 'MOVE', from: selectedFrom, to: idx, dieUsed: d }));
                    moved = true;
                    break;
                }
            }

            setSelectedFrom(null);
        }
    };

    if (!gameState) return null;

    // Computed Valid Targets for Highlighting
    const validTargets = new Set<number | 'bar' | 'off'>();
    if (selectedFrom !== null) {
        const uniqueDice = Array.from(new Set(gameState.dice));
        for (const d of uniqueDice) {
            const moves = engine.getValidMovesForDie(gameState, d);
            moves.filter(m => m.from === selectedFrom).forEach(m => validTargets.add(m.to as any));
        }
    }

    const renderCheckerStack = (color: PlayerColor | null, count: number, maxStack = 5) => {
        if (!color || count === 0) return null;
        const colorClass = color === 'White' ? 'bg-[#f8f9fa] shadow-[inset_-2px_-4px_6px_rgba(0,0,0,0.2)]' : 'bg-zinc-800 shadow-[inset_-2px_-4px_6px_rgba(255,255,255,0.1)]';
        const displayCount = Math.min(count, maxStack);
        const overflow = count > maxStack ? count - maxStack : 0;

        return (
            <div className="flex flex-col items-center justify-end relative h-full mb-1">
                {Array.from({ length: displayCount }).map((_, i) => (
                    <div key={i} className={`w-[90%] aspect-square rounded-full border-2 border-black/80 flex items-center justify-center font-bold text-xs ${colorClass}`} style={{ zIndex: 10 - i, marginTop: i > 0 ? '-30%' : '0' }}>
                        {i === displayCount - 1 && overflow > 0 ? `+${overflow + 1}` : ''}
                    </div>
                ))}
            </div>
        );
    };

    const renderPoint = (idx: number, isTop: boolean) => {
        const point = gameState.board[idx];
        const isDarkTriangle = (idx % 2 === 0);
        const isSelected = selectedFrom === idx;
        const isTarget = validTargets.has(idx);

        return (
            <div 
                key={idx}
                className={`relative w-full h-[40%] flex justify-center cursor-pointer transition-colors
                    ${isSelected ? 'bg-yellow-400/30' : ''}
                    ${isTarget ? 'bg-green-400/20 ring-inset ring-2 ring-green-400 hover:bg-green-400/40' : ''}
                `}
                onClick={() => handlePointClick(idx)}
            >
                {/* Triangle background */}
                <div className={`absolute top-0 w-full h-full text-center overflow-hidden
                    ${isTop ? 'origin-top rotate-180' : 'origin-bottom'}
                `}>
                    <svg viewBox="0 0 100 200" preserveAspectRatio="none" className="w-full h-full">
                        <polygon points="0,200 100,200 50,0" fill={isDarkTriangle ? '#8B4513' : '#DEB887'} stroke="#3e1b04" strokeWidth="2" />
                    </svg>
                </div>

                {/* Number index mapping (standard bg viewing) */}
                <div className={`absolute text-black/30 text-xs font-bold font-mono ${isTop ? 'top-1' : 'bottom-1'}`}>{idx}</div>

                {/* Checkers */}
                <div className={`absolute w-full h-full flex flex-col items-center px-[10%] ${isTop ? 'justify-start mt-2' : 'justify-end mb-2'}`}>
                    {renderCheckerStack(point.color, point.count)}
                </div>
            </div>
        );
    };

    return (
        <div className="flex flex-col items-center justify-center p-4 min-h-[90vh] bg-zinc-950 font-serif text-amber-50 rounded-2xl">
            
            <div className="w-full max-w-4xl flex justify-between items-center mb-6">
                <h1 className="text-3xl font-black text-amber-400 tracking-widest drop-shadow-md">Backgammon</h1>
                
                <div className="flex gap-6 items-center">
                    <select value={mode} onChange={e=>startGame(e.target.value as '1P' | '2P')} className="bg-zinc-800 text-white rounded p-2 outline-none">
                        <option value="1P">vs AI</option>
                        <option value="2P">Local 2P</option>
                    </select>
                </div>
            </div>
            
            {/* The Wooden Board */}
            <div className="w-full max-w-4xl aspect-[4/3] bg-[#5c2e16] border-[16px] border-[#3e1b04] rounded-lg shadow-[inset_0_0_50px_rgba(0,0,0,0.8),_0_20px_40px_rgba(0,0,0,0.6)] flex relative p-2 gap-4">
                
                {/* Left Pane (Points 13-18 Top, 12-7 Bottom) */}
                <div className="flex-1 bg-[#4a2e1e] shadow-inner flex flex-col justify-between">
                    <div className="flex w-full h-1/2 justify-around">
                        {[13, 14, 15, 16, 17, 18].map(i => renderPoint(i, true))}
                    </div>
                    <div className="flex w-full h-1/2 justify-around">
                        {[12, 11, 10, 9, 8, 7].map(i => renderPoint(i, false))}
                    </div>
                </div>

                {/* The Bar */}
                <div 
                    className={`w-12 bg-[#3e1b04] border-x-4 border-[#241002] shadow-[inset_0_0_15px_rgba(0,0,0,0.9)] flex flex-col justify-between py-8 items-center cursor-pointer transition-colors
                        ${selectedFrom === 'bar' ? 'bg-yellow-900/50 ring-2 ring-yellow-500' : ''}
                        ${gameState.bar[gameState.turn] > 0 ? 'hover:bg-yellow-900/30' : ''}
                    `}
                    onClick={() => handlePointClick('bar')}
                >
                    <div className="flex flex-col items-center justify-start h-1/2 opacity-90 drop-shadow-2xl">
                        {renderCheckerStack('White', gameState.bar.White)}
                    </div>
                    <div className="flex flex-col items-center justify-end h-1/2 opacity-90 drop-shadow-2xl">
                        {renderCheckerStack('Black', gameState.bar.Black)}
                    </div>
                </div>

                {/* Right Pane (Points 19-24 Top, 6-1 Bottom) */}
                <div className="flex-1 bg-[#4a2e1e] shadow-inner flex flex-col justify-between">
                    <div className="flex w-full h-1/2 justify-around">
                        {[19, 20, 21, 22, 23, 24].map(i => renderPoint(i, true))}
                    </div>
                    <div className="flex w-full h-1/2 justify-around">
                        {[6, 5, 4, 3, 2, 1].map(i => renderPoint(i, false))}
                    </div>
                </div>

                {/* Off Board / Bearing Off Tray */}
                <div 
                    className={`w-16 bg-[#241002] border-l-8 border-[#3e1b04] flex flex-col justify-between p-2 shadow-inner cursor-pointer transition-colors
                        ${validTargets.has('off') ? 'ring-2 ring-emerald-500 bg-emerald-900/20 hover:bg-emerald-900/40' : ''}
                    `}
                    onClick={() => handlePointClick('off')}
                >
                    <div className="flex flex-col items-center justify-start h-1/2">
                        <div className="text-[10px] text-zinc-500 font-black mb-2 tracking-widest uppercase">Off</div>
                        <span className="text-white text-xl font-bold">{gameState.borneOff.White}</span>
                    </div>
                    <div className="flex flex-col items-center justify-end h-1/2">
                        <span className="text-zinc-400 text-xl font-bold">{gameState.borneOff.Black}</span>
                        <div className="text-[10px] text-zinc-500 font-black mt-2 tracking-widest uppercase">Off</div>
                    </div>
                </div>

                {/* Game Over Modal */}
                {gameState.isGameOver && (
                    <div className="absolute inset-0 bg-black/80 backdrop-blur-sm z-50 flex flex-col items-center justify-center">
                         <h2 className="text-5xl font-black mb-6 text-yellow-400">{gameState.winner} Wins!</h2>
                         <button onClick={() => startGame()} className="px-8 py-3 bg-zinc-200 text-black font-bold uppercase tracking-widest rounded-sm hover:surface">Play Again</button>
                    </div>
                )}
            </div>

            {/* Action Strip */}
            <div className="w-full max-w-4xl mt-6 flex justify-between items-center bg-zinc-900 border border-zinc-800 p-4 rounded-xl shadow-xl">
                 <div className="text-xl font-bold flex items-center gap-3">
                     <span className={`w-4 h-4 rounded-full ${gameState.turn === 'White' ? 'bg-white' : 'bg-black border border-zinc-600'}`}></span>
                     {gameState.turn}'s Turn
                     {gameState.phase === 'rolling' && <span className="text-amber-500 text-sm ml-2 animate-pulse">- Needs to roll</span>}
                 </div>

                 <div className="flex items-center gap-6">
                     <div className="flex gap-2 min-w-[120px]">
                         {gameState.dice.map((d, i) => (
                             <div key={i} className="w-12 h-12 bg-zinc-100 text-black rounded-lg flex items-center justify-center text-2xl font-black shadow-md border-b-4 border-zinc-300">
                                 {d}
                             </div>
                         ))}
                     </div>
                     <button 
                         disabled={gameState.phase !== 'rolling' || (mode === '1P' && gameState.turn === 'Black')}
                         onClick={handleRoll}
                         className="px-6 py-3 bg-red-800 hover:bg-red-700 disabled:opacity-30 disabled:hover:bg-red-800 text-white font-black tracking-widest uppercase rounded shadow-[0_4px_0_rgba(153,27,27,1)] active:shadow-none active:translate-y-1 transition-all"
                     >
                         Roll Dice
                     </button>
                 </div>
            </div>

            {/* Logs */}
            <div className="w-full max-w-4xl mt-4 max-h-32 bg-black/50 p-4 rounded text-sm text-zinc-400 font-mono overflow-y-auto">
                {[...gameState.log].reverse().map((l, i) => <div key={i}>{l}</div>)}
            </div>
            
        </div>
    );
}

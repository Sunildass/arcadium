import React, { useState, useEffect } from 'react';
import { ColoringEngine, ColoringState } from './ColoringEngine';

const SCENE_ICONS: Record<string, string> = {
    'Mandala': '🌸', 'Garden': '🌻', 'Ocean': '🐠', 'Castle': '🏰', 'Space': '🚀', 'Animals': '🦁',
};

export default function ColoringBook() {
    const [engine] = useState(() => new ColoringEngine());
    const [gameState, setGameState] = useState<ColoringState | null>(null);

    useEffect(() => {
        setGameState(engine.initialize());
    }, [engine]);

    if (!gameState) return null;

    return (
        <div className="flex flex-col items-center justify-center p-4 min-h-[90vh] bg-pink-50 font-sans text-stone-800">
            
            <div className="w-full max-w-5xl flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 px-4 gap-3">
                 <div>
                     <h1 className="text-4xl font-black tracking-widest text-pink-500 drop-shadow-sm font-serif">Coloring Book</h1>
                     <p className="text-pink-400 font-serif italic text-sm mt-1">Fill the shapes with color.</p>
                 </div>
                 <div className="flex items-center gap-2 flex-wrap">
                     {gameState.scenes.map(scene => (
                         <button key={scene}
                             onClick={() => setGameState(engine.update(gameState, { type: 'CHANGE_SCENE', scene }))}
                             className={`flex items-center gap-1 px-3 py-1.5 rounded-full border text-xs font-bold transition-all ${
                                 gameState.scene === scene
                                     ? 'bg-pink-500 border-pink-400 text-white shadow-md'
                                     : 'bg-white border-pink-200 text-pink-500 hover:bg-pink-50'
                             }`}>
                             {SCENE_ICONS[scene]} {scene}
                         </button>
                     ))}
                     <button onClick={() => setGameState(engine.update(gameState, { type: 'CLEAR' }))}
                         className="px-4 py-1.5 bg-white border border-pink-200 text-pink-500 rounded-full shadow-sm hover:bg-pink-100 transition-colors text-xs font-bold">
                         🗑 Clear
                     </button>
                 </div>
            </div>

            <div className="flex flex-col lg:flex-row gap-8 w-full max-w-5xl items-center lg:items-start">
                 
                 {/* Palette Sidebar */}
                 <div className="w-full lg:w-24 flex flex-row lg:flex-col flex-wrap gap-3 bg-white p-4 rounded-2xl shadow-sm border border-pink-100 justify-center">
                      {gameState.colors.map(color => (
                          <button
                               key={color}
                               onClick={() => setGameState(engine.update(gameState, { type: 'SELECT_COLOR', color }))}
                               className={`w-12 h-12 rounded-full cursor-pointer transition-transform ${gameState.activeColor === color ? 'scale-125 ring-4 ring-pink-300 ring-offset-2 shadow-md' : 'hover:scale-110 shadow-sm border border-stone-200'}`}
                               style={{ backgroundColor: color }}
                               aria-label={`Select color ${color}`}
                          />
                      ))}
                 </div>

                 {/* Canvas / SVG Area */}
                 <div className="flex-1 w-full flex justify-center bg-white p-4 lg:p-8 rounded-2xl shadow-sm border border-pink-100 overflow-hidden touch-none relative" style={{ minHeight: '600px' }}>
                      
                      <div className="absolute inset-4 lg:inset-8 border-[12px] border-[#fb7185] rounded-xl pointer-events-none" />
                      
                      <svg 
                           viewBox="0 0 800 600" 
                           className="w-full h-full max-h-[70vh] drop-shadow-sm" 
                           style={{ cursor: 'crosshair' }}
                      >
                           {/* Render Paths */}
                           {gameState.paths.map((p) => (
                               <path
                                    key={p.id}
                                    d={p.d}
                                    fill={p.fill}
                                    stroke="#1c1917" // stone-900 line art
                                    strokeWidth="3"
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    onClick={() => setGameState(engine.update(gameState, { type: 'FILL_PATH', pathId: p.id }))}
                                    className="cursor-crosshair transition-colors duration-300 hover:opacity-90 active:scale-[0.99] origin-center"
                               />
                           ))}
                      </svg>
                 </div>

            </div>

        </div>
    );
}

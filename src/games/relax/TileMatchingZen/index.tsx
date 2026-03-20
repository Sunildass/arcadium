import React, { useState, useCallback } from 'react';

// Tile Matching Zen Mode — match 3+ adjacent same-colored tiles
const COLORS = ['🟥','🟩','🟦','🟨','🟪','🟧'];
const GRID_W = 8, GRID_H = 8;

function makeGrid(): string[][] {
    return Array.from({ length: GRID_H }, () =>
        Array.from({ length: GRID_W }, () => COLORS[Math.floor(Math.random() * COLORS.length)])
    );
}

function flood(grid: string[][], r: number, c: number, color: string, visited: boolean[][]): [number, number][] {
    if (r < 0 || r >= GRID_H || c < 0 || c >= GRID_W) return [];
    if (visited[r][c] || grid[r][c] !== color) return [];
    visited[r][c] = true;
    const cells: [number, number][] = [[r, c]];
    for (const [dr, dc] of [[-1,0],[1,0],[0,-1],[0,1]]) {
        cells.push(...flood(grid, r + dr, c + dc, color, visited));
    }
    return cells;
}

function getGroup(grid: string[][], r: number, c: number): [number, number][] {
    const visited = Array.from({ length: GRID_H }, () => Array(GRID_W).fill(false));
    return flood(grid, r, c, grid[r][c], visited);
}

function applyGravity(grid: string[][]): string[][] {
    const newGrid = grid.map(row => [...row]);
    for (let c = 0; c < GRID_W; c++) {
        const col = newGrid.map(row => row[c]).filter(Boolean);
        while (col.length < GRID_H) col.unshift('');
        newGrid.forEach((row, r) => { row[c] = col[r]; });
    }
    return newGrid;
}

function fillEmpty(grid: string[][]): string[][] {
    return grid.map(row => row.map(cell => cell || COLORS[Math.floor(Math.random() * COLORS.length)]));
}

export default function TileMatchingZen() {
    const [grid, setGrid] = useState<string[][]>(makeGrid);
    const [score, setScore] = useState(0);
    const [cleared, setCleared] = useState(0);
    const [lastClear, setLastClear] = useState(0);
    const [flash, setFlash] = useState<[number,number][]>([]);

    const handleClick = useCallback((r: number, c: number) => {
        const group = getGroup(grid, r, c);
        if (group.length < 2) return; // need at least 2

        const pts = group.length * group.length * 10;
        setFlash(group);
        setTimeout(() => {
            setFlash([]);
            setGrid(prev => {
                let next = prev.map(row => [...row]);
                group.forEach(([gr, gc]) => { next[gr][gc] = ''; });
                next = applyGravity(next);
                next = fillEmpty(next);
                return next;
            });
        }, 350);

        setScore(s => s + pts);
        setCleared(c2 => c2 + group.length);
        setLastClear(group.length);
    }, [grid]);

    return (
        <div className="flex flex-col items-center justify-center p-6 min-h-[90vh] bg-gradient-to-b from-teal-950 to-zinc-950 text-zinc-100 font-sans gap-5">
            <h1 className="text-4xl font-black tracking-widest uppercase text-teal-400 drop-shadow-[0_0_10px_rgba(45,212,191,0.5)]">Tile Match Zen</h1>

            <div className="flex gap-8 text-center font-mono">
                <div><div className="text-3xl font-black text-yellow-400">{score}</div><div className="text-xs text-zinc-500 uppercase">Score</div></div>
                <div><div className="text-3xl font-black text-teal-400">{cleared}</div><div className="text-xs text-zinc-500 uppercase">Cleared</div></div>
                {lastClear >= 5 && <div><div className="text-3xl font-black text-pink-400">+{lastClear} Combo!</div><div className="text-xs text-zinc-500 uppercase">Last</div></div>}
            </div>

            <div className="grid gap-1" style={{ gridTemplateColumns: `repeat(${GRID_W}, 1fr)` }}>
                {grid.map((row, r) => row.map((cell, c) => {
                    const isFlash = flash.some(([fr, fc]) => fr === r && fc === c);
                    return (
                        <button key={`${r}-${c}`} onClick={() => handleClick(r, c)}
                            className={`w-9 h-9 text-xl flex items-center justify-center rounded-lg transition-all duration-200 select-none
                                ${isFlash ? 'scale-125 ring-2 ring-white opacity-60' : 'hover:scale-110 hover:brightness-125 cursor-pointer active:scale-95'}`}>
                            {cell}
                        </button>
                    );
                }))}
            </div>

            <p className="text-zinc-500 text-sm max-w-xs text-center">Click any group of 2+ matching tiles to clear them. Bigger groups = more points!</p>
            <button onClick={() => { setGrid(makeGrid()); setScore(0); setCleared(0); }}
                className="px-6 py-2 bg-teal-800 hover:bg-teal-700 text-white rounded-xl font-bold text-sm uppercase tracking-widest transition-all">
                🔄 New Board
            </button>
        </div>
    );
}

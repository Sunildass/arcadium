import React, { useState, useEffect, useRef } from 'react';

// --- Static mini crossword data ---
const PUZZLES = [
    {
        size: 7,
        grid: [
            [0,0,0,1,0,0,0],
            [0,0,0,1,0,0,0],
            [1,1,1,1,1,1,1],
            [0,0,0,1,0,0,0],
            [0,0,1,1,1,0,0],
            [0,0,0,1,0,0,0],
            [0,0,0,1,0,0,0],
        ],
        // grid: 1 = letter cell, 0 = black cell
        answers: {
            // across word answers placed in grid
            '2A': 'ARCANE', // row 2, all 7 cols
            '4A': 'PINE',   // row 4, cols 2-4 (len 3)
        },
        clues: {
            across: [
                { num: 2, text: 'Mysterious and secret', answer: 'ARCANE', row: 2, col: 0, len: 7 },
                { num: 4, text: 'A type of conifer tree', answer: 'PINE', row: 4, col: 2, len: 4 },
            ],
            down: [
                { num: 1, text: 'To move swiftly upward', answer: 'ASCEND', row: 0, col: 3, len: 7 },
            ]
        }
    },
    {
        size: 7,
        grid: [
            [0,0,0,1,0,0,0],
            [0,0,0,1,0,0,0],
            [1,1,1,1,1,1,1],
            [0,0,0,1,0,0,0],
            [0,0,0,1,1,1,0],
            [0,0,0,1,0,0,0],
            [0,0,0,1,0,0,0],
        ],
        clues: {
            across: [
                { num: 2, text: 'Opposite of west', answer: 'ORIENT', row: 2, col: 0, len: 6 },
                { num: 4, text: 'A card game — Texas ___', answer: 'HOLD', row: 4, col: 3, len: 4 },
            ],
            down: [
                { num: 1, text: 'A shining star in the sky', answer: 'SOLEIL', row: 0, col: 3, len: 7 },
            ]
        }
    }
];

interface ClueEntry { num: number; text: string; answer: string; row: number; col: number; len: number; dir: 'across' | 'down'; }

export default function SpeedCrossword() {
    const [puzzleIdx] = useState(() => Math.floor(Math.random() * PUZZLES.length));
    const puzzle = PUZZLES[puzzleIdx];
    const SIZE = puzzle.size;

    // Build flat clue list
    const clues: ClueEntry[] = [
        ...puzzle.clues.across.map(c => ({ ...c, dir: 'across' as const })),
        ...puzzle.clues.down.map(c => ({ ...c, dir: 'down' as const }))
    ];

    const [userGrid, setUserGrid] = useState<string[][]>(() =>
        Array(SIZE).fill(null).map(() => Array(SIZE).fill(''))
    );
    const [solved, setSolved] = useState<boolean[]>(clues.map(() => false));
    const [score, setScore] = useState(0);
    const [timeLeft, setTimeLeft] = useState(120);
    const [gameOver, setGameOver] = useState(false);
    const [selected, setSelected] = useState<{ r: number; c: number } | null>(null);
    const inputRefs = useRef<(HTMLInputElement | null)[][]>(Array(SIZE).fill(null).map(() => Array(SIZE).fill(null)));

    useEffect(() => {
        if (gameOver) return;
        const t = setInterval(() => {
            setTimeLeft(prev => {
                if (prev <= 1) { setGameOver(true); return 0; }
                return prev - 1;
            });
        }, 1000);
        return () => clearInterval(t);
    }, [gameOver]);

    const handleInput = (r: number, c: number, val: string) => {
        const ch = val.toUpperCase().slice(-1);
        const newGrid = userGrid.map(row => [...row]);
        newGrid[r][c] = ch;
        setUserGrid(newGrid);

        // Check clues
        const newSolved = clues.map((clue, i) => {
            if (solved[i]) return true;
            for (let k = 0; k < clue.len; k++) {
                const gr = clue.dir === 'across' ? clue.row : clue.row + k;
                const gc = clue.dir === 'across' ? clue.col + k : clue.col;
                if (newGrid[gr]?.[gc] !== clue.answer[k]) return false;
            }
            return true;
        });

        const bonuses = newSolved.reduce((acc, v, i) => (v && !solved[i] ? acc + 200 : acc), 0);
        if (bonuses > 0) setScore(s => s + bonuses + timeLeft);
        setSolved(newSolved);

        if (newSolved.every(Boolean)) setGameOver(true);

        // Move focus to next cell
        if (ch && selected) {
            const { r: cr, c: cc } = selected;
            const nr = cr + (clues.find(cl => cl.dir === 'down' && cl.row <= cr && cr < cl.row + cl.len && cl.col === cc) ? 1 : 0);
            const nc = cc + (clues.find(cl => cl.dir === 'across' && cl.col <= cc && cc < cl.col + cl.len && cl.row === cr) ? 1 : 0);
            if (nr < SIZE && nc < SIZE && puzzle.grid[nr][nc]) {
                inputRefs.current[nr]?.[nc]?.focus();
            }
        }
    };

    const allSolved = solved.every(Boolean);

    return (
        <div className="flex flex-col lg:flex-row items-start justify-center p-6 min-h-[90vh] bg-gradient-to-b from-amber-950 to-zinc-950 text-zinc-100 font-sans gap-8">

            <div className="flex flex-col gap-4">
                <h1 className="text-4xl font-black tracking-widest uppercase text-amber-400">Speed Crossword</h1>

                <div className="flex gap-6 font-mono text-center">
                    <div><div className={`text-3xl font-black ${timeLeft < 30 ? 'text-red-400 animate-pulse' : 'text-amber-400'}`}>{timeLeft}s</div><div className="text-xs text-zinc-500 uppercase">Time</div></div>
                    <div><div className="text-3xl font-black text-yellow-400">{score}</div><div className="text-xs text-zinc-500 uppercase">Score</div></div>
                    <div><div className="text-3xl font-black text-green-400">{solved.filter(Boolean).length}/{clues.length}</div><div className="text-xs text-zinc-500 uppercase">Solved</div></div>
                </div>

                {/* Grid */}
                <div className="border-2 border-amber-900 inline-block bg-zinc-900 shadow-2xl">
                    {Array(SIZE).fill(null).map((_, r) => (
                        <div key={r} className="flex">
                            {Array(SIZE).fill(null).map((_, c) => {
                                const isActive = puzzle.grid[r][c] === 1;
                                if (!isActive) return <div key={c} className="w-10 h-10 bg-zinc-950 border border-zinc-900" />;
                                return (
                                    <input
                                        key={c}
                                        ref={el => { if (inputRefs.current[r]) inputRefs.current[r][c] = el; }}
                                        value={userGrid[r][c]}
                                        maxLength={1}
                                        onChange={e => handleInput(r, c, e.target.value)}
                                        onFocus={() => setSelected({ r, c })}
                                        disabled={gameOver}
                                        className="w-10 h-10 bg-zinc-800 border border-zinc-600 text-center font-black text-white uppercase focus:bg-amber-900/60 focus:border-amber-500 focus:outline-none text-lg caret-transparent"
                                    />
                                );
                            })}
                        </div>
                    ))}
                </div>

                {(gameOver || allSolved) && (
                    <div className="text-center">
                        <div className={`text-2xl font-black uppercase tracking-widest mb-3 ${allSolved ? 'text-green-400' : 'text-red-400'}`}>
                            {allSolved ? '🏆 Solved!' : '⏰ Time Up!'}
                        </div>
                        <button onClick={() => window.location.reload()}
                            className="px-8 py-3 bg-amber-700 hover:bg-amber-600 text-white font-black uppercase tracking-widest rounded-xl">
                            🔄 New Puzzle
                        </button>
                    </div>
                )}
            </div>

            {/* Clues */}
            <div className="flex flex-col gap-4 max-w-xs w-full">
                <div>
                    <div className="text-amber-400 font-black uppercase tracking-widest text-sm mb-2 border-b border-amber-900 pb-1">Across</div>
                    {clues.filter(c => c.dir === 'across').map((c, i) => (
                        <div key={i} className={`text-sm mb-2 flex gap-2 ${solved[clues.indexOf(c)] ? 'line-through text-zinc-600' : 'text-zinc-300'}`}>
                            <span className="font-black text-amber-500 w-5 shrink-0">{c.num}.</span>
                            <span>{c.text} ({c.len})</span>
                        </div>
                    ))}
                </div>
                <div>
                    <div className="text-amber-400 font-black uppercase tracking-widest text-sm mb-2 border-b border-amber-900 pb-1">Down</div>
                    {clues.filter(c => c.dir === 'down').map((c, i) => (
                        <div key={i} className={`text-sm mb-2 flex gap-2 ${solved[clues.indexOf(c) + clues.filter(x => x.dir === 'across').length] ? 'line-through text-zinc-600' : 'text-zinc-300'}`}>
                            <span className="font-black text-amber-500 w-5 shrink-0">{c.num}.</span>
                            <span>{c.text} ({c.len})</span>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}

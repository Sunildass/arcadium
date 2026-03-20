import React, { useState, useCallback } from 'react';

// ────────────────────────────────────────────────────────────────────────────────
// Dot Sketch — connect numbered dots in order to reveal hidden pictures
// ────────────────────────────────────────────────────────────────────────────────

const PUZZLES = [
    {
        name: 'Star',
        emoji: '⭐',
        dots: [
            { x: 200, y: 20 }, { x: 240, y: 130 }, { x: 360, y: 130 },
            { x: 265, y: 200 }, { x: 300, y: 315 }, { x: 200, y: 245 },
            { x: 100, y: 315 }, { x: 135, y: 200 }, { x: 40,  y: 130 },
            { x: 160, y: 130 },
        ],
    },
    {
        name: 'House',
        emoji: '🏠',
        dots: [
            { x: 200, y: 30 }, { x: 340, y: 140 }, { x: 340, y: 330 },
            { x: 260, y: 330 }, { x: 260, y: 230 }, { x: 140, y: 230 },
            { x: 140, y: 330 }, { x: 60,  y: 330 }, { x: 60,  y: 140 },
        ],
    },
    {
        name: 'Diamond',
        emoji: '💎',
        dots: [
            { x: 200, y: 20  }, { x: 370, y: 175 }, { x: 300, y: 175 },
            { x: 200, y: 340 }, { x: 100, y: 175 }, { x: 30,  y: 175 },
        ],
    },
    {
        name: 'Heart',
        emoji: '❤️',
        dots: [
            { x: 200, y: 320 }, { x: 50,  y: 160 }, { x: 50,  y: 80  },
            { x: 100, y: 30  }, { x: 150, y: 30  }, { x: 200, y: 70  },
            { x: 250, y: 30  }, { x: 300, y: 30  }, { x: 350, y: 80  },
            { x: 350, y: 160 },
        ],
    },
    {
        name: 'Arrow',
        emoji: '➡️',
        dots: [
            { x: 20,  y: 160 }, { x: 210, y: 160 }, { x: 210, y: 80  },
            { x: 370, y: 200 }, { x: 210, y: 320 }, { x: 210, y: 240 },
            { x: 20,  y: 240 },
        ],
    },
    {
        name: 'Lightning',
        emoji: '⚡',
        dots: [
            { x: 260, y: 20  }, { x: 120, y: 180 }, { x: 210, y: 180 },
            { x: 140, y: 355 }, { x: 290, y: 175 }, { x: 195, y: 175 },
        ],
    },
    {
        name: 'Fish',
        emoji: '🐟',
        dots: [
            { x: 50,  y: 180 }, { x: 50,  y: 120 }, { x: 110, y: 120 },
            { x: 230, y: 50  }, { x: 340, y: 120 }, { x: 370, y: 180 },
            { x: 340, y: 240 }, { x: 230, y: 310 }, { x: 110, y: 240 },
            { x: 50,  y: 240 },
        ],
    },
    {
        name: 'Crown',
        emoji: '👑',
        dots: [
            { x: 30,  y: 300 }, { x: 30,  y: 180 }, { x: 100, y: 260 },
            { x: 200, y: 100 }, { x: 300, y: 260 }, { x: 370, y: 180 },
            { x: 370, y: 300 },
        ],
    },
    {
        name: 'Butterfly',
        emoji: '🦋',
        dots: [
            { x: 200, y: 180 }, { x: 80,  y: 60  }, { x: 20,  y: 100 },
            { x: 20,  y: 180 }, { x: 80,  y: 260 }, { x: 200, y: 220 },
            { x: 320, y: 260 }, { x: 380, y: 180 }, { x: 380, y: 100 },
            { x: 320, y: 60  },
        ],
    },
    {
        name: 'Rocket',
        emoji: '🚀',
        dots: [
            { x: 200, y: 20  }, { x: 270, y: 130 }, { x: 270, y: 300 },
            { x: 330, y: 370 }, { x: 260, y: 340 }, { x: 200, y: 360 },
            { x: 140, y: 340 }, { x: 70,  y: 370 }, { x: 130, y: 300 },
            { x: 130, y: 130 },
        ],
    },
    {
        name: 'Tree',
        emoji: '🌲',
        dots: [
            { x: 200, y: 20  }, { x: 320, y: 140 }, { x: 270, y: 140 },
            { x: 350, y: 240 }, { x: 245, y: 240 }, { x: 245, y: 360 },
            { x: 155, y: 360 }, { x: 155, y: 240 }, { x: 50,  y: 240 },
            { x: 130, y: 140 }, { x: 80,  y: 140 },
        ],
    },
    {
        name: 'Hexagon',
        emoji: '⬡',
        dots: Array.from({ length: 6 }, (_, i) => {
            const a = (i / 6) * Math.PI * 2 - Math.PI / 2;
            return { x: Math.round(200 + 160 * Math.cos(a)), y: Math.round(190 + 160 * Math.sin(a)) };
        }),
    },
    {
        name: 'Moon',
        emoji: '🌙',
        dots: [
            { x: 200, y: 20  }, { x: 310, y: 50  }, { x: 360, y: 120 },
            { x: 360, y: 200 }, { x: 310, y: 270 }, { x: 200, y: 330 },
            { x: 120, y: 290 }, { x: 160, y: 240 }, { x: 190, y: 180 },
            { x: 160, y: 120 }, { x: 120, y: 70  },
        ],
    },
    {
        name: 'Snowflake',
        emoji: '❄️',
        dots: Array.from({ length: 12 }, (_, i) => {
            const r = i % 2 === 0 ? 160 : 80;
            const a = (i / 12) * Math.PI * 2 - Math.PI / 2;
            return { x: Math.round(200 + r * Math.cos(a)), y: Math.round(190 + r * Math.sin(a)) };
        }),
    },
];

const W = 400, H = 380;

export default function DotSketch() {
    const [puzzleIdx, setPuzzleIdx] = useState(0);
    const [nextDot, setNextDot]   = useState(0);
    const [lines, setLines]       = useState<[number, number, number, number][]>([]);
    const [complete, setComplete] = useState(false);

    const puzzle = PUZZLES[puzzleIdx];
    const dots   = puzzle.dots;

    const handleDotClick = useCallback((i: number) => {
        if (complete || i !== nextDot) return;
        if (nextDot > 0) {
            const prev = dots[nextDot - 1], cur = dots[nextDot];
            setLines(l => [...l, [prev.x, prev.y, cur.x, cur.y]]);
        }
        const next = nextDot + 1;
        setNextDot(next);
        if (next === dots.length) {
            const last = dots[dots.length - 1], first = dots[0];
            setLines(l => [...l, [last.x, last.y, first.x, first.y]]);
            setComplete(true);
        }
    }, [nextDot, dots, complete]);

    const reset = (idx = puzzleIdx) => {
        setPuzzleIdx(idx); setNextDot(0); setLines([]); setComplete(false);
    };

    return (
        <div className="flex flex-col items-center justify-center p-6 min-h-[90vh] bg-gradient-to-b from-zinc-900 to-black text-zinc-100 font-sans gap-5">
            <div className="text-center">
                <h1 className="text-4xl font-black tracking-widest uppercase bg-gradient-to-r from-yellow-400 via-amber-300 to-yellow-500 bg-clip-text text-transparent">
                    Dot Sketch
                </h1>
                <p className="text-zinc-500 text-xs mt-1 tracking-widest">Connect the dots · Reveal the shape</p>
            </div>

            {/* Puzzle selector */}
            <div className="w-full max-w-lg">
                <div className="flex flex-wrap gap-2 justify-center">
                    {PUZZLES.map((p, i) => (
                        <button key={i} onClick={() => reset(i)}
                            className={`px-2.5 py-1 rounded-full border text-xs font-bold transition-all ${
                                puzzleIdx === i
                                    ? 'bg-amber-500 border-amber-400 text-zinc-900 shadow-md shadow-amber-900/40'
                                    : 'border-zinc-700 text-zinc-500 hover:border-zinc-500 hover:text-zinc-300'
                            }`}>
                            {p.emoji} {p.name}
                        </button>
                    ))}
                </div>
            </div>

            <div className="relative">
                <svg width={W} height={H} className="rounded-2xl border border-zinc-800"
                    style={{ background: 'radial-gradient(ellipse at center, #18181b 0%, #09090b 100%)' }}>

                    {/* Drawn lines */}
                    {lines.map(([x1, y1, x2, y2], i) => (
                        <line key={i} x1={x1} y1={y1} x2={x2} y2={y2}
                            stroke={complete ? '#22c55e' : '#f59e0b'}
                            strokeWidth={complete ? 3 : 2.5}
                            strokeLinecap="round"
                            className="transition-all duration-200" />
                    ))}

                    {/* Faint preview lines */}
                    {!complete && dots.map((dot, i) => {
                        const next = dots[(i + 1) % dots.length];
                        return (
                            <line key={`g${i}`} x1={dot.x} y1={dot.y} x2={next.x} y2={next.y}
                                stroke="#3f3f46" strokeWidth={1} strokeDasharray="4 4" opacity={0.4} />
                        );
                    })}

                    {/* Dots */}
                    {dots.map((dot, i) => {
                        const isNext = i === nextDot && !complete;
                        const isDone = i < nextDot || complete;
                        return (
                            <g key={i} onClick={() => handleDotClick(i)}
                                className={isNext ? 'cursor-pointer' : 'cursor-default'}>
                                <circle cx={dot.x} cy={dot.y} r={isNext ? 14 : 9}
                                    fill={isDone ? '#22c55e' : isNext ? '#f59e0b' : '#27272a'}
                                    stroke={isNext ? '#fde68a' : isDone ? '#16a34a' : '#52525b'}
                                    strokeWidth={2}
                                    className="transition-all duration-200" />
                                <text x={dot.x} y={dot.y + 4} textAnchor="middle" fontSize={isNext ? 11 : 9}
                                    fill={isDone ? '#86efac' : isNext ? '#1c1917' : '#a1a1aa'}
                                    fontWeight="bold" className="select-none">
                                    {i + 1}
                                </text>
                                {isNext && (
                                    <circle cx={dot.x} cy={dot.y} r={22} fill="none"
                                        stroke="#f59e0b" strokeWidth={1.5} opacity={0.5}
                                        style={{ animation: 'ping 1s cubic-bezier(0,0,0.2,1) infinite' }} />
                                )}
                            </g>
                        );
                    })}
                </svg>
            </div>

            {complete ? (
                <div className="flex flex-col items-center gap-3">
                    <div className="text-2xl font-black text-green-400">✨ {puzzle.emoji} {puzzle.name} revealed!</div>
                    <button onClick={() => reset((puzzleIdx + 1) % PUZZLES.length)}
                        className="px-8 py-3 bg-amber-500 hover:bg-amber-400 text-zinc-900 font-black uppercase tracking-widest rounded-xl transition-colors">
                        Next Shape ▶
                    </button>
                </div>
            ) : (
                <p className="text-zinc-600 text-sm">Tap the glowing dot <span className="text-amber-400 font-bold">({nextDot + 1})</span> — connect all {dots.length} dots to reveal: <span className="text-zinc-300 font-bold">{puzzle.emoji} {puzzle.name}</span></p>
            )}

            <button onClick={() => reset()} className="text-xs text-zinc-700 hover:text-zinc-500 transition-colors uppercase tracking-widest">
                ↩ Reset
            </button>
        </div>
    );
}

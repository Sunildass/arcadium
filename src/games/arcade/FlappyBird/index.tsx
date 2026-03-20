import React, { useState, useEffect, useRef, useCallback } from 'react';

const CANVAS_W = 480;
const CANVAS_H = 640;
const GRAVITY = 0.5;
const JUMP_FORCE = -9;
const PIPE_WIDTH = 60;
const PIPE_GAP = 160;
const PIPE_SPEED = 3;
const PIPE_INTERVAL = 1800; // ms

interface Pipe { x: number; topH: number; scored: boolean; }

export default function FlappyBird() {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const stateRef = useRef({
        bird: { y: CANVAS_H / 2, vy: 0 },
        pipes: [] as Pipe[],
        score: 0,
        frame: 0,
        started: false,
        dead: false,
        lastPipeTime: 0,
    });
    const rafRef = useRef<number>(0);
    const [displayScore, setDisplayScore] = useState(0);
    const [phase, setPhase] = useState<'idle' | 'playing' | 'dead'>('idle');

    const jump = useCallback(() => {
        const s = stateRef.current;
        if (s.dead) return;
        if (!s.started) { s.started = true; s.lastPipeTime = performance.now(); }
        s.bird.vy = JUMP_FORCE;
    }, []);

    const restart = useCallback(() => {
        stateRef.current = {
            bird: { y: CANVAS_H / 2, vy: 0 },
            pipes: [],
            score: 0,
            frame: 0,
            started: false,
            dead: false,
            lastPipeTime: 0,
        };
        setDisplayScore(0);
        setPhase('idle');
    }, []);

    useEffect(() => {
        const handleKey = (e: KeyboardEvent) => {
            if (e.code === 'Space' || e.code === 'ArrowUp') { e.preventDefault(); jump(); }
        };
        window.addEventListener('keydown', handleKey);
        return () => window.removeEventListener('keydown', handleKey);
    }, [jump]);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d')!;

        const tick = (now: number) => {
            const s = stateRef.current;
            const BIRD_X = 80, BIRD_R = 18;

            // Draw sky background
            ctx.fillStyle = '#87CEEB';
            ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);
            // Ground
            ctx.fillStyle = '#5D4037';
            ctx.fillRect(0, CANVAS_H - 40, CANVAS_W, 40);
            ctx.fillStyle = '#4CAF50';
            ctx.fillRect(0, CANVAS_H - 44, CANVAS_W, 6);

            if (s.started && !s.dead) {
                // Physics
                s.bird.vy += GRAVITY;
                s.bird.y += s.bird.vy;

                // Generate pipes
                if (now - s.lastPipeTime > PIPE_INTERVAL) {
                    const topH = 60 + Math.random() * (CANVAS_H - PIPE_GAP - 140);
                    s.pipes.push({ x: CANVAS_W, topH, scored: false });
                    s.lastPipeTime = now;
                }

                // Update pipes
                s.pipes.forEach(p => { p.x -= PIPE_SPEED; });
                s.pipes = s.pipes.filter(p => p.x > -PIPE_WIDTH);

                // Score
                s.pipes.forEach(p => {
                    if (!p.scored && p.x + PIPE_WIDTH < BIRD_X) {
                        p.scored = true; s.score++; setDisplayScore(s.score);
                    }
                });

                // Collision
                const bTop = s.bird.y - BIRD_R, bBot = s.bird.y + BIRD_R;
                const bLeft = BIRD_X - BIRD_R, bRight = BIRD_X + BIRD_R;
                if (bBot >= CANVAS_H - 44 || bTop <= 0) { s.dead = true; setPhase('dead'); }
                for (const p of s.pipes) {
                    if (bRight > p.x && bLeft < p.x + PIPE_WIDTH) {
                        if (bTop < p.topH || bBot > p.topH + PIPE_GAP) {
                            s.dead = true; setPhase('dead');
                        }
                    }
                }
            }

            // Draw pipes
            s.pipes.forEach(p => {
                ctx.fillStyle = '#388E3C';
                ctx.fillRect(p.x, 0, PIPE_WIDTH, p.topH);
                ctx.fillRect(p.x, p.topH + PIPE_GAP, PIPE_WIDTH, CANVAS_H - p.topH - PIPE_GAP);
                // Pipe caps
                ctx.fillStyle = '#2E7D32';
                ctx.fillRect(p.x - 4, p.topH - 20, PIPE_WIDTH + 8, 20);
                ctx.fillRect(p.x - 4, p.topH + PIPE_GAP, PIPE_WIDTH + 8, 20);
            });

            // Draw bird
            const wingFlap = Math.sin(s.frame * 0.3) * 6;
            ctx.save();
            ctx.translate(BIRD_X, s.bird.y);
            ctx.rotate(Math.max(-0.5, Math.min(0.5, s.bird.vy * 0.04)));
            // Body
            ctx.fillStyle = '#FFD600';
            ctx.beginPath(); ctx.arc(0, 0, BIRD_R, 0, Math.PI * 2); ctx.fill();
            // Eye
            ctx.fillStyle = '#fff';
            ctx.beginPath(); ctx.arc(6, -4, 6, 0, Math.PI * 2); ctx.fill();
            ctx.fillStyle = '#000';
            ctx.beginPath(); ctx.arc(8, -4, 3, 0, Math.PI * 2); ctx.fill();
            // Wing
            ctx.fillStyle = '#FFA000';
            ctx.beginPath(); ctx.ellipse(-4, wingFlap, 10, 5, -0.3, 0, Math.PI * 2); ctx.fill();
            // Beak
            ctx.fillStyle = '#FF6F00';
            ctx.fillRect(BIRD_R - 2, -2, 10, 5);
            ctx.restore();

            // Score display on canvas
            ctx.fillStyle = 'white';
            ctx.font = 'bold 36px monospace';
            ctx.textAlign = 'center';
            if (s.started) ctx.fillText(String(s.score), CANVAS_W / 2, 50);

            s.frame++;
            rafRef.current = requestAnimationFrame(tick);
        };

        rafRef.current = requestAnimationFrame(tick);
        return () => cancelAnimationFrame(rafRef.current);
    }, []);

    return (
        <div className="flex flex-col items-center justify-center min-h-[90vh] bg-sky-950 font-sans gap-4">
            <h1 className="text-4xl font-black tracking-widest text-sky-400 uppercase">Flappy Bird</h1>

            <div className="relative cursor-pointer" onClick={jump}>
                <canvas ref={canvasRef} width={CANVAS_W} height={CANVAS_H}
                    className="rounded-2xl shadow-2xl border-4 border-sky-800 max-h-[70vh] w-auto" />

                {phase === 'idle' && (
                    <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/40 rounded-2xl pointer-events-none">
                        <div className="text-4xl font-black text-white drop-shadow-lg">Tap / Space</div>
                        <div className="text-zinc-300 mt-2 text-sm">to flap!</div>
                    </div>
                )}

                {phase === 'dead' && (
                    <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/60 rounded-2xl">
                        <div className="text-4xl font-black text-red-400 mb-2">Game Over!</div>
                        <div className="text-white font-bold text-2xl mb-6">Score: {displayScore}</div>
                        <button onClick={e => { e.stopPropagation(); restart(); }}
                            className="px-8 py-3 bg-sky-500 hover:bg-sky-400 text-white font-black uppercase tracking-widest rounded-xl shadow transition-all">
                            🔄 Restart
                        </button>
                    </div>
                )}
            </div>

            <div className="text-zinc-500 text-sm">Click / Tap / Space to flap! Avoid pipes.</div>
        </div>
    );
}

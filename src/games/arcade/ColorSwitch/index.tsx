import React, { useState, useEffect, useRef, useCallback } from 'react';

const W = 400, H = 600;
const BALL_R = 20;
const BALL_SPEED = 5;
const RING_W = 60;
const RING_R = 120; // ring center radius from canvas center
const GAP_SIZE = Math.PI * 0.45; // gap angle in radians

interface Ring { angle: number; gapAngle: number; color: string; }

const PALETTE = ['#ef4444','#3b82f6','#22c55e','#f59e0b','#8b5cf6','#ec4899'];

export default function ColorSwitch() {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const stateRef = useRef({
        ballY: H * 0.75,
        vy: -BALL_SPEED,
        ballColor: PALETTE[0],
        rings: [] as Ring[],
        score: 0, frame: 0,
        dead: false, started: false,
    });
    const [display, setDisplay] = useState({ score: 0, dead: false, started: false });
    const rafRef = useRef<number>(0);

    const jump = useCallback(() => {
        const s = stateRef.current;
        if (s.dead) return;
        if (!s.started) {
            // First tap: just start the game, don't jump yet
            s.started = true;
            return;
        }
        s.vy = -BALL_SPEED;
        // Change ball color randomly
        const others = PALETTE.filter(c => c !== s.ballColor);
        s.ballColor = others[Math.floor(Math.random() * others.length)];
    }, []);

    const restart = useCallback(() => {
        stateRef.current = {
            ballY: H * 0.75, vy: -BALL_SPEED,
            ballColor: PALETTE[0],
            rings: [{ angle: 0, gapAngle: -Math.PI / 2, color: PALETTE[1] }],
            score: 0, frame: 0, dead: false, started: false
        };
        setDisplay({ score: 0, dead: false, started: false });
    }, []);

    useEffect(() => {
        const onKey = (e: KeyboardEvent) => { if (e.code === 'Space') { e.preventDefault(); jump(); } };
        window.addEventListener('keydown', onKey);
        return () => window.removeEventListener('keydown', onKey);
    }, [jump]);

    useEffect(() => {
        const canvas = canvasRef.current!;
        const ctx = canvas.getContext('2d')!;

        // Init first ring
        stateRef.current.rings = [{ angle: 0, gapAngle: -Math.PI / 2, color: PALETTE[1] }];

        const tick = () => {
            const s = stateRef.current;
            const cx = W / 2, ringCY = H * 0.4;

            ctx.fillStyle = '#09090b';
            ctx.fillRect(0, 0, W, H);

            if (s.started && !s.dead) {
                // Ball physics (falls then jump resets)
                s.vy += 0.3; // gravity pulls down
                s.ballY += s.vy;

                // Rotate rings
                s.rings.forEach(r => { r.angle += 0.025; });

                // Add a new ring every 120 frames
                if (s.frame % 120 === 0) {
                    const color = PALETTE.filter(c => c !== (s.rings[s.rings.length - 1]?.color))[Math.floor(Math.random() * (PALETTE.length - 1))];
                    s.rings.push({ angle: 0, gapAngle: -Math.PI / 2, color });
                }
                s.rings = s.rings.filter((_, i) => i >= s.rings.length - 2);

                s.score++;
                if (s.frame % 10 === 0) setDisplay({ score: Math.floor(s.score / 10), dead: false, started: true });

                // Ball is out of bounds
                if (s.ballY < -BALL_R || s.ballY > H + BALL_R) { s.dead = true; setDisplay({ score: Math.floor(s.score / 10), dead: true, started: true }); }

                // Collision: check if ball at ring level
                const ballDist = Math.abs(s.ballY - ringCY);
                for (const ring of s.rings) {
                    if (Math.abs(ballDist - RING_R) < BALL_R + 8) {
                        // Ball is on ring arc — check if in gap
                        const angle = Math.atan2(s.ballY - ringCY, cx - cx); // ball on vertical axis
                        // normalised ball angle relative to ring rotation
                        let normAngle = (Math.PI / 2 + ring.angle) % (Math.PI * 2); // ball approaches from below (pi/2 = bottom)
                        let gapStart = ring.gapAngle + ring.angle;
                        let gapEnd = gapStart + GAP_SIZE;
                        const ballAngle = (Math.PI * 1.5 + ring.angle) % (Math.PI * 2); // ball goes through top/bottom

                        // Simplified: check color match
                        if (ring.color !== s.ballColor) {
                            s.dead = true; setDisplay({ score: Math.floor(s.score / 10), dead: true, started: true });
                        }
                    }
                }
            }

            // Draw rings
            s.rings.forEach((ring, ri) => {
                const segments = PALETTE.length;
                for (let seg = 0; seg < segments; seg++) {
                    const start = ring.angle + (seg / segments) * Math.PI * 2;
                    const end = ring.angle + ((seg + 1) / segments) * Math.PI * 2;
                    // Gap is segment 0 at start angle
                    if (seg === 0) continue; // gap segment
                    ctx.beginPath();
                    ctx.arc(W / 2, H * 0.4, RING_R, start, end);
                    ctx.strokeStyle = PALETTE[seg % PALETTE.length];
                    ctx.lineWidth = RING_W / 3;
                    ctx.stroke();
                }
            });

            // Draw ball
            ctx.beginPath();
            ctx.arc(W / 2, s.ballY, BALL_R, 0, Math.PI * 2);
            ctx.fillStyle = s.ballColor;
            ctx.fill();
            ctx.strokeStyle = 'white';
            ctx.lineWidth = 3;
            ctx.stroke();

            // Score
            ctx.fillStyle = '#d4d4d8';
            ctx.font = 'bold 24px monospace';
            ctx.textAlign = 'center';
            ctx.fillText(String(Math.floor(s.score / 10)), W / 2, 40);

            s.frame++;
            rafRef.current = requestAnimationFrame(tick);
        };
        rafRef.current = requestAnimationFrame(tick);
        return () => cancelAnimationFrame(rafRef.current);
    }, []);

    return (
        <div className="flex flex-col items-center justify-center min-h-[90vh] bg-zinc-950 font-sans gap-4">
            <h1 className="text-4xl font-black tracking-widest text-white uppercase">Color Switch</h1>

            <div className="relative cursor-pointer" onClick={jump}>
                <canvas ref={canvasRef} width={W} height={H}
                    className="rounded-2xl shadow-2xl border-4 border-zinc-800 max-h-[70vh] w-auto" />

                {!display.started && (
                    <div className="absolute inset-0 flex items-center justify-center bg-black/40 rounded-2xl pointer-events-none">
                        <div className="text-2xl font-black text-white">Tap to start!</div>
                    </div>
                )}
                {display.dead && (
                    <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/70 rounded-2xl">
                        <div className="text-4xl font-black text-white mb-2">Score: {display.score}</div>
                        <button onClick={e => { e.stopPropagation(); restart(); }}
                            className="mt-4 px-8 py-3 bg-white text-zinc-900 font-black uppercase tracking-widest rounded-xl">
                            🔄 Try Again
                        </button>
                    </div>
                )}
            </div>
            <div className="text-zinc-600 text-sm">Match ball color to ring segment. Tap to jump and change color.</div>
        </div>
    );
}

import React, { useState, useEffect, useRef, useCallback } from 'react';

const W = 400, H = 600;
const PLAYER_W = 40, PLAYER_H = 40;
const PLAYER_X = 60;
const OBSTACLE_W = 30;
const GRAVITY = 0.6, JUMP = -13;
const GROUND_Y = H - 60;

interface Obstacle { x: number; y: number; w: number; h: number; }

export default function EndlessRunner() {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const stateRef = useRef({
        playerY: GROUND_Y - PLAYER_H,
        vy: 0,
        onGround: true,
        obstacles: [] as Obstacle[],
        score: 0,
        speed: 2.0,
        frame: 0,
        lastObstacle: 0,
        dead: false,
        started: false,
    });
    const [display, setDisplay] = useState({ score: 0, dead: false, started: false });
    const rafRef = useRef<number>(0);

    const jump = useCallback(() => {
        const s = stateRef.current;
        if (s.dead) return;
        if (!s.started) s.started = true;
        if (s.onGround) { s.vy = JUMP; s.onGround = false; }
    }, []);

    const restart = useCallback(() => {
        stateRef.current = {
            playerY: GROUND_Y - PLAYER_H,
            vy: 0, onGround: true,
            obstacles: [], score: 0, speed: 2.0, frame: 0, lastObstacle: 0, dead: false, started: false
        };
        setDisplay({ score: 0, dead: false, started: false });
    }, []);

    useEffect(() => {
        const onKey = (e: KeyboardEvent) => { if (['Space','ArrowUp'].includes(e.code)) { e.preventDefault(); jump(); } };
        window.addEventListener('keydown', onKey);
        return () => window.removeEventListener('keydown', onKey);
    }, [jump]);

    useEffect(() => {
        const canvas = canvasRef.current!;
        const ctx = canvas.getContext('2d')!;

        const tick = () => {
            const s = stateRef.current;
            const POLECAT = '#f59e0b';

            // Background
            ctx.fillStyle = '#1c1917';
            ctx.fillRect(0, 0, W, H);

            // Scrolling ground lines for speed feel
            const groundScroll = (s.frame * s.speed) % 60;
            ctx.strokeStyle = '#78716c';
            ctx.setLineDash([20, 40]);
            ctx.lineDashOffset = -groundScroll;
            ctx.beginPath(); ctx.moveTo(0, GROUND_Y + 20); ctx.lineTo(W, GROUND_Y + 20); ctx.stroke();
            ctx.setLineDash([]);

            // Ground
            ctx.fillStyle = '#44403c';
            ctx.fillRect(0, GROUND_Y, W, H - GROUND_Y);

            if (s.started && !s.dead) {
                // Physics
                s.vy += GRAVITY;
                s.playerY += s.vy;
                if (s.playerY >= GROUND_Y - PLAYER_H) { s.playerY = GROUND_Y - PLAYER_H; s.vy = 0; s.onGround = true; }
                else s.onGround = false;

                // Smooth continuous ramp: starts 2.0, caps at 9
                // 0.00012 coefficient → reaches ~3.0 after 1 min, ~5.0 after 4 min
                s.score++;
                s.speed = Math.min(2.0 + s.score * 0.00012, 9);

                // Wider gap at low speed so beginners have time to react
                const reactionGap = Math.max(70, 130 - s.speed * 8);

                // Obstacle spawn & movement
                if (s.frame - s.lastObstacle > reactionGap + Math.random() * 35) {
                    const h = 30 + Math.random() * 40;
                    s.obstacles.push({ x: W, y: GROUND_Y - h, w: OBSTACLE_W, h });
                    s.lastObstacle = s.frame;
                }
                s.obstacles.forEach(o => { o.x -= s.speed; });
                s.obstacles = s.obstacles.filter(o => o.x > -OBSTACLE_W);

                // Collision
                const px = PLAYER_X, py = s.playerY;
                for (const o of s.obstacles) {
                    if (px + PLAYER_W - 8 > o.x && px + 8 < o.x + o.w && py + PLAYER_H - 4 > o.y) {
                        s.dead = true; break;
                    }
                }

                if (s.dead) setDisplay({ score: s.score, dead: true, started: true });
                else if (s.frame % 10 === 0) setDisplay({ score: s.score, dead: false, started: true });
            }

            // Draw obstacles (cacti-style)
            ctx.fillStyle = '#16a34a';
            s.obstacles.forEach(o => {
                ctx.fillRect(o.x, o.y, o.w, o.h);
                ctx.fillRect(o.x - 10, o.y + 10, 10, 20); // left arm
                ctx.fillRect(o.x + o.w, o.y + 15, 10, 15); // right arm
            });

            // Draw player (dino-style)
            const legAnim = Math.sin(s.frame * 0.3) * 6;
            ctx.fillStyle = POLECAT;
            // Body
            ctx.fillRect(PLAYER_X, s.playerY, PLAYER_W, PLAYER_H);
            // Head
            ctx.fillRect(PLAYER_X + 10, s.playerY - 18, 20, 18);
            // Eye
            ctx.fillStyle = '#000';
            ctx.fillRect(PLAYER_X + 24, s.playerY - 14, 4, 4);
            // Legs (only when on ground)
            if (s.onGround || !s.started) {
                ctx.fillStyle = POLECAT;
                ctx.fillRect(PLAYER_X + 4, s.playerY + PLAYER_H, 10, 10 + legAnim);
                ctx.fillRect(PLAYER_X + PLAYER_W - 14, s.playerY + PLAYER_H, 10, 10 - legAnim);
            }

            // Score overlay
            ctx.fillStyle = '#d6d3d1';
            ctx.font = 'bold 20px monospace';
            ctx.textAlign = 'right';
            ctx.fillText(`${Math.floor(s.score / 10)}m`, W - 12, 30);

            s.frame++;
            rafRef.current = requestAnimationFrame(tick);
        };

        rafRef.current = requestAnimationFrame(tick);
        return () => cancelAnimationFrame(rafRef.current);
    }, []);

    return (
        <div className="flex flex-col items-center justify-center min-h-[90vh] bg-stone-950 font-sans gap-4">
            <h1 className="text-4xl font-black tracking-widest text-amber-400 uppercase">Endless Runner</h1>

            <div className="relative cursor-pointer" onClick={jump}>
                <canvas ref={canvasRef} width={W} height={H}
                    className="rounded-2xl shadow-2xl border-4 border-stone-800 max-h-[70vh] w-auto" />

                {!display.started && (
                    <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/40 rounded-2xl pointer-events-none">
                        <div className="text-3xl font-black text-white">Tap / Space to Run!</div>
                    </div>
                )}

                {display.dead && (
                    <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/60 rounded-2xl">
                        <div className="text-4xl font-black text-red-400 mb-2">Crashed!</div>
                        <div className="text-white font-bold text-2xl mb-6">{Math.floor(display.score / 10)}m</div>
                        <button onClick={e => { e.stopPropagation(); restart(); }}
                            className="px-8 py-3 bg-amber-500 hover:bg-amber-400 text-zinc-900 font-black uppercase tracking-widest rounded-xl shadow transition-all">
                            🔄 Run Again
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}

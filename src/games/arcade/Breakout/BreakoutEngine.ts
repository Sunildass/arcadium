import { GameEngine, GameResult } from '../../../core/engine/GameEngine';

export interface Brick {
    id: string;
    x: number;
    y: number;
    width: number;
    height: number;
    color: string;
    status: 'active' | 'destroyed';
    points: number;
}

export interface BreakoutState {
    paddle: {
        x: number;
        y: number;
        width: number;
        height: number;
    };
    ball: {
        x: number;
        y: number;
        radius: number;
        dx: number;
        dy: number;
    };
    bricks: Brick[];
    score: number;
    lives: number;
    isGameOver: boolean;
    hasWon: boolean;
    isPaused: boolean;
}

export type BreakoutAction = 
  | { type: 'MOVE_PADDLE'; x: number }
  | { type: 'TICK'; deltaMs: number }
  | { type: 'TOGGLE_PAUSE' };

export class BreakoutEngine implements GameEngine<BreakoutState, BreakoutAction> {
    private startTimeMs: number = 0;

    // Fixed virtual canvas size for deterministic physics
    public readonly width = 800;
    public readonly height = 600;
    private difficulty: 'Easy' | 'Medium' | 'Hard';

    constructor(difficulty: 'Easy' | 'Medium' | 'Hard' = 'Medium') {
         this.difficulty = difficulty;
    }

    initialize(): BreakoutState {
        this.startTimeMs = Date.now();
        
        const colors = [
             ['#ef4444', '#f97316', '#eab308', '#22c55e', '#3b82f6'], // Medium/Hard
             ['#eab308', '#22c55e', '#3b82f6'] // Easy
        ];
        const rowColors = this.difficulty === 'Easy' ? colors[1] : colors[0];
        
        const brickRows = rowColors.length;
        const brickCols = this.difficulty === 'Easy' ? 8 : 10;
        
        const padding = 10;
        const offsetTop = 50;
        const offsetLeft = 30;
        const brickWidth = (this.width - (offsetLeft * 2) - (padding * (brickCols - 1))) / brickCols;
        const brickHeight = 20;

        const bricks: Brick[] = [];
        for (let r = 0; r < brickRows; r++) {
            for (let c = 0; c < brickCols; c++) {
                bricks.push({
                    id: `r${r}c${c}`,
                    x: offsetLeft + c * (brickWidth + padding),
                    y: offsetTop + r * (brickHeight + padding),
                    width: brickWidth,
                    height: brickHeight,
                    color: rowColors[r],
                    status: 'active',
                    points: (brickRows - r) * 10
                });
            }
        }

        const paddleWidth = this.difficulty === 'Easy' ? 140 : (this.difficulty === 'Hard' ? 80 : 120);

        return {
            paddle: {
                x: (this.width - paddleWidth) / 2,
                y: this.height - 30,
                width: paddleWidth,
                height: 15
            },
            ball: {
                x: this.width / 2,
                y: this.height - 50,
                radius: 8,
                dx: this.difficulty === 'Hard' ? 5 : 4,
                dy: this.difficulty === 'Hard' ? -5 : -4
            },
            bricks,
            score: 0,
            lives: 3,
            isGameOver: false,
            hasWon: false,
            isPaused: true // Start paused
        };
    }

    update(state: BreakoutState, action: BreakoutAction): BreakoutState {
        if (state.isGameOver) return state;

        if (action.type === 'TOGGLE_PAUSE') {
            return { ...state, isPaused: !state.isPaused };
        }

        if (state.isPaused) return state;

        const s = { 
            ...state, 
            paddle: { ...state.paddle }, 
            ball: { ...state.ball }, 
            bricks: state.bricks.map(b => ({...b})) 
        };

        if (action.type === 'MOVE_PADDLE') {
            // Keep strictly within bounds
            const maxX = this.width - s.paddle.width;
            s.paddle.x = Math.max(0, Math.min(action.x, maxX));
            return s;
        }

        if (action.type === 'TICK') {
            // Move ball
            // Using a simple fixed-step physics based on calls. 
            // Better to factor deltaMs but for breakout simple vectors are reliable.
            
            s.ball.x += s.ball.dx;
            s.ball.y += s.ball.dy;

            // Wall collisions (Left/Right)
            if (s.ball.x + s.ball.dx > this.width - s.ball.radius || s.ball.x + s.ball.dx < s.ball.radius) {
                s.ball.dx = -s.ball.dx;
            }

            // Roof collision
            if (s.ball.y + s.ball.dy < s.ball.radius) {
                s.ball.dy = -s.ball.dy;
            }

            // Floor condition (Lost life)
            if (s.ball.y + s.ball.dy > this.height - s.ball.radius) {
                s.lives--;
                if (s.lives <= 0) {
                    s.isGameOver = true;
                    s.hasWon = false;
                } else {
                    // Reset ball
                    s.ball.x = this.width / 2;
                    s.ball.y = this.height - 50;
                    s.ball.dy = -Math.abs(s.ball.dy); // reset to up
                    s.ball.dx = Math.random() > 0.5 ? 4 : -4;
                    s.paddle.x = (this.width - s.paddle.width) / 2;
                    s.isPaused = true;
                }
                return s;
            }

            // Paddle Collision
            // Standard bounding box intersection
            if (s.ball.y + s.ball.dy > s.paddle.y - s.ball.radius && 
                s.ball.y + s.ball.dy < s.paddle.y + s.paddle.height &&
                s.ball.x > s.paddle.x && 
                s.ball.x < s.paddle.x + s.paddle.width) {
                 
                 // Reverse Y
                 s.ball.dy = -s.ball.dy;
                 
                 // Angle modulation based on hit location
                 const hitPoint = s.ball.x - (s.paddle.x + s.paddle.width / 2); // - to +
                 const normalizedHit = hitPoint / (s.paddle.width / 2); // -1 to 1
                 
                 const speed = Math.sqrt(s.ball.dx*s.ball.dx + s.ball.dy*s.ball.dy);
                 
                 // Max angle is ~60 degrees
                 const maxAngle = Math.PI / 3;
                 const angle = normalizedHit * maxAngle;
                 
                 s.ball.dx = speed * Math.sin(angle);
                 s.ball.dy = -speed * Math.cos(angle);
                 
                 // Force minimum Y velocity so it doesn't bounce perfectly horizontal forever
                 if (Math.abs(s.ball.dy) < 2) {
                      s.ball.dy = s.ball.dy < 0 ? -2 : 2;
                 }
            }

            // Brick Collisions
            let hitBrick = false;
            let activeBricks = 0;

            for (let i = 0; i < s.bricks.length; i++) {
                const b = s.bricks[i];
                if (b.status === 'active') {
                     activeBricks++;
                     if (!hitBrick && 
                         s.ball.x > b.x - s.ball.radius && 
                         s.ball.x < b.x + b.width + s.ball.radius &&
                         s.ball.y > b.y - s.ball.radius && 
                         s.ball.y < b.y + b.height + s.ball.radius) {
                          
                          s.ball.dy = -s.ball.dy;
                          b.status = 'destroyed';
                          s.score += b.points;
                          hitBrick = true;
                          activeBricks--;

                          // Speed up slightly on hits
                          const speedFactor = 1.01;
                          s.ball.dx *= speedFactor;
                          s.ball.dy *= speedFactor;
                     }
                }
            }

            if (activeBricks === 0) {
                 s.isGameOver = true;
                 s.hasWon = true;
            }

            return s;
        }

        return state;
    }

    evaluateWin(state: BreakoutState): GameResult | null {
        if (!state.isGameOver) return null;

        const lifeBonus = state.hasWon ? state.lives * 500 : 0;
        const score = state.score + lifeBonus;
        
        return {
            winner: state.hasWon ? 'Player1' : null,
            score,
            difficulty: this.difficulty,
            playTimeMs: Date.now() - this.startTimeMs
        };
    }
}

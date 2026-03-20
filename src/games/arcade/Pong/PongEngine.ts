import { GameEngine, GameResult } from '../../../core/engine/GameEngine';

export interface PongState {
  ball: { x: number; y: number; vx: number; vy: number };
  paddle1: { y: number }; // Human
  paddle2: { y: number }; // AI or P2
  score: { p1: number; p2: number };
  isGameOver: boolean;
  winner: 'Player1' | 'Player2' | 'AI' | null;
}

export const CANVAS_WIDTH = 800;
export const CANVAS_HEIGHT = 400;
export const PADDLE_WIDTH = 15;
export const PADDLE_HEIGHT = 80;
export const BALL_SIZE = 10;
export const PADDLE_SPEED = 8;
export const INITIAL_BALL_SPEED = 4;
export const WIN_SCORE = 5;

export type PongInput = {
  p1Up: boolean;
  p1Down: boolean;
  p2Up: boolean;
  p2Down: boolean;
  mouseY?: number | null;
};

export class PongEngine implements GameEngine<PongState, PongInput> {
  private startTimeMs: number = 0;
  private mode: '1P' | '2P';
  private difficulty: number; // 1 to 10

  constructor(mode: '1P' | '2P', difficulty: number = 5) {
    this.mode = mode;
    this.difficulty = difficulty;
  }

  initialize(): PongState {
    this.startTimeMs = Date.now();
    return this.resetRound({ p1: 0, p2: 0 });
  }

  private resetRound(score: { p1: number; p2: number }): PongState {
    return {
      ball: { x: CANVAS_WIDTH / 2, y: CANVAS_HEIGHT / 2, vx: Math.random() > 0.5 ? INITIAL_BALL_SPEED : -INITIAL_BALL_SPEED, vy: (Math.random() - 0.5) * 4 },
      paddle1: { y: CANVAS_HEIGHT / 2 - PADDLE_HEIGHT / 2 },
      paddle2: { y: CANVAS_HEIGHT / 2 - PADDLE_HEIGHT / 2 },
      score,
      isGameOver: score.p1 >= WIN_SCORE || score.p2 >= WIN_SCORE,
      winner: score.p1 >= WIN_SCORE ? 'Player1' : score.p2 >= WIN_SCORE ? (this.mode === '1P' ? 'AI' : 'Player2') : null
    };
  }

  // Called in a requestAnimationFrame loop ~60fps
  update(state: PongState, input: PongInput): PongState {
    if (state.isGameOver) return state;

    const newState = JSON.parse(JSON.stringify(state)) as PongState;

    // Movement: P1
    if (input.mouseY !== undefined && input.mouseY !== null) {
      // Prioritize precise mouse tracking if available
      newState.paddle1.y = Math.min(CANVAS_HEIGHT - PADDLE_HEIGHT, Math.max(0, input.mouseY - PADDLE_HEIGHT / 2));
    } else {
      // Fallback to keyboard
      if (input.p1Up) newState.paddle1.y = Math.max(0, newState.paddle1.y - PADDLE_SPEED);
      if (input.p1Down) newState.paddle1.y = Math.min(CANVAS_HEIGHT - PADDLE_HEIGHT, newState.paddle1.y + PADDLE_SPEED);
    }

    // Movement: P2 / AI
    if (this.mode === '2P') {
      if (input.p2Up) newState.paddle2.y = Math.max(0, newState.paddle2.y - PADDLE_SPEED);
      if (input.p2Down) newState.paddle2.y = Math.min(CANVAS_HEIGHT - PADDLE_HEIGHT, newState.paddle2.y + PADDLE_SPEED);
    } else {
      // AI Logic based on difficulty rating
      // Difficulty 1: Very slow, misses often
      // Difficulty 10: Perfect tracking
      const aiSpeed = Math.max(2, this.difficulty * 0.9); // max ~9
      const errorMargin = Math.max(0, (10 - this.difficulty) * 20); // up to 180px offset target at rank 1

      // Only track if ball is moving towards AI to simulate reaction time
      if (newState.ball.vx > 0) {
          const targetY = newState.ball.y - PADDLE_HEIGHT / 2 + (Math.random() * errorMargin - errorMargin/2);
          if (newState.paddle2.y + PADDLE_HEIGHT/2 < targetY) {
            newState.paddle2.y = Math.min(CANVAS_HEIGHT - PADDLE_HEIGHT, newState.paddle2.y + aiSpeed);
          } else if (newState.paddle2.y + PADDLE_HEIGHT/2 > targetY) {
            newState.paddle2.y = Math.max(0, newState.paddle2.y - aiSpeed);
          }
      }
    }

    // Ball movement
    newState.ball.x += newState.ball.vx;
    newState.ball.y += newState.ball.vy;

    // Ball collision: Top/Bottom
    if (newState.ball.y <= 0 || newState.ball.y + BALL_SIZE >= CANVAS_HEIGHT) {
      newState.ball.vy *= -1;
      // boundary clamp
      newState.ball.y = newState.ball.y <= 0 ? 0 : CANVAS_HEIGHT - BALL_SIZE;
    }

    // Ball collision: Paddles
    // P1 (Left)
    if (newState.ball.x <= PADDLE_WIDTH && 
        newState.ball.y + BALL_SIZE >= newState.paddle1.y && 
        newState.ball.y <= newState.paddle1.y + PADDLE_HEIGHT) {
      newState.ball.vx *= -1.05; // Speed up slightly on hit
      newState.ball.x = PADDLE_WIDTH; // snap
      // Add english/spin based on where it hit
      const hitPos = (newState.ball.y + BALL_SIZE/2) - (newState.paddle1.y + PADDLE_HEIGHT/2);
      newState.ball.vy += hitPos * 0.1;
    }

    // P2 (Right)
    if (newState.ball.x + BALL_SIZE >= CANVAS_WIDTH - PADDLE_WIDTH && 
        newState.ball.y + BALL_SIZE >= newState.paddle2.y && 
        newState.ball.y <= newState.paddle2.y + PADDLE_HEIGHT) {
      newState.ball.vx *= -1.05;
      newState.ball.x = CANVAS_WIDTH - PADDLE_WIDTH - BALL_SIZE;
      const hitPos = (newState.ball.y + BALL_SIZE/2) - (newState.paddle2.y + PADDLE_HEIGHT/2);
      newState.ball.vy += hitPos * 0.1;
    }

    // Scoring
    if (newState.ball.x < 0) {
      newState.score.p2 += 1;
      return this.resetRound(newState.score);
    } else if (newState.ball.x > CANVAS_WIDTH) {
      newState.score.p1 += 1;
      return this.resetRound(newState.score);
    }

    return newState;
  }

  evaluateWin(state: PongState): GameResult | null {
    if (!state.isGameOver) return null;

    return {
      winner: state.winner,
      score: state.score.p1 * 10 - state.score.p2 * 10,
      playTimeMs: Date.now() - this.startTimeMs,
      difficulty: 'Adaptive'
    };
  }
}

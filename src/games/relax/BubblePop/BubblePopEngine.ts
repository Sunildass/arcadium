import type { GameEngine, GameResult } from '../../../core/engine/GameEngine';

export interface Bubble {
  id: string;
  x: number;
  y: number;
  radius: number;
  color: string;
  vy: number;
  popped: boolean;
}

export interface BubblePopState {
  bubbles: Bubble[];
  score: number;
  bubblesPopped: number;
  isGameOver: boolean; // Never really "over", but a manual exit
}

export const COLORS = ['#ef4444', '#f97316', '#eab308', '#22c55e', '#3b82f6', '#a855f7', '#ec4899'];

export class BubblePopEngine implements GameEngine<BubblePopState, string> {
  private startTimeMs: number = 0;

  initialize(): BubblePopState {
    this.startTimeMs = Date.now();
    return {
      bubbles: this.generateInitialBubbles(),
      score: 0,
      bubblesPopped: 0,
      isGameOver: false,
    };
  }

  // move = bubble id to pop
  update(state: BubblePopState, bubbleId: string | 'tick'): BubblePopState {
    const newState = { ...state, bubbles: [...state.bubbles] };

    if (bubbleId === 'tick') {
      // Move bubbles up
      for (let i = 0; i < newState.bubbles.length; i++) {
        const b = newState.bubbles[i];
        if (!b.popped) {
           b.y -= b.vy;
        }
      }

      // Remove off-screen
      newState.bubbles = newState.bubbles.filter(b => b.y + b.radius > -50 && !b.popped);

      // Add new bubbles randomly
      if (Math.random() < 0.05) {
         newState.bubbles.push(this.createBubble());
      }
    } else {
      // Pop specific bubble
      const bubbleIndex = newState.bubbles.findIndex(b => b.id === bubbleId);
      if (bubbleIndex !== -1 && !newState.bubbles[bubbleIndex].popped) {
         const bubbleInfo = newState.bubbles[bubbleIndex];
         bubbleInfo.popped = true;
         // Score scales inversely with radius: default radius is 15-45.
         // Smaller radius = more points. Max ~30 points.
         const points = Math.floor((50 - bubbleInfo.radius) / 5) * 10;
         newState.score += points;
         newState.bubblesPopped += 1;
      }
    }

    return newState;
  }

  evaluateWin(state: BubblePopState): GameResult | null {
     // Relax games don't have winners/losers traditionally, just scores and time spent.
    return {
      winner: 'Player1',
      score: state.score,
      playTimeMs: Date.now() - this.startTimeMs,
      difficulty: 'Easy'
    };
  }

  private generateInitialBubbles(): Bubble[] {
    const bubbles: Bubble[] = [];
    for (let i = 0; i < 15; i++) {
      bubbles.push(this.createBubble(true));
    }
    return bubbles;
  }

  private createBubble(scatter: boolean = false): Bubble {
     // Scale velocity across the 60s standard play time to make it progressive
     const elapsedMs = Math.max(0, Date.now() - this.startTimeMs);
     const timeProgress = Math.min(1, elapsedMs / 60000); 
     
     // Start extremely slow (0.05 - 0.15) and ramp up significantly at the end (0.3 - 0.9)
     const minSpeed = 0.05 + (timeProgress * 0.25);
     const speedVariance = 0.1 + (timeProgress * 0.75);

     return {
         id: Math.random().toString(36).substring(2, 9),
         x: Math.random() * 100, // percentage based
         y: scatter ? Math.random() * 100 : 110, // start below screen if not scattering
         radius: 15 + Math.random() * 30, // 15px to 45px
         color: COLORS[Math.floor(Math.random() * COLORS.length)],
         vy: minSpeed + Math.random() * speedVariance, // Speed scales with time
         popped: false
     }
  }
}

import { GameEngine, GameResult } from '../../../core/engine/GameEngine';

export type SimonColor = 'Green' | 'Red' | 'Yellow' | 'Blue';

export interface SimonState {
    sequence: SimonColor[];
    playerInput: SimonColor[];
    score: number;
    phase: 'watching' | 'playing' | 'gameover' | 'starting';
    activeColor: SimonColor | null;
}

export type SimonAction = 
  | { type: 'START' }
  | { type: 'PRESS'; color: SimonColor }
  | { type: 'NEXT_ROUND' };

export class SimonEngine implements GameEngine<SimonState, SimonAction> {
    private startTimeMs: number = 0;
    private colors: SimonColor[] = ['Green', 'Red', 'Yellow', 'Blue'];
    private difficulty: 'Easy' | 'Medium' | 'Hard';

    constructor(difficulty: 'Easy' | 'Medium' | 'Hard' = 'Medium') {
        this.difficulty = difficulty;
    }

    initialize(): SimonState {
        this.startTimeMs = Date.now();
        
        return {
            sequence: [],
            playerInput: [],
            score: 0,
            phase: 'starting',
            activeColor: null
        };
    }

    private addRandomColor(sequence: SimonColor[]) {
         const newColor = this.colors[Math.floor(Math.random() * this.colors.length)];
         sequence.push(newColor);
    }

    update(state: SimonState, action: SimonAction): SimonState {
        if (state.phase === 'gameover') return state;

        const s = { ...state, sequence: [...state.sequence], playerInput: [...state.playerInput] };

        if (action.type === 'START' && s.phase === 'starting') {
             this.addRandomColor(s.sequence);
             s.phase = 'watching';
             return s;
        }

        if (action.type === 'PRESS' && s.phase === 'playing') {
             const inputColor = action.color;
             s.playerInput.push(inputColor);

             // Validate input against sequence so far
             const currentIndex = s.playerInput.length - 1;
             
             if (s.sequence[currentIndex] !== inputColor) {
                  // Wrong!
                  s.phase = 'gameover';
             } else {
                  // Correct!
                  if (s.playerInput.length === s.sequence.length) {
                       // Finished the round
                       s.score++;
                       s.phase = 'watching'; // Wait for UI to trigger NEXT_ROUND
                  }
             }
             return s;
        }

        if (action.type === 'NEXT_ROUND' && s.phase === 'watching') {
             s.playerInput = [];
             this.addRandomColor(s.sequence);
             return s;
        }

        return state;
    }

    evaluateWin(state: SimonState): GameResult | null {
        if (state.phase !== 'gameover') return null;

        // In Simon, there's no technical "win", just a high score.
        // We evaluate it as a loss but record the score tightly.
        return {
            winner: null, // Always a "loss" eventually
            score: state.score * 100, // 100 pts per round survived
            difficulty: this.difficulty,
            playTimeMs: Date.now() - this.startTimeMs
        };
    }
}

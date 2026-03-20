import { GameEngine, GameResult } from '../../../core/engine/GameEngine';

export interface NonogramState {
    width: number;
    height: number;
    // The player's current input
    grid: ('empty' | 'filled' | 'marked')[][];
    // The target bitmap that generated the hints
    solution: boolean[][];
    // Hints are numeric arrays mapping consecutive filled blocks
    rowHints: number[][]; // [row][blockIdx]
    colHints: number[][]; // [col][blockIdx]
    isGameOver: boolean;
    mistakes: number;
    moves: number;
}

export type NonogramAction = 
  | { type: 'FILL'; r: number; c: number }
  | { type: 'MARK'; r: number; c: number }
  | { type: 'CLEAR'; r: number; c: number };

export class NonogramEngine implements GameEngine<NonogramState, NonogramAction> {
    private startTimeMs: number = 0;
    private width: number;
    private height: number;

    constructor(difficulty: 'Easy' | 'Medium' | 'Hard' = 'Medium') {
         if (difficulty === 'Easy') {
             this.width = 5; this.height = 5;
         } else if (difficulty === 'Medium') {
             this.width = 10; this.height = 10;
         } else {
             this.width = 15; this.height = 15;
         }
    }

    private generateHints(bitmap: boolean[][], w: number, h: number) {
         const rowHints: number[][] = [];
         const colHints: number[][] = [];

         // Rows
         for (let r = 0; r < h; r++) {
              const hints = [];
              let currentBlock = 0;
              for (let c = 0; c < w; c++) {
                   if (bitmap[r][c]) {
                        currentBlock++;
                   } else if (currentBlock > 0) {
                        hints.push(currentBlock);
                        currentBlock = 0;
                   }
              }
              if (currentBlock > 0) hints.push(currentBlock);
              if (hints.length === 0) hints.push(0); // Explicit zero
              rowHints.push(hints);
         }

         // Cols
         for (let c = 0; c < w; c++) {
              const hints = [];
              let currentBlock = 0;
              for (let r = 0; r < h; r++) {
                   if (bitmap[r][c]) {
                        currentBlock++;
                   } else if (currentBlock > 0) {
                        hints.push(currentBlock);
                        currentBlock = 0;
                   }
              }
              if (currentBlock > 0) hints.push(currentBlock);
              if (hints.length === 0) hints.push(0);
              colHints.push(hints);
         }

         return { rowHints, colHints };
    }

    initialize(): NonogramState {
        this.startTimeMs = Date.now();
        
        // Let's generate a truly solvable puzzle.
        // For now, generating a random bitmap with ~60% fill density often works nicely.
        // Or we could have premade patterns. We'll use random density.
        
        const solution: boolean[][] = Array(this.height).fill(null).map(() => 
             Array(this.width).fill(false)
        );

        // Fill ~60%
        for(let r=0; r<this.height; r++) {
             for(let c=0; c<this.width; c++) {
                  solution[r][c] = Math.random() < 0.6;
             }
        }

        const { rowHints, colHints } = this.generateHints(solution, this.width, this.height);
        
        const grid = Array(this.height).fill(null).map(() => Array(this.width).fill('empty'));

        return {
            width: this.width,
            height: this.height,
            grid,
            solution,
            rowHints,
            colHints,
            isGameOver: false,
            mistakes: 0,
            moves: 0
        };
    }

    private checkWin(state: NonogramState): boolean {
         for (let r = 0; r < state.height; r++) {
             for (let c = 0; c < state.width; c++) {
                  const shouldBeFilled = state.solution[r][c];
                  const isFilled = state.grid[r][c] === 'filled';
                  if (shouldBeFilled !== isFilled) return false;
             }
         }
         return true;
    }

    update(state: NonogramState, action: NonogramAction): NonogramState {
        if (state.isGameOver) return state;

        const { r, c } = action;
        const s = { ...state, grid: state.grid.map(row => [...row]) };
        s.moves++;

        // We can employ strict mode: if they fill an empty that should be FALSE, it counts as a mistake and auto-marks.
        // Classic nonogram style vs modern. We'll use modern auto-validation to make it playable.

        if (action.type === 'FILL') {
             if (s.grid[r][c] === 'filled') return state; // No-op
             
             if (!s.solution[r][c]) {
                 // Mistake
                 s.mistakes++;
                 s.grid[r][c] = 'marked'; // Reveal it's actually empty
             } else {
                 s.grid[r][c] = 'filled';
                 if (this.checkWin(s)) s.isGameOver = true;
             }
        } 
        else if (action.type === 'MARK') {
             if (s.grid[r][c] === 'marked') return state;
             
             if (s.grid[r][c] === 'empty') {
                 s.grid[r][c] = 'marked';
             }
        }
        else if (action.type === 'CLEAR') {
             if (s.grid[r][c] !== 'filled') {
                 s.grid[r][c] = 'empty';
             }
        }

        return s;
    }

    evaluateWin(state: NonogramState): GameResult | null {
         if (!state.isGameOver) return null;
         
         const baseScore = this.width === 5 ? 1000 : (this.width === 10 ? 3000 : 6000);
         const penalty = state.mistakes * 200;
         
         return {
             winner: 'Player1',
             score: Math.max(100, baseScore - penalty),
             difficulty: this.width === 5 ? 'Easy' : (this.width === 10 ? 'Medium' : 'Hard'),
             playTimeMs: Date.now() - this.startTimeMs
         };
    }
}

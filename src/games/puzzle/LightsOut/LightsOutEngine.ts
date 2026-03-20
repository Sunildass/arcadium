import { GameEngine, GameResult } from '../../../core/engine/GameEngine';

export interface LightsOutState {
    grid: boolean[][]; // true = ON, false = OFF
    size: number;
    moves: number;
    isGameOver: boolean;
}

export type LightsOutAction = { type: 'TOGGLE'; r: number; c: number };

export class LightsOutEngine implements GameEngine<LightsOutState, LightsOutAction> {
    private startTimeMs: number = 0;
    private difficulty: 'Easy' | 'Medium' | 'Hard';

    constructor(difficulty: 'Easy' | 'Medium' | 'Hard' = 'Medium') {
         this.difficulty = difficulty;
    }

    initialize(): LightsOutState {
        this.startTimeMs = Date.now();
        const size = this.difficulty === 'Easy' ? 4 : (this.difficulty === 'Medium' ? 5 : 6);
        
        // Start with all off
        const grid: boolean[][] = Array(size).fill(null).map(() => Array(size).fill(false));

        // Randomize by making valid moves backwards to ensure solvability
        const randomizeCount = size * size;
        for (let i = 0; i < randomizeCount; i++) {
            const r = Math.floor(Math.random() * size);
            const c = Math.floor(Math.random() * size);
            this.toggleCross(grid, r, c, size);
        }

        // Extremely rare edge case: fully solved from random moves
        if (this.checkWin(grid, size)) {
             this.toggleCross(grid, 0, 0, size); // manually toggle one
        }

        return {
            grid,
            size,
            moves: 0,
            isGameOver: false
        };
    }

    private toggleCross(grid: boolean[][], r: number, c: number, size: number) {
         const coords = [
             [r, c], [r-1, c], [r+1, c], [r, c-1], [r, c+1]
         ];
         for (const [nr, nc] of coords) {
             if (nr >= 0 && nr < size && nc >= 0 && nc < size) {
                  grid[nr][nc] = !grid[nr][nc];
             }
         }
    }

    private checkWin(grid: boolean[][], size: number): boolean {
         for (let r = 0; r < size; r++) {
             for (let c = 0; c < size; c++) {
                  if (grid[r][c]) return false;
             }
         }
         return true;
    }

    update(state: LightsOutState, action: LightsOutAction): LightsOutState {
        if (state.isGameOver) return state;

        if (action.type === 'TOGGLE') {
             const newGrid = state.grid.map(row => [...row]);
             this.toggleCross(newGrid, action.r, action.c, state.size);
             
             const isWin = this.checkWin(newGrid, state.size);

             return {
                 grid: newGrid,
                 size: state.size,
                 moves: state.moves + 1,
                 isGameOver: isWin
             };
        }

        return state;
    }

    evaluateWin(state: LightsOutState): GameResult | null {
        if (!state.isGameOver) return null;

        const baseScore = state.size === 4 ? 1000 : (state.size === 5 ? 2000 : 3000);
        const penalty = Math.max(0, (state.moves - (state.size * state.size)) * 10);
        
        return {
            winner: 'Player1',
            score: Math.max(100, baseScore - penalty),
            difficulty: this.difficulty,
            playTimeMs: Date.now() - this.startTimeMs
        };
    }
}

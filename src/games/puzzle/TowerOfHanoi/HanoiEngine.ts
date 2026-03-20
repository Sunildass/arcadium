import { GameEngine, GameResult } from '../../../core/engine/GameEngine';

export interface HanoiState {
    towers: number[][]; // Array of 3 arrays. Disks are 1 (smallest) to N (largest)
    totalDisks: number;
    movesCount: number;
    isGameOver: boolean;
}

export type HanoiAction = { type: 'MOVE'; from: number; to: number };

export class HanoiEngine implements GameEngine<HanoiState, HanoiAction> {
    private startTimeMs: number = 0;
    private diskCount: number;

    constructor(difficulty: 'Easy' | 'Medium' | 'Hard' = 'Medium') {
        if (difficulty === 'Easy') this.diskCount = 3;
        else if (difficulty === 'Medium') this.diskCount = 5;
        else this.diskCount = 7;
    }

    initialize(): HanoiState {
        this.startTimeMs = Date.now();
        
        const towers: number[][] = [[], [], []];
        // Populate first tower with N down to 1 (Bottom is N, top is 1)
        for (let i = this.diskCount; i >= 1; i--) {
            towers[0].push(i);
        }

        return {
            towers,
            totalDisks: this.diskCount,
            movesCount: 0,
            isGameOver: false
        };
    }

    update(state: HanoiState, action: HanoiAction): HanoiState {
        if (state.isGameOver) return state;

        if (action.type === 'MOVE') {
            const { from, to } = action;
            if (from < 0 || from > 2 || to < 0 || to > 2 || from === to) return state;

            const fromTower = state.towers[from];
            const toTower = state.towers[to];

            if (fromTower.length === 0) return state;

            const diskToMove = fromTower[fromTower.length - 1];

            // Validate rule: smaller on larger
            if (toTower.length > 0) {
                 const topDisk = toTower[toTower.length - 1];
                 if (diskToMove > topDisk) return state; // Invalid move
            }

            // Execute move
            const newTowers = state.towers.map(t => [...t]);
            newTowers[to].push(newTowers[from].pop()!);

            // Check Win (All on tower 2)
            const isGameOver = newTowers[2].length === this.diskCount;

            return {
                towers: newTowers,
                totalDisks: state.totalDisks,
                movesCount: state.movesCount + 1,
                isGameOver
            };
        }

        return state;
    }

    evaluateWin(state: HanoiState): GameResult | null {
        if (!state.isGameOver) return null;

        const optimalMoves = Math.pow(2, state.totalDisks) - 1;
        const penalties = Math.max(0, state.movesCount - optimalMoves);
        
        const baseScore = state.totalDisks === 3 ? 500 : (state.totalDisks === 5 ? 2000 : 5000);
        const score = Math.max(100, baseScore - (penalties * 50));
        
        const difficulty = state.totalDisks === 3 ? 'Easy' : (state.totalDisks === 5 ? 'Medium' : 'Hard');

        return {
            winner: 'Player1',
            score,
            difficulty,
            playTimeMs: Date.now() - this.startTimeMs
        };
    }
}

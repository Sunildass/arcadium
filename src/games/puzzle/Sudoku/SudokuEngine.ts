import type { GameEngine, GameResult } from '../../../core/engine/GameEngine';
import { generatePuzzle, isValidPlacement } from './types';
import type { SudokuState, SudokuValue } from './types';

export class SudokuEngine implements GameEngine<SudokuState, { r: number, c: number, v: SudokuValue | 'note', num?: number }> {
    private startTimeMs: number = 0;

    initialize(): SudokuState {
        return this.startNewGame('Medium');
    }

    public startNewGame(difficulty: 'Easy' | 'Medium' | 'Hard'): SudokuState {
        this.startTimeMs = Date.now();
        const level = difficulty === 'Easy' ? 1 : difficulty === 'Medium' ? 2 : 3;
        const initialGrid = generatePuzzle(level);

        const board = initialGrid.map(row => row.map(cell => ({
            value: cell,
            isInitial: cell !== null,
            isError: false,
            notes: new Set<number>()
        })));

        return {
            board,
            selectedCell: null,
            isGameOver: false,
            difficulty,
            mistakes: 0,
            noteMode: false
        };
    }

    update(state: SudokuState, move: { r: number, c: number, v: SudokuValue | 'note', num?: number }): SudokuState {
        if (state.isGameOver) return state;

        const newBoard = state.board.map(row => row.map(cell => ({ ...cell, notes: new Set(cell.notes) })));
        const targetCell = newBoard[move.r][move.c];

        if (targetCell.isInitial) return state; // Can't edit initial

        let newMistakes = state.mistakes;

        if (move.v === 'note' && move.num) {
            if (targetCell.notes.has(move.num)) {
                targetCell.notes.delete(move.num);
            } else {
                targetCell.notes.add(move.num);
            }
        } else if (move.v !== 'note') {
            targetCell.value = move.v;
            // Clear notes if value placed
            if (move.v !== null) targetCell.notes.clear();

            // Validate on placement
            if (move.v !== null) {
                // temporarily remove value to test logic
                targetCell.value = null;
                const gridVals = newBoard.map(r => r.map(c => c.value));
                const isValid = isValidPlacement(gridVals, move.r, move.c, move.v);
                targetCell.value = move.v;

                targetCell.isError = !isValid;
                if (!isValid) newMistakes++;
            } else {
                targetCell.isError = false; // Erasing
            }
        }

        // Check Win
        let isWin = true;
        for (let r = 0; r < 9; r++) {
            for (let c = 0; c < 9; c++) {
                 if (newBoard[r][c].value === null || newBoard[r][c].isError) {
                     isWin = false;
                     break;
                 }
            }
            if (!isWin) break;
        }

        return {
            ...state,
            board: newBoard,
            mistakes: newMistakes,
            isGameOver: isWin
        };
    }

    evaluateWin(state: SudokuState): GameResult | null {
        if (!state.isGameOver) return null;

        return {
            winner: 'Player1', // Single player
            score: state.difficulty === 'Hard' ? 300 : state.difficulty === 'Medium' ? 200 : 100,
            playTimeMs: Date.now() - this.startTimeMs,
            difficulty: state.difficulty as any,
        };
    }
}

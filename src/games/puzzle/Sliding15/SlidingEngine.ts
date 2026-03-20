import { GameEngine, GameResult } from '../../../core/engine/GameEngine';

export interface SlidingState {
    board: number[]; // 1D array of 16 items. 1-15, 0 is empty.
    moves: number;
    isGameOver: boolean;
}

export type SlidingAction = { type: 'MOVE'; index: number };

export class SlidingEngine implements GameEngine<SlidingState, SlidingAction> {
    private startTimeMs: number = 0;
    private difficulty: 'Easy' | 'Medium' | 'Hard';

    constructor(difficulty: 'Easy' | 'Medium' | 'Hard' = 'Medium') {
        this.difficulty = difficulty;
    }

    initialize(): SlidingState {
        this.startTimeMs = Date.now();
        
        let board = Array.from({length: 15}, (_, i) => i + 1);
        board.push(0);

        // Shuffle logic that guarantees solvability
        // 1. Randomize
        // 2. Check inversions
        // 3. Fix if unsolvable

        do {
            this.shuffle(board);
        } while (!this.isSolvable(board) || this.checkWinCondition(board));

        return {
            board,
            moves: 0,
            isGameOver: false
        };
    }

    private shuffle(array: number[]) {
        for (let i = array.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [array[i], array[j]] = [array[j], array[i]];
        }
    }

    private isSolvable(board: number[]): boolean {
        let inversions = 0;
        const width = 4;
        let emptyRow = 0; // 0-indexed from top

        for (let i = 0; i < board.length; i++) {
            if (board[i] === 0) {
                emptyRow = Math.floor(i / width);
                continue;
            }
            for (let j = i + 1; j < board.length; j++) {
                if (board[j] !== 0 && board[i] > board[j]) {
                    inversions++;
                }
            }
        }

        // For a grid of EVEN width (4):
        // Solvable if:
        // empty space on an EVEN row counting from the bottom (0-indexed, so bottom is row 3, even from bottom = row 0, 2) AND inversions is ODD
        // empty space on an ODD row counting from the bottom (row 1, 3) AND inversions is EVEN

        const rowFromBottom = (width - 1) - emptyRow; // 3, 2, 1, 0
        
        if (rowFromBottom % 2 !== 0) {
             return inversions % 2 === 0;
        } else {
             return inversions % 2 !== 0;
        }
    }

    private checkWinCondition(board: number[]): boolean {
        // Last element must be 0
        if (board[board.length - 1] !== 0) return false;
        
        // 1 through 15 in order
        for (let i = 0; i < board.length - 1; i++) {
            if (board[i] !== i + 1) return false;
        }
        return true;
    }

    update(state: SlidingState, action: SlidingAction): SlidingState {
        if (state.isGameOver) return state;

        if (action.type === 'MOVE') {
             const { index } = action;
             const emptyIndex = state.board.indexOf(0);

             // Check if adjacent
             const row = Math.floor(index / 4);
             const col = index % 4;
             const eRow = Math.floor(emptyIndex / 4);
             const eCol = emptyIndex % 4;

             const isAdjacent = (Math.abs(row - eRow) === 1 && col === eCol) || 
                                (Math.abs(col - eCol) === 1 && row === eRow);
             
             if (isAdjacent) {
                  const newBoard = [...state.board];
                  newBoard[emptyIndex] = newBoard[index];
                  newBoard[index] = 0;

                  const isWin = this.checkWinCondition(newBoard);

                  return {
                      board: newBoard,
                      moves: state.moves + 1,
                      isGameOver: isWin
                  };
             }
        }

        return state;
    }

    evaluateWin(state: SlidingState): GameResult | null {
        if (!state.isGameOver) return null;

        // Score based on moves. Optimal is around 80.
        const baseScore = 2000;
        const penalty = Math.max(0, (state.moves - 100) * 10);

        return {
            winner: 'Player1',
            score: Math.max(100, baseScore - penalty),
            difficulty: this.difficulty,
            playTimeMs: Date.now() - this.startTimeMs
        };
    }
}

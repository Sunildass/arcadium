import { GameEngine, GameResult } from '../../../core/engine/GameEngine';

export type PlayerColor = 'Black' | 'White';
export type GomokuCell = PlayerColor | null;

export interface Position {
    r: number;
    c: number;
}

export interface GomokuState {
    board: GomokuCell[][];
    turn: PlayerColor;
    isGameOver: boolean;
    winner: PlayerColor | 'Draw' | null;
    winningLine: Position[] | null;
    movesCount: number;
}

export class GomokuEngine implements GameEngine<GomokuState, Position> {
    private startTimeMs: number = 0;
    private mode: '1P' | '2P';
    private difficulty: number; // 0-10
    private size: number = 15;

    constructor(mode: '1P' | '2P', difficulty: number = 5) {
        this.mode = mode;
        this.difficulty = difficulty;
    }

    initialize(): GomokuState {
        this.startTimeMs = Date.now();
        const board: GomokuCell[][] = Array(this.size).fill(null).map(() => Array(this.size).fill(null));

        return {
            board,
            turn: 'Black', // Standard rule: Black plays first
            isGameOver: false,
            winner: null,
            winningLine: null,
            movesCount: 0
        };
    }

    private checkWin(board: GomokuCell[][], lastR: number, lastC: number, color: PlayerColor): Position[] | null {
        const dirs = [
            [[0, 1], [0, -1]],   // Horizontal
            [[1, 0], [-1, 0]],   // Vertical
            [[1, 1], [-1, -1]],  // Diagonal \
            [[1, -1], [-1, 1]]   // Diagonal /
        ];

        for (const dirPair of dirs) {
            const line: Position[] = [{ r: lastR, c: lastC }];
            let count = 1;

            for (const [dr, dc] of dirPair) {
                let r = lastR + dr;
                let c = lastC + dc;
                while (r >= 0 && r < this.size && c >= 0 && c < this.size && board[r][c] === color) {
                    count++;
                    line.push({ r, c });
                    r += dr;
                    c += dc;
                }
            }

            if (count >= 5) {
                return line;
            }
        }

        return null;
    }

    update(state: GomokuState, action: Position): GomokuState {
        if (state.isGameOver) return state;
        if (state.board[action.r][action.c] !== null) return state; // Invalid move

        const newBoard = state.board.map(row => [...row]);
        newBoard[action.r][action.c] = state.turn;
        
        const winningLine = this.checkWin(newBoard, action.r, action.c, state.turn);
        const movesCount = state.movesCount + 1;
        
        let isGameOver = false;
        let winner: PlayerColor | 'Draw' | null = null;

        if (winningLine) {
            isGameOver = true;
            winner = state.turn;
        } else if (movesCount === this.size * this.size) {
            isGameOver = true;
            winner = 'Draw';
        }

        return {
            ...state,
            board: newBoard,
            turn: state.turn === 'Black' ? 'White' : 'Black',
            isGameOver,
            winner,
            winningLine,
            movesCount
        };
    }

    evaluateWin(state: GomokuState): GameResult | null {
        if (!state.isGameOver) return null;
        return {
            winner: state.winner === 'Draw' ? null : state.winner === 'Black' ? 'Player1' : (this.mode === '1P' ? 'AI' : 'Player2'),
            score: state.winner === 'Draw' ? 0 : 500, // Minimalist scoring
            difficulty: this.mode === '1P' ? 'Hard' as any : 'Easy' as any,
            playTimeMs: Date.now() - this.startTimeMs
        };
    }

    public computeAIMove(state: GomokuState): Position | null {
         if (state.isGameOver) return null;
         
         // If first move and AI is black (rare, but just in case)
         if (state.movesCount === 0) return { r: 7, c: 7 };

         // Quick defensive heuristic: evaluate open lines
         // If a move creates a 5, play it.
         // If a move blocks opponent's 5, play it.
         // Otherwise, evaluate neighborhood scores.
         
         let bestScore = -Infinity;
         let bestMove: Position | null = null;
         const board = state.board;

         const evaluatePos = (r: number, c: number, color: PlayerColor): number => {
              board[r][c] = color;
              let score = 0;
              
              const dirs = [
                  [0, 1], [1, 0], [1, 1], [1, -1]
              ];

              for (const [dr, dc] of dirs) {
                  let consec = 1;
                  let openEnds = 0;

                  // Forward
                  let fr = r + dr, fc = c + dc;
                  while(fr >= 0 && fr < this.size && fc >= 0 && fc < this.size && board[fr][fc] === color) {
                      consec++;
                      fr += dr; fc += dc;
                  }
                  if (fr >= 0 && fr < this.size && fc >= 0 && fc < this.size && board[fr][fc] === null) openEnds++;

                  // Backward
                  let br = r - dr, bc = c - dc;
                  while(br >= 0 && br < this.size && bc >= 0 && bc < this.size && board[br][bc] === color) {
                      consec++;
                      br -= dr; bc -= dc;
                  }
                  if (br >= 0 && br < this.size && bc >= 0 && bc < this.size && board[br][bc] === null) openEnds++;

                  if (consec >= 5) score += 100000;
                  else if (consec === 4 && openEnds === 2) score += 10000;
                  else if (consec === 4 && openEnds === 1) score += 1000;
                  else if (consec === 3 && openEnds === 2) score += 500;
                  else if (consec === 3 && openEnds === 1) score += 50;
                  else if (consec === 2 && openEnds === 2) score += 10;
              }

              board[r][c] = null; // Revert
              return score;
         }

         const opponentColor = state.turn === 'Black' ? 'White' : 'Black';

         // Restrict search space to neighbors of existing pieces to save compute
         const searchSpace = new Set<string>();
         for (let r = 0; r < this.size; r++) {
             for (let c = 0; c < this.size; c++) {
                 if (board[r][c] !== null) {
                     // Add neighbors
                     for (let dr = -2; dr <= 2; dr++) {
                         for (let dc = -2; dc <= 2; dc++) {
                             const nr = r + dr, nc = c + dc;
                             if (nr >= 0 && nr < this.size && nc >= 0 && nc < this.size && board[nr][nc] === null) {
                                 searchSpace.add(`${nr},${nc}`);
                             }
                         }
                     }
                 }
             }
         }

         for (const posStr of searchSpace) {
             const [r, c] = posStr.split(',').map(Number);
             
             // Evaluate offense
             const attackScore = evaluatePos(r, c, state.turn);
             // Evaluate defense (if opponent played here)
             const defScore = evaluatePos(r, c, opponentColor);

             // Heuristic mix, prioritizing immediate block of 4s, but preferring attack heavily over minor defending
             const totalScore = attackScore + (defScore * 0.9) + Math.random() * 5; // slight rand for variety

             if (totalScore > bestScore) {
                 bestScore = totalScore;
                 bestMove = { r, c };
             }
         }
         
         if (!bestMove) {
              // Fallback (e.g., if somehow nothing is returned, just pick first empty)
              for (let r = 0; r < this.size; r++) {
                  for (let c = 0; c < this.size; c++) {
                      if (board[r][c] === null) return { r, c };
                  }
              }
         }

         return bestMove;
    }
}

import { GameEngine, GameResult } from '../../../core/engine/GameEngine';

export type PlayerType = 'Black' | 'White';

export interface Position {
  x: number;
  y: number;
}

export interface ReversiState {
  board: (PlayerType | null)[][];
  turn: PlayerType;
  validMoves: Position[];
  isGameOver: boolean;
  winner: PlayerType | 'Draw' | null;
  blackCount: number;
  whiteCount: number;
}

const DIRECTIONS = [
    { dx: -1, dy: -1 }, { dx: 0, dy: -1 }, { dx: 1, dy: -1 },
    { dx: -1, dy: 0 },                     { dx: 1, dy: 0 },
    { dx: -1, dy: 1 },  { dx: 0, dy: 1 },  { dx: 1, dy: 1 },
];

export class ReversiEngine implements GameEngine<ReversiState, Position> {
  private startTimeMs: number = 0;
  private mode: '1P' | '2P';
  private difficulty: number;

  constructor(mode: '1P' | '2P', difficulty: number = 5) {
    this.mode = mode;
    this.difficulty = difficulty;
  }

  initialize(): ReversiState {
    this.startTimeMs = Date.now();
    const board: (PlayerType | null)[][] = Array(8).fill(null).map(() => Array(8).fill(null));

    // Initial 4 pieces in the center
    board[3][3] = 'White';
    board[4][4] = 'White';
    board[3][4] = 'Black';
    board[4][3] = 'Black';

    const state: ReversiState = {
      board,
      turn: 'Black', // Black goes first by standard rules
      validMoves: [],
      isGameOver: false,
      winner: null,
      blackCount: 2,
      whiteCount: 2,
    };

    state.validMoves = this.getAllValidMoves(state.board, state.turn);
    return state;
  }

  private isValidPos(x: number, y: number): boolean {
      return x >= 0 && x < 8 && y >= 0 && y < 8;
  }

  private cloneBoard(board: (PlayerType | null)[][]): (PlayerType | null)[][] {
      return board.map(row => [...row]);
  }

  // Returns array of positions that would be flipped if 'player' places at (x,y)
  public getPiecesToFlip(board: (PlayerType | null)[][], player: PlayerType, x: number, y: number): Position[] {
      if (!this.isValidPos(x, y) || board[y][x] !== null) {
          return [];
      }

      const opponent: PlayerType = player === 'Black' ? 'White' : 'Black';
      const flipped: Position[] = [];

      for (const dir of DIRECTIONS) {
          let cx = x + dir.dx;
          let cy = y + dir.dy;
          const currentDirFlipped: Position[] = [];

          while (this.isValidPos(cx, cy) && board[cy][cx] === opponent) {
              currentDirFlipped.push({ x: cx, y: cy });
              cx += dir.dx;
              cy += dir.dy;
          }

          if (this.isValidPos(cx, cy) && board[cy][cx] === player && currentDirFlipped.length > 0) {
              flipped.push(...currentDirFlipped);
          }
      }

      return flipped;
  }

  public getAllValidMoves(board: (PlayerType | null)[][], player: PlayerType): Position[] {
      const moves: Position[] = [];
      for (let y = 0; y < 8; y++) {
          for (let x = 0; x < 8; x++) {
              if (this.getPiecesToFlip(board, player, x, y).length > 0) {
                  moves.push({ x, y });
              }
          }
      }
      return moves;
  }

  private countPieces(board: (PlayerType | null)[][]) {
      let black = 0;
      let white = 0;
      for (let y = 0; y < 8; y++) {
          for (let x = 0; x < 8; x++) {
              if (board[y][x] === 'Black') black++;
              else if (board[y][x] === 'White') white++;
          }
      }
      return { blackCount: black, whiteCount: white };
  }

  update(state: ReversiState, move: Position | 'PASS'): ReversiState {
    if (state.isGameOver) return state;

    const newState = { ...state, board: this.cloneBoard(state.board) };

    if (move !== 'PASS') {
        const flipped = this.getPiecesToFlip(newState.board, newState.turn, move.x, move.y);
        
        // This shouldn't happen via UI normally, but if an invalid move is injected, reject
        if (flipped.length === 0) return state;

        newState.board[move.y][move.x] = newState.turn;
        for (const f of flipped) {
            newState.board[f.y][f.x] = newState.turn;
        }
    }

    // Switch turn
    newState.turn = newState.turn === 'Black' ? 'White' : 'Black';
    
    // Evaluate new moves for the NEW turn
    newState.validMoves = this.getAllValidMoves(newState.board, newState.turn);

    // If new player has no moves, check if the other player does
    if (newState.validMoves.length === 0) {
        const otherPlayer = newState.turn === 'Black' ? 'White' : 'Black';
        const otherPlayerMoves = this.getAllValidMoves(newState.board, otherPlayer);

        if (otherPlayerMoves.length === 0) {
            // Neither player can move. Game over.
            newState.isGameOver = true;
        } else {
            // Forced Pass condition. 
            // We can either auto-pass, or yield to the UI to handle it. 
            // Standard approach is to yield a state where `validMoves` is empty,
            // Then the UI detects it and sends a 'PASS' action to skip turn.
        }
    }

    const counts = this.countPieces(newState.board);
    newState.blackCount = counts.blackCount;
    newState.whiteCount = counts.whiteCount;

    if (newState.isGameOver || (newState.blackCount + newState.whiteCount === 64)) {
        newState.isGameOver = true;
        if (newState.blackCount > newState.whiteCount) newState.winner = 'Black';
        else if (newState.whiteCount > newState.blackCount) newState.winner = 'White';
        else newState.winner = 'Draw';
    }

    return newState;
  }

  evaluateWin(state: ReversiState): GameResult | null {
    if (!state.isGameOver) return null;

    return {
      winner: state.winner === 'Draw' ? null : state.winner === 'Black' ? 'Player1' : (this.mode === '1P' ? 'AI' : 'Player2'),
      score: Math.max(state.blackCount, state.whiteCount) * 10,
      difficulty: this.mode === '1P' ? 'Adaptive' : 'Easy' as any,
      playTimeMs: Date.now() - this.startTimeMs,
    };
  }

  // Very simple greedy AI evaluation (maximizing flipped pieces)
  // Harder difficulties will weight corners heavily
  public computeAIMove(state: ReversiState): Position | null {
      if (state.validMoves.length === 0) return null;

      let bestScore = -Infinity;
      let bestMove = state.validMoves[0];

      // Corners are highest value in Reversi
      const isCorner = (x: number, y: number) => {
          return (x === 0 || x === 7) && (y === 0 || y === 7);
      };

      for (const move of state.validMoves) {
          const flipped = this.getPiecesToFlip(state.board, state.turn, move.x, move.y);
          let score = flipped.length;

          // Artificial heuristic bumps
          if (this.difficulty >= 4 && isCorner(move.x, move.y)) score += 20;
          
          if (score > bestScore) {
              bestScore = score;
              bestMove = move;
          }
      }

      return bestMove;
  }
}

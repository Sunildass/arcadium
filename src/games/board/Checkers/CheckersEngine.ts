import { GameEngine, GameResult } from '../../../core/engine/GameEngine';

export type PlayerType = 'Red' | 'Black';

export interface Piece {
  player: PlayerType;
  isKing: boolean;
}

export interface Position {
  x: number;
  y: number;
}

export interface Move {
  from: Position;
  to: Position;
  isJump: boolean;
  jumpedPosition?: Position;
}

export interface CheckersState {
  board: (Piece | null)[][];
  turn: PlayerType;
  selectedPos: Position | null;
  validMoves: Move[];
  isGameOver: boolean;
  winner: PlayerType | 'Draw' | null;
  mustJumpPos: Position | null; // Used during multi-jump sequences
}

export class CheckersEngine implements GameEngine<CheckersState, Move> {
  private startTimeMs: number = 0;
  private mode: '1P' | '2P';
  private difficulty: number; // For AI

  constructor(mode: '1P' | '2P', difficulty: number = 5) {
    this.mode = mode;
    this.difficulty = difficulty;
  }

  initialize(): CheckersState {
    this.startTimeMs = Date.now();
    return this.getInitialState();
  }

  private getInitialState(): CheckersState {
    const board: (Piece | null)[][] = Array(8).fill(null).map(() => Array(8).fill(null));

    // Initialize Black pieces (Top: rows 0, 1, 2)
    for (let y = 0; y < 3; y++) {
      for (let x = 0; x < 8; x++) {
        if ((x + y) % 2 === 1) {
          board[y][x] = { player: 'Black', isKing: false };
        }
      }
    }

    // Initialize Red pieces (Bottom: rows 5, 6, 7)
    for (let y = 5; y < 8; y++) {
      for (let x = 0; x < 8; x++) {
        if ((x + y) % 2 === 1) {
          board[y][x] = { player: 'Red', isKing: false };
        }
      }
    }

    const state: CheckersState = {
      board,
      turn: 'Red', // Red goes first
      selectedPos: null,
      validMoves: [],
      isGameOver: false,
      winner: null,
      mustJumpPos: null,
    };

    // Calculate initial valid moves (though player hasn't selected a piece yet, 
    // it's useful to know if forced jumps exist globally).
    // Actually, in UI, we select a piece matching 'turn' and check its moves.
    // Let's populate validMoves globally if we want to force jumps on selection.
    
    return state;
  }

  public getAllValidMoves(board: (Piece | null)[][], player: PlayerType, mustJumpPos: Position | null): Move[] {
      let moves: Move[] = [];
      let hasJump = false;

      for (let y = 0; y < 8; y++) {
          for (let x = 0; x < 8; x++) {
              if (mustJumpPos && (mustJumpPos.x !== x || mustJumpPos.y !== y)) {
                  continue; // Only look at the piece that must continue jumping
              }

              const piece = board[y][x];
              if (piece && piece.player === player) {
                  const pieceMoves = this.getPieceMoves(board, { x, y });
                  for (const m of pieceMoves) {
                      if (m.isJump) {
                          if (!hasJump) {
                              moves = []; // Clear non-jumps
                              hasJump = true;
                          }
                          moves.push(m);
                      } else if (!hasJump) {
                          moves.push(m);
                      }
                  }
              }
          }
      }

      return moves;
  }

  public getPieceMoves(board: (Piece | null)[][], pos: Position): Move[] {
      const piece = board[pos.y][pos.x];
      if (!piece) return [];

      const moves: Move[] = [];
      
      // Directions: Red moves up (-1), Black moves down (+1). Kings move both.
      const dyOptions = piece.isKing ? [-1, 1] : piece.player === 'Red' ? [-1] : [1];
      const dxOptions = [-1, 1];

      for (const dy of dyOptions) {
          for (const dx of dxOptions) {
              const ny = pos.y + dy;
              const nx = pos.x + dx;

              if (this.isValidPos(nx, ny)) {
                  // Regular move
                  if (!board[ny][nx]) {
                      moves.push({ from: pos, to: { x: nx, y: ny }, isJump: false });
                  } 
                  // Jump move
                  else if (board[ny][nx]!.player !== piece.player) {
                      const jy = ny + dy;
                      const jx = nx + dx;
                      if (this.isValidPos(jx, jy) && !board[jy][jx]) {
                          moves.push({ 
                              from: pos, 
                              to: { x: jx, y: jy }, 
                              isJump: true, 
                              jumpedPosition: { x: nx, y: ny } 
                          });
                      }
                  }
              }
          }
      }

      return moves;
  }

  private isValidPos(x: number, y: number): boolean {
      return x >= 0 && x < 8 && y >= 0 && y < 8;
  }

  // Clones board deeply
  private cloneBoard(board: (Piece | null)[][]): (Piece | null)[][] {
      return board.map(row => row.map(cell => cell ? { ...cell } : null));
  }

  update(state: CheckersState, action: Move | 'CANCEL_SELECTION'): CheckersState {
    if (state.isGameOver) return state;

    if (action === 'CANCEL_SELECTION') {
        if (state.mustJumpPos) return state; // Cannot cancel mid-jump
        return { ...state, selectedPos: null };
    }

    const move = action;
    const newState = { ...state, board: this.cloneBoard(state.board) };
    
    const piece = newState.board[move.from.y][move.from.x];
    if (!piece || piece.player !== state.turn) return state; // Invalid request

    // Execute Move
    newState.board[move.to.y][move.to.x] = piece;
    newState.board[move.from.y][move.from.x] = null;

    if (move.isJump && move.jumpedPosition) {
        newState.board[move.jumpedPosition.y][move.jumpedPosition.x] = null;
    }

    // King Promotion
    let promoted = false;
    if (piece.player === 'Red' && move.to.y === 0 && !piece.isKing) {
        piece.isKing = true;
        promoted = true;
    } else if (piece.player === 'Black' && move.to.y === 7 && !piece.isKing) {
        piece.isKing = true;
        promoted = true;
    }

    // Handle Jumps
    newState.mustJumpPos = null;
    if (move.isJump && !promoted) { // standard US checkers: promotion ends turn immediately
        // Check if additional jumps are possible from the new position
        const subsequentMoves = this.getPieceMoves(newState.board, move.to);
        const hasMoreJumps = subsequentMoves.some(m => m.isJump);

        if (hasMoreJumps) {
            newState.mustJumpPos = move.to;
            // Keeps turn the same, validMoves will be repopulated below
        }
    }

    // Switch turn if no further jumps required
    if (!newState.mustJumpPos) {
        newState.turn = newState.turn === 'Red' ? 'Black' : 'Red';
    }

    newState.selectedPos = null; // Reset selection

    // Check for Win condition before finalizing
    const nextPlayerMoves = this.getAllValidMoves(newState.board, newState.turn, newState.mustJumpPos);
    
    if (nextPlayerMoves.length === 0) {
        newState.isGameOver = true;
        // The player who cannot move loses. (Red can't move -> Black wins)
        newState.winner = newState.turn === 'Red' ? 'Black' : 'Red';
    }

    // If it's AI's turn (1P mode), we don't trigger AI in `update` normally, the UI triggers it or wrapper triggers it.
    // We will let the Game Component handle standard AI dispatch based on `newState.turn`

    return newState;
  }

  evaluateWin(state: CheckersState): GameResult | null {
    if (!state.isGameOver) return null;

    // Evaluate basic score. (Win = 100, remaining pieces bonus).
    const isHumanWin = state.winner === 'Red';
    let piecesRemaining = 0;
    for (let y=0; y<8; y++) {
        for (let x=0; x<8; x++) {
            if (state.board[y][x]?.player === state.winner) {
                piecesRemaining++;
            }
        }
    }
    
    let score = isHumanWin ? 100 + (piecesRemaining * 10) : 0;

    return {
      winner: state.winner === 'Draw' ? null : state.winner === 'Red' ? 'Player1' : (this.mode === '1P' ? 'AI' : 'Player2'),
      score,
      difficulty: this.mode === '1P' ? 'Adaptive' : 'Easy' as any,
      playTimeMs: Date.now() - this.startTimeMs,
    };
  }

  // Basic Minimax AI hook
  public computeAIMove(state: CheckersState): Move | null {
      // Very basic Greedy / Random fallback for now depending on difficulty
      // Higher difficulty evaluates deep. Lower difficulty picks random valid jump, or random valid move.
      const moves = this.getAllValidMoves(state.board, 'Black', state.mustJumpPos);
      if (moves.length === 0) return null;

      // Force jump if available (already handled by getAllValidMoves filtering logic)
      
      // Simple heuristic for difficulty 5: 
      // Try to jump if available. Else prioritize kings, else prioritize safe moves...
      // Since getAllValidMoves already enforces the "must jump" rule natively, we just pick safely.
      
      // Let's just do a random element from the forced list to keep it simple and playable for Phase 4 scaffold.
      // Advanced heuristic integration can be refined later.
      return moves[Math.floor(Math.random() * moves.length)];
  }
}

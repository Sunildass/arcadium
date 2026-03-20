import { GameEngine, GameResult } from '../../../core/engine/GameEngine';

export type PieceType = 'p' | 'r' | 'n' | 'b' | 'q' | 'k';
export type PieceColor = 'w' | 'b';

export interface Piece {
  type: PieceType;
  color: PieceColor;
  hasMoved?: boolean; // important for castling & pawn double steps
}

export interface Position {
  r: number; // row 0-7 (0 is top/black side)
  c: number; // col 0-7
}

export interface Move {
  from: Position;
  to: Position;
  promotion?: PieceType; // Optional: if pawn promotes, what it becomes
}

export interface ChessState {
  board: (Piece | null)[][];
  turn: PieceColor;
  isGameOver: boolean;
  winner: PieceColor | 'Draw' | null;
  score: number;
  // History for En Passant Check
  lastMove: Move | null;
  validMoves: Move[];
  inCheck: boolean;
}

export class ChessEngine implements GameEngine<ChessState, Move> {
  private startTimeMs: number = 0;
  private mode: '1P' | '2P';
  private difficulty: number;

  constructor(mode: '1P' | '2P', difficulty: number = 5) {
    this.mode = mode;
    this.difficulty = difficulty;
  }

  initialize(): ChessState {
    this.startTimeMs = Date.now();
    const board: (Piece | null)[][] = Array(8).fill(null).map(() => Array(8).fill(null));

    // Setup standard pieces
    const setupRow = (row: number, color: PieceColor) => {
        board[row][0] = { type: 'r', color };
        board[row][1] = { type: 'n', color };
        board[row][2] = { type: 'b', color };
        board[row][3] = { type: 'q', color };
        board[row][4] = { type: 'k', color };
        board[row][5] = { type: 'b', color };
        board[row][6] = { type: 'n', color };
        board[row][7] = { type: 'r', color };
    };

    setupRow(0, 'b'); // Black back rank
    for (let c = 0; c < 8; c++) board[1][c] = { type: 'p', color: 'b' };

    setupRow(7, 'w'); // White back rank
    for (let c = 0; c < 8; c++) board[6][c] = { type: 'p', color: 'w' };

    const state: ChessState = {
      board,
      turn: 'w',
      isGameOver: false,
      winner: null,
      score: 0,
      lastMove: null,
      validMoves: [],
      inCheck: false
    };

    state.validMoves = this.getAllValidMoves(state);
    return state;
  }

  private deepCloneBoard(board: (Piece | null)[][]): (Piece | null)[][] {
      return board.map(row => row.map(p => p ? { ...p } : null));
  }

  // Pure logic, does not modify `state` permanently, just simulates a board
  private getPseudoLegalMoves(board: (Piece | null)[][], r: number, c: number, lastMove: Move | null, skipCastling: boolean = false): Move[] {
      const piece = board[r][c];
      if (!piece) return [];
      
      const moves: Move[] = [];
      const isWhite = piece.color === 'w';
      const dir = isWhite ? -1 : 1;

      // Helper to try adding a move if it's strictly on board and handles takes/blocks
      const tryAdd = (tr: number, tc: number, isCaptureOnly = false, isMoveOnly = false) => {
          if (tr < 0 || tr > 7 || tc < 0 || tc > 7) return false; // Off board
          const target = board[tr][tc];
          
          if (!target) {
              if (!isCaptureOnly) moves.push({ from: { r, c }, to: { r: tr, c: tc }});
              return true; // Keep sliding
          } else {
              if (!isMoveOnly && target.color !== piece.color) {
                  moves.push({ from: { r, c }, to: { r: tr, c: tc }});
              }
              return false; // Stop sliding
          }
      };

      if (piece.type === 'p') {
          // Forward 1
          if (tryAdd(r + dir, c, false, true)) {
              // Forward 2 if haven't moved yet and path is clear
              if ((isWhite && r === 6) || (!isWhite && r === 1)) {
                  tryAdd(r + dir * 2, c, false, true);
              }
          }
          // Captures
          tryAdd(r + dir, c - 1, true, false);
          tryAdd(r + dir, c + 1, true, false);

          // En Passant
          if (lastMove) {
               const lastPiece = board[lastMove.to.r][lastMove.to.c];
               if (lastPiece && lastPiece.type === 'p' && 
                   Math.abs(lastMove.from.r - lastMove.to.r) === 2 && 
                   lastMove.to.r === r && 
                   Math.abs(lastMove.to.c - c) === 1) {
                   moves.push({ from: { r, c }, to: { r: r + dir, c: lastMove.to.c }});
               }
          }
      } 
      else if (piece.type === 'n') {
          const jumps = [
             [-2,-1], [-2,1], [-1,-2], [-1,2],
             [1,-2], [1,2], [2,-1], [2,1]
          ];
          for (let m of jumps) tryAdd(r + m[0], c + m[1]);
      }
      else if (piece.type === 'b' || piece.type === 'r' || piece.type === 'q') {
          const dirs: [number, number][] = [];
          if (piece.type === 'b' || piece.type === 'q') dirs.push([-1,-1], [-1,1], [1,-1], [1,1]);
          if (piece.type === 'r' || piece.type === 'q') dirs.push([-1,0], [1,0], [0,-1], [0,1]);
          
          for (const d of dirs) {
              let tr = r + d[0];
              let tc = c + d[1];
              while (tryAdd(tr, tc)) {
                  tr += d[0];
                  tc += d[1];
              }
          }
      }
      else if (piece.type === 'k') {
          const adjs = [
             [-1,-1], [-1,0], [-1,1],
             [0,-1],          [0,1],
             [1,-1],  [1,0],  [1,1]
          ];
          for (let a of adjs) tryAdd(r + a[0], c + a[1]);

          // Castling
          if (!skipCastling && !piece.hasMoved && !this.isSquareAttacked(board, r, c, piece.color === 'w' ? 'b' : 'w')) {
              // Kingside 
              if (this.canCastle(board, r, c, 7)) {
                   moves.push({ from: { r, c }, to: { r, c: c + 2 }});
              }
              // Queenside
              if (this.canCastle(board, r, c, 0)) {
                   moves.push({ from: { r, c }, to: { r, c: c - 2 }});
              }
          }
      }

      // Add promotions to pawn moves hitting back rank
      const finalMoves: Move[] = [];
      for (const m of moves) {
          if (piece.type === 'p' && (m.to.r === 0 || m.to.r === 7)) {
              finalMoves.push({ ...m, promotion: 'q' }); // Default Q, UI can specify
              finalMoves.push({ ...m, promotion: 'r' });
              finalMoves.push({ ...m, promotion: 'b' });
              finalMoves.push({ ...m, promotion: 'n' });
          } else {
              finalMoves.push(m);
          }
      }

      return finalMoves;
  }

  private canCastle(board: (Piece | null)[][], kr: number, kc: number, rc: number): boolean {
      const rook = board[kr][rc];
      if (!rook || rook.type !== 'r' || rook.hasMoved) return false;
      
      const step = rc > kc ? 1 : -1;
      const opponentColor = board[kr][kc]!.color === 'w' ? 'b' : 'w';

      for (let c = kc + step; c !== rc; c += step) {
          if (board[kr][c] !== null) return false; // Path blocked
          if (Math.abs(kc - c) <= 2 && this.isSquareAttacked(board, kr, c, opponentColor)) {
              return false; // Can't castle through/into check
          }
      }
      return true;
  }

  // Is square Attacked BY opponentColor
  private isSquareAttacked(board: (Piece | null)[][], targetR: number, targetC: number, opponentColor: PieceColor): boolean {
      for (let r = 0; r < 8; r++) {
          for (let c = 0; c < 8; c++) {
               const p = board[r][c];
               if (p && p.color === opponentColor) {
                   // Optimization: skip pseudo-eval if it's a pawn and trivially missed to avoid loop nesting
                   if (p.type === 'p') {
                       const dir = opponentColor === 'w' ? -1 : 1;
                       if (targetR === r + dir && (targetC === c - 1 || targetC === c + 1)) return true;
                   } else {
                       // We can't pass lastMove for EnPassant here easily without state, but en passant 
                       // never directly attacks a square, it only captures pawns. So passing null is fine.
                       // skipCastling=true prevents infinite recursion (isSquareAttacked -> pseudoLegal(King) -> isSquareAttacked)
                       const moves = this.getPseudoLegalMoves(board, r, c, null, true); 
                       if (moves.some(m => m.to.r === targetR && m.to.c === targetC)) {
                           return true;
                       }
                   }
               }
          }
      }
      return false;
  }

  private applyMoveMutating(board: (Piece | null)[][], move: Move): void {
      const piece = board[move.from.r][move.from.c]!;
      board[move.to.r][move.to.c] = piece;
      board[move.from.r][move.from.c] = null;
      
      piece.hasMoved = true;

      // Handle Castling Rook move implicitly
      if (piece.type === 'k' && Math.abs(move.from.c - move.to.c) === 2) {
          const isKingside = move.to.c > move.from.c;
          if (isKingside) {
              board[move.to.r][move.to.c - 1] = board[move.to.r][7]!;
              board[move.to.r][7] = null;
          } else {
              board[move.to.r][move.to.c + 1] = board[move.to.r][0]!;
              board[move.to.r][0] = null;
          }
      }

      // Handle En Passant capture implicitly
      if (piece.type === 'p' && move.from.c !== move.to.c && board[move.to.r][move.to.c] === piece) { 
          // If pawn moved diagonally into empty space, an EP occurred during evaluation
          // (Because we moved the piece to 'to' in line 166, the 'to' spot is now 'piece')
          // Oh wait, if it was empty initially... let's carefully check if we captured it.
          // Before line 166, `board[move.to.r][move.to.c]` was null if EP.
      }
      // Re-write to grab target state BEFORE moving piece for EP
  }

  // Safer non-mutating full apply (handles EP/Castling fully)
  private getNextStateContext(state: ChessState, move: Move): ChessState {
      const b = this.deepCloneBoard(state.board);
      const piece = b[move.from.r][move.from.c]!;
      let isCapture = b[move.to.r][move.to.c] !== null;

      // Handle En Passant Capture
      if (piece.type === 'p' && move.from.c !== move.to.c && b[move.to.r][move.to.c] === null) {
          b[move.from.r][move.to.c] = null; // Kill the pawn we jumped over
          isCapture = true;
      }

      // Execute Move
      b[move.to.r][move.to.c] = piece;
      b[move.from.r][move.from.c] = null;
      piece.hasMoved = true;

      if (move.promotion) {
          piece.type = move.promotion;
      }

      // Handle Castling
      if (piece.type === 'k' && Math.abs(move.from.c - move.to.c) === 2) {
          const isKingside = move.to.c > move.from.c;
          if (isKingside) {
              b[move.to.r][move.to.c - 1] = b[move.to.r][7]!;
              b[move.to.r][7] = null;
              b[move.to.r][move.to.c - 1]!.hasMoved = true;
          } else {
              b[move.to.r][move.to.c + 1] = b[move.to.r][0]!;
              b[move.to.r][0] = null;
              b[move.to.r][move.to.c + 1]!.hasMoved = true;
          }
      }

      // It's the OTHER player's turn now.
      const newTurn = state.turn === 'w' ? 'b' : 'w';

      // Find King
      let kr = -1, kc = -1;
      for (let r=0; r<8; r++) for (let c=0; c<8; c++) {
          if (b[r][c]?.type === 'k' && b[r][c]?.color === newTurn) {
               kr = r; kc = c;
          }
      }
      const inCheck = this.isSquareAttacked(b, kr, kc, state.turn);

      return {
          ...state,
          board: b,
          turn: newTurn,
          lastMove: move,
          inCheck
      }
  }

  // Returns ONLY moves that don't leave your king in check
  public getAllValidMoves(state: ChessState): Move[] {
      const moves: Move[] = [];
      const board = state.board;

      for (let r = 0; r < 8; r++) {
          for (let c = 0; c < 8; c++) {
              const p = board[r][c];
              if (p && p.color === state.turn) {
                  const pseudo = this.getPseudoLegalMoves(board, r, c, state.lastMove);
                  for (const m of pseudo) {
                      // Simulate move
                      const nextCtx = this.getNextStateContext(state, m);
                      // the 'nextCtx' reflects the state AFTER the move.
                      // So we must check if the current player's King (state.turn) is attacked.
                      
                      let kr = -1, kc = -1;
                      for (let _r=0; _r<8; _r++) for (let _c=0; _c<8; _c++) {
                          if (nextCtx.board[_r][_c]?.type === 'k' && nextCtx.board[_r][_c]?.color === state.turn) {
                               kr = _r; kc = _c;
                          }
                      }
                      
                      let invalid = false;
                      if (kr !== -1) {
                         // Check if opponent attacks king
                         invalid = this.isSquareAttacked(nextCtx.board, kr, kc, nextCtx.turn);
                      }

                      if (!invalid) moves.push(m);
                  }
              }
          }
      }

      return moves;
  }

  update(state: ChessState, move: Move): ChessState {
    if (state.isGameOver) return state;

    // Execute Move
    const newState = this.getNextStateContext(state, move);

    // Compute Valid Next Moves
    newState.validMoves = this.getAllValidMoves(newState);

    // Terminal Condition Processing
    if (newState.validMoves.length === 0) {
        newState.isGameOver = true;
        if (newState.inCheck) {
            // Checkmate
            newState.winner = state.turn; // The player who just moved won
        } else {
            // Stalemate
            newState.winner = 'Draw';
        }
    }

    return newState;
  }

  evaluateWin(state: ChessState): GameResult | null {
      if (!state.isGameOver) return null;
      return {
          winner: state.winner === 'Draw' ? null : state.winner === 'w' ? 'Player1' : (this.mode === '1P' ? 'AI' : 'Player2'),
          score: 1000,
          difficulty: this.mode === '1P' ? 'Hard' as any : 'Easy' as any,
          playTimeMs: Date.now() - this.startTimeMs
      }
  }

  // AI Logic (Minimax with Alpha-Beta Pruning & Positional Eval)
  public computeAIMove(state: ChessState): Move | null {
      if (state.validMoves.length === 0) return null;

      // Depth based on difficulty: Easy=1, Medium=2, Hard=3
      const depth = this.difficulty <= 3 ? 1 : this.difficulty <= 7 ? 2 : 3;
      
      // Positional bonus tables (Black's perspective)
      // Encourages center control and development
      const pawnTable = [
          [ 0,  0,  0,  0,  0,  0,  0,  0],
          [ 5, 10, 10,-20,-20, 10, 10,  5],
          [ 5, -5,-10,  0,  0,-10, -5,  5],
          [ 0,  0,  0, 20, 20,  0,  0,  0],
          [ 5,  5, 10, 25, 25, 10,  5,  5],
          [10, 10, 20, 30, 30, 20, 10, 10],
          [50, 50, 50, 50, 50, 50, 50, 50],
          [ 0,  0,  0,  0,  0,  0,  0,  0]
      ];
      
      const knightTable = [
          [-50,-40,-30,-30,-30,-30,-40,-50],
          [-40,-20,  0,  5,  5,  0,-20,-40],
          [-30,  5, 10, 15, 15, 10,  5,-30],
          [-30,  0, 15, 20, 20, 15,  0,-30],
          [-30,  5, 15, 20, 20, 15,  5,-30],
          [-30,  0, 10, 15, 15, 10,  0,-30],
          [-40,-20,  0,  0,  0,  0,-20,-40],
          [-50,-40,-30,-30,-30,-30,-40,-50]
      ];

      // Standard material values
      const pieceValues: Record<PieceType, number> = {
          'p': 100, 'n': 320, 'b': 330, 'r': 500, 'q': 900, 'k': 20000
      };

      const evaluateBoard = (b: (Piece | null)[][]): number => {
          let score = 0;
          for(let r=0; r<8; r++) {
              for(let c=0; c<8; c++) {
                  const p = b[r][c];
                  if(p) {
                      let val = pieceValues[p.type];
                      // Add positional bonus for Black (AI usually plays Black in 1P)
                      if (p.color === 'b') {
                          if (p.type === 'p') val += pawnTable[r][c];
                          if (p.type === 'n') val += knightTable[r][c];
                          // Encourage castling/king safety for Black
                          if (p.type === 'k' && r === 0 && (c === 1 || c === 2 || c === 6)) val += 30;
                      } else {
                          // Mirror tables for White
                          if (p.type === 'p') val += pawnTable[7-r][c];
                          if (p.type === 'n') val += knightTable[7-r][c];
                          if (p.type === 'k' && r === 7 && (c === 1 || c === 2 || c === 6)) val += 30;
                      }
                      score += p.color === 'b' ? val : -val; // AI is Black maximizing
                  }
              }
          }
          return score;
      };

      const minimax = (s: ChessState, d: number, alpha: number, beta: number, isMaximizing: boolean): number => {
          if (d === 0 || s.isGameOver) {
              if (s.isGameOver && s.winner === 'b') return 99999;
              if (s.isGameOver && s.winner === 'w') return -99999;
              return evaluateBoard(s.board);
          }

          if (isMaximizing) {
              let maxEval = -Infinity;
              // Sort moves to improve alpha-beta pruning (captures first)
              const moves = [...s.validMoves].sort((a,b) => (s.board[b.to.r][b.to.c] ? 1 : 0) - (s.board[a.to.r][a.to.c] ? 1 : 0));
              for (const m of moves) {
                  const nextState = this.update(s, m); // Using full update to get validMoves generated correctly
                  const ev = minimax(nextState, d - 1, alpha, beta, false);
                  maxEval = Math.max(maxEval, ev);
                  alpha = Math.max(alpha, ev);
                  if (beta <= alpha) break;
              }
              return maxEval;
          } else {
              let minEval = Infinity;
              const moves = [...s.validMoves].sort((a,b) => (s.board[b.to.r][b.to.c] ? 1 : 0) - (s.board[a.to.r][a.to.c] ? 1 : 0));
              for (const m of moves) {
                  const nextState = this.update(s, m);
                  const ev = minimax(nextState, d - 1, alpha, beta, true);
                  minEval = Math.min(minEval, ev);
                  beta = Math.min(beta, ev);
                  if (beta <= alpha) break;
              }
              return minEval;
          }
      };

      let bestMoves: Move[] = [];
      let bestScore = -Infinity;

      for (const m of state.validMoves) {
          const nextState = this.update(state, m);
          const score = minimax(nextState, depth - 1, -Infinity, Infinity, false);
          
          if (score > bestScore) {
              bestScore = score;
              bestMoves = [m];
          } else if (score === bestScore) {
              bestMoves.push(m);
          }
      }

      // Pick randomly from equally good moves to add variety
      return bestMoves[Math.floor(Math.random() * bestMoves.length)];
  }
}

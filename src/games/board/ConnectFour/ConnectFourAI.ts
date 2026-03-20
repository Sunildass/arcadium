import { StrategyEngine } from '../../../core/ai/StrategyEngine';
import type { GameEngine } from '../../../core/engine/GameEngine';
import { evaluateConnectFourWin, getValidCols, applyMove, ROWS, COLS } from './types';
import type { ConnectFourState, Player, BoardState } from './types';

export class ConnectFourAI extends StrategyEngine<ConnectFourState, number> {
  private aiPlayer: Player;
  private humanPlayer: Player;

  constructor(gameId: string, aiPlayer: Player = 'Yellow', initialDifficulty: number = 5) {
    super(gameId, initialDifficulty);
    this.aiPlayer = aiPlayer;
    this.humanPlayer = aiPlayer === 'Yellow' ? 'Red' : 'Yellow';
  }

  determineMove(state: ConnectFourState): number {
    const validMoves = getValidCols(state.board);
    if (validMoves.length === 0) return -1;

    const currentDifficulty = this.getCurrentDifficultyScore();

    // 1-3 = Random / Easy
    if (currentDifficulty <= 3) {
      return validMoves[Math.floor(Math.random() * validMoves.length)];
    }

    // Moderate difficulty introduces some randomness
    if (currentDifficulty > 3 && currentDifficulty < 7) {
      if (Math.random() > 0.6) {
        return validMoves[Math.floor(Math.random() * validMoves.length)];
      }
    }

    // Depth scales with difficulty: max depth 6 to ensure performance.
    // difficulty 10 -> depth 6
    // difficulty 7 -> depth 4
    const depth = Math.max(3, Math.min(6, Math.floor((currentDifficulty / 10) * 6)));
    
    let bestScore = -Infinity;
    // Introduce slight randomness to identical scores by shuffling valid moves
    const shuffledMoves = [...validMoves].sort(() => Math.random() - 0.5);
    let bestMove = shuffledMoves[0];

    for (const col of shuffledMoves) {
      const { newBoard } = applyMove(state.board, col, this.aiPlayer);
      const score = this.minimax(newBoard, depth - 1, -Infinity, Infinity, false);
      if (score > bestScore) {
        bestScore = score;
        bestMove = col;
      }
    }

    return bestMove;
  }

  private evaluateBoard(board: BoardState): number {
    let score = 0;
    
    // Evaluate center column preference
    const centerArray = [];
    for (let r = 0; r < ROWS; r++) {
      centerArray.push(board[r][Math.floor(COLS/2)]);
    }
    const centerCount = centerArray.filter(i => i === this.aiPlayer).length;
    score += centerCount * 3;

    // Evaluate horizontal
    for (let r = 0; r < ROWS; r++) {
      for (let c = 0; c < COLS - 3; c++) {
        const window = [board[r][c], board[r][c+1], board[r][c+2], board[r][c+3]];
        score += this.evaluateWindow(window);
      }
    }

    // Evaluate vertical
    for (let c = 0; c < COLS; c++) {
      for (let r = 0; r < ROWS - 3; r++) {
         const window = [board[r][c], board[r+1][c], board[r+2][c], board[r+3][c]];
         score += this.evaluateWindow(window);
      }
    }

    // Evaluate diagonal down-right
    for (let r = 0; r < ROWS - 3; r++) {
      for (let c = 0; c < COLS - 3; c++) {
        const window = [board[r][c], board[r+1][c+1], board[r+2][c+2], board[r+3][c+3]];
        score += this.evaluateWindow(window);
      }
    }

    // Evaluate diagonal up-right
     for (let r = 3; r < ROWS; r++) {
      for (let c = 0; c < COLS - 3; c++) {
        const window = [board[r][c], board[r-1][c+1], board[r-2][c+2], board[r-3][c+3]];
        score += this.evaluateWindow(window);
      }
    }

    return score;
  }

  private evaluateWindow(window: (Player | null)[]): number {
    let score = 0;
    const aiCount = window.filter(i => i === this.aiPlayer).length;
    const humanCount = window.filter(i => i === this.humanPlayer).length;
    const emptyCount = window.filter(i => i === null).length;

    if (aiCount === 4) {
      score += 1000;
    } else if (aiCount === 3 && emptyCount === 1) {
      score += 50;
    } else if (aiCount === 2 && emptyCount === 2) {
      score += 10;
    }

    if (humanCount === 3 && emptyCount === 1) {
      score -= 80;
    }
    return score;
  }

  private minimax(board: BoardState, depth: number, alpha: number, beta: number, isMaximizing: boolean): number {
    const { winner } = evaluateConnectFourWin(board);
    
    if (winner === this.aiPlayer) return 100000 + depth;
    if (winner === this.humanPlayer) return -100000 - depth;
    if (winner === 'Draw') return 0;
    
    if (depth === 0) {
      return this.evaluateBoard(board);
    }

    const validMoves = getValidCols(board);
    if (validMoves.length === 0) return 0;

    if (isMaximizing) {
      let maxEval = -Infinity;
      for (const col of validMoves) {
        const { newBoard } = applyMove(board, col, this.aiPlayer);
        const evalScore = this.minimax(newBoard, depth - 1, alpha, beta, false);
        maxEval = Math.max(maxEval, evalScore);
        alpha = Math.max(alpha, evalScore);
        if (beta <= alpha) break; // Pruning
      }
      return maxEval;
    } else {
      let minEval = Infinity;
      for (const col of validMoves) {
        const { newBoard } = applyMove(board, col, this.humanPlayer);
        const evalScore = this.minimax(newBoard, depth - 1, alpha, beta, true);
        minEval = Math.min(minEval, evalScore);
        beta = Math.min(beta, evalScore);
        if (beta <= alpha) break; // Pruning
      }
      return minEval;
    }
  }
}

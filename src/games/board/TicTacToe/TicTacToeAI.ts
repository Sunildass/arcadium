import { StrategyEngine } from '../../../core/ai/StrategyEngine';
import type { GameEngine, GameResult } from '../../../core/engine/GameEngine';
import { evaluateTicTacToeWin } from './types';
import type { TicTacToeState, Player, BoardState } from './types';

export class TicTacToeAI extends StrategyEngine<TicTacToeState, number> {
  private aiPlayer: Player;
  private humanPlayer: Player;

  constructor(gameId: string, aiPlayer: Player = 'O', initialDifficulty: number = 5) {
    super(gameId, initialDifficulty);
    this.aiPlayer = aiPlayer;
    this.humanPlayer = aiPlayer === 'O' ? 'X' : 'O';
  }

  determineMove(state: TicTacToeState): number {
    const availableMoves = this.getAvailableMoves(state.board);
    if (availableMoves.length === 0) return -1;
    
    // Difficulty ranges from 1 to 10.
    // 1-3 = Random / Easy
    // 4-6 = Mix of Random and Block/Win
    // 7-10 = Minimax (varying depths or full depth)
    const currentDifficulty = this.getCurrentDifficultyScore();

    // Randomize slight mistakes on lower difficulty
    if (currentDifficulty <= 3) {
      return availableMoves[Math.floor(Math.random() * availableMoves.length)];
    }

    if (currentDifficulty > 3 && currentDifficulty < 7) {
      // 50% chance to play perfectly, 50% chance to play random
      if (Math.random() > 0.5) {
        return availableMoves[Math.floor(Math.random() * availableMoves.length)];
      }
    }

    // High difficulty: Use Minimax
    let bestScore = -Infinity;
    let move = availableMoves[0];

    for (const m of availableMoves) {
      const newBoard = [...state.board];
      newBoard[m] = this.aiPlayer;
      // Adjust minimax depth based on difficulty to simulate 'thinking ahead' limits
      const maxDepth = currentDifficulty === 10 ? 9 : Math.floor(currentDifficulty); 
      const score = this.minimax(newBoard, 0, false, maxDepth);
      if (score > bestScore) {
        bestScore = score;
        move = m;
      }
    }

    return move;
  }

  private minimax(board: BoardState, depth: number, isMaximizing: boolean, maxDepth: number): number {
    const { winner } = evaluateTicTacToeWin(board);
    if (winner === this.aiPlayer) return 10 - depth;
    if (winner === this.humanPlayer) return depth - 10;
    if (winner === 'Draw') return 0;
    if (depth >= maxDepth) return 0; // heuristic evaluation if depth limited (0 for draw-like state)

    const availableMoves = this.getAvailableMoves(board);
    if (availableMoves.length === 0) return 0;

    if (isMaximizing) {
      let bestScore = -Infinity;
      for (const move of availableMoves) {
        const newBoard = [...board];
        newBoard[move] = this.aiPlayer;
        const score = this.minimax(newBoard, depth + 1, false, maxDepth);
        bestScore = Math.max(score, bestScore);
      }
      return bestScore;
    } else {
      let bestScore = Infinity;
      for (const move of availableMoves) {
        const newBoard = [...board];
        newBoard[move] = this.humanPlayer;
        const score = this.minimax(newBoard, depth + 1, true, maxDepth);
        bestScore = Math.min(score, bestScore);
      }
      return bestScore;
    }
  }

  private getAvailableMoves(board: BoardState): number[] {
    return board.map((val, idx) => val === null ? idx : -1).filter((idx) => idx !== -1);
  }
}

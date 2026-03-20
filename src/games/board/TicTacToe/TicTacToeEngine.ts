import type { GameEngine, GameResult } from '../../../core/engine/GameEngine';
import { evaluateTicTacToeWin, initialTicTacToeState } from './types';
import type { TicTacToeState } from './types';

export class TicTacToeEngine implements GameEngine<TicTacToeState, number> {
  private startTimeMs: number = 0;
  private p1PlayerType: '1P' | '2P';

  constructor(mode: '1P' | '2P') {
    this.p1PlayerType = mode;
  }

  initialize(): TicTacToeState {
    this.startTimeMs = Date.now();
    return { ...initialTicTacToeState };
  }

  update(state: TicTacToeState, index: number): TicTacToeState {
    if (state.board[index] || state.isGameOver) {
      return state; // Invalid move
    }

    const newBoard = [...state.board];
    newBoard[index] = state.currentPlayer;

    const { winner, line } = evaluateTicTacToeWin(newBoard);
    
    return {
      board: newBoard,
      currentPlayer: state.currentPlayer === 'X' ? 'O' : 'X',
      isGameOver: winner !== null,
      winner,
      winningLine: line,
    };
  }

  evaluateWin(state: TicTacToeState): GameResult | null {
    if (!state.isGameOver) return null;

    return {
      winner: state.winner === 'X' ? 'Player1' : state.winner === 'O' ? (this.p1PlayerType === '1P' ? 'AI' : 'Player2') : 'Draw',
      score: state.winner === 'X' ? 100 : state.winner === 'O' ? -100 : 50,
      playTimeMs: Date.now() - this.startTimeMs,
      difficulty: 'Adaptive', // Default interface placeholder. AI engine handles real number mapping.
    };
  }
}

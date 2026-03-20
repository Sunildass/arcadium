import { GameEngine, GameResult } from '../../../core/engine/GameEngine';
import { ConnectFourState, applyMove, evaluateConnectFourWin, initialConnectFourState } from './types';

export class ConnectFourEngine implements GameEngine<ConnectFourState, number> {
  private startTimeMs: number = 0;
  private p1PlayerType: '1P' | '2P';

  constructor(mode: '1P' | '2P') {
    this.p1PlayerType = mode;
  }

  initialize(): ConnectFourState {
    this.startTimeMs = Date.now();
    return { ...initialConnectFourState };
  }

  update(state: ConnectFourState, col: number): ConnectFourState {
    if (state.isGameOver) return state;

    const { newBoard, row } = applyMove(state.board, col, state.currentPlayer);
    if (row === -1) return state; // Column was full

    const { winner, cells } = evaluateConnectFourWin(newBoard);

    return {
      board: newBoard,
      currentPlayer: state.currentPlayer === 'Red' ? 'Yellow' : 'Red',
      isGameOver: winner !== null,
      winner: winner,
      winningCells: cells,
    };
  }

  evaluateWin(state: ConnectFourState): GameResult | null {
    if (!state.isGameOver) return null;

    return {
      winner: state.winner === 'Red' ? 'Player1' : state.winner === 'Yellow' ? (this.p1PlayerType === '1P' ? 'AI' : 'Player2') : 'Draw',
      score: state.winner === 'Red' ? 150 : state.winner === 'Yellow' ? -150 : 50,
      playTimeMs: Date.now() - this.startTimeMs,
      difficulty: 'Adaptive',
    };
  }
}

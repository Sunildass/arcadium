import { DifficultyManager } from './DifficultyManager';
import { GameEngine, GameResult } from '../engine/GameEngine';

/**
 * Base abstract class for any AI opponent in games.
 * Subclasses will implement `determineMove`.
 */
export abstract class StrategyEngine<GameState, MoveType> {
  protected difficultyManager: DifficultyManager;
  protected gameId: string;

  constructor(gameId: string, initialDifficulty: number = 5) {
    this.gameId = gameId;
    this.difficultyManager = new DifficultyManager(gameId, initialDifficulty);
  }

  /**
   * Evaluate state and determine the best move depending on current difficulty.
   */
  abstract determineMove(state: GameState, engine: GameEngine<GameState, MoveType>): MoveType;

  /**
   * After the game, the game loop should call this to record how well the player did vs AI.
   */
  public reportGameEnd(playerWon: boolean, reactionTimeMs: number, mistakes: number, totalMoves: number) {
    this.difficultyManager.recordGame(playerWon, reactionTimeMs, mistakes, totalMoves);
  }

  /**
   * Get the current adaptive difficulty score (1-10)
   */
  public getCurrentDifficultyScore(): number {
    return this.difficultyManager.getCurrentDifficulty();
  }
}

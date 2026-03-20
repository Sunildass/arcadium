import { AdaptiveSessionMetrics, AdaptiveModifier } from './AdaptiveModifier';

/**
 * DifficultyManager manages base difficulty and current adaptive metrics
 */
export class DifficultyManager {
  private baseDifficulty: number;
  private currentMetrics: AdaptiveSessionMetrics;

  constructor(gameId: string, initialBaseDifficulty: number = 5) {
    this.baseDifficulty = initialBaseDifficulty;
    this.currentMetrics = {
      gameId,
      gamesPlayedThisSession: 0,
      winRate: 0.5, // Start neutral
      averageReactionTimeMs: 2000, // Safe default
      mistakeRate: 0.1, // Safe default
      currentBaseDifficulty: this.baseDifficulty
    };
  }

  getCurrentDifficulty(): number {
    return AdaptiveModifier.calculateNewDifficulty(this.currentMetrics);
  }

  recordGame(won: boolean, reactionTimeMs: number, mistakeCount: number, totalMoves: number) {
    this.currentMetrics.gamesPlayedThisSession++;
    
    // Update win rate (moving average for session)
    const prevWins = this.currentMetrics.winRate * (this.currentMetrics.gamesPlayedThisSession - 1);
    this.currentMetrics.winRate = (prevWins + (won ? 1 : 0)) / this.currentMetrics.gamesPlayedThisSession;

    // Update reaction time
    this.currentMetrics.averageReactionTimeMs = 
      ((this.currentMetrics.averageReactionTimeMs * 4) + reactionTimeMs) / 5;

    // Update mistake rate
    const currentGameMistakeRate = totalMoves > 0 ? mistakeCount / totalMoves : 0;
    this.currentMetrics.mistakeRate = 
      ((this.currentMetrics.mistakeRate * 4) + currentGameMistakeRate) / 5;
  }
}

export interface AdaptiveSessionMetrics {
  gameId: string;
  gamesPlayedThisSession: number;
  winRate: number; // 0.0 to 1.0
  averageReactionTimeMs: number;
  mistakeRate: number; // 0.0 to 1.0 (invalid moves or missed opportunities)
  currentBaseDifficulty: number; // 1 to 10
}

export class AdaptiveModifier {
  /**
   * Calculates the updated difficulty score based on the formula:
   * difficultyScore = baseDifficulty + winRateModifier + reactionTimeModifier + mistakeRateModifier
   */
  static calculateNewDifficulty(metrics: AdaptiveSessionMetrics): number {
    const { currentBaseDifficulty, winRate, averageReactionTimeMs, mistakeRate } = metrics;
    
    // Win Rate Modifier:
    // If winning > 60%, increase difficulty (+1 to +3)
    // If winning < 40%, decrease difficulty (-1 to -3)
    let winRateModifier = 0;
    if (winRate > 0.6) winRateModifier = (winRate - 0.6) * 5; // max +2
    else if (winRate < 0.4) winRateModifier = (winRate - 0.4) * 5; // max -2
    
    // Reaction Time Modifier:
    // Faster reaction (< 1500ms) = slightly harder
    // Slower reaction (> 3000ms) = slightly easier
    let reactionTimeModifier = 0;
    if (averageReactionTimeMs < 1500 && averageReactionTimeMs > 0) {
      reactionTimeModifier = 0.5;
    } else if (averageReactionTimeMs > 3000) {
      reactionTimeModifier = -0.5;
    }

    // Mistake Rate Modifier:
    // High mistakes = easier
    // Low mistakes = harder
    let mistakeRateModifier = 0;
    if (mistakeRate > 0.3) mistakeRateModifier = -1;
    else if (mistakeRate < 0.05) mistakeRateModifier = 0.5;

    // Calculate final
    const newDifficulty = currentBaseDifficulty + winRateModifier + reactionTimeModifier + mistakeRateModifier;

    // Clamp between 1 (Minimum) and 10 (Maximum)
    return Math.max(1, Math.min(10, newDifficulty));
  }
}

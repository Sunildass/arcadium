import { StrategyEngine } from '../../../core/ai/StrategyEngine';
import type { GameEngine } from '../../../core/engine/GameEngine';
import { calculateHandValue } from './types';
import type { BlackjackState, BlackjackMove } from './types';

export class BlackjackDealerAI extends StrategyEngine<BlackjackState, BlackjackMove> {
  constructor(gameId: string, initialDifficulty: number = 5) {
    super(gameId, initialDifficulty);
  }

  determineMove(state: BlackjackState): BlackjackMove {
    // In Blackjack, dealer usually follows strict rules (Hit on soft 17 or stand on 17).
    // To make it "adaptive", we can adjust the dealer's threshold based on difficulty,
    // though this bends traditional casino rules slightly for the sake of the prompt's requirements.

    const dealerVal = calculateHandValue(state.dealerHand);
    const difficulty = this.getCurrentDifficultyScore();

    // Difficulty 1-3: Easy. Dealer stands on 15, 16, 17 (More likely to tie or lose).
    // Difficulty 4-7: Normal. Dealer hits to 17 (Standard Casino).
    // Difficulty 8-10: Hard. Dealer peaks at player hand (Cheating AI) or hits aggressively if losing.

    if (difficulty >= 8) {
      const playerVal = calculateHandValue(state.playerHand);
      if (dealerVal < playerVal && playerVal <= 21 && dealerVal < 21) {
         // Aggressive hit if losing to player
         return 'hit';
      }
      return dealerVal >= 17 ? 'stand' : 'hit';
    }

    if (difficulty <= 3) {
      return dealerVal >= 15 ? 'stand' : 'hit';
    }

    // Standard Casino rules (Hit until 17)
    return dealerVal >= 17 ? 'stand' : 'hit';
  }
}

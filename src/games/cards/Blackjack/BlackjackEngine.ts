import type { GameEngine, GameResult } from '../../../core/engine/GameEngine';
import { initialBlackjackState, createDeck, calculateHandValue } from './types';
import type { BlackjackState, BlackjackMove, Card } from './types';

export class BlackjackEngine implements GameEngine<BlackjackState, BlackjackMove> {
  private startTimeMs: number = 0;
  private p1PlayerType: '1P' | '2P';

  constructor(mode: '1P' | '2P') {
    this.p1PlayerType = mode;
  }

  initialize(): BlackjackState {
    this.startTimeMs = Date.now();
    return { ...initialBlackjackState, deck: createDeck() };
  }

  update(state: BlackjackState, move: BlackjackMove): BlackjackState {
    if (state.gameState === 'gameOver' && move !== 'start') return state;

    const deck = [...state.deck];

    if (move === 'start') {
      if (deck.length < 10) return { ...state, deck: createDeck(), message: 'Shuffling...' }; // Reshuffle
      
      this.startTimeMs = Date.now();
      const playerHand = [deck.pop()!, deck.pop()!];
      const dealerHand = [deck.pop()!, { ...deck.pop()!, isHidden: true }];

      // Check immediate Blackjack
      const pVal = calculateHandValue(playerHand);
      const dValHidden = calculateHandValue([{ ...dealerHand[0] }, { ...dealerHand[1], isHidden: false }]);
      
      let nextState: 'playerTurn' | 'gameOver' = 'playerTurn';
      let winner: BlackjackState['winner'] = null;
      let msg = 'Hit or Stand?';

      if (pVal === 21 && dValHidden === 21) {
        nextState = 'gameOver'; winner = 'Push'; msg = 'Double Blackjack! Push.';
      } else if (pVal === 21) {
        nextState = 'gameOver'; winner = 'Player'; msg = 'Blackjack! You win!';
      } else if (dValHidden === 21) {
        nextState = 'gameOver'; winner = 'Dealer'; msg = 'Dealer Blackjack!';
      }

      return {
        deck, playerHand, dealerHand,
        gameState: nextState,
        winner,
        message: msg
      };
    }

    if (move === 'hit' && state.gameState === 'playerTurn') {
      const playerHand = [...state.playerHand, deck.pop()!];
      const pVal = calculateHandValue(playerHand);

      if (pVal > 21) {
        return {
          ...state, deck, playerHand,
          gameState: 'gameOver', winner: 'Dealer', message: 'Bust! You lose.'
        };
      }
      return { ...state, deck, playerHand, message: 'Hit or Stand?' };
    }

    if (move === 'stand' && state.gameState === 'playerTurn') {
      return { ...state, gameState: 'dealerTurn', message: 'Dealer Turn' };
    }

    return state;
  }

  // Engine doesn't handle Dealer AI directly here to keep AI layer separate.
  // The UI loop will call the DealerAI.

  evaluateWin(state: BlackjackState): GameResult | null {
    if (state.gameState !== 'gameOver') return null;

    return {
      winner: state.winner === 'Player' ? 'Player1' : state.winner === 'Dealer' ? 'AI' : 'Draw',
      score: state.winner === 'Player' ? 100 : state.winner === 'Dealer' ? -100 : 0,
      playTimeMs: Date.now() - this.startTimeMs,
      difficulty: 'Adaptive',
    };
  }
}

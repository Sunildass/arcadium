export type PlayerMode = '1P' | '2P';
export type GameDifficulty = 'Easy' | 'Medium' | 'Hard' | 'Adaptive';

export interface GameResult {
  winner: 'Player1' | 'Player2' | 'AI' | 'Draw' | null;
  score: number;
  playTimeMs: number;
  difficulty: GameDifficulty;
}

export interface GameEngine<GameState, MoveType> {
  // Initialize or reset the game
  initialize(): GameState;
  
  // Update state based on a player's or AI's move
  update(state: GameState, move: MoveType): GameState;
  
  // Evaluate if the current state results in a win/loss/draw
  evaluateWin(state: GameState): GameResult | null;
  
  // Optional: Get available moves for the current state (useful for AI/UI)
  getAvailableMoves?(state: GameState): MoveType[];
}

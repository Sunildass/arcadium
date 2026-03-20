import { LocalStorageHelper, PlayerStats } from '../storage/LocalStorageHelper';

export class PlayerProfileManager {
  private gameId: string;
  private currentStats: PlayerStats;

  constructor(gameId: string) {
    this.gameId = gameId;
    this.currentStats = LocalStorageHelper.getPlayerStats(gameId);
  }

  getStats(): PlayerStats {
    return this.currentStats;
  }

  recordGameResult(
    winStatus: 'win' | 'loss' | 'draw',
    playTimeMs: number,
    difficultyBeaten: string | null = null
  ) {
    this.currentStats.gamesPlayed += 1;
    
    // Update W/L/D
    if (winStatus === 'win') this.currentStats.wins += 1;
    else if (winStatus === 'loss') this.currentStats.losses += 1;
    else this.currentStats.draws += 1;

    // Default initialization safety
    if (typeof this.currentStats.totalPlaytimeMs !== 'number') {
       this.currentStats.totalPlaytimeMs = 0;
    }
    
    // Accumulate total playtime
    this.currentStats.totalPlaytimeMs += playTimeMs;

    // Moving average of play time (rough)
    if (this.currentStats.averagePlayTimeMs === 0) {
      this.currentStats.averagePlayTimeMs = playTimeMs;
    } else {
      this.currentStats.averagePlayTimeMs = 
        Math.floor((this.currentStats.averagePlayTimeMs * (this.currentStats.gamesPlayed - 1) + playTimeMs) / this.currentStats.gamesPlayed);
    }

    // Update fastest win if won
    if (winStatus === 'win') {
      if (this.currentStats.fastestWinMs === null || playTimeMs < this.currentStats.fastestWinMs) {
        this.currentStats.fastestWinMs = playTimeMs;
      }
      
      // Basic tracking of best difficulty (assuming Easy < Medium < Hard < Adaptive)
      // This is simplified but gives a baseline.
      if (difficultyBeaten) {
        this.currentStats.bestDifficultyBeaten = difficultyBeaten;
      }
    }

    // Persist
    LocalStorageHelper.savePlayerStats(this.gameId, this.currentStats);
  }
}

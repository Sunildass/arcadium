export interface PlayerStats {
  gamesPlayed: number;
  wins: number;
  losses: number;
  draws: number;
  averagePlayTimeMs: number;
  totalPlaytimeMs: number;
  fastestWinMs: number | null;
  bestDifficultyBeaten: string | null;
}

export interface HighScoreEntry {
  playerName: string;
  score: number;
  date: string;
  difficulty: string;
}

const STORAGE_PREFIX = 'game-platform';

export class LocalStorageHelper {
  static getHighScores(gameId: string): HighScoreEntry[] {
    try {
      const data = localStorage.getItem(`${STORAGE_PREFIX}/highscores/${gameId}`);
      return data ? JSON.parse(data) : [];
    } catch {
      return [];
    }
  }

  static saveHighScore(gameId: string, entry: HighScoreEntry): void {
    try {
      const scores = this.getHighScores(gameId);
      scores.push(entry);
      // Sort descending by score
      scores.sort((a, b) => b.score - a.score);
      // Keep top 10
      localStorage.setItem(`${STORAGE_PREFIX}/highscores/${gameId}`, JSON.stringify(scores.slice(0, 10)));
    } catch (e) {
      console.error('Failed to save high score', e);
    }
  }

  static getPlayerStats(gameId: string): PlayerStats {
    try {
      const data = localStorage.getItem(`${STORAGE_PREFIX}/player-stats/${gameId}`);
      if (data) {
        const parsed = JSON.parse(data);
        if (typeof parsed.totalPlaytimeMs !== 'number') {
            parsed.totalPlaytimeMs = parsed.averagePlayTimeMs * parsed.gamesPlayed || 0;
        }
        return parsed;
      }
    } catch {
      // ignore
    }

    return {
      gamesPlayed: 0,
      wins: 0,
      losses: 0,
      draws: 0,
      averagePlayTimeMs: 0,
      totalPlaytimeMs: 0,
      fastestWinMs: null,
      bestDifficultyBeaten: null
    };
  }

  static savePlayerStats(gameId: string, stats: PlayerStats): void {
    try {
      localStorage.setItem(`${STORAGE_PREFIX}/player-stats/${gameId}`, JSON.stringify(stats));
    } catch (e) {
      console.error('Failed to save stats', e);
    }
  }
}

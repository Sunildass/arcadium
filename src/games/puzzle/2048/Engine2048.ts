import type { GameEngine, GameResult } from '../../../core/engine/GameEngine';
import { addRandomTile, INITIAL_GRID, checkGameOver } from './types';
import type { State2048, Grid2048, Direction } from './types';

export class Engine2048 implements GameEngine<State2048, Direction> {
  private startTimeMs: number = 0;

  initialize(): State2048 {
    this.startTimeMs = Date.now();
    let grid = INITIAL_GRID.map(r => [...r]);
    grid = addRandomTile(grid);
    grid = addRandomTile(grid);

    return {
      grid,
      score: 0,
      isGameOver: false,
      hasWon: false,
      gameWonAcknowledged: false
    };
  }

  update(state: State2048, direction: Direction): State2048 {
    if (state.isGameOver) return state;

    const { grid, score: currentScore } = state;
    const newGrid: Grid2048 = INITIAL_GRID.map(r => [...r]);
    let scoreAdd = 0;
    let moved = false;
    let hasWon = state.hasWon;

    // A helper to slide and merge a single row/column
    const slideAndMerge = (line: (number | null)[]) => {
      // Remove nulls
      const filtered = line.filter(val => val !== null) as number[];
      const merged: (number | null)[] = [];
      let i = 0;
      while (i < filtered.length) {
        if (i < filtered.length - 1 && filtered[i] === filtered[i + 1]) {
          const sum = filtered[i] * 2;
          merged.push(sum);
          scoreAdd += sum;
          if (sum === 2048) hasWon = true;
          i += 2; // Skip merged
        } else {
          merged.push(filtered[i]);
          i++;
        }
      }
      // Pad with nulls
      while (merged.length < 4) merged.push(null);
      return merged;
    };

    if (direction === 'LEFT' || direction === 'RIGHT') {
      for (let r = 0; r < 4; r++) {
        let row = grid[r];
        if (direction === 'RIGHT') row = [...row].reverse();
        
        const newRow = slideAndMerge(row);
        if (direction === 'RIGHT') newRow.reverse();
        
        for (let c = 0; c < 4; c++) {
          newGrid[r][c] = newRow[c];
          if (newGrid[r][c] !== grid[r][c]) moved = true;
        }
      }
    } else { // UP or DOWN
      for (let c = 0; c < 4; c++) {
        const col = [grid[0][c], grid[1][c], grid[2][c], grid[3][c]];
        if (direction === 'DOWN') col.reverse();
        
        const newCol = slideAndMerge(col);
        if (direction === 'DOWN') newCol.reverse();
        
        for (let r = 0; r < 4; r++) {
          newGrid[r][c] = newCol[r];
          if (newGrid[r][c] !== grid[r][c]) moved = true;
        }
      }
    }

    if (!moved) return state; // Move didn't do anything

    const finalGrid = addRandomTile(newGrid);
    const isGameOver = checkGameOver(finalGrid);

    return {
      grid: finalGrid,
      score: currentScore + scoreAdd,
      isGameOver,
      hasWon,
      gameWonAcknowledged: state.gameWonAcknowledged
    };
  }

  evaluateWin(state: State2048): GameResult | null {
    if (!state.isGameOver && !state.hasWon) return null;

    return {
      winner: 'Player1',
      score: state.score,
      playTimeMs: Date.now() - this.startTimeMs,
      difficulty: 'Medium', // Standard difficulty for 2048
    };
  }
}

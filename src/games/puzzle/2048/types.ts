export type GridValue = number | null;
export type Grid2048 = GridValue[][];

export interface State2048 {
  grid: Grid2048;
  score: number;
  isGameOver: boolean;
  hasWon: boolean; // Reached 2048
  gameWonAcknowledged: boolean; // So user can keep playing after winning
}

export const INITIAL_GRID: Grid2048 = Array(4).fill(null).map(() => Array(4).fill(null));

// Direction vectors
export const DIRS = {
  UP: { r: -1, c: 0 },
  DOWN: { r: 1, c: 0 },
  LEFT: { r: 0, c: -1 },
  RIGHT: { r: 0, c: 1 },
};

export type Direction = keyof typeof DIRS;

export function addRandomTile(grid: Grid2048): Grid2048 {
  const emptyCells: { r: number, c: number }[] = [];
  for (let r = 0; r < 4; r++) {
    for (let c = 0; c < 4; c++) {
      if (grid[r][c] === null) {
        emptyCells.push({ r, c });
      }
    }
  }

  if (emptyCells.length === 0) return grid;

  const newGrid = grid.map(row => [...row]);
  const randomCell = emptyCells[Math.floor(Math.random() * emptyCells.length)];
  newGrid[randomCell.r][randomCell.c] = Math.random() < 0.9 ? 2 : 4;

  return newGrid;
}

export function checkGameOver(grid: Grid2048): boolean {
  for (let r = 0; r < 4; r++) {
    for (let c = 0; c < 4; c++) {
      if (grid[r][c] === null) return false;
      if (c < 3 && grid[r][c] === grid[r][c + 1]) return false;
      if (r < 3 && grid[r][c] === grid[r + 1][c]) return false;
    }
  }
  return true;
}

export type SudokuValue = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | null;
export type SudokuGrid = SudokuValue[][];

export interface SudokuCell {
  value: SudokuValue;
  isInitial: boolean;
  isError: boolean;
  notes: Set<number>;
}

export type SudokuBoardState = SudokuCell[][];

export interface SudokuState {
  board: SudokuBoardState;
  selectedCell: { r: number, c: number } | null;
  isGameOver: boolean;
  difficulty: 'Easy' | 'Medium' | 'Hard';
  mistakes: number;
  noteMode: boolean;
}

export const BLANK_GRID: SudokuValue[][] = Array(9).fill(null).map(() => Array(9).fill(null));

// Utility to check if a value can be placed at a specific row/col
export function isValidPlacement(grid: SudokuValue[][], row: number, col: number, value: SudokuValue): boolean {
  if (value === null) return true;

  // Check row
  for (let c = 0; c < 9; c++) {
    if (c !== col && grid[row][c] === value) return false;
  }

  // Check col
  for (let r = 0; r < 9; r++) {
    if (r !== row && grid[r][col] === value) return false;
  }

  // Check 3x3 box
  const boxRowStart = Math.floor(row / 3) * 3;
  const boxColStart = Math.floor(col / 3) * 3;
  for (let r = boxRowStart; r < boxRowStart + 3; r++) {
    for (let c = boxColStart; c < boxColStart + 3; c++) {
      if ((r !== row || c !== col) && grid[r][c] === value) return false;
    }
  }

  return true;
}

// Basic backtracking generator to create a full valid solved grid
export function generateSolvedGrid(): SudokuValue[][] {
  const grid: SudokuValue[][] = JSON.parse(JSON.stringify(BLANK_GRID));
  solve(grid);
  return grid;
}

function solve(grid: SudokuValue[][]): boolean {
  for (let r = 0; r < 9; r++) {
    for (let c = 0; c < 9; c++) {
      if (grid[r][c] === null) {
        // Shuffle 1-9 for variety
        const nums = [1, 2, 3, 4, 5, 6, 7, 8, 9].sort(() => Math.random() - 0.5) as SudokuValue[];
        for (const n of nums) {
          if (isValidPlacement(grid, r, c, n)) {
            grid[r][c] = n;
            if (solve(grid)) return true;
            grid[r][c] = null;
          }
        }
        return false;
      }
    }
  }
  return true;
}

export function generatePuzzle(difficultyLevel: 1 | 2 | 3): SudokuValue[][] {
  const solvedGrid = generateSolvedGrid();
  const puzzle = JSON.parse(JSON.stringify(solvedGrid));
  
  // Remove cells based on difficulty
  // 1: Easy (remove ~30)
  // 2: Medium (remove ~45)
  // 3: Hard (remove ~55)
  const cellsToRemove = difficultyLevel === 1 ? 30 : difficultyLevel === 2 ? 45 : 55;
  
  let removed = 0;
  while (removed < cellsToRemove) {
    const r = Math.floor(Math.random() * 9);
    const c = Math.floor(Math.random() * 9);
    if (puzzle[r][c] !== null) {
      puzzle[r][c] = null;
      removed++;
    }
  }

  return puzzle;
}

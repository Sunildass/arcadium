export type Player = 'Red' | 'Yellow';
export type CellValue = Player | null;
export type BoardState = CellValue[][]; // [row][col], top left is [0][0]

export const ROWS = 6;
export const COLS = 7;

export interface ConnectFourState {
  board: BoardState;
  currentPlayer: Player;
  isGameOver: boolean;
  winner: Player | 'Draw' | null;
  winningCells: { r: number; c: number }[] | null;
}

export const initialConnectFourState: ConnectFourState = {
  board: Array.from({ length: ROWS }, () => Array(COLS).fill(null)),
  currentPlayer: 'Red', // Red goes first
  isGameOver: false,
  winner: null,
  winningCells: null,
};

export function evaluateConnectFourWin(board: BoardState): { winner: Player | 'Draw' | null; cells: { r: number; c: number }[] | null } {
  // Horizontal
  for (let r = 0; r < ROWS; r++) {
    for (let c = 0; c < COLS - 3; c++) {
      if (board[r][c] && board[r][c] === board[r][c + 1] && board[r][c] === board[r][c + 2] && board[r][c] === board[r][c + 3]) {
        return { winner: board[r][c] as Player, cells: [{ r, c }, { r, c: c + 1 }, { r, c: c + 2 }, { r, c: c + 3 }] };
      }
    }
  }

  // Vertical
  for (let r = 0; r < ROWS - 3; r++) {
    for (let c = 0; c < COLS; c++) {
      if (board[r][c] && board[r][c] === board[r + 1][c] && board[r][c] === board[r + 2][c] && board[r][c] === board[r + 3][c]) {
        return { winner: board[r][c] as Player, cells: [{ r, c }, { r: r + 1, c }, { r: r + 2, c }, { r: r + 3, c }] };
      }
    }
  }

  // Diagonal Down-Right
  for (let r = 0; r < ROWS - 3; r++) {
    for (let c = 0; c < COLS - 3; c++) {
      if (board[r][c] && board[r][c] === board[r + 1][c + 1] && board[r][c] === board[r + 2][c + 2] && board[r][c] === board[r + 3][c + 3]) {
        return { winner: board[r][c] as Player, cells: [{ r, c }, { r: r + 1, c: c + 1 }, { r: r + 2, c: c + 2 }, { r: r + 3, c: c + 3 }] };
      }
    }
  }

  // Diagonal Up-Right
  for (let r = 3; r < ROWS; r++) {
    for (let c = 0; c < COLS - 3; c++) {
      if (board[r][c] && board[r][c] === board[r - 1][c + 1] && board[r][c] === board[r - 2][c + 2] && board[r][c] === board[r - 3][c + 3]) {
        return { winner: board[r][c] as Player, cells: [{ r, c }, { r: r - 1, c: c + 1 }, { r: r - 2, c: c + 2 }, { r: r - 3, c: c + 3 }] };
      }
    }
  }

  // Check for Draw
  const isDraw = board[0].every((cell) => cell !== null);
  if (isDraw) return { winner: 'Draw', cells: null };

  return { winner: null, cells: null };
}

// Utility to find valid moves
export function getValidCols(board: BoardState): number[] {
  const validCols = [];
  for (let c = 0; c < COLS; c++) {
    if (board[0][c] === null) {
      validCols.push(c);
    }
  }
  return validCols;
}

// Utility to apply move (returns new board)
export function applyMove(board: BoardState, col: number, player: Player): { newBoard: BoardState; row: number } {
  const newBoard = board.map((row) => [...row]);
  for (let r = ROWS - 1; r >= 0; r--) {
    if (newBoard[r][col] === null) {
      newBoard[r][col] = player;
      return { newBoard, row: r };
    }
  }
  return { newBoard, row: -1 }; // Should not happen if column was valid
}

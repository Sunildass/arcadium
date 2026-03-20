export type Player = 'X' | 'O';
export type CellValue = Player | null;
export type BoardState = CellValue[];

export interface TicTacToeState {
  board: BoardState;
  currentPlayer: Player;
  isGameOver: boolean;
  winner: Player | 'Draw' | null;
  winningLine: number[] | null;
}

export const initialTicTacToeState: TicTacToeState = {
  board: Array(9).fill(null),
  currentPlayer: 'X', // X always goes first
  isGameOver: false,
  winner: null,
  winningLine: null,
};

export const WINNING_COMBINATIONS = [
  [0, 1, 2], [3, 4, 5], [6, 7, 8], // Rows
  [0, 3, 6], [1, 4, 7], [2, 5, 8], // Cols
  [0, 4, 8], [2, 4, 6]             // Diagonals
];

export function evaluateTicTacToeWin(board: BoardState): { winner: Player | 'Draw' | null, line: number[] | null } {
  for (const [a, b, c] of WINNING_COMBINATIONS) {
    if (board[a] && board[a] === board[b] && board[a] === board[c]) {
      return { winner: board[a] as Player, line: [a, b, c] };
    }
  }
  if (!board.includes(null)) {
    return { winner: 'Draw', line: null };
  }
  return { winner: null, line: null };
}

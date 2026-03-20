export type CategoryInfo = {
  id: string;
  name: string;
  description: string;
  color: string;
};

export type GameTheme = {
  primaryColor: string;
  secondaryColor: string;
  accentColor: string;
  backgroundGradient: string;
};

export type GameCatalogItem = {
  id: string;
  title: string;
  categoryId: string;
  description: string;
  isImplemented: boolean;
  comingSoon?: boolean;
  theme: GameTheme;
  rules: string;
};

export const CATEGORIES: CategoryInfo[] = [
  { id: 'board', name: 'Board Games', description: 'Classic strategy and tactics.', color: 'from-blue-600 to-indigo-600' },
  { id: 'cards', name: 'Card Games', description: 'Luck, skill, and betting.', color: 'from-rose-600 to-pink-600' },
  { id: 'puzzle', name: 'Puzzle Games', description: 'Brain teasers and logic.', color: 'from-emerald-600 to-teal-600' },
  { id: 'arcade', name: 'Arcade Games', description: 'Fast-paced action and reflexes.', color: 'from-amber-500 to-orange-500' },
  { id: 'relax', name: 'Relaxation & Casual', description: 'Stress-free experiences.', color: 'from-purple-600 to-fuchsia-600' },
];

export const GAME_CATALOG: GameCatalogItem[] = [
  // Board
  { 
    id: 'tic-tac-toe', 
    title: 'Tic Tac Toe', 
    categoryId: 'board', 
    description: 'Classic X and O vs AI or Local.', 
    isImplemented: true,
    theme: {
        primaryColor: 'text-indigo-400',
        secondaryColor: 'text-indigo-200',
        accentColor: 'bg-indigo-600',
        backgroundGradient: 'from-indigo-950 to-zinc-950'
    },
    rules: "1. The game is played on a 3x3 grid.\n2. You are X, your friend (or the AI) is O. Players take turns putting their marks in empty squares.\n3. The first player to get 3 of their marks in a row (up, down, across, or diagonally) is the winner.\n4. When all 9 squares are full, the game is over. If no player has 3 marks in a row, the game ends in a tie."
  },
  { 
    id: 'connect-four', 
    title: 'Connect Four', 
    categoryId: 'board', 
    description: 'Drop discs to connect 4.', 
    isImplemented: true,
    theme: {
        primaryColor: 'text-blue-400',
        secondaryColor: 'text-blue-200',
        accentColor: 'bg-blue-600',
        backgroundGradient: 'from-blue-950 to-zinc-950'
    },
    rules: "1. The game is played on a 7x6 vertical grid.\n2. Players take turns dropping their colored discs from the top into a seven-column, six-row vertically suspended grid.\n3. The pieces fall straight down, occupying the lowest available space within the column.\n4. The objective of the game is to be the first to form a horizontal, vertical, or diagonal line of four of one's own discs."
  },
  { 
    id: 'checkers', 
    title: 'Checkers', 
    categoryId: 'board', 
    description: 'Jump over opponent pieces.', 
    isImplemented: true, 
    theme: { 
        primaryColor: 'text-red-400', 
        secondaryColor: 'text-zinc-400', 
        accentColor: 'bg-red-600', 
        backgroundGradient: 'from-orange-950 to-zinc-950'
    }, 
    rules: "1. Red moves first. Pieces only move diagonally forward on dark squares.\n2. To capture, jump over an opponent's piece into an empty square.\n3. If a jump is available, you MUST take it. If multiple jumps are available from the new position, you must continue jumping.\n4. Reach the far end to become a King. Kings can move and jump diagonally forwards and backwards." 
  },
  { 
    id: 'chess', 
    title: 'Chess', 
    categoryId: 'board', 
    description: 'The ultimate strategy game.', 
    isImplemented: true, 
    theme: { 
        primaryColor: 'text-zinc-200', 
        secondaryColor: 'text-zinc-500', 
        accentColor: 'bg-zinc-700', 
        backgroundGradient: 'from-zinc-900 to-black'
    }, 
    rules: "1. The goal is to checkmate the opponent's king.\n2. White always moves first.\n3. Pawns move forward one space, or two on their first move. They capture diagonally.\n4. Knights move in an 'L' shape and can jump over other pieces.\n5. Bishops move diagonally, Rooks horizontally/vertically, and Queens both.\n6. The King moves one space in any direction. Castling is permitted if neither King nor Rook has moved and the path is clear." 
  },
  { 
    id: 'reversi', 
    title: 'Reversi', 
    categoryId: 'board', 
    description: 'Flip discs to win.', 
    isImplemented: true, 
    theme: { 
        primaryColor: 'text-emerald-400', 
        secondaryColor: 'text-emerald-200', 
        accentColor: 'bg-emerald-600', 
        backgroundGradient: 'from-emerald-950 to-zinc-950'
    }, 
    rules: "1. Black dictates the first move.\n2. You must place your piece so that it flanks at least one opponent's piece between your new piece and another piece of your color.\n3. All flanked opponent's pieces are immediately flipped to your color.\n4. If a player has no valid flanking moves, their turn is skipped.\n5. The player with the most pieces of their color at the end wins." 
  },
  
  // Cards
  { 
    id: 'blackjack', 
    title: 'Blackjack', 
    categoryId: 'cards', 
    description: 'Beat the dealer to 21.', 
    isImplemented: true,
    theme: {
        primaryColor: 'text-emerald-400',
        secondaryColor: 'text-emerald-200',
        accentColor: 'bg-emerald-600',
        backgroundGradient: 'from-emerald-950 to-zinc-950'
    },
    rules: "1. The goal of blackjack is to beat the dealer's hand without going over 21.\n2. Face cards are worth 10. Aces are worth 1 or 11, whichever makes a better hand.\n3. Each player starts with two cards, one of the dealer's cards is hidden until the end.\n4. To 'Hit' is to ask for another card. To 'Stand' is to hold your total and end your turn.\n5. If you go over 21 you bust, and the dealer wins regardless of the dealer's hand."
  },
  { 
    id: 'poker', 
    title: 'Texas Hold\'em', 
    categoryId: 'cards', 
    description: 'Classic poker vs AI.', 
    isImplemented: true, 
    theme: { 
        primaryColor: 'text-emerald-500', 
        secondaryColor: 'text-emerald-300', 
        accentColor: 'bg-emerald-700', 
        backgroundGradient: 'from-emerald-950 to-zinc-950'
    }, 
    rules: "1. You are dealt 2 private hole cards.\n2. Five community cards are dealt face-up in stages (Flop, Turn, River).\n3. Make the best 5-card hand using any combination of your hole cards and community cards.\n4. Betting rounds occur before the flop and after each communal reveal.\n5. You can Fold, Check, Call, or Raise.\n6. Win by having the highest ranking hand at Showdown or forcing all opponents to fold!" 
  },
  { 
    id: 'uno', 
    title: 'Color Match', 
    categoryId: 'cards', 
    description: 'Match colors and numbers.', 
    isImplemented: true, 
    theme: { 
        primaryColor: 'text-red-500', 
        secondaryColor: 'text-yellow-400', 
        accentColor: 'bg-red-600', 
        backgroundGradient: 'from-red-950 to-black'
    }, 
    rules: "1. Match the top card on the discard pile by color or number.\n2. Action cards (Skip, Reverse, +2) change the flow of the game.\n3. Wild cards can be played on any color and allow you to choose the next color.\n4. You must say 'UNO' when you have one card left (Automated in this version!).\n5. First player to get rid of all their cards wins." 
  },
  { 
    id: 'solitaire', 
    title: 'Solitaire', 
    categoryId: 'cards', 
    description: 'Classic Klondike.', 
    isImplemented: true, 
    theme: { 
        primaryColor: 'text-green-400', 
        secondaryColor: 'text-green-200', 
        accentColor: 'bg-green-700', 
        backgroundGradient: 'from-green-950 to-zinc-950'
    }, 
    rules: "1. The goal is to move all cards to the four foundation piles, sorted by suit and rank (Ace to King).\n2. Tableau columns are built down in alternating colors.\n3. You can move a face-up card (or a valid stack) onto a single face-up card.\n4. Empty tableau columns can only be filled with Kings.\n5. Draw from the stock pile to the waste pile to access new cards." 
  },
  {
    id: 'war',
    title: 'War',
    categoryId: 'cards',
    description: 'Battle card by card.',
    isImplemented: true,
    theme: {
      primaryColor: 'text-yellow-400',
      secondaryColor: 'text-yellow-200',
      accentColor: 'bg-yellow-700',
      backgroundGradient: 'from-green-950 to-zinc-950'
    },
    rules: "1. The deck is split evenly between you and your opponent.\n2. Both players flip their top card simultaneously.\n3. The player with the higher card wins both cards.\n4. A tie means WAR — each player adds 3 face-down cards, then flips again.\n5. Win by collecting all 52 cards."
  },
  {
    id: 'high-low',
    title: 'High Low',
    categoryId: 'cards',
    description: 'Guess higher or lower.',
    isImplemented: true,
    theme: {
      primaryColor: 'text-indigo-400',
      secondaryColor: 'text-indigo-200',
      accentColor: 'bg-indigo-700',
      backgroundGradient: 'from-indigo-950 to-zinc-950'
    },
    rules: "1. A card is revealed from the deck.\n2. Guess whether the next card will be higher or lower.\n3. A correct guess earns points — streak multipliers reward consecutive correct guesses.\n4. A wrong guess costs a life. You have 3 lives.\n5. Complete the deck with the highest score possible."
  },
  {
    id: 'go-fish',
    title: 'Go Fish',
    categoryId: 'cards',
    description: 'Ask for matching cards.',
    isImplemented: true,
    theme: {
      primaryColor: 'text-teal-400',
      secondaryColor: 'text-teal-200',
      accentColor: 'bg-teal-700',
      backgroundGradient: 'from-teal-950 to-zinc-950'
    },
    rules: "1. Players start with 7 cards each.\n2. On your turn, ask the opponent for a specific rank you hold in your hand.\n3. If they have any, they give them all to you and you go again.\n4. If they don't, they say 'Go Fish!' — you draw from the deck and your turn ends.\n5. Collect all 4 cards of a rank to complete a 'book'. Most books at the end wins."
  },
  {
    id: 'crazy-eights',
    title: 'Crazy Eights',
    categoryId: 'cards',
    description: 'Match cards or play a wild 8.',
    isImplemented: true,
    theme: {
      primaryColor: 'text-purple-400',
      secondaryColor: 'text-purple-200',
      accentColor: 'bg-purple-700',
      backgroundGradient: 'from-purple-950 to-zinc-950'
    },
    rules: "1. Match the top discard card by suit or rank to play a card.\n2. An '8' is wild and can be played on any card — and lets you change the active suit.\n3. If you can't play, draw from the deck.\n4. First to empty their hand wins.\n5. The winner scores points equal to the card values left in the loser's hand."
  },
  
  // Puzzle

  { 
    id: 'sudoku', 
    title: 'Sudoku', 
    categoryId: 'puzzle', 
    description: 'Fill the 9x9 grid with numbers.', 
    isImplemented: true,
    theme: {
        primaryColor: 'text-cyan-400',
        secondaryColor: 'text-cyan-200',
        accentColor: 'bg-cyan-600',
        backgroundGradient: 'from-cyan-950 to-zinc-950'
    },
    rules: "1. A perfectly formed Sudoku has one and only one solution.\n2. The grid must be filled with numbers from 1 to 9.\n3. A number can only appear once in each row, column, and 3x3 block.\n4. Use logical deduction to fill in the missing numbers. Guessing is not required!"
  },
  { 
    id: '2048', 
    title: '2048', 
    categoryId: 'puzzle', 
    description: 'Slide and merge tiles to 2048.', 
    isImplemented: true,
    theme: {
        primaryColor: 'text-amber-400',
        secondaryColor: 'text-amber-200',
        accentColor: 'bg-amber-600',
        backgroundGradient: 'from-amber-950 to-zinc-950'
    },
    rules: "1. Use your arrow keys (or swipe) to move the tiles.\n2. Tiles with the same number merge into one when they touch.\n3. Add them up to reach 2048!\n4. The game ends when the board is full and no more moves can be made."
  },
  { 
    id: 'ludo', 
    title: 'Ludo', 
    categoryId: 'board', 
    description: 'Classic cross and circle game.', 
    isImplemented: true, 
    theme: { 
        primaryColor: 'text-zinc-500', 
        secondaryColor: 'text-zinc-300', 
        accentColor: 'bg-zinc-800', 
        backgroundGradient: 'from-zinc-900 to-black'
    }, 
    rules: "1. 2 to 4 players race their 4 pieces from start to home based on rolls of a single die.\n2. A 6 must be rolled to enter a piece onto the board.\n3. A 6 gives you an extra turn, but three 6s in a row forfeits your turn.\n4. Landing on an opponent's piece sends them back to base.\n5. Get all 4 pieces to the center home triangle to win!" 
  },
  { 
    id: 'memory-match', 
    title: 'Memory Match', 
    categoryId: 'puzzle', 
    description: 'Find the pairing cards.', 
    isImplemented: true, 
    theme: { 
        primaryColor: 'text-pink-400', 
        secondaryColor: 'text-pink-200', 
        accentColor: 'bg-pink-600', 
        backgroundGradient: 'from-pink-900 to-black'
    }, 
    rules: "1. Click a card to flip it over and reveal its symbol.\n2. Click a second card to try and find its match.\n3. If they match, they stay face up.\n4. If they don't, they flip back over.\n5. Memorize the locations and find all pairs in the fewest moves!" 
  },
  { 
    id: 'minesweeper', 
    title: 'Minesweeper', 
    categoryId: 'puzzle', 
    description: 'Clear the board without hitting mines.', 
    isImplemented: true, 
    theme: { 
        primaryColor: 'text-gray-400', 
        secondaryColor: 'text-gray-200', 
        accentColor: 'bg-gray-600', 
        backgroundGradient: 'from-teal-900 to-black'
    }, 
    rules: "1. Click a cell to reveal it. If it's a mine, you lose.\n2. A revealed number tells you how many mines are in the 8 adjacent cells.\n3. Right-click to place a flag where you think a mine is located.\n4. Reveal all non-mine cells to win!" 
  },
  { 
    id: 'sliding-15', 
    title: 'Sliding 15', 
    categoryId: 'puzzle', 
    description: 'Order tiles 1 to 15.', 
    isImplemented: true, 
    theme: { 
        primaryColor: 'text-fuchsia-400', 
        secondaryColor: 'text-fuchsia-200', 
        accentColor: 'bg-fuchsia-600', 
        backgroundGradient: 'from-fuchsia-950 to-zinc-950'
    }, 
    rules: "1. Click a tile adjacent to the empty space to slide it in.\n2. Arrange all tiles in numerical order from left to right, top to bottom.\n3. Complete the puzzle in as few moves as possible!" 
  },
  { 
    id: 'nonogram', 
    title: 'Nonogram', 
    categoryId: 'puzzle', 
    description: 'Picross picture logic.', 
    isImplemented: true, 
    theme: { 
        primaryColor: 'text-slate-800', 
        secondaryColor: 'text-slate-500', 
        accentColor: 'bg-white', 
        backgroundGradient: 'from-amber-100 to-amber-50'
    }, 
    rules: "1. The numbers on the top and left indicate groups of consecutive filled squares in that column or row.\n2. Click 'Fill' to mark a square black.\n3. Click 'Mark' (X) to mark a square that you know is empty (this helps you deduce the rest).\n4. Fill in the entire hidden picture to win!" 
  },
  
  // Arcade
  { 
    id: 'snake', 
    title: 'Snake', 
    categoryId: 'arcade', 
    description: 'Eat food and grow.', 
    isImplemented: true,
    theme: {
        primaryColor: 'text-green-400',
        secondaryColor: 'text-green-200',
        accentColor: 'bg-green-600',
        backgroundGradient: 'from-green-950 to-zinc-950'
    },
    rules: "1. Use arrow keys or WASD to control the snake.\n2. Eat the red apples to grow longer and increase your score.\n3. Do not run into the walls or your own tail, or it's Game Over!\n4. The snake gets faster as the Adaptive AI Difficulty increases."
  },
  { 
    id: 'pong', 
    title: 'Pong', 
    categoryId: 'arcade', 
    description: 'Classic arcade tennis.', 
    isImplemented: true,
    theme: {
        primaryColor: 'text-blue-400',
        secondaryColor: 'text-pink-400',
        accentColor: 'bg-indigo-600',
        backgroundGradient: 'from-zinc-900 to-black'
    },
    rules: "1. Prevent the ball from passing your paddle to avoid losing points.\n2. Use W/S (Player 1) or Up/Down (Player 2) to move your paddle vertically.\n3. Bounce the ball past your opponent's paddle to score.\n4. First player to reach 5 points wins the match!"
  },
  {
    id: 'battleship',
    title: 'Battleship',
    categoryId: 'board',
    description: 'Naval combat strategy.',
    isImplemented: true,
    theme: {
        primaryColor: 'text-cyan-400',
        secondaryColor: 'text-cyan-200',
        accentColor: 'bg-cyan-700',
        backgroundGradient: 'from-cyan-950 to-zinc-950'
    },
    rules: "1. Deploy your 5 ships (Carrier, Battleship, Cruiser, Submarine, Destroyer) onto your 10x10 grid.\n2. You and the opponent take turns firing shots into the other's grid.\n3. A 'Hit' occurs when you guess a coordinate occupied by a ship.\n4. When all coordinates of a ship are hit, it sinks.\n5. Sink the entire enemy fleet before they sink yours."
  },
  { 
    id: 'gomoku', 
    title: 'Gomoku', 
    categoryId: 'board', 
    description: 'Five in a row.', 
    isImplemented: true, 
    theme: { 
        primaryColor: 'text-amber-500', 
        secondaryColor: 'text-yellow-600', 
        accentColor: 'bg-amber-700', 
        backgroundGradient: 'from-amber-950 to-orange-950'
    }, 
    rules: "1. Black plays first.\n2. Players alternate placing one stone on an empty intersection.\n3. The winner is the first player to form an unbroken chain of 5 stones horizontally, vertically, or diagonally." 
  },

  // Relax
  { 
    id: 'bubble-pop', 
    title: 'Bubble Pop', 
    categoryId: 'relax', 
    description: 'Pop floating bubbles.', 
    isImplemented: true,
    theme: {
        primaryColor: 'text-cyan-300',
        secondaryColor: 'text-purple-300',
        accentColor: 'bg-cyan-500',
        backgroundGradient: 'from-zinc-900 to-zinc-800'
    },
    rules: "1. Tap or click floating bubbles to pop them.\n2. Try to pop as many bubbles as you can within the time limit.\n3. Different sizes float at different speeds.\n4. Relax, there's no way to lose!"
  },
  { 
    id: 'backgammon', 
    title: 'Backgammon', 
    categoryId: 'board', 
    description: 'Race your checkers home.', 
    isImplemented: true, 
    theme: { 
        primaryColor: 'text-amber-700', 
        secondaryColor: 'text-amber-500', 
        accentColor: 'bg-amber-900', 
        backgroundGradient: 'from-[#4a2e1e] to-black'
    }, 
    rules: "1. Two players race their 15 checkers in opposite directions across the 24 points of the board.\n2. Roll two dice to move checkers. Doubles let you play the numbers 4 times.\n3. You can land on empty points, your own points, or points with exactly one opponent checker (hitting it to the bar).\n4. Checkers on the bar must re-enter before any other moves can be made.\n5. Once all 15 checkers are in your home board, you can bear them off. First to bear off all wins!" 
  },
  { 
    id: 'dots-and-boxes', 
    title: 'Dots and Boxes', 
    categoryId: 'puzzle', 
    description: 'Claim the most boxes.', 
    isImplemented: true, 
    theme: { 
        primaryColor: 'text-indigo-400', 
        secondaryColor: 'text-indigo-200', 
        accentColor: 'bg-indigo-600', 
        backgroundGradient: 'from-slate-900 to-black'
    }, 
    rules: "1. Take turns drawing horizontal or vertical lines between adjacent dots.\n2. If a line completes the fourth side of a 1x1 box, you claim the box and earn a point.\n3. Whenever you claim a box, you must take another turn immediately.\n4. The player with the most boxes when all lines are drawn wins." 
  },
  { 
    id: 'breakout', 
    title: 'Breakout', 
    categoryId: 'arcade', 
    description: 'Smash the bricks.', 
    isImplemented: true,
    theme: {
        primaryColor: 'text-zinc-200',
        secondaryColor: 'text-red-400',
        accentColor: 'bg-zinc-700',
        backgroundGradient: 'from-zinc-950 to-black'
    },
    rules: "1. Control the paddle with your mouse to bounce the ball.\n2. Smash all the colored bricks to win the level.\n3. The angle of the ball changes based on where it hits your paddle.\n4. Don't let the ball fall past your paddle, or you lose a life!"
  },
  { 
    id: 'space-invaders', 
    title: 'Space Invaders', 
    categoryId: 'arcade', 
    description: 'Defend the earth.', 
    isImplemented: true,
    theme: {
        primaryColor: 'text-[#06b6d4]',
        secondaryColor: 'text-[#eab308]',
        accentColor: 'bg-stone-800',
        backgroundGradient: 'from-stone-950 to-black'
    },
    rules: "1. Use Arrow keys to move your ship left and right.\n2. Press Space to fire at the invading alien fleet.\n3. Take cover behind the green shields, but be careful—they break when shot!\n4. Clear all aliens before they reach the bottom of the screen."
  },
  { 
    id: 'zen-garden', 
    title: 'Zen Garden', 
    categoryId: 'relax', 
    description: 'Rake the sand.', 
    isImplemented: true,
    theme: {
        primaryColor: 'text-[#57534e]',
        secondaryColor: 'text-[#d6d3d1]',
        accentColor: 'bg-[#a8a29e]',
        backgroundGradient: 'from-stone-200 to-stone-50'
    },
    rules: "1. Select a tool from the menu.\n2. Click and drag across the sand to rake patterns.\n3. Add stones, bonsai, and lanterns to create a peaceful arrangement.\n4. There is no score and no time limit. Just relax."
  },
  { 
    id: 'coloring-book', 
    title: 'Coloring Book', 
    categoryId: 'relax', 
    description: 'Fill with color.', 
    isImplemented: true,
    theme: {
        primaryColor: 'text-[#ec4899]',
        secondaryColor: 'text-[#fbcfe8]',
        accentColor: 'bg-[#fb7185]',
        backgroundGradient: 'from-pink-50 to-rose-50'
    },
    rules: "1. Select a color from the palette.\n2. Click or tap any empty area of the mandala to fill it.\n3. Make your own beautiful art piece.\n4. No score, no pressure."
  },
  {
    id: 'number-match',
    title: 'Number Match',
    categoryId: 'puzzle',
    description: 'Find pairs of matching numbers.',
    isImplemented: true,
    theme: { primaryColor: 'text-sky-400', secondaryColor: 'text-sky-200', accentColor: 'bg-sky-600', backgroundGradient: 'from-sky-950 to-zinc-950' },
    rules: "1. Click two tiles to reveal their numbers.\n2. If they match, they stay revealed.\n3. If they don't match, they flip back.\n4. Clear all pairs to win."
  },
  {
    id: 'math-duel',
    title: 'Math Duel',
    categoryId: 'puzzle',
    description: 'Answer fast math questions.',
    isImplemented: true,
    theme: { primaryColor: 'text-rose-400', secondaryColor: 'text-rose-200', accentColor: 'bg-rose-700', backgroundGradient: 'from-rose-950 to-zinc-950' },
    rules: "1. A math equation is shown on screen.\n2. Select the correct answer from the 4 options before the timer runs out.\n3. Correct answers increase your streak for bonus points.\n4. A wrong answer or timeout costs you a life. You have 3 lives."
  },
  {
    id: 'reaction-memory',
    title: 'Reaction Memory',
    categoryId: 'puzzle',
    description: 'Watch and repeat color sequences.',
    isImplemented: true,
    theme: { primaryColor: 'text-violet-400', secondaryColor: 'text-violet-200', accentColor: 'bg-violet-700', backgroundGradient: 'from-violet-950 to-zinc-950' },
    rules: "1. Watch the sequence of flashing colored buttons carefully.\n2. When prompted, repeat the same sequence by pressing the buttons in order.\n3. Each successful round adds one more color to the sequence.\n4. A wrong press costs a life. You have 3 lives."
  },
  {
    id: 'pattern-recall',
    title: 'Pattern Recall',
    categoryId: 'puzzle',
    description: 'Memorize and recreate grid patterns.',
    isImplemented: true,
    theme: { primaryColor: 'text-cyan-400', secondaryColor: 'text-cyan-200', accentColor: 'bg-cyan-700', backgroundGradient: 'from-cyan-950 to-zinc-950' },
    rules: "1. A grid of lit cells is shown briefly.\n2. After it disappears, recreate the same pattern by clicking the cells.\n3. Press Submit to check your answer.\n4. Each correct round adds more lit cells to the pattern."
  },
  {
    id: 'speed-crossword',
    title: 'Speed Crossword',
    categoryId: 'puzzle',
    description: 'Solve mini crosswords fast.',
    isImplemented: true,
    theme: { primaryColor: 'text-amber-400', secondaryColor: 'text-amber-200', accentColor: 'bg-amber-700', backgroundGradient: 'from-amber-950 to-zinc-950' },
    rules: "1. Read the clues and type the answers into the crossword grid.\n2. You have a time limit to complete as many words as possible.\n3. Each solved word earns points — solving faster earns more!\n4. Complete all words before time runs out to win."
  },
  {
    id: 'logic-grid',
    title: 'Logic Grid',
    categoryId: 'puzzle',
    description: 'Solve elimination puzzles.',
    isImplemented: true,
    theme: { primaryColor: 'text-emerald-400', secondaryColor: 'text-emerald-200', accentColor: 'bg-emerald-700', backgroundGradient: 'from-emerald-950 to-zinc-950' },
    rules: "1. Read all the clues carefully.\n2. Use logical deduction to match each person with their correct attributes.\n3. Select your answers from the dropdowns in the grid.\n4. Press 'Check Solution' when you've filled everything in."
  },
  { id: 'flappy-bird', title: 'Flappy Bird', categoryId: 'arcade', description: 'Fly through the pipes.', isImplemented: true,
    theme: { primaryColor: 'text-sky-400', secondaryColor: 'text-green-400', accentColor: 'bg-sky-700', backgroundGradient: 'from-sky-950 to-zinc-950' },
    rules: "1. Click, tap, or press Space to make the bird flap upward.\n2. Avoid the green pipes — both top and bottom.\n3. Each pipe you pass earns 1 point.\n4. Don't hit the ground or ceiling!"
  },
  { id: 'whack-a-mole', title: 'Whack-a-Mole', categoryId: 'arcade', description: 'Hit the moles!', isImplemented: true,
    theme: { primaryColor: 'text-lime-400', secondaryColor: 'text-yellow-400', accentColor: 'bg-lime-700', backgroundGradient: 'from-lime-950 to-zinc-950' },
    rules: "1. Moles pop up randomly from the 9 holes.\n2. Click or tap a mole to whack it for 10 points.\n3. Moles that escape disappear and count as misses.\n4. You have 30 seconds — whack as many as you can!"
  },
  { id: 'typing-race', title: 'Typing Speed Race', categoryId: 'arcade', description: 'Type words as fast as you can.', isImplemented: true,
    theme: { primaryColor: 'text-green-400', secondaryColor: 'text-green-200', accentColor: 'bg-green-700', backgroundGradient: 'from-zinc-900 to-black' },
    rules: "1. Type the highlighted word and press Space to submit it.\n2. Correct words advance progress; wrong words count as errors.\n3. You have 60 seconds to type as many words as possible.\n4. Your speed is measured in Words Per Minute (WPM)."
  },

  { id: 'reaction-click', title: 'Reaction Click', categoryId: 'arcade', description: 'Test your reaction speed.', isImplemented: true,
    theme: { primaryColor: 'text-white', secondaryColor: 'text-zinc-300', accentColor: 'bg-zinc-700', backgroundGradient: 'from-zinc-900 to-black' },
    rules: "1. Wait for the screen to flash a bright color.\n2. Click as quickly as possible when you see it!\n3. Clicking too early resets the round — no cheating!\n4. Your average reaction time is measured over 10 rounds."
  },
  { id: 'dodge-obstacles', title: 'Dodge!', categoryId: 'arcade', description: 'Dodge falling blocks.', isImplemented: true,
    theme: { primaryColor: 'text-blue-400', secondaryColor: 'text-blue-200', accentColor: 'bg-blue-700', backgroundGradient: 'from-[#0f0f1a] to-zinc-950' },
    rules: "1. Use Arrow Keys (or A/D) to move your ship left and right.\n2. Dodge the colorful blocks falling from the top of the screen.\n3. The blocks fall faster as your score increases.\n4. One hit and it's game over!"
  },
  { id: 'color-switch', title: 'Color Switch', categoryId: 'arcade', description: 'Match your color to the ring.', isImplemented: true,
    theme: { primaryColor: 'text-white', secondaryColor: 'text-zinc-300', accentColor: 'bg-zinc-800', backgroundGradient: 'from-zinc-950 to-black' },
    rules: "1. Your ball rises and falls through spinning color-segmented rings.\n2. The ball can only pass through the ring segment that matches its color.\n3. Click or press Space to jump and instantly change the ball's color.\n4. Score by surviving as long as possible!"
  },
  { id: 'tile-matching-zen', title: 'Tile Match Zen', categoryId: 'relax', description: 'Pop matching color groups.', isImplemented: true,
    theme: { primaryColor: 'text-teal-400', secondaryColor: 'text-teal-200', accentColor: 'bg-teal-700', backgroundGradient: 'from-teal-950 to-zinc-950' },
    rules: "1. Click any group of 2 or more adjacent matching tiles to clear them.\n2. Larger groups score exponentially more points.\n3. Cleared tiles fall and new tiles fill from the top.\n4. There's no win or lose — just relax and keep clearing!"
  },
  { id: 'idle-clicker', title: 'Idle Clicker', categoryId: 'relax', description: 'Click to harvest orbs.', isImplemented: true,
    theme: { primaryColor: 'text-emerald-400', secondaryColor: 'text-emerald-200', accentColor: 'bg-emerald-700', backgroundGradient: 'from-emerald-950 to-zinc-950' },
    rules: "1. Click the big orb to earn orbs.\n2. Spend orbs on upgrades that automatically generate orbs for you.\n3. Each upgrade level costs more but produces more per second.\n4. Keep upgrading to grow your orb empire!"
  },
  { id: 'sand-simulation', title: 'Sand Simulation', categoryId: 'relax', description: 'Pour and watch sand flow.', isImplemented: true,
    theme: { primaryColor: 'text-amber-400', secondaryColor: 'text-amber-200', accentColor: 'bg-amber-700', backgroundGradient: 'from-zinc-950 to-black' },
    rules: "1. Click and drag on the canvas to pour sand.\n2. Sand falls with gravity and piles up realistically.\n3. Toggle Rain mode to spawn sand automatically from the top.\n4. Change brush size for different pour rates. Clear to start fresh."
  },
  { id: 'fidget-spinner', title: 'Fidget Spinner', categoryId: 'relax', description: 'Spin to de-stress.', isImplemented: true,
    theme: { primaryColor: 'text-indigo-400', secondaryColor: 'text-indigo-200', accentColor: 'bg-indigo-700', backgroundGradient: 'from-indigo-950 to-zinc-950' },
    rules: "1. Click and drag the spinner to spin it with your mouse.\n2. Release and it will spin with momentum, gradually slowing down due to friction.\n3. Press the Flick button for a random speed boost.\n4. Track your RPM and total spin count. Just relax!"
  },
  { id: 'ball-drop', title: 'Ball Drop', categoryId: 'relax', description: 'Watch balls bounce through pegs.', isImplemented: true,
    theme: { primaryColor: 'text-purple-400', secondaryColor: 'text-purple-200', accentColor: 'bg-purple-700', backgroundGradient: 'from-[#050508] to-zinc-950' },
    rules: "1. Click anywhere on the canvas to drop a colored ball.\n2. Balls bounce off the pegs and each other with realistic physics.\n3. Use '+5 Balls' to spawn a burst of balls.\n4. Up to 60 balls can be active simultaneously. Mesmerizing!"
  },
  { id: 'jigsaw-puzzle', title: 'Jigsaw Puzzle', categoryId: 'relax', description: 'Sort emoji puzzle pieces.', isImplemented: true,
    theme: { primaryColor: 'text-pink-400', secondaryColor: 'text-pink-200', accentColor: 'bg-pink-700', backgroundGradient: 'from-pink-950 to-zinc-950' },
    rules: "1. Click a piece in the tray to select it, then click a slot on the board to place it.\n2. Pieces automatically highlight green when placed in the correct position.\n3. Arrange all 16 tiles to match the correct order.\n4. Try to complete the puzzle in as few moves as possible!"
  },
  { id: 'pattern-drawing', title: 'Pattern Drawing', categoryId: 'relax', description: 'Draw symmetrical mandalas.', isImplemented: true,
    theme: { primaryColor: 'text-violet-400', secondaryColor: 'text-violet-200', accentColor: 'bg-violet-700', backgroundGradient: 'from-violet-950 to-zinc-950' },
    rules: "1. Draw on the canvas — your strokes are mirrored with the chosen symmetry.\n2. Choose 2x, 4x, or 8x rotational symmetry for different patterns.\n3. Pick your color and brush width from the toolbar.\n4. Use Undo to remove the last stroke, or Clear to start fresh."
  },
  { id: 'calm-breathing', title: 'Calm Breathing', categoryId: 'relax', description: 'Breathe with the glowing circle.', isImplemented: true,
    theme: { primaryColor: 'text-slate-400', secondaryColor: 'text-slate-200', accentColor: 'bg-slate-700', backgroundGradient: 'from-slate-950 to-zinc-950' },
    rules: "1. Select a breathing pattern: 4-7-8, Box, or Simple Calm.\n2. Press Start and follow the expanding/contracting circle.\n3. Breathe in when it expands, out when it contracts.\n4. There's no score — just relax and center yourself."
  },
  { id: 'shape-sorting', title: 'Shape Sorting', categoryId: 'relax', description: 'Match shapes to their slots.', isImplemented: true,
    theme: { primaryColor: 'text-sky-400', secondaryColor: 'text-sky-200', accentColor: 'bg-sky-700', backgroundGradient: 'from-sky-950 to-zinc-950' },
    rules: "1. Click a piece from your tray to select it, then click a matching outline slot.\n2. Both shape AND color must match the slot.\n3. Wrong placements are rejected — try again!\n4. Complete all slots to advance to the next level."
  },
  { id: 'dot-connecting', title: 'Dot Sketch', categoryId: 'relax', description: 'Connect dots to reveal hidden figures.', isImplemented: true,
    theme: { primaryColor: 'text-amber-400', secondaryColor: 'text-amber-200', accentColor: 'bg-amber-700', backgroundGradient: 'from-zinc-900 to-black' },
    rules: "1. Click dots in numerical order (1, 2, 3…) to connect them with lines.\n2. The next dot pulses in gold — tap it to draw the next segment.\n3. When all dots are connected the hidden shape is revealed!\n4. Choose from 14 shapes: Star, Diamond, Heart, Butterfly, Rocket, Moon, Snowflake, and more."
  },
  { id: 'space-impact', title: 'Space Impact', categoryId: 'arcade', description: 'Nokia classic space shooter.', isImplemented: true,
    theme: { primaryColor: 'text-cyan-400', secondaryColor: 'text-cyan-200', accentColor: 'bg-cyan-700', backgroundGradient: 'from-[#000011] to-zinc-950' },
    rules: "1. Use Arrow Keys to move your ship in all four directions.\n2. Press Space or Z to fire your laser at incoming enemies.\n3. Three types of enemies: Saucers, Fighter Jets, and Boss ships.\n4. Survive and score as high as possible — waves get harder!"
  },
  { id: 'top-down-racer', title: 'Top-Down Racer', categoryId: 'arcade', description: 'Dodge traffic in 3 lanes.', isImplemented: true,
    theme: { primaryColor: 'text-cyan-400', secondaryColor: 'text-cyan-200', accentColor: 'bg-gray-700', backgroundGradient: 'from-gray-950 to-zinc-950' },
    rules: "1. Use the Left and Right Arrow Keys to switch lanes.\n2. Dodge oncoming AI traffic cars before they hit you.\n3. The road gets faster the further you drive.\n4. One collision ends the race — how far can you drive?"
  },
  { id: 'chrome-dino', title: 'Chrome Dino', categoryId: 'arcade', description: 'The classic offline dino game.', isImplemented: true,
    theme: { primaryColor: 'text-[#535353]', secondaryColor: 'text-[#666]', accentColor: 'bg-[#535353]', backgroundGradient: 'from-[#f7f7f7] to-white' },
    rules: "1. Press Space or ↑ to make the dinosaur jump over cacti.\n2. Press ↓ while in the air to duck under flying birds.\n3. Speed increases over time — how long can you survive?\n4. Your high score is saved for the session. Beat it!"
  },
  { id: 'maze-chase', title: 'Neon Maze Runner', categoryId: 'arcade', description: 'Neon maze chase: collect pellets, hunt chasers!', isImplemented: true,
    theme: { primaryColor: 'text-cyan-400', secondaryColor: 'text-cyan-200', accentColor: 'bg-cyan-900', backgroundGradient: 'from-[#050510] to-[#0a0a1a]' },
    rules: "1. Use Arrow Keys or WASD to navigate the neon maze.\n2. Collect all glowing pellets to complete each level.\n3. Avoid the four Chasers — one collision costs a life.\n4. Eat a Power Pellet (large cyan dot) to make Chasers vulnerable — chase them back for bonus points!\n5. Beat levels to face faster, more aggressive Chasers."
  },
  { id: 'retro-commando', title: 'Retro Commando', categoryId: 'arcade', description: 'Side-scrolling run & gun — reach the boss!', isImplemented: true,
    theme: { primaryColor: 'text-red-500', secondaryColor: 'text-orange-400', accentColor: 'bg-red-900', backgroundGradient: 'from-[#080012] to-[#0a0018]' },
    rules: "1. A/D or ← → to move, W/↑/Space to jump, Z/Ctrl to shoot.\n2. Three weapon types — Rifle (default), Spread Shot, Laser. Pick up drops from defeated enemies.\n3. Defeat Grunts (1 HP), Heavies (multi-HP), and the final Boss to complete each mission.\n4. You have 3 lives — avoid enemy bullets and collisions.\n5. Missions get harder as levels increase. Good luck, Commando!"
  }
];

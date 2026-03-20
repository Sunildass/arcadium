import React, { lazy, Suspense, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import NotFound from './NotFound';
import { GAME_CATALOG } from '../core/catalog';
import { ArrowLeft } from 'lucide-react';
import { shouldShowRules } from '../utils/rulesPreference';
import { RulesModal } from '../components/modals/RulesModal';
import { useTheme } from '../theme/ThemeProvider';

// Dynamic imports mapping based on Game ID
const gameComponents: Record<string, React.LazyExoticComponent<React.ComponentType<any>>> = {
  'tic-tac-toe': lazy(() => import('../games/board/TicTacToe')),
  'connect-four': lazy(() => import('../games/board/ConnectFour')),
  'blackjack': lazy(() => import('../games/cards/Blackjack')),
  'sudoku': lazy(() => import('../games/puzzle/Sudoku')),
  '2048': lazy(() => import('../games/puzzle/2048')),
  'snake': lazy(() => import('../games/arcade/Snake')),
  'pong': lazy(() => import('../games/arcade/Pong')),
  'breakout': lazy(() => import('../games/arcade/Breakout')),
  'space-invaders': lazy(() => import('../games/arcade/SpaceInvaders')),
  'bubble-pop': lazy(() => import('../games/relax/BubblePop')),
  'zen-garden': lazy(() => import('../games/relax/ZenGarden')),
  'coloring-book': lazy(() => import('../games/relax/ColoringBook')),
  'checkers': lazy(() => import('../games/board/Checkers')),
  'reversi': lazy(() => import('../games/board/Reversi')),
  'solitaire': lazy(() => import('../games/cards/Solitaire')),
  'uno': lazy(() => import('../games/cards/UnoClone')),
  'chess': lazy(() => import('../games/board/Chess')),
  'battleship': lazy(() => import('../games/board/Battleship')),
  'gomoku': lazy(() => import('../games/board/Gomoku')),
  'poker': lazy(() => import('../games/cards/Poker')),
  'ludo': lazy(() => import('../games/board/Ludo')),
  'backgammon': lazy(() => import('../games/board/Backgammon')),
  'dots-and-boxes': lazy(() => import('../games/puzzle/DotsAndBoxes')),
  'memory-match': lazy(() => import('../games/puzzle/MemoryMatch')),
  'minesweeper': lazy(() => import('../games/puzzle/Minesweeper')),
  'sliding-15': lazy(() => import('../games/puzzle/Sliding15')),
  'mastermind': lazy(() => import('../games/puzzle/Mastermind')),
  'tower-of-hanoi': lazy(() => import('../games/puzzle/TowerOfHanoi')),
  'lights-out': lazy(() => import('../games/puzzle/LightsOut')),
  'nonogram': lazy(() => import('../games/puzzle/Nonogram')),
  'simon-says': lazy(() => import('../games/puzzle/SimonSays')),
  'war': lazy(() => import('../games/cards/War')),
  'high-low': lazy(() => import('../games/cards/HighLow')),
  'go-fish': lazy(() => import('../games/cards/GoFish')),
  'crazy-eights': lazy(() => import('../games/cards/CrazyEights')),
  'number-match': lazy(() => import('../games/puzzle/NumberMatch')),
  'math-duel': lazy(() => import('../games/puzzle/MathDuel')),
  'reaction-memory': lazy(() => import('../games/puzzle/ReactionMemory')),
  'pattern-recall': lazy(() => import('../games/puzzle/PatternRecall')),
  'speed-crossword': lazy(() => import('../games/puzzle/SpeedCrossword')),
  'logic-grid': lazy(() => import('../games/puzzle/LogicGrid')),
  'flappy-bird': lazy(() => import('../games/arcade/FlappyBird')),
  'whack-a-mole': lazy(() => import('../games/arcade/WhackAMole')),
  'typing-race': lazy(() => import('../games/arcade/TypingRace')),
  'reaction-click': lazy(() => import('../games/arcade/ReactionClick')),
  'dodge-obstacles': lazy(() => import('../games/arcade/DodgeObstacles')),
  'color-switch': lazy(() => import('../games/arcade/ColorSwitch')),
  'tile-matching-zen': lazy(() => import('../games/relax/TileMatchingZen')),
  'idle-clicker': lazy(() => import('../games/relax/IdleClicker')),
  'sand-simulation': lazy(() => import('../games/relax/SandSimulation')),
  'fidget-spinner': lazy(() => import('../games/relax/FidgetSpinner')),
  'ball-drop': lazy(() => import('../games/relax/BallDropPhysics')),
  'jigsaw-puzzle': lazy(() => import('../games/relax/JigsawPuzzle')),
  'pattern-drawing': lazy(() => import('../games/relax/PatternDrawing')),
  'calm-breathing': lazy(() => import('../games/relax/CalmBreathing')),
  'shape-sorting': lazy(() => import('../games/relax/ShapeSorting')),
  'dot-connecting': lazy(() => import('../games/relax/DotConnecting')),
  'space-impact': lazy(() => import('../games/arcade/SpaceImpact')),
  'top-down-racer': lazy(() => import('../games/arcade/TopDownRacer')),
  'chrome-dino': lazy(() => import('../games/arcade/ChromeDino')),
  'maze-chase': lazy(() => import('../games/arcade/NeonMaze')),
  'retro-commando': lazy(() => import('../games/arcade/RetroCommando')),
};

export default function GameWrapper() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [showRules, setShowRules] = React.useState(false);
  const { setThemeContext } = useTheme();

  const gameInfo = React.useMemo(
    () => GAME_CATALOG.find(g => g.id === id),
    [id]
  );
  const GameComponent = id ? gameComponents[id] : undefined;

  React.useEffect(() => {
    if (gameInfo) {
      setThemeContext(gameInfo.categoryId, gameInfo.id);
    }
    if (id && shouldShowRules(id)) {
      setShowRules(true);
    }
  }, [id, gameInfo, setThemeContext]);

  // ── Scroll to top whenever a game is opened ───────────────────────────────
  React.useEffect(() => { window.scrollTo({ top: 0, behavior: 'instant' }); }, []);

  // ── Session play-time tracker ─────────────────────────────────────────────
  // Starts a wall-clock timer the moment the game page mounts.
  // On unmount (user presses Back or navigates away), elapsed time is flushed
  // to localStorage so the game tile always shows accurate cumulative time.
  React.useEffect(() => {
    if (!id) return;
    const sessionStart = Date.now();
    return () => {
      const elapsedMs = Date.now() - sessionStart;
      if (elapsedMs < 1000) return; // ignore accidental sub-1-second visits
      try {
        const key = `game-platform/playtime/${id}`;
        const prev = Number(localStorage.getItem(key) ?? '0');
        localStorage.setItem(key, String(prev + elapsedMs));

        // Also keep the existing PlayerStats.totalPlaytimeMs in sync so the
        // MainMenu tile picks it up via PlayerProfileManager.getStats()
        const statsKey = `game-platform/player-stats/${id}`;
        const raw = localStorage.getItem(statsKey);
        const stats = raw ? JSON.parse(raw) : { gamesPlayed: 0, wins: 0, losses: 0, draws: 0, averagePlayTimeMs: 0, totalPlaytimeMs: 0, fastestWinMs: null, bestDifficultyBeaten: null };
        stats.totalPlaytimeMs = (Number(stats.totalPlaytimeMs) || 0) + elapsedMs;
        localStorage.setItem(statsKey, JSON.stringify(stats));
      } catch { /* storage quota or private mode — silently skip */ }
    };
  }, [id]);

  // Block ALL keyboard events from reaching games while the rules modal is open.
  // Using the capture phase (3rd arg = true) ensures this fires before any game
  // listener that uses the default bubble phase.
  React.useEffect(() => {
    if (!showRules) return;
    const blockKeys = (e: KeyboardEvent) => {
      e.stopPropagation();
      // Also prevent default for Space/Arrow so the page doesn't scroll
      if (['Space','ArrowUp','ArrowDown','ArrowLeft','ArrowRight'].includes(e.code)) {
        e.preventDefault();
      }
    };
    window.addEventListener('keydown', blockKeys, true);
    return () => window.removeEventListener('keydown', blockKeys, true);
  }, [showRules]);

  if (!gameInfo || !GameComponent) {
    return <NotFound />;
  }

  return (
    <div className="min-h-screen flex flex-col z-10 relative">
       {/* Global Game Header */}
       <header 
         className="w-full p-4 flex items-center justify-between border-b backdrop-blur-md sticky top-0 z-50 transition-colors"
         style={{
             backgroundColor: 'rgba(0,0,0,0.5)',
             borderColor: 'rgba(255,255,255,0.1)'
         }}
       >
           <button 
              onClick={() => navigate(-1)} // Go back
              className="flex items-center gap-2 transition-colors group"
              style={{ color: 'var(--color-text-secondary)' }}
           >
               <div 
                  className="p-2 rounded-lg transition-colors"
                  style={{ backgroundColor: 'var(--color-surface)' }}
               >
                   <ArrowLeft className="w-5 h-5" />
               </div>
               <span className="font-bold hidden sm:inline group-hover:text-white transition-colors">Back</span>
           </button>

           <div className="flex-1 text-center">
               <h1 
                  className="text-xl sm:text-2xl font-black tracking-tight drop-shadow-sm"
                  style={{ color: 'var(--color-primary)', fontFamily: 'var(--font-heading)' }}
               >
                  {gameInfo.title}
               </h1>
           </div>

           <div className="w-[88px] sm:w-[100px]" /> {/* Spacer for flex balance */}
       </header>

       {/* Game Canvas / Component Area */}
       <main 
          className="flex-1 flex flex-col relative overflow-hidden" 
          style={{ fontFamily: 'var(--font-body)' }}
       >
           <Suspense fallback={
               <div className="absolute inset-0 flex flex-col items-center justify-center">
                   <div 
                      className="w-16 h-16 border-4 border-t-transparent rounded-full animate-spin"
                      style={{ borderColor: 'var(--color-primary)', borderTopColor: 'transparent' }}
                   ></div>
                   <p 
                      className="mt-6 font-mono animate-pulse tracking-widest uppercase"
                      style={{ color: 'var(--color-text-secondary)' }}
                   >
                     Initializing Engine...
                   </p>
               </div>
           }>
               {/* We wrap the game in a container that handles most of the flex constraints so games can assume full space */}
               <div className="flex-1 w-full h-full pb-8 overflow-y-auto overflow-x-hidden">
                  <div className="min-h-[calc(100vh-80px)] w-full flex items-center justify-center">
                     <GameComponent />
                  </div>
               </div>
           </Suspense>
       </main>

       {/* Rules Modal Overlay */}
       {gameInfo && showRules && (
           <RulesModal
               gameId={gameInfo.id}
               isOpen={showRules}
               onClose={() => setShowRules(false)}
               title={gameInfo.title}
               rulesText={gameInfo.rules}
           />
       )}
    </div>
  );
}

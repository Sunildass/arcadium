import { useState, useEffect } from 'react';
import { BlackjackEngine } from './BlackjackEngine';
import { BlackjackDealerAI } from './BlackjackDealerAI';
import { BlackjackState, initialBlackjackState, calculateHandValue, Card } from './types';
import { PlayerProfileManager } from '../../../core/ai/PlayerProfileManager';

export default function Blackjack() {
  const [engine] = useState(() => new BlackjackEngine('1P'));
  const [gameState, setGameState] = useState<BlackjackState>(initialBlackjackState);
  const [ai] = useState(() => new BlackjackDealerAI('blackjack'));
  const [profileManager] = useState(() => new PlayerProfileManager('blackjack'));
  const [turnStartTime, setTurnStartTime] = useState<number>(Date.now());
  const [mistakes, setMistakes] = useState(0); // Busted hits
  const [movesCount, setMovesCount] = useState(0);

  const handleStart = () => {
    setMistakes(0);
    setMovesCount(0);
    setTurnStartTime(Date.now());
    const newState = engine.update(gameState, 'start');
    setGameState(newState);
  };

  const handleHit = () => {
    if (gameState.gameState !== 'playerTurn') return;
    setMovesCount((m) => m + 1);
    const newState = engine.update(gameState, 'hit');
    setGameState(newState);
  };

  const handleStand = () => {
    if (gameState.gameState !== 'playerTurn') return;
    setMovesCount((m) => m + 1);
    const newState = engine.update(gameState, 'stand');
    setGameState(newState);
  };

  // Dealer Turn Effect
  useEffect(() => {
    if (gameState.gameState === 'dealerTurn') {
      const processDealer = async () => {
        let currentState = gameState;
        
        // Reveal card first
        currentState = {
           ...currentState, 
           dealerHand: currentState.dealerHand.map(c => ({...c, isHidden: false})) 
        };
        setGameState({...currentState});
        await new Promise(r => setTimeout(r, 800)); // Dramatic pause

        let aiMove = ai.determineMove(currentState);
        
        while (aiMove === 'hit') {
          const deck = [...currentState.deck];
          const newCard = deck.pop()!;
          const newDealerHand = [...currentState.dealerHand, newCard];
          const dVal = calculateHandValue(newDealerHand);
          
          currentState = { ...currentState, deck, dealerHand: newDealerHand };
          setGameState({...currentState});
          
          await new Promise(r => setTimeout(r, 800)); // Dramatic hit pause
          
          if (dVal > 21) {
            currentState = { ...currentState, gameState: 'gameOver', winner: 'Player', message: 'Dealer Busts! You Win!' };
            break;
          }
          
          aiMove = ai.determineMove(currentState);
        }

        if (currentState.gameState !== 'gameOver') {
           const pVal = calculateHandValue(currentState.playerHand);
           const dVal = calculateHandValue(currentState.dealerHand);
           let winner: BlackjackState['winner'] = null;
           let msg = '';
           
           if (pVal > dVal) { winner = 'Player'; msg = 'You Win!'; }
           else if (dVal > pVal) { winner = 'Dealer'; msg = 'Dealer Wins!'; }
           else { winner = 'Push'; msg = 'Push! Tie game.'; }

           currentState = { ...currentState, gameState: 'gameOver', winner, message: msg };
        }
        
        setGameState(currentState);
      };
      
      processDealer();
    }
  }, [gameState.gameState, ai, engine]);

  // Handle Game Over tracking
  useEffect(() => {
    if (gameState.gameState === 'gameOver' && gameState.winner !== null) {
        const isWin = gameState.winner === 'Player';
        const isLoss = gameState.winner === 'Dealer';
        
        // If busted
        if (isLoss && calculateHandValue(gameState.playerHand) > 21) {
            setMistakes(m => m + 1);
        }

        const playTime = Date.now() - turnStartTime;
        ai.reportGameEnd(isWin, playTime, mistakes, movesCount);
        profileManager.recordGameResult(
          isWin ? 'win' : isLoss ? 'loss' : 'draw', 
          playTime, 
          ai.getCurrentDifficultyScore().toString()
        );
    }
  }, [gameState.gameState, gameState.winner]);

  const renderCard = (card: Card, index: number) => {
    if (card.isHidden) {
      return (
        <div key={`hidden-${index}`} className="w-16 h-24 sm:w-24 sm:h-36 bg-blue-900 border-4 border-blue-700 rounded-lg shadow-xl shadow-black/50 overflow-hidden relative backface-hidden flex items-center justify-center -ml-8 first:ml-0 transition-transform hover:-translate-y-2">
           <div className="w-full h-full opacity-20 bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI4IiBoZWlnaHQ9IjgiPgo8cmVjdCB3aWR0aD0iOCIgaGVpZ2h0PSI4IiBmaWxsPSIjNDAzNjM2Ij48L3JlY3Q+CjxwYXRoIGQ9Ik0wIDBMOCA4Wk04IDBMMCA4WiIgc3Ryb2tlPSIjMjIyMiIgc3Ryb2tlLXdpZHRoPSIxIj48L3BhdGg+Cjwvc3ZnPg==')] bg-repeat" />
        </div>
      );
    }

    const color = card.suit === 'Hearts' || card.suit === 'Diamonds' ? 'text-red-500' : 'text-zinc-900';
    const suitSymbol = { Hearts: '♥', Diamonds: '♦', Clubs: '♣', Spades: '♠' }[card.suit];

    return (
      <div key={`${card.rank}-${card.suit}-${index}`} className={`w-16 h-24 sm:w-24 sm:h-36 bg-white border border-zinc-200 rounded-lg shadow-xl shadow-black/50 flex flex-col justify-between p-2 font-bold text-xl sm:text-2xl ${color} -ml-8 first:ml-0 transition-transform hover:-translate-y-4 hover:z-10 z-0`}>
        <div className="flex flex-col items-start leading-none">
          <span>{card.rank}</span>
          <span className="text-sm sm:text-lg">{suitSymbol}</span>
        </div>
        <div className="flex flex-col items-end leading-none rotate-180 origin-center">
           <span>{card.rank}</span>
           <span className="text-sm sm:text-lg">{suitSymbol}</span>
        </div>
      </div>
    );
  };

  return (
    <div className="flex flex-col items-center justify-around h-full min-h-[500px] w-full max-w-4xl p-4 sm:p-8">
       {/* Top Bar Settings / Info */}
       <div className="w-full flex justify-between items-center text-zinc-400 text-sm mb-4">
         <span>Difficulty Score: {ai.getCurrentDifficultyScore().toFixed(1)}/10</span>
         <span>Profile Wins: {profileManager.getStats().wins}</span>
       </div>

      {/* Dealer Playing Area */}
      <div className="flex flex-col items-center w-full h-48 mb-6">
        <h3 className="text-xl text-zinc-300 font-semibold mb-2">Dealer</h3>
        <div className="flex">
          {gameState.dealerHand.length === 0 ? (
             <div className="w-16 h-24 sm:w-24 sm:h-36 border-2 border-dashed border-zinc-600 rounded-lg opacity-30" />
          ) : (
            gameState.dealerHand.map((c, i) => renderCard(c, i))
          )}
        </div>
        {gameState.gameState !== 'betting' && gameState.dealerHand[1] && !gameState.dealerHand[1].isHidden && (
          <span className="mt-2 text-zinc-400 bg-zinc-800 px-3 py-1 rounded-full text-sm shadow-inner">
            Value: {calculateHandValue(gameState.dealerHand)}
          </span>
        )}
      </div>

       {/* Middle Area: Messages */}
       <div className="h-16 flex items-center justify-center w-full my-4">
          <p className="text-2xl sm:text-3xl font-black tracking-wide text-amber-400 animate-pulse drop-shadow-[0_0_10px_rgba(251,191,36,0.5)] text-center">
            {gameState.message}
          </p>
       </div>

      {/* Player Playing Area */}
      <div className="flex flex-col items-center w-full h-48 mt-6">
         <div className="flex">
           {gameState.playerHand.length === 0 ? (
             <div className="w-16 h-24 sm:w-24 sm:h-36 border-2 border-dashed border-zinc-600 rounded-lg opacity-30" />
          ) : (
            gameState.playerHand.map((c, i) => renderCard(c, i))
          )}
        </div>
        {gameState.gameState !== 'betting' && (
          <span className="mt-4 text-zinc-200 font-bold bg-blue-900 border border-blue-700 px-4 py-1 rounded-full shadow-inner shadow-black/50">
            Total: {calculateHandValue(gameState.playerHand)}
          </span>
        )}
        <h3 className="text-xl text-zinc-300 font-semibold mt-2">You</h3>
      </div>

      {/* Controls */}
      <div className="w-full max-w-md flex justify-around mt-8 bg-zinc-800/50 p-4 rounded-2xl backdrop-blur border border-zinc-700/50">
        {gameState.gameState === 'betting' || gameState.gameState === 'gameOver' ? (
          <button 
            onClick={handleStart}
            className="flex-1 mx-2 py-3 bg-indigo-600 hover:bg-indigo-500 rounded-xl font-bold text-white shadow-lg active:scale-95 transition-all text-lg"
          >
            {gameState.gameState === 'gameOver' ? 'Play Again' : 'Deal Cards'}
          </button>
        ) : (
          <>
            <button 
              onClick={handleHit}
              disabled={gameState.gameState !== 'playerTurn'}
              className="flex-1 mx-2 py-3 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 disabled:cursor-not-allowed rounded-xl font-bold text-white shadow-lg active:scale-95 transition-all text-lg"
            >
              HIT
            </button>
            <button 
              onClick={handleStand}
              disabled={gameState.gameState !== 'playerTurn'}
              className="flex-1 mx-2 py-3 bg-red-600 hover:bg-red-500 disabled:opacity-50 disabled:cursor-not-allowed rounded-xl font-bold text-white shadow-lg active:scale-95 transition-all text-lg"
            >
              STAND
            </button>
          </>
        )}
      </div>
    </div>
  );
}

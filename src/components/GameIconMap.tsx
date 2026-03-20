import React, { ReactNode } from 'react';
import {
  Gamepad2, Hash, Grid2X2, Spade, Grid3X3,
  Activity, Orbit, Circle, Crown, Castle,
  Diamond, Shuffle, TrendingUp, Fish, Zap,
  Brain, Eye, Bomb, Puzzle, Target, Bird,
  Hammer, Keyboard, Crosshair, Flower2, Palette,
  Calculator, Dices, BookOpen, Timer, Layers,
  Swords, Star, Boxes, LayoutGrid,
  MousePointerClick, Hourglass, Wind
} from 'lucide-react';

// ─── Tiny inline SVGs for games with no good lucide equivalent ───────────────

const CheckerboardIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
    <rect x="2" y="2" width="5" height="5" fill="currentColor"/>
    <rect x="12" y="2" width="5" height="5" fill="currentColor"/>
    <rect x="7" y="7" width="5" height="5" fill="currentColor"/>
    <rect x="17" y="7" width="5" height="5" fill="currentColor"/>
    <rect x="2" y="12" width="5" height="5" fill="currentColor"/>
    <rect x="12" y="12" width="5" height="5" fill="currentColor"/>
    <rect x="7" y="17" width="5" height="5" fill="currentColor"/>
    <rect x="17" y="17" width="5" height="5" fill="currentColor"/>
    <rect x="2" y="2" width="20" height="20" rx="1" stroke="currentColor" strokeWidth="1.5" fill="none"/>
  </svg>
);

const ChessKnightIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
    <path d="M8 20h8M12 20v-2M6 6C6 6 8 4 10 4C12 4 13 5 13 5C13 5 17 4 17 7C17 9 15 10 13 11L12 18H9L10 9C8 9 6 8 6 6Z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" fill="currentColor" fillOpacity="0.15"/>
    <circle cx="9" cy="6.5" r="1" fill="currentColor"/>
  </svg>
);

const ReversiIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
    <circle cx="8" cy="8" r="5" fill="currentColor"/>
    <circle cx="16" cy="16" r="5" stroke="currentColor" strokeWidth="1.5"/>
    <circle cx="16" cy="8" r="5" stroke="currentColor" strokeWidth="1.5"/>
    <circle cx="8" cy="16" r="5" fill="currentColor"/>
  </svg>
);

const PokerChipIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
    <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.5"/>
    <circle cx="12" cy="12" r="5" stroke="currentColor" strokeWidth="1.5"/>
    <line x1="12" y1="3" x2="12" y2="7" stroke="currentColor" strokeWidth="2"/>
    <line x1="12" y1="17" x2="12" y2="21" stroke="currentColor" strokeWidth="2"/>
    <line x1="3" y1="12" x2="7" y2="12" stroke="currentColor" strokeWidth="2"/>
    <line x1="17" y1="12" x2="21" y2="12" stroke="currentColor" strokeWidth="2"/>
  </svg>
);

const ColorSwatchIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
    <rect x="2" y="2" width="9" height="9" rx="1.5" fill="currentColor" opacity="0.9"/>
    <rect x="13" y="2" width="9" height="9" rx="1.5" fill="currentColor" opacity="0.5"/>
    <rect x="2" y="13" width="9" height="9" rx="1.5" fill="currentColor" opacity="0.5"/>
    <rect x="13" y="13" width="9" height="9" rx="1.5" fill="currentColor" opacity="0.2"/>
  </svg>
);

const SolitaireIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
    <rect x="3" y="4" width="10" height="14" rx="1.5" stroke="currentColor" strokeWidth="1.5"/>
    <rect x="11" y="7" width="10" height="14" rx="1.5" fill="currentColor" fillOpacity="0.15" stroke="currentColor" strokeWidth="1.5"/>
    <path d="M7 9 L8 11 L9 9 C9 9 10 8 9.5 10 L8 12 L6.5 10 C6 8 7 9 7 9Z" fill="currentColor"/>
  </svg>
);

const LudoIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
    <rect x="2" y="2" width="20" height="20" rx="2" stroke="currentColor" strokeWidth="1.5"/>
    <rect x="2" y="2" width="9" height="9" fill="currentColor" opacity="0.7"/>
    <rect x="13" y="13" width="9" height="9" fill="currentColor" opacity="0.7"/>
    <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="1.5"/>
    <circle cx="12" cy="12" r="1" fill="currentColor"/>
  </svg>
);

const BattleshipIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
    <path d="M3 16 H21 L18 20 H6 Z" fill="currentColor" opacity="0.8"/>
    <rect x="7" y="11" width="10" height="5" fill="currentColor" opacity="0.6"/>
    <rect x="10" y="7" width="4" height="4" fill="currentColor" opacity="0.9"/>
    <line x1="12" y1="7" x2="12" y2="4" stroke="currentColor" strokeWidth="1.5"/>
    <circle cx="6" cy="13" r="1.5" stroke="currentColor" strokeWidth="1" fill="none"/>
    <circle cx="18" cy="13" r="1.5" stroke="currentColor" strokeWidth="1" fill="none"/>
  </svg>
);

const GomokuIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
    <line x1="6" y1="3" x2="6" y2="21" stroke="currentColor" strokeWidth="1" opacity="0.5"/>
    <line x1="12" y1="3" x2="12" y2="21" stroke="currentColor" strokeWidth="1" opacity="0.5"/>
    <line x1="18" y1="3" x2="18" y2="21" stroke="currentColor" strokeWidth="1" opacity="0.5"/>
    <line x1="3" y1="6" x2="21" y2="6" stroke="currentColor" strokeWidth="1" opacity="0.5"/>
    <line x1="3" y1="12" x2="21" y2="12" stroke="currentColor" strokeWidth="1" opacity="0.5"/>
    <line x1="3" y1="18" x2="21" y2="18" stroke="currentColor" strokeWidth="1" opacity="0.5"/>
    <circle cx="6" cy="6" r="2.5" fill="currentColor"/>
    <circle cx="12" cy="12" r="2.5" fill="currentColor"/>
    <circle cx="18" cy="18" r="2.5" fill="currentColor"/>
    <circle cx="18" cy="6" r="2.5" stroke="currentColor" strokeWidth="1.5"/>
    <circle cx="6" cy="18" r="2.5" stroke="currentColor" strokeWidth="1.5"/>
  </svg>
);

const BackgammonIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
    <rect x="2" y="3" width="20" height="18" rx="1.5" stroke="currentColor" strokeWidth="1.5"/>
    <line x1="12" y1="3" x2="12" y2="21" stroke="currentColor" strokeWidth="1" opacity="0.5"/>
    <polygon points="4,4 7,4 5.5,11" fill="currentColor" opacity="0.8"/>
    <polygon points="9,4 12,4 10.5,11" fill="currentColor" opacity="0.4"/>
    <polygon points="4,20 7,20 5.5,13" fill="currentColor" opacity="0.4"/>
    <polygon points="9,20 12,20 10.5,13" fill="currentColor" opacity="0.8"/>
    <circle cx="5.5" cy="12" r="1.5" fill="currentColor"/>
    <circle cx="18.5" cy="12" r="1.5" stroke="currentColor" strokeWidth="1.5"/>
  </svg>
);

const DotsBoxesIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
    <circle cx="5" cy="5" r="1.5" fill="currentColor"/>
    <circle cx="12" cy="5" r="1.5" fill="currentColor"/>
    <circle cx="19" cy="5" r="1.5" fill="currentColor"/>
    <circle cx="5" cy="12" r="1.5" fill="currentColor"/>
    <circle cx="12" cy="12" r="1.5" fill="currentColor"/>
    <circle cx="19" cy="12" r="1.5" fill="currentColor"/>
    <circle cx="5" cy="19" r="1.5" fill="currentColor"/>
    <circle cx="12" cy="19" r="1.5" fill="currentColor"/>
    <circle cx="19" cy="19" r="1.5" fill="currentColor"/>
    <line x1="5" y1="5" x2="12" y2="5" stroke="currentColor" strokeWidth="1.5"/>
    <line x1="5" y1="5" x2="5" y2="12" stroke="currentColor" strokeWidth="1.5"/>
    <line x1="12" y1="5" x2="12" y2="12" stroke="currentColor" strokeWidth="1.5"/>
    <line x1="5" y1="12" x2="12" y2="12" stroke="currentColor" strokeWidth="1.5"/>
    <rect x="5" y="5" width="7" height="7" fill="currentColor" fillOpacity="0.15"/>
    <line x1="12" y1="12" x2="19" y2="12" stroke="currentColor" strokeWidth="1.5" strokeDasharray="2 2" opacity="0.5"/>
  </svg>
);

const BreakoutIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
    <rect x="2" y="3" width="5" height="3" rx="0.5" fill="currentColor" opacity="0.9"/>
    <rect x="9" y="3" width="5" height="3" rx="0.5" fill="currentColor" opacity="0.6"/>
    <rect x="16" y="3" width="6" height="3" rx="0.5" fill="currentColor" opacity="0.9"/>
    <rect x="2" y="8" width="5" height="3" rx="0.5" fill="currentColor" opacity="0.6"/>
    <rect x="9" y="8" width="5" height="3" rx="0.5" fill="currentColor" opacity="0.3"/>
    <rect x="16" y="8" width="6" height="3" rx="0.5" fill="currentColor" opacity="0.6"/>
    <circle cx="14" cy="16" r="2" fill="currentColor"/>
    <rect x="7" y="20" width="10" height="2.5" rx="1.5" fill="currentColor"/>
  </svg>
);

const SpaceInvIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
    <rect x="8" y="4" width="8" height="5" rx="1" fill="currentColor"/>
    <rect x="5" y="7" width="14" height="6" rx="1" fill="currentColor"/>
    <rect x="3" y="11" width="4" height="3" rx="0.5" fill="currentColor"/>
    <rect x="17" y="11" width="4" height="3" rx="0.5" fill="currentColor"/>
    <rect x="7" y="13" width="3" height="2" rx="0.5" fill="currentColor" opacity="0.3"/>
    <rect x="14" y="13" width="3" height="2" rx="0.5" fill="currentColor" opacity="0.3"/>
    <rect x="5" y="15" width="2" height="3" rx="0.5" fill="currentColor"/>
    <rect x="17" y="15" width="2" height="3" rx="0.5" fill="currentColor"/>
    <line x1="12" y1="19" x2="12" y2="22" stroke="currentColor" strokeWidth="2"/>
  </svg>
);

const ZenGardenIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
    <path d="M3 18 Q8 10 12 14 Q16 18 21 10" stroke="currentColor" strokeWidth="1.5" fill="none"/>
    <path d="M3 21 Q8 13 12 17 Q16 21 21 13" stroke="currentColor" strokeWidth="1.5" fill="none" opacity="0.5"/>
    <circle cx="12" cy="8" r="3" stroke="currentColor" strokeWidth="1.5"/>
    <circle cx="12" cy="8" r="1" fill="currentColor"/>
  </svg>
);

const ColoringIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
    <path d="M15 3 L21 9 L9 21 L3 21 L3 15 Z" stroke="currentColor" strokeWidth="1.5" fill="currentColor" fillOpacity="0.2"/>
    <line x1="13" y1="5" x2="19" y2="11" stroke="currentColor" strokeWidth="1.5"/>
    <circle cx="5.5" cy="18.5" r="2" fill="currentColor"/>
  </svg>
);

const NumberMatchIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
    <rect x="2" y="2" width="9" height="9" rx="1.5" stroke="currentColor" strokeWidth="1.5"/>
    <rect x="13" y="2" width="9" height="9" rx="1.5" stroke="currentColor" strokeWidth="1.5"/>
    <rect x="2" y="13" width="9" height="9" rx="1.5" stroke="currentColor" strokeWidth="1.5"/>
    <rect x="13" y="13" width="9" height="9" rx="1.5" fill="currentColor" fillOpacity="0.2" stroke="currentColor" strokeWidth="1.5"/>
    <text x="6.5" y="10.5" fontSize="7" fontWeight="bold" textAnchor="middle" fill="currentColor" fontFamily="monospace">7</text>
    <text x="17.5" y="10.5" fontSize="7" fontWeight="bold" textAnchor="middle" fill="currentColor" fontFamily="monospace">3</text>
    <text x="6.5" y="21.5" fontSize="7" fontWeight="bold" textAnchor="middle" fill="currentColor" fontFamily="monospace">5</text>
    <text x="17.5" y="21.5" fontSize="7" fontWeight="bold" textAnchor="middle" fill="currentColor" fontFamily="monospace">7</text>
  </svg>
);

const NonogramIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
    <rect x="2" y="8" width="22" height="16" rx="1" stroke="currentColor" strokeWidth="1.5"/>
    <line x1="2" y1="8" x2="24" y2="8" stroke="currentColor" strokeWidth="1"/>
    <rect x="4" y="10.5" width="3" height="3" rx="0.3" fill="currentColor"/>
    <rect x="9" y="10.5" width="3" height="3" rx="0.3" fill="currentColor"/>
    <rect x="14" y="10.5" width="3" height="3" rx="0.3" fill="currentColor" opacity="0.3"/>
    <rect x="19" y="10.5" width="3" height="3" rx="0.3" fill="currentColor"/>
    <rect x="4" y="15.5" width="3" height="3" rx="0.3" fill="currentColor" opacity="0.3"/>
    <rect x="9" y="15.5" width="3" height="3" rx="0.3" fill="currentColor"/>
    <rect x="14" y="15.5" width="3" height="3" rx="0.3" fill="currentColor"/>
    <rect x="19" y="15.5" width="3" height="3" rx="0.3" fill="currentColor" opacity="0.3"/>
    <text x="4" y="7" fontSize="3.5" fill="currentColor" fontFamily="monospace">2</text>
    <text x="9" y="7" fontSize="3.5" fill="currentColor" fontFamily="monospace">1,2</text>
    <text x="15" y="7" fontSize="3.5" fill="currentColor" fontFamily="monospace">2</text>
    <text x="20" y="7" fontSize="3.5" fill="currentColor" fontFamily="monospace">1</text>
  </svg>
);

const SlidingPuzzleIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
    <rect x="2" y="2" width="20" height="20" rx="2" stroke="currentColor" strokeWidth="1.5"/>
    <rect x="3.5" y="3.5" width="5" height="5" rx="0.5" fill="currentColor"/>
    <rect x="10" y="3.5" width="5" height="5" rx="0.5" fill="currentColor"/>
    <rect x="16.5" y="3.5" width="4" height="5" rx="0.5" fill="currentColor" opacity="0.5"/>
    <rect x="3.5" y="10" width="5" height="5" rx="0.5" fill="currentColor" opacity="0.5"/>
    <rect x="10" y="10" width="5" height="5" rx="0.5" fill="currentColor"/>
    <rect x="16.5" y="10" width="4" height="5" rx="0.5" fill="currentColor"/>
    <rect x="3.5" y="16.5" width="5" height="4" rx="0.5" fill="currentColor"/>
    <rect x="10" y="16.5" width="5" height="4" rx="0.5" fill="currentColor" opacity="0.5"/>
    {/* empty slot */}
    <rect x="16.5" y="16.5" width="4" height="4" rx="0.5" stroke="currentColor" strokeWidth="1" strokeDasharray="2,1" fill="none" opacity="0.4"/>
  </svg>
);

const MemoryMatchIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
    <rect x="2" y="2" width="9" height="9" rx="1.5" stroke="currentColor" strokeWidth="1.5" fill="currentColor" fillOpacity="0.15"/>
    <rect x="13" y="2" width="9" height="9" rx="1.5" stroke="currentColor" strokeWidth="1.5"/>
    <rect x="2" y="13" width="9" height="9" rx="1.5" stroke="currentColor" strokeWidth="1.5"/>
    <rect x="13" y="13" width="9" height="9" rx="1.5" stroke="currentColor" strokeWidth="1.5" fill="currentColor" fillOpacity="0.15"/>
    <path d="M5 7 L6.5 9 L9 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
    <path d="M16 7 L17.5 9 L20 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
  </svg>
);

const WhackAMoleIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
    <ellipse cx="12" cy="18" rx="10" ry="4" stroke="currentColor" strokeWidth="1.5" fill="currentColor" fillOpacity="0.1"/>
    <ellipse cx="6" cy="17" rx="3" ry="2" fill="currentColor" opacity="0.3"/>
    <ellipse cx="18" cy="17" rx="3" ry="2" fill="currentColor" opacity="0.3"/>
    <path d="M9 9 C9 6 10 4 12 4 C14 4 15 6 15 9 C15 11 14 12.5 12 13 C10 12.5 9 11 9 9Z" fill="currentColor"/>
    <circle cx="10.5" cy="8.5" r="1" fill="white" opacity="0.8"/>
    <circle cx="13.5" cy="8.5" r="1" fill="white" opacity="0.8"/>
    {/* Hammer */}
    <rect x="16" y="3" width="6" height="3" rx="1" fill="currentColor" opacity="0.7"/>
    <line x1="19" y1="6" x2="19" y2="10" stroke="currentColor" strokeWidth="1.2"/>
  </svg>
);

const TypingRaceIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
    <rect x="2" y="6" width="20" height="14" rx="2" stroke="currentColor" strokeWidth="1.5"/>
    <rect x="4" y="9" width="3" height="2.5" rx="0.5" fill="currentColor" opacity="0.7"/>
    <rect x="8.5" y="9" width="3" height="2.5" rx="0.5" fill="currentColor" opacity="0.7"/>
    <rect x="13" y="9" width="3" height="2.5" rx="0.5" fill="currentColor" opacity="0.7"/>
    <rect x="17" y="9" width="3" height="2.5" rx="0.5" fill="currentColor" opacity="0.7"/>
    <rect x="4" y="13" width="3" height="2.5" rx="0.5" fill="currentColor" opacity="0.7"/>
    <rect x="8.5" y="13" width="3" height="2.5" rx="0.5" fill="currentColor" opacity="0.5"/>
    <rect x="13" y="13" width="3" height="2.5" rx="0.5" fill="currentColor" opacity="0.7"/>
    <rect x="17" y="13" width="3" height="2.5" rx="0.5" fill="currentColor" opacity="0.7"/>
    <rect x="7" y="17" width="10" height="2" rx="1" fill="currentColor" opacity="0.5"/>
    {/* cursor blink */}
    <line x1="13" y1="14.5" x2="16" y2="14.5" stroke="currentColor" strokeWidth="2" opacity="0.9"/>
  </svg>
);

const LogicGridIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
    <rect x="2" y="2" width="20" height="20" rx="1.5" stroke="currentColor" strokeWidth="1.5"/>
    <line x1="8" y1="2" x2="8" y2="22" stroke="currentColor" strokeWidth="1" opacity="0.5"/>
    <line x1="14" y1="2" x2="14" y2="22" stroke="currentColor" strokeWidth="1" opacity="0.5"/>
    <line x1="2" y1="8" x2="22" y2="8" stroke="currentColor" strokeWidth="1" opacity="0.5"/>
    <line x1="2" y1="14" x2="22" y2="14" stroke="currentColor" strokeWidth="1" opacity="0.5"/>
    <path d="M3.5 3.5 L6.5 6.5 M6.5 3.5 L3.5 6.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
    <circle cx="11" cy="5" r="1.5" stroke="currentColor" strokeWidth="1.2"/>
    <path d="M4 11 L5.5 13 L7 11" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/>
    <circle cx="11" cy="11" r="1.5" fill="currentColor"/>
    <path d="M15.5 3.5 L17 5 L20.5 3.5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/>
  </svg>
);

// ─── New icons for batch 2 ────────────────────────────────────────────────────

const ReactionClickIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
    {/* Cursor */}
    <path d="M5 3 L5 17 L8.5 13.5 L11.5 19 L13.5 18 L10.5 12 L15 12 Z" fill="currentColor" fillOpacity="0.85"/>
    {/* Zap / click burst */}
    <line x1="17" y1="5" x2="20" y2="2" stroke="currentColor" strokeWidth="1.5" opacity="0.7"/>
    <line x1="20" y1="8" x2="23" y2="8" stroke="currentColor" strokeWidth="1.5" opacity="0.7"/>
    <line x1="17" y1="11" x2="20" y2="14" stroke="currentColor" strokeWidth="1.5" opacity="0.7"/>
  </svg>
);

const DodgeIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
    {/* Top-down car */}
    <rect x="8" y="5" width="8" height="14" rx="3" fill="currentColor" fillOpacity="0.8"/>
    <rect x="9" y="7" width="6" height="5" rx="1" fill="currentColor" fillOpacity="0.3"/>
    <circle cx="9" cy="6" r="1.5" fill="currentColor" opacity="0.5"/>
    <circle cx="15" cy="6" r="1.5" fill="currentColor" opacity="0.5"/>
    <circle cx="9" cy="18" r="1.5" fill="currentColor" opacity="0.5"/>
    <circle cx="15" cy="18" r="1.5" fill="currentColor" opacity="0.5"/>
    {/* Dodge arrows */}
    <path d="M3 10 L1 12 L3 14" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" opacity="0.6"/>
    <path d="M21 10 L23 12 L21 14" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" opacity="0.6"/>
  </svg>
);

const ColorSwitchIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
    {/* Ring split in 4 colors */}
    <path d="M12 3 A9 9 0 0 1 21 12" stroke="currentColor" strokeWidth="5" strokeLinecap="butt" opacity="0.9"/>
    <path d="M21 12 A9 9 0 0 1 12 21" stroke="currentColor" strokeWidth="5" strokeLinecap="butt" opacity="0.5"/>
    <path d="M12 21 A9 9 0 0 1 3 12" stroke="currentColor" strokeWidth="5" strokeLinecap="butt" opacity="0.25"/>
    <path d="M3 12 A9 9 0 0 1 12 3" stroke="currentColor" strokeWidth="5" strokeLinecap="butt" opacity="0.7"/>
    {/* Ball */}
    <circle cx="12" cy="12" r="3" fill="currentColor"/>
  </svg>
);

const TileMatchZenIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
    <rect x="2" y="2" width="6" height="6" rx="1" fill="currentColor" opacity="0.9"/>
    <rect x="9" y="2" width="6" height="6" rx="1" fill="currentColor" opacity="0.9"/>
    <rect x="16" y="2" width="6" height="6" rx="1" fill="currentColor" opacity="0.5"/>
    <rect x="2" y="9" width="6" height="6" rx="1" fill="currentColor" opacity="0.5"/>
    <rect x="9" y="9" width="6" height="6" rx="1" fill="currentColor" opacity="0.9"/>
    <rect x="16" y="9" width="6" height="6" rx="1" fill="currentColor" opacity="0.9"/>
    <rect x="2" y="16" width="6" height="6" rx="1" fill="currentColor" opacity="0.3"/>
    <rect x="9" y="16" width="6" height="6" rx="1" fill="currentColor" opacity="0.5"/>
    <rect x="16" y="16" width="6" height="6" rx="1" fill="currentColor" opacity="0.3"/>
    {/* Pop burst on matching tile */}
    <line x1="9" y1="9" x2="7" y2="7" stroke="currentColor" strokeWidth="1" opacity="0.4"/>
    <line x1="15" y1="9" x2="17" y2="7" stroke="currentColor" strokeWidth="1" opacity="0.4"/>
    <line x1="12" y1="9" x2="12" y2="6" stroke="currentColor" strokeWidth="1" opacity="0.4"/>
  </svg>
);

const FidgetSpinnerIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
    {/* 3-blade spinner */}
    <circle cx="12" cy="12" r="2" fill="currentColor"/>
    <ellipse cx="12" cy="6" rx="3.5" ry="5" fill="currentColor" fillOpacity="0.8"/>
    <ellipse cx="17.2" cy="15" rx="3.5" ry="5" transform="rotate(120 17.2 15)" fill="currentColor" fillOpacity="0.6"/>
    <ellipse cx="6.8" cy="15" rx="3.5" ry="5" transform="rotate(240 6.8 15)" fill="currentColor" fillOpacity="0.4"/>
    {/* Motion arc */}
    <path d="M18 4 Q22 8 20 12" stroke="currentColor" strokeWidth="1" strokeDasharray="2 2" opacity="0.4" fill="none"/>
  </svg>
);

const BallDropIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
    {/* Plinko pegs */}
    <circle cx="12" cy="5" r="1.2" fill="currentColor" opacity="0.5"/>
    <circle cx="8" cy="9" r="1.2" fill="currentColor" opacity="0.5"/>
    <circle cx="16" cy="9" r="1.2" fill="currentColor" opacity="0.5"/>
    <circle cx="6" cy="13" r="1.2" fill="currentColor" opacity="0.5"/>
    <circle cx="12" cy="13" r="1.2" fill="currentColor" opacity="0.5"/>
    <circle cx="18" cy="13" r="1.2" fill="currentColor" opacity="0.5"/>
    {/* Slots at bottom */}
    <rect x="2" y="19" width="4" height="3" rx="0.5" stroke="currentColor" strokeWidth="1" fill="none" opacity="0.5"/>
    <rect x="7" y="19" width="4" height="3" rx="0.5" stroke="currentColor" strokeWidth="1" fill="none" opacity="0.5"/>
    <rect x="12" y="19" width="4" height="3" rx="0.5" stroke="currentColor" strokeWidth="1" fill="none" opacity="0.5"/>
    <rect x="17" y="19" width="4" height="3" rx="0.5" stroke="currentColor" strokeWidth="1" fill="none" opacity="0.5"/>
    {/* Falling ball */}
    <circle cx="10" cy="16" r="2" fill="currentColor"/>
  </svg>
);

const PatternDrawingIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
    {/* Symmetrical mandala-style star */}
    <path d="M12 3 L13.5 9 L19 7 L14.5 11 L21 12 L14.5 13 L19 17 L13.5 15 L12 21 L10.5 15 L5 17 L9.5 13 L3 12 L9.5 11 L5 7 L10.5 9 Z"
      fill="currentColor" fillOpacity="0.2" stroke="currentColor" strokeWidth="1.2" strokeLinejoin="round"/>
    <circle cx="12" cy="12" r="2.5" fill="currentColor"/>
  </svg>
);

const CalmBreathingIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
    {/* Concentric expanding circles */}
    <circle cx="12" cy="12" r="2" fill="currentColor"/>
    <circle cx="12" cy="12" r="5" stroke="currentColor" strokeWidth="1.2" opacity="0.7"/>
    <circle cx="12" cy="12" r="8" stroke="currentColor" strokeWidth="1" opacity="0.4"/>
    <circle cx="12" cy="12" r="10.5" stroke="currentColor" strokeWidth="0.8" opacity="0.2"/>
  </svg>
);

const ShapeSortingIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
    {/* Slot outlines */}
    <rect x="2" y="14" width="6" height="6" rx="1" stroke="currentColor" strokeWidth="1.5" strokeDasharray="2 1"/>
    <circle cx="12" cy="17" r="3" stroke="currentColor" strokeWidth="1.5" strokeDasharray="2 1"/>
    <path d="M17 14 L20 14 L21.5 17 L20 20 L17 20 L15.5 17 Z" stroke="currentColor" strokeWidth="1.5" strokeDasharray="2 1"/>
    {/* Pieces floating above */}
    <rect x="2" y="4" width="5" height="5" rx="1" fill="currentColor" opacity="0.9"/>
    <circle cx="12" cy="7" r="2.5" fill="currentColor" opacity="0.7"/>
    <path d="M17.5 4 L20 4 L21 6.5 L20 9 L17.5 9 L16.5 6.5 Z" fill="currentColor" opacity="0.5"/>
    {/* Drop arrows */}
    <line x1="4.5" y1="9" x2="4.5" y2="13" stroke="currentColor" strokeWidth="1" opacity="0.4"/>
    <line x1="12" y1="10" x2="12" y2="13" stroke="currentColor" strokeWidth="1" opacity="0.4"/>
    <line x1="18.5" y1="9" x2="18.5" y2="13" stroke="currentColor" strokeWidth="1" opacity="0.4"/>
  </svg>
);

const DotSketchIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
    {/* Connected numbered dots forming a star-like shape */}
    <circle cx="12" cy="3" r="1.8" fill="currentColor"/>
    <circle cx="20" cy="9" r="1.8" fill="currentColor"/>
    <circle cx="17" cy="19" r="1.8" fill="currentColor"/>
    <circle cx="7" cy="19" r="1.8" fill="currentColor"/>
    <circle cx="4" cy="9" r="1.8" fill="currentColor"/>
    {/* Lines connecting them */}
    <polyline points="12,3 20,9 17,19 7,19 4,9 12,3" stroke="currentColor" strokeWidth="1.5" fill="none" strokeLinejoin="round"/>
    {/* Numbers */}
    <text x="11" y="2.5" fontSize="2.2" fill="currentColor" textAnchor="middle" fontFamily="monospace" dy="0.8">1</text>
    <text x="20" y="9" fontSize="2.2" fill="currentColor" textAnchor="middle" fontFamily="monospace" dy="0.8">2</text>
  </svg>
);

const SpaceImpactIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
    {/* Nokia-style spaceship (side view) */}
    <path d="M3 12 L8 9 L8 15 Z" fill="currentColor"/>
    <rect x="7" y="10" width="10" height="4" rx="1" fill="currentColor"/>
    <rect x="15" y="9" width="4" height="6" rx="1" fill="currentColor" opacity="0.7"/>
    {/* Cannon */}
    <rect x="19" y="11.5" width="3" height="1.5" rx="0.5" fill="currentColor"/>
    {/* Bullet */}
    <rect x="19" y="8" width="2" height="1.5" rx="0.5" fill="currentColor" opacity="0.6"/>
    {/* Enemy */}
    <rect x="19" y="4" width="4" height="3" rx="0.5" fill="currentColor" opacity="0.4"/>
    <rect x="20" y="6.5" width="2" height="1.5" rx="0.3" fill="currentColor" opacity="0.4"/>
    {/* Stars */}
    <circle cx="2" cy="4" r="0.7" fill="currentColor" opacity="0.4"/>
    <circle cx="6" cy="20" r="0.7" fill="currentColor" opacity="0.4"/>
    <circle cx="14" cy="3" r="0.7" fill="currentColor" opacity="0.4"/>
  </svg>
);

const TopDownRacerIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
    {/* Road */}
    <rect x="7" y="2" width="10" height="20" rx="1" fill="currentColor" fillOpacity="0.1" stroke="currentColor" strokeWidth="1" opacity="0.3"/>
    {/* Road markings */}
    <rect x="11.5" y="3" width="1" height="4" rx="0.3" fill="currentColor" opacity="0.3"/>
    <rect x="11.5" y="10" width="1" height="4" rx="0.3" fill="currentColor" opacity="0.3"/>
    <rect x="11.5" y="17" width="1" height="4" rx="0.3" fill="currentColor" opacity="0.3"/>
    {/* Player car (top-down) */}
    <rect x="9" y="14" width="6" height="8" rx="2" fill="currentColor"/>
    <rect x="10" y="15.5" width="4" height="3.5" rx="0.5" fill="currentColor" opacity="0.3"/>
    <circle cx="9.5" cy="15" r="1" fill="currentColor" opacity="0.6"/>
    <circle cx="14.5" cy="15" r="1" fill="currentColor" opacity="0.6"/>
    {/* Traffic car (enemy) */}
    <rect x="9" y="4" width="6" height="8" rx="2" fill="currentColor" opacity="0.4"/>
    <circle cx="9.5" cy="11" r="1" fill="currentColor" opacity="0.3"/>
    <circle cx="14.5" cy="11" r="1" fill="currentColor" opacity="0.3"/>
  </svg>
);

const ChromeDinoIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
    {/* Ground line */}
    <line x1="1" y1="19" x2="23" y2="19" stroke="currentColor" strokeWidth="1.5" opacity="0.4"/>
    {/* Cactus (small, background) */}
    <rect x="19" y="14" width="2" height="5" rx="0.3" fill="currentColor" opacity="0.5"/>
    <rect x="17" y="15.5" width="2" height="1.5" rx="0.3" fill="currentColor" opacity="0.5"/>
    {/* Dino body */}
    <rect x="7" y="9" width="7" height="6" rx="1" fill="currentColor"/>
    {/* Dino head */}
    <rect x="13" y="6" width="5" height="5" rx="1" fill="currentColor"/>
    {/* Eye */}
    <circle cx="17" cy="7.5" r="0.8" fill="white" opacity="0.9"/>
    {/* Beak/mouth */}
    <rect x="17" y="10" width="2" height="1" rx="0.3" fill="currentColor"/>
    {/* Tail */}
    <rect x="4" y="12" width="4" height="2" rx="0.5" fill="currentColor"/>
    {/* Legs (running) */}
    <rect x="8" y="15" width="2" height="4" rx="0.5" fill="currentColor"/>
    <rect x="11" y="15" width="2" height="3" rx="0.5" fill="currentColor"/>
  </svg>
);

const NeonMazeIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
    {/* Maze walls */}
    <rect x="2" y="2" width="20" height="20" rx="1.5" stroke="currentColor" strokeWidth="1.5" fill="none"/>
    <polyline points="2,8 8,8 8,2" stroke="currentColor" strokeWidth="1.5" fill="none"/>
    <polyline points="14,2 14,8 20,8" stroke="currentColor" strokeWidth="1.5" fill="none"/>
    <polyline points="2,14 8,14 8,22" stroke="currentColor" strokeWidth="1.5" fill="none"/>
    <polyline points="14,22 14,16 20,16 20,10" stroke="currentColor" strokeWidth="1.5" fill="none"/>
    <line x1="10" y1="11" x2="14" y2="11" stroke="currentColor" strokeWidth="1.5"/>
    {/* Player dot */}
    <circle cx="5" cy="11" r="2" fill="currentColor"/>
    {/* Pellet */}
    <circle cx="19" cy="19" r="1.2" fill="currentColor" opacity="0.5"/>
  </svg>
);

const SpeedCrosswordIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
    <rect x="2" y="2" width="20" height="20" rx="1.5" stroke="currentColor" strokeWidth="1.5"/>
    <rect x="2" y="2" width="5" height="5" fill="currentColor" opacity="0.8"/>
    <rect x="17" y="2" width="5" height="5" fill="currentColor" opacity="0.8"/>
    <rect x="2" y="17" width="5" height="5" fill="currentColor" opacity="0.8"/>
    <rect x="17" y="17" width="5" height="5" fill="currentColor" opacity="0.8"/>
    <rect x="9.5" y="9.5" width="5" height="5" fill="currentColor" opacity="0.4"/>
    <line x1="7" y1="12" x2="17" y2="12" stroke="currentColor" strokeWidth="1.5" opacity="0.6"/>
    <line x1="12" y1="7" x2="12" y2="17" stroke="currentColor" strokeWidth="1.5" opacity="0.6"/>
    {/* speed lines */}
    <line x1="4" y1="10" x2="8" y2="10" stroke="currentColor" strokeWidth="1" opacity="0.5"/>
    <line x1="3" y1="12" x2="6" y2="12" stroke="currentColor" strokeWidth="1" opacity="0.3"/>
  </svg>
);

// ─── Main icon map ────────────────────────────────────────────────────────────

export type GameId =
  | "tic-tac-toe" | "connect-four" | "blackjack" | "sudoku" | "2048"
  | "snake" | "pong" | "bubble-pop" | string;

export const gameIconMap: Record<string, ReactNode> = {
  // ── Already-set Phase 1 icons ──────────────────────────────────────────────
  "tic-tac-toe":      <Hash className="w-full h-full" />,
  "connect-four":     <Grid2X2 className="w-full h-full" />,
  "blackjack":        <Spade className="w-full h-full" />,
  "sudoku":           <Grid3X3 className="w-full h-full" />,
  "2048":             <Layers className="w-full h-full" />,
  "snake":            <Activity className="w-full h-full" />,
  "pong":             <Orbit className="w-full h-full" />,
  "bubble-pop":       <Circle className="w-full h-full" />,

  // ── New icons ──────────────────────────────────────────────────────────────
  // Board games
  "checkers":         <CheckerboardIcon />,
  "chess":            <ChessKnightIcon />,
  "reversi":          <ReversiIcon />,
  "ludo":             <LudoIcon />,
  "backgammon":       <BackgammonIcon />,
  "gomoku":           <GomokuIcon />,
  "battleship":       <BattleshipIcon />,
  "dots-and-boxes":   <DotsBoxesIcon />,

  // Card games
  "poker":             <PokerChipIcon />,
  "solitaire":        <SolitaireIcon />,
  "war":              <Swords className="w-full h-full" />,
  "high-low":         <TrendingUp className="w-full h-full" />,
  "go-fish":          <Fish className="w-full h-full" />,
  "crazy-eights":     <Shuffle className="w-full h-full" />,

  // Puzzle games
  "minesweeper":      <Bomb className="w-full h-full" />,
  "sliding-15":       <SlidingPuzzleIcon />,
  "nonogram":         <NonogramIcon />,
  "memory-match":     <MemoryMatchIcon />,

  // Arcade games
  "breakout":         <BreakoutIcon />,
  "space-invaders":   <SpaceInvIcon />,
  "flappy-bird":      <Bird className="w-full h-full" />,
  "whack-a-mole":     <WhackAMoleIcon />,
  "typing-race":      <TypingRaceIcon />,

  // Relax games
  "zen-garden":       <ZenGardenIcon />,
  "coloring-book":    <ColoringIcon />,

  // Colour / matching
  "uno":               <ColorSwatchIcon />,
  "number-match":     <NumberMatchIcon />,

  // Brain / skill
  "math-duel":        <Calculator className="w-full h-full" />,
  "reaction-memory":  <Timer className="w-full h-full" />,
  "pattern-recall":   <Eye className="w-full h-full" />,
  "speed-crossword":  <SpeedCrosswordIcon />,
  "logic-grid":       <LogicGridIcon />,

  // New arcade (added this session)
  "maze-chase":         <NeonMazeIcon />,
  "retro-commando":     <Crosshair className="w-full h-full" />,

  // ── Batch 2 icons ──────────────────────────────────────────────────────────
  // Arcade
  "reaction-click":     <ReactionClickIcon />,
  "dodge-obstacles":    <DodgeIcon />,
  "color-switch":       <ColorSwitchIcon />,
  "space-impact":       <SpaceImpactIcon />,
  "top-down-racer":     <TopDownRacerIcon />,
  "chrome-dino":        <ChromeDinoIcon />,

  // Relax
  "tile-matching-zen":  <TileMatchZenIcon />,
  "idle-clicker":       <MousePointerClick className="w-full h-full" />,
  "sand-simulation":    <Hourglass className="w-full h-full" />,
  "fidget-spinner":     <FidgetSpinnerIcon />,
  "ball-drop":          <BallDropIcon />,
  "jigsaw-puzzle":      <Puzzle className="w-full h-full" />,
  "pattern-drawing":    <PatternDrawingIcon />,
  "calm-breathing":     <CalmBreathingIcon />,
  "shape-sorting":      <ShapeSortingIcon />,
  "dot-connecting":     <DotSketchIcon />,
};

// ─── Component ────────────────────────────────────────────────────────────────

interface GameIconProps {
  gameId: string;
  className?: string;
  gameTitle?: string;
}

export function GameIcon({ gameId, className = "w-12 h-12", gameTitle = "Game" }: GameIconProps) {
  const icon = gameIconMap[gameId] ?? <Gamepad2 className="w-full h-full" />;
  return (
    <div className={className} aria-label={`${gameTitle} icon`} role="img">
      {icon}
    </div>
  );
}

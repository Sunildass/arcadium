import { ArcadiumTheme } from './theme.types';

export const GLOBAL_THEME: ArcadiumTheme = {
  id: 'arcade-retro-global',
  palette: {
    primary: '#4f46e5',     // indigo-600
    secondary: '#818cf8',   // indigo-400
    accent: '#f43f5e',      // rose-500
    background: '#09090b',  // zinc-950
    surface: '#18181b',     // zinc-900
    textPrimary: '#fafafa', // zinc-50
    textSecondary: '#a1a1aa'// zinc-400
  },
  typography: {
    headingFont: '"Bebas Neue", "Impact", sans-serif',
    bodyFont: '"Inter", "Roboto", sans-serif',
    scoreFont: '"Press Start 2P", monospace'
  },
  effects: {
    glow: true,
    scanlines: true,
    neonShadows: true,
    grainOverlay: true
  },
  backgroundStyle: {
    gradient: 'linear-gradient(135deg, #09090b 0%, #18181b 100%)',
    animated: false
  }
};

export const CATEGORY_THEMES: Record<string, ArcadiumTheme> = {
  'board': {
    id: 'board-strategy',
    palette: {
      primary: '#059669',     // emerald-600
      secondary: '#34d399',   // emerald-400
      accent: '#d97706',      // amber-600
      background: '#064e3b',  // emerald-900
      surface: '#022c22',     // emerald-950
      textPrimary: '#f8fafc', // slate-50
      textSecondary: '#94a3b8'// slate-400
    },
    typography: {
      headingFont: '"Playfair Display", "Merriweather", serif',
      bodyFont: '"Inter", "Roboto", sans-serif',
      scoreFont: '"Cormorant Garamond", serif'
    },
    effects: {
      glow: false,
      grainOverlay: true
    },
    backgroundStyle: {
      gradient: 'linear-gradient(135deg, #064e3b 0%, #022c22 100%)'
    }
  },
  'cards': {
    id: 'card-lounge',
    palette: {
      primary: '#ef4444',     // red-500
      secondary: '#fca5a5',   // red-300
      accent: '#eab308',      // gold
      background: '#450a0a',  // red-950 (Revert background to match board logic structurally)
      surface: '#2e0404',     // Dark maroon (Remove gray, structure parity)
      textPrimary: '#fef2f2', // red-50
      textSecondary: '#fca5a5'// red-300
    },
    typography: {
      headingFont: '"Cinzel", "Times New Roman", serif',
      bodyFont: '"Inter", "Roboto", sans-serif',
      scoreFont: '"Cinzel", serif'
    },
    effects: {
      glow: true,
      grainOverlay: true
    },
    backgroundStyle: {
      gradient: 'radial-gradient(circle at center, #7f1d1d 0%, #450a0a 100%)'
    }
  },
  'puzzle': {
    id: 'puzzle-neuro',
    palette: {
      primary: '#2563eb',     // blue-600
      secondary: '#60a5fa',   // blue-400
      accent: '#c026d3',      // fuchsia-600
      background: '#0f172a',  // slate-900
      surface: '#020617',     // slate-950
      textPrimary: '#f8fafc', // slate-50
      textSecondary: '#94a3b8'// slate-400
    },
    typography: {
      headingFont: '"Space Grotesk", "Orbitron", sans-serif',
      bodyFont: '"Inter", "Roboto", sans-serif',
      scoreFont: '"Orbitron", sans-serif'
    },
    effects: {
      glow: true,
      neonShadows: true
    },
    backgroundStyle: {
      gradient: 'linear-gradient(to bottom right, #0f172a, #020617)'
    }
  },
  'arcade': {
    id: 'arcade-action',
    palette: {
      primary: '#d946ef',     // fuchsia-500
      secondary: '#fb7185',   // rose-400
      accent: '#facc15',      // yellow-400
      background: '#171717',  // neutral-900
      surface: '#0a0a0a',     // neutral-950
      textPrimary: '#fafafa', // neutral-50
      textSecondary: '#a3a3a3'// neutral-400
    },
    typography: {
      headingFont: '"Press Start 2P", "Courier New", monospace',
      bodyFont: '"Inter", "Roboto", sans-serif',
      scoreFont: '"Press Start 2P", monospace'
    },
    effects: {
      glow: true,
      scanlines: true,
      neonShadows: true,
      pixelBorders: true
    },
    backgroundStyle: {
      gradient: 'linear-gradient(135deg, #171717 0%, #0a0a0a 100%)',
      animated: true
    }
  },
  'relax': {
    id: 'zen-relax',
    palette: {
      primary: '#a78bfa',     // violet-400
      secondary: '#818cf8',   // indigo-400
      accent: '#34d399',      // emerald-400
      background: '#1e1b4b',  // indigo-950
      surface: '#312e81',     // indigo-900
      textPrimary: '#e0e7ff', // indigo-100
      textSecondary: '#a5b4fc'// indigo-300
    },
    typography: {
      headingFont: '"Quicksand", "Nunito", sans-serif',
      bodyFont: '"Inter", "Roboto", sans-serif',
      scoreFont: '"Quicksand", sans-serif'
    },
    effects: {
      glow: false,
      grainOverlay: false
    },
    backgroundStyle: {
      gradient: 'linear-gradient(180deg, #1e1b4b 0%, #000000 100%)',
      animated: true
    }
  }
};

export const GAME_THEME_OVERRIDES: Record<string, Partial<ArcadiumTheme>> = {
  'tic-tac-toe': {
    palette: {
      primary: '#38bdf8', // sky-400
      secondary: '#0ea5e9', // sky-500
      accent: '#0284c7', // sky-600
      background: '#082f49', // sky-900
      surface: '#0c4a6e', // sky-950
      textPrimary: '#f0f9ff',
      textSecondary: '#bae6fd'
    },
    effects: { glow: true, scanlines: false }
  },
  'connect-four': {
    palette: {
      primary: '#ef4444', // red-500
      secondary: '#facc15', // yellow-400
      accent: '#2563eb', // blue-600
      background: '#1e3a8a', // blue-900
      surface: '#172554', // blue-950
      textPrimary: '#ffffff',
      textSecondary: '#bfdbfe'
    },
    effects: { glow: true, pixelBorders: false }
  },
  'snake': {
    palette: {
      primary: '#4ade80', // green-400
      secondary: '#22c55e', // green-500
      accent: '#dc2626', // red-600 (apple)
      background: '#052e16', // green-950
      surface: '#064e3b', // emerald-900
      textPrimary: '#f6fff8',
      textSecondary: '#86efac'
    },
    effects: { scanlines: true, neonShadows: true }
  },
  'sudoku': {
    palette: {
      primary: '#14b8a6', // teal-500
      secondary: '#0d9488', // teal-600
      accent: '#0f766e', // teal-700
      background: '#111827', // gray-900
      surface: '#1f2937', // gray-800
      textPrimary: '#f9fafb',
      textSecondary: '#9ca3af'
    },
    effects: { glow: false, scanlines: false, grainOverlay: false }
  },
  'pong': {
    palette: {
      primary: '#ffffff',
      secondary: '#a3a3a3',
      accent: '#e5e5e5',
      background: '#000000',
      surface: '#171717',
      textPrimary: '#ffffff',
      textSecondary: '#737373'
    },
    effects: { scanlines: true, neonShadows: true, glow: true }
  },
  'bubble-pop': {
    palette: {
      primary: '#d8b4fe', // purple-300
      secondary: '#e879f9', // fuchsia-400
      accent: '#38bdf8', // sky-400
      background: '#2e1065', // purple-950
      surface: '#4a044e', // fuchsia-950
      textPrimary: '#fdf4ff',
      textSecondary: '#f5d0fe'
    },
    effects: { glow: true, animated: true } as any // Type override safe spread
  }
};

export function resolveTheme(categoryId?: string, gameId?: string): ArcadiumTheme {
  let theme = { ...GLOBAL_THEME };
  
  if (categoryId && CATEGORY_THEMES[categoryId]) {
    theme = { ...theme, ...CATEGORY_THEMES[categoryId] };
  }

  if (gameId && GAME_THEME_OVERRIDES[gameId]) {
    // Deep merge for palette and effects
    const override = GAME_THEME_OVERRIDES[gameId];
    theme = {
      ...theme,
      ...override,
      palette: { ...theme.palette, ...(override.palette || {}) },
      typography: { ...theme.typography, ...(override.typography || {}) },
      effects: { ...theme.effects, ...(override.effects || {}) },
      backgroundStyle: { ...theme.backgroundStyle, ...(override.backgroundStyle || {}) },
    };
  }

  return theme;
}

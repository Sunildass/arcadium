import React, { createContext, useContext, useMemo, useEffect } from 'react';
import { ArcadiumTheme } from './theme.types';
import { resolveTheme } from './theme.registry';

interface ThemeContextType {
  theme: ArcadiumTheme;
  setThemeContext: (categoryId?: string, gameId?: string) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [categoryId, setCategoryId] = React.useState<string | undefined>(undefined);
  const [gameId, setGameId] = React.useState<string | undefined>(undefined);

  const theme = useMemo(() => resolveTheme(categoryId, gameId), [categoryId, gameId]);

  const setThemeContext = React.useCallback((newCategoryId?: string, newGameId?: string) => {
    setCategoryId(newCategoryId);
    setGameId(newGameId);
  }, []);

  useEffect(() => {
    // Inject CSS variables directly into document root
    const root = document.documentElement;
    root.style.setProperty('--color-primary', theme.palette.primary);
    root.style.setProperty('--color-secondary', theme.palette.secondary);
    root.style.setProperty('--color-accent', theme.palette.accent);
    root.style.setProperty('--color-background', theme.palette.background);
    root.style.setProperty('--color-surface', theme.palette.surface);
    root.style.setProperty('--color-text-primary', theme.palette.textPrimary);
    root.style.setProperty('--color-text-secondary', theme.palette.textSecondary);
    
    root.style.setProperty('--font-heading', theme.typography.headingFont);
    root.style.setProperty('--font-body', theme.typography.bodyFont);
    
    if (theme.typography.scoreFont) {
        root.style.setProperty('--font-score', theme.typography.scoreFont);
    } else {
        // Fall back to heading font if score font is not explicitly provided
        root.style.setProperty('--font-score', theme.typography.headingFont);
    }

    // Some optional backgrounds logic for gradients/images can be attached or used inline
    if (theme.backgroundStyle.gradient) {
        root.style.setProperty('--bg-gradient', theme.backgroundStyle.gradient);
    } else {
        root.style.setProperty('--bg-gradient', theme.palette.background);
    }
  }, [theme]);

  return (
    <ThemeContext.Provider value={{ theme, setThemeContext }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}

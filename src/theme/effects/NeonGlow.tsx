import React from 'react';
import { useTheme } from '../ThemeProvider';

export function NeonGlow() {
    const { theme } = useTheme();

    if (!theme.effects.glow) return null;

    // A subtle global ambient glow based on primary color
    return (
        <div 
            className="pointer-events-none fixed inset-0 z-0 opacity-20 dark:opacity-30 blur-[120px] mix-blend-screen transition-colors duration-1000"
            style={{
                background: `radial-gradient(circle at center, var(--color-primary) 0%, transparent 60%)`,
            }}
            aria-hidden="true"
        />
    );
}

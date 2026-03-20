import React from 'react';
import { useTheme } from '../../theme/ThemeProvider';
import { GLOBAL_THEME } from '../../theme/theme.registry';

interface ArcadiumLogoProps {
    onClick?: () => void;
    forceGlobalTheme?: boolean;
}

/** Inline arcade-cabinet SVG icon — matches the public/favicon.svg */
function ArcadeIcon({ size = 36, glowColor }: { size?: number; glowColor?: string }) {
    return (
        <svg width={size} height={size} viewBox="0 0 64 64" xmlns="http://www.w3.org/2000/svg">
            <defs>
                <filter id="lg" x="-40%" y="-40%" width="180%" height="180%">
                    <feGaussianBlur stdDeviation="1.2" result="blur"/>
                    <feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge>
                </filter>
                <filter id="sg" x="-20%" y="-20%" width="140%" height="140%">
                    <feGaussianBlur stdDeviation="2" result="blur"/>
                    <feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge>
                </filter>
                <pattern id="sl" x="0" y="0" width="1" height="2" patternUnits="userSpaceOnUse">
                    <rect width="1" height="1" fill="rgba(0,255,153,0.04)"/>
                </pattern>
            </defs>
            {/* Background */}
            <rect width="64" height="64" rx="6" fill="#0b0f1a"/>
            {/* Cabinet body */}
            <rect x="14" y="7" width="36" height="52" rx="5" fill="#111827"/>
            <rect x="14" y="10" width="3" height="44" rx="1" fill="#1e2d45"/>
            <rect x="47" y="10" width="3" height="44" rx="1" fill="#1e2d45"/>
            {/* Screen bezel */}
            <rect x="18" y="11" width="28" height="24" rx="2" fill="#0a0a14"/>
            {/* Screen */}
            <rect x="20" y="13" width="24" height="20" fill="#001a12" stroke="#00ff99" strokeWidth="1.2" filter="url(#sg)"/>
            <rect x="20" y="13" width="24" height="20" fill="url(#sl)" opacity="0.6"/>
            <rect x="21" y="14" width="22" height="2" fill="#00ff99" opacity="0.06"/>
            {/* Pixel A */}
            <g fill="#00ff99" filter="url(#lg)">
                <rect x="29.5" y="16" width="5" height="3"/>
                <rect x="25" y="19" width="4" height="3"/>
                <rect x="35" y="19" width="4" height="3"/>
                <rect x="25" y="22" width="14" height="3"/>
                <rect x="25" y="25" width="4" height="4"/>
                <rect x="35" y="25" width="4" height="4"/>
            </g>
            {/* Separator */}
            <rect x="17" y="35" width="30" height="2" fill="#0f1a2e"/>
            {/* Control panel */}
            <rect x="18" y="37" width="28" height="8" rx="1" fill="#1a2438"/>
            <rect x="18" y="37" width="28" height="1" fill="#243250"/>
            {/* Joystick */}
            <circle cx="27" cy="40" r="3.5" fill="#0f1a2e"/>
            <circle cx="27" cy="39" r="2.8" fill="#ff2fd1" filter="url(#lg)"/>
            <rect x="26.2" y="41" width="1.6" height="3" rx="0.5" fill="#00ff99"/>
            {/* Buttons */}
            <circle cx="37" cy="40" r="2.5" fill="#00ff99" filter="url(#lg)"/>
            <circle cx="43" cy="40" r="2.5" fill="#ff2fd1" filter="url(#lg)"/>
            <text x="37" y="41.6" fontFamily="monospace" fontSize="3.2" fontWeight="bold" textAnchor="middle" fill="#001a12">X</text>
            <text x="43" y="41.6" fontFamily="monospace" fontSize="3.2" fontWeight="bold" textAnchor="middle" fill="#001a12">Y</text>
            {/* Base */}
            <rect x="20" y="47" width="24" height="5" rx="1" fill="#0f1522"/>
            <rect x="28" y="49" width="8" height="1.5" rx="0.5" fill="#243250"/>
            {/* Feet */}
            <rect x="16" y="52" width="8" height="3" rx="1" fill="#0f1522"/>
            <rect x="40" y="52" width="8" height="3" rx="1" fill="#0f1522"/>
        </svg>
    );
}

export function ArcadiumLogo({ onClick, forceGlobalTheme = false }: ArcadiumLogoProps) {
    const { theme } = useTheme();
    const logicalTheme = forceGlobalTheme ? GLOBAL_THEME : theme;

    return (
        <div
            className={`flex items-center gap-3 group ${onClick ? 'cursor-pointer' : ''}`}
            onClick={onClick}
        >
            <div
               className="rounded-xl group-hover:scale-110 transition-transform duration-500 shadow-xl overflow-hidden"
               style={{
                   boxShadow: logicalTheme.effects.glow
                       ? `0 0 22px ${logicalTheme.palette.primary}88, 0 0 8px #00ff9944`
                       : '0 4px 6px rgba(0,0,0,0.5)',
               }}
            >
                <ArcadeIcon size={44} glowColor={logicalTheme.palette.primary} />
            </div>
            <div className="flex flex-col">
                <h1
                    className="text-3xl tracking-tighter leading-none pb-1 transition-all duration-700"
                    style={{
                        color: logicalTheme.palette.textPrimary,
                        fontFamily: GLOBAL_THEME.typography.headingFont,
                        textShadow: logicalTheme.effects.glow
                            ? `2px 2px 0px ${logicalTheme.palette.primary}`
                            : 'none',
                    }}
                >
                    Arcadium
                </h1>
                <p
                    className="text-[10px] font-bold tracking-[0.2em] uppercase transition-colors duration-700"
                    style={{
                        color: 'var(--color-text-secondary)',
                        fontFamily: 'var(--font-body)',
                    }}
                >
                    The Ultimate Collection
                </p>
            </div>
            <style>{`@keyframes shine { to { background-position: 200% center; } }`}</style>
        </div>
    );
}

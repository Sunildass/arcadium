import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

const BOOT_MESSAGES = [
    "Initializing Arcadium Core...",
    "Loading Game Engines...",
    "Calibrating Neural Net Difficulty AI...",
    "Connecting Local Storage Protocol...",
    "Syncing Retro Modules...",
    "Boot sequence complete. Welcome back, Player."
];

export default function BootScreen() {
    const navigate = useNavigate();
    const [progress, setProgress] = useState(0);
    const [messages, setMessages] = useState<string[]>([]);
    const [showCursor, setShowCursor] = useState(true);
    const [isExiting, setIsExiting] = useState(false);

    useEffect(() => {
        // Cursor blink
        const cursorInterval = setInterval(() => {
            setShowCursor(prev => !prev);
        }, 500);
        return () => clearInterval(cursorInterval);
    }, []);

    useEffect(() => {
        const totalDuration = 2500; // 2.5 seconds total
        const updateIntervalMs = 50; 
        const steps = totalDuration / updateIntervalMs;
        let currentStep = 0;

        const bootInterval = setInterval(() => {
            currentStep++;
            const pct = Math.min(100, Math.floor((currentStep / steps) * 100));
            setProgress(pct);

            // Calculate which message to show based on percentage
            const messageIndex = Math.min(
                BOOT_MESSAGES.length - 1, 
                Math.floor((pct / 100) * BOOT_MESSAGES.length)
            );

            // Populate messages sequentially exactly when we reach their threshold
            setMessages(prev => {
                const visibleMessages = BOOT_MESSAGES.slice(0, messageIndex + 1);
                // only update if array is actually different to avoid unnecessary repaints
                if (prev.length !== visibleMessages.length) {
                    return visibleMessages;
                }
                return prev;
            });

            if (pct >= 100) {
                clearInterval(bootInterval);
                setIsExiting(true);
                setTimeout(() => {
                    navigate('/dashboard', { replace: true });
                }, 800); // Wait for CSS exit fade to complete (800ms match with duration-700 below)
            }
        }, updateIntervalMs);

        return () => clearInterval(bootInterval);
    }, [navigate]);

    return (
        <div 
            className={`min-h-screen w-full flex flex-col p-6 sm:p-12 z-10 relative bg-black transition-all duration-700 ease-in-out ${
                isExiting ? 'opacity-0 scale-110 blur-md' : 'opacity-100 scale-100 blur-0'
            }`}
        >
            {/* Extremely dark backdrop with minimal distractions */}
            <div className="flex flex-col gap-4 flex-1">
                {messages.map((msg, idx) => (
                    <div 
                        key={idx} 
                        className="text-xs sm:text-sm md:text-base animate-pulse font-mono"
                        style={{ color: 'var(--color-text-secondary)', fontFamily: 'var(--font-score)' }}
                    >
                        {'>'} {msg}
                    </div>
                ))}
                
                {/* Active line with cursor */}
                {progress < 100 && (
                    <div 
                        className="text-xs sm:text-sm md:text-base flex items-center gap-2 font-mono"
                        style={{ color: 'var(--color-primary)', fontFamily: 'var(--font-score)' }}
                    >
                        {'>'} SYSTEM MEM: [{progress}%]
                        <span className={`inline-block w-2.5 h-4 bg-current ${showCursor ? 'opacity-100' : 'opacity-0'}`}></span>
                    </div>
                )}
            </div>

            {/* Static Progress Bar at bottom */}
            <div className="w-full max-w-2xl mx-auto h-2 mt-8 border p-0.5" style={{ borderColor: 'var(--color-text-secondary)' }}>
                <div 
                    className="h-full transition-all duration-75 ease-linear" 
                    style={{ 
                        width: `${progress}%`,
                        backgroundColor: progress === 100 ? 'var(--color-primary)' : 'var(--color-text-primary)'
                    }} 
                />
            </div>
            
            {/* Forced hard scanlines over the black screen explicitly representing DOS prompt vibe */}
            <div 
               className="pointer-events-none absolute inset-0 mix-blend-overlay opacity-30 z-20"
               style={{ background: 'repeating-linear-gradient(0deg, transparent, transparent 2px, #000 2px, #000 4px)' }}
            />
        </div>
    );
}

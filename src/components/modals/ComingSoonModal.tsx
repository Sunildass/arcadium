import React, { useState, useEffect } from 'react';
import { ThemedModal } from './ThemedModal';
import { getComingSoonMessage } from '../../utils/comingSoonMessage';

interface ComingSoonModalProps {
  gameName: string;
  categoryId: string;
  isOpen: boolean;
  onClose: () => void;
}

export function ComingSoonModal({ gameName, categoryId, isOpen, onClose }: ComingSoonModalProps) {
  const [message, setMessage] = useState('');

  // Generate a new random message each time the modal opens
  useEffect(() => {
    if (isOpen) {
      setMessage(getComingSoonMessage(gameName, categoryId));
    }
  }, [isOpen, gameName, categoryId]);

  return (
    <ThemedModal
      isOpen={isOpen}
      onClose={onClose}
      title="Coming Soon!"
    >
      <div className="flex flex-col items-center justify-center py-6 text-center space-y-6">
        <div 
           className={`p-4 rounded-full bg-opacity-20 backdrop-blur-md mb-2 animate-bounce`}
           style={{ backgroundColor: 'var(--color-accent)' }}
        >
          <svg className={`w-12 h-12`} style={{ color: 'var(--color-primary)' }} fill="none" viewBox="0 0 24 24" stroke="currentColor">
             <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
          </svg>
        </div>
        
        <p className="text-xl font-medium max-w-[280px]" style={{ color: 'var(--color-text-primary)' }}>
           {message}
        </p>

        <p className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>
           We're working hard to bring this experience to Arcadium.
        </p>

        <button
          onClick={onClose}
          className={`mt-4 px-8 py-3 rounded-full font-bold text-white shadow-lg transition-transform hover:-translate-y-0.5 active:scale-95 hover:brightness-110`}
          style={{ backgroundColor: 'var(--color-accent)' }}
        >
          Got it
        </button>
      </div>
    </ThemedModal>
  );
}

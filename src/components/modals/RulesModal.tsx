import React, { useState } from 'react';
import { ThemedModal } from './ThemedModal';
import { setHideRulesPreference } from '../../utils/rulesPreference';

interface RulesModalProps {
  gameId: string;
  isOpen: boolean;
  onClose: (didAccept: boolean) => void;
  title: string;
  rulesText: string;
}

export function RulesModal({ gameId, isOpen, onClose, title, rulesText }: RulesModalProps) {
  const [hideNextTime, setHideNextTime] = useState(false);

  const handleOkay = () => {
    if (hideNextTime) {
      setHideRulesPreference(gameId, true);
    }
    onClose(true); // User acknowledged
  };

  const handleDismiss = () => {
     // Close via X or backdrop click should NOT persist the preference even if checked
     onClose(false);
  };

  // Convert plain text rules to bullet points if needed
  const ruleLines = rulesText.split('\n').filter(l => l.trim().length > 0);

  return (
    <ThemedModal
      isOpen={isOpen}
      onClose={handleDismiss}
      title={`${title} Rules`}
    >
      <div className="flex flex-col max-h-[60vh]">
        
        <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar space-y-3 mb-6">
           {ruleLines.map((rule, idx) => (
             <p key={idx} className="text-sm leading-relaxed text-zinc-300">
               {rule}
             </p>
           ))}
        </div>

        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pt-4 border-t border-white/10 mt-auto">
          <label className="flex items-center gap-2 cursor-pointer group">
            <div 
               className={`relative flex items-center justify-center w-5 h-5 rounded border transition-colors group-hover:border-[var(--color-primary)]`}
               style={{
                   backgroundColor: hideNextTime ? 'var(--color-accent)' : 'transparent',
                   borderColor: hideNextTime ? 'transparent' : 'rgba(255,255,255,0.3)'
               }}
            >
               <input 
                 type="checkbox" 
                 className="sr-only"
                 checked={hideNextTime}
                 onChange={(e) => setHideNextTime(e.target.checked)}
               />
               {hideNextTime && (
                 <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                   <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                 </svg>
               )}
            </div>
            <span className="text-sm text-zinc-400 group-hover:text-zinc-200 select-none transition-colors">
              Don't show again
            </span>
          </label>

          <button
            onClick={handleOkay}
            className={`w-full sm:w-auto px-6 py-2.5 rounded-xl font-black border-2 shadow-lg transition-transform hover:-translate-y-0.5 active:scale-95`}
            style={{ 
                backgroundColor: 'var(--color-surface)',
                borderColor: 'var(--color-primary)',
                color: 'var(--color-primary)'
            }}
          >
            Okay, let's play!
          </button>
        </div>

      </div>
    </ThemedModal>
  );
}

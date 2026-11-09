/**
 * EXORA Spoken Narration & Subtitle Overlay
 * Displays warm, poetic subtitles matching voice narration.
 */

import React from 'react';

interface NarrationOverlayProps {
  subtitle: string | null;
}

export const NarrationOverlay: React.FC<NarrationOverlayProps> = ({ subtitle }) => {
  if (!subtitle) return null;

  return (
    <div className="fixed top-24 left-1/2 -translate-x-1/2 max-w-xl w-[90vw] text-center pointer-events-none select-none z-30 transition-all duration-700">
      <div className="inline-block px-6 py-3.5 bg-stone-950/80 border border-amber-500/30 rounded-2xl shadow-2xl">
        <p className="text-base sm:text-lg text-amber-100 font-['Playfair_Display'] italic leading-relaxed">
          "{subtitle}"
        </p>
      </div>
    </div>
  );
};

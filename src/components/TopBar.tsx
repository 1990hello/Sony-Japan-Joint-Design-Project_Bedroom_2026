/**
 * EXORA Top Bar & Ambient Header
 * Minimal typography in upper corner, zero obstruction of the 3D bedroom center.
 */

import React from 'react';
import { ExperienceStage } from '../types';
import { AppLanguage } from '../i18n';

interface TopBarProps {
  language?: AppLanguage;
  currentStage: ExperienceStage;
  onSelectStage: (stage: ExperienceStage) => void;
}

export const TopBar: React.FC<TopBarProps> = ({ language = 'en', currentStage, onSelectStage }) => {
  return (
    <header className="fixed top-5 left-6 right-6 z-40 flex items-center justify-between pointer-events-none select-none">
      {/* Brand & Context */}
      <div className="flex items-center gap-3">
        <div className="flex flex-col">
          <div className="flex items-center gap-2">
            <span className="text-base font-bold tracking-widest text-stone-100 font-['Space_Grotesk']">
              EXORA
            </span>
            <span className="text-[10px] tracking-widest text-amber-400/90 font-mono border border-amber-500/30 px-1.5 py-0.5 rounded bg-amber-500/10">
              2046
            </span>
          </div>
          <span className="text-[11px] text-stone-400 font-normal">
            {language === 'ja' ? '仕事から自分の時間へ' : 'Work-to-Life Emotional Transition'}
          </span>
        </div>
      </div>

      {/* Stage Flow Indicator & Quick Navigator (Interactive on pointer) */}
      <nav className="pointer-events-auto flex items-center gap-1.5 p-1 bg-stone-900/80 border border-stone-800/80 rounded-xl shadow-lg">
        <button
          onClick={() => onSelectStage('stage1_acknowledgement')}
          className={`px-3 py-1 text-xs rounded-lg transition-colors cursor-pointer ${
            currentStage === 'stage1_acknowledgement'
              ? 'bg-amber-600/30 text-amber-200 border border-amber-500/40 font-medium'
              : 'text-stone-400 hover:text-stone-200'
          }`}
        >
          {language === 'ja' ? '1. 今日を振り返る' : '1. Acknowledgement'}
        </button>
        <button
          onClick={() => onSelectStage('stage2_encouragement')}
          className={`px-3 py-1 text-xs rounded-lg transition-colors cursor-pointer ${
            currentStage === 'stage2_encouragement'
              ? 'bg-amber-600/30 text-amber-200 border border-amber-500/40 font-medium'
              : 'text-stone-400 hover:text-stone-200'
          }`}
        >
          {language === 'ja' ? '2. 自分をねぎらう' : '2. Encouragement'}
        </button>
        <button
          onClick={() => onSelectStage('stage3_closure')}
          className={`px-3 py-1 text-xs rounded-lg transition-colors cursor-pointer ${
            currentStage === 'stage3_closure' || currentStage === 'completed'
              ? 'bg-amber-600/30 text-amber-200 border border-amber-500/40 font-medium'
              : 'text-stone-400 hover:text-stone-200'
          }`}
        >
          {language === 'ja' ? '3. 仕事を手放す' : '3. Closure'}
        </button>
      </nav>
    </header>
  );
};

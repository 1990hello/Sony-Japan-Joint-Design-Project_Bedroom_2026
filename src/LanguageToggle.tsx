import React from 'react';
import type { AppLanguage } from './i18n';

interface LanguageToggleProps {
  language: AppLanguage;
  onChange: (language: AppLanguage) => void;
}

export function LanguageToggle({ language, onChange }: LanguageToggleProps) {
  return (
    <div className="fixed bottom-24 right-4 z-[120] flex items-center rounded-full border border-white/20 bg-slate-950/90 p-1 text-xs shadow-xl backdrop-blur-md" aria-label="Language">
      <button type="button" onClick={() => onChange('en')} aria-pressed={language === 'en'}
        className={`rounded-full px-3 py-2 transition-colors ${language === 'en' ? 'bg-white text-slate-950 font-semibold' : 'text-slate-300 hover:text-white'}`}>
        EN
      </button>
      <button type="button" onClick={() => onChange('ja')} aria-pressed={language === 'ja'}
        className={`rounded-full px-3 py-2 transition-colors ${language === 'ja' ? 'bg-white text-slate-950 font-semibold' : 'text-slate-300 hover:text-white'}`}>
        日本語
      </button>
    </div>
  );
}

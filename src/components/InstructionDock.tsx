/**
 * EXORA Instruction Dock & Interaction Bar
 * Follows Three.js Ergonomic UI Layout directives:
 * Centered collapsible bottom dock, zero viewport occlusion,
 * no pulsating dots, clean typography.
 */

import React, { useState, useEffect } from 'react';
import { 
  Volume2, 
  VolumeX, 
  Camera, 
  CameraOff, 
  RotateCcw, 
  ChevronDown, 
  ChevronUp, 
  Sparkles,
  Hand,
  MousePointer2,
  Droplets,
  CheckCircle2
} from 'lucide-react';
import { ExperienceStage, HandGestureState } from '../types';
import { AppLanguage, translate } from '../i18n';

interface InstructionDockProps {
  language?: AppLanguage;
  currentStage: ExperienceStage;
  currentSubstate: string;
  instructionText: string;
  handState: HandGestureState | null;
  isCameraActive: boolean;
  isMuted: boolean;
  onToggleCamera: () => void;
  onToggleMute: () => void;
  onReset: () => void;
  onTriggerWave: () => void;
  onDockOrb: () => void;
  onEatFilm: () => void;
  onDissolveFilm: () => void;
  onJumpStage?: (stage: ExperienceStage) => void;
}

export const InstructionDock: React.FC<InstructionDockProps> = ({
  language = 'en',
  currentStage,
  currentSubstate,
  instructionText,
  handState,
  isCameraActive,
  isMuted,
  onToggleCamera,
  onToggleMute,
  onReset,
  onTriggerWave,
  onDockOrb,
  onEatFilm,
  onDissolveFilm,
}) => {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [autoCollapseNotice, setAutoCollapseNotice] = useState(true);
  const [isGestureGuideOpen, setIsGestureGuideOpen] = useState(false);

  // Auto-collapse after 12 seconds when idle
  useEffect(() => {
    const timer = setTimeout(() => {
      setAutoCollapseNotice(false);
    }, 12000);
    return () => clearTimeout(timer);
  }, []);

  const t = (value: string) => translate(value, language);

  const getStageNumber = () => {
    switch (currentStage) {
      case 'stage1_acknowledgement': return 1;
      case 'stage2_encouragement': return 2;
      case 'stage3_closure': return 3;
      case 'completed': return 3;
      default: return 1;
    }
  };

  const getStageName = () => {
    switch (currentStage) {
      case 'stage1_acknowledgement': return t('Stage 1 — Acknowledgement');
      case 'stage2_encouragement': return t('Stage 2 — Encouragement');
      case 'stage3_closure': return t('Stage 3 — Closure');
      case 'completed': return t('Ritual Complete');
      default: return '';
    }
  };

  return (
    <div className="fixed bottom-5 left-1/2 -translate-x-1/2 w-[94vw] max-w-[880px] z-50 pointer-events-auto transition-transform duration-500 ease-out select-none">
      {/* Collapse / Expand Toggle Button */}
      <div className={`flex justify-center -mb-px transition-transform duration-300 ${isCollapsed ? 'translate-y-12' : 'translate-y-0'}`}>
        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="flex items-center gap-1.5 px-3 py-1 bg-stone-900/90 text-stone-400 hover:text-stone-200 border border-b-0 border-stone-800 rounded-t-lg text-xs tracking-wider uppercase font-medium transition-colors shadow-sm"
          title={isCollapsed ? 'Show Controls' : 'Hide Controls'}
        >
          {isCollapsed ? (
            <>
              <ChevronUp className="w-3.5 h-3.5 text-amber-400" />
              <span>{t('Show Interface')}</span>
            </>
          ) : (
            <>
              <ChevronDown className="w-3.5 h-3.5 text-stone-400" />
              <span>{t('Minimize Interface')}</span>
            </>
          )}
        </button>
      </div>

      {/* Main Bottom Dock Panel */}
      <div 
        className={`bg-stone-900/95 backdrop-blur-none border border-stone-800 rounded-2xl p-3.5 shadow-2xl transition-all duration-300 ${
          isCollapsed ? 'translate-y-28 opacity-20 pointer-events-none' : 'translate-y-0 opacity-100'
        }`}
      >
        <div className="flex flex-col md:flex-row items-center justify-between gap-3">
          
          {/* Left: Stage Step Badge & Current Contextual Instruction */}
          <div className="flex items-center gap-3 w-full md:w-auto">
            {/* Stage Pill */}
            <div className="flex items-center gap-2 px-2.5 py-1.5 bg-stone-800 border border-stone-700/60 rounded-xl shrink-0">
              <span className="w-5 h-5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30 flex items-center justify-center text-xs font-semibold">
                {getStageNumber()}
              </span>
              <span className="text-xs font-medium text-stone-300 hidden sm:inline">
                {getStageName()}
              </span>
            </div>

            {/* Instruction Callout */}
            <div className="flex flex-col min-w-0">
              <div className="flex items-center gap-1.5 mb-0.5">
                {instructionText.startsWith('Action:') ? (
                  <span className="px-1.5 py-0.5 bg-amber-500/20 text-amber-300 border border-amber-500/30 rounded text-[10px] font-semibold tracking-wider uppercase">
                    Your Turn
                  </span>
                ) : (
                  <span className="px-1.5 py-0.5 bg-stone-700/60 text-stone-300 border border-stone-600/40 rounded text-[10px] font-medium tracking-wider uppercase">
                    Observe
                  </span>
                )}
              </div>
              <p className="text-sm font-medium text-stone-100 truncate max-w-[280px] sm:max-w-[420px]">
                {instructionText.replace(/^(Action:|Observe:)\s*/i, '')}
              </p>
            </div>
          </div>

          {/* Center / Action Buttons contextual to active substate */}
          <div className="flex items-center gap-2 w-full md:w-auto justify-end flex-wrap">
            {/* Stage 1: Wave to Begin trigger */}
            {currentSubstate === 'idle_waiting_wave' && (
              <button
                onClick={onTriggerWave}
                className="flex items-center gap-2 px-3.5 py-1.5 bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-500 hover:to-amber-600 text-stone-950 font-semibold text-xs rounded-xl shadow-md transition-all active:scale-95 cursor-pointer"
              >
                <Hand className="w-4 h-4" />
                <span>{t('Wave Hand to Begin')}</span>
              </button>
            )}

            {/* Stage 3: Return Orb to Dock button */}
            {currentStage === 'stage3_closure' && currentSubstate === 'orb_free_interaction' && (
              <button
                onClick={onDockOrb}
                className="flex items-center gap-2 px-3.5 py-1.5 bg-stone-800 hover:bg-stone-700 text-amber-300 border border-amber-500/40 text-xs font-medium rounded-xl transition-all cursor-pointer"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>{t('Return Orb to Dock')}</span>
              </button>
            )}

            {/* Stage 3: Takeaway Choices (Eat or Dissolve) */}
            {currentSubstate === 'film_printed' && (
              <div className="flex items-center gap-2">
                <button
                  onClick={onEatFilm}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-600 hover:bg-amber-500 text-stone-950 font-semibold text-xs rounded-xl transition-all shadow-sm cursor-pointer"
                >
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>{t('Eat Film')}</span>
                </button>
                <button
                  onClick={onDissolveFilm}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-sky-900/80 hover:bg-sky-800 text-sky-200 border border-sky-600/40 font-medium text-xs rounded-xl transition-all shadow-sm cursor-pointer"
                >
                  <Droplets className="w-3.5 h-3.5" />
                  <span>{t('Dissolve in Water')}</span>
                </button>
              </div>
            )}

            {/* Right Tools: Hand Camera tracking, Audio Mute, Reset */}
            <div className="flex items-center gap-1.5 border-l border-stone-800 pl-2">
              {/* Webcam Hand Tracking Toggle */}
              <button
                onClick={onToggleCamera}
                className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs font-medium border transition-colors cursor-pointer ${
                  isCameraActive
                    ? 'bg-emerald-950/60 border-emerald-600/50 text-emerald-300'
                    : 'bg-stone-800/80 border-stone-700 text-stone-400 hover:text-stone-200'
                }`}
                title={isCameraActive ? 'Disable Camera Tracking' : 'Enable Webcam Hand Tracking'}
              >
                {isCameraActive ? (
                  <>
                    <Camera className="w-3.5 h-3.5 text-emerald-400" />
                    <span className="hidden sm:inline">Hand Track On</span>
                  </>
                ) : (
                  <>
                    <CameraOff className="w-3.5 h-3.5 text-stone-400" />
                    <span className="hidden sm:inline">Hand Track Off</span>
                  </>
                )}
              </button>

              {/* Mute Audio */}
              <button
                onClick={onToggleMute}
                className="p-1.5 rounded-xl bg-stone-800 border border-stone-700/80 text-stone-400 hover:text-stone-200 transition-colors cursor-pointer"
                title={isMuted ? 'Unmute Audio' : 'Mute Audio'}
              >
                {isMuted ? <VolumeX className="w-4 h-4 text-stone-500" /> : <Volume2 className="w-4 h-4 text-amber-300" />}
              </button>

              {/* Reset Experience */}
              <button
                onClick={onReset}
                className="p-1.5 rounded-xl bg-stone-800 border border-stone-700/80 text-stone-400 hover:text-stone-200 transition-colors cursor-pointer"
                title="Restart EXORA Experience"
              >
                <RotateCcw className="w-4 h-4 text-stone-400" />
              </button>
            </div>
          </div>
        </div>

        {/* Live Tracking Status Bar (Minimal footer line inside dock) */}
        {isCameraActive && handState && (
          <div className="mt-2.5 pt-2 border-t border-stone-800/80 flex items-center justify-between text-[11px] text-stone-400">
            <div className="flex items-center gap-2">
              <span className={`w-2 h-2 rounded-full ${handState.isHandDetected ? 'bg-emerald-400' : 'bg-stone-600'}`} />
              <span>{t(handState.isHandDetected ? 'Hand Detected' : 'Show hand in front of camera')}</span>
            </div>
            {handState.isHandDetected && (
              <div className="flex items-center gap-3">
                <span>Gesture: <strong className="text-stone-200">
                  {handState.isWaving ? 'Wave 👋' : handState.isPinching ? 'Pinch 🤏' : handState.isOpenPalm ? 'Open Palm ✋' : 'Resting'}
                </strong></span>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Auto-collapse hint */}
      {autoCollapseNotice && !isCollapsed && (
        <div className="text-center mt-1">
          <span className="text-[10px] text-stone-500 tracking-wide">
            You can interact with webcam gestures or mouse click & drag
          </span>
        </div>
      )}

      {/* Floating, on-demand gesture guide — separate from the bottom controls */}
      {currentStage === 'stage3_closure' && currentSubstate === 'orb_free_interaction' && (
        <div className="fixed right-4 sm:right-6 top-1/2 -translate-y-1/2 z-[60] flex items-center gap-2">
          {isGestureGuideOpen && (
            <div className="w-[min(320px,calc(100vw-5.5rem))] rounded-2xl border border-stone-700 bg-stone-950/95 p-4 shadow-2xl backdrop-blur-md">
              <div className="mb-3 flex items-center justify-between">
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-amber-400">Orb controls</p>
                  <h3 className="text-sm font-semibold text-stone-100">Two simple gestures</h3>
                </div>
                <button onClick={() => setIsGestureGuideOpen(false)} className="rounded-lg p-1.5 text-stone-400 hover:bg-stone-800 hover:text-white" aria-label="Close gesture guide">
                  <ChevronDown className="h-4 w-4" />
                </button>
              </div>
              <div className="space-y-3">
                <div className="flex items-center gap-3 rounded-xl border border-amber-500/25 bg-amber-950/25 p-3">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-amber-500/15 text-amber-300"><Hand className="h-5 w-5" /></div>
                  <p className="text-sm font-semibold text-amber-100">Pinch to move orb</p>
                </div>
                <div className="flex items-center gap-3 rounded-xl border border-sky-500/25 bg-sky-950/25 p-3">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-sky-500/15 text-sky-300"><Sparkles className="h-5 w-5" /></div>
                  <p className="text-sm font-semibold text-sky-100">Wave to send orb back to docking station</p>
                </div>
              </div>
            </div>
          )}
          <button
            onClick={() => setIsGestureGuideOpen(!isGestureGuideOpen)}
            className="flex items-center gap-2 rounded-l-xl rounded-r-md border border-amber-500/40 bg-stone-950/95 px-3 py-3 text-amber-200 shadow-xl backdrop-blur-md transition-colors hover:bg-stone-800"
            aria-expanded={isGestureGuideOpen}
            aria-label={isGestureGuideOpen ? "Hide orb instructions" : "Show orb instructions"}
            title="Orb interaction instructions"
          >
            <Hand className="h-5 w-5" />
            <span className="hidden sm:inline text-xs font-semibold tracking-wide">ORB GUIDE</span>
            {isGestureGuideOpen ? <ChevronDown className="h-4 w-4" /> : <ChevronUp className="h-4 w-4" />}
          </button>
        </div>
      )}
    </div>
  );
};

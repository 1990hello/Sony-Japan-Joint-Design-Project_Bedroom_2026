export type ExperienceStage = 'stage1_acknowledgement' | 'stage2_encouragement' | 'stage3_closure' | 'completed';

export type Stage1Substate = 
  | 'idle_waiting_wave'
  | 'orb_materializing'
  | 'screens_absorbing'
  | 'showing_accomplishments';

export type Stage2Substate = 
  | 'black_threads_emerging'
  | 'golden_threads_writing'
  | 'voice_narrating'
  | 'threads_dissolving'
  | 'orb_cleared';

export type Stage3Substate = 
  | 'orb_free_interaction'
  | 'orb_docked'
  | 'wisdom_quote'
  | 'glowing_footsteps'
  | 'film_printed'
  | 'ritual_completed';

export interface AccomplishmentItem {
  id: string;
  project: string;
  detail: string;
}

export interface FloatingScreenData {
  id: number;
  title: string;
  subtitle: string;
  category: string;
  metric: string;
  contentLines: string[];
  angle: number; // in radians along the arc
  radius: number;
  height: number;
}

export interface HandGestureState {
  isHandDetected: boolean;
  handX: number; // normalized 0..1
  handY: number; // normalized 0..1
  isPinching: boolean;
  pinchDistance: number;
  isWaving: boolean;
  isOpenPalm: boolean;
  isSwiping: boolean;
  swipeDirection?: 'left' | 'right' | 'up' | 'down';
  rawConfidence: number;
}

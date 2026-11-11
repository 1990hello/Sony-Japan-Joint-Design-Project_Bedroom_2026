import { AppLanguage, translate } from '../i18n';

/**
 * EXORA Procedural Audio Engine
 * Pure Web Audio API ambient soundscape, harmonic chimes, and synthesized effects.
 * Zero external audio file dependencies.
 */

class SoundscapeEngine {
  private ctx: AudioContext | null = null;
  private isMuted: boolean = false;
  private ambientGain: GainNode | null = null;
  private ambientOscs: OscillatorNode[] = [];
  private speechSynth: SpeechSynthesis | null = null;
  private currentUtterance: SpeechSynthesisUtterance | null = null;
  private language: AppLanguage = 'en';

  constructor() {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      this.speechSynth = window.speechSynthesis;
    }
  }

  private initContext() {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      this.ctx = new AudioCtx();
    }
    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  public setMuted(muted: boolean) {
    this.isMuted = muted;
    if (this.ambientGain && this.ctx) {
      this.ambientGain.gain.setTargetAtTime(muted ? 0 : 0.08, this.ctx.currentTime, 0.2);
    }
    if (muted && this.speechSynth) {
      this.speechSynth.cancel();
    }
  }

  public setLanguage(language: AppLanguage) {
    this.language = language;
  }

  public getMuted() {
    return this.isMuted;
  }

  public startAmbient() {
    if (this.ambientGain) return;
    this.initContext();
    if (!this.ctx) return;

    // Create warm ambient drone (432Hz harmonic bed: D3, A3, F#4 chord softly filtered)
    const masterGain = this.ctx.createGain();
    masterGain.gain.setValueAtTime(this.isMuted ? 0 : 0.08, this.ctx.currentTime);
    masterGain.connect(this.ctx.destination);
    this.ambientGain = masterGain;

    // Filter to keep it warm and non-intrusive
    const filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(320, this.ctx.currentTime);
    filter.Q.setValueAtTime(1.5, this.ctx.currentTime);
    filter.connect(masterGain);

    const freqs = [144, 216, 288, 360]; // Subdued soothing harmonics
    freqs.forEach((freq, idx) => {
      if (!this.ctx) return;
      const osc = this.ctx.createOscillator();
      osc.type = idx % 2 === 0 ? 'sine' : 'triangle';
      osc.frequency.setValueAtTime(freq, this.ctx.currentTime);

      // Subtle slow LFO for breathing sensation
      const lfo = this.ctx.createOscillator();
      const lfoGain = this.ctx.createGain();
      lfo.frequency.setValueAtTime(0.08 + idx * 0.03, this.ctx.currentTime);
      lfoGain.gain.setValueAtTime(freq * 0.015, this.ctx.currentTime);
      lfo.connect(lfoGain);
      lfoGain.connect(osc.frequency);
      lfo.start();

      const oscGain = this.ctx.createGain();
      oscGain.gain.setValueAtTime(0.2 / (idx + 1), this.ctx.currentTime);
      osc.connect(oscGain);
      oscGain.connect(filter);
      osc.start();

      this.ambientOscs.push(osc, lfo);
    });
  }

  /**
   * Delicate crystal bell chime when a screen dissolves into the orb
   */
  public playScreenAbsorb(index: number) {
    if (this.isMuted) return;
    this.initContext();
    if (!this.ctx) return;

    const baseNotes = [523.25, 587.33, 659.25, 783.99, 880.0, 1046.5]; // C5, D5, E5, G5, A5, C6 pentatonic
    const freq = baseNotes[index % baseNotes.length];

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(freq, this.ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(freq * 1.5, this.ctx.currentTime + 0.8);

    gain.gain.setValueAtTime(0.12, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.0001, this.ctx.currentTime + 1.2);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start();
    osc.stop(this.ctx.currentTime + 1.3);
  }

  /**
   * Golden threads shimmering tone
   */
  public playThreadShimmer() {
    if (this.isMuted) return;
    this.initContext();
    if (!this.ctx) return;

    const notes = [659.25, 880.0, 987.77, 1318.5]; // E5, A5, B5, E6
    notes.forEach((f, i) => {
      if (!this.ctx) return;
      const osc = this.ctx.createOscillator();
      const g = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(f, this.ctx.currentTime + i * 0.12);
      g.gain.setValueAtTime(0.03, this.ctx.currentTime + i * 0.12);
      g.gain.exponentialRampToValueAtTime(0.0001, this.ctx.currentTime + i * 0.12 + 1.8);
      osc.connect(g);
      g.connect(this.ctx.destination);
      osc.start(this.ctx.currentTime + i * 0.12);
      osc.stop(this.ctx.currentTime + i * 0.12 + 1.9);
    });
  }

  /**
   * Black threads dissolving sound (warm vapor release)
   */
  public playDissolutionSwoosh() {
    if (this.isMuted) return;
    this.initContext();
    if (!this.ctx) return;

    // Filtered pink-like noise sweep
    const bufferSize = this.ctx.sampleRate * 1.5;
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = (Math.random() * 2 - 1) * 0.3;
    }

    const noise = this.ctx.createBufferSource();
    noise.buffer = buffer;

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(800, this.ctx.currentTime);
    filter.frequency.exponentialRampToValueAtTime(200, this.ctx.currentTime + 1.4);
    filter.Q.setValueAtTime(3, this.ctx.currentTime);

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.08, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.0001, this.ctx.currentTime + 1.5);

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(this.ctx.destination);

    noise.start();
    noise.stop(this.ctx.currentTime + 1.5);
  }

  /**
   * Ethereal step sound as glowing footsteps appear
   */
  public playFootstepChime(stepIndex: number) {
    if (this.isMuted) return;
    this.initContext();
    if (!this.ctx) return;

    const stepNotes = [261.63, 293.66, 329.63, 392.0, 440.0, 523.25, 587.33, 659.25];
    const freq = stepNotes[stepIndex % stepNotes.length];

    const osc = this.ctx.createOscillator();
    const g = this.ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(freq, this.ctx.currentTime);
    g.gain.setValueAtTime(0.06, this.ctx.currentTime);
    g.gain.exponentialRampToValueAtTime(0.0001, this.ctx.currentTime + 0.9);

    osc.connect(g);
    g.connect(this.ctx.destination);
    osc.start();
    osc.stop(this.ctx.currentTime + 1.0);
  }

  /**
   * Dock printer micro-acoustic hum
   */
  public playPrinterSound() {
    if (this.isMuted) return;
    this.initContext();
    if (!this.ctx) return;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(160, this.ctx.currentTime);
    osc.frequency.linearRampToValueAtTime(240, this.ctx.currentTime + 1.8);

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(450, this.ctx.currentTime);

    gain.gain.setValueAtTime(0.04, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 2.0);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start();
    osc.stop(this.ctx.currentTime + 2.1);
  }

  /**
   * Effervescent water dissolution sound
   */
  public playWaterDissolve() {
    if (this.isMuted) return;
    this.initContext();
    if (!this.ctx) return;

    const bufferSize = this.ctx.sampleRate * 2.2;
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = (Math.random() * 2 - 1) * 0.2;
    }

    const noise = this.ctx.createBufferSource();
    noise.buffer = buffer;

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'highpass';
    filter.frequency.setValueAtTime(2200, this.ctx.currentTime);

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.07, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.0001, this.ctx.currentTime + 2.2);

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(this.ctx.destination);

    noise.start();
    noise.stop(this.ctx.currentTime + 2.2);
  }

  /**
   * Speak a message calmly and invoke callback strictly when finished
   */
  public speak(text: string, onEnd?: () => void) {
    const spokenText = translate(text, this.language);
    if (this.speechSynth) {
      this.speechSynth.cancel();
    }

    if (this.isMuted || !this.speechSynth) {
      // If muted or speech not supported, simulate calm reading time based on word count
      const units = this.language === 'ja' ? spokenText.length : spokenText.split(/\s+/).length * 5;
      const durationMs = Math.max(3000, units * 180);
      setTimeout(() => {
        if (onEnd) onEnd();
      }, durationMs);
      return;
    }

    const utterance = new SpeechSynthesisUtterance(spokenText);
    utterance.lang = this.language === 'ja' ? 'ja-JP' : 'en-US';
    this.currentUtterance = utterance;

    // Find the most soothing natural voice available
    const voices = this.speechSynth.getVoices();
    const preferredVoice = this.language === 'ja'
      ? voices.find(v => v.lang.toLowerCase().startsWith('ja') && /natural|google|kyoko|o-ren|haruka/i.test(v.name)) || voices.find(v => v.lang.toLowerCase().startsWith('ja'))
      : voices.find(v => v.lang.startsWith('en') && /Natural|Samantha|Google UK English Female|Serena|Karen|Daniel|Zira/i.test(v.name)) || voices.find(v => v.lang.startsWith('en'));


    if (preferredVoice) {
      utterance.voice = preferredVoice;
    }

    utterance.rate = 0.85; // Calmer, deliberate pace
    utterance.pitch = 0.98; // Warm, sincere tone
    utterance.volume = 0.9;

    let hasEnded = false;
    const finish = () => {
      if (hasEnded) return;
      hasEnded = true;
      this.currentUtterance = null;
      if (onEnd) onEnd();
    };

    utterance.onend = finish;
    utterance.onerror = finish;

    // Safety fallback in case browser speech synth drops onend
    const units = this.language === 'ja' ? spokenText.length : spokenText.split(/\s+/).length * 5;
    const maxSafetyMs = Math.max(5000, units * 260 + 2500);
    setTimeout(finish, maxSafetyMs);

    this.speechSynth.speak(utterance);
  }
}

export const soundscape = new SoundscapeEngine();

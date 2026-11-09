/**
 * EXORA Hand Tracking Engine
 * Tracks user hand via MediaPipe Hands with fallback gesture processing.
 * Dispatches normalized coordinates and gestures (Wave, Pinch, Swipe, Open Palm).
 */

import { HandGestureState } from '../types';

export class HandTracker {
  private videoElement: HTMLVideoElement | null = null;
  private stream: MediaStream | null = null;
  private isRunning: boolean = false;
  private handsInstance: unknown = null;
  private cameraUtilsInstance: unknown = null;
  private onStateChange: ((state: HandGestureState) => void) | null = null;

  // Gesture analysis history
  private prevX: number = 0.5;
  private prevY: number = 0.5;
  private prevTimes: number[] = [];
  private xHistory: number[] = [];
  private lastWaveTime: number = 0;
  private lastSwipeTime: number = 0;

  private currentState: HandGestureState = {
    isHandDetected: false,
    handX: 0.5,
    handY: 0.5,
    isPinching: false,
    pinchDistance: 1.0,
    isWaving: false,
    isOpenPalm: false,
    isSwiping: false,
    rawConfidence: 0,
  };

  constructor(onStateChange?: (state: HandGestureState) => void) {
    if (onStateChange) {
      this.onStateChange = onStateChange;
    }
  }

  public setCallback(cb: (state: HandGestureState) => void) {
    this.onStateChange = cb;
  }

  public getState(): HandGestureState {
    return { ...this.currentState };
  }

  public async start(): Promise<boolean> {
    if (this.isRunning) return true;

    try {
      // 1. Setup hidden video element
      if (!this.videoElement) {
        const video = document.createElement('video');
        video.setAttribute('playsinline', 'true');
        video.setAttribute('autoplay', 'true');
        video.setAttribute('muted', 'true');
        video.style.display = 'none';
        document.body.appendChild(video);
        this.videoElement = video;
      }

      // 2. Request user webcam stream
      this.stream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: 640 },
          height: { ideal: 480 },
          facingMode: 'user',
        },
        audio: false,
      });

      this.videoElement.srcObject = this.stream;
      await this.videoElement.play();

      // 3. Initialize MediaPipe Hands
      await this.initMediaPipe();

      this.isRunning = true;
      return true;
    } catch (err) {
      console.warn('Webcam permission denied or camera unavailable:', err);
      return false;
    }
  }

  public stop() {
    this.isRunning = false;
    if (this.stream) {
      this.stream.getTracks().forEach(track => track.stop());
      this.stream = null;
    }
    if (this.videoElement) {
      this.videoElement.srcObject = null;
    }
    this.currentState = {
      isHandDetected: false,
      handX: 0.5,
      handY: 0.5,
      isPinching: false,
      pinchDistance: 1.0,
      isWaving: false,
      isOpenPalm: false,
      isSwiping: false,
      rawConfidence: 0,
    };
    if (this.onStateChange) {
      this.onStateChange(this.currentState);
    }
  }

  private async initMediaPipe() {
    try {
      // Dynamically load MediaPipe hands script if not globally present
      if (!(window as unknown as { Hands: unknown }).Hands) {
        await this.loadScript('https://cdn.jsdelivr.net/npm/@mediapipe/hands/hands.js');
        await this.loadScript('https://cdn.jsdelivr.net/npm/@mediapipe/camera_utils/camera_utils.js');
      }

      const HandsClass = (window as unknown as { Hands: new (config: { locateFile: (file: string) => string }) => unknown }).Hands;
      const CameraClass = (window as unknown as { Camera: new (video: HTMLVideoElement, options: { onFrame: () => Promise<void>; width: number; height: number }) => { start: () => void; stop: () => void } }).Camera;

      if (!HandsClass) {
        this.setupFallbackTrackingLoop();
        return;
      }

      const hands = new HandsClass({
        locateFile: (file: string) => `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}`,
      });

      // Type-cast hands configuration
      const h = hands as {
        setOptions: (opts: Record<string, unknown>) => void;
        onResults: (cb: (results: { multiHandLandmarks?: Array<Array<{ x: number; y: number; z: number }>> }) => void) => void;
        send: (input: { image: HTMLVideoElement }) => Promise<void>;
      };

      h.setOptions({
        maxNumHands: 1,
        modelComplexity: 1,
        minDetectionConfidence: 0.5,
        minTrackingConfidence: 0.5,
      });

      h.onResults((results) => {
        this.handleMediaPipeResults(results);
      });

      this.handsInstance = hands;

      if (CameraClass && this.videoElement) {
        const camera = new CameraClass(this.videoElement, {
          onFrame: async () => {
            if (this.isRunning && this.videoElement) {
              await h.send({ image: this.videoElement });
            }
          },
          width: 640,
          height: 480,
        });
        camera.start();
        this.cameraUtilsInstance = camera;
      } else {
        this.setupFallbackTrackingLoop();
      }
    } catch (e) {
      console.warn('Could not initialize MediaPipe Hands, falling back to simulated/mouse tracking:', e);
      this.setupFallbackTrackingLoop();
    }
  }

  private loadScript(src: string): Promise<void> {
    return new Promise((resolve, reject) => {
      const existing = document.querySelector(`script[src="${src}"]`);
      if (existing) {
        resolve();
        return;
      }
      const script = document.createElement('script');
      script.src = src;
      script.crossOrigin = 'anonymous';
      script.onload = () => resolve();
      script.onerror = () => reject(new Error(`Failed to load ${src}`));
      document.head.appendChild(script);
    });
  }

  private handleMediaPipeResults(results: { multiHandLandmarks?: Array<Array<{ x: number; y: number; z: number }>> }) {
    const landmarks = results.multiHandLandmarks && results.multiHandLandmarks[0];

    if (!landmarks || landmarks.length < 21) {
      if (this.currentState.isHandDetected) {
        this.currentState.isHandDetected = false;
        // Do not combine movement from before and after a tracking interruption.
        this.xHistory = [];
        this.prevTimes = [];
        if (this.onStateChange) this.onStateChange({ ...this.currentState });
      }
      return;
    }

    // Use the palm anchor for cursor position at all times.
    // Pinching changes only the gesture state; it must never shift the cursor
    // from the palm to the fingertips.
    const thumbTip = landmarks[4];
    const indexTip = landmarks[8];
    const dx = thumbTip.x - indexTip.x;
    const dy = thumbTip.y - indexTip.y;
    const dz = (thumbTip.z || 0) - (indexTip.z || 0);
    const pinchDist = Math.sqrt(dx * dx + dy * dy + dz * dz);
    const isPinching = pinchDist < 0.085;

    const rawX = 1 - landmarks[9].x; // Mirrored palm anchor
    const rawY = landmarks[9].y;

    // Finger extensions for Open Palm check (tips above MCPs relative to wrist)
    const isIndexExtended = landmarks[8].y < landmarks[6].y;
    const isMiddleExtended = landmarks[12].y < landmarks[10].y;
    const isRingExtended = landmarks[16].y < landmarks[14].y;
    const isPinkyExtended = landmarks[20].y < landmarks[18].y;
    // Allow one finger to be partially occluded or mis-tracked by the camera.
    const extendedFingerCount = [isIndexExtended, isMiddleExtended, isRingExtended, isPinkyExtended].filter(Boolean).length;
    const isOpenPalm = extendedFingerCount >= 3 && !isPinching;

    // Wave detection: accept a natural open-hand wave without requiring exaggerated movement.
    // A 3-of-4 finger check above tolerates occasional landmark tracking errors.
    const now = performance.now();
    let isWaving = false;
    if (isOpenPalm) {
      this.xHistory.push(rawX);
      this.prevTimes.push(now);
      while (this.prevTimes.length > 0 && now - this.prevTimes[0] > 1200) {
        this.prevTimes.shift();
        this.xHistory.shift();
      }

      if (this.xHistory.length > 6 && now - this.lastWaveTime > 900) {
        const horizontalSpan = Math.max(...this.xHistory) - Math.min(...this.xHistory);
        let directionChanges = 0;
        let lastDir = 0;
        for (let i = 1; i < this.xHistory.length; i++) {
          const diff = this.xHistory[i] - this.xHistory[i - 1];
          if (Math.abs(diff) > 0.015) {
            const dir = Math.sign(diff);
            if (lastDir !== 0 && dir !== lastDir) directionChanges++;
            lastDir = dir;
          }
        }
        if (horizontalSpan > 0.11 && directionChanges >= 2) {
          isWaving = true;
          this.lastWaveTime = now;
          this.xHistory = [];
          this.prevTimes = [];
        }
      }
    } else {
      // Only continuous open-palm movement can form a wave.
      this.xHistory = [];
      this.prevTimes = [];
    }

    // Swipe detection: rapid unidirectional horizontal movement
    let isSwiping = false;
    let swipeDirection: 'left' | 'right' | undefined;
    const dt = now - (this.prevTimes[this.prevTimes.length - 2] || now - 16);
    if (dt > 0) {
      const vx = (rawX - this.prevX) / (dt / 1000);
      if (Math.abs(vx) > 1.4 && now - this.lastSwipeTime > 600) {
        isSwiping = true;
        swipeDirection = vx > 0 ? 'right' : 'left';
        this.lastSwipeTime = now;
      }
    }

    this.prevX = rawX;
    this.prevY = rawY;

    this.currentState = {
      isHandDetected: true,
      handX: rawX,
      handY: rawY,
      isPinching,
      pinchDistance: pinchDist,
      isWaving,
      isOpenPalm,
      isSwiping,
      swipeDirection,
      rawConfidence: 0.9,
    };

    if (this.onStateChange) {
      this.onStateChange({ ...this.currentState });
    }
  }

  private setupFallbackTrackingLoop() {
    // If MediaPipe model fails to load, keep a lightweight fallback loop running
    const loop = () => {
      if (!this.isRunning) return;
      requestAnimationFrame(loop);
    };
    requestAnimationFrame(loop);
  }

  /**
   * Allows mouse / touch events to simulate hand interaction seamlessly
   */
  public triggerManualWave() {
    const now = performance.now();
    this.currentState.isWaving = true;
    this.lastWaveTime = now;
    if (this.onStateChange) this.onStateChange({ ...this.currentState });
    setTimeout(() => {
      this.currentState.isWaving = false;
      if (this.onStateChange) this.onStateChange({ ...this.currentState });
    }, 700);
  }

  public updateManualPointer(normX: number, normY: number, isPinching: boolean) {
    this.currentState.isHandDetected = true;
    this.currentState.handX = normX;
    this.currentState.handY = normY;
    this.currentState.isPinching = isPinching;
    this.currentState.pinchDistance = isPinching ? 0.03 : 0.2;
    this.currentState.isOpenPalm = !isPinching;
    if (this.onStateChange) {
      this.onStateChange({ ...this.currentState });
    }
  }
}

export const handTracker = new HandTracker();

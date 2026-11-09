/**
 * EXORA Master 3D Experience Scene
 * Orchestrates First-Person seated camera, Three.js PBR rendering,
 * RoomEnvironment, 2046 Bedroom, Floating Screens, Central Orb,
 * Stage 2 Threads, and Stage 3 Footsteps & Rituals.
 */

import * as THREE from 'three';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { BedroomEnvironment } from './bedroom';
import { FloatingScreenManager } from './floatingScreens';
import { DockAndOrb } from './dockAndOrb';
import { ThreadsEffect } from './threadsEffect';
import { FootstepsAndFilm } from './footstepsAndFilm';
import { ExperienceStage, HandGestureState } from '../types';
import { soundscape } from '../audio/soundscape';

export interface SceneCallbacks {
  onStageChange: (stage: ExperienceStage, substate: string) => void;
  onInstructionChange: (text: string) => void;
  onNarrationSubtitle: (text: string | null) => void;
}

interface CameraAnimationState {
  mode: 'in' | 'hold' | 'out';
  startPos: THREE.Vector3;
  targetPos: THREE.Vector3;
  startLook: THREE.Vector3;
  targetLook: THREE.Vector3;
  duration: number;
  elapsed: number;
  holdDuration: number;
  holdTimer: number;
  stayAtTarget?: boolean;
  onComplete?: () => void;
}

export class ExperienceScene {
  public container: HTMLElement;
  public renderer!: THREE.WebGLRenderer;
  public scene!: THREE.Scene;
  public camera!: THREE.PerspectiveCamera;

  // Scene sub-modules
  public bedroom!: BedroomEnvironment;
  public screenManager!: FloatingScreenManager;
  public dockAndOrb!: DockAndOrb;
  public threadsEffect!: ThreadsEffect;
  public footstepsAndFilm!: FootstepsAndFilm;

  // Lifecycle & Performance
  private isSoftwareGl: boolean = false;
  private animationFrameId: number = 0;
  private clock = new THREE.Clock();
  private callbacks: SceneCallbacks;

  // Seated Camera
  // Move the seated viewpoint 33 cm back so more of the tabletop is visible.
  private readonly defaultCameraPos = new THREE.Vector3(0, 1.16, 0.95);
  private readonly defaultCameraTarget = new THREE.Vector3(0.08, 0.96, -1.4);
  private cameraLookTarget = new THREE.Vector3().copy(this.defaultCameraTarget);
  private seatedBreathingPhase: number = 0;
  private cameraAnimation: CameraAnimationState | null = null;

  // Experience State Machine
  public currentStage: ExperienceStage = 'stage1_acknowledgement';
  public currentSubstate: string = 'idle_waiting_wave';

  // Interaction Raycasting
  private raycaster = new THREE.Raycaster();
  private pointerNorm = new THREE.Vector2();
  private isPointerDown: boolean = false;
  private planeIntersect = new THREE.Plane(new THREE.Vector3(0, 0, 1), -0.08);
  private filmDragPlane = new THREE.Plane(new THREE.Vector3(0, 1, 0), -0.742);
  private waterTargetPosition = new THREE.Vector3(-0.5, 0.74 + 0.08, -0.2);
  private raycastHitPos = new THREE.Vector3();

  // Gesture Tracking
  private currentHandState: HandGestureState | null = null;
  private previousPinch: boolean = false;
  private previousWave: boolean = false;

  // Visual hand pointer
  private handCursorLayer: HTMLDivElement | null = null;
  private handCursorElement: HTMLDivElement | null = null;
  private handCursorDot: HTMLDivElement | null = null;

  constructor(container: HTMLElement, callbacks: SceneCallbacks) {
    this.container = container;
    this.callbacks = callbacks;

    this.detectSoftwareGl();
    this.initRenderer();
    this.initHandCursor();
    this.initScene();
    this.initCamera();
    this.initModules();
    this.setupEventListeners();

    this.startLoop();
  }

  private detectSoftwareGl() {
    const gl = document.createElement('canvas').getContext('webgl2');
    if (!gl) {
      this.isSoftwareGl = true;
      return;
    }
    const ext = gl.getExtension('WEBGL_debug_renderer_info');
    const param = ext ? ext.UNMASKED_RENDERER_WEBGL : gl.RENDERER;
    const gpu = String(gl.getParameter(param));
    gl.getExtension('WEBGL_lose_context')?.loseContext();
    this.isSoftwareGl = /SwiftShader|llvmpipe|softpipe|Software|Basic Render/i.test(gpu);
  }

  private initRenderer() {
    this.renderer = new THREE.WebGLRenderer({
      antialias: !this.isSoftwareGl,
      powerPreference: 'high-performance',
      alpha: false,
    });
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.1;
    this.renderer.setPixelRatio(this.isSoftwareGl ? 1 : Math.min(window.devicePixelRatio, 2));
    this.renderer.shadowMap.enabled = !this.isSoftwareGl;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    this.renderer.setSize(this.container.clientWidth, this.container.clientHeight);
    this.container.appendChild(this.renderer.domElement);
  }

  private initScene() {
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x0c0b0f);
    this.scene.fog = new THREE.FogExp2(0x1a161b, 0.045);

    const pmremGenerator = new THREE.PMREMGenerator(this.renderer);
    pmremGenerator.compileEquirectangularShader();
    this.scene.environment = pmremGenerator.fromScene(new RoomEnvironment(), 0.04).texture;
    pmremGenerator.dispose();
  }

  private initCamera() {
    const aspect = this.container.clientWidth / this.container.clientHeight;
    this.camera = new THREE.PerspectiveCamera(62, aspect, 0.05, 50);
    this.camera.position.copy(this.defaultCameraPos);
    this.camera.lookAt(this.cameraLookTarget);
  }

  private initModules() {
    this.bedroom = new BedroomEnvironment();
    this.scene.add(this.bedroom.group);

    this.screenManager = new FloatingScreenManager();
    this.scene.add(this.screenManager.group);

    this.dockAndOrb = new DockAndOrb();
    this.scene.add(this.dockAndOrb.group);

    this.threadsEffect = new ThreadsEffect();
    this.scene.add(this.threadsEffect.group);

    this.footstepsAndFilm = new FootstepsAndFilm();
    this.scene.add(this.footstepsAndFilm.group);

    this.setSubstate('idle_waiting_wave');
    this.callbacks.onInstructionChange('Action: Wave hand or click "Wave to Begin"');
  }

  private initHandCursor() {
    const layer = document.createElement('div');
    layer.setAttribute('aria-hidden', 'true');
    Object.assign(layer.style, {
      position: 'absolute',
      inset: '0',
      zIndex: '2',
      overflow: 'hidden',
      pointerEvents: 'none',
    });

    const cursor = document.createElement('div');
    Object.assign(cursor.style, {
      position: 'absolute',
      left: '50%',
      top: '50%',
      width: '32px',
      height: '32px',
      border: '2px solid rgba(73, 177, 255, 0.98)',
      borderRadius: '50%',
      background: 'rgba(45, 151, 255, 0.16)',
      boxShadow: '0 0 8px rgba(57, 166, 255, 0.9), 0 0 22px rgba(57, 166, 255, 0.45)',
      transform: 'translate(-50%, -50%) scale(1)',
      opacity: '0',
      transition: 'left 55ms linear, top 55ms linear, opacity 100ms ease, border-color 120ms ease, background-color 120ms ease, box-shadow 120ms ease, transform 120ms ease',
      boxSizing: 'border-box',
    });

    const dot = document.createElement('div');
    Object.assign(dot.style, {
      width: '6px',
      height: '6px',
      borderRadius: '50%',
      background: '#49b1ff',
      boxShadow: '0 0 8px rgba(73, 177, 255, 0.95)',
    });

    cursor.appendChild(dot);
    layer.appendChild(cursor);
    this.container.appendChild(layer);

    this.handCursorLayer = layer;
    this.handCursorElement = cursor;
    this.handCursorDot = dot;
  }

  private updateHandCursor(state: HandGestureState) {
    if (!this.handCursorElement || !this.handCursorDot) return;

    if (!state.isHandDetected) {
      this.handCursorElement.style.opacity = '0';
      return;
    }

    const x = THREE.MathUtils.clamp(state.handX, 0, 1) * 100;
    const y = THREE.MathUtils.clamp(state.handY, 0, 1) * 100;
    this.handCursorElement.style.left = `${x}%`;
    this.handCursorElement.style.top = `${y}%`;
    this.handCursorElement.style.opacity = '1';

    const color = state.isPinching ? '#ffc36b' : '#49b1ff';
    this.handCursorElement.style.borderColor = color;
    this.handCursorElement.style.backgroundColor = state.isPinching
      ? 'rgba(255, 179, 74, 0.24)'
      : 'rgba(45, 151, 255, 0.16)';
    this.handCursorElement.style.boxShadow = state.isPinching
      ? '0 0 10px rgba(255, 187, 91, 0.98), 0 0 26px rgba(255, 164, 61, 0.58)'
      : '0 0 8px rgba(57, 166, 255, 0.9), 0 0 22px rgba(57, 166, 255, 0.45)';
    this.handCursorElement.style.transform = state.isPinching
      ? 'translate(-50%, -50%) scale(0.88)'
      : 'translate(-50%, -50%) scale(1)';
    this.handCursorDot.style.backgroundColor = color;
    this.handCursorDot.style.boxShadow = state.isPinching
      ? '0 0 8px rgba(255, 195, 107, 0.98)'
      : '0 0 8px rgba(73, 177, 255, 0.95)';
  }

  private setupEventListeners() {
    window.addEventListener('resize', this.onResize);

    const el = this.renderer.domElement;
    el.addEventListener('pointermove', this.onPointerMove);
    el.addEventListener('pointerdown', this.onPointerDown);
    el.addEventListener('pointerup', this.onPointerUp);
  }

  private onResize = () => {
    if (!this.container || !this.renderer) return;
    const w = this.container.clientWidth;
    const h = this.container.clientHeight;
    this.camera.aspect = w / h;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(w, h);
  };

  private isPointerOverEdibleFilm(): boolean {
    if (!this.footstepsAndFilm.edibleFilmGroup.visible) return false;
    this.footstepsAndFilm.edibleFilmGroup.updateMatrixWorld(true);
    this.raycaster.setFromCamera(this.pointerNorm, this.camera);
    return this.raycaster.intersectObject(this.footstepsAndFilm.edibleFilmHitArea, false).length > 0;
  }

  private moveEdibleFilmWithPointer(): boolean {
    this.raycaster.setFromCamera(this.pointerNorm, this.camera);
    if (!this.raycaster.ray.intersectPlane(this.filmDragPlane, this.raycastHitPos)) return false;

    this.raycastHitPos.x = THREE.MathUtils.clamp(this.raycastHitPos.x, -0.78, 0.78);
    this.raycastHitPos.z = THREE.MathUtils.clamp(this.raycastHitPos.z, -0.36, 0.42);
    this.footstepsAndFilm.edibleFilmGroup.position.set(
      this.raycastHitPos.x,
      this.footstepsAndFilm.filmInitialPos.y,
      this.raycastHitPos.z
    );
    return true;
  }

  private isEdibleFilmOverWater(): boolean {
    const filmPos = this.footstepsAndFilm.edibleFilmGroup.position;
    const distanceXZ = Math.hypot(
      filmPos.x - this.waterTargetPosition.x,
      filmPos.z - this.waterTargetPosition.z
    );
    return distanceXZ < 0.11;
  }

  private onPointerMove = (e: PointerEvent) => {
    const rect = this.renderer.domElement.getBoundingClientRect();
    this.pointerNorm.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
    this.pointerNorm.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;

    // Subtle gaze tracking when not in cinematic camera zoom
    if (!this.cameraAnimation) {
      const targetGazeX = this.defaultCameraTarget.x + this.pointerNorm.x * 0.08;
      const targetGazeY = this.defaultCameraTarget.y + this.pointerNorm.y * 0.05;
      this.cameraLookTarget.x = THREE.MathUtils.lerp(this.cameraLookTarget.x, targetGazeX, 0.08);
      this.cameraLookTarget.y = THREE.MathUtils.lerp(this.cameraLookTarget.y, targetGazeY, 0.08);
    }

    // Dragging Orb in Stage 3
    if (this.dockAndOrb.isGrabbed) {
      this.raycaster.setFromCamera(this.pointerNorm, this.camera);
      if (this.raycaster.ray.intersectPlane(this.planeIntersect, this.raycastHitPos)) {
        this.raycastHitPos.x = THREE.MathUtils.clamp(this.raycastHitPos.x, -0.6, 0.6);
        this.raycastHitPos.y = THREE.MathUtils.clamp(this.raycastHitPos.y, 0.76, 1.25);
        this.raycastHitPos.z = THREE.MathUtils.clamp(this.raycastHitPos.z, -0.32, 0.35);
        this.dockAndOrb.orbGroup.position.copy(this.raycastHitPos);
      }
    }

    // Dragging Edible Film across horizontal desk
    if (this.footstepsAndFilm.isFilmGrabbed && this.moveEdibleFilmWithPointer()) {
      if (this.isEdibleFilmOverWater()) {
        this.triggerDissolveRitual();
      }
    }
  };

  private onPointerDown = () => {
    this.isPointerDown = true;
    this.raycaster.setFromCamera(this.pointerNorm, this.camera);

    // Stage 3 Free Orb
    if (this.currentStage === 'stage3_closure' && this.currentSubstate === 'orb_free_interaction') {
      const orbIntersects = this.raycaster.intersectObject(this.dockAndOrb.outerGlassOrb);
      if (orbIntersects.length > 0) {
        this.dockAndOrb.isGrabbed = true;
        this.dockAndOrb.setDocked(false);
        this.callbacks.onInstructionChange('Action: Pinch and hold the orb, then move your hand. Release your pinch, then wave side-to-side to return it to the dock.');
        return;
      }
    }

    // Stage 3 Edible Film Grab
    if (this.footstepsAndFilm.isFilmPrinted && !this.footstepsAndFilm.isFilmConsumed && !this.footstepsAndFilm.isFilmDissolved) {
      if (this.isPointerOverEdibleFilm()) {
        this.footstepsAndFilm.isFilmGrabbed = true;
        this.callbacks.onInstructionChange('Action: Drag to water glass to dissolve, or click "Eat Film"');
      }
    }
  };

  private onPointerUp = () => {
    this.isPointerDown = false;

    if (this.dockAndOrb.isGrabbed) {
      this.dockAndOrb.isGrabbed = false;
      this.dockAndOrb.currentOrbTarget.copy(this.dockAndOrb.orbGroup.position);
    }

    if (this.footstepsAndFilm.isFilmGrabbed) {
      this.footstepsAndFilm.isFilmGrabbed = false;
      if (this.isEdibleFilmOverWater()) {
        this.triggerDissolveRitual();
      }
    }
  };

  public handleHandGesture(state: HandGestureState) {
    this.currentHandState = state;
    this.updateHandCursor(state);

    if (!state.isHandDetected) {
      this.previousPinch = false;
      this.previousWave = false;
      return;
    }

    const ndcX = (state.handX - 0.5) * 2;
    const ndcY = -(state.handY - 0.5) * 2;
    this.pointerNorm.set(ndcX, ndcY);

    // 1. Hand Wave in Stage 1 Idle
    if (this.currentStage === 'stage1_acknowledgement' && this.currentSubstate === 'idle_waiting_wave') {
      if (state.isWaving && !this.previousWave) {
        this.triggerStartWave();
      }
    }

    // 2. Pinching / Moving Orb in Stage 3
    if (this.currentStage === 'stage3_closure' && this.currentSubstate === 'orb_free_interaction') {
      if (state.isPinching && !this.previousPinch && !this.dockAndOrb.isGrabbed) {
        this.dockAndOrb.orbGroup.updateMatrixWorld(true);
        this.raycaster.setFromCamera(this.pointerNorm, this.camera);
        const orbHit = this.raycaster.intersectObject(this.dockAndOrb.outerGlassOrb, false);
        if (orbHit.length > 0) {
          this.dockAndOrb.isGrabbed = true;
          this.dockAndOrb.setDocked(false);
        }
      } else if (!state.isPinching && this.previousPinch) {
        if (this.dockAndOrb.isGrabbed) {
          this.dockAndOrb.isGrabbed = false;
          this.dockAndOrb.currentOrbTarget.copy(this.dockAndOrb.orbGroup.position);
        }
      }

      // Deliberate wave returns orb to dock
      if (state.isWaving && !this.previousWave && !this.dockAndOrb.isGrabbed) {
        this.dockTheOrb();
      }

      if (this.dockAndOrb.isGrabbed) {
        const targetX = ndcX * 0.45;
        const targetY = 0.74 + 0.25 + ndcY * 0.25;
        const targetZ = -0.23 + 0.2;
        this.dockAndOrb.orbGroup.position.lerp(new THREE.Vector3(targetX, targetY, targetZ), 0.15);
      }
    }

    // 3. Pinching circular edible film
    if (this.footstepsAndFilm.isFilmPrinted && !this.footstepsAndFilm.isFilmConsumed && !this.footstepsAndFilm.isFilmDissolved) {
      if (state.isPinching && !this.previousPinch && !this.footstepsAndFilm.isFilmGrabbed) {
        if (this.isPointerOverEdibleFilm()) {
          this.footstepsAndFilm.isFilmGrabbed = true;
          this.callbacks.onInstructionChange('Action: Drag over water glass to dissolve, or release to place down');
        }
      } else if (!state.isPinching && this.previousPinch && this.footstepsAndFilm.isFilmGrabbed) {
        this.footstepsAndFilm.isFilmGrabbed = false;
        if (this.isEdibleFilmOverWater()) {
          this.triggerDissolveRitual();
        }
      }

      if (this.footstepsAndFilm.isFilmGrabbed) {
        this.moveEdibleFilmWithPointer();
        if (this.isEdibleFilmOverWater()) {
          this.triggerDissolveRitual();
        }
      }
    }

    this.previousPinch = state.isPinching;
    this.previousWave = state.isWaving;
  }

  // ================= CAMERA CINEMATIC ZOOM HELPER =================

  /**
   * Smoothly zoom in towards the orb, hold, and smoothly zoom back out.
   */
  private zoomToOrb(holdDuration: number, onComplete?: () => void) {
    const orbPos = this.dockAndOrb.orbGroup.position.clone();
    // Close framing just in front of orb
    const targetZoomPos = new THREE.Vector3(orbPos.x, orbPos.y + 0.015, orbPos.z + 0.24);
    const targetLook = orbPos.clone();

    this.cameraAnimation = {
      mode: 'in',
      startPos: this.camera.position.clone(),
      targetPos: targetZoomPos,
      startLook: this.cameraLookTarget.clone(),
      targetLook: targetLook,
      duration: 1.8,
      elapsed: 0,
      holdDuration,
      holdTimer: 0,
      onComplete,
    };
  }

  /**
   * Stage 2: Bring the encouragement message into a readable close-up.
   * The message sits 24 cm above the orb, so aim at the text rather than the orb.
   */
  private zoomToEncouragement(holdDuration: number) {
    const orbPos = this.dockAndOrb.orbGroup.position.clone();
    const textLook = orbPos.clone().add(new THREE.Vector3(0, 0.24, 0.05));
    const targetZoomPos = textLook.clone().add(new THREE.Vector3(0, 0, 0.30));

    this.cameraAnimation = {
      mode: 'in',
      startPos: this.camera.position.clone(),
      targetPos: targetZoomPos,
      startLook: this.cameraLookTarget.clone(),
      targetLook: textLook,
      duration: 1.8,
      elapsed: 0,
      holdDuration,
      holdTimer: 0,
    };
  }

  /**
   * Stage 3: Reframe from the orb to the complete tabletop ritual setup.
   * This is a close tabletop view of the water glass, edible film and campfire dock.
   * The camera remains here so the user can comfortably choose and perform the ritual.
   */
  private zoomToRitualSetup(onComplete?: () => void) {
    const targetLook = new THREE.Vector3(-0.20, 0.79, -0.16);
    const targetPosition = new THREE.Vector3(-0.05, 1.28, 0.46);

    this.cameraAnimation = {
      mode: 'in',
      startPos: this.camera.position.clone(),
      targetPos: targetPosition,
      startLook: this.cameraLookTarget.clone(),
      targetLook,
      duration: 1.8,
      elapsed: 0,
      holdDuration: 0,
      holdTimer: 0,
      stayAtTarget: true,
      onComplete,
    };
  }

  // ================= STAGE 1: ACKNOWLEDGEMENT =================

  public triggerStartWave() {
    if (this.currentSubstate !== 'idle_waiting_wave') return;
    this.setSubstate('orb_materializing');
    this.callbacks.onInstructionChange('Observe: The central orb awakens...');

    // 1. Materialize glass orb above firewood dock
    this.dockAndOrb.materialize();

    setTimeout(() => {
      // 2. Absorb screens into orb one after another
      this.setSubstate('screens_absorbing');
      this.callbacks.onInstructionChange('Observe: Work screens returning to the orb');

      const orbWorldPos = this.dockAndOrb.dockPosition.clone();
      orbWorldPos.y = this.dockAndOrb.orbHoverY;

      this.screenManager.startAbsorption(
        undefined,
        () => {
          // 3. All screens absorbed -> display accomplishments INSIDE the orb + camera zoom
          this.showAccomplishmentsInsideOrbSequence();
        }
      );
    }, 1800);
  }

  /**
   * Stage 1: Display Completed Tasks INSIDE the Orb + Smooth Camera Zoom
   */
  private showAccomplishmentsInsideOrbSequence() {
    this.setSubstate('showing_accomplishments');
    this.callbacks.onInstructionChange('Observe: Daily achievements captured within the orb');

    // Reveal holographic accomplishments inside the orb volume
    this.dockAndOrb.renderAccomplishmentsInsideOrb(1.0);

    // Zoom camera towards orb, hold for 4.5 seconds for comfortable reading, then zoom out
    this.zoomToOrb(4.5, () => {
      // Transition to Stage 2 after camera returns smoothly to seated position
      this.transitionToStage2();
    });
  }

  // ================= STAGE 2: ENCOURAGEMENT =================

  public transitionToStage2() {
    this.currentStage = 'stage2_encouragement';
    this.setSubstate('black_threads_emerging');
    this.callbacks.onStageChange('stage2_encouragement', 'black_threads_emerging');
    this.callbacks.onInstructionChange('Observe: Lingering thoughts and work weight acknowledged');

    // Fade out internal accomplishments from orb
    let fade = 1.0;
    const fadeOut = setInterval(() => {
      fade -= 0.1;
      this.dockAndOrb.renderAccomplishmentsInsideOrb(fade);
      if (fade <= 0) {
        clearInterval(fadeOut);
        this.dockAndOrb.clearInternalDisplay();
      }
    }, 40);

    // Warm bedroom atmosphere transition
    this.bedroom.setAtmosphereTransition(0.45);

    // 1. Black tethers appear connecting orb to dock
    const orbPos = this.dockAndOrb.orbGroup.position;
    this.threadsEffect.startStage2(orbPos);

    // Phase A: Golden threads emerge from orb, brief 1.5s orbit
    setTimeout(() => {
      this.threadsEffect.startPhaseA_GoldenOrbit();
      soundscape.playThreadShimmer();

      // Phase B: Golden threads stream downwards, dissolving black threads progressively
      setTimeout(() => {
        this.callbacks.onInstructionChange('Observe: Golden threads dissolving lingering worries');
        soundscape.playDissolutionSwoosh();

        this.threadsEffect.startPhaseB_DownwardDissolution(() => {
          // Black threads completely dissolved!
          // Phase C: Golden threads rise and weave the encouragement message in air
          this.setSubstate('golden_threads_writing');
          this.callbacks.onInstructionChange('Observe: Words of encouragement taking form');
          this.callbacks.onNarrationSubtitle(this.threadsEffect.fullMessage);

          this.threadsEffect.startPhaseC_WeavingWords();
          // Keep the encouragement panel close and centred while it is narrated.
          this.zoomToEncouragement(6.5);

          // Weaving animation progress linked with speech
          let writeProgress = 0;
          const writeTimer = setInterval(() => {
            writeProgress += 0.015;
            this.threadsEffect.setTextProgress(writeProgress);
            if (writeProgress >= 1.0) {
              clearInterval(writeTimer);
            }
          }, 70);

          // Narrate exact matching message
          soundscape.speak(this.threadsEffect.fullMessage, () => {
            this.callbacks.onNarrationSubtitle(null);
            this.bedroom.setAtmosphereTransition(0.75);

            setTimeout(() => {
              this.threadsEffect.settle();
              this.setSubstate('orb_cleared');
              this.callbacks.onInstructionChange('Observe: The orb is freed and clear');

              setTimeout(() => {
                this.transitionToStage3();
              }, 1800);
            }, 1200);
          });
        });
      }, 1500); // Brief 1.5s orbit of anticipation
    }, 1800);
  }

  // ================= STAGE 3: CLOSURE =================

  public transitionToStage3() {
    this.currentStage = 'stage3_closure';
    this.setSubstate('orb_free_interaction');
    this.callbacks.onStageChange('stage3_closure', 'orb_free_interaction');
    this.callbacks.onInstructionChange('Action: Pinch and hold the orb, then move your hand. Release your pinch, then wave side-to-side to return it to the dock.');

    this.bedroom.setAtmosphereTransition(1.0);
  }

  public dockTheOrb() {
    this.dockAndOrb.isGrabbed = false;
    this.dockAndOrb.setDocked(true);
    soundscape.playScreenAbsorb(4);

    this.setSubstate('orb_docked');
    this.callbacks.onInstructionChange('Observe: The orb rests in the firewood dock');

    // Sequence: Glowing footsteps first, then film printing with wisdom inside orb
    setTimeout(() => {
      this.startGlowingFootsteps();
    }, 1000);
  }

  private startGlowingFootsteps() {
    this.setSubstate('glowing_footsteps');
    this.callbacks.onInstructionChange('Observe: A glowing path forms toward the doorway');

    this.footstepsAndFilm.startFootsteps(
      (stepIdx) => {
        soundscape.playFootstepChime(stepIdx);
      },
      () => {
        // Footsteps path lit -> begin printing circular film & wisdom quote inside orb!
        setTimeout(() => {
          this.printFilmAndDisplayWisdomInsideOrb();
        }, 1000);
      }
    );
  }

  /**
   * Stage 3: Print Circular Edible Film + Words of Wisdom INSIDE the Orb + Camera Zoom
   */
  private printFilmAndDisplayWisdomInsideOrb() {
    this.setSubstate('film_printing');
    this.callbacks.onInstructionChange('Observe: Your edible film is being printed');
    soundscape.playPrinterSound();

    // Let the user see the complete circular film emerge from the printer first.
    this.footstepsAndFilm.printEdibleFilm(() => {
      this.setSubstate('film_printed');

      const quote = 'A calmer mind creates a brighter tomorrow.';
      this.callbacks.onInstructionChange('Observe: Words of wisdom unfolding inside the orb');
      this.callbacks.onNarrationSubtitle(quote);

      // Reveal the matching words inside the orb only after the film has fully printed.
      this.dockAndOrb.renderWisdomInsideOrb(1.0);

      // Hold the orb close-up while the wisdom is being read.
      // Once narration finishes, move directly to the tabletop ritual objects
      // instead of returning to the distant seated view.
      this.zoomToOrb(60);
      soundscape.speak(quote, () => {
        this.callbacks.onNarrationSubtitle(null);
        this.zoomToRitualSetup(() => {
          this.callbacks.onInstructionChange('Action: Choose your ritual — eat the film or dissolve it in water');
        });
      });
    });
  }

  // Option 1: Eat the film
  public triggerEatRitual() {
    if (this.footstepsAndFilm.isFilmConsumed || this.footstepsAndFilm.isFilmDissolved) return;
    this.footstepsAndFilm.triggerConsumeFilm();
    soundscape.playScreenAbsorb(5);
    this.completeRitual('Eaten');
  }

  // Option 2: Dissolve the film in water
  public triggerDissolveRitual() {
    if (this.footstepsAndFilm.isFilmConsumed || this.footstepsAndFilm.isFilmDissolved) return;
    this.footstepsAndFilm.triggerDissolveInWater();
    soundscape.playWaterDissolve();
    this.completeRitual('Dissolved in water');
  }

  private completeRitual(_choice: string) {
    this.setSubstate('ritual_completed');
    this.currentStage = 'completed';
    this.callbacks.onStageChange('completed', 'ritual_completed');

    const finalMessage = "You've done enough. Now it's your time.";
    this.callbacks.onInstructionChange(`Observe: ${finalMessage}`);
    this.callbacks.onNarrationSubtitle(finalMessage);

    setTimeout(() => {
      soundscape.speak(finalMessage, () => {
        // Calming restful state
      });
    }, 600);
  }

  private setSubstate(sub: string) {
    this.currentSubstate = sub;
    this.callbacks.onStageChange(this.currentStage, sub);
  }

  // ================= RENDER LOOP & PACING =================

  private startLoop() {
    const tick = () => {
      const delta = Math.min(this.clock.getDelta(), 0.1);

      // Handle cinematic camera zoom animation
      if (this.cameraAnimation) {
        const anim = this.cameraAnimation;
        anim.elapsed += delta;

        if (anim.mode === 'in') {
          const t = Math.min(1.0, anim.elapsed / anim.duration);
          // Smooth cubic ease-in-out
          const ease = t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
          this.camera.position.lerpVectors(anim.startPos, anim.targetPos, ease);
          this.cameraLookTarget.lerpVectors(anim.startLook, anim.targetLook, ease);
          this.camera.lookAt(this.cameraLookTarget);

          if (t >= 1.0) {
            anim.mode = 'hold';
            anim.holdTimer = 0;
          }
        } else if (anim.mode === 'hold') {
          anim.holdTimer += delta;
          this.camera.lookAt(this.cameraLookTarget);
          if (anim.holdTimer >= anim.holdDuration) {
            if (anim.stayAtTarget) {
              // Keep the final ritual composition in place until the user acts.
              const onComp = anim.onComplete;
              this.cameraAnimation = null;
              if (onComp) onComp();
            } else {
              anim.mode = 'out';
              anim.elapsed = 0;
              anim.startPos = this.camera.position.clone();
              anim.targetPos = this.defaultCameraPos.clone();
              anim.startLook = this.cameraLookTarget.clone();
              anim.targetLook = this.defaultCameraTarget.clone();
            }
          }
        } else if (anim.mode === 'out') {
          const t = Math.min(1.0, anim.elapsed / anim.duration);
          const ease = t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
          this.camera.position.lerpVectors(anim.startPos, anim.targetPos, ease);
          this.cameraLookTarget.lerpVectors(anim.startLook, anim.targetLook, ease);
          this.camera.lookAt(this.cameraLookTarget);

          if (t >= 1.0) {
            const onComp = anim.onComplete;
            this.cameraAnimation = null;
            this.camera.position.copy(this.defaultCameraPos);
            this.cameraLookTarget.copy(this.defaultCameraTarget);
            if (onComp) onComp();
          }
        }
      } else {
        // Natural gentle seated breathing sway when not zooming
        this.seatedBreathingPhase += delta * 0.8;
        this.camera.position.x = this.defaultCameraPos.x + Math.sin(this.seatedBreathingPhase * 0.6) * 0.003;
        this.camera.position.y = this.defaultCameraPos.y + Math.sin(this.seatedBreathingPhase) * 0.004;
        this.camera.lookAt(this.cameraLookTarget);
      }

      // Update scene modules
      const orbPos = this.dockAndOrb.orbGroup.position;
      this.screenManager.update(delta, orbPos);
      this.dockAndOrb.update(delta, this.camera.position);
      this.threadsEffect.update(delta, orbPos, this.camera.position);
      this.footstepsAndFilm.update(delta);
      // Show the cup halo at exactly the same interaction stage as the film halo.
      const ritualPromptActive = this.footstepsAndFilm.isFilmPrinted &&
        !this.footstepsAndFilm.isFilmGrabbed &&
        !this.footstepsAndFilm.isFilmConsumed &&
        !this.footstepsAndFilm.isFilmDissolved &&
        !this.footstepsAndFilm.isFilmPrinting;
      this.bedroom.updateWaterGlassHalo(delta, ritualPromptActive);

      this.renderer.render(this.scene, this.camera);

      if (this.isSoftwareGl) {
        this.afterDraw(tick);
      } else {
        this.animationFrameId = requestAnimationFrame(tick);
      }
    };

    if (this.isSoftwareGl) {
      this.afterDraw(tick);
    } else {
      this.animationFrameId = requestAnimationFrame(tick);
    }
  }

  private afterDraw(cb: () => void) {
    const gl = this.renderer.getContext() as WebGL2RenderingContext;
    const sync = gl.fenceSync(gl.SYNC_GPU_COMMANDS_COMPLETE, 0);
    gl.flush();
    const poll = () => {
      const state = sync && gl.getSyncParameter(sync, gl.SYNC_STATUS);
      if (state === gl.UNSIGNALED) {
        this.animationFrameId = window.setTimeout(poll, 5);
      } else {
        if (sync) gl.deleteSync(sync);
        this.animationFrameId = window.setTimeout(cb, 80);
      }
    };
    this.animationFrameId = window.setTimeout(poll, 5);
  }

  public resetExperience() {
    this.currentStage = 'stage1_acknowledgement';
    this.currentSubstate = 'idle_waiting_wave';
    this.cameraAnimation = null;
    this.camera.position.copy(this.defaultCameraPos);
    this.cameraLookTarget.copy(this.defaultCameraTarget);
    this.camera.lookAt(this.cameraLookTarget);

    this.screenManager.reset();
    this.dockAndOrb.orbGroup.visible = false;
    this.dockAndOrb.orbGroup.scale.set(0.001, 0.001, 0.001);
    this.dockAndOrb.isMaterialized = false;
    this.dockAndOrb.setDocked(false);
    this.dockAndOrb.clearInternalDisplay();

    this.threadsEffect.currentPhase = 'idle';
    this.threadsEffect.group.visible = false;

    this.footstepsAndFilm.reset();
    this.bedroom.setAtmosphereTransition(0);

    this.callbacks.onStageChange('stage1_acknowledgement', 'idle_waiting_wave');
    this.callbacks.onInstructionChange('Action: Wave hand or click "Wave to Begin"');
    this.callbacks.onNarrationSubtitle(null);
  }

  public dispose() {
    cancelAnimationFrame(this.animationFrameId);
    clearTimeout(this.animationFrameId);
    window.removeEventListener('resize', this.onResize);
    if (this.handCursorLayer?.parentElement) {
      this.handCursorLayer.parentElement.removeChild(this.handCursorLayer);
    }
    this.handCursorLayer = null;
    this.handCursorElement = null;
    this.handCursorDot = null;
    const el = this.renderer?.domElement;
    if (el) {
      el.removeEventListener('pointermove', this.onPointerMove);
      el.removeEventListener('pointerdown', this.onPointerDown);
      el.removeEventListener('pointerup', this.onPointerUp);
      if (el.parentElement) {
        el.parentElement.removeChild(el);
      }
    }
    this.renderer?.dispose();
  }
}

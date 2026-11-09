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
  private readonly defaultCameraPos = new THREE.Vector3(0, 1.16, 0.62);
  private readonly defaultCameraTarget = new THREE.Vector3(0.08, 0.96, -1.4);
  private cameraLookTarget = new THREE.Vector3().copy(this.defaultCameraTarget);
  private seatedBreathingPhase: number = 0;

  // Experience State Machine
  public currentStage: ExperienceStage = 'stage1_acknowledgement';
  public currentSubstate: string = 'idle_waiting_wave';

  // Interaction Raycasting
  private raycaster = new THREE.Raycaster();
  private pointerNorm = new THREE.Vector2();
  private isPointerDown: boolean = false;
  private planeIntersect = new THREE.Plane(new THREE.Vector3(0, 0, 1), -0.08);
  private raycastHitPos = new THREE.Vector3();

  // Gesture Tracking
  private currentHandState: HandGestureState | null = null;
  private previousPinch: boolean = false;
  private previousWave: boolean = false;

  constructor(container: HTMLElement, callbacks: SceneCallbacks) {
    this.container = container;
    this.callbacks = callbacks;

    this.detectSoftwareGl();
    this.initRenderer();
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

    // Procedural Studio Environment for realistic PBR glass & brushed metals
    const pmremGenerator = new THREE.PMREMGenerator(this.renderer);
    pmremGenerator.compileEquirectangularShader();
    this.scene.environment = pmremGenerator.fromScene(new RoomEnvironment(), 0.04).texture;
    pmremGenerator.dispose();
  }

  private initCamera() {
    const aspect = this.container.clientWidth / this.container.clientHeight;
    // 64-degree FOV for natural human seated field of view
    this.camera = new THREE.PerspectiveCamera(62, aspect, 0.05, 50);
    this.camera.position.copy(this.defaultCameraPos);
    this.camera.lookAt(this.cameraLookTarget);
  }

  private initModules() {
    // 1. Bedroom
    this.bedroom = new BedroomEnvironment();
    this.scene.add(this.bedroom.group);

    // 2. 6 Floating Screens
    this.screenManager = new FloatingScreenManager();
    this.scene.add(this.screenManager.group);

    // 3. Central Orb & Docking Station
    this.dockAndOrb = new DockAndOrb();
    this.scene.add(this.dockAndOrb.group);

    // 4. Stage 2 Threads
    this.threadsEffect = new ThreadsEffect();
    this.scene.add(this.threadsEffect.group);

    // 5. Stage 3 Footsteps & Film
    this.footstepsAndFilm = new FootstepsAndFilm();
    this.scene.add(this.footstepsAndFilm.group);

    // Initial instruction prompt
    this.setSubstate('idle_waiting_wave');
    this.callbacks.onInstructionChange('Wave your hand (or click "Wave Hand") to begin.');
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

  private onPointerMove = (e: PointerEvent) => {
    const rect = this.renderer.domElement.getBoundingClientRect();
    this.pointerNorm.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
    this.pointerNorm.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;

    // Subtle seated gaze tracking (participant's subtle eye/head drift following pointer)
    const targetGazeX = this.defaultCameraTarget.x + this.pointerNorm.x * 0.08;
    const targetGazeY = this.defaultCameraTarget.y + this.pointerNorm.y * 0.05;
    this.cameraLookTarget.x = THREE.MathUtils.lerp(this.cameraLookTarget.x, targetGazeX, 0.08);
    this.cameraLookTarget.y = THREE.MathUtils.lerp(this.cameraLookTarget.y, targetGazeY, 0.08);

    // Dragging Orb in Stage 3
    if (this.dockAndOrb.isGrabbed) {
      this.raycaster.setFromCamera(this.pointerNorm, this.camera);
      if (this.raycaster.ray.intersectPlane(this.planeIntersect, this.raycastHitPos)) {
        // Clamp to comfortable seated desk area
        this.raycastHitPos.x = THREE.MathUtils.clamp(this.raycastHitPos.x, -0.6, 0.6);
        this.raycastHitPos.y = THREE.MathUtils.clamp(this.raycastHitPos.y, 0.76, 1.25);
        this.raycastHitPos.z = THREE.MathUtils.clamp(this.raycastHitPos.z, -0.2, 0.35);
        this.dockAndOrb.orbGroup.position.copy(this.raycastHitPos);
      }
    }

    // Dragging Edible Film in Stage 3
    if (this.footstepsAndFilm.isFilmGrabbed) {
      this.raycaster.setFromCamera(this.pointerNorm, this.camera);
      if (this.raycaster.ray.intersectPlane(this.planeIntersect, this.raycastHitPos)) {
        this.raycastHitPos.y = THREE.MathUtils.clamp(this.raycastHitPos.y, 0.74 + 0.01, 1.1);
        this.footstepsAndFilm.edibleFilmGroup.position.copy(this.raycastHitPos);

        // Check if dragged over water glass (x: -0.34, z: 0.12)
        const dToWater = this.raycastHitPos.distanceTo(new THREE.Vector3(-0.34, 0.74 + 0.08, 0.12));
        if (dToWater < 0.12) {
          this.triggerDissolveRitual();
        }
      }
    }
  };

  private onPointerDown = () => {
    this.isPointerDown = true;

    // Raycast check
    this.raycaster.setFromCamera(this.pointerNorm, this.camera);

    // Check click on Orb during Stage 3 free interaction
    if (this.currentStage === 'stage3_closure' && this.currentSubstate === 'orb_free_interaction') {
      const orbIntersects = this.raycaster.intersectObject(this.dockAndOrb.outerGlassOrb);
      if (orbIntersects.length > 0) {
        this.dockAndOrb.isGrabbed = true;
        this.dockAndOrb.setDocked(false);
        this.callbacks.onInstructionChange('Move the orb freely, or swipe towards dock to place it.');
        return;
      }
    }

    // Check click on Edible Film during Stage 3 takeaway ritual
    if (this.footstepsAndFilm.isFilmPrinted && !this.footstepsAndFilm.isFilmConsumed && !this.footstepsAndFilm.isFilmDissolved) {
      const filmIntersects = this.raycaster.intersectObject(this.footstepsAndFilm.edibleFilmMesh);
      if (filmIntersects.length > 0) {
        this.footstepsAndFilm.isFilmGrabbed = true;
        this.callbacks.onInstructionChange('Choose ritual: Drag to water glass to dissolve, or click "Eat Film".');
      }
    }
  };

  private onPointerUp = () => {
    this.isPointerDown = false;

    // Releasing Orb in Stage 3
    if (this.dockAndOrb.isGrabbed) {
      this.dockAndOrb.isGrabbed = false;

      // Check distance to docking cradle (0.25, 0.74, 0.08)
      const distToDock = this.dockAndOrb.orbGroup.position.distanceTo(this.dockAndOrb.dockPosition);
      if (distToDock < 0.22) {
        // Dock the orb!
        this.dockTheOrb();
      } else {
        // Let it gently float back toward hover target
        this.dockAndOrb.currentOrbTarget.copy(this.dockAndOrb.orbGroup.position);
      }
    }

    // Releasing Edible Film
    if (this.footstepsAndFilm.isFilmGrabbed) {
      this.footstepsAndFilm.isFilmGrabbed = false;
      const filmPos = this.footstepsAndFilm.edibleFilmGroup.position;
      const dToWater = filmPos.distanceTo(new THREE.Vector3(-0.34, 0.74 + 0.08, 0.12));
      if (dToWater < 0.14) {
        this.triggerDissolveRitual();
      }
    }
  };

  /**
   * Handle Gestures from MediaPipe Hand Tracker
   */
  public handleHandGesture(state: HandGestureState) {
    this.currentHandState = state;

    if (!state.isHandDetected) {
      this.previousPinch = false;
      this.previousWave = false;
      return;
    }

    // Map hand coordinates (0..1) to NDC (-1..1)
    const ndcX = (state.handX - 0.5) * 2;
    const ndcY = -(state.handY - 0.5) * 2;
    this.pointerNorm.set(ndcX, ndcY);

    // 1. Hand Wave in Stage 1 Idle
    if (this.currentStage === 'stage1_acknowledgement' && this.currentSubstate === 'idle_waiting_wave') {
      if (state.isWaving && !this.previousWave) {
        this.triggerStartWave();
      }
    }

    // 2. Pinching to Grab Orb in Stage 3
    if (this.currentStage === 'stage3_closure' && this.currentSubstate === 'orb_free_interaction') {
      if (state.isPinching && !this.previousPinch) {
        // Pinch initiated
        this.dockAndOrb.isGrabbed = true;
        this.dockAndOrb.setDocked(false);
      } else if (!state.isPinching && this.previousPinch) {
        // Pinch released
        if (this.dockAndOrb.isGrabbed) {
          this.dockAndOrb.isGrabbed = false;
          const distToDock = this.dockAndOrb.orbGroup.position.distanceTo(this.dockAndOrb.dockPosition);
          if (distToDock < 0.24) {
            this.dockTheOrb();
          }
        }
      }

      // Open-palm flick or swipe towards dock
      if (state.isSwiping && state.swipeDirection === 'right') {
        this.dockTheOrb();
      }

      // If grabbed, follow hand position
      if (this.dockAndOrb.isGrabbed) {
        const targetX = ndcX * 0.45;
        const targetY = 0.74 + 0.25 + ndcY * 0.25;
        const targetZ = 0.08;
        this.dockAndOrb.orbGroup.position.lerp(new THREE.Vector3(targetX, targetY, targetZ), 0.15);
      }
    }

    // 3. Pinching to grab edible film
    if (this.footstepsAndFilm.isFilmPrinted && !this.footstepsAndFilm.isFilmConsumed && !this.footstepsAndFilm.isFilmDissolved) {
      if (state.isPinching && !this.previousPinch) {
        this.footstepsAndFilm.isFilmGrabbed = true;
      } else if (!state.isPinching && this.previousPinch && this.footstepsAndFilm.isFilmGrabbed) {
        this.footstepsAndFilm.isFilmGrabbed = false;
        const filmPos = this.footstepsAndFilm.edibleFilmGroup.position;
        const dToWater = filmPos.distanceTo(new THREE.Vector3(-0.34, 0.74 + 0.08, 0.12));
        if (dToWater < 0.15) {
          this.triggerDissolveRitual();
        }
      }

      if (this.footstepsAndFilm.isFilmGrabbed) {
        const targetX = ndcX * 0.4;
        const targetY = 0.74 + 0.15 + ndcY * 0.2;
        const targetZ = 0.12;
        this.footstepsAndFilm.edibleFilmGroup.position.lerp(new THREE.Vector3(targetX, targetY, targetZ), 0.2);
      }
    }

    this.previousPinch = state.isPinching;
    this.previousWave = state.isWaving;
  }

  // ================= STAGE 1: ACKNOWLEDGEMENT =================

  public triggerStartWave() {
    if (this.currentSubstate !== 'idle_waiting_wave') return;
    this.setSubstate('orb_materializing');
    this.callbacks.onInstructionChange('The central orb awakens...');

    // 1. Materialize glass orb above dock
    this.dockAndOrb.materialize();

    setTimeout(() => {
      // 2. Absorb screens into orb one after another
      this.setSubstate('screens_absorbing');
      this.callbacks.onInstructionChange('Absorbing your day\'s work into the orb...');

      const orbWorldPos = this.dockAndOrb.dockPosition.clone();
      orbWorldPos.y = this.dockAndOrb.orbHoverY;

      this.screenManager.startAbsorption(
        (index) => {
          soundscape.playScreenAbsorb(index);
        },
        () => {
          // 3. All screens absorbed -> display accomplishments inside orb
          this.showAccomplishmentsInsideOrb();
        }
      );
    }, 1800);
  }

  private showAccomplishmentsInsideOrb() {
    this.setSubstate('showing_accomplishments');
    this.callbacks.onInstructionChange('Recognizing what you accomplished today.');

    let fade = 0;
    const interval = setInterval(() => {
      fade += 0.05;
      this.dockAndOrb.showAccomplishments(fade);
      if (fade >= 1.0) {
        clearInterval(interval);

        // Pause to absorb accomplishments, then transition to Stage 2
        setTimeout(() => {
          this.transitionToStage2();
        }, 5500);
      }
    }, 40);
  }

  // ================= STAGE 2: ENCOURAGEMENT =================

  public transitionToStage2() {
    this.currentStage = 'stage2_encouragement';
    this.setSubstate('black_threads_emerging');
    this.callbacks.onStageChange('stage2_encouragement', 'black_threads_emerging');
    this.callbacks.onInstructionChange('Acknowledging the mental weight and lingering worries...');

    // Fade out accomplishments from inside orb
    let fade = 1.0;
    const fadeOut = setInterval(() => {
      fade -= 0.08;
      this.dockAndOrb.showAccomplishments(fade);
      if (fade <= 0) {
        clearInterval(fadeOut);
        this.dockAndOrb.showAccomplishments(0);
      }
    }, 40);

    // Warm bedroom atmosphere transition
    this.bedroom.setAtmosphereTransition(0.45);

    // 1. Black threads emerge around orb
    const orbPos = this.dockAndOrb.orbGroup.position;
    this.threadsEffect.startStage2(orbPos);

    setTimeout(() => {
      // 2. Golden threads appear and physically write encouragement message
      this.setSubstate('golden_threads_writing');
      this.threadsEffect.activateGoldenWriting();
      soundscape.playThreadShimmer();

      const message = this.threadsEffect.fullMessage;
      this.callbacks.onInstructionChange('Words of encouragement taking form...');
      this.callbacks.onNarrationSubtitle(message);

      // Progressive writing animation linked with speech
      let writeProgress = 0;
      const writeTimer = setInterval(() => {
        writeProgress += 0.015;
        this.threadsEffect.setTextProgress(writeProgress);
        if (writeProgress >= 1.0) {
          clearInterval(writeTimer);
        }
      }, 70);

      // 3. Spoken voice reading exact same message
      // CRITICAL REQUIREMENT: Spoken message MUST finish completely before black threads dissolve!
      soundscape.speak(message, () => {
        // Voice is 100% finished now
        this.callbacks.onNarrationSubtitle(null);
        this.setSubstate('threads_dissolving');
        this.callbacks.onInstructionChange('Releasing lingering worries into golden light...');

        soundscape.playDissolutionSwoosh();
        this.threadsEffect.startDissolution();

        // Bedroom warms further
        this.bedroom.setAtmosphereTransition(0.75);

        setTimeout(() => {
          this.setSubstate('orb_cleared');
          this.callbacks.onInstructionChange('The orb is freed and clear.');

          setTimeout(() => {
            this.transitionToStage3();
          }, 2400);
        }, 2200);
      });
    }, 2800);
  }

  // ================= STAGE 3: CLOSURE =================

  public transitionToStage3() {
    this.currentStage = 'stage3_closure';
    this.setSubstate('orb_free_interaction');
    this.callbacks.onStageChange('stage3_closure', 'orb_free_interaction');
    this.callbacks.onInstructionChange('Feel free to grab, move or toss the orb. Return it to the dock when ready.');

    // Bedroom atmosphere becomes completely calm and restful
    this.bedroom.setAtmosphereTransition(1.0);
  }

  public dockTheOrb() {
    this.dockAndOrb.isGrabbed = false;
    this.dockAndOrb.setDocked(true);
    soundscape.playScreenAbsorb(4);

    this.setSubstate('orb_docked');
    this.callbacks.onInstructionChange('The orb has returned to its dock.');

    // Step B: Wisdom Quote
    setTimeout(() => {
      this.playWisdomQuote();
    }, 1200);
  }

  private playWisdomQuote() {
    this.setSubstate('wisdom_quote');
    const quote = 'A calmer mind creates a brighter tomorrow.';
    this.callbacks.onInstructionChange(`"${quote}"`);
    this.callbacks.onNarrationSubtitle(quote);

    // CRITICAL REQUIREMENT: Wisdom quote must finish before footsteps begin!
    soundscape.speak(quote, () => {
      this.callbacks.onNarrationSubtitle(null);
      setTimeout(() => {
        this.startGlowingFootsteps();
      }, 800);
    });
  }

  private startGlowingFootsteps() {
    this.setSubstate('glowing_footsteps');
    this.callbacks.onInstructionChange('A path forms toward the doorway, gently calling you away from work.');

    this.footstepsAndFilm.startFootsteps(
      (stepIdx) => {
        soundscape.playFootstepChime(stepIdx);
      },
      () => {
        // All footsteps lit!
        setTimeout(() => {
          this.printEdibleFilm();
        }, 1200);
      }
    );
  }

  private printEdibleFilm() {
    // CRITICAL REQUIREMENT: Edible film only prints AFTER footsteps sequence!
    this.setSubstate('film_printed');
    this.callbacks.onInstructionChange('Your takeaway film has printed. Choose your ritual: Eat or Dissolve in water.');

    soundscape.playPrinterSound();
    this.footstepsAndFilm.printEdibleFilm();
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
    this.callbacks.onInstructionChange(finalMessage);
    this.callbacks.onNarrationSubtitle(finalMessage);

    setTimeout(() => {
      soundscape.speak(finalMessage, () => {
        // Serene completion state
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

      // Seated camera gentle breathing sway
      this.seatedBreathingPhase += delta * 0.8;
      this.camera.position.x = this.defaultCameraPos.x + Math.sin(this.seatedBreathingPhase * 0.6) * 0.003;
      this.camera.position.y = this.defaultCameraPos.y + Math.sin(this.seatedBreathingPhase) * 0.004;
      this.camera.lookAt(this.cameraLookTarget);

      // Update modules
      const orbPos = this.dockAndOrb.orbGroup.position;
      this.screenManager.update(delta, orbPos);
      this.dockAndOrb.update(delta, this.camera.position);
      this.threadsEffect.update(delta, orbPos, this.camera.position);
      this.footstepsAndFilm.update(delta);

      // Render
      this.renderer.render(this.scene, this.camera);

      // Frame pacing for software WebGL
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
    this.screenManager.reset();
    this.dockAndOrb.orbGroup.visible = false;
    this.dockAndOrb.orbGroup.scale.set(0.001, 0.001, 0.001);
    this.dockAndOrb.isMaterialized = false;
    this.dockAndOrb.setDocked(false);
    this.threadsEffect.isStage2Active = false;
    this.threadsEffect.group.visible = false;
    this.footstepsAndFilm.reset();
    this.bedroom.setAtmosphereTransition(0);
    this.callbacks.onStageChange('stage1_acknowledgement', 'idle_waiting_wave');
    this.callbacks.onInstructionChange('Wave your hand (or click "Wave Hand") to begin.');
    this.callbacks.onNarrationSubtitle(null);
  }

  public dispose() {
    cancelAnimationFrame(this.animationFrameId);
    clearTimeout(this.animationFrameId);
    window.removeEventListener('resize', this.onResize);
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

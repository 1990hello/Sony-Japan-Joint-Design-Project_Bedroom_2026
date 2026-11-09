/**
 * EXORA Stage 3: Glowing Footsteps, Circular Edible-Film Printing & Ritual Choices
 * Implements progressive doorway footsteps, circular printed edible film with wisdom inscription,
 * and dual takeaway rituals (Eat or Dissolve in water glass).
 */

import * as THREE from 'three';
import { createFootstepTexture } from './materials';

export class FootstepsAndFilm {
  public group: THREE.Group;
  private footstepsGroup: THREE.Group;
  private footstepMeshes: THREE.Mesh[] = [];

  // Circular Edible Film
  public edibleFilmGroup: THREE.Group;
  public edibleFilmMesh!: THREE.Mesh;
  public edibleFilmHitArea!: THREE.Mesh;
  private filmPromptRing!: THREE.Mesh;
  private filmPromptTime: number = 0;
  private filmCanvas!: HTMLCanvasElement;
  private filmTexture!: THREE.CanvasTexture;
  private isFilmPrinting: boolean = false;
  private filmPrintElapsed: number = 0;
  private readonly filmPrintDuration: number = 1.8;
  private filmPrintStart = new THREE.Vector3();
  private onFilmPrintComplete?: () => void;

  // The circular film rests just in front of the firewood dock printer slot
  public readonly filmInitialPos = new THREE.Vector3(0, 0.74 + 0.002, -0.23 + 0.155);
  public isFilmPrinted: boolean = false;
  public isFilmGrabbed: boolean = false;
  public isFilmConsumed: boolean = false;
  public isFilmDissolved: boolean = false;

  // Water dissolution effervescence
  private bubblesSystem!: THREE.Points;
  private isEffervescing: boolean = false;
  private effervescenceTime: number = 0;

  // Doorway illumination
  public doorwayGlowMesh!: THREE.Mesh;

  // Sequence state
  public isFootstepsActive: boolean = false;
  private currentStepIndex: number = 0;
  private stepInterval: number = 0.45;
  private stepTimer: number = 0;
  private onAllStepsLit?: () => void;
  private onStepLit?: (index: number) => void;

  constructor() {
    this.group = new THREE.Group();
    this.footstepsGroup = new THREE.Group();
    this.edibleFilmGroup = new THREE.Group();

    this.group.add(this.footstepsGroup);
    this.group.add(this.edibleFilmGroup);

    this.buildFootstepsPath();
    this.buildCircularEdibleFilm();
    this.buildDoorwayGlow();
    this.buildEffervescenceParticles();

    this.edibleFilmGroup.visible = false;
  }

  private buildFootstepsPath() {
    // The trail begins at the orb on the tabletop, exits over the right edge,
    // then follows the desk's right side across the floor toward the doorway.
    const curve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(0.0, 0.746, -0.23),
      new THREE.Vector3(0.28, 0.746, -0.23),
      new THREE.Vector3(0.58, 0.746, -0.23),
      new THREE.Vector3(0.82, 0.746, -0.23),
      // Keep floor-level footprints clearly above both the rug surface (y = 0.005)
      // and the room floor so the translucent decals cannot appear buried or z-fight.
      // Step off the desk, move across to the room's right-hand side, then follow
      // that side of the room toward the relocated doorway.
      new THREE.Vector3(1.02, 0.025, -0.28),
      new THREE.Vector3(2.15, 0.025, -0.32),
      new THREE.Vector3(3.05, 0.025, -0.48),
      new THREE.Vector3(3.08, 0.025, -1.25),
      new THREE.Vector3(3.08, 0.025, -2.2),
      new THREE.Vector3(3.08, 0.025, -3.1),
      // Finish at the relocated doorway (x = 3.48, z = -4.1).
      new THREE.Vector3(3.4, 0.025, -4.1),
    ]);

    const stepPoints = curve.getPoints(16);
    const footstepTex = createFootstepTexture();

    stepPoints.forEach((pt, i) => {
      const nextPt = stepPoints[Math.min(stepPoints.length - 1, i + 1)];
      const tangent = new THREE.Vector3().subVectors(nextPt, pt).normalize();
      const normal = new THREE.Vector3(-tangent.z, 0, tangent.x);
      const isRightFoot = i % 2 === 1;
      const footPos = pt.clone().addScaledVector(normal, isRightFoot ? 0.12 : -0.12);

      const mat = new THREE.MeshBasicMaterial({
        map: footstepTex,
        transparent: true,
        opacity: 0.0,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
      });

      const geo = new THREE.PlaneGeometry(0.18, 0.32);
      const mesh = new THREE.Mesh(geo, mat);
      mesh.rotation.x = -Math.PI / 2;

      const angle = Math.atan2(tangent.x, tangent.z);
      mesh.rotation.z = angle + Math.PI;

      mesh.position.copy(footPos);
      mesh.renderOrder = 2;
      this.footstepsGroup.add(mesh);
      this.footstepMeshes.push(mesh);
    });
  }

  /**
   * Circular Edible Film with concentric micronutrient rings and inscribed wisdom quote
   */
  private buildCircularEdibleFilm() {
    this.edibleFilmGroup.position.copy(this.filmInitialPos);

    // Render inscribed circular canvas
    this.filmCanvas = document.createElement('canvas');
    this.filmCanvas.width = 512;
    this.filmCanvas.height = 512;
    const ctx = this.filmCanvas.getContext('2d')!;

    // Saturated luminous violet film for stronger contrast against the golden footsteps and wood.
    const grad = ctx.createRadialGradient(256, 256, 8, 256, 256, 250);
    grad.addColorStop(0, 'rgba(245, 230, 255, 1)');
    grad.addColorStop(0.62, 'rgba(190, 125, 255, 0.99)');
    grad.addColorStop(1, 'rgba(112, 55, 205, 0.98)');
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(256, 256, 248, 0, Math.PI * 2);
    ctx.fill();

    // Fine concentric micro-nutrient rings
    ctx.strokeStyle = 'rgba(75, 30, 145, 0.72)';
    ctx.lineWidth = 1.5;
    for (let r = 50; r < 240; r += 32) {
      ctx.beginPath();
      ctx.arc(256, 256, r, 0, Math.PI * 2);
      ctx.stroke();
    }

    // Bright lavender-white edge for a clearly defined silhouette
    ctx.strokeStyle = '#fff0ff';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.arc(256, 256, 244, 0, Math.PI * 2);
    ctx.stroke();

    // Inscribed Words of Wisdom
    ctx.textAlign = 'center';
    ctx.fillStyle = '#281044';
    ctx.font = 'bold 22px "Space Grotesk", sans-serif';
    ctx.fillText('EXORA // 2046', 256, 165);

    ctx.font = 'italic 500 24px "Playfair Display", Georgia, serif';
    ctx.fillText('"A calmer mind creates', 256, 245);
    ctx.fillText('a brighter tomorrow."', 256, 285);

    ctx.font = '500 16px "Space Grotesk", sans-serif';
    ctx.fillStyle = '#45206f';
    ctx.fillText('EDIBLE BOTANICAL EXTRACT', 256, 360);

    this.filmTexture = new THREE.CanvasTexture(this.filmCanvas);
    this.filmTexture.colorSpace = THREE.SRGBColorSpace;

    // Disc material (translucent edible biopolymer)
    const filmMat = new THREE.MeshPhysicalMaterial({
      map: this.filmTexture,
      color: 0xf0d8ff,
      emissive: 0x54208f,
      emissiveIntensity: 0.55,
      transmission: 0.22,
      opacity: 0.98,
      transparent: true,
      roughness: 0.28,
      metalness: 0.03,
      ior: 1.48,
      clearcoat: 0.9,
      depthWrite: false,
      side: THREE.DoubleSide,
    });

    // Slightly larger wafer: radius 0.034m (~68mm diameter), height 0.0008m
    const filmGeo = new THREE.CylinderGeometry(0.034, 0.034, 0.0008, 48);
    this.edibleFilmMesh = new THREE.Mesh(filmGeo, filmMat);
    this.edibleFilmGroup.add(this.edibleFilmMesh);

    // Generous circular hit area around the enlarged film.
    const hitGeo = new THREE.CircleGeometry(0.068, 40);
    const hitMat = new THREE.MeshBasicMaterial({
      transparent: true,
      opacity: 0,
      colorWrite: false,
      depthWrite: false,
      side: THREE.DoubleSide,
    });
    this.edibleFilmHitArea = new THREE.Mesh(hitGeo, hitMat);
    this.edibleFilmHitArea.rotation.x = -Math.PI / 2;
    this.edibleFilmHitArea.position.y = 0.001;
    this.edibleFilmGroup.add(this.edibleFilmHitArea);

    // Pulsing halo makes the printed film read as an interactive object.
    const promptRingGeo = new THREE.TorusGeometry(0.047, 0.0022, 8, 64);
    const promptRingMat = new THREE.MeshBasicMaterial({
      color: 0xf0c9ff,
      transparent: true,
      opacity: 0,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });
    this.filmPromptRing = new THREE.Mesh(promptRingGeo, promptRingMat);
    this.filmPromptRing.rotation.x = -Math.PI / 2;
    this.filmPromptRing.position.y = 0.003;
    this.edibleFilmGroup.add(this.filmPromptRing);
  }

  private buildDoorwayGlow() {
    const glowGeo = new THREE.PlaneGeometry(1.2, 2.3);
    const glowMat = new THREE.MeshBasicMaterial({
      color: 0xffbe72,
      transparent: true,
      opacity: 0.0,
      blending: THREE.AdditiveBlending,
      side: THREE.DoubleSide,
      depthWrite: false,
    });
    this.doorwayGlowMesh = new THREE.Mesh(glowGeo, glowMat);
    // Keep the warm doorway glow centred on the relocated doorway.
    this.doorwayGlowMesh.position.set(3.48, 1.15, -4.1);
    this.doorwayGlowMesh.rotation.y = -Math.PI / 2;
    this.group.add(this.doorwayGlowMesh);
  }

  private buildEffervescenceParticles() {
    const count = 90;
    const geo = new THREE.BufferGeometry();
    const pos = new Float32Array(count * 3);
    const vels = new Float32Array(count * 3);

    for (let i = 0; i < count; i++) {
      pos[i * 3] = -0.5 + (Math.random() - 0.5) * 0.06;
      pos[i * 3 + 1] = 0.74 + 0.02 + Math.random() * 0.06;
      pos[i * 3 + 2] = -0.2 + (Math.random() - 0.5) * 0.06;

      vels[i * 3] = (Math.random() - 0.5) * 0.01;
      vels[i * 3 + 1] = 0.03 + Math.random() * 0.04;
      vels[i * 3 + 2] = (Math.random() - 0.5) * 0.01;
    }

    geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    geo.setAttribute('velocity', new THREE.BufferAttribute(vels, 3));

    const mat = new THREE.PointsMaterial({
      color: 0xcdefff,
      size: 0.003,
      transparent: true,
      opacity: 0.0,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });

    this.bubblesSystem = new THREE.Points(geo, mat);
    this.group.add(this.bubblesSystem);
  }

  public startFootsteps(onStepLit?: (index: number) => void, onAllStepsLit?: () => void) {
    this.isFootstepsActive = true;
    this.currentStepIndex = 0;
    this.stepTimer = 0;
    this.onStepLit = onStepLit;
    this.onAllStepsLit = onAllStepsLit;
  }

  public printEdibleFilm(onComplete?: () => void) {
    this.isFilmPrinted = false;
    this.isFilmPrinting = true;
    this.filmPrintElapsed = 0;
    this.onFilmPrintComplete = onComplete;
    this.edibleFilmGroup.visible = true;

    // Align the film's leading centre with the printer mouth (dock z + hatch front face),
    // then extrude it forward onto the tabletop.
    this.filmPrintStart.set(0, 0.74 + 0.024, -0.23 + 0.114 + 0.004);
    this.edibleFilmGroup.position.copy(this.filmPrintStart);
    this.edibleFilmGroup.scale.set(0.72, 0.72, 0.72);
    (this.edibleFilmMesh.material as THREE.MeshPhysicalMaterial).opacity = 0.15;
  }

  public triggerDissolveInWater() {
    this.isFilmDissolved = true;
    this.isEffervescing = true;
    this.effervescenceTime = 0;
    // Animate film dissolving into the water glass
    this.edibleFilmGroup.position.set(-0.5, 0.74 + 0.08, -0.2);
  }

  public triggerConsumeFilm() {
    this.isFilmConsumed = true;
    this.edibleFilmGroup.position.set(0, 1.1, 0.4);
  }

  public update(delta: number) {
    // 1. Progressive footsteps illumination
    if (this.isFootstepsActive && this.currentStepIndex < this.footstepMeshes.length) {
      this.stepTimer += delta;
      if (this.stepTimer >= this.stepInterval) {
        this.stepTimer = 0;
        const mesh = this.footstepMeshes[this.currentStepIndex];
        (mesh.material as THREE.MeshBasicMaterial).opacity = 0.85;

        if (this.onStepLit) {
          this.onStepLit(this.currentStepIndex);
        }

        this.currentStepIndex++;

        const glowFactor = this.currentStepIndex / this.footstepMeshes.length;
        (this.doorwayGlowMesh.material as THREE.MeshBasicMaterial).opacity = glowFactor * 0.35;

        if (this.currentStepIndex === this.footstepMeshes.length && this.onAllStepsLit) {
          this.onAllStepsLit();
        }
      }
    }

    // 2. Animate the circular film physically extruding from the printer slot.
    if (this.isFilmPrinting) {
      this.filmPrintElapsed += delta;
      const raw = Math.min(1, this.filmPrintElapsed / this.filmPrintDuration);
      const eased = 1 - Math.pow(1 - raw, 3);
      this.edibleFilmGroup.position.lerpVectors(this.filmPrintStart, this.filmInitialPos, eased);
      const scale = THREE.MathUtils.lerp(0.72, 1, eased);
      this.edibleFilmGroup.scale.setScalar(scale);
      (this.edibleFilmMesh.material as THREE.MeshPhysicalMaterial).opacity = THREE.MathUtils.lerp(0.15, 0.92, eased);

      if (raw >= 1) {
        this.isFilmPrinting = false;
        this.isFilmPrinted = true;
        this.edibleFilmGroup.position.copy(this.filmInitialPos);
        this.edibleFilmGroup.scale.setScalar(1);
        (this.edibleFilmMesh.material as THREE.MeshPhysicalMaterial).opacity = 0.92;
        const onComplete = this.onFilmPrintComplete;
        this.onFilmPrintComplete = undefined;
        onComplete?.();
      }
    }

    // 3. Water effervescence bubbles
    if (this.isEffervescing) {
      this.effervescenceTime += delta;
      const bMat = this.bubblesSystem.material as THREE.PointsMaterial;
      bMat.opacity = Math.max(0, Math.sin(Math.min(1.0, this.effervescenceTime / 2.5) * Math.PI) * 0.9);

      const pos = this.bubblesSystem.geometry.attributes.position;
      const vel = this.bubblesSystem.geometry.attributes.velocity;
      for (let i = 0; i < pos.count; i++) {
        let y = pos.getY(i) + vel.getY(i) * delta;
        if (y > 0.74 + 0.1) {
          y = 0.74 + 0.02;
        }
        pos.setY(i, y);
      }
      pos.needsUpdate = true;

      if (this.edibleFilmMesh) {
        const fMat = this.edibleFilmMesh.material as THREE.MeshPhysicalMaterial;
        fMat.opacity = Math.max(0, 0.92 * (1 - this.effervescenceTime / 2.0));
        const s = Math.max(0.01, 1 - this.effervescenceTime / 2.0);
        this.edibleFilmMesh.scale.set(s, s, s);
      }

      if (this.effervescenceTime > 2.6) {
        this.isEffervescing = false;
        this.edibleFilmGroup.visible = false;
      }
    }

    // 4. Interactive halo gently pulses after printing until the user picks up the film.
    this.filmPromptTime += delta;
    const promptActive = this.isFilmPrinted && !this.isFilmGrabbed &&
      !this.isFilmConsumed && !this.isFilmDissolved && !this.isFilmPrinting;
    const promptPulse = 0.5 + 0.5 * Math.sin(this.filmPromptTime * 3.2);
    const promptMat = this.filmPromptRing.material as THREE.MeshBasicMaterial;
    promptMat.opacity = promptActive ? 0.38 + promptPulse * 0.42 : 0;
    const promptScale = 1 + promptPulse * 0.12;
    this.filmPromptRing.scale.set(promptScale, promptScale, promptScale);

    // 5. Consume film animation
    if (this.isFilmConsumed && this.edibleFilmGroup.visible) {
      const fMat = this.edibleFilmMesh.material as THREE.MeshPhysicalMaterial;
      fMat.opacity = Math.max(0, fMat.opacity - delta * 1.5);
      this.edibleFilmMesh.scale.multiplyScalar(0.94);
      if (fMat.opacity <= 0.02) {
        this.edibleFilmGroup.visible = false;
      }
    }
  }

  public reset() {
    this.isFootstepsActive = false;
    this.currentStepIndex = 0;
    this.stepTimer = 0;
    this.footstepMeshes.forEach(mesh => {
      (mesh.material as THREE.MeshBasicMaterial).opacity = 0;
    });
    (this.doorwayGlowMesh.material as THREE.MeshBasicMaterial).opacity = 0;

    this.isFilmPrinted = false;
    this.isFilmPrinting = false;
    this.filmPrintElapsed = 0;
    this.filmPromptTime = 0;
    (this.filmPromptRing.material as THREE.MeshBasicMaterial).opacity = 0;
    this.onFilmPrintComplete = undefined;
    this.isFilmGrabbed = false;
    this.isFilmConsumed = false;
    this.isFilmDissolved = false;
    this.isEffervescing = false;
    this.edibleFilmGroup.visible = false;
    this.edibleFilmGroup.position.copy(this.filmInitialPos);
    this.edibleFilmMesh.scale.set(1, 1, 1);
    (this.edibleFilmMesh.material as THREE.MeshPhysicalMaterial).opacity = 0.92;
    (this.bubblesSystem.material as THREE.PointsMaterial).opacity = 0;
  }
}

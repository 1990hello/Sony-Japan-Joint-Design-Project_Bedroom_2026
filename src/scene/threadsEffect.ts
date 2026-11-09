/**
 * EXORA Stage 2: Golden Threads Weaving & Black Thread Dissolution
 * 
 * Choreography:
 * Phase A — Golden threads emerge from orb, brief 1.5s orbit of anticipation.
 * Phase B — Golden threads stream downwards toward the docking station, physically passing through the black tethers, dissolving them progressively from top to bottom.
 * Phase C — Golden threads rise into the air above the orb to weave the words of encouragement along letter paths, synchronized with voice narration.
 */

import * as THREE from 'three';

export type Stage2Phase = 'idle' | 'black_tethers_active' | 'golden_orbit' | 'golden_dissolving_downwards' | 'golden_weaving_words' | 'settled';

export class ThreadsEffect {
  public group: THREE.Group;
  private blackThreadsGroup: THREE.Group;
  private goldenThreadsGroup: THREE.Group;
  private descendingGoldenGroup: THREE.Group;
  private textCanvasMesh!: THREE.Mesh;
  private textCanvas!: HTMLCanvasElement;
  private textTexture!: THREE.CanvasTexture;
  private tracerParticle!: THREE.Mesh;
  private weavingStrands: THREE.Line[] = [];

  // Dissolution particles & contact glow
  private dissolutionParticles!: THREE.Points;
  private goldenDissolutionRing!: THREE.Mesh;

  public currentPhase: Stage2Phase = 'idle';
  private phaseTimer: number = 0;

  // Geometry references
  private blackStrands: { line: THREE.Line; basePoints: THREE.Vector3[] }[] = [];
  private descendingStrands: THREE.Line[] = [];
  private orbitCurves: THREE.Line[] = [];

  public readonly fullMessage = "You've put in so much effort, and it really shows. Take a moment to be proud — you've done more than you think.";
  private textRevealFraction: number = 0;

  private onPhaseBComplete?: () => void;
  private onWeavingComplete?: () => void;

  constructor() {
    this.group = new THREE.Group();
    this.blackThreadsGroup = new THREE.Group();
    this.goldenThreadsGroup = new THREE.Group();
    this.descendingGoldenGroup = new THREE.Group();

    this.group.add(this.blackThreadsGroup);
    this.group.add(this.goldenThreadsGroup);
    this.group.add(this.descendingGoldenGroup);

    this.buildBlackTethers();
    this.buildGoldenOrbitStrands();
    this.buildDescendingGoldenStrands();
    this.buildTextDisplayAndWeavers();
    this.buildDissolutionParticles();

    this.group.visible = false;
  }

  /**
   * Black tethers connecting dock to orb underside
   */
  private buildBlackTethers() {
    const blackMat = new THREE.LineBasicMaterial({
      color: 0x161514,
      linewidth: 2,
      transparent: true,
      opacity: 0.9,
    });

    const strandCount = 8;
    const dockY = -0.195; // Docking station surface (local to orb center)
    const orbUndersideY = -0.068; // Underside of orb
    const dockRadius = 0.056;
    const orbRadius = 0.034;

    for (let i = 0; i < strandCount; i++) {
      const angle = (i / strandCount) * Math.PI * 2;
      const pts: THREE.Vector3[] = [];

      for (let s = 0; s <= 20; s++) {
        const t = s / 20; // 0 = dock, 1 = orb
        const r = THREE.MathUtils.lerp(dockRadius, orbRadius, t);
        const y = THREE.MathUtils.lerp(dockY, orbUndersideY, t);
        const bow = Math.sin(t * Math.PI) * 0.003;
        pts.push(new THREE.Vector3(Math.cos(angle) * (r + bow), y, Math.sin(angle) * (r + bow)));
      }

      const geo = new THREE.BufferGeometry().setFromPoints(pts);
      const line = new THREE.Line(geo, blackMat.clone());
      this.blackThreadsGroup.add(line);
      this.blackStrands.push({ line, basePoints: pts });
    }
  }

  /**
   * Phase A: Brief golden orbit around orb
   */
  private buildGoldenOrbitStrands() {
    const goldMat = new THREE.LineBasicMaterial({
      color: 0xffdf80,
      linewidth: 2.5,
      transparent: true,
      opacity: 0.9,
      blending: THREE.AdditiveBlending,
    });

    for (let g = 0; g < 6; g++) {
      const pts: THREE.Vector3[] = [];
      const steps = 36;
      const r = 0.088 + g * 0.008;
      const angleOffset = (g / 6) * Math.PI * 2;

      for (let s = 0; s <= steps; s++) {
        const theta = (s / steps) * Math.PI * 2.2 + angleOffset;
        const y = Math.sin(s * 0.35 + g) * 0.06;
        pts.push(new THREE.Vector3(r * Math.cos(theta), y, r * Math.sin(theta)));
      }

      const curve = new THREE.CatmullRomCurve3(pts);
      const geo = new THREE.BufferGeometry().setFromPoints(curve.getPoints(40));
      const line = new THREE.Line(geo, goldMat);
      this.goldenThreadsGroup.add(line);
      this.orbitCurves.push(line);
    }
  }

  /**
   * Phase B: Descending golden strands flowing downwards to dissolve black tethers
   */
  private buildDescendingGoldenStrands() {
    const goldMat = new THREE.LineBasicMaterial({
      color: 0xffe699,
      linewidth: 3,
      transparent: true,
      opacity: 0.95,
      blending: THREE.AdditiveBlending,
    });

    // 8 golden streams flowing down along each black tether
    for (let i = 0; i < 8; i++) {
      const pts = [
        new THREE.Vector3(0, -0.06, 0),
        new THREE.Vector3(0, -0.09, 0),
        new THREE.Vector3(0, -0.14, 0),
        new THREE.Vector3(0, -0.20, 0),
      ];
      const geo = new THREE.BufferGeometry().setFromPoints(pts);
      const line = new THREE.Line(geo, goldMat);
      this.descendingGoldenGroup.add(line);
      this.descendingStrands.push(line);
    }

    // Luminous golden ring that travels downward at the contact dissolution boundary
    const ringGeo = new THREE.TorusGeometry(0.046, 0.003, 12, 32);
    const ringMat = new THREE.MeshBasicMaterial({
      color: 0xfff0aa,
      transparent: true,
      opacity: 0.9,
      blending: THREE.AdditiveBlending,
    });
    this.goldenDissolutionRing = new THREE.Mesh(ringGeo, ringMat);
    this.goldenDissolutionRing.rotation.x = Math.PI / 2;
    this.goldenDissolutionRing.position.set(0, -0.068, 0);
    this.descendingGoldenGroup.add(this.goldenDissolutionRing);

    this.descendingGoldenGroup.visible = false;
  }

  /**
   * Phase C: 3D Text Display and golden weaving strands
   */
  private buildTextDisplayAndWeavers() {
    this.textCanvas = document.createElement('canvas');
    this.textCanvas.width = 1024;
    this.textCanvas.height = 420;
    this.textTexture = new THREE.CanvasTexture(this.textCanvas);
    this.textTexture.colorSpace = THREE.SRGBColorSpace;

    const textMat = new THREE.MeshBasicMaterial({
      map: this.textTexture,
      transparent: true,
      opacity: 0.95,
      depthWrite: false,
      side: THREE.DoubleSide,
    });

    // Positioned in air above the orb
    const planeGeo = new THREE.PlaneGeometry(0.50, 0.21);
    this.textCanvasMesh = new THREE.Mesh(planeGeo, textMat);
    this.textCanvasMesh.position.set(0, 0.24, 0.05);
    this.group.add(this.textCanvasMesh);

    // Tracer pen tip particle
    const tracerGeo = new THREE.SphereGeometry(0.008, 16, 16);
    const tracerMat = new THREE.MeshBasicMaterial({
      color: 0xffffff,
      transparent: true,
      opacity: 0.98,
      blending: THREE.AdditiveBlending,
    });
    this.tracerParticle = new THREE.Mesh(tracerGeo, tracerMat);
    this.tracerParticle.position.set(0, 0.24, 0.06);
    this.group.add(this.tracerParticle);

    // 4 undulating golden weaving strands that dance around the writing pen
    const strandMat = new THREE.LineBasicMaterial({
      color: 0xffd277,
      transparent: true,
      opacity: 0.8,
      blending: THREE.AdditiveBlending,
    });

    for (let i = 0; i < 4; i++) {
      const pts = [
        new THREE.Vector3(-0.16, 0.24, 0.04),
        new THREE.Vector3(-0.08, 0.26, 0.05),
        new THREE.Vector3(0.08, 0.22, 0.05),
        new THREE.Vector3(0.16, 0.24, 0.04),
      ];
      const geo = new THREE.BufferGeometry().setFromPoints(pts);
      const line = new THREE.Line(geo, strandMat);
      this.group.add(line);
      this.weavingStrands.push(line);
    }
  }

  private buildDissolutionParticles() {
    const count = 180;
    const geo = new THREE.BufferGeometry();
    const pos = new Float32Array(count * 3);
    const vels = new Float32Array(count * 3);

    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const r = 0.035 + Math.random() * 0.025;
      pos[i * 3] = Math.cos(angle) * r;
      pos[i * 3 + 1] = -0.068 - Math.random() * 0.12;
      pos[i * 3 + 2] = Math.sin(angle) * r;

      vels[i * 3] = (Math.random() - 0.5) * 0.04;
      vels[i * 3 + 1] = 0.02 + Math.random() * 0.04;
      vels[i * 3 + 2] = (Math.random() - 0.5) * 0.04;
    }

    geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    geo.setAttribute('velocity', new THREE.BufferAttribute(vels, 3));

    const mat = new THREE.PointsMaterial({
      color: 0xffdfaa,
      size: 0.005,
      transparent: true,
      opacity: 0.0,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });

    this.dissolutionParticles = new THREE.Points(geo, mat);
    this.group.add(this.dissolutionParticles);
  }

  /**
   * Render progressively woven text on canvas
   */
  public renderText(revealProgress: number) {
    const ctx = this.textCanvas.getContext('2d')!;
    ctx.clearRect(0, 0, 1024, 420);

    if (revealProgress <= 0.01) {
      this.textTexture.needsUpdate = true;
      return;
    }

    const totalChars = this.fullMessage.length;
    const revealedCount = Math.floor(totalChars * Math.min(1.0, revealProgress));
    const currentText = this.fullMessage.substring(0, revealedCount);

    ctx.save();

    // Dark soft background capsule
    ctx.fillStyle = 'rgba(18, 16, 14, 0.45)';
    ctx.beginPath();
    ctx.roundRect(30, 20, 964, 380, 24);
    ctx.fill();

    ctx.strokeStyle = 'rgba(255, 215, 120, 0.35)';
    ctx.lineWidth = 1.5;
    ctx.stroke();

    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    const line1Total = "You've put in so much effort, and it really shows.";
    const line2Total = "Take a moment to be proud —";
    const line3Total = "you've done more than you think.";

    let line1 = '';
    let line2 = '';
    let line3 = '';

    if (revealedCount <= line1Total.length) {
      line1 = currentText;
    } else if (revealedCount <= line1Total.length + 1 + line2Total.length) {
      line1 = line1Total;
      line2 = currentText.substring(line1Total.length + 1);
    } else {
      line1 = line1Total;
      line2 = line2Total;
      line3 = currentText.substring(line1Total.length + 1 + line2Total.length + 1);
    }

    ctx.font = '500 40px "Plus Jakarta Sans", sans-serif';
    ctx.fillStyle = '#ffffff';
    if (line1) ctx.fillText(line1, 512, 100);

    ctx.font = 'italic 500 42px "Playfair Display", Georgia, serif';
    ctx.fillStyle = '#ffdfa0';
    if (line2) ctx.fillText(line2, 512, 195);

    ctx.font = '500 36px "Plus Jakarta Sans", sans-serif';
    ctx.fillStyle = '#ffffff';
    if (line3) ctx.fillText(line3, 512, 290);

    ctx.restore();
    this.textTexture.needsUpdate = true;
  }

  /**
   * Start Stage 2: Black tethers appear
   */
  public startStage2(orbPosition: THREE.Vector3) {
    this.group.position.copy(orbPosition);
    this.group.visible = true;
    this.currentPhase = 'black_tethers_active';
    this.phaseTimer = 0;
    this.textRevealFraction = 0;

    this.blackThreadsGroup.visible = true;
    this.goldenThreadsGroup.visible = false;
    this.descendingGoldenGroup.visible = false;
    this.textCanvasMesh.visible = false;
    this.tracerParticle.visible = false;
    this.weavingStrands.forEach(s => s.visible = false);
    this.dissolutionParticles.visible = false;

    // Reset black thread opacities
    this.blackStrands.forEach(bs => {
      const mat = bs.line.material as THREE.LineBasicMaterial;
      mat.opacity = 0.9;
    });
  }

  /**
   * Phase A: Golden strands emerge and orbit briefly
   */
  public startPhaseA_GoldenOrbit() {
    this.currentPhase = 'golden_orbit';
    this.phaseTimer = 0;
    this.goldenThreadsGroup.visible = true;
  }

  /**
   * Phase B: Golden threads stream downwards, dissolving black threads
   */
  public startPhaseB_DownwardDissolution(onComplete: () => void) {
    this.currentPhase = 'golden_dissolving_downwards';
    this.phaseTimer = 0;
    this.onPhaseBComplete = onComplete;

    this.descendingGoldenGroup.visible = true;
    this.dissolutionParticles.visible = true;
    (this.dissolutionParticles.material as THREE.PointsMaterial).opacity = 0.9;
  }

  /**
   * Phase C: Weave words of encouragement
   */
  public startPhaseC_WeavingWords(onComplete?: () => void) {
    this.currentPhase = 'golden_weaving_words';
    this.phaseTimer = 0;
    this.textRevealFraction = 0;
    this.onWeavingComplete = onComplete;

    // Hide descending strands and orbit, focus exclusively on weaving!
    this.goldenThreadsGroup.visible = false;
    this.descendingGoldenGroup.visible = false;
    this.blackThreadsGroup.visible = false;
    this.dissolutionParticles.visible = false;

    this.textCanvasMesh.visible = true;
    this.tracerParticle.visible = true;
    this.weavingStrands.forEach(s => s.visible = true);
    this.renderText(0);
  }

  public setTextProgress(progress: number) {
    this.textRevealFraction = Math.max(0, Math.min(1, progress));
    this.renderText(this.textRevealFraction);

    // Physical tracer pen motion weaving the text
    const x = (this.textRevealFraction - 0.5) * 0.32;
    const y = 0.24 + Math.sin(this.textRevealFraction * Math.PI * 6) * 0.025;
    this.tracerParticle.position.set(x, y, 0.06);

    // Weaving strands dance around the tracer pen
    this.weavingStrands.forEach((strand, idx) => {
      const pos = strand.geometry.attributes.position;
      const count = pos.count;
      for (let i = 0; i < count; i++) {
        const u = i / (count - 1);
        const px = (u - 0.5) * 0.34;
        const py = 0.24 + Math.sin(u * Math.PI * 3 + this.phaseTimer * 3 + idx) * 0.035;
        const pz = 0.04 + Math.cos(u * Math.PI * 2 + idx) * 0.015;
        pos.setXYZ(i, px, py, pz);
      }
      pos.needsUpdate = true;
    });
  }

  public update(delta: number, orbPosition: THREE.Vector3, cameraPosition: THREE.Vector3) {
    this.group.position.copy(orbPosition);

    if (this.textCanvasMesh && this.textCanvasMesh.visible) {
      this.textCanvasMesh.lookAt(cameraPosition.x, this.textCanvasMesh.position.y + this.group.position.y, cameraPosition.z);
    }

    this.phaseTimer += delta;

    // Phase A: Golden orbit
    if (this.currentPhase === 'golden_orbit') {
      this.goldenThreadsGroup.rotation.y += delta * 1.8;
      this.goldenThreadsGroup.rotation.x = Math.sin(this.phaseTimer * 2) * 0.2;
    }

    // Phase B: Downward dissolution
    if (this.currentPhase === 'golden_dissolving_downwards') {
      // Duration: 2.2 seconds for golden stream to pass from orb (-0.068) to dock (-0.195)
      const duration = 2.2;
      const progress = Math.min(1.0, this.phaseTimer / duration);

      const currentY = THREE.MathUtils.lerp(-0.068, -0.195, progress);
      this.goldenDissolutionRing.position.y = currentY;

      // Update descending golden stream lines
      this.descendingStrands.forEach((line, i) => {
        const angle = (i / 8) * Math.PI * 2;
        const pos = line.geometry.attributes.position;
        pos.setXYZ(0, Math.cos(angle) * 0.034, -0.068, Math.sin(angle) * 0.034);
        pos.setXYZ(1, Math.cos(angle) * 0.040, THREE.MathUtils.lerp(-0.068, currentY, 0.4), Math.sin(angle) * 0.040);
        pos.setXYZ(2, Math.cos(angle) * 0.045, THREE.MathUtils.lerp(-0.068, currentY, 0.8), Math.sin(angle) * 0.045);
        pos.setXYZ(3, Math.cos(angle) * 0.050, currentY, Math.sin(angle) * 0.050);
        pos.needsUpdate = true;
      });

      // Progressively dissolve the black threads as the golden ring descends past them!
      this.blackStrands.forEach(bs => {
        const pos = bs.line.geometry.attributes.position;
        for (let p = 0; p < pos.count; p++) {
          const ptY = bs.basePoints[p].y;
          // If above current descending golden point, dissolve away
          if (ptY >= currentY) {
            // Compress to zero or fade
            const inv = Math.max(0, 1 - (ptY - currentY) * 15);
            pos.setXYZ(p, bs.basePoints[p].x * inv, ptY, bs.basePoints[p].z * inv);
          } else {
            pos.setXYZ(p, bs.basePoints[p].x, bs.basePoints[p].y, bs.basePoints[p].z);
          }
        }
        pos.needsUpdate = true;
        (bs.line.material as THREE.LineBasicMaterial).opacity = Math.max(0, 0.9 * (1 - progress));
      });

      // Golden dissolution particles at the contact wavefront
      const partPos = this.dissolutionParticles.geometry.attributes.position;
      const partVel = this.dissolutionParticles.geometry.attributes.velocity;
      for (let i = 0; i < partPos.count; i++) {
        partPos.setY(i, partPos.getY(i) + partVel.getY(i) * delta);
        if (partPos.getY(i) > -0.05) {
          partPos.setY(i, currentY + (Math.random() - 0.5) * 0.02);
        }
      }
      partPos.needsUpdate = true;

      if (progress >= 1.0) {
        this.blackThreadsGroup.visible = false;
        this.descendingGoldenGroup.visible = false;
        if (this.onPhaseBComplete) {
          const cb = this.onPhaseBComplete;
          this.onPhaseBComplete = undefined;
          cb();
        }
      }
    }

    // Phase C: Weaving words
    if (this.currentPhase === 'golden_weaving_words') {
      // Weaving animation is driven via setTextProgress
    }
  }

  public settle() {
    this.currentPhase = 'settled';
    // Smoothly fade out text and weaving strands
    let f = 1.0;
    const fadeTimer = setInterval(() => {
      f -= 0.05;
      if (this.textCanvasMesh) {
        (this.textCanvasMesh.material as THREE.MeshBasicMaterial).opacity = Math.max(0, f);
      }
      if (this.tracerParticle) {
        (this.tracerParticle.material as THREE.MeshBasicMaterial).opacity = Math.max(0, f);
      }
      this.weavingStrands.forEach(s => {
        (s.material as THREE.LineBasicMaterial).opacity = Math.max(0, f * 0.8);
      });

      if (f <= 0) {
        clearInterval(fadeTimer);
        this.textCanvasMesh.visible = false;
        this.tracerParticle.visible = false;
        this.weavingStrands.forEach(s => s.visible = false);
        this.group.visible = false;
      }
    }, 40);
  }
}

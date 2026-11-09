/**
 * EXORA Stage 2: Threads of Encouragement
 * Simulates lingering black worry threads, luminous golden writing threads,
 * synchronized progressive text reveal, and thread dissolution upon voice completion.
 */

import * as THREE from 'three';

export class ThreadsEffect {
  public group: THREE.Group;
  private blackThreadsGroup: THREE.Group;
  private goldenThreadsGroup: THREE.Group;
  private textCanvasMesh!: THREE.Mesh;
  private textCanvas!: HTMLCanvasElement;
  private textTexture!: THREE.CanvasTexture;
  private tracerParticle!: THREE.Mesh;

  public isStage2Active: boolean = false;
  public blackThreadsVisible: boolean = false;
  public goldenThreadsActive: boolean = false;
  public isDissolving: boolean = false;
  public isCompleted: boolean = false;

  private blackCurves: THREE.Line[] = [];
  private goldenCurves: THREE.Line[] = [];
  private dissolutionParticles!: THREE.Points;

  private progressTime: number = 0;
  private textRevealFraction: number = 0; // 0 to 1
  private dissolutionProgress: number = 0; // 0 to 1

  public readonly fullMessage = "You've put in so much effort, and it really shows. Take a moment to be proud — you've done more than you think.";

  constructor() {
    this.group = new THREE.Group();
    this.blackThreadsGroup = new THREE.Group();
    this.goldenThreadsGroup = new THREE.Group();

    this.group.add(this.blackThreadsGroup);
    this.group.add(this.goldenThreadsGroup);

    this.buildBlackThreads();
    this.buildGoldenThreads();
    this.buildTextDisplay();
    this.buildDissolutionParticles();

    this.group.visible = false;
  }

  private buildBlackThreads() {
    // Clean tether-like strands connecting the docking station to the orb's underside.
    // The thread group origin follows the orb centre, so these coordinates are local to it.
    const blackMat = new THREE.LineBasicMaterial({
      color: 0x111010,
      linewidth: 2,
      transparent: true,
      opacity: 0.88,
    });

    const strandCount = 8;
    const dockY = -0.195; // upper surface of the docking station, relative to orb centre
    const orbUndersideY = -0.068; // just inside the orb's lower edge
    const dockRadius = 0.055;
    const orbRadius = 0.032;

    for (let i = 0; i < strandCount; i++) {
      const angle = (i / strandCount) * Math.PI * 2;
      const points: THREE.Vector3[] = [];

      // Nearly straight, gently tensioned strands; avoid loops or crossings around the orb.
      for (let step = 0; step <= 12; step++) {
        const t = step / 12;
        const radius = THREE.MathUtils.lerp(dockRadius, orbRadius, t);
        const y = THREE.MathUtils.lerp(dockY, orbUndersideY, t);
        const subtleBow = Math.sin(t * Math.PI) * 0.003;

        points.push(new THREE.Vector3(
          Math.cos(angle) * (radius + subtleBow),
          y,
          Math.sin(angle) * (radius + subtleBow)
        ));
      }

      const curve = new THREE.CatmullRomCurve3(points);
      const geometry = new THREE.BufferGeometry().setFromPoints(curve.getPoints(24));
      const line = new THREE.Line(geometry, blackMat);
      this.blackThreadsGroup.add(line);
      this.blackCurves.push(line);
    }
  }

  private buildGoldenThreads() {
    const goldMat = new THREE.LineBasicMaterial({
      color: 0xffd277,
      linewidth: 2.5,
      transparent: true,
      opacity: 0.95,
      blending: THREE.AdditiveBlending,
    });

    for (let g = 0; g < 8; g++) {
      const points: THREE.Vector3[] = [];
      const steps = 40;
      const radiusBase = 0.095 + g * 0.012;
      const angleOffset = (g / 8) * Math.PI * 2;

      for (let s = 0; s <= steps; s++) {
        const theta = (s / steps) * Math.PI * 2.2 + angleOffset;
        const y = Math.sin(s * 0.3 + g) * 0.08;
        const r = radiusBase + Math.cos(s * 0.5) * 0.015;
        const x = r * Math.cos(theta);
        const z = r * Math.sin(theta);
        points.push(new THREE.Vector3(x, y, z));
      }

      const curve = new THREE.CatmullRomCurve3(points);
      const geo = new THREE.BufferGeometry().setFromPoints(curve.getPoints(50));
      const line = new THREE.Line(geo, goldMat);
      this.goldenThreadsGroup.add(line);
      this.goldenCurves.push(line);
    }

    // Luminous tracer particle acting as the physical "pen" tip
    const tracerGeo = new THREE.SphereGeometry(0.007, 16, 16);
    const tracerMat = new THREE.MeshBasicMaterial({
      color: 0xffffff,
      transparent: true,
      opacity: 0.95,
      blending: THREE.AdditiveBlending,
    });
    this.tracerParticle = new THREE.Mesh(tracerGeo, tracerMat);
    this.goldenThreadsGroup.add(this.tracerParticle);
  }

  private buildTextDisplay() {
    this.textCanvas = document.createElement('canvas');
    this.textCanvas.width = 1024;
    this.textCanvas.height = 384;
    this.textTexture = new THREE.CanvasTexture(this.textCanvas);
    this.textTexture.colorSpace = THREE.SRGBColorSpace;

    const textMat = new THREE.MeshBasicMaterial({
      map: this.textTexture,
      transparent: true,
      opacity: 0.95,
      depthWrite: false,
      side: THREE.DoubleSide,
    });

    // Billboard placed right in front/above the orb in 3D space
    const planeGeo = new THREE.PlaneGeometry(0.36, 0.14);
    this.textCanvasMesh = new THREE.Mesh(planeGeo, textMat);
    this.textCanvasMesh.position.set(0, 0.12, 0.06);
    this.group.add(this.textCanvasMesh);
  }

  private buildDissolutionParticles() {
    const count = 300;
    const geo = new THREE.BufferGeometry();
    const pos = new Float32Array(count * 3);
    const vels = new Float32Array(count * 3);

    for (let i = 0; i < count; i++) {
      const u = Math.random();
      const r = 0.08 + Math.random() * 0.06;
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);

      pos[i * 3] = r * Math.sin(phi) * Math.cos(theta);
      pos[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta);
      pos[i * 3 + 2] = r * Math.cos(phi);

      vels[i * 3] = (Math.random() - 0.5) * 0.08;
      vels[i * 3 + 1] = 0.04 + Math.random() * 0.08;
      vels[i * 3 + 2] = (Math.random() - 0.5) * 0.08;
    }

    geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    geo.setAttribute('velocity', new THREE.BufferAttribute(vels, 3));

    const mat = new THREE.PointsMaterial({
      color: 0xffdca8,
      size: 0.005,
      transparent: true,
      opacity: 0.0,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });

    this.dissolutionParticles = new THREE.Points(geo, mat);
    this.group.add(this.dissolutionParticles);
  }

  public renderText(revealProgress: number) {
    const ctx = this.textCanvas.getContext('2d')!;
    ctx.clearRect(0, 0, 1024, 384);

    if (revealProgress <= 0.01) {
      this.textTexture.needsUpdate = true;
      return;
    }

    const totalChars = this.fullMessage.length;
    const revealedCount = Math.floor(totalChars * Math.min(1.0, revealProgress));
    const currentText = this.fullMessage.substring(0, revealedCount);

    ctx.save();

    // Subtle dark glow backdrop for crystal clear readability in 3D
    ctx.fillStyle = 'rgba(18, 16, 14, 0.45)';
    ctx.beginPath();
    ctx.roundRect(40, 20, 944, 344, 24);
    ctx.fill();

    ctx.strokeStyle = 'rgba(255, 215, 120, 0.35)';
    ctx.lineWidth = 1.5;
    ctx.stroke();

    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    // Split text into 3 balanced, poetic lines
    // Line 1: "You've put in so much effort, and it really shows." (49 chars)
    // Line 2: "Take a moment to be proud —" (27 chars)
    // Line 3: "you've done more than you think." (32 chars)
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

    ctx.font = '500 36px "Plus Jakarta Sans", sans-serif';
    ctx.fillStyle = '#ffffff';
    if (line1) ctx.fillText(line1, 512, 100);

    ctx.font = 'italic 500 38px "Playfair Display", Georgia, serif';
    ctx.fillStyle = '#ffdfa0';
    if (line2) ctx.fillText(line2, 512, 185);

    ctx.font = '500 36px "Plus Jakarta Sans", sans-serif';
    ctx.fillStyle = '#ffffff';
    if (line3) ctx.fillText(line3, 512, 270);

    ctx.restore();
    this.textTexture.needsUpdate = true;
  }

  public startStage2(orbPosition: THREE.Vector3) {
    this.group.position.copy(orbPosition);
    this.group.visible = true;
    this.isStage2Active = true;
    this.blackThreadsVisible = true;
    this.goldenThreadsActive = false;
    this.isDissolving = false;
    this.isCompleted = false;
    this.progressTime = 0;
    this.textRevealFraction = 0;
    this.dissolutionProgress = 0;

    this.blackThreadsGroup.visible = true;
    this.goldenThreadsGroup.visible = false;
    this.textCanvasMesh.visible = false;
    this.dissolutionParticles.visible = false;
  }

  public activateGoldenWriting() {
    this.goldenThreadsActive = true;
    this.goldenThreadsGroup.visible = true;
    this.textCanvasMesh.visible = true;
  }

  public setTextProgress(progress: number) {
    this.textRevealFraction = Math.max(0, Math.min(1, progress));
    this.renderText(this.textRevealFraction);

    // Animate tracer pen tip across the text box
    const x = (this.textRevealFraction - 0.5) * 0.32;
    const y = 0.12 + Math.sin(this.textRevealFraction * Math.PI * 4) * 0.03;
    this.tracerParticle.position.set(x, y, 0.07);
  }

  public startDissolution() {
    this.isDissolving = true;
    this.dissolutionProgress = 0;
    this.dissolutionParticles.visible = true;
  }

  public update(delta: number, orbPosition: THREE.Vector3, cameraPosition: THREE.Vector3) {
    if (!this.isStage2Active) return;

    this.progressTime += delta;
    this.group.position.copy(orbPosition);

    // Look text mesh at camera eye
    if (this.textCanvasMesh && this.textCanvasMesh.visible) {
      this.textCanvasMesh.lookAt(cameraPosition.x, this.textCanvasMesh.position.y + this.group.position.y, cameraPosition.z);
    }

    // Keep the docking-station tethers aligned and steady; they should not swirl around the orb.

    // Golden threads dynamic orbit
    if (this.goldenThreadsActive) {
      this.goldenThreadsGroup.rotation.y += delta * 0.45;
      this.goldenThreadsGroup.rotation.z += delta * 0.18;
    }

    // Dissolution animation
    if (this.isDissolving && !this.isCompleted) {
      this.dissolutionProgress = Math.min(1.0, this.dissolutionProgress + delta * 0.65);

      // Black threads scale down and fade
      const inv = 1 - this.dissolutionProgress;
      this.blackThreadsGroup.scale.set(inv, inv, inv);

      this.blackCurves.forEach(line => {
        (line.material as THREE.LineBasicMaterial).opacity = inv * 0.88;
      });

      // Dissolution particles vapor rising
      const pMat = this.dissolutionParticles.material as THREE.PointsMaterial;
      pMat.opacity = Math.sin(this.dissolutionProgress * Math.PI) * 0.95;

      const pos = this.dissolutionParticles.geometry.attributes.position;
      const vel = this.dissolutionParticles.geometry.attributes.velocity;
      for (let i = 0; i < pos.count; i++) {
        pos.setX(i, pos.getX(i) + vel.getX(i) * delta);
        pos.setY(i, pos.getY(i) + vel.getY(i) * delta);
        pos.setZ(i, pos.getZ(i) + vel.getZ(i) * delta);
      }
      pos.needsUpdate = true;

      // When dissolution finishes
      if (this.dissolutionProgress >= 1.0) {
        this.isCompleted = true;
        this.blackThreadsGroup.visible = false;
        this.dissolutionParticles.visible = false;
        // Fade out golden writing text smoothly
        setTimeout(() => {
          this.textCanvasMesh.visible = false;
          this.goldenThreadsGroup.visible = false;
        }, 1500);
      }
    }
  }
}

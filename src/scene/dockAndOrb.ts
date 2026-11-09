/**
 * EXORA Central Orb & Firewood-Inspired Docking Station
 * 
 * Features:
 * - Natural, tactile firewood/stacked-log cradle combining warm organic timber billets with 2046 precision bronze joinery.
 * - Central concave resting cradle for the glass orb with integrated edible-film printer slot.
 * - Physically convincing glass orb with internal depth, particle cloud, and integrated holographic text displayed inside the orb volume (Accomplishments & Words of Wisdom).
 */

import * as THREE from 'three';
import { createWoodTexture } from './materials';

export class DockAndOrb {
  public group: THREE.Group;
  public dockGroup: THREE.Group;
  public orbGroup: THREE.Group;

  // Key meshes
  public outerGlassOrb!: THREE.Mesh;
  public innerCoreSphere!: THREE.Mesh;
  public innerParticleCloud!: THREE.Points;
  public internalDisplayPlane!: THREE.Mesh;
  public dockRingLight!: THREE.PointLight;
  public orbInternalLight!: THREE.PointLight;
  public printerSlotHatch!: THREE.Mesh;

  // Coordinates on desk
  // Shifted 12cm toward the back of the extended desk, farther from the seated user.
  public readonly dockPosition = new THREE.Vector3(0, 0.74, -0.35);
  public readonly orbHoverY = 0.74 + 0.24; // Hover height above cradle
  public currentOrbTarget = new THREE.Vector3();
  public orbVelocity = new THREE.Vector3();

  // State
  public isMaterialized: boolean = false;
  public isGrabbed: boolean = false;
  public isDocked: boolean = false;
  private materializationProgress: number = 0;

  // High-DPI internal text canvas (1024x1024)
  private displayCanvas!: HTMLCanvasElement;
  private displayTexture!: THREE.CanvasTexture;
  private currentDisplayMode: 'none' | 'accomplishments' | 'wisdom' = 'none';

  constructor() {
    this.group = new THREE.Group();
    this.dockGroup = new THREE.Group();
    this.orbGroup = new THREE.Group();

    this.dockGroup.position.copy(this.dockPosition);
    this.currentOrbTarget.set(this.dockPosition.x, this.orbHoverY, this.dockPosition.z);
    this.orbGroup.position.copy(this.currentOrbTarget);

    this.group.add(this.dockGroup);
    this.group.add(this.orbGroup);

    this.buildFirewoodDockingStation();
    this.buildGlassOrb();
    this.buildInternalDisplay();

    // Start hidden until wave trigger in Stage 1
    this.orbGroup.scale.set(0.001, 0.001, 0.001);
    this.orbGroup.visible = false;
  }

  /**
   * Firewood-Inspired Docking Station:
   * Built from a sculptural cluster of horizontal split-log billets forming a natural cradle,
   * held by brushed bronze bands and featuring an integrated printer slot and warm ember bed.
   */
  private buildFirewoodDockingStation() {
    const woodTex = createWoodTexture(true); // Smoked cedar / dark walnut
    const woodMat = new THREE.MeshStandardMaterial({
      map: woodTex,
      roughness: 0.65,
      metalness: 0.05,
    });

    const bronzeMat = new THREE.MeshStandardMaterial({
      color: 0x8a663e,
      roughness: 0.3,
      metalness: 0.85,
    });

    const darkMetalMat = new THREE.MeshStandardMaterial({
      color: 0x181716,
      roughness: 0.45,
      metalness: 0.7,
    });

    // 1. Base plinth: Subdued matte platform beneath logs
    const plinth = new THREE.Mesh(
      new THREE.CylinderGeometry(0.13, 0.138, 0.012, 36),
      darkMetalMat
    );
    plinth.position.set(0, 0.006, 0);
    plinth.receiveShadow = true;
    this.dockGroup.add(plinth);

    // 2. Firewood log bundle: 7 architectural logs arranged horizontally and radially to cradle the orb
    const logRadius = 0.018;
    const logLength = 0.17;
    const logGeo = new THREE.CylinderGeometry(logRadius * 0.95, logRadius, logLength, 16);

    // Positions of log segments creating a natural tiered wooden cradle
    const logConfigs = [
      // Base layer logs
      { x: -0.055, y: 0.018, z: 0.025, rotZ: Math.PI / 2, rotY: 0.12 },
      { x: 0.055, y: 0.018, z: 0.025, rotZ: Math.PI / 2, rotY: -0.12 },
      { x: -0.065, y: 0.018, z: -0.035, rotZ: Math.PI / 2, rotY: -0.08 },
      { x: 0.065, y: 0.018, z: -0.035, rotZ: Math.PI / 2, rotY: 0.08 },
      // Upper cradle logs forming the seat
      { x: -0.052, y: 0.036, z: 0.0, rotZ: Math.PI / 2, rotY: 0.0 },
      { x: 0.052, y: 0.036, z: 0.0, rotZ: Math.PI / 2, rotY: 0.0 },
      { x: 0.0, y: 0.022, z: -0.058, rotX: Math.PI / 2, rotY: 0.0 },
    ];

    logConfigs.forEach(cfg => {
      const log = new THREE.Mesh(logGeo, woodMat);
      log.position.set(cfg.x, cfg.y, cfg.z);
      if (cfg.rotZ) log.rotation.z = cfg.rotZ;
      if (cfg.rotX) log.rotation.x = cfg.rotX;
      if (cfg.rotY) log.rotation.y = cfg.rotY;
      log.castShadow = true;
      log.receiveShadow = true;
      this.dockGroup.add(log);
    });

    // 3. Central bronze cradle seat where the orb rests securely
    const cradleGeo = new THREE.CylinderGeometry(0.075, 0.062, 0.012, 32);
    const cradle = new THREE.Mesh(cradleGeo, bronzeMat);
    cradle.position.set(0, 0.034, 0);
    this.dockGroup.add(cradle);

    // Inner soft felt resting pad inside cradle
    const padMat = new THREE.MeshStandardMaterial({ color: 0x12100e, roughness: 0.9 });
    const pad = new THREE.Mesh(new THREE.CylinderGeometry(0.058, 0.058, 0.003, 32), padMat);
    pad.position.set(0, 0.040, 0);
    this.dockGroup.add(pad);

    // Warm bronze joinery ring clasping the firewood cradle
    const bandGeo = new THREE.TorusGeometry(0.078, 0.0025, 12, 36);
    const band = new THREE.Mesh(bandGeo, bronzeMat);
    band.rotation.x = Math.PI / 2;
    band.position.set(0, 0.038, 0);
    this.dockGroup.add(band);

    // 4. Integrated Edible-Film Printer Slot: built neatly into front bronze bezel
    const printerBezel = new THREE.Mesh(
      new THREE.BoxGeometry(0.082, 0.016, 0.018),
      bronzeMat
    );
    printerBezel.position.set(0, 0.024, 0.105);
    this.dockGroup.add(printerBezel);

    const slotMat = new THREE.MeshBasicMaterial({ color: 0x050505 });
    const slotMesh = new THREE.Mesh(new THREE.BoxGeometry(0.068, 0.005, 0.012), slotMat);
    slotMesh.position.set(0, 0.024, 0.11);
    this.dockGroup.add(slotMesh);

    // Motorized precision printer hatch
    const hatchMat = new THREE.MeshStandardMaterial({ color: 0x221f1d, roughness: 0.4, metalness: 0.8 });
    this.printerSlotHatch = new THREE.Mesh(new THREE.BoxGeometry(0.068, 0.006, 0.003), hatchMat);
    this.printerSlotHatch.position.set(0, 0.024, 0.114);
    this.dockGroup.add(this.printerSlotHatch);

    // 5. Warm ember glow between the firewood billets
    const emberMat = new THREE.MeshBasicMaterial({
      color: 0xffaa44,
      transparent: true,
      opacity: 0.45,
    });
    const emberBed = new THREE.Mesh(new THREE.CylinderGeometry(0.065, 0.075, 0.004, 24), emberMat);
    emberBed.position.set(0, 0.015, 0);
    this.dockGroup.add(emberBed);

    this.dockRingLight = new THREE.PointLight(0xffbe6b, 0.8, 1.2, 2.0);
    this.dockRingLight.position.set(0, 0.07, 0);
    this.dockGroup.add(this.dockRingLight);
  }

  /**
   * Physically convincing Glass Orb
   */
  private buildGlassOrb() {
    const orbRadius = 0.075; // 15cm diameter

    // 1. Outer Physical Glass Shell
    const glassMat = new THREE.MeshPhysicalMaterial({
      color: 0xffffff,
      transmission: 0.94,
      opacity: 1.0,
      transparent: true,
      roughness: 0.035,
      metalness: 0.05,
      ior: 1.54,
      thickness: 0.085,
      clearcoat: 1.0,
      clearcoatRoughness: 0.02,
      depthWrite: false,
    });
    const glassGeo = new THREE.SphereGeometry(orbRadius, 48, 36);
    this.outerGlassOrb = new THREE.Mesh(glassGeo, glassMat);
    this.outerGlassOrb.castShadow = true;
    this.orbGroup.add(this.outerGlassOrb);

    // 2. Inner Luminescent Core Sphere
    const coreMat = new THREE.MeshBasicMaterial({
      color: 0xffe9c2,
      transparent: true,
      opacity: 0.18,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });
    this.innerCoreSphere = new THREE.Mesh(new THREE.SphereGeometry(orbRadius * 0.72, 32, 24), coreMat);
    this.orbGroup.add(this.innerCoreSphere);

    // 3. Delicate Swirling Particle Cloud inside Orb
    const particleCount = 180;
    const particleGeo = new THREE.BufferGeometry();
    const positions = new Float32Array(particleCount * 3);
    const colors = new Float32Array(particleCount * 3);

    const warmPalette = [
      new THREE.Color(0xfff2d4),
      new THREE.Color(0xffd08a),
      new THREE.Color(0xe6ab5b),
      new THREE.Color(0xffffff),
    ];

    for (let i = 0; i < particleCount; i++) {
      const u = Math.random();
      const r = Math.cbrt(u) * (orbRadius * 0.62);
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);

      positions[i * 3] = r * Math.sin(phi) * Math.cos(theta);
      positions[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta);
      positions[i * 3 + 2] = r * Math.cos(phi);

      const c = warmPalette[Math.floor(Math.random() * warmPalette.length)];
      colors[i * 3] = c.r;
      colors[i * 3 + 1] = c.g;
      colors[i * 3 + 2] = c.b;
    }

    particleGeo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    particleGeo.setAttribute('color', new THREE.BufferAttribute(colors, 3));

    const particleMat = new THREE.PointsMaterial({
      size: 0.0035,
      vertexColors: true,
      transparent: true,
      opacity: 0.85,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });

    this.innerParticleCloud = new THREE.Points(particleGeo, particleMat);
    this.orbGroup.add(this.innerParticleCloud);

    // 4. Subtle Internal Light Source
    this.orbInternalLight = new THREE.PointLight(0xffdfa8, 0.8, 1.8, 2.0);
    this.orbGroup.add(this.orbInternalLight);
  }

  /**
   * Internal holographic display placed INSIDE the orb volume
   */
  private buildInternalDisplay() {
    this.displayCanvas = document.createElement('canvas');
    this.displayCanvas.width = 1024;
    this.displayCanvas.height = 1024;

    this.displayTexture = new THREE.CanvasTexture(this.displayCanvas);
    this.displayTexture.colorSpace = THREE.SRGBColorSpace;
    this.displayTexture.generateMipmaps = true;

    const displayMat = new THREE.MeshBasicMaterial({
      map: this.displayTexture,
      transparent: true,
      opacity: 0.0,
      depthWrite: false,
      side: THREE.DoubleSide,
      // Normal blending preserves dark text outlines for legibility against the bright orb.
      blending: THREE.NormalBlending,
    });

    // Sized to sit fully within the 0.15m orb diameter (0.108m x 0.108m)
    const cardGeo = new THREE.PlaneGeometry(0.108, 0.108);
    this.internalDisplayPlane = new THREE.Mesh(cardGeo, displayMat);
    this.internalDisplayPlane.position.set(0, 0, 0); // At geometric center of orb
    this.internalDisplayPlane.renderOrder = 4;
    this.internalDisplayPlane.visible = false;
    this.orbGroup.add(this.internalDisplayPlane);
  }

  /**
   * Render Stage 1 completed tasks INSIDE the orb volume
   */
  public renderAccomplishmentsInsideOrb(fade: number) {
    this.currentDisplayMode = 'accomplishments';
    const ctx = this.displayCanvas.getContext('2d')!;
    ctx.clearRect(0, 0, 1024, 1024);

    if (fade <= 0.01) {
      this.displayTexture.needsUpdate = true;
      if (this.internalDisplayPlane) {
        this.internalDisplayPlane.visible = false;
      }
      return;
    }

    ctx.save();
    ctx.globalAlpha = Math.min(1.0, fade);

    // Luminous ethereal circular disc within the orb
    const discGrad = ctx.createRadialGradient(512, 512, 40, 512, 512, 490);
    discGrad.addColorStop(0, 'rgba(255, 235, 195, 0.22)');
    discGrad.addColorStop(0.55, 'rgba(235, 180, 110, 0.12)');
    discGrad.addColorStop(0.85, 'rgba(20, 18, 16, 0.35)');
    discGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');
    ctx.fillStyle = discGrad;
    ctx.beginPath();
    ctx.arc(512, 512, 490, 0, Math.PI * 2);
    ctx.fill();

    // Subtle edge ring
    ctx.strokeStyle = 'rgba(255, 225, 165, 0.45)';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(512, 512, 460, 0, Math.PI * 2);
    ctx.stroke();

    // Title Header
    ctx.textAlign = 'center';
    ctx.font = '600 38px "Space Grotesk", sans-serif';
    ctx.fillStyle = '#9beeff';
    ctx.strokeStyle = 'rgba(5, 24, 43, 0.98)';
    ctx.lineWidth = 9;
    ctx.lineJoin = 'round';
    ctx.shadowColor = 'rgba(0, 12, 28, 0.95)';
    ctx.shadowBlur = 16;
    ctx.strokeText("TODAY'S ACCOMPLISHMENTS", 512, 175);
    ctx.fillText("TODAY'S ACCOMPLISHMENTS", 512, 175);
    ctx.shadowBlur = 0;

    ctx.strokeStyle = 'rgba(245, 201, 130, 0.45)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(220, 215);
    ctx.lineTo(804, 215);
    ctx.stroke();

    // 3 Required Sample Accomplishments
    const items = [
      { project: '• Earpiece', detail: 'Completed the 3D modelling.', y: 310 },
      { project: '• Project 1', detail: 'Arranged a meeting with clients.', y: 440 },
      { project: '• Project 2', detail: 'Began sketching ideas.', y: 570 },
    ];

    items.forEach(item => {
      ctx.textAlign = 'left';
      ctx.font = '700 42px "Plus Jakarta Sans", sans-serif';
      ctx.fillStyle = '#eafaff';
      ctx.strokeStyle = 'rgba(5, 24, 43, 0.98)';
      ctx.lineWidth = 8;
      ctx.lineJoin = 'round';
      ctx.shadowColor = 'rgba(0, 12, 28, 0.95)';
      ctx.shadowBlur = 13;
      ctx.strokeText(item.project, 165, item.y);
      ctx.fillText(item.project, 165, item.y);

      ctx.font = '400 34px "Plus Jakarta Sans", sans-serif';
      ctx.fillStyle = '#c9f5ff';
      ctx.lineWidth = 7;
      ctx.strokeText(item.detail, 205, item.y + 48);
      ctx.fillText(item.detail, 205, item.y + 48);
      ctx.shadowBlur = 0;
    });

    // Quote message: "Every step counts, even the ones that are just beginning."
    ctx.textAlign = 'center';
    ctx.font = 'italic 500 36px "Playfair Display", Georgia, serif';
    ctx.fillStyle = '#a9f2ff';
    ctx.strokeStyle = 'rgba(5, 24, 43, 0.98)';
    ctx.lineWidth = 8;
    ctx.lineJoin = 'round';
    ctx.shadowColor = 'rgba(0, 12, 28, 0.95)';
    ctx.shadowBlur = 14;
    ctx.strokeText('"Every step counts,', 512, 755);
    ctx.strokeText('even the ones that are just beginning."', 512, 805);
    ctx.fillText('"Every step counts,', 512, 755);
    ctx.fillText('even the ones that are just beginning."', 512, 805);
    ctx.shadowBlur = 0;

    ctx.restore();
    this.displayTexture.needsUpdate = true;

    if (this.internalDisplayPlane) {
      (this.internalDisplayPlane.material as THREE.MeshBasicMaterial).opacity = fade * 0.95;
      this.internalDisplayPlane.visible = fade > 0.01;
    }
  }

  /**
   * Render Stage 3 Words of Wisdom INSIDE the orb volume
   */
  public renderWisdomInsideOrb(fade: number) {
    this.currentDisplayMode = 'wisdom';
    const ctx = this.displayCanvas.getContext('2d')!;
    ctx.clearRect(0, 0, 1024, 1024);

    if (fade <= 0.01) {
      this.displayTexture.needsUpdate = true;
      if (this.internalDisplayPlane) {
        this.internalDisplayPlane.visible = false;
      }
      return;
    }

    ctx.save();
    ctx.globalAlpha = Math.min(1.0, fade);

    // Warm peaceful golden aura inside the orb
    const discGrad = ctx.createRadialGradient(512, 512, 40, 512, 512, 480);
    discGrad.addColorStop(0, 'rgba(255, 235, 180, 0.32)');
    discGrad.addColorStop(0.6, 'rgba(240, 180, 95, 0.16)');
    discGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');
    ctx.fillStyle = discGrad;
    ctx.beginPath();
    ctx.arc(512, 512, 480, 0, Math.PI * 2);
    ctx.fill();

    // Subtle wisdom emblem / ring
    ctx.strokeStyle = 'rgba(255, 225, 160, 0.5)';
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.arc(512, 512, 440, 0, Math.PI * 2);
    ctx.stroke();

    ctx.font = '600 36px "Space Grotesk", sans-serif';
    ctx.fillStyle = '#9beeff';
    ctx.textAlign = 'center';
    ctx.strokeStyle = 'rgba(5, 24, 43, 0.98)';
    ctx.lineWidth = 9;
    ctx.lineJoin = 'round';
    ctx.shadowColor = 'rgba(0, 12, 28, 0.95)';
    ctx.shadowBlur = 16;
    ctx.strokeText('CLOSING WISDOM', 512, 290);
    ctx.fillText('CLOSING WISDOM', 512, 290);
    ctx.shadowBlur = 0;

    ctx.strokeStyle = 'rgba(245, 201, 130, 0.4)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(340, 330);
    ctx.lineTo(684, 330);
    ctx.stroke();

    // Central quote
    ctx.font = 'italic 500 52px "Playfair Display", Georgia, serif';
    ctx.fillStyle = '#eafaff';
    ctx.strokeStyle = 'rgba(5, 24, 43, 0.98)';
    ctx.lineWidth = 10;
    ctx.lineJoin = 'round';
    ctx.shadowColor = 'rgba(0, 12, 28, 0.98)';
    ctx.shadowBlur = 18;
    ctx.strokeText('"A calmer mind creates', 512, 480);
    ctx.strokeText('a brighter tomorrow."', 512, 555);
    ctx.fillText('"A calmer mind creates', 512, 480);
    ctx.fillText('a brighter tomorrow."', 512, 555);
    ctx.shadowBlur = 0;

    // Subtle decorative lotus/calm spark
    ctx.font = '400 30px "Space Grotesk", sans-serif';
    ctx.fillStyle = '#b9f3ff';
    ctx.strokeStyle = 'rgba(5, 24, 43, 0.95)';
    ctx.lineWidth = 7;
    ctx.lineJoin = 'round';
    ctx.shadowColor = 'rgba(0, 12, 28, 0.9)';
    ctx.shadowBlur = 12;
    ctx.strokeText('— EXORA RITUAL —', 512, 700);
    ctx.fillText('— EXORA RITUAL —', 512, 700);
    ctx.shadowBlur = 0;

    ctx.restore();
    this.displayTexture.needsUpdate = true;

    if (this.internalDisplayPlane) {
      (this.internalDisplayPlane.material as THREE.MeshBasicMaterial).opacity = fade * 0.95;
      this.internalDisplayPlane.visible = fade > 0.01;
    }
  }

  public materialize() {
    this.isMaterialized = true;
    this.orbGroup.visible = true;
    this.materializationProgress = 0;
  }

  public setDocked(docked: boolean) {
    this.isDocked = docked;
    if (docked) {
      this.currentOrbTarget.set(this.dockPosition.x, this.dockPosition.y + 0.075, this.dockPosition.z);
    } else {
      this.currentOrbTarget.set(this.dockPosition.x, this.orbHoverY, this.dockPosition.z);
    }
  }

  public update(delta: number, cameraPosition: THREE.Vector3) {
    const time = performance.now() * 0.001;

    // Materialization growth
    if (this.isMaterialized && this.materializationProgress < 1.0) {
      this.materializationProgress = Math.min(1.0, this.materializationProgress + delta * 0.85);
      const s = THREE.MathUtils.smoothstep(this.materializationProgress, 0, 1);
      this.orbGroup.scale.set(s, s, s);
    }

    // Gentle hover physics when not grabbed
    if (!this.isGrabbed) {
      if (!this.isDocked) {
        const bob = Math.sin(time * 1.5) * 0.012;
        this.currentOrbTarget.y = this.orbHoverY + bob;
      }
      this.orbGroup.position.lerp(this.currentOrbTarget, Math.min(1.0, delta * 6.0));
    }

    // Swirl internal particle cloud
    if (this.innerParticleCloud) {
      this.innerParticleCloud.rotation.y += delta * 0.35;
      this.innerParticleCloud.rotation.x += delta * 0.15;
    }

    // Core pulsing glow
    if (this.innerCoreSphere) {
      const pulse = 0.16 + Math.sin(time * 2.0) * 0.04;
      (this.innerCoreSphere.material as THREE.MeshBasicMaterial).opacity = pulse;
    }

    // Orient internal holographic display toward camera eye
    if (this.internalDisplayPlane && this.internalDisplayPlane.visible) {
      this.internalDisplayPlane.lookAt(cameraPosition);
    }
  }

  public clearInternalDisplay() {
    this.currentDisplayMode = 'none';
    if (this.internalDisplayPlane) {
      this.internalDisplayPlane.visible = false;
      (this.internalDisplayPlane.material as THREE.MeshBasicMaterial).opacity = 0;
    }
  }
}

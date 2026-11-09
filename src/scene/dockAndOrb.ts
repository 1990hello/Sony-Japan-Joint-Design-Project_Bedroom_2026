/**
 * EXORA Central Orb & Docking Station
 * Physically convincing glass orb with internal depth, swirling micro-particles,
 * internal accomplishments display, and 2046 consumer docking station with
 * edible-film printer slot and mist ring.
 */

import * as THREE from 'three';

export class DockAndOrb {
  public group: THREE.Group;
  public dockGroup: THREE.Group;
  public orbGroup: THREE.Group;

  // Key meshes
  public outerGlassOrb!: THREE.Mesh;
  public innerCoreSphere!: THREE.Mesh;
  public innerParticleCloud!: THREE.Points;
  public accomplishmentsPlane!: THREE.Mesh;
  public dockRingLight!: THREE.PointLight;
  public orbInternalLight!: THREE.PointLight;
  public printerSlotHatch!: THREE.Mesh;

  // Orb resting and hovering coordinates (Desk surface is at y = 0.74)
  // Centered left-to-right and set toward the far side of the tabletop, away from the seated participant.
  public readonly dockPosition = new THREE.Vector3(0, 0.74, -0.2);
  public readonly orbHoverY = 0.74 + 0.24; // hovering above docking station
  public currentOrbTarget = new THREE.Vector3();
  public orbVelocity = new THREE.Vector3();

  // Orb interaction state
  public isMaterialized: boolean = false;
  public isGrabbed: boolean = false;
  public isDocked: boolean = false;
  private materializationProgress: number = 0;
  private accomplishmentsCanvas!: HTMLCanvasElement;
  private accomplishmentsTexture!: THREE.CanvasTexture;

  constructor() {
    this.group = new THREE.Group();
    this.dockGroup = new THREE.Group();
    this.orbGroup = new THREE.Group();

    this.dockGroup.position.copy(this.dockPosition);
    this.currentOrbTarget.set(this.dockPosition.x, this.orbHoverY, this.dockPosition.z);
    this.orbGroup.position.copy(this.currentOrbTarget);

    this.group.add(this.dockGroup);
    this.group.add(this.orbGroup);

    this.buildDockingStation();
    this.buildGlassOrb();
    this.buildAccomplishments();

    // Start hidden until wave trigger in Stage 1
    this.orbGroup.scale.set(0.001, 0.001, 0.001);
    this.orbGroup.visible = false;
  }

  private buildDockingStation() {
    // 2046 Consumer technology: Sleek matte graphite base with chamfered warm bronze accents
    const baseMat = new THREE.MeshStandardMaterial({
      color: 0x1a1918,
      roughness: 0.35,
      metalness: 0.65,
    });

    const bronzeMat = new THREE.MeshStandardMaterial({
      color: 0x7a5b3a,
      roughness: 0.25,
      metalness: 0.85,
    });

    // Base body: Cylindrical with soft fillet bevel
    const baseGeo = new THREE.CylinderGeometry(0.12, 0.13, 0.038, 48);
    const baseMesh = new THREE.Mesh(baseGeo, baseMat);
    baseMesh.position.set(0, 0.019, 0);
    baseMesh.castShadow = true;
    baseMesh.receiveShadow = true;
    this.dockGroup.add(baseMesh);

    // Concave cradle for the glass orb to rest in
    const cradleMat = new THREE.MeshStandardMaterial({
      color: 0x121110,
      roughness: 0.6,
      metalness: 0.4,
    });
    const cradleGeo = new THREE.CylinderGeometry(0.08, 0.065, 0.008, 36);
    const cradle = new THREE.Mesh(cradleGeo, cradleMat);
    cradle.position.set(0, 0.035, 0);
    this.dockGroup.add(cradle);

    // Bronze chamfer accent ring
    const ringGeo = new THREE.TorusGeometry(0.082, 0.003, 16, 48);
    const ringMesh = new THREE.Mesh(ringGeo, bronzeMat);
    ringMesh.rotation.x = Math.PI / 2;
    ringMesh.position.set(0, 0.038, 0);
    this.dockGroup.add(ringMesh);

    // Luminescent breathing dock status ring
    const glowRingMat = new THREE.MeshBasicMaterial({
      color: 0xffddaa,
      transparent: true,
      opacity: 0.7,
    });
    const glowRing = new THREE.Mesh(new THREE.TorusGeometry(0.076, 0.002, 16, 48), glowRingMat);
    glowRing.rotation.x = Math.PI / 2;
    glowRing.position.set(0, 0.0385, 0);
    this.dockGroup.add(glowRing);

    // Front horizontal edible-film printer slot (width 0.075m, height 0.006m)
    const slotMat = new THREE.MeshBasicMaterial({ color: 0x0a0a0a });
    const slotMesh = new THREE.Mesh(new THREE.BoxGeometry(0.075, 0.006, 0.01), slotMat);
    slotMesh.position.set(0, 0.024, 0.125);
    this.dockGroup.add(slotMesh);

    // Precision printer motorized hatch
    const hatchMat = new THREE.MeshStandardMaterial({ color: 0x2e2a26, roughness: 0.3, metalness: 0.7 });
    this.printerSlotHatch = new THREE.Mesh(new THREE.BoxGeometry(0.076, 0.007, 0.004), hatchMat);
    this.printerSlotHatch.position.set(0, 0.024, 0.129);
    this.dockGroup.add(this.printerSlotHatch);

    // Subtle atmospheric mist micro-perforations ring
    const mistRingMat = new THREE.MeshBasicMaterial({ color: 0x443b33 });
    const mistRing = new THREE.Mesh(new THREE.TorusGeometry(0.105, 0.0015, 12, 48), mistRingMat);
    mistRing.rotation.x = Math.PI / 2;
    mistRing.position.set(0, 0.038, 0);
    this.dockGroup.add(mistRing);

    // Soft warm dock illumination light
    this.dockRingLight = new THREE.PointLight(0xffd499, 0.65, 1.2, 2.0);
    this.dockRingLight.position.set(0, 0.08, 0);
    this.dockGroup.add(this.dockRingLight);
  }

  private buildGlassOrb() {
    // Physically convincing glass orb (radius 0.075m = 15cm diameter)
    const orbRadius = 0.075;

    // 1. Outer Physical Glass Shell with transmission & clearcoat
    const glassMat = new THREE.MeshPhysicalMaterial({
      color: 0xffffff,
      transmission: 0.95,
      opacity: 1.0,
      transparent: true,
      roughness: 0.04,
      metalness: 0.08,
      ior: 1.55,
      thickness: 0.09,
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
      // Uniform random inside sphere of radius orbRadius * 0.65
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

  private buildAccomplishments() {
    // Accomplishments card suspended inside the glass sphere
    this.accomplishmentsCanvas = document.createElement('canvas');
    this.accomplishmentsCanvas.width = 512;
    this.accomplishmentsCanvas.height = 512;

    this.accomplishmentsTexture = new THREE.CanvasTexture(this.accomplishmentsCanvas);
    this.accomplishmentsTexture.colorSpace = THREE.SRGBColorSpace;

    const cardMat = new THREE.MeshBasicMaterial({
      map: this.accomplishmentsTexture,
      transparent: true,
      opacity: 0.0,
      depthWrite: false,
      side: THREE.DoubleSide,
    });

    // Small floating card positioned at orb center
    const cardGeo = new THREE.PlaneGeometry(0.095, 0.095);
    this.accomplishmentsPlane = new THREE.Mesh(cardGeo, cardMat);
    this.accomplishmentsPlane.position.set(0, 0, 0);
    this.orbGroup.add(this.accomplishmentsPlane);
  }

  public renderAccomplishmentsText(fade: number) {
    const ctx = this.accomplishmentsCanvas.getContext('2d')!;
    ctx.clearRect(0, 0, 512, 512);

    if (fade <= 0.01) {
      this.accomplishmentsTexture.needsUpdate = true;
      return;
    }

    ctx.save();
    ctx.globalAlpha = Math.min(1.0, fade);

    // Soft luminous background disc inside the sphere
    const grad = ctx.createRadialGradient(256, 256, 10, 256, 256, 240);
    grad.addColorStop(0, 'rgba(255, 240, 220, 0.22)');
    grad.addColorStop(0.6, 'rgba(235, 195, 140, 0.12)');
    grad.addColorStop(1, 'rgba(0, 0, 0, 0)');
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(256, 256, 240, 0, Math.PI * 2);
    ctx.fill();

    // Subtle header
    ctx.font = '600 16px "Space Grotesk", sans-serif';
    ctx.fillStyle = '#f0c27b';
    ctx.textAlign = 'center';
    ctx.fillText('TODAY\'S RECOGNITION', 256, 75);

    // Divider line
    ctx.strokeStyle = 'rgba(240, 194, 123, 0.4)';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(140, 92);
    ctx.lineTo(372, 92);
    ctx.stroke();

    // 3 Required Sample Accomplishments:
    // 1. Earpiece — Completed the 3D modelling.
    // 2. Project 1 — Arranged a meeting with clients.
    // 3. Project 2 — Began sketching ideas.
    ctx.textAlign = 'left';
    ctx.fillStyle = '#ffffff';

    // Item 1
    ctx.font = '700 18px "Plus Jakarta Sans", sans-serif';
    ctx.fillText('• Earpiece', 65, 145);
    ctx.font = '400 16px "Plus Jakarta Sans", sans-serif';
    ctx.fillStyle = '#e2d7cb';
    ctx.fillText('Completed the 3D modelling.', 82, 172);

    // Item 2
    ctx.fillStyle = '#ffffff';
    ctx.font = '700 18px "Plus Jakarta Sans", sans-serif';
    ctx.fillText('• Project 1', 65, 220);
    ctx.font = '400 16px "Plus Jakarta Sans", sans-serif';
    ctx.fillStyle = '#e2d7cb';
    ctx.fillText('Arranged a meeting with clients.', 82, 247);

    // Item 3
    ctx.fillStyle = '#ffffff';
    ctx.font = '700 18px "Plus Jakarta Sans", sans-serif';
    ctx.fillText('• Project 2', 65, 295);
    ctx.font = '400 16px "Plus Jakarta Sans", sans-serif';
    ctx.fillStyle = '#e2d7cb';
    ctx.fillText('Began sketching ideas.', 82, 322);

    // Quote message: "Every step counts, even the ones that are just beginning."
    ctx.textAlign = 'center';
    ctx.font = 'italic 500 18px "Playfair Display", Georgia, serif';
    ctx.fillStyle = '#ffe9c4';
    ctx.fillText('"Every step counts,', 256, 400);
    ctx.fillText('even the ones that are just beginning."', 256, 430);

    ctx.restore();
    this.accomplishmentsTexture.needsUpdate = true;
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
        // Natural hovering float
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

    // Orient accomplishments card to face user camera
    if (this.accomplishmentsPlane && this.accomplishmentsPlane.visible) {
      this.accomplishmentsPlane.lookAt(cameraPosition.x, this.accomplishmentsPlane.position.y + this.orbGroup.position.y, cameraPosition.z);
    }
  }

  public showAccomplishments(fade: number) {
    this.renderAccomplishmentsText(fade);
    if (this.accomplishmentsPlane) {
      (this.accomplishmentsPlane.material as THREE.MeshBasicMaterial).opacity = fade;
    }
  }
}

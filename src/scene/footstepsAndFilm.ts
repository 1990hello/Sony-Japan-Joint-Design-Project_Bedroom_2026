/**
 * EXORA Stage 3: Glowing Footsteps, Edible-Film Printing & Ritual Choices
 * Implements progressive doorway footsteps, 3D printed edible film emergence,
 * and dual takeaway rituals (Eat or Dissolve in water glass).
 */

import * as THREE from 'three';
import { createFootstepTexture } from './materials';

export class FootstepsAndFilm {
  public group: THREE.Group;
  private footstepsGroup: THREE.Group;
  private footstepMeshes: THREE.Mesh[] = [];

  // Edible film
  public edibleFilmGroup: THREE.Group;
  public edibleFilmMesh!: THREE.Mesh;
  // Edible film rests just beyond the printer slot at the centered, far-side dock.
  public filmInitialPos = new THREE.Vector3(0, 0.74 + 0.024, -0.2 + 0.14);
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
    this.buildEdibleFilm();
    this.buildDoorwayGlow();
    this.buildEffervescenceParticles();

    this.edibleFilmGroup.visible = false;
  }

  private buildFootstepsPath() {
    // Generate curved path from desk front (0.3, -0.2) to doorway (3.4, -3.3)
    const curve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(0.2, 0.006, 0.2),
      new THREE.Vector3(0.6, 0.006, -0.4),
      new THREE.Vector3(1.1, 0.006, -1.1),
      new THREE.Vector3(1.7, 0.006, -1.8),
      new THREE.Vector3(2.3, 0.006, -2.4),
      new THREE.Vector3(2.9, 0.006, -2.9),
      new THREE.Vector3(3.4, 0.006, -3.3),
    ]);

    const stepPoints = curve.getPoints(10);
    const footstepTex = createFootstepTexture();

    stepPoints.forEach((pt, i) => {
      // Alternate left and right foot offset perpendicular to tangent
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

      // Align rotation along walking direction
      const angle = Math.atan2(tangent.x, tangent.z);
      mesh.rotation.z = angle + Math.PI;

      mesh.position.copy(footPos);
      this.footstepsGroup.add(mesh);
      this.footstepMeshes.push(mesh);
    });
  }

  private buildEdibleFilm() {
    // Thin translucent edible film (40mm x 30mm x 0.4mm)
    // Plausible 2046 edible micronutrient film
    this.edibleFilmGroup.position.copy(this.filmInitialPos);

    const filmMat = new THREE.MeshPhysicalMaterial({
      color: 0xffe2b8,
      transmission: 0.78,
      opacity: 0.85,
      transparent: true,
      roughness: 0.18,
      metalness: 0.05,
      ior: 1.45,
      clearcoat: 0.6,
      depthWrite: false,
      side: THREE.DoubleSide,
    });

    const filmGeo = new THREE.BoxGeometry(0.052, 0.0006, 0.038);
    this.edibleFilmMesh = new THREE.Mesh(filmGeo, filmMat);
    this.edibleFilmGroup.add(this.edibleFilmMesh);

    // Subtle golden nutritional micro-grid line pattern
    const lineMat = new THREE.LineBasicMaterial({ color: 0xe6b870, transparent: true, opacity: 0.5 });
    const lineGeo = new THREE.BufferGeometry().setFromPoints([
      new THREE.Vector3(-0.024, 0.0004, 0),
      new THREE.Vector3(0.024, 0.0004, 0),
    ]);
    const lineMesh = new THREE.Line(lineGeo, lineMat);
    this.edibleFilmGroup.add(lineMesh);
  }

  private buildDoorwayGlow() {
    // Ethereal vertical warm glow sheet standing inside the open doorway
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
    this.doorwayGlowMesh.position.set(3.48, 1.15, -3.3);
    this.doorwayGlowMesh.rotation.y = -Math.PI / 2;
    this.group.add(this.doorwayGlowMesh);
  }

  private buildEffervescenceParticles() {
    // Water effervescence bubbles inside desk water glass (x: -0.34, y: 0.74, z: 0.12)
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

  public printEdibleFilm() {
    this.isFilmPrinted = true;
    this.edibleFilmGroup.visible = true;
    // Animate film sliding smoothly out of printer slot
    this.edibleFilmGroup.position.set(0, 0.74 + 0.024, -0.2 + 0.08);
  }

  public triggerDissolveInWater() {
    this.isFilmDissolved = true;
    this.isEffervescing = true;
    this.effervescenceTime = 0;
    // Animate film dissolving into the water
    this.edibleFilmGroup.position.set(-0.5, 0.74 + 0.08, -0.2);
  }

  public triggerConsumeFilm() {
    this.isFilmConsumed = true;
    // Scale down & fade out toward user
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

        // Increase doorway warm glow as steps approach
        const glowFactor = this.currentStepIndex / this.footstepMeshes.length;
        (this.doorwayGlowMesh.material as THREE.MeshBasicMaterial).opacity = glowFactor * 0.35;

        if (this.currentStepIndex === this.footstepMeshes.length && this.onAllStepsLit) {
          this.onAllStepsLit();
        }
      }
    }

    // 2. Film extrusion animation
    if (this.isFilmPrinted && !this.isFilmGrabbed && !this.isFilmConsumed && !this.isFilmDissolved) {
      this.edibleFilmGroup.position.lerp(this.filmInitialPos, Math.min(1.0, delta * 3.5));
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
          y = 0.74 + 0.02; // wrap back down in glass
        }
        pos.setY(i, y);
      }
      pos.needsUpdate = true;

      // Dissolve edible film mesh
      if (this.edibleFilmMesh) {
        const fMat = this.edibleFilmMesh.material as THREE.MeshPhysicalMaterial;
        fMat.opacity = Math.max(0, 0.85 * (1 - this.effervescenceTime / 2.0));
        const s = Math.max(0.01, 1 - this.effervescenceTime / 2.0);
        this.edibleFilmMesh.scale.set(s, s, s);
      }

      if (this.effervescenceTime > 2.6) {
        this.isEffervescing = false;
        this.edibleFilmGroup.visible = false;
      }
    }

    // 4. Consume film animation
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
    this.isFilmGrabbed = false;
    this.isFilmConsumed = false;
    this.isFilmDissolved = false;
    this.isEffervescing = false;
    this.edibleFilmGroup.visible = false;
    this.edibleFilmGroup.position.copy(this.filmInitialPos);
    this.edibleFilmMesh.scale.set(1, 1, 1);
    (this.edibleFilmMesh.material as THREE.MeshPhysicalMaterial).opacity = 0.85;
    (this.bubblesSystem.material as THREE.PointsMaterial).opacity = 0;
  }
}

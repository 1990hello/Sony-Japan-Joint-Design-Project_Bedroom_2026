/**
 * EXORA Floating Workspace Screens
 * Six translucent glass screens arranged in a gentle seated viewing arc.
 * Features realistic 2046 UI content, curved geometry, and smooth absorption physics into the orb.
 */

import * as THREE from 'three';
import { FloatingScreenData } from '../types';

export class FloatingScreenManager {
  public group: THREE.Group;
  public screenMeshes: THREE.Mesh[] = [];
  public initialPositions: THREE.Vector3[] = [];
  public initialRotations: THREE.Euler[] = [];
  private particleSystems: THREE.Points[] = [];

  // Absorption animation state
  public isAbsorbing: boolean = false;
  private absorbProgress: number[] = [0, 0, 0, 0, 0, 0];
  private absorbDelays: number[] = [0, 0.45, 0.9, 1.35, 1.8, 2.25];
  private currentElapsedTime: number = 0;
  private onScreenAbsorbed?: (index: number) => void;
  private onAllScreensAbsorbed?: () => void;
  private allAbsorbedTriggered: boolean = false;

  private screensData: FloatingScreenData[] = [
    {
      id: 0,
      category: 'HARDWARE ENGINEERING',
      title: 'Earpiece 3D Mesh',
      subtitle: 'Parametric acoustic geometry v4.2',
      metric: '99.4% resonance fit',
      contentLines: ['• Shell thickness: 0.8mm bio-resin', '• Micro-transducer chamber aligned', '• Final 3D model exported'],
      angle: -0.52,
      radius: 1.08,
      height: 1.18,
    },
    {
      id: 1,
      category: 'CLIENT SYNCHRONIZATION',
      title: 'Project 1 Alignment',
      subtitle: 'Global Stakeholder Briefing',
      metric: 'Confirmed for 09:30',
      contentLines: ['• Client deck finalized & shared', '• Architecture deliverables approved', '• Meeting agenda locked'],
      angle: -0.31,
      radius: 1.04,
      height: 1.25,
    },
    {
      id: 2,
      category: 'DESIGN RESEARCH',
      title: 'Project 2 Ideation',
      subtitle: 'Spatial Material Studies',
      metric: '14 sketches archived',
      contentLines: ['• Warm tactile wood & woven textile', '• Circular form factor exploration', '• First draft completed'],
      angle: -0.10,
      radius: 1.02,
      height: 1.28,
    },
    {
      id: 3,
      category: 'BIOMETRICS & SPACE',
      title: 'Workplace Ergonomics',
      subtitle: 'Circadian environmental feed',
      metric: 'Focus: 4.6 hrs',
      contentLines: ['• Posture score: Optimal (92%)', '• Ambient noise: 34 dB (Calm)', '• Work session target reached'],
      angle: 0.11,
      radius: 1.02,
      height: 1.28,
    },
    {
      id: 4,
      category: 'COLLABORATION',
      title: 'Async Team Digest',
      subtitle: 'Design System PR #128',
      metric: '3 reviews approved',
      contentLines: ['• Design review approved by Sarah', '• Component tokens published', '• Async handoff verified'],
      angle: 0.32,
      radius: 1.04,
      height: 1.25,
    },
    {
      id: 5,
      category: 'WORKDAY SUMMARY',
      title: 'Close of Day Checklist',
      subtitle: 'Sprint 14 Milestones',
      metric: '6/6 tasks closed',
      contentLines: ['• Deliverables pushed to cloud', '• Notifications muted until tomorrow', '• Ready to disconnect'],
      angle: 0.53,
      radius: 1.08,
      height: 1.18,
    },
  ];

  constructor() {
    this.group = new THREE.Group();
    this.createScreens();
  }

  private createScreens() {
    // Participant camera is seated at (0, 1.15, 0.65)
    const userPos = new THREE.Vector3(0, 1.15, 0.65);

    this.screensData.forEach((data, index) => {
      // Screen dimensions: width 0.38m, height 0.25m
      const w = 0.38;
      const h = 0.25;

      // Curved arc placement around seated user
      const x = Math.sin(data.angle) * data.radius;
      const z = userPos.z - Math.cos(data.angle) * data.radius;
      const y = data.height;

      const screenCanvas = this.renderScreenCanvas(data);
      const texture = new THREE.CanvasTexture(screenCanvas);
      texture.colorSpace = THREE.SRGBColorSpace;
      texture.generateMipmaps = true;
      texture.minFilter = THREE.LinearMipmapLinearFilter;

      // Dual-sided translucent glass look
      const screenMat = new THREE.MeshPhysicalMaterial({
        map: texture,
        transparent: true,
        opacity: 0.88,
        roughness: 0.1,
        metalness: 0.15,
        transmission: 0.2,
        clearcoat: 0.8,
        depthWrite: false,
        side: THREE.DoubleSide,
      });

      // Slightly curved plane geometry for futuristic optical glass feel
      const screenGeo = new THREE.PlaneGeometry(w, h, 8, 4);

      // Subtle bevel curve along horizontal axis
      const posAttr = screenGeo.attributes.position;
      for (let i = 0; i < posAttr.count; i++) {
        const px = posAttr.getX(i);
        const pz = -Math.pow(px / (w * 0.5), 2) * 0.015;
        posAttr.setZ(i, pz);
      }
      screenGeo.computeVertexNormals();

      const screenMesh = new THREE.Mesh(screenGeo, screenMat);
      screenMesh.position.set(x, y, z);

      // Angle screen to look directly toward seated user eye level
      screenMesh.lookAt(userPos.x, y, userPos.z);
      // Subtle tilt
      screenMesh.rotateX(0.05);

      this.group.add(screenMesh);
      this.screenMeshes.push(screenMesh);
      this.initialPositions.push(screenMesh.position.clone());
      this.initialRotations.push(screenMesh.rotation.clone());

      // Create particle dissolution cloud attached to this screen
      const particleGeo = new THREE.BufferGeometry();
      const pCount = 120;
      const positions = new Float32Array(pCount * 3);
      for (let p = 0; p < pCount; p++) {
        positions[p * 3] = (Math.random() - 0.5) * w;
        positions[p * 3 + 1] = (Math.random() - 0.5) * h;
        positions[p * 3 + 2] = (Math.random() - 0.5) * 0.05;
      }
      particleGeo.setAttribute('position', new THREE.BufferAttribute(positions, 3));

      const particleMat = new THREE.PointsMaterial({
        color: 0xffdfa8,
        size: 0.014,
        transparent: true,
        opacity: 0.0,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
      });
      const points = new THREE.Points(particleGeo, particleMat);
      points.position.copy(screenMesh.position);
      this.group.add(points);
      this.particleSystems.push(points);
    });
  }

  private renderScreenCanvas(data: FloatingScreenData): HTMLCanvasElement {
    const canvas = document.createElement('canvas');
    canvas.width = 768;
    canvas.height = 512;
    const ctx = canvas.getContext('2d')!;

    // Translucent dark frosted glass background
    const bgGrad = ctx.createLinearGradient(0, 0, 0, 512);
    bgGrad.addColorStop(0, 'rgba(28, 32, 40, 0.82)');
    bgGrad.addColorStop(1, 'rgba(18, 21, 28, 0.90)');
    ctx.fillStyle = bgGrad;
    ctx.beginPath();
    ctx.roundRect(16, 16, 736, 480, 20);
    ctx.fill();

    // Subtle edge luminescence border
    ctx.strokeStyle = 'rgba(215, 230, 255, 0.28)';
    ctx.lineWidth = 2.5;
    ctx.stroke();

    // Top status pill & category
    ctx.fillStyle = 'rgba(255, 255, 255, 0.08)';
    ctx.beginPath();
    ctx.roundRect(40, 42, 240, 32, 8);
    ctx.fill();

    ctx.font = '600 15px "Space Grotesk", monospace, sans-serif';
    ctx.fillStyle = '#f0c27b';
    ctx.fillText(data.category, 54, 64);

    // Right metric badge
    ctx.fillStyle = 'rgba(144, 238, 144, 0.15)';
    ctx.beginPath();
    ctx.roundRect(500, 42, 210, 32, 8);
    ctx.fill();
    ctx.fillStyle = '#a6e3a1';
    ctx.font = '500 15px "Space Grotesk", sans-serif';
    ctx.fillText(`✓ ${data.metric}`, 515, 64);

    // Screen Main Title
    ctx.font = '700 32px "Plus Jakarta Sans", sans-serif';
    ctx.fillStyle = '#ffffff';
    ctx.fillText(data.title, 42, 126);

    // Subtitle
    ctx.font = '400 18px "Plus Jakarta Sans", sans-serif';
    ctx.fillStyle = '#a5b4cb';
    ctx.fillText(data.subtitle, 42, 160);

    // Divider line
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.12)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(42, 185);
    ctx.lineTo(726, 185);
    ctx.stroke();

    // Work content bullet list
    ctx.font = '400 20px "Plus Jakarta Sans", sans-serif';
    ctx.fillStyle = '#e2e8f0';
    data.contentLines.forEach((line, idx) => {
      ctx.fillText(line, 42, 232 + idx * 44);
    });

    // Decorative 2046 schematic graphics for each screen
    if (data.id === 0) {
      // 3D acoustic mesh wireframe schematic
      ctx.strokeStyle = 'rgba(120, 200, 255, 0.4)';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      for (let i = 0; i < 6; i++) {
        ctx.arc(580, 340, 25 + i * 16, -0.6, 2.8);
      }
      ctx.stroke();
    } else if (data.id === 1) {
      // Schedule timeline
      ctx.fillStyle = 'rgba(255, 180, 100, 0.35)';
      ctx.fillRect(480, 280, 220, 12);
      ctx.fillRect(480, 310, 160, 12);
      ctx.fillRect(480, 340, 190, 12);
    } else if (data.id === 3) {
      // Biometric waveform
      ctx.strokeStyle = '#a6e3a1';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(480, 320);
      for (let x = 0; x < 220; x += 10) {
        ctx.lineTo(480 + x, 320 + Math.sin(x * 0.12) * 22);
      }
      ctx.stroke();
    }

    // Bottom subtle indicator
    ctx.fillStyle = 'rgba(255, 255, 255, 0.35)';
    ctx.font = '400 14px "Space Grotesk", sans-serif';
    ctx.fillText(`EXORA SYNC 2046.11 // NODE ${data.id + 1} OF 6`, 42, 455);

    return canvas;
  }

  public startAbsorption(
    onScreenAbsorbed?: (index: number) => void,
    onAllScreensAbsorbed?: () => void
  ) {
    this.isAbsorbing = true;
    this.currentElapsedTime = 0;
    this.absorbProgress = [0, 0, 0, 0, 0, 0];
    this.allAbsorbedTriggered = false;
    this.onScreenAbsorbed = onScreenAbsorbed;
    this.onAllScreensAbsorbed = onAllScreensAbsorbed;
  }

  public update(delta: number, orbPosition: THREE.Vector3) {
    if (!this.isAbsorbing) {
      // Gentle breathing float when idle
      const time = performance.now() * 0.001;
      this.screenMeshes.forEach((mesh, i) => {
        const initPos = this.initialPositions[i];
        mesh.position.y = initPos.y + Math.sin(time * 1.2 + i * 0.8) * 0.008;
      });
      return;
    }

    this.currentElapsedTime += delta;
    let finishedCount = 0;

    this.screenMeshes.forEach((mesh, i) => {
      const delay = this.absorbDelays[i];
      if (this.currentElapsedTime < delay) return;

      const duration = 1.3;
      const progress = Math.min(1.0, (this.currentElapsedTime - delay) / duration);
      this.absorbProgress[i] = progress;

      // Smooth ease-in-out curve
      const t = progress < 0.5 ? 4 * progress * progress * progress : 1 - Math.pow(-2 * progress + 2, 3) / 2;

      const initPos = this.initialPositions[i];
      // Arc path curving inward and toward the orb
      mesh.position.lerpVectors(initPos, orbPosition, t);
      // Lift slightly on approach
      mesh.position.y += Math.sin(progress * Math.PI) * 0.12;

      // Shrink and fade as it enters orb
      const scale = Math.max(0.001, 1 - Math.pow(t, 2.5));
      mesh.scale.set(scale, scale, scale);

      const mat = mesh.material as THREE.MeshPhysicalMaterial;
      mat.opacity = Math.max(0, 0.88 * (1 - Math.pow(progress, 1.8)));

      // Trigger particle dissolve cloud
      const particles = this.particleSystems[i];
      const pMat = particles.material as THREE.PointsMaterial;
      if (progress > 0.35 && progress < 1.0) {
        particles.position.copy(mesh.position);
        pMat.opacity = Math.sin((progress - 0.35) / 0.65 * Math.PI) * 0.9;
      } else {
        pMat.opacity = 0;
      }

      if (progress >= 1.0) {
        mesh.visible = false;
        particles.visible = false;
        finishedCount++;
        if (this.onScreenAbsorbed && progress === 1.0 && this.absorbProgress[i] === 1.0) {
          // Play chime once
          this.absorbProgress[i] = 1.01;
          this.onScreenAbsorbed(i);
        }
      }
    });

    if (finishedCount === 6 && !this.allAbsorbedTriggered) {
      this.allAbsorbedTriggered = true;
      if (this.onAllScreensAbsorbed) {
        this.onAllScreensAbsorbed();
      }
    }
  }

  public reset() {
    this.isAbsorbing = false;
    this.allAbsorbedTriggered = false;
    this.currentElapsedTime = 0;
    this.absorbProgress = [0, 0, 0, 0, 0, 0];
    this.screenMeshes.forEach((mesh, i) => {
      mesh.visible = true;
      mesh.position.copy(this.initialPositions[i]);
      mesh.rotation.copy(this.initialRotations[i]);
      mesh.scale.set(1, 1, 1);
      const mat = mesh.material as THREE.MeshPhysicalMaterial;
      mat.opacity = 0.88;
    });
    this.particleSystems.forEach(p => {
      p.visible = true;
      (p.material as THREE.PointsMaterial).opacity = 0;
    });
  }
}

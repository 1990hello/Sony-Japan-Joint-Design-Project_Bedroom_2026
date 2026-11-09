/**
 * EXORA Procedural Materials & Textures
 * All textures generated via HTML5 2D Canvas with SRGBColorSpace & anisotropy.
 * 100% self-contained, zero external asset dependencies.
 */

import * as THREE from 'three';

// Cache procedural textures
const textureCache = new Map<string, THREE.CanvasTexture>();

/**
 * Procedural Natural Oak / Walnut Wood Grain Texture
 */
export function createWoodTexture(isDark = false): THREE.CanvasTexture {
  const cacheKey = `wood_${isDark}`;
  if (textureCache.has(cacheKey)) return textureCache.get(cacheKey)!;

  const canvas = document.createElement('canvas');
  canvas.width = 1024;
  canvas.height = 1024;
  const ctx = canvas.getContext('2d')!;

  const baseColor = isDark ? '#2b211a' : '#5c4533';
  const grainColor1 = isDark ? '#1f1712' : '#453224';
  const grainColor2 = isDark ? '#3d2e24' : '#735741';

  ctx.fillStyle = baseColor;
  ctx.fillRect(0, 0, 1024, 1024);

  // Subtle organic wood fiber lines
  for (let y = 0; y < 1024; y += 2) {
    const noise = Math.sin(y * 0.05) * 8 + Math.sin(y * 0.01) * 20;
    ctx.strokeStyle = y % 4 === 0 ? grainColor1 : grainColor2;
    ctx.globalAlpha = 0.35 + Math.sin(y * 0.02) * 0.15;
    ctx.lineWidth = 1 + (y % 3 === 0 ? 1 : 0);
    ctx.beginPath();
    ctx.moveTo(0, y + noise);
    ctx.bezierCurveTo(340, y + noise - 4, 680, y + noise + 6, 1024, y + noise);
    ctx.stroke();
  }

  // Soft wood rings
  ctx.globalAlpha = 0.08;
  ctx.fillStyle = isDark ? '#000000' : '#ffffff';
  for (let i = 0; i < 6; i++) {
    const rx = 150 + i * 160;
    const ry = 512;
    const rad = 180 + Math.random() * 200;
    const grad = ctx.createRadialGradient(rx, ry, 10, rx, ry, rad);
    grad.addColorStop(0, 'rgba(0,0,0,0.5)');
    grad.addColorStop(0.5, 'rgba(0,0,0,0.1)');
    grad.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 1024, 1024);
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.colorSpace = THREE.SRGBColorSpace;
  textureCache.set(cacheKey, texture);
  return texture;
}

/**
 * Procedural Fabric Weave Texture for Bed, Duvet, and Cushions
 */
export function createFabricTexture(colorHex: string, grainHex: string): THREE.CanvasTexture {
  const cacheKey = `fabric_${colorHex}_${grainHex}`;
  if (textureCache.has(cacheKey)) return textureCache.get(cacheKey)!;

  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 512;
  const ctx = canvas.getContext('2d')!;

  ctx.fillStyle = colorHex;
  ctx.fillRect(0, 0, 512, 512);

  // Micro-weave cross pattern
  ctx.fillStyle = grainHex;
  for (let x = 0; x < 512; x += 4) {
    for (let y = 0; y < 512; y += 4) {
      if ((x + y) % 8 === 0) {
        ctx.globalAlpha = 0.12;
        ctx.fillRect(x, y, 2, 4);
      } else {
        ctx.globalAlpha = 0.08;
        ctx.fillRect(x, y, 4, 2);
      }
    }
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(8, 8);
  texture.colorSpace = THREE.SRGBColorSpace;
  textureCache.set(cacheKey, texture);
  return texture;
}

/**
 * Procedural 2046 Exterior Skyline & Twilight Sky
 */
export function createSkylineTexture(): THREE.CanvasTexture {
  const cacheKey = 'skyline_2046';
  if (textureCache.has(cacheKey)) return textureCache.get(cacheKey)!;

  const canvas = document.createElement('canvas');
  canvas.width = 2048;
  canvas.height = 1024;
  const ctx = canvas.getContext('2d')!;

  // Deep peaceful evening twilight gradient (amber dusk to deep twilight indigo)
  const skyGrad = ctx.createLinearGradient(0, 0, 0, 1024);
  skyGrad.addColorStop(0, '#0c1220'); // deep night blue
  skyGrad.addColorStop(0.45, '#1e1c38'); // dusk purple
  skyGrad.addColorStop(0.72, '#4a2c3a'); // warm magenta dusk
  skyGrad.addColorStop(0.88, '#9c5238'); // glowing twilight horizon
  skyGrad.addColorStop(1.0, '#d97d4a'); // warm sunset amber glow
  ctx.fillStyle = skyGrad;
  ctx.fillRect(0, 0, 2048, 1024);

  // Soft distant clouds
  ctx.fillStyle = '#2c1e2d';
  for (let i = 0; i < 18; i++) {
    const cx = Math.random() * 2048;
    const cy = 400 + Math.random() * 320;
    const rw = 180 + Math.random() * 300;
    const rh = 18 + Math.random() * 35;
    ctx.globalAlpha = 0.12;
    ctx.beginPath();
    ctx.ellipse(cx, cy, rw, rh, 0, 0, Math.PI * 2);
    ctx.fill();
  }

  // 2046 architectural skyline (sleek bio-towers, curved silhouettes, soft warm illumination)
  ctx.globalAlpha = 0.95;
  const horizonY = 740;

  // Layer 1: Distant low silhouette
  ctx.fillStyle = '#140f1a';
  for (let x = 0; x < 2048; x += 35 + Math.random() * 40) {
    const w = 25 + Math.random() * 60;
    const h = 80 + Math.random() * 180;
    ctx.fillRect(x, horizonY - h, w, h + 300);
  }

  // Layer 2: Mid-distance organic vertical towers
  ctx.fillStyle = '#0a0b12';
  for (let x = 50; x < 2048; x += 80 + Math.random() * 90) {
    const w = 45 + Math.random() * 70;
    const h = 160 + Math.random() * 320;
    // Curved top
    ctx.beginPath();
    ctx.moveTo(x, horizonY + 300);
    ctx.lineTo(x, horizonY - h + 20);
    ctx.quadraticCurveTo(x + w / 2, horizonY - h - 15, x + w, horizonY - h + 20);
    ctx.lineTo(x + w, horizonY + 300);
    ctx.fill();

    // Subtle warm architectural window accents
    ctx.fillStyle = 'rgba(255, 220, 160, 0.45)';
    for (let wy = horizonY - h + 40; wy < horizonY; wy += 28) {
      if (Math.random() > 0.4) {
        ctx.fillRect(x + 10, wy, w - 20, 2);
      }
    }
    ctx.fillStyle = '#0a0b12';
  }

  // Gentle atmospheric fog wash over city base
  const fogGrad = ctx.createLinearGradient(0, horizonY - 100, 0, 1024);
  fogGrad.addColorStop(0, 'rgba(217, 125, 74, 0)');
  fogGrad.addColorStop(0.7, 'rgba(156, 82, 56, 0.45)');
  fogGrad.addColorStop(1, 'rgba(12, 18, 32, 0.95)');
  ctx.fillStyle = fogGrad;
  ctx.fillRect(0, horizonY - 100, 2048, 1024 - (horizonY - 100));

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.ClampToEdgeWrapping;
  texture.wrapT = THREE.ClampToEdgeWrapping;
  texture.colorSpace = THREE.SRGBColorSpace;
  textureCache.set(cacheKey, texture);
  return texture;
}

/**
 * Footstep Glow Decal Canvas Texture
 */
export function createFootstepTexture(): THREE.CanvasTexture {
  const cacheKey = 'footstep_texture';
  if (textureCache.has(cacheKey)) return textureCache.get(cacheKey)!;

  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 256;
  const ctx = canvas.getContext('2d')!;

  ctx.clearRect(0, 0, 256, 256);

  // Soft luminous sole shape (gentle natural footwear sole)
  ctx.save();
  ctx.translate(128, 128);

  // Heel
  const heelGrad = ctx.createRadialGradient(0, 48, 5, 0, 48, 35);
  heelGrad.addColorStop(0, 'rgba(255, 235, 180, 0.95)');
  heelGrad.addColorStop(0.5, 'rgba(240, 190, 110, 0.6)');
  heelGrad.addColorStop(1, 'rgba(210, 140, 60, 0)');
  ctx.fillStyle = heelGrad;
  ctx.beginPath();
  ctx.ellipse(0, 48, 22, 28, 0, 0, Math.PI * 2);
  ctx.fill();

  // Forefoot
  const foreGrad = ctx.createRadialGradient(0, -32, 10, 0, -32, 55);
  foreGrad.addColorStop(0, 'rgba(255, 240, 190, 0.95)');
  foreGrad.addColorStop(0.6, 'rgba(240, 190, 110, 0.55)');
  foreGrad.addColorStop(1, 'rgba(210, 140, 60, 0)');
  ctx.fillStyle = foreGrad;
  ctx.beginPath();
  ctx.ellipse(0, -32, 28, 45, 0, 0, Math.PI * 2);
  ctx.fill();

  ctx.restore();

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  textureCache.set(cacheKey, texture);
  return texture;
}

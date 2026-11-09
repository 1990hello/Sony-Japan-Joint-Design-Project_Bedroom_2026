/**
 * EXORA 2046 Bedroom Environment
 * Photorealistic, warm, first-person seated bedroom environment.
 * Features: Desk, bed, window with 2046 twilight skyline, doorway,
 * water glass, practical lamps, plants, and natural furniture.
 */

import * as THREE from 'three';
import { createWoodTexture, createFabricTexture, createSkylineTexture } from './materials';

export class BedroomEnvironment {
  public group: THREE.Group;
  public deskLampLight!: THREE.PointLight;
  public roomAmbientLight!: THREE.HemisphereLight;
  public windowLight!: THREE.DirectionalLight;
  public doorSpillLight!: THREE.PointLight;
  public waterGlassMesh!: THREE.Mesh;
  public waterLiquidMesh!: THREE.Mesh;
  public deskSurfaceY: number = 0.74;

  constructor() {
    this.group = new THREE.Group();
    this.buildRoom();
    this.buildWindowAndSkyline();
    this.buildDeskAndSeating();
    this.buildBedAndNightstand();
    this.buildDoorway();
    this.buildDecorAndPlant();
    this.buildWaterGlass();
    this.setupLighting();
  }

  private buildRoom() {
    // Room dimensions: Width 7m (x: -3.5 to 3.5), Depth 7m (z: -5.5 to 1.5), Height 3.2m (y: 0 to 3.2)
    const floorTexture = createWoodTexture(false);
    floorTexture.repeat.set(4, 5);

    const floorGeo = new THREE.PlaneGeometry(8, 8);
    const floorMat = new THREE.MeshStandardMaterial({
      map: floorTexture,
      roughness: 0.35,
      metalness: 0.05,
    });
    const floor = new THREE.Mesh(floorGeo, floorMat);
    floor.rotation.x = -Math.PI / 2;
    floor.position.set(0, 0, -2);
    floor.receiveShadow = true;
    this.group.add(floor);

    // Warm Woven Wool Rug in Center of Bedroom
    const rugTexture = createFabricTexture('#777067', '#625b53');
    const rugGeo = new THREE.PlaneGeometry(3.6, 4.2);
    const rugMat = new THREE.MeshStandardMaterial({
      map: rugTexture,
      roughness: 0.9,
      metalness: 0.0,
      polygonOffset: true,
      polygonOffsetFactor: -1,
      polygonOffsetUnits: -1,
    });
    const rug = new THREE.Mesh(rugGeo, rugMat);
    rug.rotation.x = -Math.PI / 2;
    rug.position.set(0.6, 0.005, -2.5);
    rug.receiveShadow = true;
    this.group.add(rug);

    // Ceiling
    const ceilingMat = new THREE.MeshStandardMaterial({
      color: 0x221e1a,
      roughness: 0.9,
    });
    const ceiling = new THREE.Mesh(floorGeo, ceilingMat);
    ceiling.rotation.x = Math.PI / 2;
    ceiling.position.set(0, 3.2, -2);
    this.group.add(ceiling);

    // Walls: Warm muted architectural plaster/limewash (#ebe4dc in daylight, warm muted tone)
    const wallMat = new THREE.MeshStandardMaterial({
      color: 0x2e2925,
      roughness: 0.85,
      metalness: 0.02,
    });

    // Back Wall (z = -5.5) with cutout for window
    const backWallGroup = new THREE.Group();
    // Left section of the back wall; the window now occupies the right side.
    const bw1 = new THREE.Mesh(new THREE.BoxGeometry(3.6, 3.2, 0.1), wallMat);
    bw1.position.set(-1.7, 1.6, -5.5);
    bw1.receiveShadow = true;
    backWallGroup.add(bw1);

    // Below window
    const bw2 = new THREE.Mesh(new THREE.BoxGeometry(2.6, 0.75, 0.1), wallMat);
    bw2.position.set(1.4, 0.375, -5.5);
    bw2.receiveShadow = true;
    backWallGroup.add(bw2);

    // Above window
    const bw3 = new THREE.Mesh(new THREE.BoxGeometry(2.6, 0.65, 0.1), wallMat);
    bw3.position.set(1.4, 2.875, -5.5);
    bw3.receiveShadow = true;
    backWallGroup.add(bw3);

    // Right section of the back wall beside the window.
    const bw4 = new THREE.Mesh(new THREE.BoxGeometry(0.8, 3.2, 0.1), wallMat);
    bw4.position.set(3.1, 1.6, -5.5);
    bw4.receiveShadow = true;
    backWallGroup.add(bw4);

    this.group.add(backWallGroup);

    // Left Wall (x = -3.5)
    const leftWall = new THREE.Mesh(new THREE.BoxGeometry(0.1, 3.2, 7.5), wallMat);
    leftWall.position.set(-3.5, 1.6, -2);
    leftWall.receiveShadow = true;
    this.group.add(leftWall);

    // Right Wall (x = 3.5) with Doorway Opening
    const rightWall1 = new THREE.Mesh(new THREE.BoxGeometry(0.1, 3.2, 4.0), wallMat);
    rightWall1.position.set(3.5, 1.6, -0.5);
    rightWall1.receiveShadow = true;
    this.group.add(rightWall1);

    const rightWall2 = new THREE.Mesh(new THREE.BoxGeometry(0.1, 3.2, 1.5), wallMat);
    rightWall2.position.set(3.5, 1.6, -4.8);
    rightWall2.receiveShadow = true;
    this.group.add(rightWall2);

    const rightWallLintel = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.9, 1.4), wallMat);
    rightWallLintel.position.set(3.5, 2.75, -3.3);
    this.group.add(rightWallLintel);

    // Subtle Baseboards
    const baseboardMat = new THREE.MeshStandardMaterial({
      color: 0x1f1a16,
      roughness: 0.5,
    });
    const bbLeft = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.1, 7.4), baseboardMat);
    bbLeft.position.set(-3.45, 0.05, -2);
    this.group.add(bbLeft);

    const bbBack = new THREE.Mesh(new THREE.BoxGeometry(7.0, 0.1, 0.04), baseboardMat);
    bbBack.position.set(0, 0.05, -5.45);
    this.group.add(bbBack);
  }

  private buildWindowAndSkyline() {
    // Window opening: x from 0.1 to 2.7 (width 2.6m), y from 0.75 to 2.55 (height 1.8m)
    const windowFrameMat = new THREE.MeshStandardMaterial({
      color: 0x181512,
      roughness: 0.35,
      metalness: 0.6,
    });

    const windowGroup = new THREE.Group();
    windowGroup.position.set(1.4, 1.65, -5.5);

    // Outer & mullion frame
    const sill = new THREE.Mesh(new THREE.BoxGeometry(2.7, 0.08, 0.28), createWoodTexture(true).image ? new THREE.MeshStandardMaterial({ map: createWoodTexture(true), roughness: 0.4 }) : windowFrameMat);
    sill.position.set(0, -0.9, 0.05);
    windowGroup.add(sill);

    const frameTop = new THREE.Mesh(new THREE.BoxGeometry(2.65, 0.06, 0.12), windowFrameMat);
    frameTop.position.set(0, 0.9, 0);
    windowGroup.add(frameTop);

    const frameLeft = new THREE.Mesh(new THREE.BoxGeometry(0.06, 1.8, 0.12), windowFrameMat);
    frameLeft.position.set(-1.3, 0, 0);
    windowGroup.add(frameLeft);

    const frameRight = new THREE.Mesh(new THREE.BoxGeometry(0.06, 1.8, 0.12), windowFrameMat);
    frameRight.position.set(1.3, 0, 0);
    windowGroup.add(frameRight);

    const mullion = new THREE.Mesh(new THREE.BoxGeometry(0.04, 1.8, 0.08), windowFrameMat);
    mullion.position.set(0, 0, 0);
    windowGroup.add(mullion);

    // Glass pane with soft reflection
    const glassMat = new THREE.MeshPhysicalMaterial({
      color: 0x9bc2d4,
      transparent: true,
      opacity: 0.2,
      roughness: 0.05,
      metalness: 0.1,
      transmission: 0.75,
      ior: 1.5,
      depthWrite: false,
    });
    const glass = new THREE.Mesh(new THREE.PlaneGeometry(2.55, 1.75), glassMat);
    glass.position.set(0, 0, 0.01);
    windowGroup.add(glass);

    this.group.add(windowGroup);

    // 2046 Exterior Skyline Backdrop (large curved backdrop outside the window)
    const skyTexture = createSkylineTexture();
    const skyGeo = new THREE.CylinderGeometry(8, 8, 5, 32, 1, true, -Math.PI * 0.7, Math.PI * 0.8);
    const skyMat = new THREE.MeshBasicMaterial({
      map: skyTexture,
      side: THREE.BackSide,
      fog: false,
    });
    const skyMesh = new THREE.Mesh(skyGeo, skyMat);
    skyMesh.position.set(1.4, 2.0, -5.6);
    this.group.add(skyMesh);
  }

  private buildDeskAndSeating() {
    // Physical Desk in front of participant
    // User seated at (0, 1.15, 0.65). Desk positioned at (0, 0.74, 0)
    const deskGroup = new THREE.Group();
    deskGroup.position.set(0, 0, 0.05);

    const deskWood = createWoodTexture(false);
    const deskTopMat = new THREE.MeshStandardMaterial({
      map: deskWood,
      roughness: 0.35,
      metalness: 0.02,
    });

    // Solid beveled tabletop: width 1.7m, depth 0.85m, thickness 0.04m
    const topGeo = new THREE.BoxGeometry(1.7, 0.04, 0.85);
    const topMesh = new THREE.Mesh(topGeo, deskTopMat);
    topMesh.position.set(0, this.deskSurfaceY - 0.02, 0);
    topMesh.receiveShadow = true;
    topMesh.castShadow = true;
    deskGroup.add(topMesh);

    // Modern tapered architectural legs (brushed graphite / bronze)
    const legMat = new THREE.MeshStandardMaterial({
      color: 0x221e1c,
      roughness: 0.4,
      metalness: 0.75,
    });

    const legPositions = [
      [-0.78, -0.34],
      [0.78, -0.34],
      [-0.78, 0.34],
      [0.78, 0.34],
    ];

    legPositions.forEach(([x, z]) => {
      const legGeo = new THREE.CylinderGeometry(0.022, 0.018, this.deskSurfaceY - 0.04, 16);
      const leg = new THREE.Mesh(legGeo, legMat);
      leg.position.set(x, (this.deskSurfaceY - 0.04) / 2, z);
      leg.castShadow = true;
      deskGroup.add(leg);
    });

    // Desk modesty / structural under-panel
    const braceMat = new THREE.MeshStandardMaterial({ color: 0x1d1916, roughness: 0.6 });
    const brace = new THREE.Mesh(new THREE.BoxGeometry(1.5, 0.08, 0.03), braceMat);
    brace.position.set(0, this.deskSurfaceY - 0.08, -0.25);
    deskGroup.add(brace);

    // Modern Minimalist Arch Lamp on Desk (Left side)
    const lampGroup = new THREE.Group();
    lampGroup.position.set(-0.70, this.deskSurfaceY, -0.27);

    const lampBase = new THREE.Mesh(new THREE.CylinderGeometry(0.065, 0.07, 0.015, 24), legMat);
    lampBase.position.set(0, 0.0075, 0);
    lampGroup.add(lampBase);

    // Slender curved stem
    const stemCurve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(0, 0.015, 0),
      new THREE.Vector3(0, 0.35, 0),
      new THREE.Vector3(0.08, 0.42, 0.05),
      new THREE.Vector3(0.18, 0.38, 0.1),
    ]);
    const stemGeo = new THREE.TubeGeometry(stemCurve, 20, 0.006, 12, false);
    const stemMesh = new THREE.Mesh(stemGeo, legMat);
    lampGroup.add(stemMesh);

    // Warm lamp shade
    const shadeMat = new THREE.MeshStandardMaterial({
      color: 0xdfd4c4,
      roughness: 0.3,
    });
    const shade = new THREE.Mesh(new THREE.ConeGeometry(0.06, 0.07, 24), shadeMat);
    shade.position.set(0.18, 0.36, 0.1);
    shade.rotation.x = Math.PI * 0.95;
    lampGroup.add(shade);

    // Diffuser bulb with warm glow
    const bulbMat = new THREE.MeshBasicMaterial({ color: 0xffe6b8 });
    const bulb = new THREE.Mesh(new THREE.SphereGeometry(0.022, 16, 16), bulbMat);
    bulb.position.set(0.18, 0.34, 0.1);
    lampGroup.add(bulb);

    deskGroup.add(lampGroup);

    // Desk accessory: Slim ceramic pencil tray & minimal desk mat
    const matMat = new THREE.MeshStandardMaterial({
      color: 0x24201d,
      roughness: 0.9,
    });
    const deskMat = new THREE.Mesh(new THREE.BoxGeometry(0.85, 0.002, 0.45), matMat);
    deskMat.position.set(0, this.deskSurfaceY + 0.001, 0.05);
    deskMat.receiveShadow = true;
    deskGroup.add(deskMat);

    this.group.add(deskGroup);

    // Ergonomic Chair (visible armrests and contour framing the seated user's lower periphery)
    const chairGroup = new THREE.Group();
    chairGroup.position.set(0, 0, 0.72);

    const chairFabric = createFabricTexture('#322e2b', '#1f1c1a');
    const chairMat = new THREE.MeshStandardMaterial({
      map: chairFabric,
      roughness: 0.8,
    });

    // Seat cushion
    const seat = new THREE.Mesh(new THREE.BoxGeometry(0.62, 0.08, 0.58), chairMat);
    seat.position.set(0, 0.48, 0);
    chairGroup.add(seat);

    // Left armrest
    const armMat = new THREE.MeshStandardMaterial({ color: 0x1f1b18, roughness: 0.35, metalness: 0.4 });
    const armL = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.03, 0.32), armMat);
    armL.position.set(-0.35, 0.7, -0.05);
    chairGroup.add(armL);

    // Right armrest
    const armR = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.03, 0.32), armMat);
    armR.position.set(0.35, 0.7, -0.05);
    chairGroup.add(armR);

    // Arm supports
    [-0.35, 0.35].forEach(x => {
      const sup = new THREE.Mesh(new THREE.CylinderGeometry(0.015, 0.015, 0.22, 12), armMat);
      sup.position.set(x, 0.59, 0);
      chairGroup.add(sup);
    });

    this.group.add(chairGroup);
  }

  private buildBedAndNightstand() {
    const bedGroup = new THREE.Group();
    // Positioned along the back left, keeping the right-side route to the doorway clear.
    bedGroup.position.set(-1.7, 0, -3.8);

    const oakMat = new THREE.MeshStandardMaterial({
      map: createWoodTexture(false),
      roughness: 0.4,
    });

    // Wooden bed frame
    const frame = new THREE.Mesh(new THREE.BoxGeometry(2.1, 0.28, 2.3), oakMat);
    frame.position.set(0, 0.14, 0);
    frame.castShadow = true;
    frame.receiveShadow = true;
    bedGroup.add(frame);

    // Tall Fabric Upholstered Headboard
    const headboardFabric = createFabricTexture('#594f45', '#423a33');
    const headboardMat = new THREE.MeshStandardMaterial({
      map: headboardFabric,
      roughness: 0.85,
    });
    const headboard = new THREE.Mesh(new THREE.BoxGeometry(2.15, 1.15, 0.14), headboardMat);
    headboard.position.set(0, 0.68, -1.1);
    headboard.castShadow = true;
    bedGroup.add(headboard);

    // Mattress & Fitted Sheet
    const sheetMat = new THREE.MeshStandardMaterial({
      color: 0xede6de,
      roughness: 0.9,
    });
    const mattress = new THREE.Mesh(new THREE.BoxGeometry(1.95, 0.26, 2.15), sheetMat);
    mattress.position.set(0, 0.38, 0.02);
    mattress.castShadow = true;
    bedGroup.add(mattress);

    // Fluffy Textured Duvet (Natural linen folded back)
    const duvetFabric = createFabricTexture('#bfb5a8', '#9e9488');
    const duvetMat = new THREE.MeshStandardMaterial({
      map: duvetFabric,
      roughness: 0.9,
    });
    const duvet = new THREE.Mesh(new THREE.BoxGeometry(2.0, 0.2, 1.55), duvetMat);
    duvet.position.set(0, 0.49, 0.32);
    duvet.castShadow = true;
    bedGroup.add(duvet);

    // Two layered pillows
    const pillowGeo = new THREE.BoxGeometry(0.75, 0.16, 0.48);
    const p1 = new THREE.Mesh(pillowGeo, sheetMat);
    p1.position.set(-0.48, 0.54, -0.72);
    p1.rotation.x = -0.15;
    bedGroup.add(p1);

    const p2 = new THREE.Mesh(pillowGeo, sheetMat);
    p2.position.set(0.48, 0.54, -0.72);
    p2.rotation.x = -0.15;
    bedGroup.add(p2);

    // Bedside Nightstand
    const nightstand = new THREE.Mesh(new THREE.BoxGeometry(0.55, 0.52, 0.45), oakMat);
    nightstand.position.set(-1.38, 0.26, -0.9);
    nightstand.castShadow = true;
    bedGroup.add(nightstand);

    // Bedside Lamp with soft warm shade
    const lampMat = new THREE.MeshStandardMaterial({ color: 0xdfd3c3, roughness: 0.6 });
    const bedsideLamp = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.15, 0.28, 20), lampMat);
    bedsideLamp.position.set(-1.38, 0.66, -0.9);
    bedGroup.add(bedsideLamp);

    // Bedside soft warm point light
    const bedsideLight = new THREE.PointLight(0xffbe7b, 0.7, 4.0);
    bedsideLight.position.set(-1.38, 0.8, -0.9);
    bedGroup.add(bedsideLight);

    this.group.add(bedGroup);
  }

  private buildDoorway() {
    // Bedroom Doorway at right wall (x = 3.5, z = -3.3, width 1.2m, height 2.3m)
    const doorGroup = new THREE.Group();
    doorGroup.position.set(3.48, 0, -3.3);

    // Door Frame (Oak trim)
    const frameMat = new THREE.MeshStandardMaterial({
      map: createWoodTexture(true),
      roughness: 0.4,
    });
    const jambL = new THREE.Mesh(new THREE.BoxGeometry(0.12, 2.3, 0.08), frameMat);
    jambL.position.set(0, 1.15, -0.6);
    doorGroup.add(jambL);

    const jambR = new THREE.Mesh(new THREE.BoxGeometry(0.12, 2.3, 0.08), frameMat);
    jambR.position.set(0, 1.15, 0.6);
    doorGroup.add(jambR);

    const header = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.08, 1.28), frameMat);
    header.position.set(0, 2.3, 0);
    doorGroup.add(header);

    // Door slightly ajar (opening 35 degrees outward into hallway)
    const doorLeafMat = new THREE.MeshStandardMaterial({
      map: createWoodTexture(false),
      roughness: 0.4,
    });
    const doorLeaf = new THREE.Mesh(new THREE.BoxGeometry(0.04, 2.26, 1.15), doorLeafMat);
    doorLeaf.position.set(0.35, 1.14, 0.45);
    doorLeaf.rotation.y = -0.55; // opened into hallway
    doorGroup.add(doorLeaf);

    // Hallway beyond door: Warm floor and soft illuminated hallway wall
    const hallFloor = new THREE.Mesh(
      new THREE.PlaneGeometry(2.5, 3.0),
      new THREE.MeshStandardMaterial({ color: 0x3d3025, roughness: 0.4 })
    );
    hallFloor.rotation.x = -Math.PI / 2;
    hallFloor.position.set(1.5, 0.001, 0);
    doorGroup.add(hallFloor);

    // Hallway back wall
    const hallWall = new THREE.Mesh(
      new THREE.PlaneGeometry(3.0, 3.0),
      new THREE.MeshStandardMaterial({ color: 0x47382d, roughness: 0.7 })
    );
    hallWall.position.set(2.5, 1.5, 0);
    hallWall.rotation.y = -Math.PI / 2;
    doorGroup.add(hallWall);

    // Warm spill light from hallway (will illuminate Stage 3 path to doorway)
    this.doorSpillLight = new THREE.PointLight(0xffb86c, 0.85, 6.0);
    this.doorSpillLight.position.set(1.2, 1.8, 0);
    doorGroup.add(this.doorSpillLight);

    this.group.add(doorGroup);
  }

  private buildDecorAndPlant() {
    // Indoor Potted Plant (Monstera / Fiddle Leaf) in the corner near window
    const plantGroup = new THREE.Group();
    plantGroup.position.set(2.9, 0, -4.6);

    // Ceramic textured pot
    const potMat = new THREE.MeshStandardMaterial({
      color: 0xd6cbbd,
      roughness: 0.75,
      metalness: 0.05,
    });
    const pot = new THREE.Mesh(new THREE.CylinderGeometry(0.24, 0.18, 0.55, 20), potMat);
    pot.position.set(0, 0.275, 0);
    pot.castShadow = true;
    plantGroup.add(pot);

    // Dark soil
    const soilMat = new THREE.MeshStandardMaterial({ color: 0x1f1712, roughness: 0.95 });
    const soil = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.22, 0.05, 16), soilMat);
    soil.position.set(0, 0.52, 0);
    plantGroup.add(soil);

    // Organic foliage stems & leaves
    const leafMat = new THREE.MeshStandardMaterial({
      color: 0x274a2a,
      roughness: 0.35,
      side: THREE.DoubleSide,
    });
    const stemMat = new THREE.MeshStandardMaterial({ color: 0x1d3a1f, roughness: 0.5 });

    for (let i = 0; i < 9; i++) {
      const angle = (i / 9) * Math.PI * 2 + (Math.sin(i) * 0.3);
      const height = 0.5 + Math.random() * 0.7;
      const reach = 0.25 + Math.random() * 0.35;

      const stemCurve = new THREE.CatmullRomCurve3([
        new THREE.Vector3(0, 0.5, 0),
        new THREE.Vector3(Math.cos(angle) * 0.1, 0.5 + height * 0.5, Math.sin(angle) * 0.1),
        new THREE.Vector3(Math.cos(angle) * reach, 0.5 + height, Math.sin(angle) * reach),
      ]);
      const stemGeo = new THREE.TubeGeometry(stemCurve, 12, 0.008, 8, false);
      const stem = new THREE.Mesh(stemGeo, stemMat);
      plantGroup.add(stem);

      // Large broad leaf at stem tip
      const leafGeo = new THREE.SphereGeometry(0.18, 12, 8);
      leafGeo.scale(1.0, 0.05, 1.8);
      const leaf = new THREE.Mesh(leafGeo, leafMat);
      leaf.position.set(Math.cos(angle) * reach, 0.5 + height, Math.sin(angle) * reach);
      leaf.rotation.set(Math.sin(angle) * 0.5, angle, Math.cos(angle) * 0.4);
      leaf.castShadow = true;
      plantGroup.add(leaf);
    }

    this.group.add(plantGroup);

    // Minimalist Art Frame on Left Wall
    const artGroup = new THREE.Group();
    artGroup.position.set(-3.43, 1.7, -1.8);
    artGroup.rotation.y = Math.PI / 2;

    const frameMat = new THREE.MeshStandardMaterial({ color: 0x1a1614, roughness: 0.5 });
    const artFrame = new THREE.Mesh(new THREE.BoxGeometry(1.2, 0.9, 0.03), frameMat);
    artGroup.add(artFrame);

    // Abstract calming gradient print
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 384;
    const ctx = canvas.getContext('2d')!;
    const grad = ctx.createLinearGradient(0, 0, 512, 384);
    grad.addColorStop(0, '#36343b');
    grad.addColorStop(0.5, '#735848');
    grad.addColorStop(1, '#b89274');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 512, 384);
    ctx.fillStyle = 'rgba(255, 245, 235, 0.15)';
    ctx.beginPath();
    ctx.arc(256, 192, 120, 0, Math.PI * 2);
    ctx.fill();

    const artTex = new THREE.CanvasTexture(canvas);
    artTex.colorSpace = THREE.SRGBColorSpace;
    const artCanvas = new THREE.Mesh(
      new THREE.PlaneGeometry(1.1, 0.8),
      new THREE.MeshBasicMaterial({ map: artTex })
    );
    artCanvas.position.set(0, 0, 0.018);
    artGroup.add(artCanvas);

    this.group.add(artGroup);
  }

  private buildWaterGlass() {
    // Glass of water on desk for Stage 3 dissolution ritual
    // Positioned at the far-left side of the tabletop, away from the seated participant.
    const glassGroup = new THREE.Group();
    glassGroup.position.set(-0.5, this.deskSurfaceY, -0.2);

    // Physical Glass Material
    const glassMat = new THREE.MeshPhysicalMaterial({
      color: 0xffffff,
      transmission: 0.94,
      opacity: 1.0,
      transparent: true,
      roughness: 0.04,
      ior: 1.52,
      thickness: 0.06,
      depthWrite: false,
    });

    // Cylindrical thin glass beaker / tumbler
    const glassGeo = new THREE.CylinderGeometry(0.042, 0.038, 0.12, 32, 1, true);
    this.waterGlassMesh = new THREE.Mesh(glassGeo, glassMat);
    this.waterGlassMesh.position.set(0, 0.06, 0);
    this.waterGlassMesh.castShadow = true;
    glassGroup.add(this.waterGlassMesh);

    // Glass Base
    const baseGeo = new THREE.CylinderGeometry(0.038, 0.038, 0.008, 32);
    const baseMesh = new THREE.Mesh(baseGeo, glassMat);
    baseMesh.position.set(0, 0.004, 0);
    glassGroup.add(baseMesh);

    // Realistic Water Liquid inside glass
    const waterMat = new THREE.MeshPhysicalMaterial({
      color: 0x9ed1e8,
      transmission: 0.88,
      opacity: 0.85,
      transparent: true,
      roughness: 0.02,
      ior: 1.33,
      thickness: 0.08,
      depthWrite: false,
    });
    const waterGeo = new THREE.CylinderGeometry(0.04, 0.037, 0.085, 32);
    this.waterLiquidMesh = new THREE.Mesh(waterGeo, waterMat);
    this.waterLiquidMesh.position.set(0, 0.046, 0);
    glassGroup.add(this.waterLiquidMesh);

    // Water surface meniscus
    const meniscusGeo = new THREE.CircleGeometry(0.04, 32);
    const meniscusMesh = new THREE.Mesh(meniscusGeo, waterMat);
    meniscusMesh.rotation.x = -Math.PI / 2;
    meniscusMesh.position.set(0, 0.088, 0);
    glassGroup.add(meniscusMesh);

    this.group.add(glassGroup);
  }

  private setupLighting() {
    // 1. Ambient hemisphere light (twilight sky above, warm floor bounce below)
    this.roomAmbientLight = new THREE.HemisphereLight(0x7688a4, 0x3d291d, 0.55);
    this.group.add(this.roomAmbientLight);

    // 2. Window directional light (soft evening light through window)
    this.windowLight = new THREE.DirectionalLight(0xd98656, 0.8);
    this.windowLight.position.set(2.5, 2.5, -5.5);
    this.windowLight.target.position.set(0, 0.8, -1.0);
    this.windowLight.castShadow = true;
    this.windowLight.shadow.mapSize.width = 1024;
    this.windowLight.shadow.mapSize.height = 1024;
    this.windowLight.shadow.bias = -0.0005;
    this.windowLight.shadow.normalBias = 0.02;
    this.group.add(this.windowLight);
    this.group.add(this.windowLight.target);

    // 3. Desk Lamp Practical Light (warm task illumination over desk)
    this.deskLampLight = new THREE.PointLight(0xffe2b3, 0.9, 3.2, 1.8);
    this.deskLampLight.position.set(-0.52, this.deskSurfaceY + 0.35, -0.17);
    this.deskLampLight.castShadow = true;
    this.deskLampLight.shadow.mapSize.width = 1024;
    this.deskLampLight.shadow.mapSize.height = 1024;
    this.deskLampLight.shadow.bias = -0.0002;
    this.group.add(this.deskLampLight);
  }

  /**
   * Adjust atmosphere for Stage 2 & 3 (gradually warmer, calmer dusk)
   */
  public setAtmosphereTransition(progress: number) {
    // progress: 0 (Day/Work) to 1 (Evening Relaxation)
    // Shift ambient to deeper warm tones
    this.roomAmbientLight.color.lerpColors(new THREE.Color(0x7688a4), new THREE.Color(0x4a4362), progress);
    this.roomAmbientLight.groundColor.lerpColors(new THREE.Color(0x3d291d), new THREE.Color(0x523221), progress);
    this.roomAmbientLight.intensity = THREE.MathUtils.lerp(0.55, 0.42, progress);

    // Window light warms to deep twilight
    this.windowLight.color.lerpColors(new THREE.Color(0xd98656), new THREE.Color(0x9a4e32), progress);
    this.windowLight.intensity = THREE.MathUtils.lerp(0.8, 0.35, progress);

    // Desk lamp stays warm and intimate
    this.deskLampLight.color.lerpColors(new THREE.Color(0xffe2b3), new THREE.Color(0xffc988), progress);
    this.deskLampLight.intensity = THREE.MathUtils.lerp(0.9, 1.15, progress);

    // Doorway spill warms invitingly
    this.doorSpillLight.intensity = THREE.MathUtils.lerp(0.85, 1.35, progress);
  }
}

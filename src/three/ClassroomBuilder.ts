import * as THREE from 'three';
import { TextureGenerator } from './TextureGenerator';

export class ClassroomBuilder {
  /**
   * Builds the entire 3D architectural shell and furniture of the classroom
   */
  static buildClassroom(scene: THREE.Scene): {
    globeMesh?: THREE.Mesh;
    clockSecondHand?: THREE.Mesh;
    plantLeaves: THREE.Mesh[];
  } {
    const plantLeaves: THREE.Mesh[] = [];
    let globeMesh: THREE.Mesh | undefined;
    let clockSecondHand: THREE.Mesh | undefined;

    // Dimensions: Room is 24m wide (X: -12 to 12), 24m long (Z: -12 to 12), 6.5m high (Y: 0 to 6.5)
    const ROOM_WIDTH = 24;
    const ROOM_LENGTH = 24;
    const ROOM_HEIGHT = 6.5;

    // Materials Palette (Modern Pastel Blue & Calming Wood Elementary Style)
    const floorTexture = TextureGenerator.createFloorTexture();
    const floorMat = new THREE.MeshStandardMaterial({
      map: floorTexture,
      roughness: 0.25,
      metalness: 0.05,
    });

    const ceilingMat = new THREE.MeshStandardMaterial({
      color: 0xf8fafc,
      roughness: 0.8,
    });

    const frontWallMat = new THREE.MeshStandardMaterial({
      color: 0xe0f2fe, // Soft baby sky blue
      roughness: 0.6,
    });

    const accentBlueMat = new THREE.MeshStandardMaterial({
      color: 0x0284c7, // Deep vibrant educational blue
      roughness: 0.35,
      metalness: 0.1,
    });

    const woodTrimMat = new THREE.MeshStandardMaterial({
      color: 0xb45309, // Warm oak
      roughness: 0.4,
    });

    const generalWallMat = new THREE.MeshStandardMaterial({
      color: 0xf1f5f9, // Clean off-white
      roughness: 0.7,
    });

    const glassMat = new THREE.MeshPhysicalMaterial({
      color: 0xffffff,
      transmission: 0.9,
      opacity: 0.35,
      transparent: true,
      roughness: 0.1,
      ior: 1.5,
    });

    // 1. FLOOR
    const floorGeo = new THREE.PlaneGeometry(ROOM_WIDTH, ROOM_LENGTH);
    const floor = new THREE.Mesh(floorGeo, floorMat);
    floor.rotation.x = -Math.PI / 2;
    floor.position.y = 0;
    floor.receiveShadow = true;
    scene.add(floor);

    // 2. CEILING
    const ceilingGeo = new THREE.PlaneGeometry(ROOM_WIDTH, ROOM_LENGTH);
    const ceiling = new THREE.Mesh(ceilingGeo, ceilingMat);
    ceiling.rotation.x = Math.PI / 2;
    ceiling.position.y = ROOM_HEIGHT;
    scene.add(ceiling);

    // Ceiling beams & recessed LED panels
    const beamGeo = new THREE.BoxGeometry(0.3, 0.25, ROOM_LENGTH);
    const beamMat = new THREE.MeshStandardMaterial({ color: 0x38bdf8, roughness: 0.5 });
    for (const bx of [-6, 0, 6]) {
      const beam = new THREE.Mesh(beamGeo, beamMat);
      beam.position.set(bx, ROOM_HEIGHT - 0.12, 0);
      scene.add(beam);
    }

    // Modern LED light panel fixtures
    const ledPanelGeo = new THREE.BoxGeometry(1.8, 0.08, 1.8);
    const ledMat = new THREE.MeshStandardMaterial({
      color: 0xffffff,
      emissive: 0xffffff,
      emissiveIntensity: 0.6,
      roughness: 0.2,
    });
    for (const lx of [-6, 0, 6]) {
      for (const lz of [-6, 0, 6]) {
        const led = new THREE.Mesh(ledPanelGeo, ledMat);
        led.position.set(lx, ROOM_HEIGHT - 0.05, lz);
        scene.add(led);

        // Soft downward point lights
        const point = new THREE.PointLight(0xf0f9ff, 0.35, 12, 1.5);
        point.position.set(lx, ROOM_HEIGHT - 0.4, lz);
        scene.add(point);
      }
    }

    // 3. FRONT WALL (Z = -12)
    const frontWallGroup = new THREE.Group();
    const frontWallBase = new THREE.Mesh(
      new THREE.PlaneGeometry(ROOM_WIDTH, ROOM_HEIGHT),
      frontWallMat
    );
    frontWallBase.position.set(0, ROOM_HEIGHT / 2, -ROOM_LENGTH / 2);
    frontWallGroup.add(frontWallBase);

    // Decorative center accent board backdrop
    const centerPanel = new THREE.Mesh(
      new THREE.BoxGeometry(16, 5.2, 0.1),
      accentBlueMat
    );
    centerPanel.position.set(0, 3.6, -ROOM_LENGTH / 2 + 0.06);
    frontWallGroup.add(centerPanel);

    // Vertical wood slats on sides of front wall
    const slatGeo = new THREE.BoxGeometry(0.1, 5.0, 0.08);
    for (let x = -10.5; x <= -8.5; x += 0.25) {
      const slat = new THREE.Mesh(slatGeo, woodTrimMat);
      slat.position.set(x, 3.5, -ROOM_LENGTH / 2 + 0.06);
      frontWallGroup.add(slat);
    }
    for (let x = 8.5; x <= 10.5; x += 0.25) {
      const slat = new THREE.Mesh(slatGeo, woodTrimMat);
      slat.position.set(x, 3.5, -ROOM_LENGTH / 2 + 0.06);
      frontWallGroup.add(slat);
    }

    // Front Wall Title Banner Plaque
    const bannerCanvas = document.createElement('canvas');
    bannerCanvas.width = 1024;
    bannerCanvas.height = 128;
    const bCtx = bannerCanvas.getContext('2d')!;
    bCtx.fillStyle = '#0284c7';
    bCtx.fillRect(0, 0, 1024, 128);
    bCtx.strokeStyle = '#38bdf8';
    bCtx.lineWidth = 4;
    bCtx.strokeRect(4, 4, 1016, 120);
    bCtx.fillStyle = '#ffffff';
    bCtx.font = 'bold 44px system-ui, sans-serif';
    bCtx.textAlign = 'center';
    bCtx.fillText('★ LỚP HỌC ẢO 3D – GIÁO VIÊN SÁNG TẠO ★', 512, 80);
    const bannerTex = new THREE.CanvasTexture(bannerCanvas);
    bannerTex.colorSpace = THREE.SRGBColorSpace;
    const bannerMesh = new THREE.Mesh(
      new THREE.PlaneGeometry(6.5, 0.8),
      new THREE.MeshStandardMaterial({ map: bannerTex, roughness: 0.3 })
    );
    bannerMesh.position.set(0, 6.0, -ROOM_LENGTH / 2 + 0.12);
    frontWallGroup.add(bannerMesh);

    // Analog classroom wall clock
    const clockGroup = new THREE.Group();
    clockGroup.position.set(-6.5, 5.6, -ROOM_LENGTH / 2 + 0.1);
    const clockFace = new THREE.Mesh(
      new THREE.CylinderGeometry(0.5, 0.5, 0.06, 32),
      new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.2 })
    );
    clockFace.rotation.x = Math.PI / 2;
    clockGroup.add(clockFace);
    const clockFrame = new THREE.Mesh(
      new THREE.TorusGeometry(0.5, 0.04, 16, 32),
      new THREE.MeshStandardMaterial({ color: 0x0284c7, metalness: 0.8, roughness: 0.2 })
    );
    clockGroup.add(clockFrame);
    // Hands
    const hourHand = new THREE.Mesh(
      new THREE.BoxGeometry(0.04, 0.25, 0.02),
      new THREE.MeshStandardMaterial({ color: 0x0f172a })
    );
    hourHand.position.set(0.08, 0.08, 0.04);
    hourHand.rotation.z = -Math.PI / 4;
    clockGroup.add(hourHand);
    const minHand = new THREE.Mesh(
      new THREE.BoxGeometry(0.03, 0.35, 0.02),
      new THREE.MeshStandardMaterial({ color: 0x0f172a })
    );
    minHand.position.set(0, 0.15, 0.045);
    clockGroup.add(minHand);
    clockSecondHand = new THREE.Mesh(
      new THREE.BoxGeometry(0.015, 0.38, 0.02),
      new THREE.MeshStandardMaterial({ color: 0xef4444 })
    );
    clockSecondHand.position.set(0, 0.12, 0.05);
    clockGroup.add(clockSecondHand);
    frontWallGroup.add(clockGroup);

    scene.add(frontWallGroup);

    // 4. BACK WALL (Z = +12) - INTERACTIVE GAMES ARENA
    const backWallGroup = new THREE.Group();
    const backWall = new THREE.Mesh(
      new THREE.PlaneGeometry(ROOM_WIDTH, ROOM_HEIGHT),
      new THREE.MeshStandardMaterial({ color: 0x1e1b4b, roughness: 0.7 }) // Indigo game backdrop
    );
    backWall.rotation.y = Math.PI;
    backWall.position.set(0, ROOM_HEIGHT / 2, ROOM_LENGTH / 2);
    backWallGroup.add(backWall);

    // Back wall banner for interactive games
    const gameBannerCanvas = document.createElement('canvas');
    gameBannerCanvas.width = 1024;
    gameBannerCanvas.height = 128;
    const gbCtx = gameBannerCanvas.getContext('2d')!;
    gbCtx.fillStyle = '#312e81';
    gbCtx.fillRect(0, 0, 1024, 128);
    gbCtx.strokeStyle = '#818cf8';
    gbCtx.lineWidth = 4;
    gbCtx.strokeRect(4, 4, 1016, 120);
    gbCtx.fillStyle = '#ffffff';
    gbCtx.font = 'bold 44px system-ui, sans-serif';
    gbCtx.textAlign = 'center';
    gbCtx.fillText('🎮 KHU VỰC TRÒ CHƠI TƯƠNG TÁC 🎮', 512, 80);
    const gameBannerTex = new THREE.CanvasTexture(gameBannerCanvas);
    gameBannerTex.colorSpace = THREE.SRGBColorSpace;
    const gameBannerMesh = new THREE.Mesh(
      new THREE.PlaneGeometry(8.0, 0.9),
      new THREE.MeshStandardMaterial({ map: gameBannerTex, roughness: 0.3 })
    );
    gameBannerMesh.rotation.y = Math.PI;
    gameBannerMesh.position.set(0, 5.8, ROOM_LENGTH / 2 - 0.08);
    backWallGroup.add(gameBannerMesh);

    scene.add(backWallGroup);

    // 5. LEFT WALL (X = -12) - IMAGE GALLERY & SUNNY WINDOWS
    const leftWallGroup = new THREE.Group();
    // Solid gallery wall part (Z = -12 to 2)
    const galleryWallPart = new THREE.Mesh(
      new THREE.PlaneGeometry(14, ROOM_HEIGHT),
      generalWallMat
    );
    galleryWallPart.rotation.y = Math.PI / 2;
    galleryWallPart.position.set(-ROOM_WIDTH / 2, ROOM_HEIGHT / 2, -5);
    leftWallGroup.add(galleryWallPart);

    // Gallery Zone Plaque
    const galCanvas = document.createElement('canvas');
    galCanvas.width = 512;
    galCanvas.height = 96;
    const gCtx = galCanvas.getContext('2d')!;
    gCtx.fillStyle = '#0284c7';
    gCtx.fillRect(0, 0, 512, 96);
    gCtx.fillStyle = '#ffffff';
    gCtx.font = 'bold 36px system-ui, sans-serif';
    gCtx.textAlign = 'center';
    gCtx.fillText('🖼️ KHO HÌNH ẢNH 3D', 256, 60);
    const galTex = new THREE.CanvasTexture(galCanvas);
    galTex.colorSpace = THREE.SRGBColorSpace;
    const galPlaque = new THREE.Mesh(
      new THREE.PlaneGeometry(3.6, 0.65),
      new THREE.MeshStandardMaterial({ map: galTex, roughness: 0.3 })
    );
    galPlaque.rotation.y = Math.PI / 2;
    galPlaque.position.set(-ROOM_WIDTH / 2 + 0.06, 5.6, -3.5);
    leftWallGroup.add(galPlaque);

    // Window Part (Z = 2 to 12) looking outside to garden
    const windowFrameGeo = new THREE.BoxGeometry(0.2, ROOM_HEIGHT, 0.2);
    const windowFrameMat = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.3 });

    // Outdoor garden backdrop plane
    const gardenTex = TextureGenerator.createGardenBackdrop();
    const gardenPlane = new THREE.Mesh(
      new THREE.PlaneGeometry(14, 8),
      new THREE.MeshBasicMaterial({ map: gardenTex })
    );
    gardenPlane.rotation.y = Math.PI / 2;
    gardenPlane.position.set(-ROOM_WIDTH / 2 - 1.2, 3.5, 7);
    scene.add(gardenPlane);

    // Glass panes & window dividers
    const windowGlass = new THREE.Mesh(
      new THREE.PlaneGeometry(10, 4.5),
      glassMat
    );
    windowGlass.rotation.y = Math.PI / 2;
    windowGlass.position.set(-ROOM_WIDTH / 2, 3.2, 7);
    leftWallGroup.add(windowGlass);

    // Window lower wall ledge
    const windowLowerWall = new THREE.Mesh(
      new THREE.PlaneGeometry(10, 1.2),
      generalWallMat
    );
    windowLowerWall.rotation.y = Math.PI / 2;
    windowLowerWall.position.set(-ROOM_WIDTH / 2, 0.6, 7);
    leftWallGroup.add(windowLowerWall);

    scene.add(leftWallGroup);

    // 6. RIGHT WALL (X = +12) - DIGITAL MATERIALS & VIDEO CINEMA
    const rightWallGroup = new THREE.Group();
    const rightWall = new THREE.Mesh(
      new THREE.PlaneGeometry(ROOM_WIDTH, ROOM_HEIGHT),
      generalWallMat
    );
    rightWall.rotation.y = -Math.PI / 2;
    rightWall.position.set(ROOM_WIDTH / 2, ROOM_HEIGHT / 2, 0);
    rightWallGroup.add(rightWall);

    // Right wall zone title plaques
    // Materials zone plaque
    const matCanvas = document.createElement('canvas');
    matCanvas.width = 512;
    matCanvas.height = 96;
    const mCtx = matCanvas.getContext('2d')!;
    mCtx.fillStyle = '#0f766e';
    mCtx.fillRect(0, 0, 512, 96);
    mCtx.fillStyle = '#ffffff';
    mCtx.font = 'bold 36px system-ui, sans-serif';
    mCtx.textAlign = 'center';
    mCtx.fillText('📚 HỌC LIỆU SỐ', 256, 60);
    const matTex = new THREE.CanvasTexture(matCanvas);
    matTex.colorSpace = THREE.SRGBColorSpace;
    const matPlaque = new THREE.Mesh(
      new THREE.PlaneGeometry(3.6, 0.65),
      new THREE.MeshStandardMaterial({ map: matTex, roughness: 0.3 })
    );
    matPlaque.rotation.y = -Math.PI / 2;
    matPlaque.position.set(ROOM_WIDTH / 2 - 0.06, 5.6, -4.0);
    rightWallGroup.add(matPlaque);

    // Cinema zone plaque
    const cinCanvas = document.createElement('canvas');
    cinCanvas.width = 512;
    cinCanvas.height = 96;
    const cCtx = cinCanvas.getContext('2d')!;
    cCtx.fillStyle = '#7e22ce';
    cCtx.fillRect(0, 0, 512, 96);
    cCtx.fillStyle = '#ffffff';
    cCtx.font = 'bold 36px system-ui, sans-serif';
    cCtx.textAlign = 'center';
    cCtx.fillText('🎬 RẠP CHIẾU VIDEO', 256, 60);
    const cinTex = new THREE.CanvasTexture(cinCanvas);
    cinTex.colorSpace = THREE.SRGBColorSpace;
    const cinPlaque = new THREE.Mesh(
      new THREE.PlaneGeometry(3.6, 0.65),
      new THREE.MeshStandardMaterial({ map: cinTex, roughness: 0.3 })
    );
    cinPlaque.rotation.y = -Math.PI / 2;
    cinPlaque.position.set(ROOM_WIDTH / 2 - 0.06, 5.6, 5.5);
    rightWallGroup.add(cinPlaque);

    scene.add(rightWallGroup);

    // ==========================================
    // 7. COMPOSITE PROCEDURAL FURNITURE
    // ==========================================

    // A. TEACHER PODIUM (Platform + Podium + Laptop + Mic)
    const podiumGroup = new THREE.Group();
    podiumGroup.position.set(0, 0, -8.8);

    // Elevated wooden platform (2-tier)
    const platBase = new THREE.Mesh(
      new THREE.BoxGeometry(4.8, 0.2, 3.2),
      new THREE.MeshStandardMaterial({ color: 0x78350f, roughness: 0.4 })
    );
    platBase.position.set(0, 0.1, 0);
    platBase.receiveShadow = true;
    podiumGroup.add(platBase);

    // Podium lecture stand
    const standBody = new THREE.Mesh(
      new THREE.BoxGeometry(1.6, 1.25, 0.9),
      new THREE.MeshStandardMaterial({ color: 0x0284c7, roughness: 0.3 })
    );
    standBody.position.set(0, 0.8, -0.2);
    standBody.castShadow = true;
    podiumGroup.add(standBody);

    const deskTop = new THREE.Mesh(
      new THREE.BoxGeometry(1.9, 0.08, 1.1),
      new THREE.MeshStandardMaterial({ color: 0xfde047, roughness: 0.3 })
    );
    deskTop.position.set(0, 1.45, -0.2);
    deskTop.rotation.x = -0.1;
    podiumGroup.add(deskTop);

    // Laptop on podium
    const laptopBase = new THREE.Mesh(
      new THREE.BoxGeometry(0.42, 0.02, 0.3),
      new THREE.MeshStandardMaterial({ color: 0x94a3b8, metalness: 0.8, roughness: 0.2 })
    );
    laptopBase.position.set(0, 1.48, -0.2);
    laptopBase.rotation.x = -0.1;
    podiumGroup.add(laptopBase);

    const laptopScreen = new THREE.Mesh(
      new THREE.BoxGeometry(0.42, 0.28, 0.02),
      new THREE.MeshStandardMaterial({
        color: 0x38bdf8,
        emissive: 0x38bdf8,
        emissiveIntensity: 0.4,
        roughness: 0.2,
      })
    );
    laptopScreen.position.set(0, 1.62, -0.32);
    laptopScreen.rotation.x = 0.25;
    podiumGroup.add(laptopScreen);

    // Gooseneck microphone
    const micStem = new THREE.Mesh(
      new THREE.CylinderGeometry(0.015, 0.015, 0.35, 8),
      new THREE.MeshStandardMaterial({ color: 0x1e293b, metalness: 0.9, roughness: 0.1 })
    );
    micStem.position.set(0.5, 1.6, -0.2);
    micStem.rotation.z = -0.3;
    podiumGroup.add(micStem);

    const micHead = new THREE.Mesh(
      new THREE.SphereGeometry(0.035, 12, 12),
      new THREE.MeshStandardMaterial({ color: 0x475569, metalness: 0.7, roughness: 0.4 })
    );
    micHead.position.set(0.4, 1.75, -0.2);
    podiumGroup.add(micHead);

    scene.add(podiumGroup);

    // B. STUDENT DESKS & CHAIRS (6 neat pairs with cute colors)
    const deskGroup = new THREE.Group();
    const deskTopMat = new THREE.MeshStandardMaterial({ color: 0xfef08a, roughness: 0.3 }); // Gentle warm yellow wood
    const deskLegMat = new THREE.MeshStandardMaterial({ color: 0x38bdf8, roughness: 0.4 }); // Sky blue metal
    const chairMat = new THREE.MeshStandardMaterial({ color: 0x34d399, roughness: 0.4 }); // Cute mint green

    const createStudentDeskSet = (x: number, z: number) => {
      const setGroup = new THREE.Group();
      setGroup.position.set(x, 0, z);

      // Desk tabletop (curved corners via rounded box)
      const top = new THREE.Mesh(
        new THREE.BoxGeometry(1.6, 0.06, 0.8),
        deskTopMat
      );
      top.position.set(0, 0.95, 0);
      top.castShadow = true;
      top.receiveShadow = true;
      setGroup.add(top);

      // Book storage shelf under desk
      const underShelf = new THREE.Mesh(
        new THREE.BoxGeometry(1.4, 0.04, 0.65),
        new THREE.MeshStandardMaterial({ color: 0xe2e8f0, roughness: 0.5 })
      );
      underShelf.position.set(0, 0.75, 0);
      setGroup.add(underShelf);

      // 4 Desk legs
      const legGeo = new THREE.CylinderGeometry(0.03, 0.03, 0.95, 12);
      for (const lx of [-0.7, 0.7]) {
        for (const lz of [-0.32, 0.32]) {
          const leg = new THREE.Mesh(legGeo, deskLegMat);
          leg.position.set(lx, 0.475, lz);
          leg.castShadow = true;
          setGroup.add(leg);
        }
      }

      // 2 Student Chairs per desk
      for (const cx of [-0.45, 0.45]) {
        const chair = new THREE.Group();
        chair.position.set(cx, 0, 0.65);

        // Chair seat
        const seat = new THREE.Mesh(
          new THREE.BoxGeometry(0.5, 0.05, 0.5),
          chairMat
        );
        seat.position.set(0, 0.55, 0);
        seat.castShadow = true;
        chair.add(seat);

        // Chair backrest
        const back = new THREE.Mesh(
          new THREE.BoxGeometry(0.5, 0.35, 0.04),
          chairMat
        );
        back.position.set(0, 0.85, 0.22);
        chair.add(back);

        // Chair legs (4)
        const chairLegGeo = new THREE.CylinderGeometry(0.02, 0.02, 0.55, 8);
        for (const clx of [-0.2, 0.2]) {
          for (const clz of [-0.2, 0.2]) {
            const cl = new THREE.Mesh(chairLegGeo, deskLegMat);
            cl.position.set(clx, 0.275, clz);
            chair.add(cl);
          }
        }

        setGroup.add(chair);
      }

      // Small cute pencil holder on desk
      const holder = new THREE.Mesh(
        new THREE.CylinderGeometry(0.05, 0.05, 0.12, 16),
        new THREE.MeshStandardMaterial({ color: 0xf43f5e })
      );
      holder.position.set(0.6, 1.03, -0.2);
      setGroup.add(holder);

      return setGroup;
    };

    // Place 2 columns of 3 desks
    const deskRows = [-4.5, -0.5, 3.5];
    for (const r of deskRows) {
      deskGroup.add(createStudentDeskSet(-4.2, r));
      deskGroup.add(createStudentDeskSet(4.2, r));
    }
    scene.add(deskGroup);

    // C. BOOKSHELVES WITH COLORFUL PROCEDURAL 3D BOOKS
    const shelfGroup = new THREE.Group();
    shelfGroup.position.set(11.2, 0, -4.0);
    shelfGroup.rotation.y = -Math.PI / 2;

    const shelfFrame = new THREE.Mesh(
      new THREE.BoxGeometry(3.6, 3.8, 0.6),
      woodTrimMat
    );
    shelfFrame.position.set(0, 1.9, 0);
    shelfFrame.castShadow = true;
    shelfGroup.add(shelfFrame);

    // Empty hollow interior
    const hollow = new THREE.Mesh(
      new THREE.BoxGeometry(3.3, 3.5, 0.55),
      new THREE.MeshStandardMaterial({ color: 0x451a03, roughness: 0.6 })
    );
    hollow.position.set(0, 1.9, 0.05);
    shelfGroup.add(hollow);

    // Shelf dividers (3 tiers)
    for (const sy of [1.1, 2.0, 2.9]) {
      const plank = new THREE.Mesh(
        new THREE.BoxGeometry(3.3, 0.06, 0.5),
        woodTrimMat
      );
      plank.position.set(0, sy, 0.05);
      shelfGroup.add(plank);

      // Place books on each shelf tier
      const bookColors = [0xef4444, 0x3b82f6, 0x10b981, 0xf59e0b, 0x8b5cf6, 0xec4899];
      let bx = -1.4;
      while (bx < 1.3) {
        const bookH = 0.35 + Math.random() * 0.2;
        const bookW = 0.05 + Math.random() * 0.04;
        const bookD = 0.32;
        const col = bookColors[Math.floor(Math.random() * bookColors.length)];
        const book = new THREE.Mesh(
          new THREE.BoxGeometry(bookW, bookH, bookD),
          new THREE.MeshStandardMaterial({ color: col, roughness: 0.4 })
        );
        book.position.set(bx, sy + bookH / 2 + 0.03, 0.05);
        shelfGroup.add(book);
        bx += bookW + 0.02;
      }
    }

    // Rotating 3D Globe on top of bookshelf
    const globeGroup = new THREE.Group();
    globeGroup.position.set(-0.8, 4.2, 0);
    const globeStand = new THREE.Mesh(
      new THREE.CylinderGeometry(0.18, 0.22, 0.08, 16),
      new THREE.MeshStandardMaterial({ color: 0xd97706, metalness: 0.8, roughness: 0.2 })
    );
    globeGroup.add(globeStand);

    const globeRing = new THREE.Mesh(
      new THREE.TorusGeometry(0.38, 0.025, 12, 32, Math.PI),
      new THREE.MeshStandardMaterial({ color: 0xd97706, metalness: 0.8, roughness: 0.2 })
    );
    globeRing.position.set(0, 0.4, 0);
    globeRing.rotation.z = Math.PI / 2;
    globeGroup.add(globeRing);

    const globeTex = TextureGenerator.createGlobeTexture();
    globeMesh = new THREE.Mesh(
      new THREE.SphereGeometry(0.32, 32, 32),
      new THREE.MeshStandardMaterial({ map: globeTex, roughness: 0.3 })
    );
    globeMesh.position.set(0, 0.4, 0);
    globeMesh.rotation.z = 0.35; // Earth axial tilt
    globeGroup.add(globeMesh);
    shelfGroup.add(globeGroup);

    scene.add(shelfGroup);

    // D. POTTED PLANTS (Classroom greenery with cute stylized leaves)
    const createPottedPlant = (x: number, z: number) => {
      const plantGroup = new THREE.Group();
      plantGroup.position.set(x, 0, z);

      // Ceramic Pot
      const pot = new THREE.Mesh(
        new THREE.CylinderGeometry(0.35, 0.25, 0.6, 24),
        new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.2 })
      );
      pot.position.set(0, 0.3, 0);
      pot.castShadow = true;
      plantGroup.add(pot);

      // Soil
      const soil = new THREE.Mesh(
        new THREE.CylinderGeometry(0.33, 0.33, 0.05, 24),
        new THREE.MeshStandardMaterial({ color: 0x3f2e1e, roughness: 0.9 })
      );
      soil.position.set(0, 0.58, 0);
      plantGroup.add(soil);

      // Plant Leaves (5-8 leaves fanning out)
      const leafGeo = new THREE.SphereGeometry(0.25, 8, 8);
      leafGeo.scale(0.3, 1.2, 0.1);
      const leafMat = new THREE.MeshStandardMaterial({
        color: 0x22c55e,
        roughness: 0.35,
      });

      for (let i = 0; i < 7; i++) {
        const leaf = new THREE.Mesh(leafGeo, leafMat);
        const angle = (i / 7) * Math.PI * 2;
        leaf.position.set(Math.cos(angle) * 0.15, 0.75, Math.sin(angle) * 0.15);
        leaf.rotation.x = Math.sin(angle) * 0.5;
        leaf.rotation.z = -Math.cos(angle) * 0.5;
        plantGroup.add(leaf);
        plantLeaves.push(leaf);
      }

      return plantGroup;
    };

    // Place plants in corners and near podium
    scene.add(createPottedPlant(-3.2, -10.5));
    scene.add(createPottedPlant(3.2, -10.5));
    scene.add(createPottedPlant(-10.8, -10.5));
    scene.add(createPottedPlant(10.8, -10.5));

    // E. LIGHTING RIG
    // 1. Key Directional Sun Light
    const sunLight = new THREE.DirectionalLight(0xfffbeb, 1.3);
    sunLight.position.set(-16, 14, 8);
    sunLight.castShadow = true;
    sunLight.shadow.mapSize.width = 2048;
    sunLight.shadow.mapSize.height = 2048;
    sunLight.shadow.camera.near = 0.5;
    sunLight.shadow.camera.far = 40;
    sunLight.shadow.camera.left = -16;
    sunLight.shadow.camera.right = 16;
    sunLight.shadow.camera.top = 16;
    sunLight.shadow.camera.bottom = -16;
    sunLight.shadow.bias = -0.0003;
    scene.add(sunLight);

    // 2. Soft Fill Light (Hemisphere)
    const hemiLight = new THREE.HemisphereLight(0xe0f2fe, 0xf1f5f9, 0.7);
    scene.add(hemiLight);

    // 3. Front Wall Spotlight for Smartboard
    const boardSpot = new THREE.SpotLight(0xffffff, 1.2, 18, Math.PI / 4, 0.3);
    boardSpot.position.set(0, 6.2, -6.5);
    boardSpot.target.position.set(0, 3.8, -11.8);
    scene.add(boardSpot);
    scene.add(boardSpot.target);

    return { globeMesh, clockSecondHand, plantLeaves };
  }
}

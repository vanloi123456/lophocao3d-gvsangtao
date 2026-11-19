import * as THREE from 'three';
import { FrameItem, UserRole } from '../types/classroom';
import { TextureGenerator } from './TextureGenerator';

export interface FrameMeshObject {
  frameItem: FrameItem;
  rootGroup: THREE.Group;
  screenMesh: THREE.Mesh;
  borderMesh: THREE.Mesh;
  glowMesh: THREE.Mesh;
  pinMesh: THREE.Mesh;
  captionGroup: THREE.Group;
  captionFaceMesh: THREE.Mesh;
  captionBackMesh: THREE.Mesh;
  captionConnectorMesh: THREE.Mesh;
  texture: THREE.CanvasTexture;
  captionTexture: THREE.CanvasTexture;
  size: [number, number];
}

export class FrameManager {
  private scene: THREE.Scene;
  private frameMap: Map<string, FrameMeshObject> = new Map();
  public interactiveMeshes: THREE.Mesh[] = [];
  public hoveredFrameId: string | null = null;
  public selectedFrameId: string | null = null;
  private userRole: UserRole = 'teacher';

  constructor(scene: THREE.Scene) {
    this.scene = scene;
  }

  public setUserRole(role: UserRole) {
    if (this.userRole === role) return;
    this.userRole = role;
    this.refreshAllTextures();
  }

  /**
   * Computes non-overlapping side caption plaque dimensions for each classroom zone
   */
  private getCaptionLayout(frame: FrameItem): {
    plaqueW: number;
    plaqueH: number;
    gap: number;
  } {
    const [, h] = frame.size;
    switch (frame.zone) {
      case 'smartboard':
        return { plaqueW: 1.85, plaqueH: Math.min(2.1, h * 0.62), gap: 0.16 };
      case 'games':
        return { plaqueW: 1.18, plaqueH: Math.min(1.55, h * 0.8), gap: 0.1 };
      case 'gallery':
        return { plaqueW: 0.86, plaqueH: Math.min(1.42, h * 0.82), gap: 0.07 };
      case 'materials':
        return { plaqueW: 0.56, plaqueH: Math.min(1.36, h * 0.8), gap: 0.05 };
      case 'cinema':
        return { plaqueW: 0.52, plaqueH: Math.min(1.36, h * 0.78), gap: 0.05 };
      default:
        return { plaqueW: 0.85, plaqueH: Math.min(1.4, h * 0.8), gap: 0.08 };
    }
  }

  private getZoneAccentColor(zone: FrameItem['zone']): number {
    switch (zone) {
      case 'smartboard':
        return 0x0284c7;
      case 'gallery':
        return 0x2563eb;
      case 'cinema':
        return 0x7c3aed;
      case 'games':
        return 0xdb2777;
      case 'materials':
        return 0x0d9488;
      default:
        return 0x38bdf8;
    }
  }

  /**
   * Initializes or updates all frames in the 3D scene from the state array
   */
  public syncFrames(frames: FrameItem[]) {
    const existingIds = new Set(this.frameMap.keys());
    const newIds = new Set(frames.map((f) => f.id));

    // Remove deleted frames
    for (const id of existingIds) {
      if (!newIds.has(id)) {
        this.removeFrameMesh(id);
      }
    }

    // Add or update frames
    for (const frame of frames) {
      if (this.frameMap.has(frame.id)) {
        this.updateFrameMesh(frame);
      } else {
        this.createFrameMesh(frame);
      }
    }

    // Rebuild interactive meshes list for raycasting
    this.rebuildInteractiveMeshes();
  }

  private createFrameMesh(frame: FrameItem) {
    const root = new THREE.Group();
    root.name = `frame_${frame.id}`;
    root.position.set(...frame.position);
    root.rotation.set(...frame.rotation);

    const [w, h] = frame.size;
    const depth = 0.12;
    const accentColor = this.getZoneAccentColor(frame.zone);

    // Outer Bezel / Border (Chamfered look)
    const borderMat = new THREE.MeshStandardMaterial({
      color: frame.zone === 'smartboard' ? 0x0284c7 : 0x1e293b,
      metalness: 0.8,
      roughness: 0.25,
    });
    const borderMesh = new THREE.Mesh(
      new THREE.BoxGeometry(w + 0.16, h + 0.16, depth),
      borderMat
    );
    borderMesh.position.set(0, 0, -depth / 2);
    borderMesh.castShadow = true;
    borderMesh.receiveShadow = true;
    root.add(borderMesh);

    // Glowing rim for hover / active feedback
    const glowMat = new THREE.MeshBasicMaterial({
      color: 0x38bdf8,
      wireframe: true,
      transparent: true,
      opacity: 0,
    });
    const glowMesh = new THREE.Mesh(
      new THREE.BoxGeometry(w + 0.24, h + 0.24, depth + 0.04),
      glowMat
    );
    glowMesh.position.set(0, 0, -depth / 2);
    root.add(glowMesh);

    // Dynamic Screen Surface
    const texture = TextureGenerator.createFrameTexture(frame, this.userRole);
    const screenMat = new THREE.MeshBasicMaterial({
      map: texture,
    });
    const screenMesh = new THREE.Mesh(
      new THREE.PlaneGeometry(w, h),
      screenMat
    );
    screenMesh.position.set(0, 0, 0.005); // slight offset to prevent z-fighting
    screenMesh.userData = { frameId: frame.id };
    root.add(screenMesh);

    // Cute zone indicator pin / bracket on top
    const pinMesh = new THREE.Mesh(
      new THREE.BoxGeometry(0.5, 0.06, 0.14),
      new THREE.MeshStandardMaterial({ color: accentColor, roughness: 0.3 })
    );
    pinMesh.position.set(0, h / 2 + 0.08, -depth / 2);
    root.add(pinMesh);

    // ==========================================
    // 3D SIDE CAPTION PLAQUE (NEXT TO EACH FRAME)
    // ==========================================
    const { plaqueW, plaqueH, gap } = this.getCaptionLayout(frame);
    const captionGroup = new THREE.Group();
    const frameRightEdge = w / 2 + 0.08;
    const plaqueCenterX = frameRightEdge + gap + plaqueW / 2;
    const plaqueDepth = 0.05;

    // Backing panel with subtle colored frame
    const captionBackMesh = new THREE.Mesh(
      new THREE.BoxGeometry(plaqueW + 0.05, plaqueH + 0.05, plaqueDepth),
      new THREE.MeshStandardMaterial({
        color: accentColor,
        metalness: 0.35,
        roughness: 0.35,
      })
    );
    captionBackMesh.position.set(plaqueCenterX, 0, -plaqueDepth / 2 - 0.01);
    captionBackMesh.castShadow = true;
    captionBackMesh.receiveShadow = true;
    captionGroup.add(captionBackMesh);

    // Sleek connector bar attaching caption plaque to the frame border
    const captionConnectorMesh = new THREE.Mesh(
      new THREE.BoxGeometry(gap + 0.05, 0.05, 0.03),
      new THREE.MeshStandardMaterial({
        color: 0x94a3b8,
        metalness: 0.75,
        roughness: 0.25,
      })
    );
    captionConnectorMesh.position.set(frameRightEdge + gap / 2, 0, -0.04);
    captionGroup.add(captionConnectorMesh);

    // High-resolution caption front face
    const captionTexture = TextureGenerator.createCaptionTexture(
      frame,
      this.userRole,
      plaqueW / plaqueH
    );
    const captionFaceMesh = new THREE.Mesh(
      new THREE.PlaneGeometry(plaqueW, plaqueH),
      new THREE.MeshBasicMaterial({ map: captionTexture })
    );
    captionFaceMesh.position.set(plaqueCenterX, 0, -0.005);
    captionFaceMesh.userData = { frameId: frame.id };
    captionGroup.add(captionFaceMesh);

    root.add(captionGroup);
    this.scene.add(root);

    this.frameMap.set(frame.id, {
      frameItem: frame,
      rootGroup: root,
      screenMesh,
      borderMesh,
      glowMesh,
      pinMesh,
      captionGroup,
      captionFaceMesh,
      captionBackMesh,
      captionConnectorMesh,
      texture,
      captionTexture,
      size: [w, h],
    });
  }

  private updateFrameMesh(frame: FrameItem) {
    const existing = this.frameMap.get(frame.id);
    if (!existing) return;

    const [w, h] = frame.size;
    const sizeChanged = existing.size[0] !== w || existing.size[1] !== h;

    existing.frameItem = frame;
    existing.rootGroup.position.set(...frame.position);
    existing.rootGroup.rotation.set(...frame.rotation);

    const { plaqueW, plaqueH, gap } = this.getCaptionLayout(frame);

    if (sizeChanged) {
      const depth = 0.12;
      const plaqueDepth = 0.05;
      const frameRightEdge = w / 2 + 0.08;
      const plaqueCenterX = frameRightEdge + gap + plaqueW / 2;

      existing.screenMesh.geometry.dispose();
      existing.screenMesh.geometry = new THREE.PlaneGeometry(w, h);

      existing.borderMesh.geometry.dispose();
      existing.borderMesh.geometry = new THREE.BoxGeometry(w + 0.16, h + 0.16, depth);

      existing.glowMesh.geometry.dispose();
      existing.glowMesh.geometry = new THREE.BoxGeometry(w + 0.24, h + 0.24, depth + 0.04);

      existing.pinMesh.position.set(0, h / 2 + 0.08, -depth / 2);

      existing.captionBackMesh.geometry.dispose();
      existing.captionBackMesh.geometry = new THREE.BoxGeometry(
        plaqueW + 0.05,
        plaqueH + 0.05,
        plaqueDepth
      );
      existing.captionBackMesh.position.set(plaqueCenterX, 0, -plaqueDepth / 2 - 0.01);

      existing.captionConnectorMesh.geometry.dispose();
      existing.captionConnectorMesh.geometry = new THREE.BoxGeometry(gap + 0.05, 0.05, 0.03);
      existing.captionConnectorMesh.position.set(frameRightEdge + gap / 2, 0, -0.04);

      existing.captionFaceMesh.geometry.dispose();
      existing.captionFaceMesh.geometry = new THREE.PlaneGeometry(plaqueW, plaqueH);
      existing.captionFaceMesh.position.set(plaqueCenterX, 0, -0.005);

      existing.size = [w, h];
    }

    // Update screen texture
    existing.texture.dispose();
    const newTex = TextureGenerator.createFrameTexture(frame, this.userRole);
    existing.texture = newTex;
    (existing.screenMesh.material as THREE.MeshBasicMaterial).map = newTex;
    (existing.screenMesh.material as THREE.MeshBasicMaterial).needsUpdate = true;

    // Update caption plaque texture
    existing.captionTexture.dispose();
    const newCaptionTex = TextureGenerator.createCaptionTexture(
      frame,
      this.userRole,
      plaqueW / plaqueH
    );
    existing.captionTexture = newCaptionTex;
    (existing.captionFaceMesh.material as THREE.MeshBasicMaterial).map = newCaptionTex;
    (existing.captionFaceMesh.material as THREE.MeshBasicMaterial).needsUpdate = true;
  }

  private removeFrameMesh(id: string) {
    const obj = this.frameMap.get(id);
    if (!obj) return;

    this.scene.remove(obj.rootGroup);
    obj.texture.dispose();
    obj.captionTexture.dispose();
    (obj.screenMesh.geometry as THREE.BufferGeometry).dispose();
    (obj.screenMesh.material as THREE.Material).dispose();
    (obj.borderMesh.geometry as THREE.BufferGeometry).dispose();
    (obj.borderMesh.material as THREE.Material).dispose();
    (obj.glowMesh.geometry as THREE.BufferGeometry).dispose();
    (obj.glowMesh.material as THREE.Material).dispose();
    (obj.pinMesh.geometry as THREE.BufferGeometry).dispose();
    (obj.pinMesh.material as THREE.Material).dispose();
    (obj.captionFaceMesh.geometry as THREE.BufferGeometry).dispose();
    (obj.captionFaceMesh.material as THREE.Material).dispose();
    (obj.captionBackMesh.geometry as THREE.BufferGeometry).dispose();
    (obj.captionBackMesh.material as THREE.Material).dispose();
    (obj.captionConnectorMesh.geometry as THREE.BufferGeometry).dispose();
    (obj.captionConnectorMesh.material as THREE.Material).dispose();

    this.frameMap.delete(id);
  }

  private rebuildInteractiveMeshes() {
    this.interactiveMeshes = Array.from(this.frameMap.values()).flatMap((f) => [
      f.screenMesh,
      f.captionFaceMesh,
    ]);
  }

  public setHoveredFrame(id: string | null) {
    if (this.hoveredFrameId === id) return;
    this.hoveredFrameId = id;

    for (const [fId, obj] of this.frameMap.entries()) {
      const isHovered = fId === id;
      const isSelected = fId === this.selectedFrameId;
      const glowMat = obj.glowMesh.material as THREE.MeshBasicMaterial;

      if (isSelected) {
        glowMat.color.setHex(0x22c55e); // Green glow for active
        glowMat.opacity = 0.95;
      } else if (isHovered) {
        glowMat.color.setHex(0x38bdf8); // Sky blue glow on hover
        glowMat.opacity = 0.75;
      } else {
        glowMat.opacity = 0;
      }
    }
  }

  public setSelectedFrame(id: string | null) {
    this.selectedFrameId = id;
    this.setHoveredFrame(this.hoveredFrameId); // refresh glow state
  }

  public getFrameById(id: string): FrameItem | undefined {
    return this.frameMap.get(id)?.frameItem;
  }

  public getFrameMeshObject(id: string): FrameMeshObject | undefined {
    return this.frameMap.get(id);
  }

  public refreshAllTextures() {
    for (const obj of this.frameMap.values()) {
      const { plaqueW, plaqueH } = this.getCaptionLayout(obj.frameItem);

      obj.texture.dispose();
      const newTex = TextureGenerator.createFrameTexture(obj.frameItem, this.userRole);
      obj.texture = newTex;
      (obj.screenMesh.material as THREE.MeshBasicMaterial).map = newTex;
      (obj.screenMesh.material as THREE.MeshBasicMaterial).needsUpdate = true;

      obj.captionTexture.dispose();
      const newCapTex = TextureGenerator.createCaptionTexture(
        obj.frameItem,
        this.userRole,
        plaqueW / plaqueH
      );
      obj.captionTexture = newCapTex;
      (obj.captionFaceMesh.material as THREE.MeshBasicMaterial).map = newCapTex;
      (obj.captionFaceMesh.material as THREE.MeshBasicMaterial).needsUpdate = true;
    }
  }

  public dispose() {
    for (const id of Array.from(this.frameMap.keys())) {
      this.removeFrameMesh(id);
    }
    this.interactiveMeshes = [];
  }
}

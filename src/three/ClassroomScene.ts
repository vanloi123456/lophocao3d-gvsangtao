import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';
import { FrameItem, CameraPreset } from '../types/classroom';
import { ClassroomBuilder } from './ClassroomBuilder';
import { FrameManager } from './FrameManager';

export interface ClassroomSceneOptions {
  container: HTMLDivElement;
  onFrameSelect: (frame: FrameItem) => void;
  onFrameHover?: (frame: FrameItem | null) => void;
}

export class ClassroomScene {
  private container: HTMLDivElement;
  private renderer!: THREE.WebGLRenderer;
  private scene!: THREE.Scene;
  private camera!: THREE.PerspectiveCamera;
  private controls!: OrbitControls;
  public frameManager!: FrameManager;

  private isSoftwareGl: boolean = false;
  private animFrameId: number = 0;
  private clock = new THREE.Clock();
  private raycaster = new THREE.Raycaster();
  private mouse = new THREE.Vector2();

  // Animated elements
  private globeMesh?: THREE.Mesh;
  private clockSecondHand?: THREE.Mesh;
  private plantLeaves: THREE.Mesh[] = [];

  // Smooth camera transition state
  private isTransitioning: boolean = false;
  private camTargetPos = new THREE.Vector3();
  private camTargetLook = new THREE.Vector3();

  // Keyboard navigation
  private keyState: Record<string, boolean> = {};

  private onFrameSelectCallback: (frame: FrameItem) => void;
  private onFrameHoverCallback?: (frame: FrameItem | null) => void;

  private isPointerDown = false;
  private pointerDownPos = { x: 0, y: 0 };

  constructor(options: ClassroomSceneOptions) {
    this.container = options.container;
    this.onFrameSelectCallback = options.onFrameSelect;
    this.onFrameHoverCallback = options.onFrameHover;

    this.init();
  }

  private init() {
    // 1. Software WebGL Guard
    this.isSoftwareGl = (() => {
      const gl = document.createElement('canvas').getContext('webgl2');
      if (!gl) return true;
      const ext = gl.getExtension('WEBGL_debug_renderer_info');
      const param = ext ? ext.UNMASKED_RENDERER_WEBGL : gl.RENDERER;
      const gpu = String(gl.getParameter(param));
      gl.getExtension('WEBGL_lose_context')?.loseContext();
      return /SwiftShader|llvmpipe|softpipe|Software|Basic Render/i.test(gpu);
    })();

    // 2. Renderer
    this.renderer = new THREE.WebGLRenderer({
      antialias: !this.isSoftwareGl,
      powerPreference: 'high-performance',
      preserveDrawingBuffer: true,
    });
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.1;
    this.renderer.setPixelRatio(
      this.isSoftwareGl ? 1 : Math.min(window.devicePixelRatio, 2)
    );
    this.renderer.shadowMap.enabled = !this.isSoftwareGl;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    const width = this.container.clientWidth || window.innerWidth;
    const height = this.container.clientHeight || window.innerHeight;
    this.renderer.setSize(width, height);
    this.container.appendChild(this.renderer.domElement);

    // 3. Scene & Studio Environment
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0xb9e5fb); // Sunny sky horizon
    this.scene.fog = new THREE.FogExp2(0xb9e5fb, 0.015);

    const pmrem = new THREE.PMREMGenerator(this.renderer);
    this.scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
    pmrem.dispose();

    // 4. Camera
    this.camera = new THREE.PerspectiveCamera(52, width / height, 0.1, 100);
    this.camera.position.set(0, 6.2, 9.0);

    // 5. OrbitControls
    this.controls = new OrbitControls(this.camera, this.renderer.domElement);
    this.controls.enableDamping = !this.isSoftwareGl;
    this.controls.dampingFactor = 0.06;
    this.controls.target.set(0, 2.6, -2.5);
    this.controls.maxPolarAngle = Math.PI / 2 - 0.04; // Don't go below floor
    this.controls.minDistance = 1.5;
    this.controls.maxDistance = 21;

    // Stop scripted transition on manual user interaction
    this.controls.addEventListener('start', () => {
      this.isTransitioning = false;
    });

    // 6. Build Classroom Architecture & Furniture
    const { globeMesh, clockSecondHand, plantLeaves } = ClassroomBuilder.buildClassroom(this.scene);
    this.globeMesh = globeMesh;
    this.clockSecondHand = clockSecondHand;
    this.plantLeaves = plantLeaves;

    // 7. Frame Manager
    this.frameManager = new FrameManager(this.scene);

    // 8. Event Listeners
    this.bindEvents();

    // 9. Start Render Loop
    this.startLoop();
  }

  private bindEvents() {
    window.addEventListener('resize', this.onResize);
    window.addEventListener('keydown', this.onKeyDown);
    window.addEventListener('keyup', this.onKeyUp);

    const dom = this.renderer.domElement;
    dom.addEventListener('pointermove', this.onPointerMove);
    dom.addEventListener('pointerdown', this.onPointerDown);
    dom.addEventListener('pointerup', this.onPointerUp);
  }

  private onResize = () => {
    if (!this.container) return;
    const width = this.container.clientWidth;
    const height = this.container.clientHeight;
    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(width, height);
  };

  private onKeyDown = (e: KeyboardEvent) => {
    // Ignore input if user is typing in a modal or form
    const tag = (e.target as HTMLElement)?.tagName?.toLowerCase();
    if (tag === 'input' || tag === 'textarea') return;

    this.keyState[e.code] = true;
  };

  private onKeyUp = (e: KeyboardEvent) => {
    this.keyState[e.code] = false;
  };

  private onPointerDown = (e: PointerEvent) => {
    this.isPointerDown = true;
    this.pointerDownPos = { x: e.clientX, y: e.clientY };
  };

  private onPointerMove = (e: PointerEvent) => {
    const rect = this.renderer.domElement.getBoundingClientRect();
    this.mouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
    this.mouse.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;

    // Perform raycast for hover glow
    this.raycaster.setFromCamera(this.mouse, this.camera);
    const intersects = this.raycaster.intersectObjects(this.frameManager.interactiveMeshes, false);

    if (intersects.length > 0) {
      const hit = intersects[0];
      const frameId = hit.object.userData.frameId;
      if (frameId) {
        this.frameManager.setHoveredFrame(frameId);
        this.renderer.domElement.style.cursor = 'pointer';
        const item = this.frameManager.getFrameById(frameId);
        this.onFrameHoverCallback?.(item || null);
        return;
      }
    }

    if (this.frameManager.hoveredFrameId !== null) {
      this.frameManager.setHoveredFrame(null);
      this.renderer.domElement.style.cursor = 'default';
      this.onFrameHoverCallback?.(null);
    }
  };

  private onPointerUp = (e: PointerEvent) => {
    // Only count as click if pointer didn't drag/rotate the camera
    const dx = Math.abs(e.clientX - this.pointerDownPos.x);
    const dy = Math.abs(e.clientY - this.pointerDownPos.y);

    if (dx < 6 && dy < 6) {
      const rect = this.renderer.domElement.getBoundingClientRect();
      this.mouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      this.mouse.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;

      this.raycaster.setFromCamera(this.mouse, this.camera);
      const intersects = this.raycaster.intersectObjects(this.frameManager.interactiveMeshes, false);

      if (intersects.length > 0) {
        const frameId = intersects[0].object.userData.frameId;
        const frame = this.frameManager.getFrameById(frameId);
        if (frame) {
          this.frameManager.setSelectedFrame(frame.id);
          this.onFrameSelectCallback(frame);
        }
      }
    }

    this.isPointerDown = false;
  };

  /**
   * Smoothly moves the camera to a given position and look target
   */
  public flyTo(pos: [number, number, number], target: [number, number, number]) {
    this.camTargetPos.set(...pos);
    this.camTargetLook.set(...target);
    this.isTransitioning = true;
  }

  /**
   * Flies camera to frame position with comfortable viewing angle
   */
  public flyToFrame(frame: FrameItem) {
    const [fx, fy, fz] = frame.position;
    // Calculate viewing offset based on rotation / normal
    let cx = fx;
    let cy = fy;
    let cz = fz;
    const dist = Math.max(frame.size[0], frame.size[1]) * 1.35 + 1.2;

    if (frame.zone === 'smartboard') {
      cz = fz + dist;
    } else if (frame.zone === 'gallery') {
      cx = fx + dist;
    } else if (frame.zone === 'cinema' || frame.zone === 'materials') {
      cx = fx - dist;
    } else if (frame.zone === 'games') {
      cz = fz - dist;
    } else {
      cz = fz + dist;
    }

    this.flyTo([cx, cy, cz], [fx, fy, fz]);
    this.frameManager.setSelectedFrame(frame.id);
  }

  /**
   * Applies preset camera angle
   */
  public applyPreset(preset: CameraPreset) {
    this.flyTo(preset.position, preset.target);
  }

  /**
   * Keyboard WASD walking within classroom boundaries
   */
  private updateKeyboardNavigation(delta: number) {
    const moveSpeed = 6.0 * delta;
    const forward = new THREE.Vector3();
    this.camera.getWorldDirection(forward);
    forward.y = 0;
    forward.normalize();

    const right = new THREE.Vector3();
    right.crossVectors(forward, new THREE.Vector3(0, 1, 0)).normalize();

    let moved = false;
    const moveDelta = new THREE.Vector3();

    if (this.keyState['KeyW'] || this.keyState['ArrowUp']) {
      moveDelta.addScaledVector(forward, moveSpeed);
      moved = true;
    }
    if (this.keyState['KeyS'] || this.keyState['ArrowDown']) {
      moveDelta.addScaledVector(forward, -moveSpeed);
      moved = true;
    }
    if (this.keyState['KeyA'] || this.keyState['ArrowLeft']) {
      moveDelta.addScaledVector(right, -moveSpeed);
      moved = true;
    }
    if (this.keyState['KeyD'] || this.keyState['ArrowRight']) {
      moveDelta.addScaledVector(right, moveSpeed);
      moved = true;
    }

    if (moved) {
      this.isTransitioning = false;
      this.camera.position.add(moveDelta);
      this.controls.target.add(moveDelta);

      // Clamp camera within room boundary (-11 to +11 on X & Z, 1.2 to 5.8 on Y)
      this.camera.position.x = THREE.MathUtils.clamp(this.camera.position.x, -10.5, 10.5);
      this.camera.position.z = THREE.MathUtils.clamp(this.camera.position.z, -10.5, 10.5);
      this.camera.position.y = THREE.MathUtils.clamp(this.camera.position.y, 1.2, 5.8);
    }
  }

  private startLoop() {
    const tick = () => {
      const delta = Math.min(this.clock.getDelta(), 0.1);

      // 1. Keyboard walk
      this.updateKeyboardNavigation(delta);

      // 2. Smooth Camera Interpolation
      if (this.isTransitioning) {
        this.camera.position.lerp(this.camTargetPos, 0.08);
        this.controls.target.lerp(this.camTargetLook, 0.08);

        if (
          this.camera.position.distanceTo(this.camTargetPos) < 0.05 &&
          this.controls.target.distanceTo(this.camTargetLook) < 0.05
        ) {
          this.camera.position.copy(this.camTargetPos);
          this.controls.target.copy(this.camTargetLook);
          this.isTransitioning = false;
        }
      }

      this.controls.update();

      // 3. Subtle ambient animations
      if (this.globeMesh) {
        this.globeMesh.rotation.y += delta * 0.18;
      }
      if (this.clockSecondHand) {
        this.clockSecondHand.rotation.z -= delta * 0.5;
      }
      // Gentle plant leaf sway
      const time = this.clock.getElapsedTime();
      for (let i = 0; i < this.plantLeaves.length; i++) {
        this.plantLeaves[i].rotation.y = Math.sin(time * 1.5 + i) * 0.04;
      }

      // 4. Render
      this.renderer.render(this.scene, this.camera);

      if (this.isSoftwareGl) {
        this.afterDraw(tick);
      } else {
        this.animFrameId = requestAnimationFrame(tick);
      }
    };

    tick();
  }

  private afterDraw(cb: () => void) {
    const gl = this.renderer.getContext() as WebGL2RenderingContext;
    const sync = gl.fenceSync(gl.SYNC_GPU_COMMANDS_COMPLETE, 0);
    gl.flush();
    const poll = () => {
      const state = sync && gl.getSyncParameter(sync, gl.SYNC_STATUS);
      if (state === gl.UNSIGNALED) {
        this.animFrameId = window.setTimeout(poll, 5);
      } else {
        gl.deleteSync(sync);
        this.animFrameId = window.setTimeout(cb, 60);
      }
    };
    this.animFrameId = window.setTimeout(poll, 5);
  }

  public captureSnapshot(): string {
    this.renderer.render(this.scene, this.camera);
    return this.renderer.domElement.toDataURL('image/png');
  }

  public dispose() {
    window.removeEventListener('resize', this.onResize);
    window.removeEventListener('keydown', this.onKeyDown);
    window.removeEventListener('keyup', this.onKeyUp);

    const dom = this.renderer.domElement;
    dom.removeEventListener('pointermove', this.onPointerMove);
    dom.removeEventListener('pointerdown', this.onPointerDown);
    dom.removeEventListener('pointerup', this.onPointerUp);

    if (this.isSoftwareGl) {
      clearTimeout(this.animFrameId);
    } else {
      cancelAnimationFrame(this.animFrameId);
    }

    this.frameManager.dispose();
    this.controls.dispose();
    this.renderer.dispose();
  }
}

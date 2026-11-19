import {
  collection,
  doc,
  getDoc,
  getDocs,
  onSnapshot,
  query,
  setDoc,
  updateDoc,
  deleteDoc,
  writeBatch,
  where,
  serverTimestamp,
  deleteField,
  Timestamp,
} from 'firebase/firestore';
import {
  db,
  OperationType,
  handleFirestoreError,
} from '../firebase';
import { ClassroomConfig, FrameItem } from '../types/classroom';
import { createDefaultEmptyFrames } from './storage';

export const DEFAULT_CLASSROOM_ID = 'main-classroom';
const DEFAULT_OWNER_ID = 'classroom-teacher';

// Blueprint-synchronized volumetric limits (from firebase-blueprint.json)
export const FIELD_LIMITS = {
  TITLE_MAX: 160,
  DESCRIPTION_MAX: 600,
  IMAGE_URL_MAX: 750000,
  VIDEO_URL_MAX: 750000,
  EMBED_CODE_MAX: 250000,
  MATERIAL_URL_MAX: 2048,
  MATERIAL_CONTENT_MAX: 50000,
} as const;

export interface CloudClassroomMeta {
  exists: boolean;
  ownerId: string | null;
  name: string;
  theme: 'pastel_blue' | 'modern_bright';
  version: string;
  isPublic: boolean;
  updatedAt: number;
}

function timestampToMillis(val: unknown): number {
  if (val instanceof Timestamp) return val.toMillis();
  if (typeof val === 'number') return val;
  return Date.now();
}

function sanitizeId(raw: string): string {
  const cleaned = raw.replace(/[^a-zA-Z0-9_\-]/g, '-').slice(0, 120);
  return cleaned || `frame-${Date.now()}`;
}

function clampString(val: string | undefined, maxLen: number): string | undefined {
  if (!val) return undefined;
  const trimmed = val.trim();
  if (!trimmed) return undefined;
  return trimmed.slice(0, maxLen);
}

/**
 * Subscribes in real time to the cloud classroom metadata and its public frames.
 * Works from any browser and any computer, even before signing in.
 */
export function subscribeCloudClassroom(
  onUpdate: (config: ClassroomConfig, meta: CloudClassroomMeta) => void,
  onError: (err: Error) => void
): () => void {
  const classroomPath = `classrooms/${DEFAULT_CLASSROOM_ID}`;
  const framesPath = `classrooms/${DEFAULT_CLASSROOM_ID}/frames`;

  let latestMeta: CloudClassroomMeta = {
    exists: false,
    ownerId: null,
    name: 'Lớp Học Ảo 3D – Giáo Viên Sáng Tạo',
    theme: 'pastel_blue',
    version: '1.0.0',
    isPublic: true,
    updatedAt: Date.now(),
  };
  let latestFrames: FrameItem[] | null = null;
  let metaLoaded = false;
  let framesLoaded = false;

  const emitIfReady = () => {
    if (!metaLoaded || !framesLoaded) return;

    // If cloud classroom has not been initialized yet, display default empty frames
    const framesToDisplay =
      latestMeta.exists && latestFrames !== null
        ? latestFrames
        : createDefaultEmptyFrames();

    onUpdate(
      {
        version: latestMeta.version,
        name: latestMeta.name,
        theme: latestMeta.theme,
        frames: framesToDisplay,
        lastSaved: latestMeta.updatedAt,
      },
      latestMeta
    );
  };

  const unsubMeta = onSnapshot(
    doc(db, 'classrooms', DEFAULT_CLASSROOM_ID),
    (snap) => {
      metaLoaded = true;
      if (snap.exists()) {
        const d = snap.data();
        latestMeta = {
          exists: true,
          ownerId: typeof d.ownerId === 'string' ? d.ownerId : null,
          name: typeof d.name === 'string' ? d.name : 'Lớp Học Ảo 3D – Giáo Viên Sáng Tạo',
          theme: d.theme === 'modern_bright' ? 'modern_bright' : 'pastel_blue',
          version: typeof d.version === 'string' ? d.version : '1.0.0',
          isPublic: d.isPublic !== false,
          updatedAt: timestampToMillis(d.updatedAt),
        };
      } else {
        latestMeta = {
          exists: false,
          ownerId: null,
          name: 'Lớp Học Ảo 3D – Giáo Viên Sáng Tạo',
          theme: 'pastel_blue',
          version: '1.0.0',
          isPublic: true,
          updatedAt: Date.now(),
        };
      }
      emitIfReady();
    },
    (error) => {
      try {
        handleFirestoreError(error, OperationType.GET, classroomPath);
      } catch (e) {
        onError(e as Error);
      }
    }
  );

  // Rule-enforced list query: explicitly filters where('isPublic', '==', true)
  const framesQuery = query(
    collection(db, 'classrooms', DEFAULT_CLASSROOM_ID, 'frames'),
    where('isPublic', '==', true)
  );

  const unsubFrames = onSnapshot(
    framesQuery,
    (snapshot) => {
      framesLoaded = true;
      const items: FrameItem[] = snapshot.docs.map((docSnap) => {
        const d = docSnap.data();
        return {
          id: docSnap.id,
          zone: d.zone,
          type: d.type,
          title: d.title,
          description: d.description || undefined,
          imageUrl: d.imageUrl || undefined,
          videoUrl: d.videoUrl || undefined,
          videoType: d.videoType || undefined,
          embedCode: d.embedCode || undefined,
          materialUrl: d.materialUrl || undefined,
          materialContent: d.materialContent || undefined,
          position: Array.isArray(d.position) ? (d.position as [number, number, number]) : [0, 3, 0],
          rotation: Array.isArray(d.rotation) ? (d.rotation as [number, number, number]) : [0, 0, 0],
          size: Array.isArray(d.size) ? (d.size as [number, number]) : [2.6, 1.8],
          slotIndex: typeof d.slotIndex === 'number' ? d.slotIndex : 0,
          createdAt: timestampToMillis(d.createdAt),
          updatedAt: timestampToMillis(d.updatedAt),
        };
      });
      items.sort((a, b) => a.slotIndex - b.slotIndex || a.createdAt - b.createdAt);
      latestFrames = items;
      emitIfReady();
    },
    (error) => {
      try {
        handleFirestoreError(error, OperationType.LIST, framesPath);
      } catch (e) {
        onError(e as Error);
      }
    }
  );

  return () => {
    unsubMeta();
    unsubFrames();
  };
}

/**
 * Builds a schema-compliant Firestore payload for creating a frame document.
 */
function buildFrameCreatePayload(
  frame: FrameItem,
  ownerId: string,
  isPublic: boolean
): Record<string, unknown> {
  const payload: Record<string, unknown> = {
    classroomId: DEFAULT_CLASSROOM_ID,
    ownerId,
    isPublic,
    zone: frame.zone,
    type: frame.type,
    title: clampString(frame.title, FIELD_LIMITS.TITLE_MAX) || 'Khung nội dung',
    position: frame.position.map((n) => Number(n) || 0),
    rotation: frame.rotation.map((n) => Number(n) || 0),
    size: [
      Math.min(12, Math.max(0.5, Number(frame.size[0]) || 2.6)),
      Math.min(8, Math.max(0.5, Number(frame.size[1]) || 1.8)),
    ],
    slotIndex: Math.min(1000, Math.max(0, Math.round(frame.slotIndex || 0))),
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  };

  const desc = clampString(frame.description, FIELD_LIMITS.DESCRIPTION_MAX);
  if (desc) payload.description = desc;

  const img = clampString(frame.imageUrl, FIELD_LIMITS.IMAGE_URL_MAX);
  if (img) payload.imageUrl = img;

  const vid = clampString(frame.videoUrl, FIELD_LIMITS.VIDEO_URL_MAX);
  if (vid) {
    payload.videoUrl = vid;
    payload.videoType = vid.startsWith('data:') ? 'file' : 'url';
  }

  const embed = clampString(frame.embedCode, FIELD_LIMITS.EMBED_CODE_MAX);
  if (embed) payload.embedCode = embed;

  const matUrl = clampString(frame.materialUrl, FIELD_LIMITS.MATERIAL_URL_MAX);
  if (matUrl) payload.materialUrl = matUrl;

  const matContent = clampString(frame.materialContent, FIELD_LIMITS.MATERIAL_CONTENT_MAX);
  if (matContent) payload.materialContent = matContent;

  return payload;
}

/**
 * Ensures the root /classrooms/main-classroom document exists in Firestore
 * (seeding the default empty frames if this is the first write).
 * Returns the authoritative ownerId of the classroom.
 */
export async function ensureCloudClassroomExists(
  seedFrames?: FrameItem[]
): Promise<{ ownerId: string; seeded: boolean }> {
  const classroomRef = doc(db, 'classrooms', DEFAULT_CLASSROOM_ID);
  const classroomPath = `classrooms/${DEFAULT_CLASSROOM_ID}`;

  let snap;
  try {
    snap = await getDoc(classroomRef);
  } catch (err) {
    handleFirestoreError(err, OperationType.GET, classroomPath);
  }

  if (snap.exists()) {
    const data = snap.data();
    return {
      ownerId: typeof data.ownerId === 'string' ? data.ownerId : DEFAULT_OWNER_ID,
      seeded: false,
    };
  }

  // Create root classroom first (so Master Gate exists() passes for subcollection writes)
  try {
    await setDoc(classroomRef, {
      version: '1.0.0',
      name: 'Lớp Học Ảo 3D – Giáo Viên Sáng Tạo',
      theme: 'pastel_blue',
      ownerId: DEFAULT_OWNER_ID,
      isPublic: true,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
  } catch (err) {
    handleFirestoreError(err, OperationType.CREATE, classroomPath);
  }

  // Seed initial frames into subcollection
  const initialFrames = seedFrames ?? createDefaultEmptyFrames();
  const batch = writeBatch(db);
  for (const frame of initialFrames) {
    const safeId = sanitizeId(frame.id);
    const frameRef = doc(db, 'classrooms', DEFAULT_CLASSROOM_ID, 'frames', safeId);
    batch.set(frameRef, buildFrameCreatePayload(frame, DEFAULT_OWNER_ID, true));
  }

  try {
    await batch.commit();
  } catch (err) {
    handleFirestoreError(
      err,
      OperationType.WRITE,
      `classrooms/${DEFAULT_CLASSROOM_ID}/frames`
    );
  }

  return { ownerId: DEFAULT_OWNER_ID, seeded: true };
}

/**
 * Creates a new 3D frame on the cloud server.
 */
export async function cloudCreateFrame(frame: FrameItem): Promise<void> {
  const { ownerId } = await ensureCloudClassroomExists();
  const safeId = sanitizeId(frame.id);
  const framePath = `classrooms/${DEFAULT_CLASSROOM_ID}/frames/${safeId}`;
  const frameRef = doc(db, 'classrooms', DEFAULT_CLASSROOM_ID, 'frames', safeId);

  try {
    await setDoc(frameRef, buildFrameCreatePayload(frame, ownerId, true));
  } catch (err) {
    handleFirestoreError(err, OperationType.CREATE, framePath);
  }
}

/**
 * Updates an existing 3D frame on the cloud server (or creates it if missing).
 */
export async function cloudSaveFrame(
  frame: FrameItem,
  currentFrames: FrameItem[]
): Promise<void> {
  const { ownerId, seeded } = await ensureCloudClassroomExists(
    currentFrames.map((f) => (f.id === frame.id ? frame : f))
  );
  if (seeded) return;

  const safeId = sanitizeId(frame.id);
  const framePath = `classrooms/${DEFAULT_CLASSROOM_ID}/frames/${safeId}`;
  const frameRef = doc(db, 'classrooms', DEFAULT_CLASSROOM_ID, 'frames', safeId);

  let existingSnap;
  try {
    existingSnap = await getDoc(frameRef);
  } catch (err) {
    handleFirestoreError(err, OperationType.GET, framePath);
  }

  if (!existingSnap.exists()) {
    try {
      await setDoc(frameRef, buildFrameCreatePayload(frame, ownerId, true));
    } catch (err) {
      handleFirestoreError(err, OperationType.CREATE, framePath);
    }
    return;
  }

  const desc = clampString(frame.description, FIELD_LIMITS.DESCRIPTION_MAX);
  const img = clampString(frame.imageUrl, FIELD_LIMITS.IMAGE_URL_MAX);
  const vid = clampString(frame.videoUrl, FIELD_LIMITS.VIDEO_URL_MAX);
  const embed = clampString(frame.embedCode, FIELD_LIMITS.EMBED_CODE_MAX);
  const matUrl = clampString(frame.materialUrl, FIELD_LIMITS.MATERIAL_URL_MAX);
  const matContent = clampString(frame.materialContent, FIELD_LIMITS.MATERIAL_CONTENT_MAX);

  const updatePayload: Record<string, unknown> = {
    zone: frame.zone,
    type: frame.type,
    title: clampString(frame.title, FIELD_LIMITS.TITLE_MAX) || 'Khung nội dung',
    description: desc !== undefined ? desc : deleteField(),
    imageUrl: img !== undefined ? img : deleteField(),
    videoUrl: vid !== undefined ? vid : deleteField(),
    videoType: vid !== undefined ? (vid.startsWith('data:') ? 'file' : 'url') : deleteField(),
    embedCode: embed !== undefined ? embed : deleteField(),
    materialUrl: matUrl !== undefined ? matUrl : deleteField(),
    materialContent: matContent !== undefined ? matContent : deleteField(),
    position: frame.position.map((n) => Number(n) || 0),
    rotation: frame.rotation.map((n) => Number(n) || 0),
    size: [
      Math.min(12, Math.max(0.5, Number(frame.size[0]) || 2.6)),
      Math.min(8, Math.max(0.5, Number(frame.size[1]) || 1.8)),
    ],
    slotIndex: Math.min(1000, Math.max(0, Math.round(frame.slotIndex || 0))),
    updatedAt: serverTimestamp(),
  };

  try {
    await updateDoc(frameRef, updatePayload);
  } catch (err) {
    handleFirestoreError(err, OperationType.UPDATE, framePath);
  }
}

/**
 * Deletes a single 3D frame from the cloud server.
 */
export async function cloudDeleteFrame(
  frameId: string,
  currentFrames: FrameItem[]
): Promise<void> {
  const { seeded } = await ensureCloudClassroomExists(
    currentFrames.filter((f) => f.id !== frameId)
  );
  if (seeded) return;

  const safeId = sanitizeId(frameId);
  const framePath = `classrooms/${DEFAULT_CLASSROOM_ID}/frames/${safeId}`;
  const frameRef = doc(db, 'classrooms', DEFAULT_CLASSROOM_ID, 'frames', safeId);

  try {
    await deleteDoc(frameRef);
  } catch (err) {
    handleFirestoreError(err, OperationType.DELETE, framePath);
  }
}

/**
 * Replaces all frames in the cloud classroom (used by Import JSON and Reset Classroom).
 */
export async function cloudReplaceAllFrames(frames: FrameItem[]): Promise<void> {
  const { ownerId, seeded } = await ensureCloudClassroomExists(frames);
  if (seeded) return;

  const framesPath = `classrooms/${DEFAULT_CLASSROOM_ID}/frames`;
  const framesCol = collection(db, 'classrooms', DEFAULT_CLASSROOM_ID, 'frames');

  let existingSnap;
  try {
    existingSnap = await getDocs(query(framesCol, where('isPublic', '==', true)));
  } catch (err) {
    handleFirestoreError(err, OperationType.LIST, framesPath);
  }

  // Delete all existing frames first, then recreate cleanly so createdAt == request.time holds
  const deleteBatch = writeBatch(db);
  for (const docSnap of existingSnap.docs) {
    deleteBatch.delete(docSnap.ref);
  }
  try {
    if (!existingSnap.empty) {
      await deleteBatch.commit();
    }
  } catch (err) {
    handleFirestoreError(err, OperationType.DELETE, framesPath);
  }

  const createBatch = writeBatch(db);
  for (const frame of frames) {
    const safeId = sanitizeId(frame.id);
    const frameRef = doc(db, 'classrooms', DEFAULT_CLASSROOM_ID, 'frames', safeId);
    createBatch.set(frameRef, buildFrameCreatePayload(frame, ownerId, true));
  }
  try {
    await createBatch.commit();
  } catch (err) {
    handleFirestoreError(err, OperationType.CREATE, framesPath);
  }
}

/**
 * Compresses an uploaded image File into a crisp data URL guaranteed to fit
 * safely within Firestore's document size limit (~650KB max).
 */
export async function compressImageForCloud(file: File): Promise<string> {
  const dataUrl = await new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => resolve(e.target?.result as string);
    reader.onerror = () => reject(new Error('Không thể đọc file hình ảnh'));
    reader.readAsDataURL(file);
  });

  // If already small enough, return directly
  if (dataUrl.length <= 500000) {
    return dataUrl;
  }

  const img = await new Promise<HTMLImageElement>((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error('Không thể xử lý định dạng hình ảnh'));
    image.src = dataUrl;
  });

  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d')!;

  let maxDim = 1280;
  let quality = 0.82;

  for (let attempt = 0; attempt < 5; attempt++) {
    const scale = Math.min(1, maxDim / Math.max(img.width, img.height));
    canvas.width = Math.max(1, Math.round(img.width * scale));
    canvas.height = Math.max(1, Math.round(img.height * scale));
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

    const compressed = canvas.toDataURL('image/webp', quality);
    if (compressed.length <= 680000) {
      return compressed;
    }

    // Fallback to JPEG if webp wasn't supported or still too large
    const jpeg = canvas.toDataURL('image/jpeg', quality);
    if (jpeg.length <= 680000) {
      return jpeg;
    }

    maxDim = Math.round(maxDim * 0.75);
    quality = Math.max(0.45, quality - 0.12);
  }

  throw new Error('Hình ảnh có dung lượng quá lớn. Vui lòng chọn ảnh nhẹ hơn hoặc dùng đường dẫn URL.');
}

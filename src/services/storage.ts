import { FrameItem, ClassroomConfig } from '../types/classroom';

const DB_NAME = 'LopHocAo3D_DB';
const DB_VERSION = 1;
const STORE_NAME = 'classroom_store';
const STORAGE_KEY = 'classroom_state_v1';

// Initial default empty frames layout with accurate 3D positions in the classroom
export function createDefaultEmptyFrames(): FrameItem[] {
  const frames: FrameItem[] = [];
  const now = Date.now();

  // 1. SMART BOARD (Center Front Wall: Z = -11.8, Y = 3.6, X = 0)
  frames.push({
    id: 'sb-main',
    zone: 'smartboard',
    type: 'game',
    title: 'Bảng Tương Tác Thông Minh',
    description: 'Màn hình trình chiếu chính của lớp học',
    position: [0, 3.8, -11.75],
    rotation: [0, 0, 0],
    size: [6.8, 3.8],
    slotIndex: 0,
    createdAt: now,
    updatedAt: now,
  });

  // 2. KHO HÌNH ẢNH (Left Wall: X = -11.8, arranged along Z from -8 to 5)
  // 6 empty frames (2 rows of 3)
  const galleryZ = [-7.5, -3.5, 0.5];
  const galleryY = [4.3, 2.2];
  let imgSlot = 0;
  for (let r = 0; r < galleryY.length; r++) {
    for (let c = 0; c < galleryZ.length; c++) {
      imgSlot++;
      frames.push({
        id: `img-frame-${imgSlot}`,
        zone: 'gallery',
        type: 'image',
        title: `Khung ảnh ${imgSlot}`,
        position: [-11.75, galleryY[r], galleryZ[c]],
        rotation: [0, Math.PI / 2, 0], // facing right (into room)
        size: [2.6, 1.8],
        slotIndex: imgSlot,
        createdAt: now,
        updatedAt: now,
      });
    }
  }

  // 3. RẠP CHIẾU VIDEO (Back-Right Corner / Right Wall Rear: Z = 4 to 10, X = 11.8)
  // 4 empty video frames (2x2 grid)
  const cinemaZ = [3.5, 7.5];
  const cinemaY = [4.2, 2.2];
  let vidSlot = 0;
  for (let r = 0; r < cinemaY.length; r++) {
    for (let c = 0; c < cinemaZ.length; c++) {
      vidSlot++;
      frames.push({
        id: `vid-frame-${vidSlot}`,
        zone: 'cinema',
        type: 'video',
        title: `Màn hình video ${vidSlot}`,
        position: [11.75, cinemaY[r], cinemaZ[c]],
        rotation: [0, -Math.PI / 2, 0], // facing left (into room)
        size: [3.2, 1.9],
        slotIndex: vidSlot,
        createdAt: now,
        updatedAt: now,
      });
    }
  }

  // 4. TRÒ CHƠI TƯƠNG TÁC (Back Wall: Z = 11.8, X from -7 to 7)
  // 6 empty game stations (2 rows of 3)
  const gamesX = [-6.5, 0, 6.5];
  const gamesY = [4.3, 2.2];
  let gameSlot = 0;
  for (let r = 0; r < gamesY.length; r++) {
    for (let c = 0; c < gamesX.length; c++) {
      gameSlot++;
      frames.push({
        id: `game-frame-${gameSlot}`,
        zone: 'games',
        type: 'game',
        title: `Trạm trò chơi ${gameSlot}`,
        position: [gamesX[c], gamesY[r], 11.75],
        rotation: [0, Math.PI, 0], // facing forward (towards front wall)
        size: [3.4, 2.0],
        slotIndex: gameSlot,
        createdAt: now,
        updatedAt: now,
      });
    }
  }

  // 5. HỌC LIỆU SỐ (Right Wall Front: X = 11.8, arranged along Z from -8 to -1)
  // 6 empty digital learning frames (2 rows of 3)
  const matZ = [-7.5, -4.0, -0.5];
  const matY = [4.3, 2.2];
  let matSlot = 0;
  for (let r = 0; r < matY.length; r++) {
    for (let c = 0; c < matZ.length; c++) {
      matSlot++;
      frames.push({
        id: `mat-frame-${matSlot}`,
        zone: 'materials',
        type: 'material',
        title: `Học liệu số ${matSlot}`,
        position: [11.75, matY[r], matZ[c]],
        rotation: [0, -Math.PI / 2, 0], // facing into room
        size: [2.6, 1.8],
        slotIndex: matSlot,
        createdAt: now,
        updatedAt: now,
      });
    }
  }

  return frames;
}

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof window === 'undefined' || !window.indexedDB) {
      reject(new Error('IndexedDB not supported'));
      return;
    }
    const request = window.indexedDB.open(DB_NAME, DB_VERSION);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME);
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

export async function saveClassroomConfig(config: ClassroomConfig): Promise<void> {
  try {
    const db = await openDB();
    const tx = db.transaction(STORE_NAME, 'readwrite');
    const store = tx.objectStore(STORE_NAME);
    store.put(config, STORAGE_KEY);
    await new Promise<void>((resolve, reject) => {
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  } catch (err) {
    console.warn('Falling back to localStorage for save:', err);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(config));
    } catch (localErr) {
      console.error('Failed to save to localStorage:', localErr);
    }
  }
}

export async function loadClassroomConfig(): Promise<ClassroomConfig> {
  try {
    const db = await openDB();
    const tx = db.transaction(STORE_NAME, 'readonly');
    const store = tx.objectStore(STORE_NAME);
    const request = store.get(STORAGE_KEY);
    const config = await new Promise<ClassroomConfig | undefined>((resolve, reject) => {
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });

    if (config && config.frames && config.frames.length > 0) {
      return config;
    }
  } catch (err) {
    console.warn('Falling back to localStorage for load:', err);
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed.frames && parsed.frames.length > 0) {
          return parsed;
        }
      }
    } catch {
      // ignore
    }
  }

  // Create fresh default empty config
  const initialConfig: ClassroomConfig = {
    version: '1.0.0',
    name: 'Lớp Học Ảo 3D – Giáo Viên Sáng Tạo',
    theme: 'pastel_blue',
    frames: createDefaultEmptyFrames(),
    lastSaved: Date.now(),
  };

  await saveClassroomConfig(initialConfig);
  return initialConfig;
}

export function exportClassroomJson(config: ClassroomConfig): void {
  const json = JSON.stringify(config, null, 2);
  const blob = new Blob([json], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `lop-hoc-ao-3d-${new Date().toISOString().slice(0, 10)}.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export async function importClassroomJson(file: File): Promise<ClassroomConfig> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const text = e.target?.result as string;
        const parsed = JSON.parse(text) as ClassroomConfig;
        if (!parsed.frames || !Array.isArray(parsed.frames)) {
          throw new Error('Dữ liệu lớp học không hợp lệ: thiếu danh sách khung');
        }
        await saveClassroomConfig(parsed);
        resolve(parsed);
      } catch (err) {
        reject(err);
      }
    };
    reader.onerror = () => reject(new Error('Không thể đọc file'));
    reader.readAsText(file);
  });
}

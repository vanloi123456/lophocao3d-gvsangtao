export type FrameType = 'image' | 'video' | 'game' | 'material';

export type ClassroomZone = 'smartboard' | 'gallery' | 'cinema' | 'games' | 'materials';

export type UserRole = 'teacher' | 'student';

export interface FrameItem {
  id: string;
  zone: ClassroomZone;
  type: FrameType;
  title: string;
  description?: string;
  // Content payloads (all empty by default per strict requirements)
  imageUrl?: string; // base64 or URL
  videoUrl?: string; // base64 or URL
  videoType?: 'file' | 'url';
  embedCode?: string; // HTML or iframe string
  materialUrl?: string; // external link or doc
  materialContent?: string; // markdown or text
  
  // 3D placement in the classroom
  position: [number, number, number]; // x, y, z
  rotation: [number, number, number]; // pitch, yaw, roll in radians
  size: [number, number]; // width, height in 3D units
  
  slotIndex: number;
  createdAt: number;
  updatedAt: number;
}

export interface CameraPreset {
  id: string;
  name: string;
  iconName: string;
  position: [number, number, number];
  target: [number, number, number];
}

export interface ClassroomConfig {
  version: string;
  name: string;
  theme: 'pastel_blue' | 'modern_bright';
  frames: FrameItem[];
  lastSaved: number;
}

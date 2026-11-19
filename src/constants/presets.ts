import { CameraPreset } from '../types/classroom';

export const CAMERA_PRESETS: CameraPreset[] = [
  {
    id: 'overview',
    name: 'Toàn cảnh',
    iconName: 'LayoutGrid',
    position: [0, 6.2, 9.0],
    target: [0, 2.6, -2.5],
  },
  {
    id: 'smartboard',
    name: 'Bảng chính',
    iconName: 'Tv',
    position: [0, 3.8, -4.5],
    target: [0, 3.8, -11.75],
  },
  {
    id: 'gallery',
    name: 'Kho ảnh',
    iconName: 'Image',
    position: [-5.8, 3.2, -3.5],
    target: [-11.75, 3.2, -3.5],
  },
  {
    id: 'cinema',
    name: 'Rạp video',
    iconName: 'Film',
    position: [5.8, 3.2, 5.5],
    target: [11.75, 3.2, 5.5],
  },
  {
    id: 'games',
    name: 'Trò chơi',
    iconName: 'Gamepad2',
    position: [0, 3.2, 5.2],
    target: [0, 3.2, 11.75],
  },
  {
    id: 'materials',
    name: 'Học liệu',
    iconName: 'BookOpen',
    position: [5.8, 3.2, -4.0],
    target: [11.75, 3.2, -4.0],
  },
  {
    id: 'podium',
    name: 'Bục giảng',
    iconName: 'GraduationCap',
    position: [0, 3.0, -8.5],
    target: [0, 2.5, 2.0],
  },
];

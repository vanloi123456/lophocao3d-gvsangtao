import React, { useState } from 'react';
import { X, Plus, Image as ImageIcon, Film, Gamepad2, BookOpen } from 'lucide-react';
import { ClassroomZone, FrameItem, FrameType } from '../types/classroom';

interface AddFrameModalProps {
  isOpen: boolean;
  existingFrames: FrameItem[];
  onClose: () => void;
  onAdd: (newFrame: FrameItem) => void;
}

export const AddFrameModal: React.FC<AddFrameModalProps> = ({
  isOpen,
  existingFrames,
  onClose,
  onAdd,
}) => {
  const [zone, setZone] = useState<ClassroomZone>('gallery');
  const [type, setType] = useState<FrameType>('image');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');

  if (!isOpen) return null;

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();

    const now = Date.now();
    const zoneFrames = existingFrames.filter((f) => f.zone === zone);
    const slotIndex = zoneFrames.length + 1;

    // Calculate position based on zone
    let position: [number, number, number] = [0, 3.2, 0];
    let rotation: [number, number, number] = [0, 0, 0];
    let size: [number, number] = [2.6, 1.8];

    if (zone === 'gallery') {
      // Left wall: X = -11.75
      const zOffset = -8 + (slotIndex % 4) * 3.5;
      const yOffset = slotIndex > 3 ? 2.2 : 4.2;
      position = [-11.75, yOffset, zOffset];
      rotation = [0, Math.PI / 2, 0];
      size = [2.6, 1.8];
    } else if (zone === 'cinema') {
      // Right wall rear: X = 11.75
      const zOffset = 3 + (slotIndex % 3) * 3.5;
      const yOffset = slotIndex > 2 ? 2.2 : 4.2;
      position = [11.75, yOffset, zOffset];
      rotation = [0, -Math.PI / 2, 0];
      size = [3.2, 1.9];
    } else if (zone === 'games') {
      // Back wall: Z = 11.75
      const xOffset = -7 + (slotIndex % 4) * 4.2;
      const yOffset = slotIndex > 3 ? 2.2 : 4.2;
      position = [xOffset, yOffset, 11.75];
      rotation = [0, Math.PI, 0];
      size = [3.2, 2.0];
    } else if (zone === 'materials') {
      // Right wall front: X = 11.75
      const zOffset = -8 + (slotIndex % 3) * 3.2;
      const yOffset = slotIndex > 2 ? 2.2 : 4.2;
      position = [11.75, yOffset, zOffset];
      rotation = [0, -Math.PI / 2, 0];
      size = [2.6, 1.8];
    } else {
      // Smartboard
      position = [0, 3.8, -11.75];
      rotation = [0, 0, 0];
      size = [6.8, 3.8];
    }

    const newFrame: FrameItem = {
      id: `custom-frame-${now}`,
      zone,
      type,
      title: title.trim() || `Khung mới ${slotIndex}`,
      description: description.trim() || undefined,
      position,
      rotation,
      size,
      slotIndex,
      createdAt: now,
      updatedAt: now,
    };

    onAdd(newFrame);
    setTitle('');
    setDescription('');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/75 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl border border-sky-100 overflow-hidden text-slate-800">
        <div className="flex items-center justify-between px-6 py-4 bg-gradient-to-r from-sky-600 to-blue-700 text-white">
          <div className="flex items-center space-x-2">
            <Plus className="w-5 h-5 text-sky-200" />
            <h2 className="text-base font-bold">Thêm Khung 3D Mới Vào Phòng Học</h2>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-white/20 transition-colors text-white"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleCreate} className="p-6 space-y-4 text-sm">
          {/* Zone selection */}
          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
              Chọn khu vực đặt khung
            </label>
            <select
              value={zone}
              onChange={(e) => {
                const z = e.target.value as ClassroomZone;
                setZone(z);
                if (z === 'gallery') setType('image');
                else if (z === 'cinema') setType('video');
                else if (z === 'games') setType('game');
                else if (z === 'materials') setType('material');
              }}
              className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-medium focus:ring-2 focus:ring-sky-500"
            >
              <option value="gallery">Kho hình ảnh 3D (Tường trái)</option>
              <option value="cinema">Rạp chiếu video (Tường phải phía sau)</option>
              <option value="games">Trò chơi tương tác (Tường sau)</option>
              <option value="materials">Học liệu số (Tường phải phía trước)</option>
              <option value="smartboard">Bảng thông minh (Tường chính)</option>
            </select>
          </div>

          {/* Type selection */}
          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
              Loại nội dung
            </label>
            <div className="grid grid-cols-2 gap-2">
              {[
                { id: 'image', label: 'Hình ảnh', icon: ImageIcon },
                { id: 'video', label: 'Video', icon: Film },
                { id: 'game', label: 'Trò chơi nhúng', icon: Gamepad2 },
                { id: 'material', label: 'Học liệu số', icon: BookOpen },
              ].map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setType(item.id as FrameType)}
                  className={`flex items-center space-x-2 p-2.5 rounded-xl border text-xs font-medium transition-all ${
                    type === item.id
                      ? 'border-sky-500 bg-sky-50 text-sky-700 font-bold'
                      : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  <item.icon className="w-4 h-4 shrink-0" />
                  <span>{item.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Title */}
          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
              Tên tiêu đề khung
            </label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Nhập tên khung mới..."
              className="w-full px-3.5 py-2 rounded-xl border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-sky-500 text-xs font-medium"
            />
          </div>

          {/* Caption */}
          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
              Chú thích bên cạnh khung (tùy chọn)
            </label>
            <textarea
              rows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Nhập chú thích ngắn hiển thị bên cạnh khung..."
              className="w-full px-3.5 py-2 rounded-xl border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-sky-500 text-xs font-medium resize-none"
            />
          </div>

          {/* Actions */}
          <div className="pt-2 flex justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 text-xs font-semibold hover:bg-slate-50"
            >
              Hủy
            </button>
            <button
              type="submit"
              className="flex items-center gap-1.5 px-5 py-2 rounded-xl bg-sky-600 hover:bg-sky-700 text-white text-xs font-bold transition-all shadow-md shadow-sky-600/20"
            >
              <Plus className="w-4 h-4" />
              <span>Tạo khung ngay</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

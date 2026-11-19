import React, { useEffect, useState } from 'react';
import {
  X,
  Upload,
  Link as LinkIcon,
  Code,
  Image as ImageIcon,
  Film,
  Gamepad2,
  BookOpen,
  Trash2,
  Save,
  Eye,
  Sliders,
  AlertTriangle,
} from 'lucide-react';
import { FrameItem, FrameType } from '../types/classroom';
import { compressImageForCloud, FIELD_LIMITS } from '../services/cloudStorage';

interface FrameEditorModalProps {
  frame: FrameItem | null;
  isOpen: boolean;
  onClose: () => void;
  onSave: (updatedFrame: FrameItem) => void;
  onDelete: (frameId: string) => void;
  onPreview: (frame: FrameItem) => void;
}

export const FrameEditorModal: React.FC<FrameEditorModalProps> = ({
  frame,
  isOpen,
  onClose,
  onSave,
  onDelete,
  onPreview,
}) => {
  const [title, setTitle] = useState(frame?.title || '');
  const [description, setDescription] = useState(frame?.description || '');
  const [type, setType] = useState<FrameType>(frame?.type || 'image');

  // Content states
  const [imageUrl, setImageUrl] = useState(frame?.imageUrl || '');
  const [videoUrl, setVideoUrl] = useState(frame?.videoUrl || '');
  const [embedCode, setEmbedCode] = useState(frame?.embedCode || '');
  const [materialUrl, setMaterialUrl] = useState(frame?.materialUrl || '');
  const [materialContent, setMaterialContent] = useState(frame?.materialContent || '');

  // 3D placement adjustments
  const [posX, setPosX] = useState(frame?.position[0] ?? 0);
  const [posY, setPosY] = useState(frame?.position[1] ?? 3);
  const [posZ, setPosZ] = useState(frame?.position[2] ?? 0);
  const [width, setWidth] = useState(frame?.size[0] ?? 2.6);
  const [height, setHeight] = useState(frame?.size[1] ?? 1.8);

  const [activeTab, setActiveTab] = useState<'content' | 'transform'>('content');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  useEffect(() => {
    if (!frame) return;
    setTitle(frame.title || '');
    setDescription(frame.description || '');
    setType(frame.type);
    setImageUrl(frame.imageUrl || '');
    setVideoUrl(frame.videoUrl || '');
    setEmbedCode(frame.embedCode || '');
    setMaterialUrl(frame.materialUrl || '');
    setMaterialContent(frame.materialContent || '');
    setPosX(frame.position[0]);
    setPosY(frame.position[1]);
    setPosZ(frame.position[2]);
    setWidth(frame.size[0]);
    setHeight(frame.size[1]);
    setActiveTab('content');
    setShowDeleteConfirm(false);
    setUploadError(null);
  }, [frame]);

  if (!isOpen || !frame) return null;

  // Handle local image file upload (JPG, PNG, WEBP) with cloud-safe compression
  const handleImageFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.match(/^image\/(jpeg|png|webp|gif)/)) {
      setUploadError('Chỉ hỗ trợ file hình ảnh định dạng JPG, PNG hoặc WEBP');
      return;
    }

    setUploadError(null);
    setIsUploading(true);
    try {
      const compressed = await compressImageForCloud(file);
      setImageUrl(compressed);
    } catch (err) {
      setUploadError(
        err instanceof Error ? err.message : 'Không thể xử lý file hình ảnh để lưu lên máy chủ'
      );
    } finally {
      setIsUploading(false);
    }
  };

  // Handle local video file upload (MP4, WEBM) with cloud document size guard
  const handleVideoFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.match(/^video\/(mp4|webm)/)) {
      setUploadError('Chỉ hỗ trợ file video định dạng MP4 hoặc WEBM');
      return;
    }

    // Firestore document limit is 1MB; cap inline binary video at ~520KB
    if (file.size > 520 * 1024) {
      setUploadError(
        'Video tải trực tiếp vượt quá giới hạn lưu trữ đám mây (520KB). Để phát được trên mọi máy tính và trình duyệt, thầy cô hãy dán đường dẫn URL video trực tiếp (MP4/WEBM) ở ô bên cạnh.'
      );
      return;
    }

    setUploadError(null);
    setIsUploading(true);
    const reader = new FileReader();
    reader.onload = (event) => {
      const result = event.target?.result as string;
      if (result.length > FIELD_LIMITS.VIDEO_URL_MAX) {
        setUploadError(
          'Dung lượng video vượt giới hạn máy chủ. Vui lòng dùng đường dẫn URL video trực tiếp.'
        );
      } else {
        setVideoUrl(result);
      }
      setIsUploading(false);
    };
    reader.onerror = () => {
      setUploadError('Không thể đọc file video');
      setIsUploading(false);
    };
    reader.readAsDataURL(file);
  };

  const handleSave = () => {
    const updated: FrameItem = {
      ...frame,
      title: title.trim() || 'Khung nội dung',
      description: description.trim(),
      type,
      imageUrl: type === 'image' ? imageUrl : undefined,
      videoUrl: type === 'video' ? videoUrl : undefined,
      embedCode: type === 'game' ? embedCode : undefined,
      materialUrl: type === 'material' ? materialUrl : undefined,
      materialContent: type === 'material' ? materialContent : undefined,
      position: [posX, posY, posZ],
      size: [width, height],
      updatedAt: Date.now(),
    };

    onSave(updated);
    onClose();
  };

  const currentFrameDraft: FrameItem = {
    ...frame,
    title,
    description,
    type,
    imageUrl: type === 'image' ? imageUrl : undefined,
    videoUrl: type === 'video' ? videoUrl : undefined,
    embedCode: type === 'game' ? embedCode : undefined,
    materialUrl: type === 'material' ? materialUrl : undefined,
    materialContent: type === 'material' ? materialContent : undefined,
    position: [posX, posY, posZ],
    size: [width, height],
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-950/75 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="relative w-full max-w-2xl bg-white rounded-2xl shadow-2xl border border-sky-100 flex flex-col overflow-hidden text-slate-800 max-h-[92vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 bg-gradient-to-r from-sky-600 to-blue-700 text-white">
          <div className="flex items-center space-x-2.5">
            <div className="p-1.5 rounded-lg bg-white/20">
              {type === 'image' && <ImageIcon className="w-5 h-5 text-sky-200" />}
              {type === 'video' && <Film className="w-5 h-5 text-purple-200" />}
              {type === 'game' && <Gamepad2 className="w-5 h-5 text-pink-200" />}
              {type === 'material' && <BookOpen className="w-5 h-5 text-teal-200" />}
            </div>
            <div>
              <h2 className="text-base font-bold">Chỉnh Sửa Khung 3D: {frame.title}</h2>
              <p className="text-xs text-sky-100">Khu vực: {frame.zone.toUpperCase()}</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-white/20 transition-colors text-white"
            aria-label="Đóng"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab switch */}
        <div className="flex border-b border-slate-200 bg-slate-50 px-6">
          <button
            onClick={() => setActiveTab('content')}
            className={`py-3 px-4 font-semibold text-xs border-b-2 transition-colors flex items-center gap-1.5 ${
              activeTab === 'content'
                ? 'border-sky-600 text-sky-600'
                : 'border-transparent text-slate-500 hover:text-slate-700'
            }`}
          >
            <Code className="w-4 h-4" />
            <span>Nội dung học liệu</span>
          </button>
          <button
            onClick={() => setActiveTab('transform')}
            className={`py-3 px-4 font-semibold text-xs border-b-2 transition-colors flex items-center gap-1.5 ${
              activeTab === 'transform'
                ? 'border-sky-600 text-sky-600'
                : 'border-transparent text-slate-500 hover:text-slate-700'
            }`}
          >
            <Sliders className="w-4 h-4" />
            <span>Kích thước & Vị trí 3D</span>
          </button>
        </div>

        {/* Form Body */}
        <div className="p-6 space-y-4 overflow-y-auto flex-1 text-sm">
          {uploadError && (
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              <span>{uploadError}</span>
            </div>
          )}

          {activeTab === 'content' ? (
            <>
              {/* Title & Description */}
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                  Tên tiêu đề khung
                </label>
                <input
                  type="text"
                  maxLength={FIELD_LIMITS.TITLE_MAX}
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Nhập tên khung..."
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-sky-500 text-sm font-medium"
                />
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                  Chú thích bên cạnh khung 3D
                </label>
                <textarea
                  rows={2}
                  maxLength={FIELD_LIMITS.DESCRIPTION_MAX}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Nhập chú thích ngắn hiển thị trên bảng chú thích bên cạnh khung..."
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-sky-500 text-xs font-medium resize-none"
                />
              </div>

              {/* Type Switcher (only for smartboard or general) */}
              {frame.zone === 'smartboard' && (
                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                    Loại nội dung bảng chính
                  </label>
                  <div className="grid grid-cols-4 gap-2">
                    {[
                      { id: 'game', label: 'Trò chơi / Web', icon: Gamepad2 },
                      { id: 'video', label: 'Video', icon: Film },
                      { id: 'image', label: 'Hình ảnh', icon: ImageIcon },
                      { id: 'material', label: 'Học liệu', icon: BookOpen },
                    ].map((opt) => (
                      <button
                        key={opt.id}
                        type="button"
                        onClick={() => setType(opt.id as FrameType)}
                        className={`flex flex-col items-center justify-center p-2 rounded-xl border text-xs font-medium transition-all ${
                          type === opt.id
                            ? 'bg-sky-50 border-sky-500 text-sky-700 font-bold'
                            : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                        }`}
                      >
                        <opt.icon className="w-4 h-4 mb-1" />
                        <span>{opt.label}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* IMAGE TYPE INPUTS */}
              {type === 'image' && (
                <div className="space-y-3 p-4 rounded-xl bg-slate-50 border border-slate-200">
                  <label className="block text-xs font-bold text-slate-700">Tải lên hình ảnh</label>
                  <div className="flex flex-col sm:flex-row gap-3">
                    <label className="flex-1 flex flex-col items-center justify-center p-4 border-2 border-dashed border-sky-300 rounded-xl bg-sky-50/50 hover:bg-sky-50 cursor-pointer transition-colors text-center">
                      <Upload className="w-6 h-6 text-sky-600 mb-1" />
                      <span className="text-xs font-semibold text-sky-800">Chọn file từ máy tính</span>
                      <span className="text-[11px] text-slate-500">JPG, PNG, WEBP</span>
                      <input
                        type="file"
                        accept="image/jpeg,image/png,image/webp"
                        onChange={handleImageFileUpload}
                        className="hidden"
                      />
                    </label>

                    <div className="flex-1 flex flex-col justify-center space-y-2">
                      <span className="text-xs text-slate-500 font-medium">Hoặc dán URL ảnh trực tiếp:</span>
                      <div className="flex gap-2">
                        <input
                          type="url"
                          value={imageUrl}
                          onChange={(e) => setImageUrl(e.target.value)}
                          placeholder="https://example.com/anh.jpg"
                          className="flex-1 px-3 py-1.5 rounded-lg border border-slate-300 text-xs focus:outline-hidden focus:ring-1 focus:ring-sky-500"
                        />
                      </div>
                    </div>
                  </div>

                  {imageUrl && (
                    <div className="mt-3 flex items-center justify-between p-2.5 rounded-lg bg-white border border-slate-200">
                      <div className="flex items-center gap-2.5 overflow-hidden">
                        <img
                          src={imageUrl}
                          alt="Xem trước"
                          className="w-12 h-12 object-cover rounded-md border border-slate-200 shrink-0"
                        />
                        <span className="text-xs text-slate-600 truncate">Đã chọn ảnh thành công</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => setImageUrl('')}
                        className="text-xs text-rose-600 hover:text-rose-700 font-medium shrink-0 px-2 py-1 rounded-md hover:bg-rose-50"
                      >
                        Gỡ bỏ ảnh
                      </button>
                    </div>
                  )}
                </div>
              )}

              {/* VIDEO TYPE INPUTS */}
              {type === 'video' && (
                <div className="space-y-3 p-4 rounded-xl bg-purple-50/50 border border-purple-100">
                  <label className="block text-xs font-bold text-purple-900">Tải lên hoặc liên kết video</label>
                  <div className="flex flex-col sm:flex-row gap-3">
                    <label className="flex-1 flex flex-col items-center justify-center p-4 border-2 border-dashed border-purple-300 rounded-xl bg-purple-50 hover:bg-purple-100/50 cursor-pointer transition-colors text-center">
                      <Upload className="w-6 h-6 text-purple-600 mb-1" />
                      <span className="text-xs font-semibold text-purple-800">Tải video từ máy tính</span>
                      <span className="text-[11px] text-slate-500">MP4, WEBM</span>
                      <input
                        type="file"
                        accept="video/mp4,video/webm"
                        onChange={handleVideoFileUpload}
                        className="hidden"
                      />
                    </label>

                    <div className="flex-1 flex flex-col justify-center space-y-2">
                      <span className="text-xs text-slate-500 font-medium">Hoặc nhập URL video trực tiếp:</span>
                      <input
                        type="url"
                        value={videoUrl}
                        onChange={(e) => setVideoUrl(e.target.value)}
                        placeholder="https://example.com/video.mp4"
                        className="w-full px-3 py-1.5 rounded-lg border border-slate-300 text-xs focus:outline-hidden focus:ring-1 focus:ring-purple-500"
                      />
                    </div>
                  </div>

                  {videoUrl && (
                    <div className="mt-3 flex items-center justify-between p-2.5 rounded-lg bg-white border border-slate-200">
                      <div className="flex items-center gap-2 text-xs text-slate-700 truncate">
                        <Film className="w-4 h-4 text-purple-600 shrink-0" />
                        <span className="truncate">Đã tải xong video</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => setVideoUrl('')}
                        className="text-xs text-rose-600 hover:text-rose-700 font-medium shrink-0 px-2 py-1 rounded-md hover:bg-rose-50"
                      >
                        Gỡ bỏ video
                      </button>
                    </div>
                  )}
                </div>
              )}

              {/* GAME EMBED CODE INPUTS */}
              {type === 'game' && (
                <div className="space-y-3 p-4 rounded-xl bg-slate-900 border border-slate-800 text-white">
                  <div className="flex items-center justify-between">
                    <label className="block text-xs font-bold text-sky-400 uppercase tracking-wider flex items-center gap-1.5">
                      <Code className="w-4 h-4" />
                      Mã nhúng Trò chơi HTML / Iframe
                    </label>
                    <span className="text-[11px] text-slate-400">Sandbox bảo mật cao</span>
                  </div>

                  <p className="text-xs text-slate-300">
                    Dán mã nhúng trò chơi tương tác từ AI (Gemini, AI Studio), Quizizz, Kahoot, Wordwall, Scratch hoặc trò chơi HTML5:
                  </p>

                  <textarea
                    rows={6}
                    value={embedCode}
                    onChange={(e) => setEmbedCode(e.target.value)}
                    placeholder={`<iframe src="https://..." width="100%" height="500"></iframe> \nhoặc mã HTML game: \n<button onclick="alert('Đúng rồi!')">Câu hỏi 1</button>`}
                    className="w-full font-mono text-xs px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-sky-300 focus:outline-hidden focus:ring-2 focus:ring-sky-500"
                  />

                  {embedCode && (
                    <div className="flex justify-between items-center pt-1">
                      <span className="text-xs text-emerald-400">✓ Đã có mã nhúng</span>
                      <button
                        type="button"
                        onClick={() => setEmbedCode('')}
                        className="text-xs text-rose-400 hover:text-rose-300 font-medium"
                      >
                        Xóa mã nhúng
                      </button>
                    </div>
                  )}
                </div>
              )}

              {/* DIGITAL MATERIAL INPUTS */}
              {type === 'material' && (
                <div className="space-y-3 p-4 rounded-xl bg-teal-50/50 border border-teal-100">
                  <label className="block text-xs font-bold text-teal-900">Đường dẫn tài liệu hoặc ghi chú</label>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <LinkIcon className="w-4 h-4 text-teal-600 shrink-0" />
                      <input
                        type="url"
                        value={materialUrl}
                        onChange={(e) => setMaterialUrl(e.target.value)}
                        placeholder="https://docs.google.com/... hoặc link tài liệu số"
                        className="flex-1 px-3 py-1.5 rounded-lg border border-slate-300 text-xs focus:outline-hidden focus:ring-1 focus:ring-teal-500"
                      />
                    </div>

                    <textarea
                      rows={3}
                      value={materialContent}
                      onChange={(e) => setMaterialContent(e.target.value)}
                      placeholder="Ghi chú tóm tắt bài học hoặc hướng dẫn tự học cho học sinh..."
                      className="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs focus:outline-hidden focus:ring-1 focus:ring-teal-500"
                    />
                  </div>
                </div>
              )}
            </>
          ) : (
            /* TRANSFORM CONTROLS (Size & Position) */
            <div className="space-y-4">
              <p className="text-xs text-slate-500">
                Tinh chỉnh kích thước và vị trí của khung trực tiếp trong không gian 3D của lớp học:
              </p>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="block text-xs font-semibold text-slate-700">
                    Chiều rộng (Width): {width.toFixed(1)}m
                  </label>
                  <input
                    type="range"
                    min="1.0"
                    max="8.0"
                    step="0.1"
                    value={width}
                    onChange={(e) => setWidth(parseFloat(e.target.value))}
                    className="w-full accent-sky-600"
                  />
                </div>

                <div className="space-y-1">
                  <label className="block text-xs font-semibold text-slate-700">
                    Chiều cao (Height): {height.toFixed(1)}m
                  </label>
                  <input
                    type="range"
                    min="1.0"
                    max="5.0"
                    step="0.1"
                    value={height}
                    onChange={(e) => setHeight(parseFloat(e.target.value))}
                    className="w-full accent-sky-600"
                  />
                </div>

                <div className="space-y-1">
                  <label className="block text-xs font-semibold text-slate-700">
                    Độ cao Y (Elevation): {posY.toFixed(2)}m
                  </label>
                  <input
                    type="range"
                    min="1.2"
                    max="5.2"
                    step="0.05"
                    value={posY}
                    onChange={(e) => setPosY(parseFloat(e.target.value))}
                    className="w-full accent-sky-600"
                  />
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
          <div>
            {!showDeleteConfirm ? (
              <button
                type="button"
                onClick={() => setShowDeleteConfirm(true)}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-rose-600 hover:text-rose-700 hover:bg-rose-50 text-xs font-semibold transition-colors"
              >
                <Trash2 className="w-4 h-4" />
                <span>Xóa khung này</span>
              </button>
            ) : (
              <div className="flex items-center gap-2">
                <span className="text-xs text-rose-700 font-bold">Xác nhận xóa?</span>
                <button
                  type="button"
                  onClick={() => {
                    onDelete(frame.id);
                    onClose();
                  }}
                  className="px-2.5 py-1.5 rounded-lg bg-rose-600 text-white text-xs font-bold hover:bg-rose-700 shadow-xs"
                >
                  Xóa vĩnh viễn
                </button>
                <button
                  type="button"
                  onClick={() => setShowDeleteConfirm(false)}
                  className="px-2 py-1.5 rounded-lg text-slate-500 text-xs hover:bg-slate-200"
                >
                  Hủy
                </button>
              </div>
            )}
          </div>

          <div className="flex items-center space-x-2">
            {(imageUrl || videoUrl || embedCode || materialUrl) && (
              <button
                type="button"
                onClick={() => onPreview(currentFrameDraft)}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold transition-colors"
              >
                <Eye className="w-4 h-4" />
                <span>Xem thử</span>
              </button>
            )}

            <button
              type="button"
              disabled={isUploading}
              onClick={handleSave}
              className="flex items-center gap-1.5 px-5 py-2 rounded-xl bg-sky-600 hover:bg-sky-700 disabled:opacity-50 text-white text-xs font-bold transition-all shadow-md shadow-sky-600/20"
            >
              <Save className="w-4 h-4" />
              <span>{isUploading ? 'Đang xử lý...' : 'Lưu lên máy chủ'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

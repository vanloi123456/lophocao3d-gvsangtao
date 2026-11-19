import React, { useState } from 'react';
import {
  ChevronDown,
  ChevronUp,
  LayoutGrid,
  Tv,
  Image as ImageIcon,
  Film,
  Gamepad2,
  BookOpen,
  GraduationCap,
  RotateCcw,
  Plus,
  Download,
  Upload,
  HelpCircle,
  Maximize,
  Minimize,
  Camera,
  RefreshCw,
  UserCheck,
  Sparkles,
  Cloud,
} from 'lucide-react';
import { CameraPreset, UserRole } from '../types/classroom';
import { CAMERA_PRESETS } from '../constants/presets';

interface DockHUDProps {
  userRole: UserRole;
  onRoleChange: (role: UserRole) => void;
  isSavingCloud: boolean;
  activePresetId: string;
  onSelectPreset: (preset: CameraPreset) => void;
  onResetView: () => void;
  onAddFrame: () => void;
  onExport: () => void;
  onImportClick: () => void;
  onResetClassroom: () => void;
  onOpenHelp: () => void;
  onCaptureSnapshot: () => void;
  hoveredFrameTitle?: string | null;
  hoveredFrameHasContent?: boolean;
}

export const DockHUD: React.FC<DockHUDProps> = ({
  userRole,
  onRoleChange,
  isSavingCloud,
  activePresetId,
  onSelectPreset,
  onResetView,
  onAddFrame,
  onExport,
  onImportClick,
  onResetClassroom,
  onOpenHelp,
  onCaptureSnapshot,
  hoveredFrameTitle,
  hoveredFrameHasContent,
}) => {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch((err) => console.warn(err));
      setIsFullscreen(true);
    } else {
      document.exitFullscreen().catch((err) => console.warn(err));
      setIsFullscreen(false);
    }
  };

  const getPresetIcon = (id: string) => {
    switch (id) {
      case 'overview':
        return <LayoutGrid className="w-3.5 h-3.5" />;
      case 'smartboard':
        return <Tv className="w-3.5 h-3.5" />;
      case 'gallery':
        return <ImageIcon className="w-3.5 h-3.5" />;
      case 'cinema':
        return <Film className="w-3.5 h-3.5" />;
      case 'games':
        return <Gamepad2 className="w-3.5 h-3.5" />;
      case 'materials':
        return <BookOpen className="w-3.5 h-3.5" />;
      case 'podium':
        return <GraduationCap className="w-3.5 h-3.5" />;
      default:
        return <LayoutGrid className="w-3.5 h-3.5" />;
    }
  };

  return (
    <>
      {/* Top Floating Badge Bar */}
      <div className="fixed top-4 left-4 z-40 flex items-center gap-2 pointer-events-auto">
        <div className="flex items-center gap-2.5 px-3.5 py-1.5 rounded-full bg-slate-900/90 text-white border border-sky-500/30 shadow-lg text-xs font-semibold">
          <span className="text-sky-300 font-bold">LỚP HỌC ẢO 3D</span>
          <span className="text-slate-500 font-normal">|</span>
          <span className="inline-flex items-center gap-1 text-emerald-300 text-[11px] font-medium">
            <Cloud className="w-3.5 h-3.5" />
            <span>{isSavingCloud ? 'Đang lưu máy chủ...' : 'Đồng bộ máy chủ'}</span>
          </span>
        </div>

        {/* Hovered frame status pill */}
        {hoveredFrameTitle && (
          <div className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-sky-950/90 border border-sky-400/40 text-sky-200 text-xs font-medium shadow-md animate-in fade-in duration-150">
            <Sparkles className="w-3.5 h-3.5 text-sky-400" />
            <span>
              {userRole === 'teacher'
                ? `Nhấn để quản lý: ${hoveredFrameTitle}`
                : hoveredFrameHasContent
                  ? `Nhấn để xem: ${hoveredFrameTitle}`
                  : `${hoveredFrameTitle} (Chưa có nội dung)`}
            </span>
          </div>
        )}
      </div>

      {/* Top-Right Quick Utilities */}
      <div className="fixed top-4 right-4 z-40 flex items-center gap-1.5 pointer-events-auto">
        {/* Direct Role toggle button (no login required) */}
        <button
          onClick={() => onRoleChange(userRole === 'teacher' ? 'student' : 'teacher')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold border transition-all shadow-md ${
            userRole === 'teacher'
              ? 'bg-sky-600 border-sky-400 text-white'
              : 'bg-emerald-600 border-emerald-400 text-white'
          }`}
          title="Chuyển đổi giữa chế độ Giáo viên (toàn quyền thêm/sửa/xóa và lưu lên máy chủ) và Học sinh (chỉ xem/tương tác)"
        >
          <UserCheck className="w-3.5 h-3.5" />
          <span>{userRole === 'teacher' ? 'Chế độ: Giáo Viên' : 'Chế độ: Học Sinh'}</span>
        </button>

        <button
          onClick={onOpenHelp}
          className="p-2 rounded-full bg-slate-900/90 hover:bg-slate-800 text-sky-300 border border-slate-700 shadow-md transition-colors"
          title="Hướng dẫn điều khiển 3D"
        >
          <HelpCircle className="w-4 h-4" />
        </button>

        <button
          onClick={toggleFullscreen}
          className="p-2 rounded-full bg-slate-900/90 hover:bg-slate-800 text-slate-300 border border-slate-700 shadow-md transition-colors"
          title="Toàn màn hình"
        >
          {isFullscreen ? <Minimize className="w-4 h-4" /> : <Maximize className="w-4 h-4" />}
        </button>
      </div>

      {/* Bottom Consolidated Dock */}
      <div
        className={`fixed bottom-4 left-1/2 -translate-x-1/2 z-40 w-full max-w-4xl px-3 transition-transform duration-300 ease-out pointer-events-none ${
          isCollapsed ? 'translate-y-[calc(100%-36px)]' : 'translate-y-0'
        }`}
      >
        <div className="flex flex-col items-center">
          {/* Collapse / Expand Tab Button */}
          <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="pointer-events-auto mb-1 flex items-center gap-1 px-3 py-1 rounded-full bg-slate-900/90 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-700/80 shadow-md text-[11px] font-medium transition-colors"
          >
            {isCollapsed ? (
              <>
                <ChevronUp className="w-3.5 h-3.5" />
                <span>Hiển thị thanh công cụ</span>
              </>
            ) : (
              <>
                <ChevronDown className="w-3.5 h-3.5" />
                <span>Thu gọn thanh công cụ</span>
              </>
            )}
          </button>

          {/* Main Control Panel Dock */}
          <div className="pointer-events-auto w-full p-2.5 sm:p-3 rounded-2xl bg-slate-900/95 border border-slate-700/80 shadow-2xl backdrop-blur-md text-white flex flex-col gap-2.5">
            {/* Row 1: Camera Preset Pills */}
            <div className="flex items-center justify-between gap-1 overflow-x-auto pb-1 no-scrollbar">
              <div className="flex items-center gap-1 shrink-0">
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mr-1 hidden sm:inline">
                  Góc nhìn:
                </span>
                {CAMERA_PRESETS.map((p) => {
                  const isActive = activePresetId === p.id;
                  return (
                    <button
                      key={p.id}
                      onClick={() => onSelectPreset(p)}
                      className={`flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-xs font-semibold transition-all shrink-0 ${
                        isActive
                          ? 'bg-sky-500 text-white shadow-xs shadow-sky-500/50'
                          : 'bg-slate-800/80 hover:bg-slate-750 text-slate-300 hover:text-white border border-slate-700/50'
                      }`}
                    >
                      {getPresetIcon(p.id)}
                      <span>{p.name}</span>
                    </button>
                  );
                })}
              </div>

              <button
                onClick={onResetView}
                className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-xs font-medium border border-slate-700 shrink-0 ml-1"
                title="Đưa góc nhìn về vị trí ban đầu"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Góc ban đầu</span>
              </button>
            </div>

            {/* Row 2: Teacher Management Toolbar (when teacher role is active) */}
            <div className="flex items-center justify-between gap-2 pt-2 border-t border-slate-800/80 text-xs">
              <div className="flex items-center gap-1.5 overflow-x-auto shrink-0">
                {userRole === 'teacher' ? (
                  <>
                    <button
                      onClick={onAddFrame}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gradient-to-r from-sky-500 to-blue-600 hover:from-sky-400 hover:to-blue-500 text-white font-bold transition-all shadow-sm shadow-sky-500/30 shrink-0"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Thêm khung mới</span>
                    </button>

                    <button
                      onClick={onExport}
                      className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 transition-colors shrink-0"
                      title="Xuất cấu hình phòng học ra file JSON để lưu trữ hoặc chia sẻ"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span className="hidden sm:inline">Xuất JSON</span>
                    </button>

                    <button
                      onClick={onImportClick}
                      className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 transition-colors shrink-0"
                      title="Nhập cấu hình phòng học từ file JSON đã lưu"
                    >
                      <Upload className="w-3.5 h-3.5" />
                      <span className="hidden sm:inline">Nhập JSON</span>
                    </button>

                    <button
                      onClick={onResetClassroom}
                      className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-rose-950/40 hover:bg-rose-900/60 text-rose-300 border border-rose-900/60 transition-colors shrink-0"
                      title="Khôi phục phòng học về trạng thái trống ban đầu"
                    >
                      <RefreshCw className="w-3.5 h-3.5" />
                      <span className="hidden md:inline">Đặt lại phòng</span>
                    </button>
                  </>
                ) : (
                  <div className="text-slate-300 text-xs py-1 flex items-center gap-1.5">
                    <span>🎒 Chế độ Học sinh: Chỉ xem và tương tác nội dung. Thêm hoặc xóa học liệu chỉ dành cho Giáo viên.</span>
                  </div>
                )}
              </div>

              <div className="flex items-center gap-1 shrink-0">
                <button
                  onClick={onCaptureSnapshot}
                  className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 transition-colors"
                  title="Chụp ảnh phòng học 3D"
                >
                  <Camera className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Chụp ảnh 3D</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

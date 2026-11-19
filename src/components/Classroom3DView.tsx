import React, { useEffect, useRef, useState, useCallback } from 'react';
import { ClassroomScene } from '../three/ClassroomScene';
import {
  ClassroomConfig,
  CameraPreset,
  FrameItem,
  UserRole,
} from '../types/classroom';
import {
  saveClassroomConfig,
  exportClassroomJson,
  importClassroomJson,
  createDefaultEmptyFrames,
} from '../services/storage';
import {
  subscribeCloudClassroom,
  cloudSaveFrame,
  cloudCreateFrame,
  cloudDeleteFrame,
  cloudReplaceAllFrames,
} from '../services/cloudStorage';
import { CAMERA_PRESETS } from '../constants/presets';
import { DockHUD } from './DockHUD';
import { FrameEditorModal } from './FrameEditorModal';
import { FrameViewerModal } from './FrameViewerModal';
import { AddFrameModal } from './AddFrameModal';
import { HelpGuideModal } from './HelpGuideModal';

export const Classroom3DView: React.FC = () => {
  const mountRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<ClassroomScene | null>(null);
  const importInputRef = useRef<HTMLInputElement>(null);

  const [classroomConfig, setClassroomConfig] = useState<ClassroomConfig>(() => ({
    version: '1.0.0',
    name: 'Lớp Học Ảo 3D – Giáo Viên Sáng Tạo',
    theme: 'pastel_blue',
    frames: createDefaultEmptyFrames(),
    lastSaved: Date.now(),
  }));
  const [userRole, setUserRole] = useState<UserRole>('teacher');
  const [isSavingCloud, setIsSavingCloud] = useState<boolean>(false);
  const [fatalCloudError, setFatalCloudError] = useState<Error | null>(null);

  const [activePresetId, setActivePresetId] = useState<string>('overview');
  const [hoveredFrame, setHoveredFrame] = useState<FrameItem | null>(null);

  // Modals state
  const [editingFrame, setEditingFrame] = useState<FrameItem | null>(null);
  const [viewingFrame, setViewingFrame] = useState<FrameItem | null>(null);
  const [isAddFrameOpen, setIsAddFrameOpen] = useState<boolean>(false);
  const [isResetConfirmOpen, setIsResetConfirmOpen] = useState<boolean>(false);
  const [isHelpOpen, setIsHelpOpen] = useState<boolean>(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const toastTimerRef = useRef<number | null>(null);
  const showToast = useCallback((msg: string) => {
    setToastMessage(msg);
    if (toastTimerRef.current) {
      window.clearTimeout(toastTimerRef.current);
    }
    toastTimerRef.current = window.setTimeout(() => {
      setToastMessage(null);
    }, 4000);
  }, []);

  // Re-throw fatal errors to ErrorBoundary
  if (fatalCloudError) {
    throw fatalCloudError;
  }

  const hasFrameContent = useCallback((frame: FrameItem | null): boolean => {
    if (!frame) return false;
    return (
      !!frame.imageUrl ||
      !!frame.videoUrl ||
      !!frame.embedCode ||
      !!frame.materialUrl ||
      !!frame.materialContent
    );
  }, []);

  // 1. Subscribe to real-time Cloud Firestore classroom (works on any browser / any computer without login)
  useEffect(() => {
    const unsubscribe = subscribeCloudClassroom(
      (config) => {
        setClassroomConfig(config);
        // Mirror locally as offline fallback cache
        saveClassroomConfig(config).catch(() => {});
      },
      (err) => {
        console.error('Cloud subscription error:', err);
        setFatalCloudError(err);
      }
    );

    return () => unsubscribe();
  }, []);

  const handleFrameClicked = useCallback(
    (frame: FrameItem) => {
      const hasContent = hasFrameContent(frame);

      // Focus camera on frame
      sceneRef.current?.flyToFrame(frame);

      if (userRole === 'teacher') {
        if (!hasContent) {
          // Open editor directly so teacher can fill it
          setEditingFrame(frame);
        } else {
          // Open viewer with option to edit
          setViewingFrame(frame);
        }
      } else {
        // Student mode: strictly read-only, never open editor or allow adding/deleting
        if (hasContent) {
          setViewingFrame(frame);
        } else {
          showToast(
            `Khung "${frame.title}" chưa có nội dung. Chỉ chế độ Giáo viên mới được thêm hoặc xóa nội dung.`
          );
        }
      }
    },
    [userRole, hasFrameContent, showToast]
  );

  // Keep a live ref to handleFrameClicked so Three.js event callbacks always see the latest userRole
  const handleFrameClickedRef = useRef(handleFrameClicked);
  useEffect(() => {
    handleFrameClickedRef.current = handleFrameClicked;
  }, [handleFrameClicked]);

  // 2. Initialize Three.js Scene once
  useEffect(() => {
    if (!mountRef.current || sceneRef.current) return;

    const scene = new ClassroomScene({
      container: mountRef.current,
      onFrameSelect: (frame) => {
        handleFrameClickedRef.current(frame);
      },
      onFrameHover: (frame) => {
        setHoveredFrame(frame);
      },
    });

    sceneRef.current = scene;

    return () => {
      scene.dispose();
      sceneRef.current = null;
    };
  }, []);

  // 3. Sync frames with 3D scene whenever classroomConfig.frames changes
  useEffect(() => {
    if (sceneRef.current && classroomConfig?.frames) {
      sceneRef.current.frameManager.syncFrames(classroomConfig.frames);
    }
  }, [classroomConfig?.frames]);

  // 4. Sync userRole with 3D FrameManager textures & close teacher-only modals when switching to student
  useEffect(() => {
    sceneRef.current?.frameManager.setUserRole(userRole);
    if (userRole !== 'teacher') {
      setEditingFrame(null);
      setIsAddFrameOpen(false);
      setIsResetConfirmOpen(false);
    }
  }, [userRole]);

  const handleRoleChange = (nextRole: UserRole) => {
    setUserRole(nextRole);
    if (nextRole === 'student') {
      showToast(
        'Đã chuyển sang Chế độ Học sinh (chỉ xem và tương tác, không thể thêm/xóa nội dung).'
      );
    } else {
      showToast(
        'Đã chuyển sang Chế độ Giáo viên (mọi thay đổi tự động lưu lên máy chủ, không cần đăng nhập).'
      );
    }
  };

  const handleSelectPreset = (preset: CameraPreset) => {
    setActivePresetId(preset.id);
    sceneRef.current?.applyPreset(preset);
  };

  const handleResetView = () => {
    const overview = CAMERA_PRESETS[0];
    setActivePresetId(overview.id);
    sceneRef.current?.applyPreset(overview);
  };

  const reportCloudWriteError = (err: unknown, fallbackMsg: string) => {
    const msg = err instanceof Error ? err.message : String(err);
    if (msg.toLowerCase().includes('quota')) {
      showToast(
        'Máy chủ lưu trữ tạm đạt giới hạn lượt truy cập trong ngày. Vui lòng thử lại vào ngày mai.'
      );
    } else {
      showToast(fallbackMsg);
    }
  };

  // Frame editing handlers (strictly teacher-mode only & persisted to Cloud Firestore without login)
  const handleSaveFrame = async (updated: FrameItem) => {
    if (userRole !== 'teacher') {
      showToast('Chỉ chế độ Giáo viên mới được phép thêm hoặc chỉnh sửa nội dung học tập.');
      return;
    }

    setIsSavingCloud(true);
    try {
      await cloudSaveFrame(updated, classroomConfig.frames);
      showToast(`Đã lưu "${updated.title}" lên máy chủ (đồng bộ mọi thiết bị).`);
    } catch (err) {
      console.error('Failed to save frame to cloud:', err);
      reportCloudWriteError(err, 'Lỗi khi lưu khung lên máy chủ. Vui lòng kiểm tra kết nối mạng.');
    } finally {
      setIsSavingCloud(false);
    }
  };

  const handleDeleteFrame = async (frameId: string) => {
    if (userRole !== 'teacher') {
      showToast('Chỉ chế độ Giáo viên mới được phép xóa nội dung học tập.');
      return;
    }

    setIsSavingCloud(true);
    try {
      await cloudDeleteFrame(frameId, classroomConfig.frames);
      showToast('Đã xóa khung khỏi máy chủ thành công.');
    } catch (err) {
      console.error('Failed to delete frame from cloud:', err);
      reportCloudWriteError(err, 'Lỗi khi xóa khung trên máy chủ.');
    } finally {
      setIsSavingCloud(false);
    }
  };

  const handleAddNewFrame = async (newFrame: FrameItem) => {
    if (userRole !== 'teacher') {
      showToast('Chỉ chế độ Giáo viên mới được phép thêm khung nội dung.');
      return;
    }

    setIsSavingCloud(true);
    try {
      await cloudCreateFrame(newFrame);
      showToast(`Đã tạo khung "${newFrame.title}" và lưu lên máy chủ.`);
      setTimeout(() => {
        sceneRef.current?.flyToFrame(newFrame);
        setEditingFrame(newFrame);
      }, 200);
    } catch (err) {
      console.error('Failed to create frame on cloud:', err);
      reportCloudWriteError(err, 'Lỗi khi thêm khung mới lên máy chủ.');
    } finally {
      setIsSavingCloud(false);
    }
  };

  const handleExport = () => {
    if (userRole !== 'teacher') return;
    exportClassroomJson(classroomConfig);
    showToast('Đã xuất file cấu hình lớp học thành công.');
  };

  const handleImportFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (userRole !== 'teacher') {
      showToast('Chỉ chế độ Giáo viên mới được phép nhập cấu hình lớp học.');
      e.target.value = '';
      return;
    }
    const file = e.target.files?.[0];
    if (!file) return;

    setIsSavingCloud(true);
    try {
      const imported = await importClassroomJson(file);
      await cloudReplaceAllFrames(imported.frames);
      showToast('Đã nạp cấu hình lớp học và đồng bộ lên máy chủ thành công!');
      handleResetView();
    } catch (err) {
      console.error(err);
      reportCloudWriteError(
        err,
        'Lỗi: File cấu hình không đúng định dạng hoặc vượt quá dung lượng.'
      );
    } finally {
      setIsSavingCloud(false);
      e.target.value = '';
    }
  };

  const handleConfirmResetClassroom = async () => {
    if (userRole !== 'teacher') {
      showToast('Chỉ chế độ Giáo viên mới được phép xóa hoặc đặt lại phòng học.');
      setIsResetConfirmOpen(false);
      return;
    }

    setIsSavingCloud(true);
    try {
      const freshFrames = createDefaultEmptyFrames();
      await cloudReplaceAllFrames(freshFrames);
      setIsResetConfirmOpen(false);
      showToast('Đã đặt lại toàn bộ phòng học trên máy chủ về trạng thái trống ban đầu.');
      handleResetView();
    } catch (err) {
      console.error('Failed to reset classroom on cloud:', err);
      reportCloudWriteError(err, 'Lỗi khi đặt lại phòng học trên máy chủ.');
    } finally {
      setIsSavingCloud(false);
    }
  };

  const handleCaptureSnapshot = () => {
    if (!sceneRef.current) return;
    try {
      const dataUrl = sceneRef.current.captureSnapshot();
      const a = document.createElement('a');
      a.href = dataUrl;
      a.download = `anh-chup-lop-hoc-3d-${Date.now()}.png`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      showToast('Đã chụp và tải ảnh lớp học 3D về máy!');
    } catch (err) {
      console.error(err);
      showToast('Không thể chụp ảnh lúc này.');
    }
  };

  return (
    <div className="relative w-screen h-screen overflow-hidden bg-sky-200 select-none">
      {/* 3D Canvas Mount Container */}
      <div
        ref={mountRef}
        className="absolute inset-0 w-full h-full cursor-grab active:cursor-grabbing"
      />

      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-16 left-1/2 -translate-x-1/2 z-50 px-4 py-2 rounded-xl bg-slate-900/95 border border-sky-500/40 text-sky-200 text-xs font-semibold shadow-xl animate-in fade-in slide-in-from-top-2 duration-150 text-center max-w-[90vw]">
          {toastMessage}
        </div>
      )}

      {/* Hidden File Input for JSON import (Teacher mode only) */}
      {userRole === 'teacher' && (
        <input
          ref={importInputRef}
          type="file"
          accept=".json"
          onChange={handleImportFileChange}
          className="hidden"
        />
      )}

      {/* Collapsible Dock HUD */}
      <DockHUD
        userRole={userRole}
        onRoleChange={handleRoleChange}
        isSavingCloud={isSavingCloud}
        activePresetId={activePresetId}
        onSelectPreset={handleSelectPreset}
        onResetView={handleResetView}
        onAddFrame={() => {
          if (userRole === 'teacher') setIsAddFrameOpen(true);
        }}
        onExport={handleExport}
        onImportClick={() => {
          if (userRole === 'teacher') importInputRef.current?.click();
        }}
        onResetClassroom={() => {
          if (userRole === 'teacher') setIsResetConfirmOpen(true);
        }}
        onOpenHelp={() => setIsHelpOpen(true)}
        onCaptureSnapshot={handleCaptureSnapshot}
        hoveredFrameTitle={hoveredFrame?.title}
        hoveredFrameHasContent={hasFrameContent(hoveredFrame)}
      />

      {/* Frame Editor Modal (Strictly Teacher Mode Only) */}
      {userRole === 'teacher' && (
        <FrameEditorModal
          frame={editingFrame}
          isOpen={!!editingFrame}
          onClose={() => setEditingFrame(null)}
          onSave={handleSaveFrame}
          onDelete={handleDeleteFrame}
          onPreview={(draft) => setViewingFrame(draft)}
        />
      )}

      {/* Frame Viewer Modal (Student & Teacher view/play) */}
      <FrameViewerModal
        frame={viewingFrame}
        userRole={userRole}
        onClose={() => setViewingFrame(null)}
        onEdit={(frameToEdit) => {
          if (userRole === 'teacher') {
            setEditingFrame(frameToEdit);
          }
        }}
      />

      {/* Add New Frame Modal (Strictly Teacher Mode Only) */}
      {userRole === 'teacher' && (
        <AddFrameModal
          isOpen={isAddFrameOpen}
          existingFrames={classroomConfig?.frames || []}
          onClose={() => setIsAddFrameOpen(false)}
          onAdd={handleAddNewFrame}
        />
      )}

      {/* Reset Classroom Confirmation Modal (Strictly Teacher Mode Only) */}
      {userRole === 'teacher' && isResetConfirmOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/75 animate-in fade-in duration-150">
          <div className="w-full max-w-md rounded-2xl bg-white shadow-2xl border border-rose-100 overflow-hidden text-slate-800">
            <div className="px-6 py-4 bg-rose-600 text-white font-bold text-base">
              Xác nhận đặt lại phòng học trên máy chủ
            </div>
            <div className="p-6 text-sm text-slate-600 leading-relaxed">
              Bạn có chắc chắn muốn đặt lại phòng học về trạng thái trống ban đầu? Tất cả nội dung học tập đã lưu trên máy chủ sẽ bị xóa trên mọi thiết bị.
            </div>
            <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setIsResetConfirmOpen(false)}
                className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 text-xs font-semibold hover:bg-slate-100"
              >
                Hủy
              </button>
              <button
                type="button"
                disabled={isSavingCloud}
                onClick={handleConfirmResetClassroom}
                className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 disabled:opacity-50 text-white text-xs font-bold shadow-sm"
              >
                {isSavingCloud ? 'Đang đặt lại...' : 'Xóa & Đặt lại phòng'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Help Guide Modal */}
      <HelpGuideModal isOpen={isHelpOpen} onClose={() => setIsHelpOpen(false)} />
    </div>
  );
};

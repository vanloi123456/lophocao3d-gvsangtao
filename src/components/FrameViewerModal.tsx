import React, { useRef, useState } from 'react';
import {
  X,
  Maximize2,
  Minimize2,
  RotateCcw,
  Edit3,
  ExternalLink,
  Volume2,
  VolumeX,
  Play,
  Pause,
  Layers,
} from 'lucide-react';
import { FrameItem, UserRole } from '../types/classroom';

interface FrameViewerModalProps {
  frame: FrameItem | null;
  userRole: UserRole;
  onClose: () => void;
  onEdit: (frame: FrameItem) => void;
}

export const FrameViewerModal: React.FC<FrameViewerModalProps> = ({
  frame,
  userRole,
  onClose,
  onEdit,
}) => {
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [iframeKey, setIframeKey] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);

  if (!frame) return null;

  const toggleFullscreen = () => {
    if (!containerRef.current) return;
    if (!document.fullscreenElement) {
      containerRef.current.requestFullscreen().catch((err) => console.warn(err));
      setIsFullscreen(true);
    } else {
      document.exitFullscreen().catch((err) => console.warn(err));
      setIsFullscreen(false);
    }
  };

  const handleVideoPlayPause = () => {
    if (!videoRef.current) return;
    if (videoRef.current.paused) {
      videoRef.current.play();
      setIsPlaying(true);
    } else {
      videoRef.current.pause();
      setIsPlaying(false);
    }
  };

  const handleVideoMute = () => {
    if (!videoRef.current) return;
    videoRef.current.muted = !videoRef.current.muted;
    setIsMuted(videoRef.current.muted);
  };

  // Build clean sandboxed game HTML
  const buildSandboxedGameSrcDoc = (code?: string) => {
    if (!code) return '';
    // If it's already a full HTML or iframe
    if (code.includes('<iframe') || code.includes('<!DOCTYPE html>') || code.includes('<html')) {
      return code;
    }
    // Wrap raw HTML/JS/CSS into a fully functional standalone document
    return `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8" />
          <meta name="viewport" content="width=device-width, initial-scale=1.0" />
          <style>
            html, body {
              margin: 0;
              padding: 0;
              width: 100%;
              height: 100%;
              overflow: auto;
              font-family: system-ui, -apple-system, sans-serif;
              background: #0f172a;
              color: #f8fafc;
              display: flex;
              flex-direction: column;
              align-items: center;
              justify-content: center;
            }
          </style>
        </head>
        <body>
          ${code}
        </body>
      </html>
    `;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-950/80 backdrop-blur-xs animate-in fade-in duration-150">
      <div
        ref={containerRef}
        className={`relative w-full ${
          isFullscreen ? 'h-full max-w-none rounded-none' : 'max-w-4xl max-h-[90vh] rounded-2xl'
        } bg-slate-900 border border-slate-700/80 shadow-2xl flex flex-col overflow-hidden text-white`}
      >
        {/* Top Header */}
        <div className="flex items-center justify-between px-5 py-3.5 bg-slate-800/90 border-b border-slate-700">
          <div className="flex items-center space-x-3 overflow-hidden">
            <span className="px-2.5 py-1 rounded-md text-xs font-semibold bg-sky-500/20 text-sky-400 border border-sky-500/30 shrink-0">
              {frame.zone === 'smartboard' && 'BẢNG THÔNG MINH'}
              {frame.zone === 'gallery' && 'KHO ẢNH 3D'}
              {frame.zone === 'cinema' && 'RẠP VIDEO'}
              {frame.zone === 'games' && 'TRÒ CHƠI TƯƠNG TÁC'}
              {frame.zone === 'materials' && 'HỌC LIỆU SỐ'}
            </span>
            <h3 className="font-bold text-base truncate text-slate-100">{frame.title}</h3>
          </div>

          <div className="flex items-center space-x-1.5 shrink-0">
            {frame.embedCode && (
              <button
                onClick={() => setIframeKey((k) => k + 1)}
                title="Khởi động lại trò chơi"
                className="p-1.5 rounded-lg text-slate-300 hover:text-white hover:bg-slate-700 transition-colors"
              >
                <RotateCcw className="w-4 h-4" />
              </button>
            )}

            {userRole === 'teacher' && (
              <button
                onClick={() => {
                  onClose();
                  onEdit(frame);
                }}
                className="flex items-center space-x-1 px-3 py-1.5 rounded-lg bg-sky-600 hover:bg-sky-500 text-white text-xs font-medium transition-colors"
              >
                <Edit3 className="w-3.5 h-3.5" />
                <span>Chỉnh sửa</span>
              </button>
            )}

            <button
              onClick={toggleFullscreen}
              title={isFullscreen ? 'Thu nhỏ' : 'Toàn màn hình'}
              className="p-1.5 rounded-lg text-slate-300 hover:text-white hover:bg-slate-700 transition-colors"
            >
              {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
            </button>

            <button
              onClick={onClose}
              title="Đóng (Esc)"
              className="p-1.5 rounded-lg text-slate-300 hover:text-white hover:bg-rose-600/80 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content Viewer Body */}
        <div className="flex-1 min-h-[380px] bg-slate-950 flex items-center justify-center relative overflow-hidden">
          {/* IMAGE VIEWER */}
          {frame.type === 'image' && frame.imageUrl && (
            <div className="w-full h-full p-4 flex items-center justify-center">
              <img
                src={frame.imageUrl}
                alt={frame.title}
                className="max-w-full max-h-[75vh] object-contain rounded-lg shadow-lg select-none"
              />
            </div>
          )}

          {/* VIDEO VIEWER */}
          {frame.type === 'video' && frame.videoUrl && (
            <div className="w-full h-full flex flex-col items-center justify-center relative bg-black">
              <video
                ref={videoRef}
                src={frame.videoUrl}
                className="max-w-full max-h-[75vh] object-contain"
                controls
                autoPlay
                onPlay={() => setIsPlaying(true)}
                onPause={() => setIsPlaying(false)}
              />
            </div>
          )}

          {/* INTERACTIVE GAME VIEWER (SANDBOXED IFRAME) */}
          {frame.type === 'game' && frame.embedCode && (
            <div className="w-full h-full flex flex-col relative bg-slate-950">
              <iframe
                key={iframeKey}
                title={frame.title}
                srcDoc={buildSandboxedGameSrcDoc(frame.embedCode)}
                className="w-full flex-1 border-0"
                sandbox="allow-scripts allow-same-origin allow-forms allow-popups"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              />
            </div>
          )}

          {/* DIGITAL MATERIAL VIEWER */}
          {frame.type === 'material' && (
            <div className="w-full h-full p-6 flex flex-col items-center justify-center text-center max-w-2xl">
              <div className="p-4 rounded-2xl bg-teal-500/10 border border-teal-500/30 text-teal-400 mb-4">
                <Layers className="w-12 h-12" />
              </div>
              <h4 className="text-xl font-bold text-white mb-2">{frame.title}</h4>
              {frame.description && (
                <p className="text-slate-400 text-sm mb-5 leading-relaxed">{frame.description}</p>
              )}

              {frame.materialUrl && (
                <a
                  href={frame.materialUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center space-x-2 px-5 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-500 text-white font-medium text-sm transition-all shadow-lg shadow-teal-900/30"
                >
                  <span>Mở liên kết tài liệu số</span>
                  <ExternalLink className="w-4 h-4" />
                </a>
              )}

              {frame.materialContent && (
                <div className="mt-4 p-4 rounded-xl bg-slate-900 border border-slate-800 text-left text-sm text-slate-300 w-full whitespace-pre-wrap max-h-60 overflow-y-auto">
                  {frame.materialContent}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Side Caption Footer Bar (when teacher added a caption) */}
        {frame.description && frame.type !== 'material' && (
          <div className="px-5 py-3 bg-slate-800/95 border-t border-slate-700 text-xs text-slate-200 flex items-start gap-2">
            <span className="font-bold text-sky-400 uppercase tracking-wider shrink-0">
              Chú thích:
            </span>
            <span className="leading-relaxed">{frame.description}</span>
          </div>
        )}
      </div>
    </div>
  );
};

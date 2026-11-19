import React from 'react';
import { X, MousePointer, Move, ZoomIn, Eye, Gamepad2, GraduationCap } from 'lucide-react';

interface HelpGuideModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const HelpGuideModal: React.FC<HelpGuideModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs">
      <div className="relative w-full max-w-xl rounded-2xl bg-white shadow-2xl border border-sky-100 overflow-hidden text-slate-800 animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 bg-gradient-to-r from-sky-600 to-blue-700 text-white">
          <div className="flex items-center space-x-2">
            <GraduationCap className="w-6 h-6 text-sky-200" />
            <h2 className="text-lg font-bold">Hướng Dẫn Khám Phá Phòng Học Ảo 3D</h2>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg hover:bg-white/20 transition-colors text-white"
            aria-label="Đóng"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4 max-h-[75vh] overflow-y-auto text-sm">
          {/* Controls list */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="flex items-start gap-3 p-3 rounded-xl bg-sky-50 border border-sky-100">
              <MousePointer className="w-5 h-5 text-sky-600 mt-0.5 shrink-0" />
              <div>
                <p className="font-semibold text-slate-900">Chuột trái + Kéo</p>
                <p className="text-slate-600 text-xs">Xoay góc nhìn 360° tự do trong phòng học.</p>
              </div>
            </div>

            <div className="flex items-start gap-3 p-3 rounded-xl bg-blue-50 border border-blue-100">
              <ZoomIn className="w-5 h-5 text-blue-600 mt-0.5 shrink-0" />
              <div>
                <p className="font-semibold text-slate-900">Con lăn chuột</p>
                <p className="text-slate-600 text-xs">Phóng to hoặc thu nhỏ góc nhìn.</p>
              </div>
            </div>

            <div className="flex items-start gap-3 p-3 rounded-xl bg-emerald-50 border border-emerald-100">
              <Move className="w-5 h-5 text-emerald-600 mt-0.5 shrink-0" />
              <div>
                <p className="font-semibold text-slate-900">Phím W, A, S, D / Mũi tên</p>
                <p className="text-slate-600 text-xs">Di chuyển bước đi lại quanh lớp học.</p>
              </div>
            </div>

            <div className="flex items-start gap-3 p-3 rounded-xl bg-purple-50 border border-purple-100">
              <Eye className="w-5 h-5 text-purple-600 mt-0.5 shrink-0" />
              <div>
                <p className="font-semibold text-slate-900">Nhấn vào màn hình 3D</p>
                <p className="text-slate-600 text-xs">Mở xem nội dung hoặc chỉnh sửa khung.</p>
              </div>
            </div>
          </div>

          {/* Zones Explanation */}
          <div className="mt-4 pt-4 border-t border-slate-100 space-y-2">
            <h3 className="font-bold text-slate-900 flex items-center gap-2">
              <Gamepad2 className="w-4 h-4 text-sky-600" />
              Các khu vực chức năng trong lớp học:
            </h3>
            <ul className="space-y-1.5 text-xs text-slate-600 list-disc pl-5">
              <li>
                <span className="font-semibold text-sky-700">Bảng Tương Tác Thông Minh:</span> Màn hình trung tâm phía trước, thích hợp cho bài giảng chính, video hoặc trò chơi mở đầu.
              </li>
              <li>
                <span className="font-semibold text-sky-700">Kho Hình Ảnh:</span> Dãy khung tranh 3D bên tường trái, tải lên hình ảnh bài học, sơ đồ tư duy, tranh vẽ.
              </li>
              <li>
                <span className="font-semibold text-purple-700">Rạp Chiếu Video:</span> Khu vực chiếu video bài giảng thực nghiệm, hoạt hình khoa học.
              </li>
              <li>
                <span className="font-semibold text-pink-700">Trò Chơi Tương Tác:</span> Các trạm máy tương tác phía sau lớp, hỗ trợ dán mã nhúng HTML/iframe trò chơi giáo dục tạo từ AI hoặc nền tảng trực tuyến.
              </li>
              <li>
                <span className="font-semibold text-teal-700">Học Liệu Số:</span> Tủ sách và màn hình tài liệu số, liên kết bài tập hoặc tài liệu tham khảo.
              </li>
            </ul>
          </div>

          {/* Mode Switch Notice */}
          <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-xs">
            <p className="font-semibold">💡 Phân quyền Giáo viên & Học sinh:</p>
            <p className="mt-0.5">
              Ở <b>Chế độ Giáo viên</b>, thầy cô có quyền thêm mới, tải ảnh/video, dán mã trò chơi, chỉnh sửa và xóa khung. Ở <b>Chế độ Học sinh</b>, các em học sinh chỉ xem và tương tác với bài học được chia sẻ.
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3 bg-slate-50 border-t border-slate-100 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-sky-600 hover:bg-sky-700 text-white font-medium text-sm transition-colors shadow-xs"
          >
            Đã hiểu, bắt đầu khám phá
          </button>
        </div>
      </div>
    </div>
  );
};

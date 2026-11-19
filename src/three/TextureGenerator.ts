import * as THREE from 'three';
import { FrameItem, UserRole } from '../types/classroom';

/**
 * Procedural texture generation for classroom surfaces
 */
export class TextureGenerator {
  /**
   * Generates a modern polished wooden classroom floor texture
   */
  static createFloorTexture(): THREE.CanvasTexture {
    const canvas = document.createElement('canvas');
    canvas.width = 1024;
    canvas.height = 1024;
    const ctx = canvas.getContext('2d')!;

    // Warm birch / maple light wood base
    ctx.fillStyle = '#f1e7d8';
    ctx.fillRect(0, 0, 1024, 1024);

    // Subtle parquet plank grid
    const plankWidth = 128;
    const plankHeight = 32;

    for (let y = 0; y < 1024; y += plankHeight) {
      const rowOffset = (Math.floor(y / plankHeight) % 2) * (plankWidth / 2);
      for (let x = -plankWidth; x < 1024 + plankWidth; x += plankWidth) {
        const px = x + rowOffset;
        // Subtle plank tone variation
        const tone = (Math.sin(px * 0.05) * Math.cos(y * 0.08) * 12);
        ctx.fillStyle = `rgb(${238 + tone}, ${224 + tone * 0.9}, ${206 + tone * 0.8})`;
        ctx.fillRect(px + 1, y + 1, plankWidth - 2, plankHeight - 2);

        // Wood grain streaks
        ctx.strokeStyle = `rgba(180, 150, 120, ${0.06 + Math.random() * 0.05})`;
        ctx.lineWidth = 1;
        for (let i = 0; i < 3; i++) {
          ctx.beginPath();
          ctx.moveTo(px + 2, y + 4 + i * 8);
          ctx.lineTo(px + plankWidth - 2, y + 4 + i * 8 + (Math.random() - 0.5) * 4);
          ctx.stroke();
        }
      }
    }

    // Outer subtle border lines
    ctx.strokeStyle = 'rgba(160, 130, 100, 0.2)';
    ctx.lineWidth = 1.5;
    for (let y = 0; y <= 1024; y += plankHeight) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(1024, y);
      ctx.stroke();
    }

    const texture = new THREE.CanvasTexture(canvas);
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    texture.repeat.set(6, 6);
    texture.colorSpace = THREE.SRGBColorSpace;
    return texture;
  }

  /**
   * Generates sunny outdoor garden backdrop through windows
   */
  static createGardenBackdrop(): THREE.CanvasTexture {
    const canvas = document.createElement('canvas');
    canvas.width = 1024;
    canvas.height = 512;
    const ctx = canvas.getContext('2d')!;

    // Sky gradient (clear vibrant blue to soft cyan)
    const sky = ctx.createLinearGradient(0, 0, 0, 360);
    sky.addColorStop(0, '#56b4f7');
    sky.addColorStop(0.65, '#b9e5fb');
    sky.addColorStop(1, '#e4f7ff');
    ctx.fillStyle = sky;
    ctx.fillRect(0, 0, 1024, 512);

    // Fluffy friendly cartoon clouds
    ctx.fillStyle = 'rgba(255, 255, 255, 0.85)';
    const drawCloud = (cx: number, cy: number, r: number) => {
      ctx.beginPath();
      ctx.arc(cx, cy, r, 0, Math.PI * 2);
      ctx.arc(cx + r * 0.7, cy - r * 0.2, r * 0.75, 0, Math.PI * 2);
      ctx.arc(cx + r * 1.4, cy, r * 0.8, 0, Math.PI * 2);
      ctx.arc(cx + r * 0.7, cy + r * 0.2, r * 0.6, 0, Math.PI * 2);
      ctx.fill();
    };

    drawCloud(180, 110, 45);
    drawCloud(620, 140, 55);
    drawCloud(880, 95, 38);

    // Distant soft green hills
    ctx.fillStyle = '#81c784';
    ctx.beginPath();
    ctx.moveTo(0, 360);
    ctx.bezierCurveTo(240, 310, 480, 380, 720, 320);
    ctx.bezierCurveTo(860, 280, 960, 330, 1024, 340);
    ctx.lineTo(1024, 512);
    ctx.lineTo(0, 512);
    ctx.fill();

    // Foreground school lawn & trees
    ctx.fillStyle = '#66bb6a';
    ctx.beginPath();
    ctx.moveTo(0, 390);
    ctx.bezierCurveTo(300, 360, 600, 410, 1024, 380);
    ctx.lineTo(1024, 512);
    ctx.lineTo(0, 512);
    ctx.fill();

    // Stylized trees
    const drawTree = (tx: number, ty: number, h: number, col: string) => {
      // Trunk
      ctx.fillStyle = '#8d6e63';
      ctx.fillRect(tx - 6, ty, 12, h * 0.45);
      // Foliage
      ctx.fillStyle = col;
      ctx.beginPath();
      ctx.arc(tx, ty - h * 0.3, h * 0.5, 0, Math.PI * 2);
      ctx.fill();
    };

    drawTree(120, 380, 90, '#43a047');
    drawTree(220, 400, 75, '#4caf50');
    drawTree(420, 390, 85, '#388e3c');
    drawTree(760, 385, 95, '#43a047');
    drawTree(900, 395, 80, '#2e7d32');

    const texture = new THREE.CanvasTexture(canvas);
    texture.colorSpace = THREE.SRGBColorSpace;
    return texture;
  }

  /**
   * Generates procedural globe map texture
   */
  static createGlobeTexture(): THREE.CanvasTexture {
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 256;
    const ctx = canvas.getContext('2d')!;

    // Blue ocean
    ctx.fillStyle = '#29b6f6';
    ctx.fillRect(0, 0, 512, 256);

    // Green landmasses (procedural stylized continents)
    ctx.fillStyle = '#66bb6a';
    // Eurasia / Africa
    ctx.beginPath();
    ctx.ellipse(320, 100, 70, 45, 0.2, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.ellipse(310, 160, 45, 55, -0.1, 0, Math.PI * 2);
    ctx.fill();
    // Americas
    ctx.beginPath();
    ctx.ellipse(140, 90, 45, 40, -0.3, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.ellipse(170, 170, 35, 50, 0.2, 0, Math.PI * 2);
    ctx.fill();
    // Australia
    ctx.beginPath();
    ctx.ellipse(410, 180, 25, 20, 0, 0, Math.PI * 2);
    ctx.fill();

    // Latitude & longitude lines
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.35)';
    ctx.lineWidth = 1;
    for (let y = 32; y < 256; y += 48) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(512, y);
      ctx.stroke();
    }
    for (let x = 64; x < 512; x += 64) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, 256);
      ctx.stroke();
    }

    const texture = new THREE.CanvasTexture(canvas);
    texture.colorSpace = THREE.SRGBColorSpace;
    return texture;
  }

  /**
   * Generates dynamic high-resolution texture for an interactive frame in the 3D scene
   */
  static createFrameTexture(frame: FrameItem, userRole: UserRole = 'teacher'): THREE.CanvasTexture {
    const canvas = document.createElement('canvas');
    canvas.width = 1024;
    canvas.height = 640;
    const ctx = canvas.getContext('2d')!;

    // Check if frame has user content
    const hasImage = !!frame.imageUrl;
    const hasVideo = !!frame.videoUrl;
    const hasGame = !!frame.embedCode;
    const hasMaterial = !!(frame.materialUrl || frame.materialContent);

    if (hasImage && frame.imageUrl) {
      // Draw background while image is loading, or draw directly if ready
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.src = frame.imageUrl;

      const texture = new THREE.CanvasTexture(canvas);
      texture.colorSpace = THREE.SRGBColorSpace;

      img.onload = () => {
        // Draw loaded image cover
        ctx.fillStyle = '#0f172a';
        ctx.fillRect(0, 0, 1024, 640);

        // Aspect ratio cover
        const imgRatio = img.width / img.height;
        const canvasRatio = 1024 / 640;
        let dw = 1024;
        let dh = 640;
        let dx = 0;
        let dy = 0;

        if (imgRatio > canvasRatio) {
          dw = 640 * imgRatio;
          dx = (1024 - dw) / 2;
        } else {
          dh = 1024 / imgRatio;
          dy = (640 - dh) / 2;
        }

        ctx.drawImage(img, dx, dy, dw, dh);

        // Semi-transparent bottom banner for frame title
        ctx.fillStyle = 'rgba(15, 23, 42, 0.75)';
        ctx.fillRect(0, 560, 1024, 80);

        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 30px system-ui, sans-serif';
        ctx.textAlign = 'left';
        ctx.fillText(frame.title || 'Hình ảnh', 32, 612);

        ctx.fillStyle = '#38bdf8';
        ctx.font = '22px system-ui, sans-serif';
        ctx.textAlign = 'right';
        ctx.fillText('🔍 Nhấn để xem toàn màn hình', 992, 612);

        texture.needsUpdate = true;
      };

      // Initial placeholder while image loads
      ctx.fillStyle = '#1e293b';
      ctx.fillRect(0, 0, 1024, 640);
      ctx.fillStyle = '#94a3b8';
      ctx.font = 'bold 36px system-ui, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('Đang tải hình ảnh...', 512, 320);

      return texture;
    }

    if (hasVideo) {
      // Video display state
      const bgGrad = ctx.createLinearGradient(0, 0, 1024, 640);
      bgGrad.addColorStop(0, '#0f172a');
      bgGrad.addColorStop(1, '#1e1b4b');
      ctx.fillStyle = bgGrad;
      ctx.fillRect(0, 0, 1024, 640);

      // Play button icon
      ctx.fillStyle = '#38bdf8';
      ctx.beginPath();
      ctx.arc(512, 280, 70, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.moveTo(495, 240);
      ctx.lineTo(545, 280);
      ctx.lineTo(495, 320);
      ctx.closePath();
      ctx.fill();

      // Title & instruction
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 36px system-ui, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(frame.title || 'Video lớp học', 512, 420);

      ctx.fillStyle = '#a5f3fc';
      ctx.font = '24px system-ui, sans-serif';
      ctx.fillText('🎬 Nhấn để mở phát video', 512, 470);

      const texture = new THREE.CanvasTexture(canvas);
      texture.colorSpace = THREE.SRGBColorSpace;
      return texture;
    }

    if (hasGame) {
      // Interactive Game embedded state
      const bgGrad = ctx.createLinearGradient(0, 0, 1024, 640);
      bgGrad.addColorStop(0, '#1e1b4b');
      bgGrad.addColorStop(0.5, '#2e1065');
      bgGrad.addColorStop(1, '#0f172a');
      ctx.fillStyle = bgGrad;
      ctx.fillRect(0, 0, 1024, 640);

      // Cute game controller icon representation
      ctx.fillStyle = '#818cf8';
      ctx.beginPath();
      ctx.roundRect(412, 200, 200, 120, 24);
      ctx.fill();

      // D-pad
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(445, 245, 36, 12);
      ctx.fillRect(457, 233, 12, 36);

      // Buttons
      ctx.fillStyle = '#ec4899';
      ctx.beginPath();
      ctx.arc(565, 245, 9, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#3b82f6';
      ctx.beginPath();
      ctx.arc(585, 260, 9, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 38px system-ui, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(frame.title || 'Trò chơi tương tác', 512, 410);

      ctx.fillStyle = '#c084fc';
      ctx.font = 'bold 26px system-ui, sans-serif';
      ctx.fillText('🎮 Nhấn để tham gia trò chơi trực tiếp', 512, 465);

      const texture = new THREE.CanvasTexture(canvas);
      texture.colorSpace = THREE.SRGBColorSpace;
      return texture;
    }

    if (hasMaterial) {
      // Digital material state
      const bgGrad = ctx.createLinearGradient(0, 0, 1024, 640);
      bgGrad.addColorStop(0, '#042f2e');
      bgGrad.addColorStop(1, '#0f172a');
      ctx.fillStyle = bgGrad;
      ctx.fillRect(0, 0, 1024, 640);

      // Book icon
      ctx.fillStyle = '#2dd4bf';
      ctx.beginPath();
      ctx.arc(512, 260, 60, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 48px system-ui, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('📖', 512, 280);

      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 36px system-ui, sans-serif';
      ctx.fillText(frame.title || 'Học liệu số', 512, 400);

      ctx.fillStyle = '#99f6e4';
      ctx.font = '24px system-ui, sans-serif';
      ctx.fillText('📚 Nhấn để mở tài liệu học tập', 512, 455);

      const texture = new THREE.CanvasTexture(canvas);
      texture.colorSpace = THREE.SRGBColorSpace;
      return texture;
    }

    // ==========================================
    // MANDATORY EMPTY STATE (PER STRICT RULES)
    // No dummy data, no sample imagery!
    // Clean modern futuristic glassmorphism look
    // ==========================================
    const isSmartBoard = frame.zone === 'smartboard';
    const bgGrad = ctx.createLinearGradient(0, 0, 1024, 640);

    if (isSmartBoard) {
      bgGrad.addColorStop(0, '#092147');
      bgGrad.addColorStop(0.5, '#0c3066');
      bgGrad.addColorStop(1, '#061633');
    } else if (frame.zone === 'gallery') {
      bgGrad.addColorStop(0, '#0f2942');
      bgGrad.addColorStop(1, '#091827');
    } else if (frame.zone === 'cinema') {
      bgGrad.addColorStop(0, '#1c1938');
      bgGrad.addColorStop(1, '#0d0b1a');
    } else if (frame.zone === 'games') {
      bgGrad.addColorStop(0, '#22143d');
      bgGrad.addColorStop(1, '#0f081c');
    } else {
      bgGrad.addColorStop(0, '#0a2e2b');
      bgGrad.addColorStop(1, '#051715');
    }

    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, 1024, 640);

    // Subtle tech grid pattern
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.04)';
    ctx.lineWidth = 1;
    for (let x = 0; x < 1024; x += 64) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, 640);
      ctx.stroke();
    }
    for (let y = 0; y < 640; y += 64) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(1024, y);
      ctx.stroke();
    }

    // Outer subtle border
    ctx.strokeStyle = 'rgba(56, 189, 248, 0.35)';
    ctx.lineWidth = 4;
    ctx.strokeRect(16, 16, 992, 608);

    // Top Tag Badge
    const zoneLabels: Record<string, { label: string; color: string }> = {
      smartboard: { label: 'BẢNG TƯƠNG TÁC THÔNG MINH', color: '#38bdf8' },
      gallery: { label: 'KHO HÌNH ẢNH 3D', color: '#60a5fa' },
      cinema: { label: 'RẠP CHIẾU VIDEO', color: '#c084fc' },
      games: { label: 'TRÒ CHƠI TƯƠNG TÁC', color: '#f472b6' },
      materials: { label: 'HỌC LIỆU SỐ', color: '#2dd4bf' },
    };
    const zoneInfo = zoneLabels[frame.zone] || { label: 'KHUNG NỘI DUNG', color: '#38bdf8' };

    ctx.fillStyle = zoneInfo.color;
    ctx.font = 'bold 22px system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(`• ${zoneInfo.label} •`, 512, 70);

    const isTeacher = userRole === 'teacher';
    const circleY = isSmartBoard ? 290 : 275;

    if (isTeacher) {
      // Center glowing circle with '+' (Teacher mode only)
      ctx.fillStyle = 'rgba(56, 189, 248, 0.15)';
      ctx.beginPath();
      ctx.arc(512, circleY, 72, 0, Math.PI * 2);
      ctx.fill();

      ctx.strokeStyle = zoneInfo.color;
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(512, circleY, 72, 0, Math.PI * 2);
      ctx.stroke();

      // Plus (+) sign
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 6;
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(512, circleY - 32);
      ctx.lineTo(512, circleY + 32);
      ctx.moveTo(480, circleY);
      ctx.lineTo(544, circleY);
      ctx.stroke();
    } else {
      // Student mode: subtle read-only empty badge (no '+' add button)
      ctx.fillStyle = 'rgba(148, 163, 184, 0.12)';
      ctx.beginPath();
      ctx.arc(512, circleY, 64, 0, Math.PI * 2);
      ctx.fill();

      ctx.strokeStyle = 'rgba(148, 163, 184, 0.45)';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(512, circleY, 64, 0, Math.PI * 2);
      ctx.stroke();

      // Subtle lock icon
      ctx.strokeStyle = '#cbd5e1';
      ctx.lineWidth = 5;
      ctx.beginPath();
      ctx.arc(512, circleY - 12, 16, Math.PI, 0);
      ctx.stroke();

      ctx.fillStyle = '#cbd5e1';
      ctx.beginPath();
      ctx.roundRect(490, circleY - 10, 44, 34, 6);
      ctx.fill();
    }

    // Frame Title
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 36px system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(frame.title || 'Khung trống', 512, circleY + 130);

    // Action CTA text
    ctx.fillStyle = '#94a3b8';
    ctx.font = '22px system-ui, sans-serif';
    let actionText = 'Chưa có nội dung học tập';
    if (isTeacher) {
      actionText = 'Nhấn để thêm nội dung';
      if (frame.type === 'image') actionText = 'Nhấn để tải lên hình ảnh (JPG, PNG, WEBP)';
      else if (frame.type === 'video') actionText = 'Nhấn để thêm video (MP4, WEBM, URL)';
      else if (frame.type === 'game') actionText = 'Nhấn để dán mã nhúng trò chơi AI';
      else if (frame.type === 'material') actionText = 'Nhấn để thêm tài liệu hoặc bài học';
    } else {
      actionText = 'Chưa có nội dung • Chỉ giáo viên có thể thêm hoặc xóa';
    }

    ctx.fillText(actionText, 512, circleY + 175);

    const texture = new THREE.CanvasTexture(canvas);
    texture.colorSpace = THREE.SRGBColorSpace;
    return texture;
  }

  /**
   * Helper to wrap multi-line text cleanly on a 2D canvas
   */
  private static drawWrappedText(
    ctx: CanvasRenderingContext2D,
    text: string,
    x: number,
    startY: number,
    maxWidth: number,
    lineHeight: number,
    maxLines: number
  ): number {
    const paragraphs = text.split('\n');
    let y = startY;
    let linesDrawn = 0;

    for (const para of paragraphs) {
      const words = para.trim().split(/\s+/).filter(Boolean);
      if (words.length === 0) {
        if (linesDrawn < maxLines) {
          y += lineHeight * 0.6;
          linesDrawn++;
        }
        continue;
      }

      let line = '';
      for (let i = 0; i < words.length; i++) {
        const testLine = line ? `${line} ${words[i]}` : words[i];
        if (ctx.measureText(testLine).width > maxWidth && line) {
          if (linesDrawn >= maxLines - 1) {
            // Truncate with ellipsis on last allowed line
            let truncated = line;
            while (
              truncated.length > 0 &&
              ctx.measureText(`${truncated}…`).width > maxWidth
            ) {
              truncated = truncated.slice(0, -1);
            }
            ctx.fillText(`${truncated}…`, x, y);
            return y + lineHeight;
          }
          ctx.fillText(line, x, y);
          y += lineHeight;
          linesDrawn++;
          line = words[i];
        } else {
          line = testLine;
        }
      }

      if (line) {
        if (linesDrawn >= maxLines) return y;
        ctx.fillText(line, x, y);
        y += lineHeight;
        linesDrawn++;
      }
    }

    return y;
  }

  /**
   * Generates a crisp 3D side caption plaque texture positioned next to each frame
   */
  static createCaptionTexture(
    frame: FrameItem,
    userRole: UserRole = 'teacher',
    aspectRatio: number = 0.72
  ): THREE.CanvasTexture {
    const baseHeight = 720;
    const canvasWidth = Math.max(320, Math.round(baseHeight * aspectRatio));
    const canvasHeight = baseHeight;

    const canvas = document.createElement('canvas');
    canvas.width = canvasWidth;
    canvas.height = canvasHeight;
    const ctx = canvas.getContext('2d')!;

    const hasContent =
      !!frame.imageUrl ||
      !!frame.videoUrl ||
      !!frame.embedCode ||
      !!frame.materialUrl ||
      !!frame.materialContent;

    const zonePalette: Record<
      string,
      { accent: string; soft: string; badge: string; label: string }
    > = {
      smartboard: {
        accent: '#0284c7',
        soft: '#e0f2fe',
        badge: 'BẢNG CHÍNH',
        label: 'Chú thích bảng',
      },
      gallery: {
        accent: '#2563eb',
        soft: '#dbeafe',
        badge: `ẢNH #${frame.slotIndex || 1}`,
        label: 'Kho hình ảnh',
      },
      cinema: {
        accent: '#7c3aed',
        soft: '#ede9fe',
        badge: `VIDEO #${frame.slotIndex || 1}`,
        label: 'Rạp video',
      },
      games: {
        accent: '#db2777',
        soft: '#fce7f3',
        badge: `TRÒ CHƠI #${frame.slotIndex || 1}`,
        label: 'Trò chơi',
      },
      materials: {
        accent: '#0d9488',
        soft: '#ccfbf1',
        badge: `HỌC LIỆU #${frame.slotIndex || 1}`,
        label: 'Học liệu số',
      },
    };

    const palette = zonePalette[frame.zone] || zonePalette.gallery;
    const typeLabels: Record<string, string> = {
      image: 'Hình ảnh',
      video: 'Video',
      game: 'Trò chơi nhúng',
      material: 'Tài liệu số',
    };

    const pad = Math.round(canvasWidth * 0.08);
    const innerW = canvasWidth - pad * 2;
    const isNarrow = canvasWidth < 400;

    // Clean bright frosted card background
    const bgGrad = ctx.createLinearGradient(0, 0, 0, canvasHeight);
    bgGrad.addColorStop(0, '#ffffff');
    bgGrad.addColorStop(1, '#f1f5f9');
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, canvasWidth, canvasHeight);

    // Top colored header strip
    const headerH = 92;
    ctx.fillStyle = palette.accent;
    ctx.fillRect(0, 0, canvasWidth, headerH);

    // Subtle accent bar at left edge
    ctx.fillStyle = palette.accent;
    ctx.fillRect(0, headerH, 10, canvasHeight - headerH);

    // Header label
    ctx.fillStyle = '#ffffff';
    ctx.font = `bold ${isNarrow ? 26 : 30}px system-ui, sans-serif`;
    ctx.textAlign = 'left';
    ctx.fillText('CHÚ THÍCH', pad, 44);

    ctx.fillStyle = 'rgba(255, 255, 255, 0.88)';
    ctx.font = `600 ${isNarrow ? 20 : 22}px system-ui, sans-serif`;
    ctx.fillText(palette.badge, pad, 76);

    // Outer border
    ctx.strokeStyle = 'rgba(15, 23, 42, 0.14)';
    ctx.lineWidth = 4;
    ctx.strokeRect(2, 2, canvasWidth - 4, canvasHeight - 4);

    // Frame Title
    let cursorY = headerH + 46;
    ctx.fillStyle = '#0f172a';
    ctx.font = `bold ${isNarrow ? 28 : 34}px system-ui, sans-serif`;
    ctx.textAlign = 'left';
    cursorY = this.drawWrappedText(
      ctx,
      frame.title || 'Khung nội dung',
      pad,
      cursorY,
      innerW,
      isNarrow ? 34 : 40,
      2
    );

    // Type & Status chip row
    cursorY += 8;
    const statusBg = hasContent ? '#dcfce7' : '#e2e8f0';
    const statusFg = hasContent ? '#15803d' : '#475569';
    const statusText = hasContent
      ? `● ${typeLabels[frame.type] || 'Nội dung'}`
      : `○ Trống • ${typeLabels[frame.type] || 'Khung'}`;

    ctx.fillStyle = statusBg;
    ctx.beginPath();
    ctx.roundRect(pad, cursorY - 24, innerW, 38, 10);
    ctx.fill();

    ctx.fillStyle = statusFg;
    ctx.font = `bold ${isNarrow ? 20 : 22}px system-ui, sans-serif`;
    ctx.fillText(statusText, pad + 12, cursorY + 2);

    cursorY += 34;

    // Divider line
    ctx.strokeStyle = '#cbd5e1';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(pad, cursorY);
    ctx.lineTo(canvasWidth - pad, cursorY);
    ctx.stroke();

    cursorY += 36;

    // Caption / Description body
    const noteText = frame.description?.trim();
    if (noteText) {
      ctx.fillStyle = '#334155';
      ctx.font = `500 ${isNarrow ? 23 : 26}px system-ui, sans-serif`;
      this.drawWrappedText(
        ctx,
        noteText,
        pad,
        cursorY,
        innerW,
        isNarrow ? 31 : 35,
        7
      );
    } else {
      ctx.fillStyle = '#64748b';
      ctx.font = `italic ${isNarrow ? 22 : 24}px system-ui, sans-serif`;
      const emptyCaption =
        userRole === 'teacher'
          ? 'Chưa có chú thích. Nhấn vào khung để thêm ghi chú hoặc nội dung.'
          : 'Chưa có chú thích cho khung này.';
      this.drawWrappedText(
        ctx,
        emptyCaption,
        pad,
        cursorY,
        innerW,
        isNarrow ? 30 : 34,
        6
      );
    }

    // Bottom footer bar
    const footerH = 66;
    ctx.fillStyle = palette.soft;
    ctx.fillRect(10, canvasHeight - footerH, canvasWidth - 12, footerH - 2);

    ctx.fillStyle = palette.accent;
    ctx.font = `bold ${isNarrow ? 20 : 22}px system-ui, sans-serif`;
    ctx.textAlign = 'center';
    const footerLabel =
      userRole === 'teacher'
        ? '✎ Nhấn để thêm / sửa'
        : hasContent
          ? '▶ Nhấn để xem'
          : 'Chỉ giáo viên chỉnh sửa';
    ctx.fillText(footerLabel, canvasWidth / 2, canvasHeight - 25);

    const texture = new THREE.CanvasTexture(canvas);
    texture.colorSpace = THREE.SRGBColorSpace;
    return texture;
  }
}

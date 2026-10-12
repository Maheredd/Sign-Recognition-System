import React, { useRef, useEffect } from 'react';
import { HAND_CONNECTIONS, FINGERTIP_INDICES } from '../hooks/useHandTracking';

const HandCanvas = ({
  hands = [],
  width = 640,
  height = 480,
  themeColor = '#38bdf8', // Neon blue or purple
  mirror = true,
  className = '',
}) => {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Clear previous frame
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    if (!hands || hands.length === 0) return;

    const time = performance.now() * 0.005;

    hands.forEach((hand, handIdx) => {
      const lms = hand.landmarks;
      if (!lms || lms.length < 21) return;

      const accent = handIdx === 0 ? themeColor : '#ec4899';

      // 1. Draw glowing connections
      ctx.save();
      ctx.lineWidth = 3;
      ctx.lineCap = 'round';
      ctx.strokeStyle = accent;
      ctx.shadowColor = accent;
      ctx.shadowBlur = 12;

      HAND_CONNECTIONS.forEach(([startIdx, endIdx]) => {
        const p1 = lms[startIdx];
        const p2 = lms[endIdx];

        const x1 = (mirror ? (1 - p1.x) : p1.x) * canvas.width;
        const y1 = p1.y * canvas.height;
        const x2 = (mirror ? (1 - p2.x) : p2.x) * canvas.width;
        const y2 = p2.y * canvas.height;

        ctx.beginPath();
        ctx.moveTo(x1, y1);
        ctx.lineTo(x2, y2);
        ctx.stroke();
      });
      ctx.restore();

      // 2. Draw regular joints
      lms.forEach((lm, idx) => {
        if (FINGERTIP_INDICES.includes(idx)) return; // Drawn separately with pulse

        const x = (mirror ? (1 - lm.x) : lm.x) * canvas.width;
        const y = lm.y * canvas.height;

        ctx.save();
        ctx.beginPath();
        ctx.arc(x, y, 4, 0, 2 * Math.PI);
        ctx.fillStyle = '#ffffff';
        ctx.shadowColor = accent;
        ctx.shadowBlur = 8;
        ctx.fill();
        ctx.restore();
      });

      // 3. Draw pulsating fingertips
      FINGERTIP_INDICES.forEach((tipIdx) => {
        const lm = lms[tipIdx];
        const x = (mirror ? (1 - lm.x) : lm.x) * canvas.width;
        const y = lm.y * canvas.height;

        const pulse = Math.sin(time + tipIdx) * 2 + 6;

        ctx.save();
        // Outer glowing ring
        ctx.beginPath();
        ctx.arc(x, y, pulse + 3, 0, 2 * Math.PI);
        ctx.strokeStyle = accent;
        ctx.lineWidth = 2;
        ctx.shadowColor = accent;
        ctx.shadowBlur = 16;
        ctx.stroke();

        // Inner solid core
        ctx.beginPath();
        ctx.arc(x, y, 5, 0, 2 * Math.PI);
        ctx.fillStyle = '#ffffff';
        ctx.fill();
        ctx.restore();
      });

      // 4. Draw handedness label above wrist
      const wrist = lms[0];
      const wx = (mirror ? (1 - wrist.x) : wrist.x) * canvas.width;
      const wy = Math.min(canvas.height - 15, wrist.y * canvas.height + 25);

      ctx.save();
      ctx.font = '600 11px sans-serif';
      ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
      ctx.fillRect(wx - 35, wy - 12, 70, 18);
      ctx.fillStyle = accent;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(`${hand.handedness || 'Hand'}`, wx, wy - 3);
      ctx.restore();
    });
  }, [hands, width, height, themeColor, mirror]);

  return (
    <canvas
      ref={canvasRef}
      width={width}
      height={height}
      className={`absolute inset-0 w-full h-full pointer-events-none ${className}`}
      aria-hidden="true"
    />
  );
};

export default HandCanvas;

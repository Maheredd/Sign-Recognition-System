import React, { useEffect, useRef, useState } from 'react';

const Cursor = () => {
  const cursorDotRef = useRef(null);
  const cursorOutlineRef = useRef(null);
  const [isTouchDevice] = useState(() => {
    if (typeof window === 'undefined') return false;
    return window.matchMedia('(pointer: coarse)').matches || !window.matchMedia('(hover: hover)').matches;
  });

  useEffect(() => {
    if (isTouchDevice) {
      return;
    }

    const cursorDot = cursorDotRef.current;
    const cursorOutline = cursorOutlineRef.current;
    if (!cursorDot || !cursorOutline) return;

    let mouseX = -100;
    let mouseY = -100;
    let outlineX = -100;
    let outlineY = -100;
    let animationFrameId = null;

    const onMouseMove = (e) => {
      mouseX = e.clientX;
      mouseY = e.clientY;
      cursorDot.style.left = `${mouseX}px`;
      cursorDot.style.top = `${mouseY}px`;
    };

    // Smooth lerp trailing animation loop for the outline
    const animate = () => {
      outlineX += (mouseX - outlineX) * 0.18;
      outlineY += (mouseY - outlineY) * 0.18;
      cursorOutline.style.left = `${outlineX}px`;
      cursorOutline.style.top = `${outlineY}px`;
      animationFrameId = requestAnimationFrame(animate);
    };
    animationFrameId = requestAnimationFrame(animate);

    // Event delegation for hover states - zero memory leak, no MutationObserver needed
    const onPointerOver = (e) => {
      const target = e.target;
      if (target && target.closest('a, button, input, textarea, select, [role="button"], .interactive-hover')) {
        cursorOutline.classList.add('cursor-hover');
      }
    };

    const onPointerOut = (e) => {
      const target = e.target;
      if (target && target.closest('a, button, input, textarea, select, [role="button"], .interactive-hover')) {
        cursorOutline.classList.remove('cursor-hover');
      }
    };

    const onMouseDown = () => {
      cursorOutline.style.transform = 'translate(-50%, -50%) scale(0.85)';
    };

    const onMouseUp = () => {
      cursorOutline.style.transform = 'translate(-50%, -50%) scale(1)';
    };

    window.addEventListener('mousemove', onMouseMove, { passive: true });
    window.addEventListener('mousedown', onMouseDown);
    window.addEventListener('mouseup', onMouseUp);
    document.addEventListener('pointerover', onPointerOver, { passive: true });
    document.addEventListener('pointerout', onPointerOut, { passive: true });

    return () => {
      if (animationFrameId) cancelAnimationFrame(animationFrameId);
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mousedown', onMouseDown);
      window.removeEventListener('mouseup', onMouseUp);
      document.removeEventListener('pointerover', onPointerOver);
      document.removeEventListener('pointerout', onPointerOut);
    };
  }, [isTouchDevice]);

  if (isTouchDevice) {
    return null;
  }

  return (
    <>
      <div ref={cursorDotRef} className="cursor-dot" aria-hidden="true" />
      <div ref={cursorOutlineRef} className="cursor-outline" aria-hidden="true" />
    </>
  );
};

export default Cursor;

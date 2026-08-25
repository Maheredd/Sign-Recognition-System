import React, { useEffect, useRef } from 'react';
import css from '../index.css?inline'; // Ensure styles are loaded if not global

const Cursor = () => {
    const cursorDotRef = useRef(null);
    const cursorOutlineRef = useRef(null);

    useEffect(() => {
        const cursorDot = cursorDotRef.current;
        const cursorOutline = cursorOutlineRef.current;

        if (!cursorDot || !cursorOutline) return;

        const moveCursor = (e) => {
            const { clientX, clientY } = e;

            // Direct movement for the dot
            cursorDot.style.left = `${clientX}px`;
            cursorDot.style.top = `${clientY}px`;

            // Smooth movement for the outline (using animate to avoid jank if possible, or simple trailing)
            cursorOutline.animate({
                left: `${clientX}px`,
                top: `${clientY}px`
            }, { duration: 500, fill: "forwards" });
        };

        const handleMouseDown = () => {
            cursorOutline.style.transform = "translate(-50%, -50%) scale(0.8)";
        };

        const handleMouseUp = () => {
            cursorOutline.style.transform = "translate(-50%, -50%) scale(1)";
        };

        // Add 'hover-active' class to cursor when hovering specific elements
        const handleLinkHoverEvents = () => {
            document.querySelectorAll('a, button, input[type="file"], .feature-card').forEach(el => {
                el.addEventListener('mouseenter', () => cursorOutline.classList.add('cursor-hover'));
                el.addEventListener('mouseleave', () => cursorOutline.classList.remove('cursor-hover'));
            });
        };

        // Initial attach
        handleLinkHoverEvents();

        // Re-attach on mutations (simple observer)
        const observer = new MutationObserver(handleLinkHoverEvents);
        observer.observe(document.body, { childList: true, subtree: true });

        window.addEventListener('mousemove', moveCursor);
        window.addEventListener('mousedown', handleMouseDown);
        window.addEventListener('mouseup', handleMouseUp);

        return () => {
            window.removeEventListener('mousemove', moveCursor);
            window.removeEventListener('mousedown', handleMouseDown);
            window.removeEventListener('mouseup', handleMouseUp);
            observer.disconnect();
        };
    }, []);

    return (
        <>
            <div ref={cursorDotRef} className="cursor-dot" />
            <div ref={cursorOutlineRef} className="cursor-outline" />
        </>
    );
};

export default Cursor;

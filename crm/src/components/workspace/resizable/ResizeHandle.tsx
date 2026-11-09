import React, { useRef, useState } from 'react';
import { LayoutDirection } from './types';
import './resizable.css';

interface ResizeHandleProps {
  id: string;
  direction?: LayoutDirection;
  isRtl?: boolean;
  onResize: (delta: number) => void;
  onReset?: () => void;
  ariaLabel?: string;
  currentSize?: number;
  minSize?: number;
  maxSize?: number;
  disabled?: boolean;
}

export const ResizeHandle: React.FC<ResizeHandleProps> = ({
  id,
  direction = 'horizontal',
  isRtl = false,
  onResize,
  onReset,
  ariaLabel = 'مقبض تغيير الحجم — Resize separator',
  currentSize = 250,
  minSize = 100,
  maxSize = 800,
  disabled = false,
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const dragStartPosRef = useRef<number>(0);
  const rafIdRef = useRef<number | null>(null);

  const isHorizontal = direction === 'horizontal';

  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (disabled || e.button !== 0) return;

    e.preventDefault();
    e.stopPropagation();

    const target = e.currentTarget;
    target.setPointerCapture(e.pointerId);

    dragStartPosRef.current = isHorizontal ? e.clientX : e.clientY;
    setIsDragging(true);

    if (typeof document !== 'undefined') {
      document.body.classList.add('ws-resizing-active');
    }
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!isDragging) return;

    e.preventDefault();
    const currentPos = isHorizontal ? e.clientX : e.clientY;
    let delta = currentPos - dragStartPosRef.current;

    // In horizontal RTL mode, dragging rightwards decreases a left panel's width
    if (isHorizontal && isRtl) {
      delta = -delta;
    }

    if (delta !== 0) {
      onResize(delta);
      dragStartPosRef.current = currentPos;
    }
  };

  const handlePointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!isDragging) return;

    try {
      e.currentTarget.releasePointerCapture(e.pointerId);
    } catch {
      // Ignore if pointer capture was already lost
    }

    setIsDragging(false);

    if (typeof document !== 'undefined') {
      document.body.classList.remove('ws-resizing-active');
    }
  };

  const handleDoubleClick = (e: React.MouseEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    if (onReset) {
      onReset();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (disabled) return;

    const step = e.shiftKey ? 30 : 10;
    let delta = 0;

    if (isHorizontal) {
      if (e.key === 'ArrowRight') {
        delta = isRtl ? -step : step;
      } else if (e.key === 'ArrowLeft') {
        delta = isRtl ? step : -step;
      }
    } else {
      if (e.key === 'ArrowDown') {
        delta = step;
      } else if (e.key === 'ArrowUp') {
        delta = -step;
      }
    }

    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      if (onReset) onReset();
      return;
    }

    if (delta !== 0) {
      e.preventDefault();
      onResize(delta);
    }
  };

  return (
    <div
      id={`handle-${id}`}
      role="separator"
      tabIndex={disabled ? -1 : 0}
      aria-orientation={direction}
      aria-valuenow={Math.round(currentSize)}
      aria-valuemin={minSize}
      aria-valuemax={maxSize}
      aria-label={ariaLabel}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerUp}
      onDoubleClick={handleDoubleClick}
      onKeyDown={handleKeyDown}
      className={`ws-resize-handle ws-resize-handle-${direction} ${
        isDragging ? 'is-dragging' : ''
      } ${disabled ? 'pointer-events-none opacity-0' : ''}`}
      title={ariaLabel}
    >
      <span className="ws-resize-handle-bar" />
      <span className="ws-handle-notch" aria-hidden="true" />
    </div>
  );
};

'use client';

import { useRef, useState, type ChangeEvent, type MouseEvent, type TouchEvent } from 'react';
import { cn } from '@/lib/utils';

interface ProgressBarProps {
  value: number;
  max: number;
  onChange: (value: number) => void;
  buffered?: number;
  formatTime?: (seconds: number) => string;
  className?: string;
}

/**
 * Audio progress bar component with seek functionality.
 * Shows playback progress, buffer progress, and time preview on hover/touch.
 */
export function ProgressBar({
  value,
  max,
  onChange,
  buffered = 0,
  formatTime,
  className = '',
}: ProgressBarProps) {
  const sliderRef = useRef<HTMLInputElement>(null);
  const [previewX, setPreviewX] = useState(0);
  const [previewTime, setPreviewTime] = useState('0:00');
  const [isHovering, setIsHovering] = useState(false);
  const [isDragging, setIsDragging] = useState(false);

  const percentage = max > 0 ? (value / max) * 100 : 0;
  const bufferedPercentage = max > 0 ? (buffered / max) * 100 : 0;

  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    onChange(Number(e.target.value));
  };

  const handleMouseEnter = () => {
    setIsHovering(true);
  };

  const handleMouseLeave = () => {
    setIsHovering(false);
  };

  const handleMouseMove = (e: MouseEvent<HTMLInputElement>) => {
    if (sliderRef.current) {
      const rect = sliderRef.current.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const percentage = Math.min(Math.max(x / rect.width, 0), 1);

      const previewTimeValue = percentage * max;
      const previewXPixels = percentage * rect.width;

      setPreviewX(previewXPixels);

      if (formatTime) {
        setPreviewTime(formatTime(previewTimeValue));
      }
    }
  };

  const handleTouchStart = (e: TouchEvent<HTMLInputElement>) => {
    setIsHovering(true);
    setIsDragging(true);
    updatePreviewFromTouch(e);
  };

  const handleTouchMove = (e: TouchEvent<HTMLInputElement>) => {
    if (isDragging) {
      updatePreviewFromTouch(e);
    }
  };

  const handleTouchEnd = () => {
    setIsDragging(false);
    setTimeout(() => setIsHovering(false), 200);
  };

  const updatePreviewFromTouch = (e: TouchEvent<HTMLInputElement>) => {
    if (sliderRef.current) {
      const rect = sliderRef.current.getBoundingClientRect();
      const touch = e.touches[0];
      const x = touch.clientX - rect.left;
      const percentage = Math.min(Math.max(x / rect.width, 0), 1);

      const previewTimeValue = percentage * max;
      const previewXPixels = percentage * rect.width;

      setPreviewX(previewXPixels);

      if (formatTime) {
        setPreviewTime(formatTime(previewTimeValue));
      }
    }
  };

  return (
    <div
      className={cn('relative group', className)}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      <input
        ref={sliderRef}
        type="range"
        min="0"
        max={max || 100}
        value={value}
        onChange={handleChange}
        onMouseMove={handleMouseMove}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        className="progress-slider"
        style={{
          background: `linear-gradient(to right,
            rgba(255, 255,255, 0.4) 0%,
            rgba(255, 255,255, 0.4) ${bufferedPercentage}%,
            white ${bufferedPercentage}%,
            white ${percentage}%,
            rgba(255, 255,255, 0.2) ${percentage}%,
            rgba(255, 255,255, 0.2) 100%)`,
        }}
      />

      {(isHovering || isDragging) && formatTime && (
        <div
          className="absolute -top-8 -translate-x-1/2 px-2 py-1 bg-zinc-800 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none"
          style={{
            left: `${previewX}px`,
            opacity: (isHovering || isDragging) ? 1 : 0,
          }}
        >
          {previewTime}
        </div>
      )}
    </div>
  );
}

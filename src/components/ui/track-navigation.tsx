'use client';

import { ChevronLeft, ChevronRight } from 'lucide-react';
import { ControlButton } from './control-button';

interface TrackNavigationProps {
  onPrevious: () => void;
  onNext: () => void;
  disabled?: boolean;
}

/**
 * Track navigation buttons for skipping to previous/next track.
 * Uses large chevron icons for easy touch targets.
 */
export function TrackNavigation({ onPrevious, onNext, disabled = false }: TrackNavigationProps) {
  return (
    <div className="flex items-center gap-4">
      <ControlButton
        variant="icon"
        onClick={onPrevious}
        disabled={disabled}
        aria-label="이전 트랙"
      >
        <ChevronLeft size={28} />
      </ControlButton>
      <ControlButton
        variant="icon"
        onClick={onNext}
        disabled={disabled}
        aria-label="다음 트랙"
      >
        <ChevronRight size={28} />
      </ControlButton>
    </div>
  );
}

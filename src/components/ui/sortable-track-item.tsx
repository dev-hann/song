'use client';

import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { GripVertical } from 'lucide-react';
import { TrackItem } from '@/components/ui/track-item';

interface SortableTrackItemProps {
  id: string;
  title: string;
  channel: string;
  thumbnail: string;
  duration: number;
  isActive?: boolean;
  onClick?: () => void;
  onMore?: () => void;
}

export function SortableTrackItem({
  id,
  title,
  channel,
  thumbnail,
  duration,
  isActive,
  onClick,
  onMore,
}: SortableTrackItemProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    ...(isDragging && {
      zIndex: 50,
      position: 'relative' as const,
      boxShadow: '0 4px 12px rgba(0, 0, 0, 0.2)',
      borderRadius: '12px',
      backgroundColor: 'var(--surface-elevated)',
    }),
  };

  return (
    <div ref={setNodeRef} style={style} className={isDragging ? 'opacity-90' : ''}>
      <div className="flex items-center">
        <button
          {...attributes}
          {...listeners}
          className="p-2 -ml-1 rounded-lg active:bg-white/5 touch-none"
          style={{ touchAction: 'none' }}
        >
          <GripVertical size={18} className="text-muted" />
        </button>
        <div className="flex-1 -ml-1">
          <TrackItem
            id={id}
            title={title}
            channel={channel}
            thumbnail={thumbnail}
            duration={duration}
            isActive={isActive}
            onClick={onClick}
            onMore={onMore}
          />
        </div>
      </div>
    </div>
  );
}

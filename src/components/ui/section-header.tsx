import { ChevronRight } from 'lucide-react';

interface SectionHeaderProps {
  title: string;
  actionLabel?: string;
  onAction?: () => void;
}

export function SectionHeader({ title, actionLabel, onAction }: SectionHeaderProps) {
  return (
    <div className="flex items-center justify-between mb-3">
      <h2 className="text-lg font-bold text-foreground">{title}</h2>
      {actionLabel && onAction && (
        <button
          onClick={onAction}
          className="flex items-center gap-0.5 text-sm text-muted active:text-foreground transition-colors"
        >
          {actionLabel}
          <ChevronRight size={16} />
        </button>
      )}
    </div>
  );
}

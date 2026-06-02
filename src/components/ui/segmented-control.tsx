import { cn } from '@/lib/utils';

interface SegmentedControlOption {
  key: string;
  label: string;
}

interface SegmentedControlProps {
  options: SegmentedControlOption[];
  value: string;
  onChange: (key: string) => void;
  size?: 'sm' | 'md';
  className?: string;
}

export function SegmentedControl({
  options,
  value,
  onChange,
  size = 'sm',
  className,
}: SegmentedControlProps) {
  return (
    <div className={cn('flex gap-1', className)}>
      {options.map((option) => (
        <button
          key={option.key}
          onClick={() => { onChange(option.key); }}
          className={cn(
            'rounded-full font-medium transition-colors',
            size === 'sm' && 'px-3 py-1.5 text-xs',
            size === 'md' && 'px-4 py-2 text-sm',
            value === option.key
              ? 'bg-foreground text-background'
              : 'bg-accent text-muted active:text-foreground',
          )}
        >
          {option.label}
        </button>
      ))}
    </div>
  );
}

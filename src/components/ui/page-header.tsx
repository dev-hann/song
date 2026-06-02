import { ArrowLeft } from 'lucide-react';
import { cn } from '@/lib/utils';

interface PageHeaderProps {
  title?: string;
  onBack?: () => void;
  right?: React.ReactNode;
  className?: string;
}

export function PageHeader({ title, onBack, right, className }: PageHeaderProps) {
  return (
    <div className={cn('px-4 flex items-center gap-3 mb-4', className)}>
      {onBack && (
        <button
          onClick={onBack}
          className="p-2 -ml-2 rounded-full active:bg-accent"
        >
          <ArrowLeft size={20} className="text-foreground" />
        </button>
      )}
      {title && <h1 className="text-xl font-bold text-foreground">{title}</h1>}
      {right && <div className="ml-auto flex items-center gap-2">{right}</div>}
    </div>
  );
}

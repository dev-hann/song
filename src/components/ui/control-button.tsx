import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

interface ControlButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  size?: 'sm' | 'md' | 'lg';
  variant?: 'default' | 'ghost' | 'icon';
  active?: boolean;
}

const controlButtonVariants = cva(
  'flex items-center justify-center rounded-full',
  {
    variants: {
      size: {
        sm: 'w-11 h-11',
        md: 'w-11 h-11',
        lg: 'w-16 h-16',
      },
      variant: {
        default: 'bg-foreground text-background',
        ghost: 'text-foreground hover:bg-active-medium',
        icon: 'text-foreground active:scale-95 transition-transform',
      },
      active: {
        true: 'bg-surface-elevated',
        false: '',
      },
    },
    defaultVariants: {
      size: 'md',
      variant: 'default',
      active: false,
    },
  }
);

function ControlButton({
  size = 'md',
  variant = 'default',
  active = false,
  className,
  children,
  ref,
  ...props
}: ControlButtonProps & { ref?: React.Ref<HTMLButtonElement> }) {
  return (
    <button
      ref={ref}
      data-slot="control-button"
      className={cn(controlButtonVariants({ size, variant, active }), className)}
      {...props}
    >
      {children}
    </button>
  );
}

export { ControlButton, controlButtonVariants };

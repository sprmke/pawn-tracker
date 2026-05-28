import { cn } from '@/lib/utils';
import { Landmark } from 'lucide-react';

interface LogoProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  showIcon?: boolean;
  gradient?: boolean;
  animated?: boolean;
  className?: string;
}

const sizeClasses = {
  sm: 'text-base',
  md: 'text-lg',
  lg: 'text-xl',
  xl: 'text-2xl',
};

const iconSizeClasses = {
  sm: 'h-4 w-4',
  md: 'h-5 w-5',
  lg: 'h-6 w-6',
  xl: 'h-7 w-7',
};

const iconContainerClasses = {
  sm: 'h-8 w-8 rounded-xl',
  md: 'h-9 w-9 rounded-xl',
  lg: 'h-10 w-10 rounded-2xl',
  xl: 'h-11 w-11 rounded-2xl',
};

export function Logo({
  size = 'md',
  showIcon = false,
  gradient = false,
  animated = false,
  className,
}: LogoProps) {
  return (
    <span
      className={cn(
        'font-extrabold inline-flex items-center gap-2.5 tracking-tight',
        sizeClasses[size],
        gradient
          ? 'text-foreground'
          : 'text-foreground',
        animated && 'transition-all duration-300',
        className
      )}
    >
      {showIcon && (
        <span
          className={cn(
            'inline-flex items-center justify-center bg-gradient-to-br from-primary to-chart-5 shadow-[var(--shadow-soft)]',
            iconContainerClasses[size]
          )}
        >
          <Landmark
            className={cn(
              iconSizeClasses[size],
              'text-primary-foreground'
            )}
          />
        </span>
      )}
      <span className={cn(gradient && 'bg-gradient-to-r from-foreground via-foreground to-muted-foreground bg-clip-text text-transparent')}>
        Pawn<span className="text-primary">Tracker</span>
      </span>
    </span>
  );
}

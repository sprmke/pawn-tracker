import { cn } from '@/lib/utils';
import { Coins } from 'lucide-react';

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
        'font-semibold inline-flex items-center gap-2',
        sizeClasses[size],
        gradient &&
          'bg-gradient-to-r from-primary to-chart-2 bg-clip-text text-transparent',
        animated && 'transition-all duration-300',
        className
      )}
    >
      {showIcon && (
        <Coins
          className={cn(
            iconSizeClasses[size],
            gradient ? 'text-primary' : 'text-current'
          )}
        />
      )}
      Pawn Tracker
    </span>
  );
}



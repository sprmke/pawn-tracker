'use client';

import { cn } from '@/lib/utils';
import { ReactNode } from 'react';
import { useInView } from './hooks/use-in-view';

interface ScrollRevealProps {
  children: ReactNode;
  className?: string;
  delay?: number;
  direction?: 'up' | 'down' | 'left' | 'right' | 'none';
}

const directionClasses = {
  up: 'translate-y-10',
  down: '-translate-y-10',
  left: 'translate-x-10',
  right: '-translate-x-10',
  none: '',
};

export function ScrollReveal({
  children,
  className,
  delay = 0,
  direction = 'up',
}: ScrollRevealProps) {
  const { ref, isInView } = useInView<HTMLDivElement>();

  return (
    <div
      ref={ref}
      className={cn(
        'transition-all duration-700 ease-out will-change-transform',
        isInView
          ? 'translate-x-0 translate-y-0 opacity-100'
          : cn('opacity-0', directionClasses[direction]),
        className,
      )}
      style={{ transitionDelay: `${delay}ms` }}
    >
      {children}
    </div>
  );
}

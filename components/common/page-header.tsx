import { ReactNode } from 'react';
import { cn } from '@/lib/utils';
import { PriceVisibilityToggle } from './price-visibility-toggle';

interface PageHeaderProps {
  title: string;
  description?: string;
  eyebrow?: string;
  actions?: ReactNode;
  className?: string;
  showPriceToggle?: boolean;
}

export function PageHeader({
  title,
  description,
  eyebrow,
  actions,
  className,
  showPriceToggle = true,
}: PageHeaderProps) {
  return (
    <div
      className={cn(
        'flex flex-col gap-4 md:flex-row md:items-end md:justify-between mb-8 md:mb-10',
        className
      )}
    >
      <div className="space-y-2 max-w-2xl">
        {eyebrow && <p className="section-eyebrow">{eyebrow}</p>}
        <div className="flex items-center gap-2.5 flex-wrap">
          <h1 className="text-xl font-bold tracking-tight text-foreground sm:text-2xl md:text-3xl">
            {title}
          </h1>
          {showPriceToggle && <PriceVisibilityToggle />}
        </div>
        {description && (
          <p className="text-sm md:text-base text-muted-foreground leading-relaxed">
            {description}
          </p>
        )}
      </div>
      {actions && (
        <div className="flex items-center gap-2 flex-wrap shrink-0">
          {actions}
        </div>
      )}
    </div>
  );
}

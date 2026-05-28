'use client';

import { Eye, EyeOff } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { usePriceVisibilityStore } from '@/stores/price-visibility-store';
import { cn } from '@/lib/utils';

interface PriceVisibilityToggleProps {
  className?: string;
}

export function PriceVisibilityToggle({ className }: PriceVisibilityToggleProps) {
  const pricesHidden = usePriceVisibilityStore((state) => state.pricesHidden);
  const togglePricesHidden = usePriceVisibilityStore(
    (state) => state.togglePricesHidden
  );

  return (
    <Button
      type="button"
      variant="outline"
      size="icon"
      className={cn('h-9 w-9 shrink-0', className)}
      onClick={togglePricesHidden}
      title={
        pricesHidden
          ? 'Show sensitive data (names, amounts, dates, rates)'
          : 'Hide sensitive data (names, amounts, dates, rates)'
      }
      aria-label={
        pricesHidden
          ? 'Show sensitive data'
          : 'Hide sensitive data'
      }
      aria-pressed={pricesHidden}
    >
      {pricesHidden ? (
        <EyeOff className="h-4 w-4" />
      ) : (
        <Eye className="h-4 w-4" />
      )}
    </Button>
  );
}

'use client';

import { ReactNode, useEffect } from 'react';
import { usePriceVisibilityStore } from '@/stores/price-visibility-store';

interface PriceVisibilityShellProps {
  children: ReactNode;
}

export function PriceVisibilityShell({ children }: PriceVisibilityShellProps) {
  const pricesHidden = usePriceVisibilityStore((state) => state.pricesHidden);

  useEffect(() => {
    document.documentElement.classList.toggle('prices-hidden', pricesHidden);
    return () => {
      document.documentElement.classList.remove('prices-hidden');
    };
  }, [pricesHidden]);

  return (
    <div key={pricesHidden ? 'prices-hidden' : 'prices-visible'} className="contents">
      {children}
    </div>
  );
}

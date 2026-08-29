'use client';

import { ReactNode, useEffect } from 'react';
import { useSensitiveDataHidden } from '@/hooks';

interface PriceVisibilityShellProps {
  children: ReactNode;
}

/**
 * Mirrors the sensitive-data toggle onto `<html>` so stylesheets and print rules
 * can react to it. Masking itself is handled per-subtree via
 * {@link useSensitiveDataHidden}; this shell must never remount `children`,
 * otherwise toggling would discard page state and refetch every list.
 */
export function PriceVisibilityShell({ children }: PriceVisibilityShellProps) {
  const pricesHidden = useSensitiveDataHidden();

  useEffect(() => {
    document.documentElement.classList.toggle('prices-hidden', pricesHidden);
    return () => {
      document.documentElement.classList.remove('prices-hidden');
    };
  }, [pricesHidden]);

  return <>{children}</>;
}

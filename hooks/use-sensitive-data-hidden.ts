'use client';

import { usePriceVisibilityStore } from '@/stores/price-visibility-store';

/**
 * Subscribes a client subtree to the sensitive-data toggle.
 *
 * The `format*` helpers read the store imperatively via `getState()`, so React
 * cannot tell that a component depends on it. Call this once in every client
 * boundary root that renders sensitive values; the resulting re-render cascades
 * through the subtree and keeps component state, scroll, and fetched data intact.
 */
export function useSensitiveDataHidden(): boolean {
  return usePriceVisibilityStore((state) => state.pricesHidden);
}

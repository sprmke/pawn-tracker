import { usePriceVisibilityStore } from '@/stores/price-visibility-store';

export const HIDDEN_CURRENCY_DISPLAY = '₱ ••••••';
export const HIDDEN_PERCENTAGE_DISPLAY = '•••%';

export function arePricesHidden(): boolean {
  if (typeof window == 'undefined') return false;
  return usePriceVisibilityStore.getState().pricesHidden;
}

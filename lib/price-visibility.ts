import { usePriceVisibilityStore } from '@/stores/price-visibility-store';

/** Masked currency (PHP). */
export const HIDDEN_CURRENCY_DISPLAY = '₱ ••••••';
/** Masked percentage. */
export const HIDDEN_PERCENTAGE_DISPLAY = '•••%';
/** Masked text (names, types, notes snippets). */
export const HIDDEN_TEXT_DISPLAY = '••••••';
/** Masked long date. */
export const HIDDEN_DATE_DISPLAY = '•• ••, ••••';
/** Masked short date. */
export const HIDDEN_SHORT_DATE_DISPLAY = '•• ••';
/** Masked counts and numeric totals. */
export const HIDDEN_COUNT_DISPLAY = '••';

/** When true, amounts, names, dates, rates, and counts are redacted in the UI. */
export function isSensitiveDataHidden(): boolean {
  if (typeof window === 'undefined') return false;
  return usePriceVisibilityStore.getState().pricesHidden;
}

/** @deprecated Use {@link isSensitiveDataHidden}. */
export const arePricesHidden = isSensitiveDataHidden;

function maskOrFormat<T>(
  hidden: boolean,
  value: T | null | undefined,
  formatVisible: (v: T) => string,
  hiddenDisplay: string,
  emptyDisplay = '—',
): string {
  if (hidden) return hiddenDisplay;
  if (value === null || value === undefined || value === '') return emptyDisplay;
  return formatVisible(value as T);
}

/** Names, loan labels, transaction titles, status/type strings, emails, etc. */
export function formatSensitiveText(
  value: string | number | null | undefined,
): string {
  return maskOrFormat(
    isSensitiveDataHidden(),
    value == null ? value : String(value),
    (v) => v,
    HIDDEN_TEXT_DISPLAY,
    '—',
  );
}

/** Integer or decimal counts (loan counts, list lengths shown as numbers). */
export function formatSensitiveCount(
  value: number | string | null | undefined,
): string {
  return maskOrFormat(
    isSensitiveDataHidden(),
    value,
    (v) => {
      const n = typeof v === 'number' ? v : parseFloat(String(v));
      if (Number.isNaN(n)) return String(v);
      return Number.isInteger(n) ? String(n) : n.toLocaleString('en-PH');
    },
    HIDDEN_COUNT_DISPLAY,
    '0',
  );
}

/** Square meters and similar unit suffixes. */
export function formatSensitiveSqm(
  value: number | null | undefined,
): string {
  if (!value) return '—';
  if (isSensitiveDataHidden()) return `${HIDDEN_COUNT_DISPLAY} sqm`;
  return `${value.toLocaleString('en-PH')} sqm`;
}

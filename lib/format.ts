/**
 * Formatting utilities for consistent display across the application
 */

import { getTodayAtMidnight, normalizeToMidnight } from './date-utils';
import {
  isSensitiveDataHidden,
  HIDDEN_CURRENCY_DISPLAY,
  HIDDEN_PERCENTAGE_DISPLAY,
  HIDDEN_DATE_DISPLAY,
  HIDDEN_SHORT_DATE_DISPLAY,
  formatSensitiveText,
  formatSensitiveCount,
  formatSensitiveSqm,
} from './price-visibility';

export {
  formatSensitiveText,
  formatSensitiveCount,
  formatSensitiveSqm,
  isSensitiveDataHidden,
} from './price-visibility';

/** Alias for names, titles, types, status labels, emails, etc. */
export const formatText = formatSensitiveText;

/** Alias for numeric counts shown in the UI. */
export const formatCount = formatSensitiveCount;

/** Alias for free-lot / area values. */
export const formatSqm = formatSensitiveSqm;

/**
 * Format a number or string as Philippine Peso currency
 */
export function formatCurrency(amount: string | number): string {
  if (isSensitiveDataHidden()) return HIDDEN_CURRENCY_DISPLAY;

  const numAmount = typeof amount === 'string' ? parseFloat(amount) : amount;
  return new Intl.NumberFormat('en-PH', {
    style: 'currency',
    currency: 'PHP',
  }).format(numAmount);
}

/**
 * Format a number or string as Philippine Peso currency without decimals
 */
export function formatCurrencyCompact(amount: string | number): string {
  if (isSensitiveDataHidden()) return HIDDEN_CURRENCY_DISPLAY;

  const numAmount = typeof amount === 'string' ? parseFloat(amount) : amount;
  return new Intl.NumberFormat('en-PH', {
    style: 'currency',
    currency: 'PHP',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(numAmount);
}

/**
 * Format a date as a localized string (e.g., "January 1, 2024")
 */
export function formatDate(date: Date | string): string {
  if (isSensitiveDataHidden()) return HIDDEN_DATE_DISPLAY;

  const dateObj = typeof date === 'string' ? new Date(date) : date;
  return dateObj.toLocaleDateString('en-PH', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

/**
 * Format a date as a short localized string (e.g., "Jan 1, 2024")
 */
export function formatDateShort(date: Date | string): string {
  if (isSensitiveDataHidden()) return HIDDEN_SHORT_DATE_DISPLAY;

  const dateObj = typeof date === 'string' ? new Date(date) : date;
  return dateObj.toLocaleDateString('en-PH', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

/**
 * Format a date as a very short string (e.g., "Jan 1")
 */
export function formatDateVeryShort(date: Date | string): string {
  if (isSensitiveDataHidden()) return HIDDEN_SHORT_DATE_DISPLAY;

  const dateObj = typeof date === 'string' ? new Date(date) : date;
  return dateObj.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
  });
}

/**
 * Check if a date is in the future (compared to today at midnight)
 * Uses normalized date comparison for consistency across the app
 */
export function isFutureDate(date: Date | string): boolean {
  const today = getTodayAtMidnight();
  const checkDate = normalizeToMidnight(date);
  return checkDate > today;
}

/**
 * Format a percentage value
 */
export function formatPercentage(value: number, decimals: number = 2): string {
  if (isSensitiveDataHidden()) return HIDDEN_PERCENTAGE_DISPLAY;
  return `${value.toFixed(decimals)}%`;
}

/** Format rate with optional "(Fixed)" suffix preserved when visible. */
export function formatRateLabel(
  value: number,
  options?: { fixed?: boolean; decimals?: number },
): string {
  if (isSensitiveDataHidden()) return HIDDEN_PERCENTAGE_DISPLAY;
  const rate = `${value.toFixed(options?.decimals ?? 2)}%`;
  return options?.fixed ? `${rate} (Fixed)` : rate;
}

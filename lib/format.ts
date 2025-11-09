/**
 * Formatting utilities for consistent display across the application
 */

import { getTodayAtMidnight, normalizeToMidnight } from './date-utils';

/**
 * Format a number or string as Philippine Peso currency
 */
export function formatCurrency(amount: string | number): string {
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
  return `${value.toFixed(decimals)}%`;
}

/**
 * PDF Export types and utilities
 */

/**
 * A configurable section/field for PDF export.
 * Used in the column-selection modal and PDF document rendering.
 */
export interface PDFSection<T = unknown> {
  key: string;
  header: string;
  description?: string;
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  _phantom?: T; // phantom type for TypeScript inference
}

/**
 * Formats a date as MM/DD/YYYY for PDF output
 */
export function formatDateForPDF(date: Date | string | null | undefined): string {
  if (!date) return '—';
  const d = new Date(date);
  if (isNaN(d.getTime())) return '—';
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  const year = d.getFullYear();
  return `${month}/${day}/${year}`;
}

/**
 * Formats a number as Philippine Peso currency for PDF output
 */
export function formatCurrencyForPDF(amount: string | number | null | undefined): string {
  if (amount === null || amount === undefined) return 'P0.00';
  const numValue = typeof amount === 'string' ? parseFloat(amount) : amount;
  if (isNaN(numValue)) return 'P0.00';
  const formatted = numValue.toLocaleString('en-PH', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
  return `P${formatted}`;
}

/**
 * Triggers a Blob download in the browser
 */
export function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.style.display = 'none';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * PDF brand colors (hex) matching the app's badge color system
 */
export const PDF_COLORS = {
  // Status colors
  fullyFunded: '#10b981',
  partiallyFunded: '#f59e0b',
  completed: '#0ea5e9',
  overdue: '#ef4444',
  // Type colors
  lotTitle: '#f97316',
  orcr: '#6366f1',
  agent: '#d946ef',
  // Period status
  pending: '#f59e0b',
  incomplete: '#f97316',
  // Text
  primary: '#0f172a',
  secondary: '#475569',
  muted: '#94a3b8',
  // Surfaces
  white: '#ffffff',
  background: '#f8fafc',
  border: '#e2e8f0',
  sectionBg: '#f1f5f9',
  // Accents
  accentBlue: '#3b82f6',
  accentBlueBg: '#eff6ff',
} as const;

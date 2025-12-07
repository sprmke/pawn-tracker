/**
 * CSV Export Utility
 * Handles conversion of data to CSV format and triggers download
 */

export interface CSVColumn<T> {
  header: string;
  accessor: (row: T) => string | number | null | undefined;
}

/**
 * Converts data to CSV format
 */
export function convertToCSV<T>(
  data: T[],
  columns: CSVColumn<T>[]
): string {
  if (data.length === 0) {
    return '';
  }

  // Create header row
  const headers = columns.map((col) => col.header);
  const headerRow = headers.map(escapeCSVValue).join(',');

  // Create data rows
  const dataRows = data.map((row) => {
    return columns
      .map((col) => {
        const value = col.accessor(row);
        return escapeCSVValue(value);
      })
      .join(',');
  });

  // Combine header and data rows
  return [headerRow, ...dataRows].join('\n');
}

/**
 * Escapes CSV values to handle commas, quotes, and newlines
 */
function escapeCSVValue(value: string | number | null | undefined): string {
  if (value === null || value === undefined) {
    return '';
  }

  const stringValue = String(value);

  // If value contains comma, quote, or newline, wrap in quotes and escape existing quotes
  if (
    stringValue.includes(',') ||
    stringValue.includes('"') ||
    stringValue.includes('\n')
  ) {
    return `"${stringValue.replace(/"/g, '""')}"`;
  }

  return stringValue;
}

/**
 * Triggers a CSV file download in the browser
 */
export function downloadCSV(
  csvContent: string,
  filename: string
): void {
  // Add BOM for proper UTF-8 encoding in Excel
  const BOM = '\uFEFF';
  const blob = new Blob([BOM + csvContent], {
    type: 'text/csv;charset=utf-8;',
  });

  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);

  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  link.style.visibility = 'hidden';

  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);

  // Clean up the URL object
  URL.revokeObjectURL(url);
}

/**
 * Formats a date for CSV export
 */
export function formatDateForCSV(date: Date | string): string {
  const d = new Date(date);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Formats currency for CSV export (removes currency symbol)
 */
export function formatCurrencyForCSV(amount: string | number): string {
  const numValue = typeof amount === 'string' ? parseFloat(amount) : amount;
  return numValue.toFixed(2);
}


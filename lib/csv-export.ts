/**
 * CSV Export Utility
 * Handles conversion of data to CSV format and triggers download
 */

export interface CSVColumn<T> {
  header: string;
  accessor: (row: T) => string | number | null | undefined;
  summable?: boolean; // Whether this column should be summed in the total row
}

/**
 * Converts data to CSV format
 */
export function convertToCSV<T>(data: T[], columns: CSVColumn<T>[]): string {
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

  // Create total row if there are summable columns
  const hasSummableColumns = columns.some((col) => col.summable);
  const rows = [headerRow, ...dataRows];

  if (hasSummableColumns && data.length > 0) {
    const totalRow = columns
      .map((col, index) => {
        // First column shows "TOTAL" label
        if (index === 0) {
          return escapeCSVValue('TOTAL');
        }

        // Sum up numeric values for summable columns
        if (col.summable) {
          const sum = data.reduce((acc, row) => {
            const value = col.accessor(row);
            // Extract numeric value from formatted currency strings (e.g., "P1,234.56" -> 1234.56)
            const numValue = extractNumericValue(value);
            return acc + numValue;
          }, 0);

          // Format the sum as currency
          return escapeCSVValue(formatCurrencyForCSV(sum));
        }

        // Empty cell for non-summable columns
        return '';
      })
      .join(',');

    rows.push(totalRow);
  }

  return rows.join('\n');
}

/**
 * Extracts numeric value from a string or number
 * Handles formatted currency strings like "P1,234.56"
 */
function extractNumericValue(
  value: string | number | null | undefined
): number {
  if (value === null || value === undefined) {
    return 0;
  }

  if (typeof value === 'number') {
    return value;
  }

  // Remove currency symbols, commas, and other non-numeric characters except decimal point and minus
  const cleaned = String(value).replace(/[^0-9.-]/g, '');
  const parsed = parseFloat(cleaned);

  return isNaN(parsed) ? 0 : parsed;
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
export function downloadCSV(csvContent: string, filename: string): void {
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
 * Formats currency for CSV export with peso sign and thousand separators
 */
export function formatCurrencyForCSV(amount: string | number): string {
  const numValue = typeof amount === 'string' ? parseFloat(amount) : amount;

  // Format with thousand separators and 2 decimal places
  const formatted = numValue.toLocaleString('en-PH', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

  return `P${formatted}`;
}

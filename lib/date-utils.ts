/**
 * Converts a Date object to a local date string in YYYY-MM-DD format
 * This prevents timezone issues when converting dates for form inputs
 */
export function toLocalDateString(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Converts a date string (YYYY-MM-DD) to a Date object at local midnight
 * This ensures the date is interpreted in the local timezone
 */
export function fromLocalDateString(dateString: string): Date {
  const [year, month, day] = dateString.split('-').map(Number);
  return new Date(year, month - 1, day);
}

/**
 * Calculate the number of months between two dates
 * Returns the number of full months between the dates
 */
export function getMonthsBetweenDates(
  startDate: Date | string,
  endDate: Date | string
): number {
  const start = typeof startDate === 'string' ? new Date(startDate) : startDate;
  const end = typeof endDate === 'string' ? new Date(endDate) : endDate;

  const yearDiff = end.getFullYear() - start.getFullYear();
  const monthDiff = end.getMonth() - start.getMonth();
  const dayDiff = end.getDate() - start.getDate();

  let months = yearDiff * 12 + monthDiff;

  // If the end day is before the start day, we haven't completed a full month
  if (dayDiff < 0) {
    months -= 1;
  }

  return Math.max(0, months);
}

/**
 * Check if the duration between two dates is more than one month
 */
export function isMoreThanOneMonth(
  startDate: Date | string,
  endDate: Date | string
): boolean {
  return getMonthsBetweenDates(startDate, endDate) >= 1;
}

/**
 * Add months to a date
 */
export function addMonths(date: Date | string, months: number): Date {
  const d = typeof date === 'string' ? new Date(date) : new Date(date);
  d.setMonth(d.getMonth() + months);
  return d;
}

/**
 * Generate default interest periods based on sent date and due date
 */
export function generateDefaultInterestPeriods(
  sentDate: Date | string,
  dueDate: Date | string
): Array<{ dueDate: Date; monthNumber: number }> {
  const months = getMonthsBetweenDates(sentDate, dueDate);
  const periods: Array<{ dueDate: Date; monthNumber: number }> = [];

  for (let i = 1; i <= months; i++) {
    periods.push({
      dueDate: addMonths(sentDate, i),
      monthNumber: i,
    });
  }

  return periods;
}

/**
 * Normalize a date to midnight (00:00:00) for date-only comparisons
 * This creates a new Date object to avoid mutating the original
 */
export function normalizeToMidnight(date: Date | string): Date {
  const d = typeof date === 'string' ? new Date(date) : new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
}

/**
 * Get today's date normalized to midnight
 */
export function getTodayAtMidnight(): Date {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return today;
}

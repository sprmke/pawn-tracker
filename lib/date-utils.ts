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
 * Returns true only if there are 2 or more full months between the dates
 */
export function isMoreThanOneMonth(
  startDate: Date | string,
  endDate: Date | string
): boolean {
  return getMonthsBetweenDates(startDate, endDate) > 1;
}

/**
 * Check if the duration between two dates is more than one month and 15 days (45 days total)
 * This is used to automatically trigger multiple interest periods
 */
export function isMoreThanOneMonthAndFifteenDays(
  startDate: Date | string,
  endDate: Date | string
): boolean {
  const start = typeof startDate === 'string' ? new Date(startDate) : startDate;
  const end = typeof endDate === 'string' ? new Date(endDate) : endDate;
  
  // Calculate the difference in milliseconds
  const diffMs = end.getTime() - start.getTime();
  
  // Convert to days (45 days = 1 month + 15 days)
  const diffDays = diffMs / (1000 * 60 * 60 * 24);
  
  return diffDays > 45;
}

/**
 * Add months to a date, intelligently handling the day of month
 * If the target month has fewer days than the source day, it will use the last day of that month
 */
export function addMonths(date: Date | string, months: number): Date {
  const d = typeof date === 'string' ? new Date(date) : new Date(date);
  const originalDay = d.getDate();
  
  // Set to the first day to avoid issues with month boundaries
  d.setDate(1);
  d.setMonth(d.getMonth() + months);
  
  // Get the last day of the target month
  const lastDayOfMonth = new Date(d.getFullYear(), d.getMonth() + 1, 0).getDate();
  
  // Use the original day or the last day of the month, whichever is smaller
  d.setDate(Math.min(originalDay, lastDayOfMonth));
  
  return d;
}

/**
 * Subtract months from a date, intelligently handling the day of month
 * If the target month has fewer days than the source day, it will use the last day of that month
 */
export function subtractMonths(date: Date | string, months: number): Date {
  return addMonths(date, -months);
}

/**
 * Get the last day of a given month
 */
function getLastDayOfMonth(year: number, month: number): number {
  return new Date(year, month + 1, 0).getDate();
}

/**
 * Calculate the appropriate day for period due dates based on sent date
 * If sent date is 1st, use last day of month for periods
 * If sent date is 15th, use 15th (or last day if month doesn't have 15 days)
 * Otherwise, use the sent date's day
 */
function calculatePeriodDay(sentDate: Date, targetMonth: number, targetYear: number): number {
  const sentDay = sentDate.getDate();
  const lastDayOfTargetMonth = getLastDayOfMonth(targetYear, targetMonth);
  
  // If sent date is the 1st, use last day of the month
  if (sentDay === 1) {
    return lastDayOfTargetMonth;
  }
  
  // For any other date, use the sent day or last day of month, whichever is smaller
  return Math.min(sentDay, lastDayOfTargetMonth);
}

/**
 * Generate default interest periods based on sent date and due date
 * Intelligently calculates period due dates:
 * - If sent date is 1st: periods end on last day of each month
 * - If sent date is 15th: periods end on 15th of each month
 * - Otherwise: periods end on the same day as sent date (or last day if month is shorter)
 */
export function generateDefaultInterestPeriods(
  sentDate: Date | string,
  dueDate: Date | string
): Array<{ dueDate: Date; monthNumber: number }> {
  const start = typeof sentDate === 'string' ? fromLocalDateString(sentDate) : normalizeToMidnight(sentDate);
  const end = typeof dueDate === 'string' ? fromLocalDateString(dueDate) : normalizeToMidnight(dueDate);
  
  const periods: Array<{ dueDate: Date; monthNumber: number }> = [];
  
  // Calculate the number of full months between the dates
  const months = getMonthsBetweenDates(start, end);
  
  // If there are no full months, just return the final due date
  if (months === 0) {
    periods.push({
      dueDate: end,
      monthNumber: 1,
    });
    return periods;
  }
  
  // Generate periods by adding months to the sent date
  // Start from month 0 (current month) to include the first period
  let monthsToAdd = 0;
  let periodNumber = 1;
  
  while (true) {
    // Calculate the target date by adding months to the sent date
    const targetDate = new Date(start);
    targetDate.setMonth(start.getMonth() + monthsToAdd);
    
    const targetYear = targetDate.getFullYear();
    const targetMonth = targetDate.getMonth();
    
    // Calculate the appropriate day for this period
    const periodDay = calculatePeriodDay(start, targetMonth, targetYear);
    
    const periodDueDate = normalizeToMidnight(new Date(targetYear, targetMonth, periodDay));
    
    // Only add the period if it's after the sent date and before the due date
    if (periodDueDate > start && periodDueDate < end) {
      periods.push({
        dueDate: periodDueDate,
        monthNumber: periodNumber++,
      });
    }
    
    // If we've reached or passed the due date, stop
    if (periodDueDate >= end) {
      break;
    }
    
    monthsToAdd++;
    
    // Safety check to prevent infinite loop
    if (monthsToAdd > 120) break; // Max 10 years
  }
  
  // Always add the final period (the actual loan due date)
  periods.push({
    dueDate: end,
    monthNumber: periodNumber,
  });

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

/**
 * Format a date to MM/DD/YYYY string
 * This is the display format for date pickers
 */
export function formatToMMDDYYYY(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  const year = d.getFullYear();
  return `${month}/${day}/${year}`;
}

/**
 * Parse MM/DD/YYYY string to YYYY-MM-DD string
 * Returns empty string if invalid
 */
export function parseMMDDYYYY(dateString: string): string {
  const match = dateString.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (!match) return '';
  
  const [, month, day, year] = match;
  const monthNum = parseInt(month, 10);
  const dayNum = parseInt(day, 10);
  const yearNum = parseInt(year, 10);

  // Validate date
  if (monthNum >= 1 && monthNum <= 12 && dayNum >= 1 && dayNum <= 31) {
    const date = new Date(yearNum, monthNum - 1, dayNum);
    // Check if the date is valid (handles invalid dates like 02/31/2024)
    if (
      date.getFullYear() === yearNum &&
      date.getMonth() === monthNum - 1 &&
      date.getDate() === dayNum
    ) {
      return `${year}-${String(monthNum).padStart(2, '0')}-${String(dayNum).padStart(2, '0')}`;
    }
  }
  
  return '';
}

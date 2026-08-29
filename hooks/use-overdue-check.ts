'use client';

import { useEffect, useRef } from 'react';

const OVERDUE_CHECK_KEY = 'pawn-tracker:last-overdue-check';
const OVERDUE_CHECK_INTERVAL_MS = 5 * 60 * 1000;

/**
 * Custom hook to automatically check and update overdue loan/period statuses
 * Runs once when the component mounts and the session is available
 * 
 * @param enabled - Whether to run the check (default: true)
 */
export function useOverdueCheck(enabled: boolean = true) {
  const hasRun = useRef(false);

  useEffect(() => {
    if (!enabled || hasRun.current) return;

    const checkOverdueStatuses = async () => {
      const lastCheck = Number(localStorage.getItem(OVERDUE_CHECK_KEY) ?? 0);
      if (Date.now() - lastCheck < OVERDUE_CHECK_INTERVAL_MS) return;

      // Set before starting so React Strict Mode and concurrent tabs do not
      // launch duplicate full-portfolio checks.
      localStorage.setItem(OVERDUE_CHECK_KEY, String(Date.now()));

      try {
        const response = await fetch('/api/loans/check-overdue', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
        });

        if (response.ok) {
          const data = await response.json();
          if (data.updatedLoans > 0 || data.updatedPeriods > 0) {
            console.log(
              `Updated ${data.updatedLoans} loan(s) and ${data.updatedPeriods} period(s) to overdue status`
            );
          }
        }
      } catch (error) {
        localStorage.removeItem(OVERDUE_CHECK_KEY);
        // Silently fail - this is a background check
        console.error('Failed to check overdue statuses:', error);
      }
    };

    checkOverdueStatuses();
    hasRun.current = true;
  }, [enabled]);
}






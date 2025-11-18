'use client';

import { useEffect, useRef } from 'react';

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
        // Silently fail - this is a background check
        console.error('Failed to check overdue statuses:', error);
      }
    };

    checkOverdueStatuses();
    hasRun.current = true;
  }, [enabled]);
}



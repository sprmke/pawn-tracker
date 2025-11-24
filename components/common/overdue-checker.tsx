'use client';

import { useOverdueCheck } from '@/hooks';

/**
 * Client component that runs the overdue check on mount
 * Can be included in server components to trigger the overdue check
 */
export function OverdueChecker() {
  useOverdueCheck();
  return null;
}






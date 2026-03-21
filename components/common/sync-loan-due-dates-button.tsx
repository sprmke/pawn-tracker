'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Loader2, CalendarSync, CheckCircle2 } from 'lucide-react';
import { toast } from 'sonner';

interface SyncLoanDueDatesButtonProps {
  variant?: 'default' | 'outline' | 'ghost';
  size?: 'default' | 'sm' | 'lg' | 'icon';
  className?: string;
  showLabel?: boolean;
}

export function SyncLoanDueDatesButton({
  variant = 'outline',
  size = 'default',
  className,
  showLabel = true,
}: SyncLoanDueDatesButtonProps) {
  const [isRunning, setIsRunning] = useState(false);
  const [justDone, setJustDone] = useState(false);

  const handleSync = async () => {
    setIsRunning(true);
    setJustDone(false);

    try {
      const response = await fetch('/api/loans/sync-due-dates', {
        method: 'POST',
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Sync failed');
      }

      setJustDone(true);

      if (data.updatedCount === 0) {
        toast.success('Due dates already up to date', {
          description: 'All loan due dates match their last interest period.',
        });
      } else {
        toast.success(`Updated ${data.updatedCount} loan due date(s)`, {
          description: data.updatedLoans?.length
            ? `Updated: ${data.updatedLoans.join(', ')}`
            : data.message,
        });
      }

      setTimeout(() => setJustDone(false), 4000);
    } catch (error) {
      console.error('Error syncing loan due dates:', error);
      toast.error('Sync failed', {
        description: error instanceof Error ? error.message : 'Unknown error',
      });
    } finally {
      setIsRunning(false);
    }
  };

  const getIcon = () => {
    if (isRunning) return <Loader2 className="h-4 w-4 animate-spin" />;
    if (justDone) return <CheckCircle2 className="h-4 w-4 text-green-500" />;
    return <CalendarSync className="h-4 w-4" />;
  };

  return (
    <Button
      variant={variant}
      size={size}
      onClick={handleSync}
      disabled={isRunning}
      className={className}
    >
      {getIcon()}
      {showLabel && (
        <span className="ml-2">
          {isRunning
            ? 'Syncing…'
            : justDone
              ? 'Done!'
              : 'Sync Due Dates'}
        </span>
      )}
    </Button>
  );
}

'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Loader2, Wrench, CheckCircle2 } from 'lucide-react';
import { toast } from 'sonner';

interface FixReceivedPaymentsButtonProps {
  variant?: 'default' | 'outline' | 'ghost';
  size?: 'default' | 'sm' | 'lg' | 'icon';
  className?: string;
  showLabel?: boolean;
}

export function FixReceivedPaymentsButton({
  variant = 'outline',
  size = 'default',
  className,
  showLabel = true,
}: FixReceivedPaymentsButtonProps) {
  const [isRunning, setIsRunning] = useState(false);
  const [justDone, setJustDone] = useState(false);

  const handleFix = async () => {
    setIsRunning(true);
    setJustDone(false);

    try {
      const response = await fetch('/api/loans/fix-received-payments', {
        method: 'POST',
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Fix failed');
      }

      setJustDone(true);

      if (data.createdPayments === 0 && data.orphanedPaymentsRemoved === 0) {
        toast.success('All payments are consistent', {
          description: 'No missing or orphaned received payments found.',
        });
      } else {
        const parts: string[] = [];
        if (data.createdPayments > 0) {
          parts.push(`Restored ${data.createdPayments} missing payment(s)`);
        }
        if (data.orphanedPaymentsRemoved > 0) {
          parts.push(`Removed ${data.orphanedPaymentsRemoved} orphaned payment(s)`);
        }
        toast.success('Payments repaired', {
          description: data.fixedLoans?.length
            ? `${parts.join(', ')} across: ${data.fixedLoans.join(', ')}`
            : parts.join(', '),
        });
      }

      setTimeout(() => setJustDone(false), 4000);
    } catch (error) {
      console.error('Error fixing received payments:', error);
      toast.error('Repair failed', {
        description: error instanceof Error ? error.message : 'Unknown error',
      });
    } finally {
      setIsRunning(false);
    }
  };

  const getIcon = () => {
    if (isRunning) return <Loader2 className="h-4 w-4 animate-spin" />;
    if (justDone) return <CheckCircle2 className="h-4 w-4 text-green-500" />;
    return <Wrench className="h-4 w-4" />;
  };

  return (
    <Button
      variant={variant}
      size={size}
      onClick={handleFix}
      disabled={isRunning}
      className={className}
    >
      {getIcon()}
      {showLabel && (
        <span className="ml-2">
          {isRunning
            ? 'Repairing…'
            : justDone
              ? 'Done!'
              : 'Fix Payments'}
        </span>
      )}
    </Button>
  );
}

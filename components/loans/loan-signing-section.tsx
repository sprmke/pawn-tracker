'use client';

import { useEffect, useState } from 'react';
import { LoanSigningLinksPanel } from '@/components/loans/loan-signing-links-panel';
import type { SigningInvitationSummary } from '@/lib/loan-signing';
import { Skeleton } from '@/components/ui/skeleton';

interface LoanSigningSectionProps {
  loanId: number;
  highlight?: boolean;
  refreshKey?: number | string;
}

export function LoanSigningSection({
  loanId,
  highlight = false,
  refreshKey = 0,
}: LoanSigningSectionProps) {
  const [invitations, setInvitations] = useState<SigningInvitationSummary[]>(
    [],
  );
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function loadSigningLinks() {
      setIsLoading(true);
      try {
        const response = await fetch(`/api/loans/${loanId}/signing`);
        if (!response.ok) return;
        const data = await response.json();
        if (!cancelled) {
          setInvitations(data.invitations ?? []);
        }
      } catch (error) {
        console.error('Error loading signing links:', error);
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    }

    loadSigningLinks();
    return () => {
      cancelled = true;
    };
  }, [loanId, refreshKey]);

  if (isLoading) {
    return (
      <div className="space-y-3">
        <Skeleton className="h-6 w-48" />
        <Skeleton className="h-24 w-full" />
      </div>
    );
  }

  if (invitations.length === 0) {
    return null;
  }

  return (
    <div
      id="contract-signing-section"
      className={highlight ? 'ring-2 ring-primary/30 rounded-xl' : undefined}
    >
      <LoanSigningLinksPanel invitations={invitations} />
    </div>
  );
}

'use client';

import { useRouter } from 'next/navigation';
import { toast } from '@/lib/toast';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { DetailHeader } from '@/components/common';
import { DebtForm, DebtSummaryPreview } from '@/components/debts';
import { formatCurrency, formatDateShort } from '@/lib/format';
import type { DebtWithInvestorAndPeriods, Investor } from '@/lib/types';
import { ArrowLeft } from 'lucide-react';
import { useCallback, useState } from 'react';

interface DebtDetailClientProps {
  debt: DebtWithInvestorAndPeriods;
  investors: Investor[];
  initialEditMode?: boolean;
}

export function DebtDetailClient({
  debt: initialDebt,
  investors,
  initialEditMode = false,
}: DebtDetailClientProps) {
  const router = useRouter();
  const [debt, setDebt] = useState(initialDebt);
  const [isEditing, setIsEditing] = useState(initialEditMode);

  const fees = debt.additionalFees ?? [];
  const debtDate =
    debt.date instanceof Date
      ? debt.date.toISOString().split('T')[0]
      : String(debt.date).split('T')[0];

  const refreshDebt = useCallback(async () => {
    try {
      const response = await fetch(`/api/debts/${debt.id}`);
      if (!response.ok) throw new Error('Failed to fetch borrowing');
      const data = await response.json();
      setDebt(data);
      router.refresh();
    } catch (error) {
      console.error('Error refreshing debt:', error);
    }
  }, [debt.id, router]);

  const handleDelete = async () => {
    const response = await fetch(`/api/debts/${debt.id}`, {
      method: 'DELETE',
    });
    if (!response.ok) throw new Error('Failed to delete');
    toast.success('Borrowing deleted successfully');
    router.push('/debts');
    router.refresh();
  };

  if (isEditing) {
    return (
      <div className="max-w-4xl mx-auto space-y-6">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setIsEditing(false)}
          className="-ml-2 w-fit mb-4"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Borrowing
        </Button>
        <DebtForm
          investors={investors}
          existingDebt={debt}
          initialInterestPeriods={debt.interestPeriods}
          onSuccess={() => {
            setIsEditing(false);
            refreshDebt();
          }}
          onCancel={() => setIsEditing(false)}
          onPaymentsChange={refreshDebt}
        />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <DetailHeader
        title={debt.name}
        description={`Investor: ${debt.investor.name}`}
        backLabel="Back to Borrowings"
        onBack={() => router.push('/debts')}
        onEdit={() => setIsEditing(true)}
        onDelete={handleDelete}
        deleteTitle="Delete borrowing?"
        deleteDescription={`This will permanently delete "${debt.name}". This action cannot be undone.`}
      />

      <Card>
        <CardHeader>
          <CardTitle>Borrowing Summary</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-5 gap-3">
            <div className="p-3 rounded-lg bg-muted/50">
              <p className="text-xs text-muted-foreground mb-1">Principal</p>
              <p className="text-sm font-semibold">
                {formatCurrency(debt.amount)}
              </p>
            </div>
            <div className="p-3 rounded-lg bg-muted/50">
              <p className="text-xs text-muted-foreground mb-1">Start Date</p>
              <p className="text-sm font-semibold">
                {formatDateShort(debt.date)}
              </p>
            </div>
            <div className="p-3 rounded-lg bg-muted/50">
              <p className="text-xs text-muted-foreground mb-1">
                Interest Rate
              </p>
              <p className="text-sm font-semibold">{debt.interestRate}%</p>
            </div>
            <div className="p-3 rounded-lg bg-muted/50">
              <p className="text-xs text-muted-foreground mb-1">
                Accrual Period
              </p>
              <Badge variant="secondary">{debt.interestInterval}</Badge>
            </div>
            <div className="p-3 rounded-lg bg-muted/50">
              <p className="text-xs text-muted-foreground mb-1">Duration</p>
              <p className="text-sm font-semibold">
                {debt.durationMonths} months
              </p>
            </div>
          </div>

          {fees.length > 0 && (
            <div className="mt-4 space-y-2">
              <p className="text-xs font-semibold text-muted-foreground">
                Additional Fees
              </p>
              {fees.map((fee, i) => (
                <div
                  key={i}
                  className="flex justify-between text-sm p-2 border rounded"
                >
                  <span>{fee.label}</span>
                  <span className="font-medium">
                    {formatCurrency(fee.amount)}
                  </span>
                </div>
              ))}
            </div>
          )}

          {debt.notes && (
            <div className="mt-4 space-y-1">
              <p className="text-xs font-semibold text-muted-foreground">
                Notes
              </p>
              <p className="text-sm text-muted-foreground">{debt.notes}</p>
            </div>
          )}
        </CardContent>
      </Card>

      <DebtSummaryPreview
        principal={debt.amount}
        interestRate={debt.interestRate}
        interestInterval={debt.interestInterval}
        debtDate={debtDate}
        durationMonths={debt.durationMonths}
        additionalFees={fees}
        interestPeriods={debt.interestPeriods}
        onPaymentsChange={refreshDebt}
      />
    </div>
  );
}

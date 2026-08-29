'use client';

import { useEffect, useMemo, useState } from 'react';
import {
  ArrowDownToLine,
  ArrowUpFromLine,
  CalendarDays,
  Plus,
  Trash2,
} from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { DatePicker } from '@/components/ui/date-picker';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { calculateTotalAmount } from '@/lib/calculations';
import { toLocalDateString } from '@/lib/date-utils';
import { formatCurrency, formatDate } from '@/lib/format';
import { toast } from '@/lib/toast';
import type { LoanWithInvestors } from '@/lib/types';

export type LoanQuickPaymentKind = 'payment' | 'received';

interface LoanQuickPaymentDialogProps {
  loan: LoanWithInvestors | null;
  kind: LoanQuickPaymentKind | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void | Promise<void>;
}

interface PaymentEntry {
  id: string;
  investorId: string;
  amount: string;
  date: string;
  interestType: 'rate' | 'fixed';
  interestValue: string;
  isPaid: boolean;
  interestPeriodId: string;
}

function createPaymentEntry(defaultInvestorId = ''): PaymentEntry {
  return {
    id: crypto.randomUUID(),
    investorId: defaultInvestorId,
    amount: '',
    date: toLocalDateString(new Date()),
    interestType: 'rate',
    interestValue: '10',
    isPaid: true,
    interestPeriodId: 'general',
  };
}

export function LoanQuickPaymentDialog({
  loan,
  kind,
  open,
  onOpenChange,
  onSuccess,
}: LoanQuickPaymentDialogProps) {
  const lenders = useMemo(() => {
    if (!loan) return [];
    const unique = new Map(
      loan.loanInvestors.map((payment) => [
        payment.investor.id,
        payment.investor,
      ]),
    );
    return Array.from(unique.values()).sort((a, b) =>
      a.name.localeCompare(b.name),
    );
  }, [loan]);

  const [entries, setEntries] = useState<PaymentEntry[]>([
    createPaymentEntry(),
  ]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!open) return;
    setEntries([
      createPaymentEntry(lenders.length === 1 ? String(lenders[0].id) : ''),
    ]);
  }, [open, kind, lenders]);

  if (!loan || !kind) return null;

  const isReceived = kind === 'received';
  const title = isReceived ? 'Add Received Payment' : 'Fund Transfer';
  const getEntryContext = (entry: PaymentEntry) => {
    const selectedInvestorId = Number.parseInt(entry.investorId, 10);
    const selectedPayments = loan.loanInvestors.filter(
      (payment) => payment.investor.id === selectedInvestorId,
    );
    const usesInterestSchedule = selectedPayments.some(
      (payment) =>
        payment.hasMultipleInterest &&
        (payment.interestPeriods?.length ?? 0) > 0,
    );
    const periods = selectedPayments
      .flatMap((payment) => payment.interestPeriods ?? [])
      .sort(
        (a, b) =>
          new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime(),
      );
    const totalDue = selectedPayments.length
      ? calculateTotalAmount(selectedPayments)
      : 0;
    const totalReceived = selectedPayments
      .flatMap((payment) => payment.receivedPayments ?? [])
      .reduce(
        (sum, payment) => sum + (Number.parseFloat(payment.amount) || 0),
        0,
      );

    return {
      selectedInvestorId,
      usesInterestSchedule,
      periods,
      remaining: Math.max(0, totalDue - totalReceived),
    };
  };
  const canSubmit = entries.every((entry) => {
    const context = getEntryContext(entry);
    return (
      Boolean(entry.investorId) &&
      Number.parseFloat(entry.amount) > 0 &&
      Boolean(entry.date) &&
      (isReceived ||
        context.usesInterestSchedule ||
        Number.parseFloat(entry.interestValue) >= 0)
    );
  });
  const hasDuplicatePrincipalDates =
    !isReceived &&
    new Set(entries.map((entry) => `${entry.investorId}:${entry.date}`)).size !==
      entries.length;
  const selectedLenderIds = new Set(
    entries.map((entry) => entry.investorId).filter(Boolean),
  );
  const unusedLenders = lenders.filter(
    (lender) => !selectedLenderIds.has(String(lender.id)),
  );

  const updateEntry = (id: string, changes: Partial<PaymentEntry>) => {
    setEntries((current) =>
      current.map((entry) =>
        entry.id === id ? { ...entry, ...changes } : entry,
      ),
    );
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!canSubmit || hasDuplicatePrincipalDates) {
      if (hasDuplicatePrincipalDates) {
        toast.error(
          'The same lender cannot have two principal payments on the same date.',
        );
      }
      return;
    }

    setIsSubmitting(true);
    let savedCount = 0;
    try {
      for (const entry of entries) {
        const context = getEntryContext(entry);
        const isPeriodPayment =
          isReceived && entry.interestPeriodId !== 'general';
        const endpoint = isPeriodPayment
          ? `/api/interest-periods/${entry.interestPeriodId}`
          : isReceived
            ? `/api/loans/${loan.id}/received-payments`
            : `/api/loans/${loan.id}/payments`;
        const payload = isPeriodPayment
          ? {
              status: 'Completed',
              receivedAmount: Number.parseFloat(entry.amount),
              receivedDate: entry.date,
            }
          : isReceived
            ? {
                investorId: context.selectedInvestorId,
                amount: entry.amount,
                receivedDate: entry.date,
                interestPeriodId: null,
              }
            : {
                investorId: context.selectedInvestorId,
                amount: entry.amount,
                sentDate: entry.date,
                interestType: entry.interestType,
                interestValue: entry.interestValue,
                isPaid: entry.isPaid,
              };

        const response = await fetch(endpoint, {
          method: isPeriodPayment ? 'PATCH' : 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
        const result = await response.json().catch(() => null);
        if (!response.ok) {
          throw new Error(
            result?.error || `Failed to add ${title.toLowerCase()}.`,
          );
        }
        savedCount += 1;
      }

      toast.success(
        `${savedCount} ${isReceived ? 'received payment' : 'principal payment'}${savedCount === 1 ? '' : 's'} added successfully.`,
      );
      onOpenChange(false);
      await onSuccess?.();
    } catch (error) {
      if (savedCount > 0) {
        setEntries((current) => current.slice(savedCount));
        await onSuccess?.();
      }
      toast.error(
        `${savedCount ? `${savedCount} saved. ` : ''}${
          error instanceof Error ? error.message : 'Unable to save the payment.'
        }`,
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto">
        <form onSubmit={handleSubmit} className="space-y-5">
          <DialogHeader>
            <div className="flex items-start gap-3 pr-8">
              <div className="rounded-xl bg-primary/10 p-2.5 text-primary">
                {isReceived ? (
                  <ArrowDownToLine className="h-5 w-5" />
                ) : (
                  <ArrowUpFromLine className="h-5 w-5" />
                )}
              </div>
              <div className="space-y-1 text-left">
                <DialogTitle>{title}</DialogTitle>
                <DialogDescription>
                  {isReceived
                    ? `Record money received from the borrower for ${loan.loanName}.`
                    : `Record an additional principal disbursement for ${loan.loanName}.`}
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>

          <div className="space-y-4">
            {entries.map((entry, index) => {
              const context = getEntryContext(entry);
              return (
                <div
                  key={entry.id}
                  className="space-y-4 rounded-xl border border-border bg-muted/20 p-4"
                >
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-sm font-semibold">
                      {isReceived ? 'Receipt' : 'Payment'} {index + 1}
                    </p>
                    {entries.length > 1 ? (
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-muted-foreground hover:text-destructive"
                        onClick={() =>
                          setEntries((current) =>
                            current.filter((item) => item.id !== entry.id),
                          )
                        }
                        disabled={isSubmitting}
                        aria-label={`Remove entry ${index + 1}`}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    ) : null}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor={`${kind}-lender-${entry.id}`}>
                      Lender *
                    </Label>
                    <Select
                      value={entry.investorId}
                      onValueChange={(investorId) =>
                        updateEntry(entry.id, {
                          investorId,
                          interestPeriodId: 'general',
                        })
                      }
                    >
                      <SelectTrigger id={`${kind}-lender-${entry.id}`}>
                        <SelectValue placeholder="Select a lender..." />
                      </SelectTrigger>
                      <SelectContent>
                        {lenders.map((lender) => (
                          <SelectItem
                            key={lender.id}
                            value={String(lender.id)}
                          >
                            {lender.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {isReceived && entry.investorId ? (
                    <div className="rounded-xl border border-border bg-background p-3">
                      <p className="text-xs text-muted-foreground">
                        Estimated remaining balance
                      </p>
                      <p className="mt-1 text-lg font-semibold">
                        {formatCurrency(context.remaining)}
                      </p>
                    </div>
                  ) : null}

                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor={`${kind}-amount-${entry.id}`}>
                        Amount *
                      </Label>
                      <Input
                        id={`${kind}-amount-${entry.id}`}
                        type="number"
                        min="0.01"
                        step="0.01"
                        value={entry.amount}
                        onChange={(event) =>
                          updateEntry(entry.id, {
                            amount: event.target.value,
                          })
                        }
                        placeholder="0.00"
                        autoFocus={index === 0}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor={`${kind}-date-${entry.id}`}>
                        {isReceived ? 'Received date *' : 'Sent date *'}
                      </Label>
                      <DatePicker
                        id={`${kind}-date-${entry.id}`}
                        value={entry.date}
                        onChange={(date) => updateEntry(entry.id, { date })}
                      />
                    </div>
                  </div>

                  {isReceived && context.periods.length ? (
                    <div className="space-y-2">
                      <Label htmlFor={`received-period-${entry.id}`}>
                        Apply payment to
                      </Label>
                      <Select
                        value={entry.interestPeriodId}
                        onValueChange={(interestPeriodId) =>
                          updateEntry(entry.id, { interestPeriodId })
                        }
                      >
                        <SelectTrigger id={`received-period-${entry.id}`}>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="general">
                            General loan balance
                          </SelectItem>
                          {context.periods.map((period) => (
                            <SelectItem
                              key={period.id}
                              value={String(period.id)}
                            >
                              Interest due {formatDate(period.dueDate)}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  ) : null}

                  {!isReceived && context.usesInterestSchedule ? (
                    <Alert>
                      <CalendarDays className="h-4 w-4" />
                      <AlertDescription>
                        This lender&apos;s existing interest schedule also
                        applies to this principal amount.
                      </AlertDescription>
                    </Alert>
                  ) : null}

                  {!isReceived && !context.usesInterestSchedule ? (
                    <div className="space-y-3">
                      <Label>Interest *</Label>
                      <Tabs
                        value={entry.interestType}
                        onValueChange={(interestType) =>
                          updateEntry(entry.id, {
                            interestType: interestType as 'rate' | 'fixed',
                          })
                        }
                      >
                        <TabsList className="grid w-full grid-cols-2">
                          <TabsTrigger value="rate">Rate (%)</TabsTrigger>
                          <TabsTrigger value="fixed">Fixed (₱)</TabsTrigger>
                        </TabsList>
                      </Tabs>
                      <Input
                        type="number"
                        min="0"
                        step="0.01"
                        value={entry.interestValue}
                        onChange={(event) =>
                          updateEntry(entry.id, {
                            interestValue: event.target.value,
                          })
                        }
                        placeholder={
                          entry.interestType === 'rate' ? '10' : '0.00'
                        }
                      />
                    </div>
                  ) : null}

                  {!isReceived ? (
                    <div className="flex items-start gap-3 rounded-xl border border-border bg-background p-3">
                      <Checkbox
                        id={`principal-sent-${entry.id}`}
                        checked={entry.isPaid}
                        onCheckedChange={(checked) =>
                          updateEntry(entry.id, {
                            isPaid: checked === true,
                          })
                        }
                      />
                      <div>
                        <Label htmlFor={`principal-sent-${entry.id}`}>
                          Funds have already been sent
                        </Label>
                        <p className="mt-0.5 text-xs text-muted-foreground">
                          Leave unchecked to record a pending disbursement.
                        </p>
                      </div>
                    </div>
                  ) : null}
                </div>
              );
            })}

            {lenders.length > 1 ? (
              <div className="grid gap-2 sm:grid-cols-2">
                <Button
                  type="button"
                  variant="outline"
                  className="w-full"
                  onClick={() =>
                    setEntries((current) => [
                      ...current,
                      createPaymentEntry(),
                    ])
                  }
                  disabled={isSubmitting}
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Add another
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  className="w-full"
                  onClick={() =>
                    setEntries((current) => {
                      const newEntries = unusedLenders.map((lender) =>
                        createPaymentEntry(String(lender.id)),
                      );
                      const hasOnlyBlankEntry =
                        current.length === 1 &&
                        !current[0].investorId &&
                        !current[0].amount;
                      return hasOnlyBlankEntry
                        ? newEntries
                        : [...current, ...newEntries];
                    })
                  }
                  disabled={isSubmitting || unusedLenders.length === 0}
                >
                  Add all remaining lenders
                </Button>
              </div>
            ) : null}
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={
                !canSubmit || hasDuplicatePrincipalDates || isSubmitting
              }
            >
              {isSubmitting
                ? `Saving ${entries.length}...`
                : `${title}${entries.length > 1 ? `s (${entries.length})` : ''}`}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

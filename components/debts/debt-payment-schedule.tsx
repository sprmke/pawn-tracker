'use client';

import { useState } from 'react';
import { toast } from '@/lib/toast';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { DatePicker } from '@/components/ui/date-picker';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { formatCurrency, formatDateShort } from '@/lib/format';
import { getInterestPeriodStatusBadge } from '@/lib/badge-config';
import { toLocalDateString } from '@/lib/date-utils';
import type {
  DebtInterestPeriodWithPayments,
  InterestPeriodStatus,
} from '@/lib/types';
import type { InterestScheduleEntry } from '@/lib/debt-calculations';
import { Calendar, Check, Loader2, Pencil, Trash2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface CompleteModalState {
  periodId: number;
  amount: string;
  receivedDate: string;
  expectedAmount: number;
}

interface EditPaymentModalState {
  periodId: number;
  mode: 'single' | 'consolidate';
  paymentId: number | null;
  amount: string;
  receivedDate: string;
  expectedAmount: number;
}

interface DebtPaymentScheduleProps {
  schedule: InterestScheduleEntry[];
  interestPeriods: DebtInterestPeriodWithPayments[];
  onPaymentsChange?: () => void;
}

function dateForPickerInput(receivedDate: string): string {
  if (/^\d{4}-\d{2}-\d{2}$/.test(receivedDate)) return receivedDate;
  return toLocalDateString(new Date(receivedDate));
}

function sumLinkedPayments(
  period: DebtInterestPeriodWithPayments | undefined,
): number {
  if (!period?.receivedPayments?.length) return 0;
  return period.receivedPayments.reduce(
    (sum, payment) => sum + (parseFloat(payment.amount) || 0),
    0,
  );
}

export function DebtPaymentSchedule({
  schedule,
  interestPeriods,
  onPaymentsChange,
}: DebtPaymentScheduleProps) {
  const [completeModal, setCompleteModal] = useState<CompleteModalState | null>(
    null,
  );
  const [editPaymentModal, setEditPaymentModal] =
    useState<EditPaymentModalState | null>(null);
  const [completingPeriods, setCompletingPeriods] = useState<Set<number>>(
    new Set(),
  );
  const [editingPaymentPeriodIds, setEditingPaymentPeriodIds] = useState<
    Set<number>
  >(new Set());
  const [deletingPaymentIds, setDeletingPaymentIds] = useState<Set<number>>(
    new Set(),
  );

  const periodByNumber = new Map(
    interestPeriods.map((period) => [period.periodNumber, period]),
  );

  const openCompleteModal = (
    periodId: number,
    periodDueAmount: number,
    suggestedPaymentAmount: number,
  ) => {
    const today = new Date().toISOString().slice(0, 10);
    setCompleteModal({
      periodId,
      amount: Math.max(0, suggestedPaymentAmount).toFixed(2),
      receivedDate: today,
      expectedAmount: periodDueAmount,
    });
  };

  const handleCompletePeriod = async () => {
    if (!completeModal) return;
    const { periodId, amount, receivedDate } = completeModal;
    const trimmedDate = receivedDate?.trim() ?? '';
    const parsed = parseFloat(amount);
    if (!Number.isFinite(parsed) || parsed <= 0) {
      toast.error('Enter a valid received amount.');
      return;
    }
    if (!trimmedDate) {
      toast.error('Choose a received date.');
      return;
    }

    setCompletingPeriods((prev) => new Set(prev).add(periodId));
    try {
      const response = await fetch(`/api/debt-interest-periods/${periodId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: 'Completed',
          receivedAmount: parsed,
          receivedDate: trimmedDate,
        }),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        toast.error(
          typeof data.error === 'string'
            ? data.error
            : 'Could not record this payment. Please try again.',
        );
        return;
      }
      if (data.status === 'Incomplete') {
        toast.success(
          'Partial payment recorded. Period stays incomplete until the full amount is paid.',
        );
      } else {
        toast.success('Payment recorded.');
      }
      setCompleteModal(null);
      onPaymentsChange?.();
    } catch (error) {
      console.error('Error completing debt period:', error);
      toast.error('Could not record this payment. Please try again.');
    } finally {
      setCompletingPeriods((prev) => {
        const next = new Set(prev);
        next.delete(periodId);
        return next;
      });
    }
  };

  const openEditPaymentModal = (
    periodId: number,
    periodDueAmount: number,
    linkedRows: DebtInterestPeriodWithPayments['receivedPayments'],
  ) => {
    const today = new Date().toISOString().slice(0, 10);
    if (linkedRows.length === 0) {
      setEditPaymentModal({
        periodId,
        mode: 'consolidate',
        paymentId: null,
        amount: periodDueAmount.toFixed(2),
        receivedDate: today,
        expectedAmount: periodDueAmount,
      });
      return;
    }
    const sum = linkedRows.reduce(
      (total, row) => total + (parseFloat(row.amount) || 0),
      0,
    );
    const last = linkedRows[linkedRows.length - 1];
    const single = linkedRows.length === 1;
    setEditPaymentModal({
      periodId,
      mode: single ? 'single' : 'consolidate',
      paymentId: single ? linkedRows[0].id : null,
      amount: sum.toFixed(2),
      receivedDate: dateForPickerInput(String(last.receivedDate)),
      expectedAmount: periodDueAmount,
    });
  };

  const handleEditPaymentSave = async () => {
    if (!editPaymentModal) return;
    const { periodId, mode, paymentId, amount, receivedDate } = editPaymentModal;
    const trimmedDate = receivedDate?.trim() ?? '';
    const parsed = parseFloat(amount);
    if (!Number.isFinite(parsed) || parsed <= 0) {
      toast.error('Enter a valid received amount.');
      return;
    }
    if (!trimmedDate) {
      toast.error('Choose a received date.');
      return;
    }

    setEditingPaymentPeriodIds((prev) => new Set(prev).add(periodId));
    try {
      const response =
        mode === 'single' && paymentId != null
          ? await fetch(`/api/debt-received-payments/${paymentId}`, {
              method: 'PATCH',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                amount: parsed,
                receivedDate: trimmedDate,
              }),
            })
          : await fetch(
              `/api/debt-interest-periods/${periodId}/consolidate-payment`,
              {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  amount: parsed,
                  receivedDate: trimmedDate,
                }),
              },
            );
      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        toast.error(
          typeof data.error === 'string'
            ? data.error
            : 'Could not update payment.',
        );
        return;
      }
      toast.success('Payment updated.');
      setEditPaymentModal(null);
      onPaymentsChange?.();
    } catch (error) {
      console.error('Error updating debt payment:', error);
      toast.error('Could not update payment.');
    } finally {
      setEditingPaymentPeriodIds((prev) => {
        const next = new Set(prev);
        next.delete(periodId);
        return next;
      });
    }
  };

  const handleDeleteReceivedPayment = async (paymentId: number) => {
    if (
      !window.confirm(
        'Remove this payment record? You can add it again with Pay.',
      )
    ) {
      return;
    }

    setDeletingPaymentIds((prev) => new Set(prev).add(paymentId));
    try {
      const response = await fetch(`/api/debt-received-payments/${paymentId}`, {
        method: 'DELETE',
      });
      if (!response.ok) {
        toast.error('Could not remove payment.');
        return;
      }
      toast.success('Payment removed.');
      onPaymentsChange?.();
    } catch (error) {
      console.error('Error deleting debt payment:', error);
      toast.error('Could not remove payment.');
    } finally {
      setDeletingPaymentIds((prev) => {
        const next = new Set(prev);
        next.delete(paymentId);
        return next;
      });
    }
  };

  return (
    <>
      <div className="space-y-2">
        <div className="text-sm font-semibold text-muted-foreground flex items-center gap-1.5">
          <Calendar className="h-4 w-4" />
          Payment schedule
        </div>
        <div className="max-h-96 overflow-y-auto space-y-2 pr-1">
          {schedule.map((entry) => {
            const period = periodByNumber.get(entry.period);
            const periodStatus = (period?.status ?? 'Pending') as InterestPeriodStatus;
            const statusBadge = getInterestPeriodStatusBadge(periodStatus);
            const periodDueAmount =
              parseFloat(period?.expectedInterest ?? '') || entry.periodDue;
            const paidLinked = sumLinkedPayments(period);
            const remainingDue = Math.max(0, periodDueAmount - paidLinked);
            const linkedRows = period?.receivedPayments ?? [];
            const canComplete =
              !!period &&
              (periodStatus === 'Pending' ||
                periodStatus === 'Overdue' ||
                periodStatus === 'Incomplete');
            const canEditPayment = !!period && periodStatus === 'Completed';

            return (
              <div
                key={entry.period}
                className="rounded-lg border bg-background p-3 text-sm space-y-2"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="text-muted-foreground w-7 shrink-0">
                      #{entry.period}
                    </span>
                    <span className="shrink-0">
                      {entry.date.toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric',
                      })}
                    </span>
                    {period && (
                      <Badge
                        variant={statusBadge.variant}
                        className={cn('text-[10px] h-4', statusBadge.className)}
                      >
                        {periodStatus}
                      </Badge>
                    )}
                  </div>
                  <div className="text-right min-w-0 text-sm tabular-nums leading-snug">
                    <span className="text-base font-semibold">
                      {formatCurrency(entry.periodDue)}
                    </span>
                    <span className="text-muted-foreground">
                      {' · '}
                      {formatCurrency(entry.principalPortion)} principal ·{' '}
                    </span>
                    <span className="text-emerald-600">
                      {formatCurrency(entry.interest)} interest
                    </span>
                    {entry.feesPortion > 0 && (
                      <span className="text-muted-foreground">
                        {' · '}
                        {formatCurrency(entry.feesPortion)} fees
                      </span>
                    )}
                  </div>
                </div>

                {period && (
                  <div className="grid grid-cols-2 gap-x-3 gap-y-2 text-sm sm:grid-cols-3">
                    <div>
                      <p className="text-[11px] text-muted-foreground">
                        Amount due
                      </p>
                      <p className="font-semibold tabular-nums">
                        {formatCurrency(periodDueAmount)}
                      </p>
                    </div>
                    <div>
                      <p className="text-[11px] text-muted-foreground">
                        Amount paid
                      </p>
                      <p className="font-semibold tabular-nums text-emerald-600">
                        {formatCurrency(paidLinked)}
                      </p>
                    </div>
                    <div>
                      <p className="text-[11px] text-muted-foreground">
                        Received date
                      </p>
                      <p className="font-medium tabular-nums">
                        {linkedRows.length > 0
                          ? linkedRows
                              .map((row) =>
                                formatDateShort(String(row.receivedDate)),
                              )
                              .join(', ')
                          : '—'}
                      </p>
                    </div>
                  </div>
                )}

                {period && paidLinked > 0 && periodStatus !== 'Completed' && (
                  <p className="text-[11px] text-muted-foreground">
                    <span className="font-medium text-foreground tabular-nums">
                      {formatCurrency(remainingDue)}
                    </span>{' '}
                    remaining (of {formatCurrency(periodDueAmount)})
                  </p>
                )}

                {linkedRows.length > 0 && (
                  <div className="space-y-1.5">
                    {linkedRows.map((payment) => (
                      <div
                        key={payment.id}
                        className="flex items-center gap-2 rounded-md border border-emerald-200/70 dark:border-emerald-900/45 bg-muted/20 px-2 py-1.5 text-xs"
                      >
                        <div className="flex min-w-0 flex-1 justify-between gap-2">
                          <span className="text-muted-foreground truncate">
                            {formatDateShort(String(payment.receivedDate))}
                          </span>
                          <span className="tabular-nums font-semibold shrink-0 text-emerald-700 dark:text-emerald-400">
                            {formatCurrency(parseFloat(payment.amount) || 0)}
                          </span>
                        </div>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 shrink-0 text-muted-foreground hover:text-destructive"
                          aria-label="Remove payment"
                          disabled={deletingPaymentIds.has(payment.id)}
                          onClick={() =>
                            handleDeleteReceivedPayment(payment.id)
                          }
                        >
                          {deletingPaymentIds.has(payment.id) ? (
                            <Loader2 className="h-3.5 w-3.5 animate-spin" />
                          ) : (
                            <Trash2 className="h-3.5 w-3.5" />
                          )}
                        </Button>
                      </div>
                    ))}
                  </div>
                )}

                {canComplete && (
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={() =>
                      openCompleteModal(
                        period.id,
                        periodDueAmount,
                        remainingDue > 0 ? remainingDue : periodDueAmount,
                      )
                    }
                    disabled={completingPeriods.has(period.id)}
                    className="w-full h-8 text-xs bg-background"
                  >
                    {periodStatus === 'Incomplete' ? (
                      <Pencil className="mr-1.5 h-3 w-3" />
                    ) : (
                      <Check className="mr-1.5 h-3 w-3" />
                    )}
                    {completingPeriods.has(period.id)
                      ? 'Recording…'
                      : periodStatus === 'Incomplete'
                        ? 'More payment'
                        : 'Record payment'}
                  </Button>
                )}

                {canEditPayment && (
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={() =>
                      openEditPaymentModal(
                        period.id,
                        periodDueAmount,
                        linkedRows,
                      )
                    }
                    disabled={editingPaymentPeriodIds.has(period.id)}
                    className="w-full h-8 text-xs bg-background"
                  >
                    <Pencil className="mr-1.5 h-3 w-3" />
                    {editingPaymentPeriodIds.has(period.id)
                      ? 'Saving…'
                      : 'Edit payment'}
                  </Button>
                )}
              </div>
            );
          })}
        </div>
      </div>

      <Dialog
        open={!!completeModal}
        onOpenChange={(open) => {
          if (!open) setCompleteModal(null);
        }}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Record payment</DialogTitle>
          </DialogHeader>
          {completeModal && (
            <div className="space-y-4 py-2">
              <div className="space-y-2">
                <Label htmlFor="debt-received-amount">Received amount</Label>
                <Input
                  id="debt-received-amount"
                  type="number"
                  step="0.01"
                  value={completeModal.amount}
                  onChange={(e) =>
                    setCompleteModal((prev) =>
                      prev ? { ...prev, amount: e.target.value } : null,
                    )
                  }
                />
                <p className="text-[11px] text-muted-foreground">
                  Due for this period:{' '}
                  {formatCurrency(completeModal.expectedAmount)}
                </p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="debt-received-date">Received date</Label>
                <DatePicker
                  id="debt-received-date"
                  value={completeModal.receivedDate}
                  onChange={(newDate) =>
                    setCompleteModal((prev) =>
                      prev ? { ...prev, receivedDate: newDate } : null,
                    )
                  }
                />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setCompleteModal(null)}
              disabled={
                !!completeModal && completingPeriods.has(completeModal.periodId)
              }
            >
              Cancel
            </Button>
            <Button
              type="button"
              onClick={handleCompletePeriod}
              disabled={
                !completeModal ||
                !completeModal.amount?.trim() ||
                !completeModal.receivedDate?.trim() ||
                completingPeriods.has(completeModal.periodId)
              }
            >
              {completeModal &&
              completingPeriods.has(completeModal.periodId) ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving…
                </>
              ) : (
                'Confirm'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog
        open={!!editPaymentModal}
        onOpenChange={(open) => {
          if (!open) setEditPaymentModal(null);
        }}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Edit payment</DialogTitle>
            {editPaymentModal?.mode === 'consolidate' && (
              <p className="text-sm text-muted-foreground font-normal pt-1">
                This replaces all payment lines for this period with a single
                entry using the amount and date below.
              </p>
            )}
          </DialogHeader>
          {editPaymentModal && (
            <div className="space-y-4 py-2">
              <div className="space-y-2">
                <Label htmlFor="debt-edit-received-amount">Received amount</Label>
                <Input
                  id="debt-edit-received-amount"
                  type="number"
                  step="0.01"
                  value={editPaymentModal.amount}
                  onChange={(e) =>
                    setEditPaymentModal((prev) =>
                      prev ? { ...prev, amount: e.target.value } : null,
                    )
                  }
                />
                <p className="text-[11px] text-muted-foreground">
                  Due for this period:{' '}
                  {formatCurrency(editPaymentModal.expectedAmount)}
                </p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="debt-edit-received-date">Received date</Label>
                <DatePicker
                  id="debt-edit-received-date"
                  value={editPaymentModal.receivedDate}
                  onChange={(newDate) =>
                    setEditPaymentModal((prev) =>
                      prev ? { ...prev, receivedDate: newDate } : null,
                    )
                  }
                />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setEditPaymentModal(null)}
              disabled={
                !!editPaymentModal &&
                editingPaymentPeriodIds.has(editPaymentModal.periodId)
              }
            >
              Cancel
            </Button>
            <Button
              type="button"
              onClick={handleEditPaymentSave}
              disabled={
                !editPaymentModal ||
                !editPaymentModal.amount?.trim() ||
                !editPaymentModal.receivedDate?.trim() ||
                editingPaymentPeriodIds.has(editPaymentModal.periodId)
              }
            >
              {editPaymentModal &&
              editingPaymentPeriodIds.has(editPaymentModal.periodId) ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving…
                </>
              ) : (
                'Save'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

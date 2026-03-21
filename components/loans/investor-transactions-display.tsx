'use client';

import { useState } from 'react';
import { toast } from '@/lib/toast';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Wallet,
  Check,
  Pencil,
  ArrowUpRight,
  ChevronDown,
  CalendarRange,
  Loader2,
  Trash2,
} from 'lucide-react';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import { cn } from '@/lib/utils';
import { formatCurrency, formatDate } from '@/lib/format';
import { calculateInterest } from '@/lib/calculations';
import { getInterestPeriodStatusBadge } from '@/lib/badge-config';
import { DatePicker } from '@/components/ui/date-picker';
import type { InterestPeriodStatus } from '@/lib/types';
import { toLocalDateString } from '@/lib/date-utils';

interface InterestPeriod {
  id?: number | string;
  dueDate: Date | string;
  interestRate: string;
  interestAmount?: string;
  interestType?: string;
  status?: InterestPeriodStatus;
}

interface InvestorTransaction {
  id?: number | string;
  amount: string;
  interestRate: string;
  interestType?: string;
  sentDate: Date | string;
  isPaid: boolean;
}

interface ReceivedPaymentDisplay {
  /** DB id — required to remove a record */
  id?: number;
  amount: string;
  receivedDate: string;
  interestPeriodId?: number | null;
}

function sumLinkedPaymentsForPeriod(
  receivedPayments: ReceivedPaymentDisplay[] | undefined,
  periodId: number,
): number {
  return (receivedPayments || [])
    .filter((rp) => rp.interestPeriodId === periodId)
    .reduce((s, rp) => s + (parseFloat(rp.amount) || 0), 0);
}

/** Comma-separated display dates (one per payment row, in sorted order). */
function formatReceivedDatesCommaSeparated(
  rows: ReceivedPaymentDisplay[],
): string {
  return rows.map((r) => formatDate(r.receivedDate)).join(', ');
}

function dateForPickerInput(receivedDate: string): string {
  if (/^\d{4}-\d{2}-\d{2}$/.test(receivedDate)) return receivedDate;
  return toLocalDateString(new Date(receivedDate));
}

interface InvestorWithTransactions {
  investor: {
    id: number;
    name: string;
    email?: string;
  };
  transactions: InvestorTransaction[];
  receivedPayments?: ReceivedPaymentDisplay[];
  hasMultipleInterest?: boolean;
  interestPeriods?: InterestPeriod[];
}

interface InvestorTransactionsDisplayProps {
  investorsWithTransactions: InvestorWithTransactions[];
  showEmail?: boolean;
  loanId?: number;
  onRefresh?: () => void;
  showPeriodStatus?: boolean;
}

const AMOUNT_MATCH_TOLERANCE = 0.02;

/**
 * Map completed period id → received payment date by matching interest amount
 * (within tolerance) and preferring the payment date closest to the period due date.
 * Each received payment is used at most once.
 */
function matchReceivedDatesToCompletedPeriods(
  periodsSortedByDue: InterestPeriod[],
  receivedPayments: ReceivedPaymentDisplay[],
  periodPrincipalBase: number,
): Map<number, string> {
  const pool = receivedPayments.map((rp) => ({
    amount: parseFloat(rp.amount) || 0,
    receivedDate: rp.receivedDate,
    used: false,
  }));

  const result = new Map<number, string>();

  for (const period of periodsSortedByDue) {
    if (period.status !== 'Completed' || typeof period.id !== 'number')
      continue;

    const expected = calculateInterest(
      periodPrincipalBase,
      period.interestRate,
      period.interestType,
    );
    const dueTime = new Date(period.dueDate).getTime();

    let bestIdx = -1;
    let bestScore = Infinity;

    for (let i = 0; i < pool.length; i++) {
      if (pool[i].used) continue;
      if (Math.abs(pool[i].amount - expected) > AMOUNT_MATCH_TOLERANCE)
        continue;
      const rpTime = new Date(pool[i].receivedDate).getTime();
      const score = Math.abs(rpTime - dueTime);
      if (score < bestScore) {
        bestScore = score;
        bestIdx = i;
      }
    }

    if (bestIdx >= 0) {
      pool[bestIdx].used = true;
      result.set(period.id, pool[bestIdx].receivedDate);
    }
  }

  return result;
}

export function InvestorTransactionsDisplay({
  investorsWithTransactions,
  showEmail = true,
  loanId,
  onRefresh,
  showPeriodStatus = true,
}: InvestorTransactionsDisplayProps) {
  const [payingTransactions, setPayingTransactions] = useState<
    Set<number | string>
  >(new Set());
  const [completingPeriods, setCompletingPeriods] = useState<
    Set<number | string>
  >(new Set());
  const [deletingPaymentIds, setDeletingPaymentIds] = useState<Set<number>>(
    () => new Set(),
  );
  const [editingPaymentPeriodIds, setEditingPaymentPeriodIds] = useState<
    Set<number>
  >(() => new Set());
  /** Per-investor collapsible sections — default expanded; `false` means user collapsed */
  const [openSections, setOpenSections] = useState<Record<string, boolean>>({});
  const [completeModal, setCompleteModal] = useState<{
    periodId: number;
    amount: string;
    receivedDate: string;
    /** Full interest due for this period — completion requires matching this (server-validated) */
    expectedInterest: number;
  } | null>(null);

  const [editPaymentModal, setEditPaymentModal] = useState<{
    periodId: number;
    mode: 'single' | 'consolidate';
    paymentId: number | null;
    amount: string;
    receivedDate: string;
    expectedInterest: number;
  } | null>(null);

  const sectionKey = (investorId: number, section: 'principal' | 'interest') =>
    `${investorId}-${section}`;

  const setSectionOpen = (
    investorId: number,
    section: 'principal' | 'interest',
    open: boolean,
  ) => {
    setOpenSections((prev) => ({
      ...prev,
      [sectionKey(investorId, section)]: open,
    }));
  };

  const isSectionOpen = (
    investorId: number,
    section: 'principal' | 'interest',
  ) => openSections[sectionKey(investorId, section)] !== false;

  const handlePayTransaction = async (transactionId: number | string) => {
    if (!loanId || typeof transactionId !== 'number') return;
    setPayingTransactions((prev) => new Set(prev).add(transactionId));
    try {
      const response = await fetch(`/api/loans/${loanId}/pay-transaction`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ transactionId }),
      });
      if (!response.ok) throw new Error('Failed to pay transaction');
      toast.success('Transaction marked as paid');
      onRefresh?.();
    } catch (error) {
      console.error('Error paying transaction:', error);
      toast.error('Failed to pay transaction. Please try again.');
    } finally {
      setPayingTransactions((prev) => {
        const s = new Set(prev);
        s.delete(transactionId);
        return s;
      });
    }
  };

  const openCompleteModal = (
    periodId: number,
    fullInterestForPeriod: number,
    suggestedPaymentAmount: number,
  ) => {
    const today = new Date().toISOString().slice(0, 10);
    const pay = Math.max(0, suggestedPaymentAmount);
    setCompleteModal({
      periodId,
      amount: pay.toFixed(2),
      receivedDate: today,
      expectedInterest: fullInterestForPeriod,
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
      const response = await fetch(`/api/interest-periods/${periodId}`, {
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
          'Partial payment recorded. Period stays incomplete until the full interest is paid.',
        );
      } else {
        toast.success('Period marked as complete.');
      }
      setCompleteModal(null);
      onRefresh?.();
    } catch (error) {
      console.error('Error completing period:', error);
      toast.error('Could not complete this period. Please try again.');
    } finally {
      setCompletingPeriods((prev) => {
        const s = new Set(prev);
        s.delete(periodId);
        return s;
      });
    }
  };

  const openEditPaymentModal = (
    periodId: number,
    periodInterest: number,
    linkedRows: ReceivedPaymentDisplay[],
  ) => {
    const today = new Date().toISOString().slice(0, 10);
    if (linkedRows.length === 0) {
      // No linked rows (legacy/unlinked data) — open with full interest pre-filled
      setEditPaymentModal({
        periodId,
        mode: 'consolidate',
        paymentId: null,
        amount: periodInterest.toFixed(2),
        receivedDate: today,
        expectedInterest: periodInterest,
      });
      return;
    }
    const sum = linkedRows.reduce((s, r) => s + (parseFloat(r.amount) || 0), 0);
    const last = linkedRows[linkedRows.length - 1];
    const dateStr = dateForPickerInput(last.receivedDate);
    const single =
      linkedRows.length === 1 && typeof linkedRows[0].id === 'number';
    setEditPaymentModal({
      periodId,
      mode: single ? 'single' : 'consolidate',
      paymentId: single ? linkedRows[0].id! : null,
      amount: sum.toFixed(2),
      receivedDate: dateStr,
      expectedInterest: periodInterest,
    });
  };

  const handleEditPaymentSave = async () => {
    if (!editPaymentModal) return;
    const { periodId, mode, paymentId, amount, receivedDate } =
      editPaymentModal;
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
      if (mode === 'single' && paymentId != null) {
        const response = await fetch(`/api/received-payments/${paymentId}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            amount: parsed,
            receivedDate: trimmedDate,
          }),
        });
        const data = await response.json().catch(() => ({}));
        if (!response.ok) {
          toast.error(
            typeof data.error === 'string'
              ? data.error
              : 'Could not update payment.',
          );
          return;
        }
      } else {
        const response = await fetch(
          `/api/interest-periods/${periodId}/consolidate-payment`,
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
              : 'Could not update payments.',
          );
          return;
        }
      }
      toast.success('Payment updated.');
      setEditPaymentModal(null);
      onRefresh?.();
    } catch (error) {
      console.error('Error updating payment:', error);
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
        'Remove this payment record? You can add it again with Record payment.',
      )
    ) {
      return;
    }
    setDeletingPaymentIds((prev) => new Set(prev).add(paymentId));
    try {
      const response = await fetch(`/api/received-payments/${paymentId}`, {
        method: 'DELETE',
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        toast.error(
          typeof data.error === 'string'
            ? data.error
            : 'Could not remove this payment.',
        );
        return;
      }
      toast.success('Payment record removed.');
      onRefresh?.();
    } catch (error) {
      console.error('Error deleting received payment:', error);
      toast.error('Could not remove this payment.');
    } finally {
      setDeletingPaymentIds((prev) => {
        const next = new Set(prev);
        next.delete(paymentId);
        return next;
      });
    }
  };

  return (
    <div className="space-y-3">
      {(() => {
        // Loan-wide total principal for 0-capital rate investors
        const loanTotalPrincipal = investorsWithTransactions.reduce(
          (sum, item) =>
            sum +
            item.transactions.reduce(
              (s, t) => s + (parseFloat(t.amount) || 0),
              0,
            ),
          0,
        );

        return investorsWithTransactions.map((item) => {
          const { investor, transactions } = item;

          const totalCapital = transactions.reduce(
            (sum, t) => sum + (parseFloat(t.amount) || 0),
            0,
          );

          const hasMultiplePeriods =
            item.hasMultipleInterest &&
            item.interestPeriods &&
            item.interestPeriods.length > 1;

          let totalInterest = 0;
          if (hasMultiplePeriods) {
            totalInterest = item.interestPeriods!.reduce((sum, p) => {
              const rv = parseFloat(p.interestRate) || 0;
              if (p.interestType === 'fixed') return sum + rv;
              const base =
                totalCapital === 0 ? loanTotalPrincipal : totalCapital;
              return sum + base * (rv / 100);
            }, 0);
          } else {
            totalInterest = transactions.reduce((sum, t) => {
              const capital = parseFloat(t.amount) || 0;
              const rv = parseFloat(t.interestRate) || 0;
              if (t.interestType === 'fixed') return sum + rv;
              const base = capital === 0 ? loanTotalPrincipal : capital;
              return sum + base * (rv / 100);
            }, 0);
          }

          const grandTotal = totalCapital + totalInterest;

          const anyFixed = hasMultiplePeriods
            ? item.interestPeriods!.some((p) => p.interestType === 'fixed')
            : transactions.some((t) => t.interestType === 'fixed');

          let rateDisplay: string;
          if (totalCapital > 0) {
            const pct = (totalInterest / totalCapital) * 100;
            rateDisplay = anyFixed
              ? `${pct.toFixed(2)}% (Fixed)`
              : `${pct.toFixed(2)}%`;
          } else if (loanTotalPrincipal > 0 && totalInterest > 0) {
            const pct = (totalInterest / loanTotalPrincipal) * 100;
            rateDisplay = anyFixed
              ? `${pct.toFixed(2)}% (Fixed)`
              : `${pct.toFixed(2)}%`;
          } else {
            rateDisplay = '0.00%';
          }

          const totalReceived = (item.receivedPayments || []).reduce(
            (sum, rp) => sum + (parseFloat(rp.amount) || 0),
            0,
          );
          const balance = grandTotal - totalReceived;
          const isFullyReceived = balance <= 0.01 && totalReceived > 0;
          const receivedCount = (item.receivedPayments || []).length;
          const principalCount = transactions.length;
          const periodCount = item.interestPeriods?.length ?? 0;

          const periodPrincipalBase =
            totalCapital === 0 ? loanTotalPrincipal : totalCapital;

          const sortedPeriodsForMatch =
            hasMultiplePeriods && item.interestPeriods
              ? [...item.interestPeriods].sort(
                  (a, b) =>
                    new Date(a.dueDate).getTime() -
                    new Date(b.dueDate).getTime(),
                )
              : [];

          const periodReceivedDateById =
            hasMultiplePeriods && sortedPeriodsForMatch.length > 0
              ? matchReceivedDatesToCompletedPeriods(
                  sortedPeriodsForMatch,
                  item.receivedPayments || [],
                  periodPrincipalBase,
                )
              : new Map<number, string>();

          const principalOpen = isSectionOpen(investor.id, 'principal');
          const interestOpen = isSectionOpen(investor.id, 'interest');

          return (
            <div
              key={investor.id}
              className="rounded-xl border-2 border-border/80 bg-card shadow-sm overflow-hidden"
            >
              {/* ── Header ───────────────────────────────────────── */}
              <div className="flex items-center justify-between gap-2 px-4 py-3 bg-muted/50 border-b-2 border-border/60">
                <div className="min-w-0">
                  <p className="font-semibold text-base leading-tight truncate">
                    {investor.name}
                  </p>
                  {showEmail && investor.email && (
                    <p className="text-xs text-muted-foreground mt-0.5 truncate">
                      {investor.email}
                    </p>
                  )}
                </div>
                {isFullyReceived && (
                  <Badge className="text-[10px] h-5 bg-green-600 hover:bg-green-600 text-white border-0 shrink-0">
                    Settled
                  </Badge>
                )}
              </div>

              <div className="space-y-4 p-4 bg-muted/20">
                {/* ── Principal disbursements ───────────────────── */}
                <section
                  className="rounded-xl border-2 border-border/70 bg-background shadow-sm overflow-hidden ring-1 ring-black/4 dark:ring-white/6"
                  aria-label="Principal disbursements"
                >
                  <Collapsible
                    open={principalOpen}
                    onOpenChange={(open) =>
                      setSectionOpen(investor.id, 'principal', open)
                    }
                  >
                    <CollapsibleTrigger className="flex w-full items-center gap-3 px-3 py-3 text-left border-b-2 border-border/50 bg-muted/40 hover:bg-muted/55 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-inset">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-sky-500/15 text-sky-700 dark:bg-sky-500/20 dark:text-sky-300">
                        <ArrowUpRight className="h-5 w-5" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-semibold mt-0.5">
                          Disbursements
                        </p>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          {principalCount === 1
                            ? '1 payment'
                            : `${principalCount} payments`}{' '}
                          · Total {formatCurrency(totalCapital)}
                        </p>
                      </div>
                      <ChevronDown
                        className={cn(
                          'h-5 w-5 shrink-0 text-muted-foreground transition-transform duration-200',
                          principalOpen && 'rotate-180',
                        )}
                      />
                    </CollapsibleTrigger>
                    <CollapsibleContent>
                      <div className="p-3 sm:p-4 space-y-3 bg-muted/10">
                        {transactions.map((transaction, index) => {
                          const capital = parseFloat(transaction.amount) || 0;
                          const isUnpaid = !transaction.isPaid;

                          return (
                            <div
                              key={transaction.id || `t-${index}`}
                              className={cn(
                                'rounded-lg border-2 border-border/60 bg-card p-3 shadow-sm',
                                isUnpaid &&
                                  'border-amber-300/80 bg-amber-50/50 dark:border-amber-900/50 dark:bg-amber-950/25',
                              )}
                            >
                              <div className="flex items-center justify-between gap-3">
                                <div className="flex items-center gap-2.5 min-w-0">
                                  <ArrowUpRight className="h-4 w-4 text-muted-foreground shrink-0" />
                                  <div className="min-w-0">
                                    <p className="text-[11px] font-medium text-muted-foreground">
                                      Sent date
                                    </p>
                                    <p className="text-sm font-semibold mt-0.5">
                                      {formatDate(transaction.sentDate)}
                                    </p>
                                  </div>
                                </div>
                                <div className="flex items-center gap-2 shrink-0">
                                  {isUnpaid && (
                                    <Badge
                                      variant="warning"
                                      className="text-[10px] h-4 px-1.5 py-0"
                                    >
                                      Pending
                                    </Badge>
                                  )}
                                  <p className="text-sm font-bold tabular-nums">
                                    {formatCurrency(capital)}
                                  </p>
                                </div>
                              </div>
                              {isUnpaid &&
                                loanId &&
                                typeof transaction.id === 'number' && (
                                  <Button
                                    size="sm"
                                    onClick={() =>
                                      handlePayTransaction(transaction.id!)
                                    }
                                    disabled={payingTransactions.has(
                                      transaction.id!,
                                    )}
                                    className="w-full mt-3 bg-yellow-500 hover:bg-yellow-600 text-white h-8 text-xs"
                                  >
                                    <Wallet className="mr-1.5 h-3 w-3" />
                                    {payingTransactions.has(transaction.id!)
                                      ? 'Paying…'
                                      : 'Mark as Paid'}
                                  </Button>
                                )}
                            </div>
                          );
                        })}
                      </div>
                    </CollapsibleContent>
                  </Collapsible>
                </section>

                {/* ── Interest: multiple periods ─────────────────── */}
                {hasMultiplePeriods && (
                  <section
                    className="rounded-xl border-2 border-border/70 bg-background shadow-sm overflow-hidden ring-1 ring-black/4 dark:ring-white/6"
                    aria-label="Interest periods"
                  >
                    <Collapsible
                      open={interestOpen}
                      onOpenChange={(open) =>
                        setSectionOpen(investor.id, 'interest', open)
                      }
                    >
                      <CollapsibleTrigger className="flex w-full items-center gap-3 px-3 py-3 text-left border-b-2 border-border/50 bg-muted/40 hover:bg-muted/55 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-inset">
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-violet-500/15 text-violet-700 dark:bg-violet-500/20 dark:text-violet-300">
                          <CalendarRange className="h-5 w-5" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-semibold mt-0.5">
                            Interest periods
                          </p>
                          <p className="text-xs text-muted-foreground mt-0.5">
                            {periodCount} scheduled ·{' '}
                            {formatCurrency(totalInterest)} interest
                            {receivedCount > 0
                              ? ` · ${formatCurrency(totalReceived)} received`
                              : ''}
                          </p>
                        </div>
                        <ChevronDown
                          className={cn(
                            'h-5 w-5 shrink-0 text-muted-foreground transition-transform duration-200',
                            interestOpen && 'rotate-180',
                          )}
                        />
                      </CollapsibleTrigger>
                      <CollapsibleContent>
                        <div className="p-3 sm:p-4 space-y-3 bg-muted/10">
                          {sortedPeriodsForMatch.map((period, pIndex, arr) => {
                            const periodInterest = calculateInterest(
                              periodPrincipalBase,
                              period.interestRate,
                              period.interestType,
                            );
                            const periodRate =
                              period.interestType === 'fixed'
                                ? periodPrincipalBase > 0
                                  ? (periodInterest / periodPrincipalBase) * 100
                                  : 0
                                : parseFloat(period.interestRate) || 0;
                            const periodStatus = period.status || 'Pending';
                            const statusBadge =
                              getInterestPeriodStatusBadge(periodStatus);
                            const pid =
                              typeof period.id === 'number' ? period.id : null;
                            const paidLinked =
                              pid != null
                                ? sumLinkedPaymentsForPeriod(
                                    item.receivedPayments,
                                    pid,
                                  )
                                : 0;
                            const remainingDue = Math.max(
                              0,
                              periodInterest - paidLinked,
                            );
                            const linkedRowsForPeriod =
                              pid != null
                                ? [...(item.receivedPayments || [])]
                                    .filter((rp) => rp.interestPeriodId === pid)
                                    .sort(
                                      (a, b) =>
                                        new Date(a.receivedDate).getTime() -
                                        new Date(b.receivedDate).getTime(),
                                    )
                                : [];
                            const canComplete =
                              pid != null &&
                              (periodStatus === 'Pending' ||
                                periodStatus === 'Overdue' ||
                                periodStatus === 'Incomplete') &&
                              loanId;
                            const canEditPayment =
                              pid != null &&
                              periodStatus === 'Completed' &&
                              loanId;

                            const legacyMatch =
                              pid != null
                                ? periodReceivedDateById.get(pid)
                                : undefined;
                            const receivedDateLabel =
                              linkedRowsForPeriod.length > 0
                                ? formatReceivedDatesCommaSeparated(
                                    linkedRowsForPeriod,
                                  )
                                : periodStatus === 'Completed' ||
                                    periodStatus === 'Incomplete'
                                  ? legacyMatch
                                    ? formatDate(legacyMatch)
                                    : '—'
                                  : '—';

                            return (
                              <div
                                key={period.id || `p-${pIndex}`}
                                className="rounded-lg border-2 border-border/60 bg-card px-3 py-3 shadow-sm"
                              >
                                <div className="flex items-center justify-between mb-1.5">
                                  <span className="text-xs font-semibold text-muted-foreground">
                                    {pIndex === arr.length - 1
                                      ? `Period ${pIndex + 1} · Final`
                                      : `Period ${pIndex + 1}`}
                                  </span>
                                  {showPeriodStatus && (
                                    <Badge
                                      variant={statusBadge.variant}
                                      className={`text-[10px] h-4 ${statusBadge.className || ''}`}
                                    >
                                      {periodStatus}
                                    </Badge>
                                  )}
                                </div>
                                <div className="grid grid-cols-2 gap-x-3 gap-y-2 text-sm sm:grid-cols-4 sm:gap-x-4">
                                  <div>
                                    <p className="text-[11px] text-muted-foreground">
                                      Due date
                                    </p>
                                    <p className="font-medium">
                                      {formatDate(period.dueDate)}
                                    </p>
                                  </div>
                                  <div>
                                    <p className="text-[11px] text-muted-foreground">
                                      Rate
                                    </p>
                                    <p className="font-medium">
                                      {periodRate.toFixed(2)}%
                                    </p>
                                  </div>
                                  <div>
                                    <p className="text-[11px] text-muted-foreground">
                                      Interest
                                    </p>
                                    <p className="font-semibold tabular-nums">
                                      {formatCurrency(periodInterest)}
                                    </p>
                                  </div>
                                  <div>
                                    <p className="text-[11px] text-muted-foreground">
                                      Received date
                                    </p>
                                    <p
                                      className={cn(
                                        'font-medium tabular-nums text-balance',
                                        linkedRowsForPeriod.length > 0 ||
                                          legacyMatch
                                          ? 'text-foreground'
                                          : 'text-muted-foreground',
                                      )}
                                    >
                                      {receivedDateLabel}
                                    </p>
                                  </div>
                                </div>
                                {/* Show paid/remaining + payment rows only for partial or multi-payment periods */}
                                {(periodStatus !== 'Completed' ||
                                  linkedRowsForPeriod.length > 1) && (
                                  <div className="mt-2 pt-2 border-t border-border/50 space-y-2">
                                    {paidLinked > 0 && (
                                      <p className="text-[11px] text-muted-foreground">
                                        <span className="font-medium text-foreground tabular-nums">
                                          {formatCurrency(paidLinked)}
                                        </span>{' '}
                                        paid ·{' '}
                                        <span className="font-medium text-foreground tabular-nums">
                                          {formatCurrency(remainingDue)}
                                        </span>{' '}
                                        remaining
                                        <span className="text-muted-foreground/90">
                                          {' '}
                                          (of{' '}
                                          {formatCurrency(periodInterest)} due
                                          for this period)
                                        </span>
                                      </p>
                                    )}
                                    {linkedRowsForPeriod.length > 0 && (
                                      <div className="space-y-1.5">
                                        <p className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                                          Payments recorded
                                        </p>
                                        {linkedRowsForPeriod.map((rp, i) => (
                                          <div
                                            key={
                                              typeof rp.id === 'number'
                                                ? `rp-${rp.id}`
                                                : `rp-${pid}-${i}-${rp.receivedDate}-${rp.amount}`
                                            }
                                            className="flex items-center gap-2 rounded-md border border-emerald-200/70 dark:border-emerald-900/45 bg-background px-2 py-1.5 text-xs"
                                          >
                                            <div className="flex min-w-0 flex-1 justify-between gap-2">
                                              <span className="text-muted-foreground truncate">
                                                {formatDate(rp.receivedDate)}
                                              </span>
                                              <span className="tabular-nums font-semibold shrink-0 text-emerald-700 dark:text-emerald-400">
                                                {formatCurrency(
                                                  parseFloat(rp.amount) || 0,
                                                )}
                                              </span>
                                            </div>
                                            {typeof rp.id === 'number' &&
                                              loanId && (
                                                <Button
                                                  type="button"
                                                  variant="ghost"
                                                  size="icon"
                                                  className="h-8 w-8 shrink-0 text-muted-foreground hover:text-destructive"
                                                  aria-label="Remove payment"
                                                  disabled={deletingPaymentIds.has(
                                                    rp.id,
                                                  )}
                                                  onClick={() =>
                                                    handleDeleteReceivedPayment(
                                                      rp.id!,
                                                    )
                                                  }
                                                >
                                                  {deletingPaymentIds.has(
                                                    rp.id,
                                                  ) ? (
                                                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                                  ) : (
                                                    <Trash2 className="h-3.5 w-3.5" />
                                                  )}
                                                </Button>
                                              )}
                                          </div>
                                        ))}
                                      </div>
                                    )}
                                  </div>
                                )}
                                {canComplete && (
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() =>
                                      openCompleteModal(
                                        period.id as number,
                                        periodInterest,
                                        remainingDue > 0
                                          ? remainingDue
                                          : periodInterest,
                                      )
                                    }
                                    disabled={completingPeriods.has(period.id!)}
                                    className="w-full mt-2 h-7 text-xs bg-background"
                                  >
                                    {periodStatus === 'Incomplete' ? (
                                      <Pencil className="mr-1.5 h-3 w-3" />
                                    ) : (
                                      <Check className="mr-1.5 h-3 w-3" />
                                    )}{' '}
                                    {completingPeriods.has(period.id!)
                                      ? 'Recording…'
                                      : periodStatus === 'Incomplete'
                                        ? 'More payment'
                                        : 'Pay'}
                                  </Button>
                                )}
                                {canEditPayment && (
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() =>
                                      openEditPaymentModal(
                                        Number(period.id),
                                        periodInterest,
                                        linkedRowsForPeriod,
                                      )
                                    }
                                    disabled={editingPaymentPeriodIds.has(
                                      Number(period.id),
                                    )}
                                    className="w-full mt-2 h-7 text-xs bg-background"
                                  >
                                    <Pencil className="mr-1.5 h-3 w-3" />
                                    {editingPaymentPeriodIds.has(
                                      Number(period.id),
                                    )
                                      ? 'Saving…'
                                      : 'Edit payment'}
                                  </Button>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      </CollapsibleContent>
                    </Collapsible>
                  </section>
                )}

                {/* ── Interest: single term ───────────────────────── */}
                {!hasMultiplePeriods && (
                  <section
                    className="rounded-xl border-2 border-border/70 bg-background shadow-sm overflow-hidden ring-1 ring-black/4 dark:ring-white/6"
                    aria-label="Interest terms"
                  >
                    <Collapsible
                      open={interestOpen}
                      onOpenChange={(open) =>
                        setSectionOpen(investor.id, 'interest', open)
                      }
                    >
                      <CollapsibleTrigger className="flex w-full items-center gap-3 px-3 py-3 text-left border-b-2 border-border/50 bg-muted/40 hover:bg-muted/55 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-inset">
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-violet-500/15 text-violet-700 dark:bg-violet-500/20 dark:text-violet-300">
                          <CalendarRange className="h-5 w-5" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                            Terms · Interest
                          </p>
                          <p className="text-sm font-semibold mt-0.5">
                            Single repayment
                          </p>
                          <p className="text-xs text-muted-foreground mt-0.5">
                            {formatCurrency(totalInterest)} interest
                            {receivedCount > 0
                              ? ` · ${formatCurrency(totalReceived)} received`
                              : ''}
                          </p>
                        </div>
                        <ChevronDown
                          className={cn(
                            'h-5 w-5 shrink-0 text-muted-foreground transition-transform duration-200',
                            interestOpen && 'rotate-180',
                          )}
                        />
                      </CollapsibleTrigger>
                      <CollapsibleContent>
                        <div className="p-3 sm:p-4 space-y-3 bg-muted/10">
                          <div className="rounded-lg border-2 border-dashed border-violet-200/60 dark:border-violet-900/40 bg-violet-500/3 dark:bg-violet-950/20 p-4 space-y-3">
                            <p className="text-xs text-muted-foreground leading-relaxed">
                              Interest at loan maturity from principal
                              disbursement(s) and the agreed rate or fixed
                              amount per tranche. Received payments are listed
                              below; use{' '}
                              <span className="font-medium text-foreground">
                                edit loan
                              </span>{' '}
                              to add or change them.
                            </p>
                            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 text-sm">
                              <div>
                                <p className="text-[11px] font-medium text-muted-foreground">
                                  Avg. rate
                                </p>
                                <p className="font-semibold mt-0.5">
                                  {rateDisplay}
                                </p>
                              </div>
                              <div>
                                <p className="text-[11px] font-medium text-muted-foreground">
                                  Total interest
                                </p>
                                <p className="font-bold tabular-nums mt-0.5">
                                  {formatCurrency(totalInterest)}
                                </p>
                              </div>
                              <div className="col-span-2 sm:col-span-1">
                                <p className="text-[11px] font-medium text-muted-foreground">
                                  Principal base
                                </p>
                                <p className="font-semibold tabular-nums mt-0.5">
                                  {formatCurrency(totalCapital)}
                                </p>
                              </div>
                            </div>
                            {transactions.length > 1 && (
                              <div className="space-y-2 border-t-2 border-border/40 pt-3">
                                <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                                  By disbursement
                                </p>
                                {transactions.map((t, idx) => {
                                  const cap = parseFloat(t.amount) || 0;
                                  const int = calculateInterest(
                                    cap === 0 ? loanTotalPrincipal : cap,
                                    t.interestRate,
                                    t.interestType,
                                  );
                                  return (
                                    <div
                                      key={t.id || `si-${idx}`}
                                      className="flex justify-between gap-2 rounded-md border bg-background px-2 py-1.5 text-xs"
                                    >
                                      <span className="text-muted-foreground truncate">
                                        {formatDate(t.sentDate)}
                                      </span>
                                      <span className="tabular-nums font-semibold shrink-0">
                                        {formatCurrency(int)}
                                      </span>
                                    </div>
                                  );
                                })}
                              </div>
                            )}
                            {receivedCount > 0 && (
                              <div className="space-y-2 border-t-2 border-border/40 pt-3">
                                <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                                  Payments received
                                </p>
                                {(item.receivedPayments || []).map(
                                  (rp, idx) => (
                                    <div
                                      key={`single-rp-${idx}`}
                                      className="flex justify-between gap-2 rounded-md border border-emerald-200/60 dark:border-emerald-900/40 bg-background px-2 py-1.5 text-xs"
                                    >
                                      <span className="text-muted-foreground">
                                        {formatDate(rp.receivedDate)}
                                      </span>
                                      <span className="tabular-nums font-semibold text-emerald-700 dark:text-emerald-400 shrink-0">
                                        {formatCurrency(
                                          parseFloat(rp.amount) || 0,
                                        )}
                                      </span>
                                    </div>
                                  ),
                                )}
                              </div>
                            )}
                          </div>
                        </div>
                      </CollapsibleContent>
                    </Collapsible>
                  </section>
                )}
              </div>

              {/* ── Summary (totals) ──────────────────────────────── */}
              <div className="border-t-2 border-border/60 bg-muted/40 px-4 py-3">
                <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-2">
                  Investor totals
                </p>
                <div className="grid grid-cols-3 sm:grid-cols-6 gap-x-4 gap-y-2 text-[11px]">
                  <div>
                    <p className="text-muted-foreground">Capital</p>
                    <p className="font-medium text-sm tabular-nums">
                      {formatCurrency(totalCapital)}
                    </p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Avg. Rate</p>
                    <p className="font-medium text-sm">{rateDisplay}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Interest</p>
                    <p className="font-medium text-sm tabular-nums">
                      {formatCurrency(totalInterest)}
                    </p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Total</p>
                    <p className="font-medium text-sm tabular-nums">
                      {formatCurrency(grandTotal)}
                    </p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Received</p>
                    <p className="font-medium text-sm tabular-nums">
                      {formatCurrency(totalReceived)}
                    </p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Balance</p>
                    <p
                      className={`font-medium text-sm tabular-nums ${isFullyReceived ? 'text-green-600 dark:text-green-400' : ''}`}
                    >
                      {formatCurrency(Math.max(0, balance))}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          );
        });
      })()}

      {/* Complete Period Modal */}
      <Dialog
        open={!!completeModal}
        onOpenChange={(open) => {
          if (!open) setCompleteModal(null);
        }}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Record interest payment</DialogTitle>
          </DialogHeader>
          {completeModal && (
            <div className="space-y-4 py-2">
              <div className="space-y-2">
                <Label htmlFor="received-amount">Received amount</Label>
                <Input
                  id="received-amount"
                  type="number"
                  step="0.01"
                  value={completeModal.amount}
                  onChange={(e) =>
                    setCompleteModal((prev) =>
                      prev ? { ...prev, amount: e.target.value } : null,
                    )
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="received-date">Received Date</Label>
                <DatePicker
                  id="received-date"
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
              variant="outline"
              onClick={() => setCompleteModal(null)}
              disabled={
                !!completeModal && completingPeriods.has(completeModal.periodId)
              }
            >
              Cancel
            </Button>
            <Button
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

      {/* Edit payment (completed periods) */}
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
                <Label htmlFor="edit-received-amount">Received amount</Label>
                <Input
                  id="edit-received-amount"
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
                  Max for this period:{' '}
                  {formatCurrency(editPaymentModal.expectedInterest)}
                </p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-received-date">Received date</Label>
                <DatePicker
                  id="edit-received-date"
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
              onClick={handleEditPaymentSave}
              disabled={
                !editPaymentModal ||
                !editPaymentModal.amount?.trim() ||
                !editPaymentModal.receivedDate?.trim() ||
                (editPaymentModal &&
                  editingPaymentPeriodIds.has(editPaymentModal.periodId))
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
    </div>
  );
}

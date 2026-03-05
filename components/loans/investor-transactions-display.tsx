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
  ArrowUpRight,
  ArrowDownLeft,
  ChevronDown,
  ChevronUp,
  Loader2,
} from 'lucide-react';
import { formatCurrency, formatDate } from '@/lib/format';
import { calculateInterest } from '@/lib/calculations';
import { getInterestPeriodStatusBadge } from '@/lib/badge-config';
import { DatePicker } from '@/components/ui/date-picker';
import type { InterestPeriodStatus } from '@/lib/types';

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
  amount: string;
  receivedDate: string;
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
  const [expandedPeriods, setExpandedPeriods] = useState<Set<number>>(
    new Set(),
  );
  const [completeModal, setCompleteModal] = useState<{
    periodId: number;
    amount: string;
    receivedDate: string;
  } | null>(null);

  const togglePeriods = (investorId: number) => {
    setExpandedPeriods((prev) => {
      const next = new Set(prev);
      if (next.has(investorId)) next.delete(investorId);
      else next.add(investorId);
      return next;
    });
  };

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

  const openCompleteModal = (periodId: number, interestAmount: number) => {
    const today = new Date().toISOString().slice(0, 10);
    setCompleteModal({
      periodId,
      amount: interestAmount.toFixed(2),
      receivedDate: today,
    });
  };

  const handleCompletePeriod = async () => {
    if (!completeModal) return;
    const { periodId, amount, receivedDate } = completeModal;
    setCompletingPeriods((prev) => new Set(prev).add(periodId));
    try {
      const response = await fetch(`/api/interest-periods/${periodId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: 'Completed',
          receivedAmount: parseFloat(amount),
          receivedDate,
        }),
      });
      if (!response.ok) throw new Error('Failed to mark period as complete');
      toast.success('Period marked as complete');
      setCompleteModal(null);
      onRefresh?.();
    } catch (error) {
      console.error('Error completing period:', error);
      toast.error('Failed to mark period as complete. Please try again.');
    } finally {
      setCompletingPeriods((prev) => {
        const s = new Set(prev);
        s.delete(periodId);
        return s;
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

          const allFixed = hasMultiplePeriods
            ? item.interestPeriods!.every((p) => p.interestType === 'fixed')
            : transactions.every((t) => t.interestType === 'fixed');
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
          const periodsExpanded = expandedPeriods.has(investor.id);

          return (
            <div
              key={investor.id}
              className="rounded-xl border bg-card overflow-hidden"
            >
              {/* ── Header ───────────────────────────────────────── */}
              <div className="flex items-center justify-between gap-2 px-4 py-2.5 bg-muted/40 border-b">
                <div className="min-w-0">
                  <p className="font-semibold text-sm leading-tight truncate">
                    {investor.name}
                  </p>
                  {showEmail && investor.email && (
                    <p className="text-[11px] text-muted-foreground mt-0.5 truncate">
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

              {/* ── Transaction Rows (Sent + Received) ───────────── */}
              <div className="divide-y">
                {/* Sent (disbursement) rows */}
                {transactions.map((transaction, index) => {
                  const capital = parseFloat(transaction.amount) || 0;
                  const isUnpaid = !transaction.isPaid;

                  return (
                    <div
                      key={transaction.id || `t-${index}`}
                      className={`px-4 py-2.5 ${
                        isUnpaid ? 'bg-yellow-50/60 dark:bg-yellow-950/20' : ''
                      }`}
                    >
                      <div className="flex items-center justify-between gap-3">
                        <div className="flex items-center gap-2.5 min-w-0">
                          <ArrowUpRight className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                          <div className="min-w-0">
                            <p className="text-[11px] text-muted-foreground leading-none">
                              Sent Date
                            </p>
                            <p className="text-sm font-medium mt-0.5">
                              {formatDate(transaction.sentDate)}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          {isUnpaid && (
                            <Badge
                              variant="warning"
                              className="text-[10px] h-4 px-1 py-0 leading-none"
                            >
                              Pending
                            </Badge>
                          )}
                          <p className="text-sm font-semibold tabular-nums">
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
                            disabled={payingTransactions.has(transaction.id!)}
                            className="w-full mt-2 bg-yellow-500 hover:bg-yellow-600 text-white h-7 text-xs"
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

                {/* Received payment rows */}
                {(item.receivedPayments || []).map((rp, rpIndex) => (
                  <div key={`rp-${rpIndex}`} className="px-4 py-2.5">
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex items-center gap-2.5 min-w-0">
                        <ArrowDownLeft className="h-3.5 w-3.5 text-green-600 shrink-0" />
                        <div className="min-w-0">
                          <p className="text-[11px] text-muted-foreground leading-none">
                            Received Date
                          </p>
                          <p className="text-sm font-medium mt-0.5">
                            {formatDate(rp.receivedDate)}
                          </p>
                        </div>
                      </div>
                      <p className="text-sm font-semibold text-green-700 dark:text-green-400 tabular-nums shrink-0">
                        {formatCurrency(parseFloat(rp.amount) || 0)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>

              {/* ── Interest Periods (expandable) ────────────────── */}
              {hasMultiplePeriods && (
                <>
                  <button
                    type="button"
                    onClick={() => togglePeriods(investor.id)}
                    className="w-full flex items-center justify-center gap-1.5 py-2 text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-muted/30 transition-colors border-t"
                  >
                    Interest Periods ({item.interestPeriods!.length})
                    {periodsExpanded ? (
                      <ChevronUp className="h-3 w-3" />
                    ) : (
                      <ChevronDown className="h-3 w-3" />
                    )}
                  </button>
                  {periodsExpanded && (
                    <div className="px-4 pb-3 space-y-2">
                      {[...item.interestPeriods!]
                        .sort(
                          (a, b) =>
                            new Date(a.dueDate).getTime() -
                            new Date(b.dueDate).getTime(),
                        )
                        .map((period, pIndex, arr) => {
                          const periodBase =
                            totalCapital === 0
                              ? loanTotalPrincipal
                              : totalCapital;
                          const periodInterest = calculateInterest(
                            periodBase,
                            period.interestRate,
                            period.interestType,
                          );
                          const periodRate =
                            period.interestType === 'fixed'
                              ? periodBase > 0
                                ? (periodInterest / periodBase) * 100
                                : 0
                              : parseFloat(period.interestRate) || 0;
                          const periodStatus = period.status || 'Pending';
                          const statusBadge =
                            getInterestPeriodStatusBadge(periodStatus);
                          const canComplete =
                            typeof period.id === 'number' &&
                            (periodStatus === 'Pending' ||
                              periodStatus === 'Overdue') &&
                            loanId;

                          return (
                            <div
                              key={period.id || `p-${pIndex}`}
                              className="rounded-lg bg-muted/40 px-3 py-2.5"
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
                              <div className="grid grid-cols-3 gap-4 text-sm">
                                <div>
                                  <p className="text-[11px] text-muted-foreground">
                                    Due Date
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
                                  <p className="font-semibold">
                                    {formatCurrency(periodInterest)}
                                  </p>
                                </div>
                              </div>
                              {canComplete && (
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() =>
                                    openCompleteModal(
                                      period.id as number,
                                      periodInterest,
                                    )
                                  }
                                  disabled={completingPeriods.has(period.id!)}
                                  className="w-full mt-2 h-7 text-xs"
                                >
                                  <Check className="mr-1.5 h-3 w-3" />
                                  {completingPeriods.has(period.id!)
                                    ? 'Marking Complete…'
                                    : 'Mark as Complete'}
                                </Button>
                              )}
                            </div>
                          );
                        })}
                    </div>
                  )}
                </>
              )}

              {/* ── Summary Footer ───────────────────────────────── */}
              <div className="px-4 py-2.5 border-t bg-muted/20">
                <div className="grid grid-cols-3 sm:grid-cols-6 gap-x-4 gap-y-1.5 text-[11px]">
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
            <DialogTitle>Complete Interest Period</DialogTitle>
          </DialogHeader>
          {completeModal && (
            <div className="space-y-4 py-2">
              <div className="space-y-2">
                <Label htmlFor="received-amount">Received Amount</Label>
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
                !completeModal.amount ||
                !completeModal.receivedDate ||
                completingPeriods.has(completeModal.periodId)
              }
            >
              {completeModal && completingPeriods.has(completeModal.periodId) ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Completing…
                </>
              ) : (
                'Confirm'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

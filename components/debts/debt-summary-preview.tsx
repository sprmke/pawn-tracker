'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { formatCurrency } from '@/lib/format';
import {
  calculateDebtSummary,
  calculateDebtInterestOutstanding,
  calculateDebtPaymentsTotal,
  getIntervalLabel,
  normalizeDebtFees,
} from '@/lib/debt-calculations';
import type { DebtAdditionalFee, DebtInterestInterval, DebtInterestPeriodWithPayments } from '@/lib/types';
import { Calendar, TrendingUp } from 'lucide-react';
import { DebtPaymentSchedule } from './debt-payment-schedule';

interface DebtSummaryPreviewProps {
  principal: string;
  interestRate: string;
  interestInterval: DebtInterestInterval;
  debtDate: string;
  durationMonths?: number;
  additionalFees: DebtAdditionalFee[];
  interestPeriods?: DebtInterestPeriodWithPayments[];
  onPaymentsChange?: () => void;
}

export function DebtSummaryPreview({
  principal,
  interestRate,
  interestInterval,
  debtDate,
  durationMonths = 12,
  additionalFees,
  interestPeriods,
  onPaymentsChange,
}: DebtSummaryPreviewProps) {
  const principalNum = parseFloat(principal);
  const rateNum = parseFloat(interestRate);

  if (
    !principalNum ||
    principalNum <= 0 ||
    !rateNum ||
    rateNum < 0 ||
    !debtDate ||
    durationMonths < 1
  ) {
    return null;
  }

  const validFees = normalizeDebtFees(additionalFees);

  const summary = calculateDebtSummary({
    principal,
    interestRate,
    interestInterval,
    debtDate,
    durationMonths,
    additionalFees: validFees,
  });

  const intervalLabel = getIntervalLabel(interestInterval);
  const paymentsMade = calculateDebtPaymentsTotal(interestPeriods);
  const amountOutstanding = calculateDebtInterestOutstanding(
    summary.totalRepayment,
    interestPeriods,
  );

  return (
    <Card className="border-primary/20 bg-primary/5">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg sm:text-xl flex items-center gap-2">
          <TrendingUp className="h-5 w-5 text-primary" />
          Interest Overview
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Key metrics */}
        <div className="grid gap-3 grid-cols-2 md:grid-cols-3">
          <div className="p-3 rounded-lg bg-background border">
            <p className="text-sm text-muted-foreground mb-1">
              Principal amount
            </p>
            <p className="text-base font-semibold">
              {formatCurrency(summary.principal)}
            </p>
          </div>
          <div className="p-3 rounded-lg bg-background border">
            <p className="text-sm text-muted-foreground mb-1">
              Payment per {intervalLabel}
            </p>
            <p className="text-base font-semibold">
              {formatCurrency(summary.perPeriodDue)}
            </p>
            <p className="text-xs text-muted-foreground mt-0.5">
              Principal and interest
            </p>
          </div>
          <div className="p-3 rounded-lg bg-background border">
            <p className="text-sm text-muted-foreground mb-1">
              Interest per {intervalLabel}
            </p>
            <p className="text-base font-semibold text-emerald-600">
              {formatCurrency(summary.perPeriodInterest)}
            </p>
            <p className="text-xs text-muted-foreground mt-0.5">
              at {summary.interestRate}% per {intervalLabel}
            </p>
          </div>
          <div className="p-3 rounded-lg bg-background border">
            <p className="text-sm text-muted-foreground mb-1">
              Total interest
            </p>
            <p className="text-base font-semibold text-emerald-600">
              {formatCurrency(summary.scheduleInterestTotal)}
            </p>
            <p className="text-xs text-muted-foreground mt-0.5">
              Over {durationMonths} month{durationMonths !== 1 ? 's' : ''} (
              {summary.schedule.length} periods)
            </p>
          </div>
          <div className="p-3 rounded-lg bg-background border">
            <p className="text-sm text-muted-foreground mb-1">
              Additional fees
            </p>
            <p className="text-base font-semibold">
              {formatCurrency(summary.additionalFeesTotal)}
            </p>
            <p className="text-xs text-muted-foreground mt-0.5">
              {summary.additionalFeesTotal > 0
                ? 'One-time fees on first period'
                : 'No additional fees'}
            </p>
          </div>
          <div className="p-3 rounded-lg bg-background border">
            <p className="text-sm text-muted-foreground mb-1">
              Interest and fees
            </p>
            <p className="text-base font-semibold text-emerald-600">
              {formatCurrency(summary.totalInterestIncludingFees)}
            </p>
            <p className="text-xs text-muted-foreground mt-0.5">
              Total interest plus fees
            </p>
          </div>
          <div className="p-3 rounded-lg bg-background border">
            <p className="text-sm text-muted-foreground mb-1">
              Total repayment
            </p>
            <p className="text-base font-semibold">
              {formatCurrency(summary.totalRepayment)}
            </p>
            <p className="text-xs text-muted-foreground mt-0.5">
              Principal, interest, and fees
            </p>
          </div>
          <div className="p-3 rounded-lg bg-background border">
            <p className="text-sm text-muted-foreground mb-1">
              Payments made
            </p>
            <p className="text-base font-semibold">
              {formatCurrency(paymentsMade)}
            </p>
            <p className="text-xs text-muted-foreground mt-0.5">
              Principal, interest, and fees paid
            </p>
          </div>
          <div className="p-3 rounded-lg bg-background border">
            <p className="text-sm text-muted-foreground mb-1">
              Amount outstanding
            </p>
            <p
              className={`text-base font-semibold ${
                amountOutstanding > 0
                  ? 'text-amber-600 dark:text-amber-500'
                  : 'text-emerald-600'
              }`}
            >
              {formatCurrency(amountOutstanding)}
            </p>
            <p className="text-xs text-muted-foreground mt-0.5">
              {amountOutstanding > 0
                ? 'Remaining principal, interest, and fees'
                : 'Fully paid'}
            </p>
          </div>
        </div>

        {/* Additional fees breakdown */}
        {validFees.length > 0 && (
          <div className="space-y-2">
            <p className="text-sm font-semibold text-muted-foreground">
              Fee breakdown
            </p>
            <div className="space-y-1.5">
              {validFees.map((fee, i) => (
                <div
                  key={i}
                  className="flex items-center justify-between p-2.5 border rounded bg-background text-sm"
                >
                  <span>{fee.label}</span>
                  <span className="font-medium">
                    {formatCurrency(parseFloat(fee.amount))}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Payment schedule */}
        {interestPeriods && interestPeriods.length > 0 ? (
          <DebtPaymentSchedule
            schedule={summary.schedule}
            interestPeriods={interestPeriods}
            onPaymentsChange={onPaymentsChange}
          />
        ) : (
          <div className="space-y-2">
            <div className="text-sm font-semibold text-muted-foreground flex items-center gap-1.5">
              <Calendar className="h-4 w-4" />
              Payment schedule
            </div>
            <div className="max-h-80 overflow-y-auto space-y-1.5 pr-1">
              {summary.schedule.map((entry) => (
                <div
                  key={entry.period}
                  className="flex items-start justify-between gap-3 p-3 border rounded bg-background text-sm"
                >
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
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

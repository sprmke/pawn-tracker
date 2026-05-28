'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { LoanWithInvestors } from '@/lib/types';
import { getLoanStatusBadge, getLoanTypeBadge } from '@/lib/badge-config';
import { formatDate } from '@/lib/format';
import {
  calculateTotalPrincipal,
  calculateTotalInterest,
  calculateTotalAmount,
  calculateAverageRate,
  calculateLoanDuration,
  countUniqueInvestors,
  groupByInvestor,
} from '@/lib/calculations';
import { LoanSummarySection } from './loan-summary-section';
import { LoanInvestorsSection } from './loan-investors-section';
import { OverdueInterestCard } from './overdue-interest-card';

interface LoanDetailContentProps {
  loan: LoanWithInvestors;
  showHeader?: boolean;
  onRefresh?: () => void;
}

export function LoanDetailContent({
  loan,
  showHeader = true,
  onRefresh,
}: LoanDetailContentProps) {
  const totalPrincipal = calculateTotalPrincipal(loan.loanInvestors);
  const totalInterest = calculateTotalInterest(loan.loanInvestors);
  const totalAmount = calculateTotalAmount(loan.loanInvestors);
  const averageRate = calculateAverageRate(loan.loanInvestors);
  const uniqueInvestors = countUniqueInvestors(loan.loanInvestors);

  const totalReceived = loan.loanInvestors.reduce(
    (sum, li) =>
      sum +
      (li.receivedPayments || []).reduce(
        (t, rp) => t + (parseFloat(rp.amount) || 0),
        0,
      ),
    0,
  );
  const totalBalance = totalAmount - totalReceived;

  // Find the earliest sent date from all loan investors
  const earliestSentDate = loan.loanInvestors.reduce(
    (earliest, li) => {
      const sentDate = new Date(li.sentDate);
      return !earliest || sentDate < earliest ? sentDate : earliest;
    },
    null as Date | null,
  );

  const duration = calculateLoanDuration(
    loan.dueDate,
    earliestSentDate || undefined,
  );

  // Calculate funded amount and balance for partially funded loans
  const fundedCapital = loan.loanInvestors.reduce((sum, li) => {
    return li.isPaid ? sum + (parseFloat(li.amount) || 0) : sum;
  }, 0);

  const balance = totalPrincipal - fundedCapital;

  return (
    <div className="space-y-6">
      {/* Header */}
      {showHeader && (
        <div className="space-y-1">
          <div className="flex items-center gap-3 flex-wrap">
            <h2 className="text-xl font-semibold tracking-tight">
              {loan.loanName}
            </h2>
          </div>
        </div>
      )}

      {/* Summary Cards */}
      <LoanSummarySection
        totalPrincipal={totalPrincipal}
        averageRate={averageRate}
        totalInterest={totalInterest}
        totalAmount={totalAmount}
        totalReceived={totalReceived}
        totalBalance={totalBalance}
        uniqueInvestors={uniqueInvestors}
        status={loan.status}
        balance={balance}
        showStatus={false}
      />

      {/* Overdue Interest Computation */}
      {loan.status === 'Overdue' && (
        <OverdueInterestCard loan={loan} onApply={() => onRefresh?.()} />
      )}

      {/* Loan Details */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg sm:text-xl">Loan Details</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1">
              <p className="text-xs text-muted-foreground">Loan Name</p>
              <p className="text-sm font-medium">{loan.loanName}</p>
            </div>

            <div className="space-y-1">
              <p className="text-xs text-muted-foreground">Type</p>
              <Badge
                variant={getLoanTypeBadge(loan.type).variant}
                className={getLoanTypeBadge(loan.type).className}
              >
                {loan.type}
              </Badge>
            </div>

            <div className="space-y-1">
              <p className="text-xs text-muted-foreground">Due Date</p>
              <div className="flex items-center gap-2">
                <span className="font-sm font-medium">
                  {formatDate(loan.dueDate)}
                </span>
              </div>
            </div>

            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">Status</p>
              <Badge
                variant={getLoanStatusBadge(loan.status).variant}
                className={getLoanStatusBadge(loan.status).className}
              >
                {loan.status}
              </Badge>
            </div>

            <div className="space-y-1">
              <p className="text-xs text-muted-foreground">Free Lot (sqm)</p>
              <div className="flex items-center gap-2">
                <span className="font-sm font-medium">
                  {loan.freeLotSqm ? `${loan.freeLotSqm} sqm` : '-'}
                </span>
              </div>
            </div>

            <div className="space-y-1">
              <p className="text-xs text-muted-foreground">Duration</p>
              <span className="font-sm font-medium">{duration}</span>
            </div>
          </div>

          <div className="space-y-1">
            <p className="text-xs text-muted-foreground">Notes</p>
            <p className="font-sm font-medium whitespace-pre-wrap">
              {loan.notes || '-'}
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Investors Section */}
      <LoanInvestorsSection
        investorsWithTransactions={Array.from(
          groupByInvestor(loan.loanInvestors).values(),
        ).map((transactions) => {
          // Find the transaction that has interest periods (if any)
          const transactionWithPeriods = transactions.find(
            (t) => t.interestPeriods && t.interestPeriods.length > 0,
          );

          const receivedPayments = transactions.flatMap((li) =>
            (li.receivedPayments || []).map((rp) => ({
              id: rp.id,
              amount: rp.amount,
              /** Required so each period can show paid/remaining and payment rows */
              interestPeriodId: rp.interestPeriodId ?? null,
              receivedDate:
                typeof rp.receivedDate === 'string'
                  ? rp.receivedDate
                  : rp.receivedDate instanceof Date
                    ? rp.receivedDate.toISOString().slice(0, 10)
                    : String(rp.receivedDate),
            })),
          );

          return {
            investor: transactions[0].investor,
            transactions,
            receivedPayments:
              receivedPayments.length > 0 ? receivedPayments : undefined,
            hasMultipleInterest: transactions[0].hasMultipleInterest || false,
            interestPeriods: transactionWithPeriods?.interestPeriods || [],
          };
        })}
        title="Investors"
        showEmail={true}
        loanId={loan.id}
        onRefresh={onRefresh}
      />
    </div>
  );
}

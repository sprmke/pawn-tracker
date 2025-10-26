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
  const duration = calculateLoanDuration(loan.dueDate);

  // Calculate funded amount and balance for partially funded loans
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const fundedCapital = loan.loanInvestors.reduce((sum, li) => {
    const sentDate = new Date(li.sentDate);
    sentDate.setHours(0, 0, 0, 0);
    return sentDate <= today ? sum + parseFloat(li.amount) : sum;
  }, 0);

  const balance = totalPrincipal - fundedCapital;

  return (
    <div className="space-y-6">
      {/* Header */}
      {showHeader && (
        <div className="space-y-1">
          <div className="flex items-center gap-3 flex-wrap">
            <h2 className="text-2xl sm:text-3xl font-bold tracking-tight">
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
        uniqueInvestors={uniqueInvestors}
        status={loan.status}
        balance={balance}
        showStatus={false}
      />

      {/* Loan Details */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg sm:text-xl">Loan Details</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">Loan Name</p>
              <p className="font-medium">{loan.loanName}</p>
            </div>

            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">Type</p>
              <Badge
                variant={getLoanTypeBadge(loan.type).variant}
                className={getLoanTypeBadge(loan.type).className}
              >
                {loan.type}
              </Badge>
            </div>

            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">Due Date</p>
              <div className="flex items-center gap-2">
                <span className="font-medium">{formatDate(loan.dueDate)}</span>
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
              <p className="text-sm text-muted-foreground">Free Lot (sqm)</p>
              <div className="flex items-center gap-2">
                <span className="font-medium">
                  {loan.freeLotSqm ? `${loan.freeLotSqm} sqm` : '-'}
                </span>
              </div>
            </div>

            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">Duration</p>
              <span className="font-medium">{duration}</span>
            </div>
          </div>

          <div className="space-y-1">
            <p className="text-sm text-muted-foreground">Notes</p>
            <p className="text-sm whitespace-pre-wrap">{loan.notes || '-'}</p>
          </div>
        </CardContent>
      </Card>

      {/* Investors Section */}
      <LoanInvestorsSection
        investorsWithTransactions={Array.from(
          groupByInvestor(loan.loanInvestors).values()
        ).map((transactions) => {
          // Find the transaction that has interest periods (if any)
          const transactionWithPeriods = transactions.find(
            (t) => t.interestPeriods && t.interestPeriods.length > 0
          );

          return {
            investor: transactions[0].investor,
            transactions,
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

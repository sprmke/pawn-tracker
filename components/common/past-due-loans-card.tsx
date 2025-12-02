import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { TriangleAlert } from 'lucide-react';
import Link from 'next/link';
import { format } from 'date-fns';
import { formatCurrency } from '@/lib/format';
import { calculateOverdueAmount } from '@/lib/calculations';
import { InlineLoader } from './loading-state';
import type { LoanWithInvestors } from '@/lib/types';
import { cn } from '@/lib/utils';

interface PastDueLoansCardProps {
  loans: LoanWithInvestors[];
  loading?: boolean;
  investorId?: number; // Filter amounts by specific investor
}

export function PastDueLoansCard({
  loans,
  loading = false,
  investorId,
}: PastDueLoansCardProps) {
  // Sort loans by overdue date (desc order - most recent first)
  const displayLoans = [...loans].sort((a, b) => {
    // Helper function to get the display date for a loan
    const getDisplayDate = (loan: LoanWithInvestors) => {
      const hasMultipleInterest = loan.loanInvestors.some(
        (li) => li.hasMultipleInterest
      );

      if (hasMultipleInterest) {
        const overduePeriods = loan.loanInvestors
          .flatMap((li) => li.interestPeriods || [])
          .filter((period) => period.status === 'Overdue')
          .sort(
            (a, b) =>
              new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime()
          );

        if (overduePeriods.length > 0) {
          return new Date(overduePeriods[0].dueDate);
        }
      }

      return new Date(loan.dueDate);
    };

    const dateA = getDisplayDate(a);
    const dateB = getDisplayDate(b);

    // Descending order (most recent first)
    return dateB.getTime() - dateA.getTime();
  });

  // Calculate total amount due across all loans
  const totalAmount = loans.reduce((sum, loan) => {
    const filteredInvestors = investorId
      ? loan.loanInvestors.filter((li) => li.investor.id === investorId)
      : loan.loanInvestors;
    return sum + calculateOverdueAmount(filteredInvestors);
  }, 0);

  return (
    <Card className="border-t-4 border-t-chart-5 bg-gradient-to-br from-chart-5/5 to-transparent">
      <CardHeader className="space-y-0 pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="font-semibold text-base">
            Past Due Loans
          </CardTitle>
          <div className="flex h-7 w-7 items-center justify-center rounded-xl bg-gradient-to-br from-chart-5/20 to-chart-5/10">
            <TriangleAlert className="h-4 w-4 text-chart-5" />
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="flex items-center justify-center py-4">
            <InlineLoader size="md" />
          </div>
        ) : (
          <div className="space-y-2">
            {displayLoans.length === 0 ? (
              <p className="text-center text-muted-foreground py-8 text-sm">
                No overdue loans
              </p>
            ) : (
              <>
                <div className="flex items-center justify-between mb-3">
                  <p className="text-sm font-medium text-muted-foreground">
                    Total Amount:
                  </p>
                  <p className="text-sm font-semibold text-chart-5">
                    {formatCurrency(totalAmount)}
                  </p>
                </div>
                <div className="space-y-2 max-h-[320px] overflow-y-auto pr-1">
                  {displayLoans.map((loan) => {
                    // Filter loan investors by investorId if provided
                    const filteredInvestors = investorId
                      ? loan.loanInvestors.filter(
                          (li) => li.investor.id === investorId
                        )
                      : loan.loanInvestors;

                    // Calculate amount due for overdue loans
                    // For multiple interest: sum of overdue period interests + capital if final period is overdue
                    // For single interest: capital + total interest
                    const amount = calculateOverdueAmount(filteredInvestors);

                    // For multiple interest loans, find the first overdue interest period
                    // Otherwise, use the loan's due date
                    let displayDate = loan.dueDate;
                    const hasMultipleInterest = loan.loanInvestors.some(
                      (li) => li.hasMultipleInterest
                    );

                    if (hasMultipleInterest) {
                      // Find the earliest overdue interest period
                      const overduePeriods = loan.loanInvestors
                        .flatMap((li) => li.interestPeriods || [])
                        .filter((period) => period.status === 'Overdue')
                        .sort(
                          (a, b) =>
                            new Date(a.dueDate).getTime() -
                            new Date(b.dueDate).getTime()
                        );

                      if (overduePeriods.length > 0) {
                        displayDate = overduePeriods[0].dueDate;
                      }
                    }

                    return (
                      <Link
                        key={loan.id}
                        href={`/loans/${loan.id}`}
                        className="flex flex-col p-3 border-2 border-chart-5/20 bg-background rounded-xl hover:bg-chart-5/5 hover:shadow-md transition-all duration-300 gap-1"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <p className="text-xs font-medium truncate flex-1">
                            {loan.loanName}
                          </p>
                          <p className="text-xs font-semibold text-chart-5 flex-shrink-0">
                            {formatCurrency(amount)}
                          </p>
                        </div>
                        <div className="flex items-center justify-between text-xs">
                          <Badge
                            variant="destructive"
                            className="bg-rose-400 hover:bg-rose-500 text-rose-950 text-[10px] px-2 py-0.5"
                          >
                            {loan.status}
                          </Badge>
                          <span className="text-muted-foreground flex-shrink-0 font-medium">
                            Due: {format(new Date(displayDate), 'MMM dd, yyyy')}
                          </span>
                        </div>
                      </Link>
                    );
                  })}
                </div>
              </>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

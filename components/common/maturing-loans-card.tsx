import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ArrowDownRight } from 'lucide-react';
import Link from 'next/link';
import { format } from 'date-fns';
import { formatCurrency } from '@/lib/format';
import { calculateAmountDueOnDate } from '@/lib/calculations';
import { getLoanStatusBadge } from '@/lib/badge-config';
import { InlineLoader } from './loading-state';
import type { LoanWithInvestors } from '@/lib/types';
import { cn } from '@/lib/utils';

interface MaturingLoansCardProps {
  loans: LoanWithInvestors[];
  loading?: boolean;
  investorId?: number; // Filter amounts by specific investor
}

export function MaturingLoansCard({
  loans,
  loading = false,
  investorId,
}: MaturingLoansCardProps) {
  const displayLoans = loans;

  // Calculate total amount due across all maturing loans
  const totalAmount = loans.reduce((sum, loan) => {
    const filteredInvestors = investorId
      ? loan.loanInvestors.filter((li) => li.investor.id === investorId)
      : loan.loanInvestors;
    return sum + calculateAmountDueOnDate(filteredInvestors);
  }, 0);

  return (
    <Card className="border-t-4 border-t-chart-2 bg-gradient-to-br from-chart-2/5 to-transparent">
      <CardHeader className="space-y-0 pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="font-semibold text-base">
            Incoming Payouts
          </CardTitle>
          <div className="flex h-7 w-7 items-center justify-center rounded-xl bg-gradient-to-br from-chart-2/20 to-chart-2/10">
            <ArrowDownRight className="h-4 w-4 text-chart-2" />
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
                No upcoming due dates
              </p>
            ) : (
              <>
                <div className="flex items-center justify-between mb-3">
                  <p className="text-sm font-medium text-muted-foreground">
                    Total Amount:
                  </p>
                  <p className="text-sm font-semibold text-chart-2">
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

                    // Calculate amount due on this date (matches transaction amount)
                    // For multiple interest: capital + final period interest only
                    // For single interest: capital + total interest
                    const amount = calculateAmountDueOnDate(filteredInvestors);

                    return (
                      <Link
                        key={loan.id}
                        href={`/loans/${loan.id}`}
                        className="flex flex-col p-3 border-2 border-border bg-background rounded-xl hover:bg-chart-2/5 hover:shadow-md transition-all duration-300 gap-1"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <p className="text-xs font-medium truncate flex-1">
                            {loan.loanName}
                          </p>
                          <p className="text-xs font-semibold text-chart-2 flex-shrink-0">
                            {formatCurrency(amount)}
                          </p>
                        </div>
                        <div className="flex items-center justify-between text-xs">
                          <Badge
                            variant={getLoanStatusBadge(loan.status).variant}
                            className={`${
                              getLoanStatusBadge(loan.status).className
                            } text-[10px] px-2 py-0.5`}
                          >
                            {loan.type}
                          </Badge>
                          <span className="text-muted-foreground flex-shrink-0 font-medium">
                            Due:{' '}
                            {format(new Date(loan.dueDate), 'MMM dd, yyyy')}
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

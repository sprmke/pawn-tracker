import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { TriangleAlert } from 'lucide-react';
import Link from 'next/link';
import { format } from 'date-fns';
import { formatCurrency } from '@/lib/format';
import { calculateAmountDueOnDate } from '@/lib/calculations';
import { InlineLoader } from './loading-state';
import type { LoanWithInvestors } from '@/lib/types';
import { cn } from '@/lib/utils';

interface PastDueLoansCardProps {
  loans: LoanWithInvestors[];
  limit?: number;
  loading?: boolean;
  investorId?: number; // Filter amounts by specific investor
}

export function PastDueLoansCard({
  loans,
  limit = 5,
  loading = false,
  investorId,
}: PastDueLoansCardProps) {
  const displayLoans = loans.slice(0, limit);

  // Calculate total amount due across all loans
  const totalAmount = loans.reduce((sum, loan) => {
    const filteredInvestors = investorId
      ? loan.loanInvestors.filter((li) => li.investor.id === investorId)
      : loan.loanInvestors;
    return sum + calculateAmountDueOnDate(filteredInvestors);
  }, 0);

  return (
    <Card className="border-t-4 border-t-chart-5 bg-gradient-to-br from-chart-5/5 to-transparent">
      <CardHeader className={limit === 3 ? 'space-y-0 pb-3' : ''}>
        <div className="flex items-center justify-between">
          <CardTitle
            className={cn(
              'font-semibold',
              limit === 3 ? 'text-base' : 'text-lg'
            )}
          >
            Past Due Loans
          </CardTitle>
          <div className="flex h-7 w-7 items-center justify-center rounded-xl bg-gradient-to-br from-chart-5/20 to-chart-5/10">
            <TriangleAlert className="h-4 w-4 text-chart-5" />
          </div>
        </div>
        <p className="text-xs text-muted-foreground">
          Requires immediate attention
        </p>
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
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium text-muted-foreground">
                    Total Amount:
                  </p>
                  <p className="text-base font-bold text-chart-5">
                    {formatCurrency(totalAmount)}
                  </p>
                </div>
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
                      className="flex flex-col p-3 border-2 border-chart-5/20 bg-background rounded-xl hover:bg-chart-5/5 hover:shadow-md transition-all duration-300 gap-1"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <p className="text-sm font-semibold truncate flex-1">
                          {loan.loanName}
                        </p>
                        <p className="text-sm font-bold text-chart-5 flex-shrink-0">
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
                          Due: {format(new Date(loan.dueDate), 'MMM dd, yyyy')}
                        </span>
                      </div>
                    </Link>
                  );
                })}
              </>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

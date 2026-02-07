import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ArrowDownRight } from 'lucide-react';
import Link from 'next/link';
import { format } from 'date-fns';
import { formatCurrency } from '@/lib/format';
import { calculateAmountDueOnDate } from '@/lib/calculations';
import { getLoanTypeBadge } from '@/lib/badge-config';
import { InlineLoader } from './loading-state';
import type { LoanWithInvestors, LoanType } from '@/lib/types';
import { cn } from '@/lib/utils';

interface MaturingLoansCardProps {
  loans: LoanWithInvestors[];
  loading?: boolean;
  investorId?: number; // Filter amounts by specific investor
  onLoanClick?: (loan: LoanWithInvestors) => void; // Optional click handler for modal display
  onTypeFilterClick?: (type: LoanType) => void; // Optional click handler for filtering by type
  onViewAllClick?: () => void; // Optional click handler to view all loans of this status
}

export function MaturingLoansCard({
  loans,
  loading = false,
  investorId,
  onLoanClick,
  onTypeFilterClick,
  onViewAllClick,
}: MaturingLoansCardProps) {
  const displayLoans = loans;

  // Calculate total amount due across all maturing loans
  const totalAmount = loans.reduce((sum, loan) => {
    const filteredInvestors = investorId
      ? loan.loanInvestors.filter((li) => li.investor.id === investorId)
      : loan.loanInvestors;
    return sum + calculateAmountDueOnDate(filteredInvestors);
  }, 0);

  // Calculate counts by loan type
  const typeCounts = loans.reduce(
    (acc, loan) => {
      acc[loan.type] = (acc[loan.type] || 0) + 1;
      return acc;
    },
    {} as Record<string, number>,
  );

  return (
    <Card className="border-t-4 border-t-chart-2 bg-gradient-to-br from-chart-2/5 to-transparent">
      <CardHeader className="space-y-0 pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CardTitle className="font-semibold text-base">
              Incoming Payouts
            </CardTitle>
            {loans.length > 0 && (
              <button
                onClick={onViewAllClick}
                className={cn(
                  'text-xs font-medium text-muted-foreground bg-muted px-1.5 py-0.5 rounded-md transition-colors',
                  onViewAllClick &&
                    'hover:bg-chart-2/20 hover:text-chart-2 cursor-pointer',
                )}
                title="View all incoming payouts"
              >
                {loans.length}
              </button>
            )}
          </div>
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
                <div className="flex items-center justify-between mb-1">
                  <p className="text-sm font-medium text-muted-foreground">
                    Total Amount:
                  </p>
                  <p className="text-sm font-semibold text-chart-2">
                    {formatCurrency(totalAmount)}
                  </p>
                </div>
                {/* Loan type breakdown */}
                <div className="flex items-center gap-1 text-[10px] text-muted-foreground mb-3">
                  {typeCounts['Lot Title'] > 0 && (
                    <button
                      onClick={() => onTypeFilterClick?.('Lot Title')}
                      className={cn(
                        'flex items-center gap-1 px-2 py-1 rounded-md transition-colors',
                        onTypeFilterClick
                          ? 'hover:bg-orange-100 dark:hover:bg-orange-900/30 cursor-pointer'
                          : 'cursor-default',
                      )}
                    >
                      <span className="w-2 h-2 rounded-full bg-orange-400" />
                      {typeCounts['Lot Title']} Lot
                    </button>
                  )}
                  {typeCounts['OR/CR'] > 0 && (
                    <button
                      onClick={() => onTypeFilterClick?.('OR/CR')}
                      className={cn(
                        'flex items-center gap-1 px-2 py-1 rounded-md transition-colors',
                        onTypeFilterClick
                          ? 'hover:bg-indigo-100 dark:hover:bg-indigo-900/30 cursor-pointer'
                          : 'cursor-default',
                      )}
                    >
                      <span className="w-2 h-2 rounded-full bg-indigo-400" />
                      {typeCounts['OR/CR']} OR/CR
                    </button>
                  )}
                  {typeCounts['Agent'] > 0 && (
                    <button
                      onClick={() => onTypeFilterClick?.('Agent')}
                      className={cn(
                        'flex items-center gap-1 px-2 py-1 rounded-md transition-colors',
                        onTypeFilterClick
                          ? 'hover:bg-fuchsia-100 dark:hover:bg-fuchsia-900/30 cursor-pointer'
                          : 'cursor-default',
                      )}
                    >
                      <span className="w-2 h-2 rounded-full bg-fuchsia-400" />
                      {typeCounts['Agent']} Agent
                    </button>
                  )}
                </div>
                <div className="space-y-2 max-h-[320px] overflow-y-auto pr-1">
                  {displayLoans.map((loan) => {
                    // Filter loan investors by investorId if provided
                    const filteredInvestors = investorId
                      ? loan.loanInvestors.filter(
                          (li) => li.investor.id === investorId,
                        )
                      : loan.loanInvestors;

                    // Calculate amount due on this date (matches transaction amount)
                    // For multiple interest: capital + final period interest only
                    // For single interest: capital + total interest
                    const amount = calculateAmountDueOnDate(filteredInvestors);

                    const cardContent = (
                      <>
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
                            variant={getLoanTypeBadge(loan.type).variant}
                            className={`${getLoanTypeBadge(loan.type).className} text-[10px] px-2 py-0.5`}
                          >
                            {loan.type}
                          </Badge>
                          <span className="text-muted-foreground flex-shrink-0 font-medium">
                            Due:{' '}
                            {format(new Date(loan.dueDate), 'MMM dd, yyyy')}
                          </span>
                        </div>
                      </>
                    );

                    const cardClassName =
                      'flex flex-col p-3 border-2 border-border bg-background rounded-xl hover:bg-chart-2/5 hover:shadow-md transition-all duration-300 gap-1 cursor-pointer';

                    if (onLoanClick) {
                      return (
                        <div
                          key={loan.id}
                          onClick={() => onLoanClick(loan)}
                          className={cardClassName}
                        >
                          {cardContent}
                        </div>
                      );
                    }

                    return (
                      <Link
                        key={loan.id}
                        href={`/loans/${loan.id}`}
                        className={cardClassName}
                      >
                        {cardContent}
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

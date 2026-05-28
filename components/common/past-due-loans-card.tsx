import { Badge } from '@/components/ui/badge';
import { TriangleAlert } from 'lucide-react';
import Link from 'next/link';
import { format } from 'date-fns';
import { formatCurrency } from '@/lib/format';
import { calculateOverdueAmount } from '@/lib/calculations';
import { getLoanTypeBadge } from '@/lib/badge-config';
import {
  ActivityPanelCard,
  ActivityEmptyState,
  ActivityListRow,
  activityItemClassName,
  activityListScrollClassName,
} from './activity-panel-card';
import type { LoanWithInvestors, LoanType } from '@/lib/types';
import { cn } from '@/lib/utils';

interface PastDueLoansCardProps {
  loans: LoanWithInvestors[];
  loading?: boolean;
  loadingVariant?: 'empty' | 'list';
  investorId?: number;
  onLoanClick?: (loan: LoanWithInvestors) => void;
  onTypeFilterClick?: (type: LoanType) => void;
  onViewAllClick?: () => void;
}

export function PastDueLoansCard({
  loans,
  loading = false,
  loadingVariant = 'list',
  investorId,
  onLoanClick,
  onTypeFilterClick,
  onViewAllClick,
}: PastDueLoansCardProps) {
  const displayLoans = [...loans].sort((a, b) => {
    const getDisplayDate = (loan: LoanWithInvestors) => {
      const hasMultipleInterest = loan.loanInvestors.some(
        (li) => li.hasMultipleInterest,
      );

      if (hasMultipleInterest) {
        const overduePeriods = loan.loanInvestors
          .flatMap((li) => li.interestPeriods || [])
          .filter((period) => period.status == 'Overdue')
          .sort(
            (a, b) =>
              new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime(),
          );

        if (overduePeriods.length > 0) {
          return new Date(overduePeriods[0].dueDate);
        }
      }

      return new Date(loan.dueDate);
    };

    const dateA = getDisplayDate(a);
    const dateB = getDisplayDate(b);

    return dateB.getTime() - dateA.getTime();
  });

  const totalAmount = loans.reduce((sum, loan) => {
    const filteredInvestors = investorId
      ? loan.loanInvestors.filter((li) => li.investor.id == investorId)
      : loan.loanInvestors;
    return sum + calculateOverdueAmount(filteredInvestors);
  }, 0);

  const typeCounts = loans.reduce(
    (acc, loan) => {
      acc[loan.type] = (acc[loan.type] || 0) + 1;
      return acc;
    },
    {} as Record<string, number>,
  );

  return (
    <ActivityPanelCard
      title="Past Due Loans"
      count={loans.length}
      icon={TriangleAlert}
      accentClassName="bg-chart-5/12"
      iconClassName="text-chart-5"
      stripeClassName="bg-gradient-to-r from-chart-5 to-chart-5/60"
      loading={loading}
      loadingVariant={loadingVariant}
      onViewAllClick={onViewAllClick}
    >
      {displayLoans.length == 0 ? (
        <ActivityEmptyState message="No overdue loans" />
      ) : (
        <div className="space-y-3">
          <div className="surface-muted grid grid-cols-[auto_minmax(0,1fr)] items-center gap-x-3 gap-y-0.5 px-3 py-2.5">
            <p className="text-xs font-medium text-muted-foreground">
              Total amount
            </p>
            <p className="text-right text-sm font-bold tabular-nums text-chart-5">
              {formatCurrency(totalAmount)}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-1.5">
            {typeCounts['Lot Title'] > 0 && (
              <button
                type="button"
                onClick={() => onTypeFilterClick?.('Lot Title')}
                className={cn(
                  'inline-flex items-center gap-1.5 rounded-full bg-muted px-2.5 py-1 text-[10px] font-medium text-muted-foreground transition-colors',
                  onTypeFilterClick && 'hover:bg-primary/10 hover:text-primary cursor-pointer'
                )}
              >
                <span className="h-1.5 w-1.5 rounded-full bg-orange-400" />
                {typeCounts['Lot Title']} Lot
              </button>
            )}
            {typeCounts['OR/CR'] > 0 && (
              <button
                type="button"
                onClick={() => onTypeFilterClick?.('OR/CR')}
                className={cn(
                  'inline-flex items-center gap-1.5 rounded-full bg-muted px-2.5 py-1 text-[10px] font-medium text-muted-foreground transition-colors',
                  onTypeFilterClick && 'hover:bg-primary/10 hover:text-primary cursor-pointer'
                )}
              >
                <span className="h-1.5 w-1.5 rounded-full bg-violet-400" />
                {typeCounts['OR/CR']} OR/CR
              </button>
            )}
            {typeCounts['Agent'] > 0 && (
              <button
                type="button"
                onClick={() => onTypeFilterClick?.('Agent')}
                className={cn(
                  'inline-flex items-center gap-1.5 rounded-full bg-muted px-2.5 py-1 text-[10px] font-medium text-muted-foreground transition-colors',
                  onTypeFilterClick && 'hover:bg-primary/10 hover:text-primary cursor-pointer'
                )}
              >
                <span className="h-1.5 w-1.5 rounded-full bg-pink-400" />
                {typeCounts['Agent']} Agent
              </button>
            )}
          </div>

          <div className={activityListScrollClassName}>
            {displayLoans.map((loan) => {
              const filteredInvestors = investorId
                ? loan.loanInvestors.filter((li) => li.investor.id == investorId)
                : loan.loanInvestors;
              const amount = calculateOverdueAmount(filteredInvestors);

              let displayDate = loan.dueDate;
              const hasMultipleInterest = loan.loanInvestors.some(
                (li) => li.hasMultipleInterest,
              );

              if (hasMultipleInterest) {
                const overduePeriods = loan.loanInvestors
                  .flatMap((li) => li.interestPeriods || [])
                  .filter((period) => period.status == 'Overdue')
                  .sort(
                    (a, b) =>
                      new Date(a.dueDate).getTime() -
                      new Date(b.dueDate).getTime(),
                  );

                if (overduePeriods.length > 0) {
                  displayDate = overduePeriods[0].dueDate;
                }
              }

              const content = (
                <ActivityListRow
                  title={loan.loanName}
                  amount={formatCurrency(amount)}
                  amountClassName="text-chart-5"
                  badge={
                    <Badge
                      variant={getLoanTypeBadge(loan.type).variant}
                      className={`${getLoanTypeBadge(loan.type).className} text-[10px] px-2 py-0.5`}
                    >
                      {loan.type}
                    </Badge>
                  }
                  footer={
                    <span className="text-[11px] font-medium text-muted-foreground">
                      Due {format(new Date(displayDate), 'MMM dd, yyyy')}
                    </span>
                  }
                />
              );

              if (onLoanClick) {
                return (
                  <button
                    key={loan.id}
                    type="button"
                    onClick={() => onLoanClick(loan)}
                    className={activityItemClassName}
                  >
                    {content}
                  </button>
                );
              }

              return (
                <Link
                  key={loan.id}
                  href={`/loans/${loan.id}`}
                  className={activityItemClassName}
                >
                  {content}
                </Link>
              );
            })}
          </div>
        </div>
      )}
    </ActivityPanelCard>
  );
}

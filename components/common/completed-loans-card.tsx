import { Badge } from '@/components/ui/badge';
import { CheckCircle } from 'lucide-react';
import Link from 'next/link';
import {
  formatCurrency,
  formatText,
  formatCount,
  formatDateShort,
} from '@/lib/format';
import { calculateAmountDueOnDate } from '@/lib/calculations';
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

interface CompletedLoansCardProps {
  loans: LoanWithInvestors[];
  loading?: boolean;
  loadingVariant?: 'empty' | 'list';
  investorId?: number;
  onLoanClick?: (loan: LoanWithInvestors) => void;
  onTypeFilterClick?: (type: LoanType) => void;
  onViewAllClick?: () => void;
}

export function CompletedLoansCard({
  loans,
  loading = false,
  loadingVariant = 'list',
  investorId,
  onLoanClick,
  onTypeFilterClick,
  onViewAllClick,
}: CompletedLoansCardProps) {
  const displayLoans = loans;

  const totalAmount = loans.reduce((sum, loan) => {
    const filteredInvestors = investorId
      ? loan.loanInvestors.filter((li) => li.investor.id === investorId)
      : loan.loanInvestors;
    return sum + calculateAmountDueOnDate(filteredInvestors);
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
      title="Completed Loans"
      count={loans.length}
      icon={CheckCircle}
      accentClassName="bg-chart-1/12"
      iconClassName="text-chart-1"
      stripeClassName="bg-gradient-to-r from-primary to-primary/60"
      loading={loading}
      loadingVariant={loadingVariant}
      onViewAllClick={onViewAllClick}
    >
      {displayLoans.length === 0 ? (
        <ActivityEmptyState message="No completed loans" />
      ) : (
        <div className="space-y-3">
          <div className="surface-muted grid grid-cols-[auto_minmax(0,1fr)] items-center gap-x-3 gap-y-0.5 px-3 py-2.5">
            <p className="text-xs font-medium text-muted-foreground">
              Total amount
            </p>
            <p className="text-right text-sm font-bold tabular-nums text-chart-1">
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
                {formatCount(typeCounts['Lot Title'])} Lot
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
                {formatCount(typeCounts['OR/CR'])} OR/CR
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
                {formatCount(typeCounts['Agent'])} Agent
              </button>
            )}
          </div>

          <div className={activityListScrollClassName}>
            {displayLoans.map((loan) => {
              const filteredInvestors = investorId
                ? loan.loanInvestors.filter((li) => li.investor.id === investorId)
                : loan.loanInvestors;
              const amount = calculateAmountDueOnDate(filteredInvestors);

              const content = (
                <ActivityListRow
                  title={formatText(loan.loanName)}
                  amount={formatCurrency(amount)}
                  amountClassName="text-chart-1"
                  badge={
                    <Badge
                      variant={getLoanTypeBadge(loan.type).variant}
                      className={`${getLoanTypeBadge(loan.type).className} text-[10px] px-2 py-0.5`}
                    >
                      {formatText(loan.type)}
                    </Badge>
                  }
                  footer={
                    <span className="text-[11px] font-medium text-muted-foreground">
                      Due {formatDateShort(loan.dueDate)}
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

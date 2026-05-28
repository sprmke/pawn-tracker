import { Badge } from '@/components/ui/badge';
import { ArrowDownRight } from 'lucide-react';
import Link from 'next/link';
import { format } from 'date-fns';
import { formatCurrency } from '@/lib/format';
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

interface MaturingLoansCardProps {
  loans: LoanWithInvestors[];
  loading?: boolean;
  loadingVariant?: 'empty' | 'list';
  investorId?: number;
  onLoanClick?: (loan: LoanWithInvestors) => void;
  onTypeFilterClick?: (type: LoanType) => void;
  onViewAllClick?: () => void;
}

export function MaturingLoansCard({
  loans,
  loading = false,
  loadingVariant = 'empty',
  investorId,
  onLoanClick,
  onTypeFilterClick,
  onViewAllClick,
}: MaturingLoansCardProps) {
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
    {} as Record<string, number>
  );

  return (
    <ActivityPanelCard
      title="Incoming Payouts"
      count={loans.length}
      icon={ArrowDownRight}
      accentClassName="bg-chart-2/12"
      iconClassName="text-chart-2"
      stripeClassName="bg-gradient-to-r from-chart-2 to-chart-2/60"
      loading={loading}
      loadingVariant={loadingVariant}
      onViewAllClick={onViewAllClick}
    >
      {loans.length === 0 ? (
        <ActivityEmptyState message="No upcoming due dates" />
      ) : (
        <div className="space-y-3">
          <div className="surface-muted grid grid-cols-[auto_minmax(0,1fr)] items-center gap-x-3 gap-y-0.5 px-3 py-2.5">
            <p className="text-xs font-medium text-muted-foreground">
              Total amount
            </p>
            <p className="text-right text-sm font-bold tabular-nums text-chart-2">
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
            {loans.map((loan) => {
              const filteredInvestors = investorId
                ? loan.loanInvestors.filter((li) => li.investor.id === investorId)
                : loan.loanInvestors;
              const amount = calculateAmountDueOnDate(filteredInvestors);

              const content = (
                <ActivityListRow
                  title={loan.loanName}
                  amount={formatCurrency(amount)}
                  amountClassName="text-chart-2"
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
                      Due {format(new Date(loan.dueDate), 'MMM dd, yyyy')}
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

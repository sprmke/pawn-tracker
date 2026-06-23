import { Badge } from '@/components/ui/badge';
import { ArrowUpRight } from 'lucide-react';
import Link from 'next/link';
import {
  formatCurrency,
  formatText,
  formatCount,
  formatDateShort,
} from '@/lib/format';
import { getLoanTypeBadge } from '@/lib/badge-config';
import {
  ActivityPanelCard,
  ActivityEmptyState,
  ActivityListRow,
  activityItemClassName,
  activityListScrollClassName,
} from './activity-panel-card';
import type { LoanType } from '@/lib/types';
import { cn } from '@/lib/utils';

interface PendingDisbursement {
  id: number;
  loanId: number;
  loanName: string;
  loanType: LoanType;
  investorName: string;
  amount: string;
  sentDate: Date;
}

interface PendingDisbursementsCardProps {
  disbursements: PendingDisbursement[];
  loading?: boolean;
  loadingVariant?: 'empty' | 'list';
  onDisbursementClick?: (loanId: number) => void;
  onTypeFilterClick?: (type: LoanType) => void;
  onViewAllClick?: () => void;
}

export function PendingDisbursementsCard({
  disbursements,
  loading = false,
  loadingVariant = 'empty',
  onDisbursementClick,
  onTypeFilterClick,
  onViewAllClick,
}: PendingDisbursementsCardProps) {
  const displayDisbursements = disbursements;

  const totalAmount = disbursements.reduce(
    (sum, item) => sum + parseFloat(item.amount),
    0,
  );

  const typeCounts = disbursements.reduce(
    (acc, item) => {
      acc[item.loanType] = (acc[item.loanType] || 0) + 1;
      return acc;
    },
    {} as Record<string, number>,
  );

  return (
    <ActivityPanelCard
      title="Pending Disbursements"
      count={disbursements.length}
      icon={ArrowUpRight}
      accentClassName="bg-chart-3/12"
      iconClassName="text-chart-3"
      stripeClassName="bg-gradient-to-r from-chart-3 to-chart-3/60"
      loading={loading}
      loadingVariant={loadingVariant}
      onViewAllClick={onViewAllClick}
    >
      {displayDisbursements.length === 0 ? (
        <ActivityEmptyState message="No pending payments" />
      ) : (
        <div className="space-y-3">
          <div className="surface-muted grid grid-cols-[auto_minmax(0,1fr)] items-center gap-x-3 gap-y-0.5 px-3 py-2.5">
            <p className="text-xs font-medium text-muted-foreground">
              Total amount
            </p>
            <p className="text-right text-sm font-bold tabular-nums text-chart-3">
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
            {displayDisbursements.map((item) => {
              const content = (
                <ActivityListRow
                  title={formatText(item.loanName)}
                  amount={formatCurrency(parseFloat(item.amount))}
                  amountClassName="text-chart-3"
                  badge={
                    <Badge
                      variant={getLoanTypeBadge(item.loanType).variant}
                      className={`${getLoanTypeBadge(item.loanType).className} text-[10px] px-2 py-0.5`}
                    >
                      {formatText(item.loanType)}
                    </Badge>
                  }
                  footer={
                    <span className="text-sm font-medium text-muted-foreground">
                      {formatDateShort(item.sentDate)}
                    </span>
                  }
                />
              );

              if (onDisbursementClick) {
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => onDisbursementClick(item.loanId)}
                    className={activityItemClassName}
                  >
                    {content}
                  </button>
                );
              }

              return (
                <Link
                  key={item.id}
                  href={`/loans/${item.loanId}`}
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

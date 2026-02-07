import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ArrowUpRight } from 'lucide-react';
import Link from 'next/link';
import { format } from 'date-fns';
import { formatCurrency } from '@/lib/format';
import { getLoanTypeBadge } from '@/lib/badge-config';
import { InlineLoader } from './loading-state';
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
  onDisbursementClick?: (loanId: number) => void; // Optional click handler for modal display
  onTypeFilterClick?: (type: LoanType) => void; // Optional click handler for filtering by type
  onViewAllClick?: () => void; // Optional click handler to view all loans of this status
}

export function PendingDisbursementsCard({
  disbursements,
  loading = false,
  onDisbursementClick,
  onTypeFilterClick,
  onViewAllClick,
}: PendingDisbursementsCardProps) {
  const displayDisbursements = disbursements;

  // Calculate total pending disbursements
  const totalAmount = disbursements.reduce(
    (sum, item) => sum + parseFloat(item.amount),
    0,
  );

  // Calculate counts by loan type
  const typeCounts = disbursements.reduce(
    (acc, item) => {
      acc[item.loanType] = (acc[item.loanType] || 0) + 1;
      return acc;
    },
    {} as Record<string, number>,
  );

  return (
    <Card className="border-t-4 border-t-chart-3 bg-gradient-to-br from-chart-3/5 to-transparent">
      <CardHeader className="space-y-0 pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CardTitle className="font-semibold text-base">
              Pending Disbursements
            </CardTitle>
            {disbursements.length > 0 && (
              <button
                onClick={onViewAllClick}
                className={cn(
                  'text-xs font-medium text-muted-foreground bg-muted px-1.5 py-0.5 rounded-md transition-colors',
                  onViewAllClick &&
                    'hover:bg-chart-3/20 hover:text-chart-3 cursor-pointer',
                )}
                title="View all pending disbursements"
              >
                {disbursements.length}
              </button>
            )}
          </div>
          <div className="flex h-7 w-7 items-center justify-center rounded-xl bg-gradient-to-br from-chart-3/20 to-chart-3/10">
            <ArrowUpRight className="h-4 w-4 text-chart-3" />
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
            {displayDisbursements.length === 0 ? (
              <p className="text-center text-muted-foreground py-8 text-sm">
                No pending payments
              </p>
            ) : (
              <>
                <div className="flex items-center justify-between mb-1">
                  <p className="text-sm font-medium text-muted-foreground">
                    Total Amount:
                  </p>
                  <p className="text-sm font-semibold text-chart-3">
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
                  {displayDisbursements.map((item) => {
                    const cardContent = (
                      <>
                        <div className="flex items-start justify-between gap-2">
                          <p className="text-xs font-medium truncate flex-1">
                            {item.loanName}
                          </p>
                          <p className="text-xs font-semibold text-chart-3 flex-shrink-0">
                            {formatCurrency(parseFloat(item.amount))}
                          </p>
                        </div>
                        <div className="flex items-center justify-between text-xs">
                          <Badge
                            variant={getLoanTypeBadge(item.loanType).variant}
                            className={`${getLoanTypeBadge(item.loanType).className} text-[10px] px-2 py-0.5`}
                          >
                            {item.loanType}
                          </Badge>
                          <span className="text-muted-foreground flex-shrink-0 font-medium">
                            {format(new Date(item.sentDate), 'MMM dd, yyyy')}
                          </span>
                        </div>
                      </>
                    );

                    const cardClassName =
                      'flex flex-col p-3 border-2 border-chart-3/20 bg-background rounded-xl hover:bg-chart-3/5 hover:shadow-md transition-all duration-300 gap-1 cursor-pointer';

                    if (onDisbursementClick) {
                      return (
                        <div
                          key={item.id}
                          onClick={() => onDisbursementClick(item.loanId)}
                          className={cardClassName}
                        >
                          {cardContent}
                        </div>
                      );
                    }

                    return (
                      <Link
                        key={item.id}
                        href={`/loans/${item.loanId}`}
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

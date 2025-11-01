import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ArrowDownRight } from 'lucide-react';
import Link from 'next/link';
import { format } from 'date-fns';
import { formatCurrency } from '@/lib/format';
import { calculateTotalPrincipal } from '@/lib/calculations';
import { getLoanStatusBadge } from '@/lib/badge-config';
import { InlineLoader } from './loading-state';
import type { LoanWithInvestors } from '@/lib/types';

interface MaturingLoansCardProps {
  loans: LoanWithInvestors[];
  limit?: number;
  loading?: boolean;
}

export function MaturingLoansCard({
  loans,
  limit = 5,
  loading = false,
}: MaturingLoansCardProps) {
  const displayLoans = loans.slice(0, limit);

  return (
    <Card>
      <CardHeader className={limit === 3 ? 'space-y-0 pb-3' : ''}>
        <div className="flex items-center justify-between">
          <CardTitle className={limit === 3 ? 'text-sm' : 'text-base'}>
            Incoming Payouts
          </CardTitle>
          <ArrowDownRight className="h-5 w-5 text-emerald-500" />
        </div>
        <p className="text-xs text-muted-foreground">Due within 14 days</p>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="flex items-center justify-center py-4">
            <InlineLoader size="md" />
          </div>
        ) : (
          <div className="space-y-2">
            {displayLoans.length === 0 ? (
              <p className="text-center text-muted-foreground py-4 text-sm">
                No upcoming due dates
              </p>
            ) : (
              displayLoans.map((loan) => (
                <Link
                  key={loan.id}
                  href={`/loans/${loan.id}`}
                  className="flex flex-col p-3 border border-emerald-500/20 bg-emerald-500/5 rounded-lg hover:bg-emerald-500/10 transition-colors gap-1"
                >
                  <div className="flex items-start justify-between gap-2">
                    <p className="text-sm font-medium truncate flex-1">
                      {loan.loanName}
                    </p>
                    <p className="text-sm font-semibold text-emerald-600 dark:text-emerald-400 flex-shrink-0">
                      {formatCurrency(
                        calculateTotalPrincipal(loan.loanInvestors)
                      )}
                    </p>
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <Badge
                      variant={getLoanStatusBadge(loan.status).variant}
                      className={`${
                        getLoanStatusBadge(loan.status).className
                      } text-[10px] px-1 py-0`}
                    >
                      {loan.type}
                    </Badge>
                    <span className="text-muted-foreground flex-shrink-0">
                      Due: {format(new Date(loan.dueDate), 'MMM dd, yyyy')}
                    </span>
                  </div>
                </Link>
              ))
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

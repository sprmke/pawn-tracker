import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { TriangleAlert } from 'lucide-react';
import Link from 'next/link';
import { format } from 'date-fns';
import { formatCurrency } from '@/lib/format';
import { calculateTotalPrincipal } from '@/lib/calculations';
import { InlineLoader } from './loading-state';
import type { LoanWithInvestors } from '@/lib/types';

interface PastDueLoansCardProps {
  loans: LoanWithInvestors[];
  limit?: number;
  loading?: boolean;
}

export function PastDueLoansCard({
  loans,
  limit = 5,
  loading = false,
}: PastDueLoansCardProps) {
  const displayLoans = loans.slice(0, limit);

  return (
    <Card>
      <CardHeader className={limit === 3 ? 'space-y-0 pb-3' : ''}>
        <div className="flex items-center justify-between">
          <CardTitle className={limit === 3 ? 'text-sm' : 'text-base'}>
            Past Due Loans
          </CardTitle>
          <TriangleAlert className="h-5 w-5 text-rose-500" />
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
              <p className="text-center text-muted-foreground py-4 text-sm">
                No overdue loans
              </p>
            ) : (
              displayLoans.map((loan) => (
                <Link
                  key={loan.id}
                  href={`/loans/${loan.id}`}
                  className="flex flex-col p-3 border border-rose-500/20 bg-rose-500/5 rounded-lg hover:bg-rose-500/10 transition-colors gap-1"
                >
                  <div className="flex items-start justify-between gap-2">
                    <p className="text-sm font-medium truncate flex-1">
                      {loan.loanName}
                    </p>
                    <p className="text-sm font-semibold text-rose-600 dark:text-rose-400 flex-shrink-0">
                      {formatCurrency(
                        calculateTotalPrincipal(loan.loanInvestors)
                      )}
                    </p>
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <Badge
                      variant="destructive"
                      className="text-[10px] px-1 py-0"
                    >
                      {loan.status}
                    </Badge>
                    <span className="text-muted-foreground flex-shrink-0 font-medium">
                      Was: {format(new Date(loan.dueDate), 'MMM dd, yyyy')}
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

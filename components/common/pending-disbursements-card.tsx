import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowUpRight } from 'lucide-react';
import Link from 'next/link';
import { format } from 'date-fns';
import { formatCurrency } from '@/lib/format';
import { InlineLoader } from './loading-state';

interface PendingDisbursement {
  id: number;
  loanId: number;
  loanName: string;
  investorName: string;
  amount: string;
  sentDate: Date;
}

interface PendingDisbursementsCardProps {
  disbursements: PendingDisbursement[];
  limit?: number;
  loading?: boolean;
}

export function PendingDisbursementsCard({
  disbursements,
  limit = 5,
  loading = false,
}: PendingDisbursementsCardProps) {
  const displayDisbursements = disbursements.slice(0, limit);

  return (
    <Card>
      <CardHeader className={limit === 3 ? 'space-y-0 pb-3' : ''}>
        <div className="flex items-center justify-between">
          <CardTitle className={limit === 3 ? 'text-sm' : 'text-base'}>
            Pending Disbursements
          </CardTitle>
          <ArrowUpRight className="h-5 w-5 text-amber-500" />
        </div>
        <p className="text-xs text-muted-foreground">
          Unpaid transactions from partially funded loans
        </p>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="flex items-center justify-center py-4">
            <InlineLoader size="md" />
          </div>
        ) : (
          <div className="space-y-2">
            {displayDisbursements.length === 0 ? (
              <p className="text-center text-muted-foreground py-4 text-sm">
                No pending payments
              </p>
            ) : (
              displayDisbursements.map((item) => (
                <Link
                  key={item.id}
                  href={`/loans/${item.loanId}`}
                  className="flex flex-col p-3 border border-amber-500/20 bg-amber-500/5 rounded-lg hover:bg-amber-500/10 transition-colors gap-1"
                >
                  <div className="flex items-start justify-between gap-2">
                    <p className="text-sm font-medium truncate flex-1">
                      {item.loanName}
                    </p>
                    <p className="text-sm font-semibold text-amber-600 dark:text-amber-400 flex-shrink-0">
                      {formatCurrency(parseFloat(item.amount))}
                    </p>
                  </div>
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <span className="truncate">{item.investorName}</span>
                    <span className="flex-shrink-0">
                      {format(new Date(item.sentDate), 'MMM dd, yyyy')}
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

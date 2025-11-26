import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowUpRight } from 'lucide-react';
import Link from 'next/link';
import { format } from 'date-fns';
import { formatCurrency } from '@/lib/format';
import { InlineLoader } from './loading-state';
import { cn } from '@/lib/utils';

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
  loading?: boolean;
}

export function PendingDisbursementsCard({
  disbursements,
  loading = false,
}: PendingDisbursementsCardProps) {
  const displayDisbursements = disbursements;

  // Calculate total pending disbursements
  const totalAmount = disbursements.reduce(
    (sum, item) => sum + parseFloat(item.amount),
    0
  );

  return (
    <Card className="border-t-4 border-t-chart-3 bg-gradient-to-br from-chart-3/5 to-transparent">
      <CardHeader className="space-y-0 pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="font-semibold text-base">
            Pending Disbursements
          </CardTitle>
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
                <div className="flex items-center justify-between mb-3">
                  <p className="text-sm font-medium text-muted-foreground">
                    Total Amount:
                  </p>
                  <p className="text-sm  font-semibold text-chart-3">
                    {formatCurrency(totalAmount)}
                  </p>
                </div>
                <div className="space-y-2 max-h-[320px] overflow-y-auto pr-1">
                  {displayDisbursements.map((item) => (
                    <Link
                      key={item.id}
                      href={`/loans/${item.loanId}`}
                      className="flex flex-col p-3 border-2 border-chart-3/20 bg-background rounded-xl hover:bg-chart-3/5 hover:shadow-md transition-all duration-300 gap-1"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <p className="text-xs font-medium truncate flex-1">
                          {item.loanName}
                        </p>
                        <p className="text-xs font-semibold text-chart-3 flex-shrink-0">
                          {formatCurrency(parseFloat(item.amount))}
                        </p>
                      </div>
                      <div className="flex items-center justify-between text-xs text-muted-foreground">
                        <span className="truncate font-medium">
                          {item.investorName}
                        </span>
                        <span className="flex-shrink-0">
                          {format(new Date(item.sentDate), 'MMM dd, yyyy')}
                        </span>
                      </div>
                    </Link>
                  ))}
                </div>
              </>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

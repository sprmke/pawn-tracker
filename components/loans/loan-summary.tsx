import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { formatCurrency } from '@/lib/format';
import { getLoanStatusBadge } from '@/lib/badge-config';
import { LoanStatus } from '@/lib/types';

interface LoanSummaryProps {
  totalPrincipal: number;
  averageRate: number;
  totalInterest: number;
  totalAmount: number;
  uniqueInvestors: number;
  status?: LoanStatus;
  balance?: number;
  showStatus?: boolean;
}

export function LoanSummary({
  totalPrincipal,
  averageRate,
  totalInterest,
  totalAmount,
  uniqueInvestors,
  status,
  balance,
  showStatus = true,
}: LoanSummaryProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg sm:text-xl">Summary</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
          <div className="p-4 bg-muted rounded-lg">
            <p className="text-xs sm:text-sm text-muted-foreground mb-1">
              Total Principal
            </p>
            <p className="text-base sm:text-lg font-bold">
              {formatCurrency(totalPrincipal)}
            </p>
          </div>
          <div className="p-4 bg-muted rounded-lg">
            <p className="text-xs sm:text-sm text-muted-foreground mb-1">
              Avg. Rate
            </p>
            <p className="text-base sm:text-lg font-bold">
              {averageRate.toFixed(2)}%
            </p>
          </div>
          <div className="p-4 bg-muted rounded-lg">
            <p className="text-xs sm:text-sm text-muted-foreground mb-1">
              Total Interest
            </p>
            <p className="text-base sm:text-lg font-bold">
              {formatCurrency(totalInterest)}
            </p>
          </div>
          <div className="p-4 bg-muted rounded-lg">
            <p className="text-xs sm:text-sm text-muted-foreground mb-1">
              Total Amount
            </p>
            <p className="text-base sm:text-lg font-bold">
              {formatCurrency(totalAmount)}
            </p>
          </div>
          {status === 'Partially Funded' &&
            balance !== undefined &&
            balance > 0 && (
              <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                <p className="text-xs sm:text-sm text-yellow-800 font-semibold mb-1">
                  Pending Balance
                </p>
                <p className="text-base sm:text-lg font-bold text-yellow-900">
                  {formatCurrency(balance)}
                </p>
              </div>
            )}
          {showStatus && status && (
            <div className="p-4 bg-muted rounded-lg">
              <p className="text-xs sm:text-sm text-muted-foreground mb-1">
                Status
              </p>
              <div className="mt-1">
                <Badge
                  variant={getLoanStatusBadge(status).variant}
                  className={getLoanStatusBadge(status).className}
                >
                  {status}
                </Badge>
              </div>
            </div>
          )}
          <div className="p-4 bg-muted rounded-lg">
            <p className="text-xs sm:text-sm text-muted-foreground mb-1">
              Investors
            </p>
            <p className="text-base sm:text-lg font-bold">{uniqueInvestors}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

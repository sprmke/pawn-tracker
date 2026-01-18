import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { formatCurrency } from '@/lib/format';
import { getLoanStatusBadge } from '@/lib/badge-config';
import { LoanStatus } from '@/lib/types';

interface MultipleInterestPaymentStatus {
  hasMultipleDueDates: boolean;
  totalPeriods: number;
  completedPeriods: number;
  pendingPeriods: number;
  paidAmount: number;
  pendingAmount: number;
}

interface LoanSummarySectionProps {
  totalPrincipal: number;
  averageRate: number;
  totalInterest: number;
  totalAmount: number;
  uniqueInvestors: number;
  status?: LoanStatus;
  balance?: number;
  showStatus?: boolean;
  title?: string;
  multipleInterestPaymentStatus?: MultipleInterestPaymentStatus;
}

export function LoanSummarySection({
  totalPrincipal,
  averageRate,
  totalInterest,
  totalAmount,
  uniqueInvestors,
  status,
  balance,
  showStatus = true,
  title = 'Summary',
  multipleInterestPaymentStatus,
}: LoanSummarySectionProps) {
  // Handle case where principal is 0 but there's fixed interest
  const hasFixedInterestWithZeroCapital =
    totalPrincipal === 0 && totalInterest > 0;

  const hasMultipleDueDates =
    multipleInterestPaymentStatus?.hasMultipleDueDates ?? false;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg sm:text-xl">{title}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-4 grid-cols-2 lg:grid-cols-5">
          <div className="p-3 bg-muted rounded-lg">
            <p className="text-xs sm:text-sm text-muted-foreground mb-1">
              Total Principal
            </p>
            <p className="text-base font-semibold">
              {formatCurrency(totalPrincipal)}
            </p>
          </div>
          <div className="p-3 bg-muted rounded-lg">
            <p className="text-xs sm:text-sm text-muted-foreground mb-1">
              Avg. Rate
            </p>
            <p className="text-base font-semibold">
              {hasFixedInterestWithZeroCapital
                ? `Fixed ${formatCurrency(totalInterest)}`
                : `${averageRate.toFixed(2)}%`}
            </p>
          </div>
          <div className="p-3 bg-muted rounded-lg">
            <p className="text-xs sm:text-sm text-muted-foreground mb-1">
              Total Interest
            </p>
            <p className="text-base font-semibold">
              {formatCurrency(totalInterest)}
            </p>
          </div>
          <div className="p-3 bg-muted rounded-lg">
            <p className="text-xs sm:text-sm text-muted-foreground mb-1">
              Total Amount
            </p>
            <p className="text-base font-semibold">
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
                <p className="text-base font-semibold text-yellow-900">
                  {formatCurrency(balance)}
                </p>
              </div>
            )}
          {showStatus && status && (
            <div className="p-3 bg-muted rounded-lg">
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
          {!(
            status === 'Partially Funded' &&
            balance !== undefined &&
            balance > 0
          ) &&
            !showStatus && (
              <div className="p-3 bg-muted rounded-lg">
                <p className="text-xs sm:text-sm text-muted-foreground mb-1">
                  Investors
                </p>
                <p className="text-base font-semibold">{uniqueInvestors}</p>
              </div>
            )}
        </div>

        {/* Multiple Due Dates Payment Status */}
        {hasMultipleDueDates && multipleInterestPaymentStatus && (
          <div className="pt-4 border-t">
            <p className="text-sm font-medium text-muted-foreground mb-3">
              Payment Progress ({multipleInterestPaymentStatus.completedPeriods}/
              {multipleInterestPaymentStatus.totalPeriods} periods completed)
            </p>
            <div className="grid gap-4 grid-cols-2">
              <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                <p className="text-xs sm:text-sm text-green-800 font-medium mb-1">
                  Amount Paid
                </p>
                <p className="text-base font-semibold text-green-900">
                  {formatCurrency(multipleInterestPaymentStatus.paidAmount)}
                </p>
              </div>
              <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg">
                <p className="text-xs sm:text-sm text-amber-800 font-medium mb-1">
                  Balance Remaining
                </p>
                <p className="text-base font-semibold text-amber-900">
                  {formatCurrency(multipleInterestPaymentStatus.pendingAmount)}
                </p>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

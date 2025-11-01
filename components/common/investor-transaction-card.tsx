import React from 'react';
import { formatCurrency, formatDate } from '@/lib/format';
import { calculateInterest } from '@/lib/calculations';
import { cn } from '@/lib/utils';

interface Transaction {
  amount: string;
  sentDate: Date | string;
  isPaid: boolean;
  interestRate?: string;
  interestType?: string;
  hasMultipleInterest?: boolean;
  interestPeriods?: InterestPeriod[];
}

interface InterestPeriod {
  id: number | string;
  dueDate: Date | string;
  interestRate: string;
  interestType?: string;
}

interface InvestorTransactionCardProps {
  investorName: string;
  transactions: Transaction[];
  totalPrincipal: number;
  avgRate: number;
  totalInterest: number;
  total: number;
  hasFutureSentDate?: boolean;
}

export function InvestorTransactionCard({
  investorName,
  transactions,
  totalPrincipal,
  avgRate,
  totalInterest,
  total,
}: InvestorTransactionCardProps) {
  // Check if investor has multiple interest periods
  const hasMultipleInterest = transactions.some((t) => t.hasMultipleInterest);
  const interestPeriods =
    transactions.find((t) => t.interestPeriods)?.interestPeriods || [];

  const containerClass = `space-y-1.5 p-3 rounded-lg border`;

  return (
    <div className={containerClass}>
      <div className="flex items-center justify-between gap-2">
        <span className="text-xs font-semibold">{investorName}</span>
      </div>
      <div>
        <div className="grid grid-cols-4 gap-2">
          <div className="flex flex-col gap-0.5">
            <span className="text-muted-foreground block text-[9px]">
              Principal
            </span>
            <span className="font-medium text-foreground text-[10px]">
              {formatCurrency(totalPrincipal.toString())}
            </span>
          </div>
          <div className="flex flex-col gap-0.5">
            <span className="text-muted-foreground block text-[9px]">
              Avg. Rate
            </span>
            <span className="text-foreground text-[10px]">
              {avgRate.toFixed(2)}%
            </span>
          </div>
          <div className="flex flex-col gap-0.5">
            <span className="text-muted-foreground block text-[9px]">
              Interest
            </span>
            <span className="text-foreground text-[10px]">
              {formatCurrency(totalInterest.toString())}
            </span>
          </div>
          <div className="flex flex-col gap-0.5">
            <span className="text-muted-foreground block text-[9px]">
              Total
            </span>
            <span className="font-semibold text-foreground text-[10px]">
              {formatCurrency(total.toString())}
            </span>
          </div>
        </div>

        {/* Transactions Section */}
        {transactions.length > 0 && (
          <div className="mt-3 pt-3 border-t border-border/50">
            <p className="text-[10px] font-semibold text-muted-foreground mb-1">
              Principal Payments:
            </p>
            <div className="space-y-1.5">
              {transactions.map((transaction, tIndex) => {
                // Check if transaction is unpaid
                const isUnpaid = !transaction.isPaid;

                return (
                  <div
                    key={tIndex}
                    className={cn(
                      'flex justify-between items-center text-[10px] p-1.5 rounded',
                      isUnpaid
                        ? 'bg-yellow-100 border border-yellow-200'
                        : 'bg-gray-50'
                    )}
                  >
                    <span className="text-muted-foreground">
                      Payment {tIndex + 1}
                    </span>
                    <div className="flex gap-3">
                      <span className="font-medium">
                        {formatCurrency(transaction.amount)}
                      </span>
                      <span className="text-muted-foreground">
                        {formatDate(transaction.sentDate)}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Interest Breakdown for Multiple Interest */}
        {hasMultipleInterest && interestPeriods.length > 0 && (
          <div className="mt-3 pt-3 border-t border-border/50">
            <p className="text-[10px] font-semibold text-muted-foreground mb-1">
              Due Payments:
            </p>
            <div className="space-y-2">
              {interestPeriods.map((period, pIndex) => {
                const periodInterest = calculateInterest(
                  totalPrincipal,
                  period.interestRate,
                  period.interestType
                );
                const periodRate =
                  period.interestType === 'fixed'
                    ? totalPrincipal > 0
                      ? (periodInterest / totalPrincipal) * 100
                      : 0
                    : parseFloat(period.interestRate);

                const isLoanDueDate = pIndex === interestPeriods.length - 1;
                const periodLabel = isLoanDueDate
                  ? `Period ${pIndex + 1} (Final)`
                  : `Period ${pIndex + 1}`;

                return (
                  <div key={period.id} className="bg-gray-50 rounded p-2">
                    <p className="text-[9px] font-semibold text-muted-foreground mb-1">
                      {periodLabel}
                    </p>
                    <div className="grid grid-cols-3 gap-1.5 text-[10px]">
                      <div>
                        <span className="text-muted-foreground block text-[9px]">
                          Due Date
                        </span>
                        <span className="font-medium text-[10px]">
                          {formatDate(period.dueDate)}
                        </span>
                      </div>
                      <div>
                        <span className="text-muted-foreground block text-[9px]">
                          Rate
                        </span>
                        <span className="text-[10px]">
                          {periodRate.toFixed(2)}%
                        </span>
                      </div>
                      <div>
                        <span className="text-muted-foreground block text-[9px]">
                          Interest
                        </span>
                        <span className="font-medium text-[10px]">
                          {formatCurrency(periodInterest.toString())}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

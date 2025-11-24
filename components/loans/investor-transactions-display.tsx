'use client';

import { useState } from 'react';
import { toast } from '@/lib/toast';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Wallet } from 'lucide-react';
import { formatCurrency, formatDate } from '@/lib/format';
import {
  calculateInterest,
  calculateInvestmentTotal,
} from '@/lib/calculations';

interface InterestPeriod {
  id?: number | string;
  dueDate: Date | string;
  interestRate: string;
  interestAmount?: string;
  interestType?: string;
}

interface InvestorTransaction {
  id?: number | string;
  amount: string;
  interestRate: string;
  interestType?: string;
  sentDate: Date | string;
  isPaid: boolean;
}

interface InvestorWithTransactions {
  investor: {
    id: number;
    name: string;
    email?: string;
  };
  transactions: InvestorTransaction[];
  hasMultipleInterest?: boolean;
  interestPeriods?: InterestPeriod[];
}

interface InvestorTransactionsDisplayProps {
  investorsWithTransactions: InvestorWithTransactions[];
  showEmail?: boolean;
  loanId?: number;
  onRefresh?: () => void;
}

export function InvestorTransactionsDisplay({
  investorsWithTransactions,
  showEmail = true,
  loanId,
  onRefresh,
}: InvestorTransactionsDisplayProps) {
  const [payingTransactions, setPayingTransactions] = useState<
    Set<number | string>
  >(new Set());

  const handlePayTransaction = async (transactionId: number | string) => {
    if (!loanId || typeof transactionId !== 'number') return;

    setPayingTransactions((prev) => new Set(prev).add(transactionId));

    try {
      const response = await fetch(`/api/loans/${loanId}/pay-transaction`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ transactionId }),
      });

      if (!response.ok) {
        throw new Error('Failed to pay transaction');
      }

      onRefresh?.();
    } catch (error) {
      console.error('Error paying transaction:', error);
      toast.error('Failed to pay transaction. Please try again.');
    } finally {
      setPayingTransactions((prev) => {
        const newSet = new Set(prev);
        newSet.delete(transactionId);
        return newSet;
      });
    }
  };

  return (
    <div className="space-y-4">
      {investorsWithTransactions.map((item) => {
        const { investor, transactions } = item;

        // Calculate totals for this investor
        const totalCapital = transactions.reduce(
          (sum, t) => sum + parseFloat(t.amount),
          0
        );

        // Calculate interest based on investor's mode
        let totalInterest = 0;

        if (
          item.hasMultipleInterest &&
          item.interestPeriods &&
          item.interestPeriods.length > 1
        ) {
          // For multiple interest: apply periods to TOTAL capital (not per transaction)
          totalInterest = item.interestPeriods.reduce((sum, period) => {
            const interest = calculateInterest(
              totalCapital,
              period.interestRate,
              period.interestType
            );
            return sum + interest;
          }, 0);
        } else {
          // For single interest: sum up each transaction's interest
          totalInterest = transactions.reduce((sum, t) => {
            return (
              sum + calculateInterest(t.amount, t.interestRate, t.interestType)
            );
          }, 0);
        }

        const grandTotal = totalCapital + totalInterest;
        const averageRate =
          totalCapital > 0 ? (totalInterest / totalCapital) * 100 : 0;
        const hasFixedInterestWithZeroCapital =
          totalCapital === 0 && totalInterest > 0;

        return (
          <div key={investor.id} className="p-4 border rounded-lg space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2">
              <div>
                <h4 className="font-semibold text-sm sm:text-base">
                  {investor.name}
                </h4>
                {showEmail && investor.email && (
                  <p className="text-xs text-muted-foreground">
                    {investor.email}
                  </p>
                )}
              </div>
            </div>

            {/* Individual Transactions */}
            <div className="space-y-2">
              {((item.hasMultipleInterest &&
                item.interestPeriods &&
                item.interestPeriods.length > 1) ||
                transactions.length > 1) && (
                <div className="flex items-center justify-between">
                  <p className="text-sm font-semibold text-foreground">
                    Principal Payments
                  </p>
                  <Badge variant="secondary" className="text-xs w-fit">
                    {transactions.length} Payments
                  </Badge>
                </div>
              )}
              {transactions.map((transaction, index) => {
                const capital = parseFloat(transaction.amount);
                const rateValue = parseFloat(transaction.interestRate);

                // Calculate interest based on investor's mode (not per transaction)
                let interest = 0;
                let rate = 0;
                let isFixedWithZeroCapital = false;

                if (
                  item.hasMultipleInterest &&
                  item.interestPeriods &&
                  item.interestPeriods.length > 1
                ) {
                  // Calculate total interest from all periods for this transaction
                  interest = item.interestPeriods.reduce((sum, period) => {
                    return (
                      sum +
                      calculateInterest(
                        capital,
                        period.interestRate,
                        period.interestType
                      )
                    );
                  }, 0);
                  // Calculate average rate
                  rate = capital > 0 ? (interest / capital) * 100 : 0;
                } else {
                  // Single interest calculation
                  interest = calculateInterest(
                    transaction.amount,
                    transaction.interestRate,
                    transaction.interestType
                  );
                  // Always calculate and display the rate percentage
                  if (transaction.interestType === 'fixed') {
                    if (capital > 0) {
                      rate = (rateValue / capital) * 100;
                    } else {
                      // Special case: fixed interest with 0 capital
                      // We'll display the fixed amount instead of a rate
                      isFixedWithZeroCapital = true;
                      rate = rateValue; // Store the fixed amount for display
                    }
                  } else {
                    rate = rateValue;
                  }
                }

                const total = capital + interest;
                const isUnpaid = !transaction.isPaid;

                return (
                  <div
                    key={transaction.id || `transaction-${index}`}
                    className={`p-3 rounded-lg space-y-2 ${
                      isUnpaid
                        ? 'bg-yellow-50 border border-yellow-400'
                        : 'bg-muted/50'
                    }`}
                  >
                    {transactions.length > 1 && (
                      <div className="flex items-center mb-2 space-x-2">
                        <span className="text-sm font-medium text-muted-foreground">
                          Payment {index + 1}
                        </span>
                        {isUnpaid && (
                          <Badge
                            variant="warning"
                            className="text-[10px] h-3.5 px-1 py-0 leading-none"
                          >
                            To be paid
                          </Badge>
                        )}
                      </div>
                    )}
                    {item.hasMultipleInterest &&
                    item.interestPeriods &&
                    item.interestPeriods.length > 1 ? (
                      // For multiple interest: show only Principal and Sent Date
                      <div className="grid grid-cols-3 gap-2 text-sm">
                        <div>
                          <p className="text-muted-foreground">Sent Date</p>
                          <p className="font-medium">
                            {formatDate(transaction.sentDate)}
                          </p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">
                            {transactions.length > 1 ? 'Principal' : 'Capital'}
                          </p>
                          <p className="font-medium">
                            {formatCurrency(capital)}
                          </p>
                        </div>
                      </div>
                    ) : (
                      // For single interest: show all fields
                      <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 text-sm">
                        <div>
                          <p className="text-muted-foreground">Sent Date</p>
                          <p className="font-medium">
                            {formatDate(transaction.sentDate)}
                          </p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">
                            {transactions.length > 1 ? 'Principal' : 'Capital'}
                          </p>
                          <p className="font-medium">
                            {formatCurrency(capital)}
                          </p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Rate</p>
                          <p className="font-medium">
                            {isFixedWithZeroCapital
                              ? `Fixed ${formatCurrency(rate)}`
                              : `${rate.toFixed(2)}%`}
                          </p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Interest</p>
                          <p className="font-medium">
                            {formatCurrency(interest)}
                          </p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Total</p>
                          <p className="font-semibold">
                            {formatCurrency(total)}
                          </p>
                        </div>
                      </div>
                    )}

                    {isUnpaid &&
                      loanId &&
                      typeof transaction.id === 'number' && (
                        <div className="mt-2 pt-2 border-t">
                          <Button
                            size="sm"
                            onClick={() =>
                              handlePayTransaction(transaction.id!)
                            }
                            disabled={payingTransactions.has(transaction.id!)}
                            className="w-full bg-yellow-500 hover:bg-yellow-600"
                          >
                            <Wallet className="mr-2 h-4 w-4" />
                            {payingTransactions.has(transaction.id!)
                              ? 'Paying...'
                              : 'Mark as Paid'}
                          </Button>
                        </div>
                      )}
                  </div>
                );
              })}
            </div>

            {/* Show interest periods breakdown below all transactions */}
            {item.interestPeriods && item.interestPeriods.length > 1 && (
              <div className="mt-3 pt-3 border-t space-y-2">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-semibold text-foreground">
                    Due Payments
                  </p>
                  <Badge variant="secondary" className="text-xs w-fit">
                    {item.interestPeriods.length} Periods
                  </Badge>
                </div>
                <div className="space-y-2">
                  {item.interestPeriods.map((period, pIndex) => {
                    // Use total capital (sum of all transactions) for interest calculation
                    const periodInterest = calculateInterest(
                      totalCapital,
                      period.interestRate,
                      period.interestType
                    );

                    // Calculate the rate percentage based on the interest type
                    const periodRate =
                      period.interestType === 'fixed'
                        ? totalCapital > 0
                          ? (periodInterest / totalCapital) * 100
                          : 0
                        : parseFloat(period.interestRate);

                    return (
                      <div
                        key={period.id || `period-${pIndex}`}
                        className="p-3 bg-muted/50 rounded-lg"
                      >
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm font-medium text-muted-foreground">
                            {pIndex === item.interestPeriods!.length - 1
                              ? `Period ${pIndex + 1} (Final)`
                              : `Period ${pIndex + 1}`}
                          </span>
                        </div>
                        <div className="grid grid-cols-3 gap-2 text-sm">
                          <div>
                            <p className="text-muted-foreground text-xs">
                              Due Date
                            </p>
                            <p className="font-medium">
                              {formatDate(period.dueDate)}
                            </p>
                          </div>
                          <div>
                            <p className="text-muted-foreground text-xs">
                              Rate
                            </p>
                            <p className="font-medium">
                              {periodRate.toFixed(2)}%
                            </p>
                          </div>
                          <div>
                            <p className="text-muted-foreground text-xs">
                              Interest
                            </p>
                            <p className="font-semibold">
                              {formatCurrency(periodInterest)}
                            </p>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Grand Total for this investor */}
            {transactions.length > 1 && (
              <div className="pt-2 px-3 border-t">
                <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 text-xs sm:text-sm">
                  <div>
                    <p className="text-muted-foreground font-semibold">
                      Principal
                    </p>
                    <p className="font-bold">{formatCurrency(totalCapital)}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground font-semibold">
                      Avg. Rate
                    </p>
                    <p className="font-bold">
                      {hasFixedInterestWithZeroCapital
                        ? `Fixed ${formatCurrency(totalInterest)}`
                        : `${averageRate.toFixed(2)}%`}
                    </p>
                  </div>
                  <div>
                    <p className="text-muted-foreground font-semibold">
                      Interest
                    </p>
                    <p className="font-bold">{formatCurrency(totalInterest)}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground font-semibold">Total</p>
                    <p className="font-bold text-base">
                      {formatCurrency(grandTotal)}
                    </p>
                  </div>
                  <div></div>
                </div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

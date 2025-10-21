'use client';

import { useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Wallet } from 'lucide-react';
import { formatCurrency, formatDate, isFutureDate } from '@/lib/format';
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
      alert('Failed to pay transaction. Please try again.');
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

        // Calculate interest based on investor's mode (not per transaction)
        const totalInterest = transactions.reduce((sum, t) => {
          const capital = parseFloat(t.amount);

          // Check if investor has multiple interest periods
          if (
            item.hasMultipleInterest &&
            item.interestPeriods &&
            item.interestPeriods.length > 0
          ) {
            // Calculate total interest from all periods for this transaction
            const periodInterest = item.interestPeriods.reduce(
              (pSum, period) => {
                const interest = calculateInterest(
                  capital,
                  period.interestRate,
                  period.interestType
                );
                return pSum + interest;
              },
              0
            );
            return sum + periodInterest;
          } else {
            // Single interest calculation
            return (
              sum + calculateInterest(t.amount, t.interestRate, t.interestType)
            );
          }
        }, 0);

        const grandTotal = totalCapital + totalInterest;
        const averageRate =
          totalCapital > 0 ? (totalInterest / totalCapital) * 100 : 0;

        return (
          <div key={investor.id} className="p-4 border rounded-lg space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2">
              <div>
                <h4 className="font-semibold text-sm sm:text-base">
                  {investor.name}
                </h4>
                {showEmail && investor.email && (
                  <p className="text-xs sm:text-sm text-muted-foreground">
                    {investor.email}
                  </p>
                )}
              </div>
              {transactions.length > 1 && (
                <Badge variant="secondary" className="text-xs w-fit">
                  {transactions.length} Transactions
                </Badge>
              )}
            </div>

            {/* Individual Transactions */}
            <div className="space-y-2">
              {transactions.map((transaction, index) => {
                const capital = parseFloat(transaction.amount);
                const rateValue = parseFloat(transaction.interestRate);

                // Calculate interest based on investor's mode (not per transaction)
                let interest = 0;
                let rate = 0;

                if (
                  item.hasMultipleInterest &&
                  item.interestPeriods &&
                  item.interestPeriods.length > 0
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
                  rate =
                    transaction.interestType === 'fixed'
                      ? capital > 0
                        ? (rateValue / capital) * 100
                        : 0
                      : rateValue;
                }

                const total = capital + interest;
                const isDateInFuture = isFutureDate(transaction.sentDate);

                return (
                  <div
                    key={transaction.id || `transaction-${index}`}
                    className={`p-3 rounded-lg space-y-2 ${
                      isDateInFuture ? 'bg-yellow-50' : 'bg-muted/30'
                    }`}
                  >
                    {transactions.length > 1 && (
                      <div className="flex items-center mb-2 space-x-2">
                        <span className="text-sm font-medium text-muted-foreground">
                          Transaction {index + 1}
                        </span>
                        {isDateInFuture && (
                          <Badge
                            variant="warning"
                            className="text-[10px] h-3.5 px-1 py-0 leading-none"
                          >
                            To be paid
                          </Badge>
                        )}
                      </div>
                    )}
                    {transactions.length === 1 && isDateInFuture && (
                      <div className="flex items-center mb-2">
                        <Badge
                          variant="warning"
                          className="text-[10px] h-3.5 px-1 py-0 leading-none"
                        >
                          To be paid
                        </Badge>
                      </div>
                    )}
                    <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 text-sm">
                      <div>
                        <p className="text-muted-foreground">
                          {transactions.length > 1 ? 'Principal' : 'Capital'}
                        </p>
                        <p className="font-medium">{formatCurrency(capital)}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">
                          {item.hasMultipleInterest ? 'Avg. Rate' : 'Rate'}
                        </p>
                        <p className="font-medium">{rate.toFixed(2)}%</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Interest</p>
                        <p className="font-medium">
                          {formatCurrency(interest)}
                        </p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Total</p>
                        <p className="font-semibold">{formatCurrency(total)}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Sent Date</p>
                        <p className="font-medium">
                          {formatDate(transaction.sentDate)}
                        </p>
                      </div>
                    </div>

                    {isDateInFuture &&
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
                              : 'Pay Now'}
                          </Button>
                        </div>
                      )}
                  </div>
                );
              })}
            </div>

            {/* Show interest periods breakdown below all transactions */}
            {item.hasMultipleInterest &&
              item.interestPeriods &&
              item.interestPeriods.length > 0 && (
                <div className="mt-3 pt-3 border-t space-y-2">
                  <p className="text-xs font-semibold text-muted-foreground">
                    Interest Periods (Applied to All Transactions):
                  </p>
                  <div className="space-y-1.5">
                    {item.interestPeriods.map((period, pIndex) => {
                      // Use the first transaction's capital for display purposes
                      const capital = parseFloat(transactions[0].amount);
                      const periodInterest = calculateInterest(
                        capital,
                        period.interestRate,
                        period.interestType
                      );
                      const periodRate =
                        period.interestType === 'fixed'
                          ? capital > 0
                            ? (parseFloat(period.interestRate) / capital) * 100
                            : 0
                          : parseFloat(period.interestRate);

                      return (
                        <div
                          key={period.id || `period-${pIndex}`}
                          className="flex items-center justify-between text-xs bg-muted/50 p-2 rounded"
                        >
                          <span className="text-muted-foreground">
                            {pIndex === item.interestPeriods!.length - 1
                              ? 'Loan Due Date'
                              : `Period ${pIndex + 1}`}{' '}
                            - {formatDate(period.dueDate)}
                          </span>
                          <div className="flex items-center gap-3">
                            <span className="font-medium">
                              {periodRate.toFixed(2)}%
                            </span>
                            <span className="font-semibold">
                              {formatCurrency(periodInterest)}
                            </span>
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
                    <p className="font-bold">{averageRate.toFixed(2)}%</p>
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

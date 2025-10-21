'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { DollarSign, Users, Calendar, MapPin, FileText } from 'lucide-react';
import { LoanWithInvestors } from '@/lib/types';
import { getLoanStatusBadge, getLoanTypeBadge } from '@/lib/badge-config';

interface LoanDetailContentProps {
  loan: LoanWithInvestors;
  showHeader?: boolean;
}

export function LoanDetailContent({
  loan,
  showHeader = true,
}: LoanDetailContentProps) {
  const formatCurrency = (amount: string | number) => {
    const numAmount = typeof amount === 'string' ? parseFloat(amount) : amount;
    return new Intl.NumberFormat('en-PH', {
      style: 'currency',
      currency: 'PHP',
    }).format(numAmount);
  };

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString('en-PH', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const getTotalPrincipal = () => {
    return loan.loanInvestors.reduce(
      (sum, li) => sum + parseFloat(li.amount),
      0
    );
  };

  const getTotalInterest = () => {
    return loan.loanInvestors.reduce((sum, li) => {
      const capital = parseFloat(li.amount);
      const rate = parseFloat(li.interestRate) / 100;
      return sum + capital * rate;
    }, 0);
  };

  const getTotalAmount = () => {
    return getTotalPrincipal() + getTotalInterest();
  };

  const getAverageInterestRate = () => {
    const totalPrincipal = getTotalPrincipal();
    if (totalPrincipal === 0) return 0;
    const totalInterest = getTotalInterest();
    return (totalInterest / totalPrincipal) * 100;
  };

  const getLoanDuration = () => {
    const today = new Date();
    const dueDate = new Date(loan.dueDate);
    const diffTime = Math.abs(dueDate.getTime() - today.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    const months = Math.floor(diffDays / 30);
    const remainingAfterMonths = diffDays % 30;
    const weeks = Math.floor(remainingAfterMonths / 7);
    const days = remainingAfterMonths % 7;

    const parts = [];
    if (months > 0) {
      parts.push(`${months} ${months === 1 ? 'Month' : 'Months'}`);
    }
    if (weeks > 0) {
      parts.push(`${weeks} ${weeks === 1 ? 'Week' : 'Weeks'}`);
    }
    if (days > 0) {
      parts.push(`${days} ${days === 1 ? 'Day' : 'Days'}`);
    }

    return parts.length > 0 ? parts.join(', ') : '0 Days';
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      {showHeader && (
        <div className="space-y-1">
          <div className="flex items-center gap-3 flex-wrap">
            <h2 className="text-2xl sm:text-3xl font-bold tracking-tight">
              {loan.loanName}
            </h2>
          </div>
        </div>
      )}

      {/* Summary Cards */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg sm:text-xl">Summary</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 grid-cols-2 lg:grid-cols-5">
            <div className="p-4 bg-muted rounded-lg">
              <p className="text-xs sm:text-sm text-muted-foreground mb-1">
                Total Principal
              </p>
              <p className="text-lg sm:text-xl font-bold">
                {formatCurrency(getTotalPrincipal())}
              </p>
            </div>
            <div className="p-4 bg-muted rounded-lg">
              <p className="text-xs sm:text-sm text-muted-foreground mb-1">
                Avg. Rate
              </p>
              <p className="text-lg sm:text-xl font-bold">
                {getAverageInterestRate().toFixed(2)}%
              </p>
            </div>
            <div className="p-4 bg-muted rounded-lg">
              <p className="text-xs sm:text-sm text-muted-foreground mb-1">
                Total Interest
              </p>
              <p className="text-lg sm:text-xl font-bold">
                {formatCurrency(getTotalInterest())}
              </p>
            </div>
            <div className="p-4 bg-muted rounded-lg">
              <p className="text-xs sm:text-sm text-muted-foreground mb-1">
                Total Amount
              </p>
              <p className="text-lg sm:text-xl font-bold">
                {formatCurrency(getTotalAmount())}
              </p>
            </div>
            <div className="p-4 bg-muted rounded-lg">
              <p className="text-xs sm:text-sm text-muted-foreground mb-1">
                Investors
              </p>
              <p className="text-lg sm:text-xl font-bold">
                {new Set(loan.loanInvestors.map((li) => li.investor.id)).size}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Loan Details */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg sm:text-xl">Loan Details</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">Loan Name</p>
              <p className="font-medium">{loan.loanName}</p>
            </div>

            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">Type</p>
              <Badge
                variant={getLoanTypeBadge(loan.type).variant}
                className={getLoanTypeBadge(loan.type).className}
              >
                {loan.type}
              </Badge>
            </div>

            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">Due Date</p>
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <span className="font-medium">{formatDate(loan.dueDate)}</span>
              </div>
            </div>

            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">Status</p>
              <Badge
                variant={getLoanStatusBadge(loan.status).variant}
                className={getLoanStatusBadge(loan.status).className}
              >
                {loan.status}
              </Badge>
            </div>

            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">Free Lot (sqm)</p>
              <div className="flex items-center gap-2">
                <MapPin className="h-4 w-4 text-muted-foreground" />
                <span className="font-medium">
                  {loan.freeLotSqm ? `${loan.freeLotSqm} sqm` : '-'}
                </span>
              </div>
            </div>

            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">Duration</p>
              <span className="font-medium">{getLoanDuration()}</span>
            </div>
          </div>

          <div className="space-y-1">
            <p className="text-sm text-muted-foreground">Notes</p>
            <p className="text-sm whitespace-pre-wrap">{loan.notes || '-'}</p>
          </div>
        </CardContent>
      </Card>

      {/* Investors Section */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg sm:text-xl">Investors</CardTitle>
        </CardHeader>
        <CardContent>
          {loan.loanInvestors.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8">
              <Users className="h-12 w-12 text-muted-foreground mb-4" />
              <p className="text-muted-foreground mb-4">
                No investors allocated
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {(() => {
                // Group loan investors by investor ID
                const investorMap = new Map<
                  number,
                  Array<(typeof loan.loanInvestors)[0]>
                >();

                loan.loanInvestors.forEach((li) => {
                  const existing = investorMap.get(li.investor.id) || [];
                  existing.push(li);
                  investorMap.set(li.investor.id, existing);
                });

                return Array.from(investorMap.values()).map((transactions) => {
                  const investor = transactions[0].investor;
                  const totalCapital = transactions.reduce(
                    (sum, t) => sum + parseFloat(t.amount),
                    0
                  );
                  const totalInterest = transactions.reduce((sum, t) => {
                    const capital = parseFloat(t.amount);
                    const rate = parseFloat(t.interestRate) / 100;
                    return sum + capital * rate;
                  }, 0);
                  const grandTotal = totalCapital + totalInterest;
                  const averageRate =
                    totalCapital > 0 ? (totalInterest / totalCapital) * 100 : 0;

                  return (
                    <div
                      key={investor.id}
                      className="p-4 border rounded-lg space-y-3"
                    >
                      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2">
                        <div>
                          <h4 className="font-semibold text-sm sm:text-base">
                            {investor.name}
                          </h4>
                          <p className="text-xs sm:text-sm text-muted-foreground">
                            {investor.email}
                          </p>
                        </div>
                        {transactions.length > 1 && (
                          <Badge variant="secondary" className="text-xs">
                            {transactions.length} Transactions
                          </Badge>
                        )}
                      </div>

                      {/* Individual Transactions */}
                      <div className="space-y-2">
                        {transactions.map((li, index) => {
                          const capital = parseFloat(li.amount);
                          const rate = parseFloat(li.interestRate);
                          const interest = capital * (rate / 100);
                          const total = capital + interest;

                          // Check if sent date is in the future
                          const today = new Date();
                          today.setHours(0, 0, 0, 0);
                          const sentDate = new Date(li.sentDate);
                          sentDate.setHours(0, 0, 0, 0);
                          const isFutureSentDate = sentDate > today;

                          return (
                            <div
                              key={li.id}
                              className={`p-3 rounded-lg space-y-2 ${
                                isFutureSentDate
                                  ? 'bg-yellow-50'
                                  : 'bg-muted/30'
                              }`}
                            >
                              {transactions.length > 1 && (
                                <div className="flex items-center mb-2 space-x-2">
                                  <span className="text-sm font-medium text-muted-foreground">
                                    Transaction {index + 1}
                                  </span>
                                  {isFutureSentDate && (
                                    <Badge
                                      variant="warning"
                                      className="text-[10px] h-3.5 px-1 py-0 leading-none"
                                    >
                                      To be paid
                                    </Badge>
                                  )}
                                </div>
                              )}
                              <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 text-sm">
                                <div>
                                  <p className="text-muted-foreground">
                                    Principal
                                  </p>
                                  <p className="font-medium">
                                    {formatCurrency(capital)}
                                  </p>
                                </div>
                                <div>
                                  <p className="text-muted-foreground">Rate</p>
                                  <p className="font-medium">{rate}%</p>
                                </div>
                                <div>
                                  <p className="text-muted-foreground">
                                    Interest
                                  </p>
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
                                <div>
                                  <p className="text-muted-foreground">
                                    Sent Date
                                  </p>
                                  <p className="font-medium">
                                    {formatDate(li.sentDate)}
                                  </p>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>

                      {/* Grand Total for this investor */}
                      {transactions.length > 1 && (
                        <div className="pt-2 px-3 border-t">
                          <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 text-xs sm:text-sm">
                            <div>
                              <p className="text-muted-foreground font-semibold">
                                Principal
                              </p>
                              <p className="font-bold">
                                {formatCurrency(totalCapital)}
                              </p>
                            </div>
                            <div>
                              <p className="text-muted-foreground font-semibold">
                                Avg. Rate
                              </p>
                              <p className="font-bold">
                                {averageRate.toFixed(2)}%
                              </p>
                            </div>
                            <div>
                              <p className="text-muted-foreground font-semibold">
                                Interest
                              </p>
                              <p className="font-bold">
                                {formatCurrency(totalInterest)}
                              </p>
                            </div>
                            <div>
                              <p className="text-muted-foreground font-semibold">
                                Total
                              </p>
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
                });
              })()}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

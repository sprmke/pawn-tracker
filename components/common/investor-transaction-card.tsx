'use client';

import React, { useState } from 'react';
import { formatCurrency, formatDate } from '@/lib/format';
import { calculateInterest } from '@/lib/calculations';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { getInterestPeriodStatusBadge } from '@/lib/badge-config';
import type { InterestPeriodStatus } from '@/lib/types';

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
  status?: InterestPeriodStatus;
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
  
  const [showAllPeriodsModal, setShowAllPeriodsModal] = useState(false);
  const [showAllTransactionsModal, setShowAllTransactionsModal] = useState(false);
  const PERIODS_LIMIT = 3;
  const TRANSACTIONS_LIMIT = 3;

  const containerClass = `space-y-1.5 p-3 rounded-lg border`;

  // Helper function to render transaction cards
  const renderTransactionCard = (transaction: Transaction, tIndex: number) => {
    const isUnpaid = !transaction.isPaid;

    return (
      <div
        key={tIndex}
        className={cn(
          'flex flex-col text-[10px] p-1.5 rounded',
          isUnpaid
            ? 'bg-yellow-100 border border-yellow-200'
            : 'bg-gray-50'
        )}
      >
        <p className="text-[9px] font-semibold text-muted-foreground mb-1">
          Payment {tIndex + 1}
        </p>
        <div className="grid grid-cols-3 gap-1.5 text-[10px]">
          <div>
            <span className="text-muted-foreground block text-[9px]">
              Sent Date
            </span>
            <span className="font-medium text-[10px]">
              {formatDate(transaction.sentDate)}
            </span>
          </div>
          <div>
            <span className="text-muted-foreground block text-[9px]">
              Principal
            </span>
            <span className="text-[10px]">
              {formatCurrency(transaction.amount)}
            </span>
          </div>
        </div>
      </div>
    );
  };

  // Helper function to render period cards
  const renderPeriodCard = (period: InterestPeriod, pIndex: number, totalPeriods: number) => {
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

    const isLoanDueDate = pIndex === totalPeriods - 1;
    const periodLabel = isLoanDueDate
      ? `Period ${pIndex + 1} (Final)`
      : `Period ${pIndex + 1}`;
    
    const periodStatus = period.status || 'Pending';
    const statusBadge = getInterestPeriodStatusBadge(periodStatus);

    return (
      <div key={period.id} className="bg-gray-50 rounded p-2">
        <div className="flex items-center justify-between mb-1">
          <p className="text-[9px] font-semibold text-muted-foreground">
            {periodLabel}
          </p>
          <Badge
            variant={statusBadge.variant}
            className={`text-[8px] px-1.5 py-0 ${statusBadge.className || ''}`}
          >
            {periodStatus}
          </Badge>
        </div>
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
  };

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
              {(() => {
                const displayedTransactions = transactions.slice(0, TRANSACTIONS_LIMIT);
                const hasMore = transactions.length > TRANSACTIONS_LIMIT;
                
                return (
                  <>
                    {displayedTransactions.map((transaction, tIndex) =>
                      renderTransactionCard(transaction, tIndex)
                    )}
                    {hasMore && (
                      <Button
                        variant="link"
                        size="sm"
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          setShowAllTransactionsModal(true);
                        }}
                        className="h-auto p-0 text-xs text-primary hover:underline"
                      >
                        View {transactions.length - TRANSACTIONS_LIMIT} more payment{transactions.length - TRANSACTIONS_LIMIT > 1 ? 's' : ''}
                      </Button>
                    )}
                  </>
                );
              })()}
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
              {/* Sort periods by due date (earliest first) to maintain correct order */}
              {(() => {
                const sortedPeriods = [...interestPeriods].sort(
                  (a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime()
                );
                
                const displayedPeriods = sortedPeriods.slice(0, PERIODS_LIMIT);
                const hasMore = sortedPeriods.length > PERIODS_LIMIT;
                
                return (
                  <>
                    {displayedPeriods.map((period, pIndex) =>
                      renderPeriodCard(period, pIndex, sortedPeriods.length)
                    )}
                    {hasMore && (
                      <Button
                        variant="link"
                        size="sm"
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          setShowAllPeriodsModal(true);
                        }}
                        className="h-auto p-0 text-xs text-primary hover:underline"
                      >
                        View {sortedPeriods.length - PERIODS_LIMIT} more period{sortedPeriods.length - PERIODS_LIMIT > 1 ? 's' : ''}
                      </Button>
                    )}
                  </>
                );
              })()}
            </div>
          </div>
        )}
      </div>

      {/* Modal for all principal payments */}
      <Dialog open={showAllTransactionsModal} onOpenChange={setShowAllTransactionsModal}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>All Principal Payments - {investorName}</DialogTitle>
          </DialogHeader>
          <div className="max-h-[500px] overflow-y-auto">
            <div className="space-y-1.5">
              {transactions.map((transaction, tIndex) =>
                renderTransactionCard(transaction, tIndex)
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Modal for all interest periods */}
      <Dialog open={showAllPeriodsModal} onOpenChange={setShowAllPeriodsModal}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>All Due Payments - {investorName}</DialogTitle>
          </DialogHeader>
          <div className="max-h-[500px] overflow-y-auto">
            <div className="space-y-2">
              {(() => {
                const sortedPeriods = [...interestPeriods].sort(
                  (a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime()
                );
                
                return sortedPeriods.map((period, pIndex) =>
                  renderPeriodCard(period, pIndex, sortedPeriods.length)
                );
              })()}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

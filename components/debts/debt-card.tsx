'use client';

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ActionButtonsGroup, CardActionFooter } from '@/components/common';
import {
  formatCurrency,
  formatDateShort,
  formatText,
} from '@/lib/format';
import {
  calculatePerPeriodInterest,
  calculateDebtSummary,
} from '@/lib/debt-calculations';
import type { DebtWithInvestor } from '@/lib/types';

interface DebtCardProps {
  debt: DebtWithInvestor;
  onQuickView: (debt: DebtWithInvestor) => void;
  viewHref: string;
}

export function DebtCard({ debt, onQuickView, viewHref }: DebtCardProps) {
  const perPeriodInterest = calculatePerPeriodInterest(
    debt.amount,
    debt.interestRate,
  );
  const debtDate =
    debt.date instanceof Date
      ? debt.date.toISOString().split('T')[0]
      : String(debt.date).split('T')[0];
  const totalInterestIncludingFees = calculateDebtSummary({
    principal: debt.amount,
    interestRate: debt.interestRate,
    interestInterval: debt.interestInterval,
    debtDate,
    durationMonths: debt.durationMonths,
    additionalFees: debt.additionalFees ?? [],
  }).totalInterestIncludingFees;

  return (
    <Card className="hover:shadow-lg transition-shadow h-full flex flex-col overflow-hidden">
      <CardHeader className="pb-1 px-4 pt-4">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <CardTitle className="text-sm sm:text-base truncate mb-2">
              {formatText(debt.name)}
            </CardTitle>
          </div>
          <Badge variant="secondary" className="text-[10px] shrink-0">
            {debt.interestInterval}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="flex-1 space-y-3 px-4 pb-3 pt-0">
        <div className="grid grid-cols-2 gap-2">
          <div className="p-2 bg-muted/50 rounded-lg">
            <p className="text-[10px] text-muted-foreground mb-1">Start Date</p>
            <p className="text-xs font-medium">
              {formatDateShort(debt.date)}
            </p>
          </div>
          <div className="p-2 bg-muted/50 rounded-lg">
            <p className="text-[10px] text-muted-foreground mb-1">Principal</p>
            <p className="text-xs font-semibold">
              {formatCurrency(debt.amount)}
            </p>
          </div>
          <div className="p-2 bg-muted/50 rounded-lg">
            <p className="text-[10px] text-muted-foreground mb-1">
              Interest / {debt.interestInterval === 'Daily' ? 'Day' : debt.interestInterval === 'Weekly' ? 'Week' : debt.interestInterval === 'Monthly' ? 'Month' : 'Year'}
            </p>
            <p className="text-xs font-semibold text-emerald-600">
              {formatCurrency(perPeriodInterest)}
            </p>
            <p className="text-[10px] text-muted-foreground">
              at {debt.interestRate}%
            </p>
          </div>
          <div className="p-2 bg-muted/50 rounded-lg">
            <p className="text-[10px] text-muted-foreground mb-1">Duration</p>
            <p className="text-xs font-medium">{debt.durationMonths} months</p>
          </div>
          <div className="p-2 bg-muted/50 rounded-lg">
            <p className="text-[10px] text-muted-foreground mb-1">Investor</p>
            <p className="text-xs font-medium truncate">
              {formatText(debt.investor.name)}
            </p>
          </div>
        </div>
        <div className="p-2 bg-emerald-50 dark:bg-emerald-950/30 rounded-lg border border-emerald-200/50 dark:border-emerald-800/50">
          <p className="text-[10px] text-muted-foreground mb-1">
            Total interest & fees
          </p>
          <p className="text-sm font-semibold text-emerald-600">
            {formatCurrency(totalInterestIncludingFees)}
          </p>
        </div>
      </CardContent>
      <CardActionFooter>
        <ActionButtonsGroup
          onQuickView={(e) => {
            e.preventDefault();
            e.stopPropagation();
            onQuickView(debt);
          }}
          viewHref={viewHref}
          showView={false}
          size="md"
        />
      </CardActionFooter>
    </Card>
  );
}

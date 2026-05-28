'use client';

import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  getTransactionDirectionBadge,
  getTransactionTypeBadge,
} from '@/lib/badge-config';
import type { TransactionWithInvestor } from '@/lib/types';

interface TransactionEventCardProps {
  transaction: TransactionWithInvestor;
  onClick: () => void;
  formatCurrency: (amount: number) => string;
  size?: 'sm' | 'md' | 'lg';
}

export function TransactionEventCard({
  transaction,
  onClick,
  formatCurrency,
  size = 'md',
}: TransactionEventCardProps) {
  const amount = parseFloat(transaction.amount);

  const sizeClasses = {
    sm: 'text-[11px]',
    md: 'text-xs',
    lg: 'text-sm',
  };

  const paddingClasses = {
    sm: 'p-2',
    md: 'p-3',
    lg: 'p-4',
  };

  return (
    <Card
      className={`${
        paddingClasses[size]
      } cursor-pointer hover:shadow-md transition-shadow border-l-4 ${
        transaction.direction === 'In'
          ? 'border-l-emerald-400'
          : 'border-l-rose-400'
      }`}
      onClick={onClick}
    >
      <CardContent className="p-0 space-y-2">
        <div className="flex flex-col gap-2">
          <div className="flex">
            <Badge
              variant={getTransactionTypeBadge(transaction.type).variant}
              className={`text-[9px] px-1.5 h-4 ${
                getTransactionTypeBadge(transaction.type).className || ''
              }`}
            >
              {transaction.type}
            </Badge>
          </div>
          <div className="flex-1 min-w-0">
            <p className={`${sizeClasses[size]} font-semibold truncate`}>
              {transaction.name}
            </p>
            <p
              className={`${sizeClasses[size]} text-muted-foreground truncate`}
            >
              {transaction.investor.name}
            </p>
          </div>
        </div>
        <div className="pt-1 border-t">
          <p
            className={`${sizeClasses[size]} font-bold ${
              transaction.direction === 'In'
                ? 'text-emerald-600 dark:text-emerald-400'
                : 'text-rose-600 dark:text-rose-400'
            }`}
          >
            {transaction.direction === 'In' ? '+' : '-'}
            {formatCurrency(amount)}
          </p>
        </div>
      </CardContent>
    </Card>
  );
}

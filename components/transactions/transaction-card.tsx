'use client';

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ActionButtonsGroup } from '@/components/common';
import { formatCurrency, formatDateShort } from '@/lib/format';
import {
  getTransactionDirectionBadge,
  getTransactionTypeBadge,
} from '@/lib/badge-config';
import type { TransactionWithInvestor } from '@/lib/types';

interface TransactionCardProps {
  transaction: TransactionWithInvestor;
  onQuickView: (transaction: TransactionWithInvestor) => void;
  viewHref: string;
}

export function TransactionCard({
  transaction,
  onQuickView,
  viewHref,
}: TransactionCardProps) {
  return (
    <Card className="hover:shadow-lg transition-shadow h-full">
      <CardHeader className="pb-1">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <CardTitle className="text-sm sm:text-base truncate mb-2">
              {transaction.name}
            </CardTitle>
          </div>
          <Badge
            variant={getTransactionTypeBadge(transaction.type).variant}
            className={`text-[10px] ${
              getTransactionTypeBadge(transaction.type).className || ''
            }`}
          >
            {transaction.type}
          </Badge>
          <Badge
            variant={
              getTransactionDirectionBadge(transaction.direction).variant
            }
            className={`text-[10px] ${
              getTransactionDirectionBadge(transaction.direction).className ||
              ''
            }`}
          >
            {transaction.direction}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4 px-4">
        {/* Summary Section */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          <div className="p-2 bg-muted/50 rounded-lg">
            <p className="text-[10px] text-muted-foreground mb-1">Date</p>
            <p className="text-xs font-medium">
              {formatDateShort(transaction.date)}
            </p>
          </div>
          <div className="p-2 bg-muted/50 rounded-lg">
            <p className="text-[10px] text-muted-foreground mb-1">Amount</p>
            <p
              className={`text-xs font-semibold break-words ${
                transaction.direction === 'In'
                  ? 'text-emerald-600 dark:text-emerald-400'
                  : 'text-rose-600 dark:text-rose-400'
              }`}
            >
              {transaction.direction === 'In' ? '+' : '-'}
              {formatCurrency(transaction.amount)}
            </p>
          </div>
          <div className="p-2 bg-muted/50 rounded-lg">
            <p className="text-[10px] text-muted-foreground mb-1">Investor</p>
            <p className="text-xs font-medium break-words truncate">
              {transaction.investor.name}
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="pt-2 border-t">
          <ActionButtonsGroup
            onQuickView={(e) => {
              e.preventDefault();
              e.stopPropagation();
              onQuickView(transaction);
            }}
            viewHref={viewHref}
            showView={false}
            size="md"
          />
        </div>
      </CardContent>
    </Card>
  );
}

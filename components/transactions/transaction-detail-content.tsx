'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { TransactionWithInvestor } from '@/lib/types';
import {
  getTransactionTypeBadge,
  getTransactionDirectionBadge,
} from '@/lib/badge-config';
import { formatDate, formatCurrency } from '@/lib/format';

interface TransactionDetailContentProps {
  transaction: TransactionWithInvestor;
  showHeader?: boolean;
}

export function TransactionDetailContent({
  transaction,
  showHeader = true,
}: TransactionDetailContentProps) {
  const isIncoming = transaction.direction === 'In';

  return (
    <div className="space-y-6">
      {/* Header */}
      {showHeader && (
        <div className="space-y-1">
          <div className="flex items-center gap-3 flex-wrap">
            <h2 className="text-xl sm:text-2xl font-bold tracking-tight">
              {transaction.name}
            </h2>
          </div>
        </div>
      )}

      {/* Amount Card */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg sm:text-xl">Amount</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="p-4 border rounded-lg bg-muted/30">
            <p className="text-sm text-muted-foreground">
              {isIncoming ? 'Incoming' : 'Outgoing'} Transaction
            </p>
            <p
              className={`text-2xl font-bold ${
                isIncoming ? 'text-emerald-600' : 'text-rose-600'
              }`}
            >
              {isIncoming ? '+' : '-'}
              {formatCurrency(transaction.amount)}
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Transaction Details */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg sm:text-xl">
            Transaction Details
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label className="text-sm text-muted-foreground">
                Name / Label
              </Label>
              <p className="font-medium">{transaction.name}</p>
            </div>

            <div className="space-y-2">
              <Label className="text-sm text-muted-foreground">Date</Label>
              <div className="flex items-center gap-2">
                <span className="font-medium">
                  {formatDate(transaction.date)}
                </span>
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-sm text-muted-foreground">Type</Label>
              <div>
                <Badge
                  variant={getTransactionTypeBadge(transaction.type).variant}
                  className={
                    getTransactionTypeBadge(transaction.type).className
                  }
                >
                  {transaction.type}
                </Badge>
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-sm text-muted-foreground">Direction</Label>
              <div>
                <Badge
                  variant={
                    getTransactionDirectionBadge(transaction.direction).variant
                  }
                  className={
                    getTransactionDirectionBadge(transaction.direction)
                      .className
                  }
                >
                  {transaction.direction}
                </Badge>
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-sm text-muted-foreground">Investor</Label>
              <div className="flex items-center gap-2">
                <span className="font-medium">{transaction.investor.name}</span>
              </div>
            </div>
          </div>

          {/* Notes Section */}
          {transaction.notes && (
            <div className="space-y-2 pt-4 border-t">
              <Label className="text-sm text-muted-foreground">Notes</Label>
              <p className="text-sm whitespace-pre-wrap leading-relaxed">
                {transaction.notes}
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

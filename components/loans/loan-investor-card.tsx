'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import {
  DropdownMenuRadix,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu-radix';
import { X, Plus, ChevronDown, ChevronUp, AlertCircle, MoreVertical, Copy } from 'lucide-react';
import { isMoreThanOneMonth, isMoreThanOneMonthAndFifteenDays } from '@/lib/date-utils';
import { toast } from '@/lib/toast';
import {
  MultipleInterestManager,
  InterestPeriodData,
} from './multiple-interest-manager';
import type { Investor } from '@/lib/types';

interface Transaction {
  id: string;
  amount: string;
  sentDate: string;
  interestType: 'rate' | 'fixed';
  interestRate: string;
  interestAmount: string;
  isPaid: boolean;
}

interface SelectedInvestor {
  investor: Investor;
  transactions: Transaction[];
  hasMultipleInterest: boolean;
  interestPeriods: InterestPeriodData[];
}

interface LoanInvestorCardProps {
  selectedInvestor: SelectedInvestor;
  watchDueDate: string | null;
  onRemoveInvestor: (investorId: number) => void;
  onAddTransaction: (investorId: number) => void;
  onRemoveTransaction: (investorId: number, transactionId: string) => void;
  onUpdateTransaction: (
    investorId: number,
    transactionId: string,
    field: keyof Omit<Transaction, 'id'>,
    value: string
  ) => void;
  onPeriodsChange: (periods: InterestPeriodData[]) => void;
  onModeChange: (mode: 'single' | 'multiple') => void;
  onCopy: (investorId: number) => void;
}

export function LoanInvestorCard({
  selectedInvestor: si,
  watchDueDate,
  onRemoveInvestor,
  onAddTransaction,
  onRemoveTransaction,
  onUpdateTransaction,
  onPeriodsChange,
  onModeChange,
  onCopy,
}: LoanInvestorCardProps) {
  return (
    <Collapsible defaultOpen={true}>
      <Card>
        <CardContent className="p-2! px-4!">
          <div>
            {/* Header with collapsible trigger */}
            <div className="flex items-center justify-between gap-1">
              <CollapsibleTrigger asChild>
                <Button
                  type="button"
                  variant="ghost"
                  className="group flex-1 justify-between p-0 hover:bg-transparent"
                >
                  <div className="flex items-center gap-3">
                    <h4 className="font-semibold text-sm sm:text-base">
                      {si.investor.name}
                    </h4>
                    <div className="flex items-center gap-2">
                      <Badge variant="secondary" className="text-[10px] h-5">
                        {si.transactions.length} payment
                        {si.transactions.length !== 1 ? 's' : ''}
                      </Badge>
                    </div>
                  </div>
                  <ChevronDown className="h-4 w-4 transition-transform duration-200 group-data-[state=open]:rotate-180" />
                </Button>
              </CollapsibleTrigger>
              <div className="flex items-center gap-1">
                <DropdownMenuRadix>
                  <DropdownMenuTrigger asChild>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="flex-shrink-0 h-8 w-8"
                    >
                      <MoreVertical className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => onCopy(si.investor.id)}>
                      <Copy className="mr-2 h-4 w-4" />
                      Copy
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenuRadix>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={() => onRemoveInvestor(si.investor.id)}
                  className="flex-shrink-0 h-8 w-8"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </div>

            <CollapsibleContent className="space-y-4 mt-2">
              {/* Transactions */}
              <div
                className={`space-y-3 p-4 border rounded-lg bg-muted/30 ${
                  watchDueDate &&
                  si.transactions.some(
                    (t) =>
                      t.sentDate && isMoreThanOneMonthAndFifteenDays(t.sentDate, watchDueDate)
                  )
                    ? 'border-blue-400'
                    : ''
                }`}
              >
                <Label className="text-sm font-semibold inline-flex">
                  Principal Payments
                </Label>
                {si.transactions.map((transaction, index) => {
                  // Check if this transaction is unpaid
                  const isUnpaid = !transaction.isPaid;

                  return (
                    <Collapsible key={transaction.id} defaultOpen={true}>
                      <div
                        className={`border rounded-lg ${
                          isUnpaid
                            ? 'bg-yellow-50 border-yellow-400'
                            : 'bg-muted/50'
                        }`}
                      >
                        {/* Transaction Header - Always Visible */}
                        <div className="p-3 flex items-center justify-between gap-2">
                          <CollapsibleTrigger asChild>
                            <Button
                              type="button"
                              variant="ghost"
                              className="group flex-1 justify-between p-0 h-auto hover:bg-transparent"
                            >
                              <div className="flex items-center gap-2 flex-wrap">
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
                              <ChevronDown className="h-3.5 w-3.5 transition-transform duration-200 group-data-[state=open]:rotate-180 flex-shrink-0" />
                            </Button>
                          </CollapsibleTrigger>
                          {si.transactions.length > 1 && (
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() =>
                                onRemoveTransaction(
                                  si.investor.id,
                                  transaction.id
                                )
                              }
                              className="h-7 w-7 p-0"
                            >
                              <X className="h-3 w-3" />
                            </Button>
                          )}
                        </div>

                        {/* Transaction Details - Collapsible */}
                        <CollapsibleContent>
                          <div className="px-3 pb-3 space-y-3 border-t pt-3">
                            <div className="grid gap-3 sm:grid-cols-2">
                              <div className="space-y-2">
                                <Label className="text-xs">Amount *</Label>
                                <Input
                                  type="number"
                                  step="0.01"
                                  value={transaction.amount}
                                  onChange={(e) =>
                                    onUpdateTransaction(
                                      si.investor.id,
                                      transaction.id,
                                      'amount',
                                      e.target.value
                                    )
                                  }
                                  placeholder="0.00"
                                />
                              </div>

                              <div className="space-y-2">
                                <Label className="text-xs">Sent Date</Label>
                                <Input
                                  type="date"
                                  value={transaction.sentDate}
                                  max={watchDueDate || undefined}
                                  onChange={(e) => {
                                    const newDate = e.target.value;
                                    // Check if date is already used by another transaction
                                    const isDateUsed = si.transactions.some(
                                      (t) =>
                                        t.id !== transaction.id &&
                                        t.sentDate === newDate
                                    );

                                    if (isDateUsed) {
                                      toast.error(
                                        'This date is already used by another transaction for this investor. Please select a different date.'
                                      );
                                      return;
                                    }

                                    onUpdateTransaction(
                                      si.investor.id,
                                      transaction.id,
                                      'sentDate',
                                      newDate
                                    );
                                  }}
                                />
                              </div>
                            </div>

                            {/* Interest input - only show if NOT using multiple interest */}
                            {!si.hasMultipleInterest && (
                              <div className="space-y-2">
                                <Label className="text-xs">Interest</Label>
                                <Tabs
                                  value={transaction.interestType}
                                  onValueChange={(value) =>
                                    onUpdateTransaction(
                                      si.investor.id,
                                      transaction.id,
                                      'interestType',
                                      value as 'rate' | 'fixed'
                                    )
                                  }
                                >
                                  <TabsList className="grid w-full grid-cols-2 h-8">
                                    <TabsTrigger
                                      value="rate"
                                      className="text-xs"
                                    >
                                      Rate (%)
                                    </TabsTrigger>
                                    <TabsTrigger
                                      value="fixed"
                                      className="text-xs"
                                    >
                                      Fixed (₱)
                                    </TabsTrigger>
                                  </TabsList>
                                  <TabsContent value="rate" className="mt-2">
                                    <Input
                                      type="number"
                                      step="0.01"
                                      value={transaction.interestRate}
                                      onChange={(e) =>
                                        onUpdateTransaction(
                                          si.investor.id,
                                          transaction.id,
                                          'interestRate',
                                          e.target.value
                                        )
                                      }
                                      placeholder="10"
                                    />
                                  </TabsContent>
                                  <TabsContent value="fixed" className="mt-2">
                                    <Input
                                      type="number"
                                      step="0.01"
                                      value={transaction.interestAmount}
                                      onChange={(e) =>
                                        onUpdateTransaction(
                                          si.investor.id,
                                          transaction.id,
                                          'interestAmount',
                                          e.target.value
                                        )
                                      }
                                      placeholder="0.00"
                                    />
                                  </TabsContent>
                                </Tabs>
                              </div>
                            )}

                            {isUnpaid && (
                              <div className="p-2 bg-yellow-50 border border-yellow-200 rounded text-xs text-yellow-800">
                                <strong>Note:</strong> This transaction is
                                marked as unpaid. This loan will be marked as{' '}
                                <strong>Partially Funded</strong> until all
                                transactions are paid.
                              </div>
                            )}
                          </div>
                        </CollapsibleContent>
                      </div>
                    </Collapsible>
                  );
                })}

                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => onAddTransaction(si.investor.id)}
                  className="w-full"
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Add more payments
                </Button>
              </div>

              {/* Multiple Interest Manager - at investor level */}
              {watchDueDate &&
                si.transactions.some(
                  (t) =>
                    t.sentDate && isMoreThanOneMonthAndFifteenDays(t.sentDate, watchDueDate)
                ) && (
                  <div className="space-y-3 p-4 border rounded-lg bg-muted/30 border-blue-400">
                    <Label className="text-sm font-semibold inline-flex">
                      Interest Configuration
                    </Label>
                    <Alert className="bg-blue-50 border-blue-200">
                      <AlertCircle className="h-4 w-4 text-blue-600" />
                      <AlertDescription className="text-xs text-blue-800">
                        <strong>Notice:</strong> We detected that this investor
                        has a transaction spanning more than 1 month and 15 days. 
                        The "Multiple Interest" tab has been automatically selected 
                        to help you manage interest for each period separately.
                      </AlertDescription>
                    </Alert>
                    <MultipleInterestManager
                      sentDate={(() => {
                        // Get the earliest sent date from all transactions
                        const dates = si.transactions
                          .map((t) => t.sentDate)
                          .filter((d) => d)
                          .sort();
                        return dates[0] || '';
                      })()}
                      loanDueDate={watchDueDate || ''}
                      amount={si.transactions
                        .reduce(
                          (sum, t) => sum + (parseFloat(t.amount) || 0),
                          0
                        )
                        .toString()}
                      defaultInterestRate={(() => {
                        // Calculate weighted average rate from all transactions
                        const totalAmount = si.transactions.reduce(
                          (sum, t) => sum + (parseFloat(t.amount) || 0),
                          0
                        );
                        if (totalAmount === 0) return '10';

                        const weightedRate = si.transactions.reduce(
                          (sum, t) => {
                            const amount = parseFloat(t.amount) || 0;
                            const rate =
                              t.interestType === 'rate'
                                ? parseFloat(t.interestRate) || 0
                                : amount > 0
                                ? ((parseFloat(t.interestAmount) || 0) /
                                    amount) *
                                  100
                                : 0;
                            return sum + amount * rate;
                          },
                          0
                        );

                        return (weightedRate / totalAmount).toFixed(2);
                      })()}
                      defaultInterestType="rate"
                      initialMode={
                        si.hasMultipleInterest ? 'multiple' : 'single'
                      }
                      initialPeriods={si.interestPeriods}
                      onPeriodsChange={onPeriodsChange}
                      onModeChange={onModeChange}
                    />
                  </div>
                )}
            </CollapsibleContent>
          </div>
        </CardContent>
      </Card>
    </Collapsible>
  );
}

'use client';

import { useState, useEffect } from 'react';
import { toast } from '@/lib/toast';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Plus, X, MoreVertical, Copy } from 'lucide-react';
import {
  toLocalDateString,
  generateDefaultInterestPeriods,
} from '@/lib/date-utils';
import {
  DropdownMenuRadix,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu-radix';
import { CopyPeriodModal } from './copy-period-modal';

export interface InterestPeriodData {
  id: string;
  dueDate: string;
  interestRate: string;
  interestAmount: string;
  interestType: 'rate' | 'fixed';
  status?: 'Pending' | 'Completed' | 'Overdue';
}

interface MultipleInterestManagerProps {
  sentDate: string;
  loanDueDate: string;
  amount: string;
  defaultInterestRate: string;
  defaultInterestType: 'rate' | 'fixed';
  onPeriodsChange: (periods: InterestPeriodData[]) => void;
  onModeChange: (mode: 'single' | 'multiple') => void;
  initialMode?: 'single' | 'multiple';
  initialPeriods?: InterestPeriodData[];
}

export function MultipleInterestManager({
  sentDate,
  loanDueDate,
  amount,
  defaultInterestRate,
  defaultInterestType,
  onPeriodsChange,
  onModeChange,
  initialMode = 'single',
  initialPeriods,
}: MultipleInterestManagerProps) {
  const [mode, setMode] = useState<'single' | 'multiple'>(initialMode);
  const [periods, setPeriods] = useState<InterestPeriodData[]>(() => {
    if (initialPeriods && initialPeriods.length > 0) {
      return initialPeriods;
    }

    // Generate default periods based on sent date and due date
    if (sentDate && loanDueDate) {
      const defaultPeriods = generateDefaultInterestPeriods(
        sentDate,
        loanDueDate
      );
      return defaultPeriods.map((period, index) => ({
        id: `period-${Date.now()}-${index}`,
        dueDate: toLocalDateString(period.dueDate),
        interestRate: defaultInterestRate || '10',
        interestAmount: '',
        interestType: defaultInterestType || 'rate',
      }));
    }

    return [];
  });

  // Update periods when sent date or due date changes
  useEffect(() => {
    if (mode === 'multiple' && sentDate && loanDueDate) {
      const defaultPeriods = generateDefaultInterestPeriods(
        sentDate,
        loanDueDate
      );

      // Only regenerate if the number of periods changed
      if (defaultPeriods.length !== periods.length) {
        const newPeriods = defaultPeriods.map((period, index) => {
          // Try to preserve existing period data if available
          const existingPeriod = periods[index];
          return {
            id: existingPeriod?.id || `period-${Date.now()}-${index}`,
            dueDate: toLocalDateString(period.dueDate),
            interestRate:
              existingPeriod?.interestRate || defaultInterestRate || '10',
            interestAmount: existingPeriod?.interestAmount || '',
            interestType:
              existingPeriod?.interestType || defaultInterestType || 'rate',
          };
        });
        setPeriods(newPeriods);
        onPeriodsChange(newPeriods);
      }
    }
  }, [sentDate, loanDueDate, mode]);

  // Ensure the last period (Final Due Date) always has the loan due date
  useEffect(() => {
    if (mode === 'multiple' && periods.length > 0 && loanDueDate) {
      const lastPeriod = periods[periods.length - 1];
      if (lastPeriod.dueDate !== loanDueDate) {
        const updatedPeriods = periods.map((period, index) =>
          index === periods.length - 1
            ? { ...period, dueDate: loanDueDate }
            : period
        );
        setPeriods(updatedPeriods);
        onPeriodsChange(updatedPeriods);
      }
    }
  }, [loanDueDate, mode, periods]);

  // Calculate interest amount when rate or amount changes
  useEffect(() => {
    if (mode === 'multiple') {
      const updatedPeriods = periods.map((period) => {
        const principal = parseFloat(amount) || 0;
        const rate = parseFloat(period.interestRate) || 0;

        if (period.interestType === 'rate' && principal > 0) {
          const fixedAmount = principal * (rate / 100);
          return {
            ...period,
            interestAmount: fixedAmount.toFixed(2),
          };
        }

        return period;
      });

      setPeriods(updatedPeriods);
      onPeriodsChange(updatedPeriods);
    }
  }, [amount, mode]);

  const handleModeChange = (newMode: 'single' | 'multiple') => {
    setMode(newMode);
    onModeChange(newMode);

    if (newMode === 'multiple' && periods.length === 0) {
      // Generate default periods
      const defaultPeriods = generateDefaultInterestPeriods(
        sentDate,
        loanDueDate
      );
      const newPeriods = defaultPeriods.map((period, index) => ({
        id: `period-${Date.now()}-${index}`,
        dueDate: toLocalDateString(period.dueDate),
        interestRate: defaultInterestRate || '10',
        interestAmount: '',
        interestType: defaultInterestType || 'rate',
      }));
      setPeriods(newPeriods);
      onPeriodsChange(newPeriods);
    }
  };

  const addPeriod = () => {
    const newPeriod: InterestPeriodData = {
      id: `period-${Date.now()}`,
      dueDate: sentDate || toLocalDateString(new Date()),
      interestRate: defaultInterestRate || '10',
      interestAmount: '',
      interestType: defaultInterestType || 'rate',
    };
    // Insert new period before the last period (which is the loan due date)
    const newPeriods = [
      ...periods.slice(0, -1),
      newPeriod,
      periods[periods.length - 1],
    ];
    setPeriods(newPeriods);
    onPeriodsChange(newPeriods);
  };

  const removePeriod = (id: string) => {
    // Don't allow removing the last period (loan due date)
    const periodIndex = periods.findIndex((p) => p.id === id);
    if (periodIndex === periods.length - 1) return;

    const newPeriods = periods.filter((p) => p.id !== id);
    setPeriods(newPeriods);
    onPeriodsChange(newPeriods);
  };

  const updatePeriod = (
    id: string,
    field: keyof Omit<InterestPeriodData, 'id'>,
    value: string
  ) => {
    const newPeriods = periods.map((period, index) => {
      if (period.id !== id) return period;

      // Prevent updating due date for the last period (loan due date)
      if (field === 'dueDate' && index === periods.length - 1) {
        return period;
      }

      const updatedPeriod = { ...period, [field]: value };
      const principal = parseFloat(amount) || 0;

      if (field === 'interestRate' && principal > 0) {
        const rate = parseFloat(value) || 0;
        const fixedAmount = principal * (rate / 100);
        updatedPeriod.interestAmount = fixedAmount.toFixed(2);
      } else if (field === 'interestAmount' && principal > 0) {
        const fixedAmount = parseFloat(value) || 0;
        const rate = (fixedAmount / principal) * 100;
        updatedPeriod.interestRate = rate.toFixed(2);
      }

      return updatedPeriod;
    });

    setPeriods(newPeriods);
    onPeriodsChange(newPeriods);
  };

  // Calculate totals for multiple interest mode
  const calculateTotals = () => {
    const principal = parseFloat(amount) || 0;
    let totalInterest = 0;

    periods.forEach((period) => {
      if (period.interestType === 'rate') {
        const rate = parseFloat(period.interestRate) || 0;
        totalInterest += principal * (rate / 100);
      } else {
        totalInterest += parseFloat(period.interestAmount) || 0;
      }
    });

    const avgRate = principal > 0 ? (totalInterest / principal) * 100 : 0;
    const total = principal + totalInterest;

    return { principal, totalInterest, avgRate, total };
  };

  const totals = mode === 'multiple' ? calculateTotals() : null;

  const [copySourcePeriod, setCopySourcePeriod] = useState<{
    period: InterestPeriodData;
    periodIndex: number;
  } | null>(null);

  const handleCopyPeriod = (targetPeriodIds: string[], applyToAll: boolean) => {
    if (!copySourcePeriod) return;

    const sourcePeriod = copySourcePeriod.period;
    const principal = parseFloat(amount) || 0;
    const periodsToUpdate = applyToAll
      ? periods.filter((p) => p.id !== sourcePeriod.id).map((p) => p.id)
      : targetPeriodIds;

    const updatedPeriods = periods.map((period) => {
      if (periodsToUpdate.includes(period.id)) {
        // Copy interest from source period, but keep the due date
        const updatedPeriod = {
          ...period,
          interestRate: sourcePeriod.interestRate,
          interestAmount: sourcePeriod.interestAmount,
          interestType: sourcePeriod.interestType,
        };

        // Recalculate interestAmount for rate type based on principal
        if (updatedPeriod.interestType === 'rate' && principal > 0) {
          const rate = parseFloat(updatedPeriod.interestRate) || 0;
          updatedPeriod.interestAmount = (principal * (rate / 100)).toFixed(2);
        }

        return updatedPeriod;
      }
      return period;
    });

    setPeriods(updatedPeriods);
    onPeriodsChange(updatedPeriods);
    setCopySourcePeriod(null);
  };

  return (
    <div className="space-y-4">
      <Tabs
        value={mode}
        onValueChange={(v) => handleModeChange(v as 'single' | 'multiple')}
      >
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="single">One Time Interest</TabsTrigger>
          <TabsTrigger value="multiple">Multiple Interest</TabsTrigger>
        </TabsList>

        <TabsContent value="single" className="space-y-3 mt-4">
          <div className="p-4 bg-muted/50 rounded-lg space-y-2">
            <div className="grid grid-cols-3 gap-4">
              <div>
                <p className="text-xs text-muted-foreground">Principal</p>
                <p className="font-semibold">
                  ₱
                  {parseFloat(amount || '0').toLocaleString('en-PH', {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })}
                </p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Rate</p>
                <p className="font-semibold">{defaultInterestRate || '0'}%</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Due Date</p>
                <p className="font-semibold">
                  {loanDueDate
                    ? new Date(loanDueDate).toLocaleDateString('en-PH', {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric',
                      })
                    : '-'}
                </p>
              </div>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="multiple" className="space-y-3 mt-4">
          <div className="space-y-3">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={addPeriod}
              className="w-full"
            >
              <Plus className="mr-2 h-4 w-4" />
              Add Period
            </Button>
            {periods.map((period, index) => {
              const isLastPeriod = index === periods.length - 1;
              return (
                <div
                  key={period.id}
                  className="p-3 border rounded-lg bg-muted/30"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-muted-foreground">
                      {isLastPeriod
                        ? `Period ${index + 1} (Final)`
                        : `Period ${index + 1}`}
                    </span>
                    <div className="flex items-center gap-1">
                      {periods.length > 1 && (
                        <DropdownMenuRadix>
                          <DropdownMenuTrigger asChild>
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              className="h-6 w-6"
                            >
                              <MoreVertical className="h-3 w-3" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem
                              onClick={() =>
                                setCopySourcePeriod({
                                  period,
                                  periodIndex: index,
                                })
                              }
                            >
                              <Copy className="mr-2 h-4 w-4" />
                              Copy
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenuRadix>
                      )}
                      {periods.length > 1 && !isLastPeriod && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => removePeriod(period.id)}
                        >
                          <X className="h-3 w-3" />
                        </Button>
                      )}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-xs">Due Date</Label>
                    <Input
                      type="date"
                      value={isLastPeriod ? loanDueDate : period.dueDate}
                      min={sentDate || undefined}
                      max={loanDueDate || undefined}
                      onChange={(e) => {
                        const newDate = e.target.value;
                        // Check if date is already used by another period
                        const isDateUsed = periods.some(
                          (p) => p.id !== period.id && p.dueDate === newDate
                        );

                        if (isDateUsed) {
                          toast.error(
                            'This date is already used by another period. Please select a different date.'
                          );
                          return;
                        }

                        updatePeriod(period.id, 'dueDate', newDate);
                      }}
                      disabled={isLastPeriod}
                      className={
                        isLastPeriod ? 'bg-muted cursor-not-allowed' : ''
                      }
                    />
                  </div>

                  <div className="space-y-2">
                    <Label className="text-xs">Interest</Label>
                    <Tabs
                      value={period.interestType}
                      onValueChange={(value) =>
                        updatePeriod(
                          period.id,
                          'interestType',
                          value as 'rate' | 'fixed'
                        )
                      }
                    >
                      <TabsList className="grid w-full grid-cols-2 h-8">
                        <TabsTrigger value="rate" className="text-xs">
                          Rate (%)
                        </TabsTrigger>
                        <TabsTrigger value="fixed" className="text-xs">
                          Fixed (₱)
                        </TabsTrigger>
                      </TabsList>
                      <TabsContent value="rate" className="mt-2">
                        <Input
                          type="number"
                          step="0.01"
                          value={period.interestRate}
                          onChange={(e) =>
                            updatePeriod(
                              period.id,
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
                          value={period.interestAmount}
                          onChange={(e) =>
                            updatePeriod(
                              period.id,
                              'interestAmount',
                              e.target.value
                            )
                          }
                          placeholder="0.00"
                        />
                      </TabsContent>
                    </Tabs>
                  </div>
                </div>
              );
            })}
          </div>

          {totals && (
            <div className="p-4 bg-gray-100 border border-gray-200 rounded-lg space-y-2">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <p className="text-xs text-muted-foreground">
                    Total Principal
                  </p>
                  <p className="font-semibold">
                    ₱
                    {totals.principal.toLocaleString('en-PH', {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Avg. Rate</p>
                  <p className="font-semibold">{totals.avgRate.toFixed(2)}%</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">
                    Total Interest
                  </p>
                  <p className="font-semibold">
                    ₱
                    {totals.totalInterest.toLocaleString('en-PH', {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Total Amount</p>
                  <p className="font-semibold">
                    ₱
                    {totals.total.toLocaleString('en-PH', {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })}
                  </p>
                </div>
              </div>
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Copy Period Modal */}
      {copySourcePeriod && (
        <CopyPeriodModal
          open={copySourcePeriod !== null}
          onOpenChange={(open) => {
            if (!open) setCopySourcePeriod(null);
          }}
          sourcePeriod={copySourcePeriod.period}
          sourcePeriodIndex={copySourcePeriod.periodIndex}
          availablePeriods={periods}
          onCopy={handleCopyPeriod}
        />
      )}
    </div>
  );
}

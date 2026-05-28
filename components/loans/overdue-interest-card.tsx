'use client';

import { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { LoanWithInvestors } from '@/lib/types';
import { calculateInterest } from '@/lib/calculations';
import { formatCurrency } from '@/lib/format';
import { toast } from '@/lib/toast';
import { Calculator, Plus, Trash2 } from 'lucide-react';
import { DatePicker } from '@/components/ui/date-picker';

interface OverdueInterestEntry {
  date: string;
  amount: number;
  originalAmount: number;
}

interface OverdueInterestCardProps {
  loan: LoanWithInvestors;
  onApply: () => void;
}

const INTERVAL_OPTIONS = [
  { value: 'every-week', label: 'Every week' },
  { value: 'every-2-weeks', label: 'Every 2 weeks' },
  { value: 'every-3-weeks', label: 'Every 3 weeks' },
  { value: 'every-month', label: 'Every month' },
  { value: 'every-1.5-months', label: 'Every 1½ month' },
  { value: 'every-2-months', label: 'Every 2 months' },
  { value: 'every-3-months', label: 'Every 3 months' },
  { value: 'every-year', label: 'Every year' },
];

function detectInterval(days: number): string {
  if (days <= 10) return 'every-week';
  if (days <= 17) return 'every-2-weeks';
  if (days <= 25) return 'every-3-weeks';
  if (days <= 38) return 'every-month';
  if (days <= 53) return 'every-1.5-months';
  if (days <= 75) return 'every-2-months';
  if (days <= 135) return 'every-3-months';
  return 'every-year';
}

function detectIntervalFromLoan(loan: LoanWithInvestors): string {
  const allPeriods = loan.loanInvestors
    .flatMap((li) => li.interestPeriods || [])
    .sort(
      (a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime(),
    );

  if (allPeriods.length >= 2) {
    const gap =
      (new Date(allPeriods[1].dueDate).getTime() -
        new Date(allPeriods[0].dueDate).getTime()) /
      (1000 * 60 * 60 * 24);
    return detectInterval(gap);
  }

  const earliestSentDate = loan.loanInvestors.reduce(
    (earliest, li) => {
      const sentDate = new Date(li.sentDate);
      return !earliest || sentDate < earliest ? sentDate : earliest;
    },
    null as Date | null,
  );

  if (earliestSentDate) {
    const dueDate = new Date(loan.dueDate);
    const gap =
      (dueDate.getTime() - earliestSentDate.getTime()) / (1000 * 60 * 60 * 24);
    return detectInterval(gap);
  }

  return 'every-month';
}

function computePerPeriodInterest(loan: LoanWithInvestors): number {
  let totalInterest = 0;
  const totalPrincipal = loan.loanInvestors.reduce(
    (sum, li) => sum + (parseFloat(li.amount) || 0),
    0,
  );

  const investorGroups = new Map<
    number,
    (typeof loan.loanInvestors)[number][]
  >();
  loan.loanInvestors.forEach((li) => {
    const existing = investorGroups.get(li.investor.id) || [];
    existing.push(li);
    investorGroups.set(li.investor.id, existing);
  });

  investorGroups.forEach((transactions) => {
    const investorCapital = transactions.reduce(
      (sum, t) => sum + (parseFloat(t.amount) || 0),
      0,
    );

    const transactionWithPeriods = transactions.find(
      (t) =>
        t.hasMultipleInterest &&
        t.interestPeriods &&
        t.interestPeriods.length > 0,
    );

    if (transactionWithPeriods && transactionWithPeriods.interestPeriods) {
      const sorted = [...transactionWithPeriods.interestPeriods].sort(
        (a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime(),
      );
      const lastPeriod = sorted[sorted.length - 1];
      const base = investorCapital === 0 ? totalPrincipal : investorCapital;
      totalInterest += calculateInterest(
        base,
        lastPeriod.interestRate,
        lastPeriod.interestType,
      );
    } else {
      transactions.forEach((li) => {
        const capital = parseFloat(li.amount) || 0;
        const base = capital === 0 ? totalPrincipal : capital;
        totalInterest += calculateInterest(
          base,
          li.interestRate,
          li.interestType,
        );
      });
    }
  });

  return totalInterest;
}

function generateDatesFromInterval(
  startDate: Date,
  interval: string,
  endDate: Date,
): Date[] {
  const dates: Date[] = [];
  let i = 1;

  while (true) {
    const currentDate = new Date(startDate);

    switch (interval) {
      case 'every-week':
        currentDate.setDate(currentDate.getDate() + i * 7);
        break;
      case 'every-2-weeks':
        currentDate.setDate(currentDate.getDate() + i * 14);
        break;
      case 'every-3-weeks':
        currentDate.setDate(currentDate.getDate() + i * 21);
        break;
      case 'every-month':
        currentDate.setMonth(currentDate.getMonth() + i);
        break;
      case 'every-1.5-months':
        currentDate.setMonth(currentDate.getMonth() + Math.floor(i * 1.5));
        if (i % 2 === 1) currentDate.setDate(currentDate.getDate() + 15);
        break;
      case 'every-2-months':
        currentDate.setMonth(currentDate.getMonth() + i * 2);
        break;
      case 'every-3-months':
        currentDate.setMonth(currentDate.getMonth() + i * 3);
        break;
      case 'every-year':
        currentDate.setFullYear(currentDate.getFullYear() + i);
        break;
    }

    if (currentDate > endDate) break;
    dates.push(currentDate);
    i++;
  }

  return dates;
}

function getStartDate(loan: LoanWithInvestors): Date {
  const allPeriods = loan.loanInvestors
    .flatMap((li) => li.interestPeriods || [])
    .sort(
      (a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime(),
    );

  if (allPeriods.length > 0) {
    return new Date(allPeriods[allPeriods.length - 1].dueDate);
  }

  return new Date(loan.dueDate);
}

function buildEntries(
  loan: LoanWithInvestors,
  interval: string,
  perPeriodInterest: number,
): OverdueInterestEntry[] {
  const startDate = getStartDate(loan);
  const today = new Date();
  today.setHours(23, 59, 59, 999);

  const dates = generateDatesFromInterval(startDate, interval, today);

  return dates.map((date) => ({
    date: date.toISOString().slice(0, 10),
    amount: perPeriodInterest,
    originalAmount: perPeriodInterest,
  }));
}

export function OverdueInterestCard({
  loan,
  onApply,
}: OverdueInterestCardProps) {
  const detectedInterval = useMemo(() => detectIntervalFromLoan(loan), [loan]);
  const perPeriodInterest = useMemo(
    () => computePerPeriodInterest(loan),
    [loan],
  );

  const [interval, setInterval] = useState(detectedInterval);
  const [isApplying, setIsApplying] = useState(false);
  const [isApplied, setIsApplied] = useState(false);
  const [entries, setEntries] = useState<OverdueInterestEntry[]>(() =>
    buildEntries(loan, detectedInterval, perPeriodInterest),
  );

  const handleIntervalChange = (newInterval: string) => {
    setInterval(newInterval);
    setEntries(buildEntries(loan, newInterval, perPeriodInterest));
  };

  const handleDateChange = (index: number, newDate: string) => {
    setEntries((prev) =>
      prev.map((entry, i) =>
        i === index ? { ...entry, date: newDate } : entry,
      ),
    );
  };

  const handleAmountChange = (index: number, newAmount: string) => {
    const parsed = parseFloat(newAmount);
    if (isNaN(parsed) || parsed < 0) return;

    setEntries((prev) =>
      prev.map((entry, i) =>
        i === index ? { ...entry, amount: parsed } : entry,
      ),
    );
  };

  const handleRemoveEntry = (index: number) => {
    setEntries((prev) => prev.filter((_, i) => i !== index));
  };

  const handleAddEntry = () => {
    const nextDate = (() => {
      if (entries.length === 0) {
        return new Date().toISOString().slice(0, 10);
      }
      const lastEntry = entries[entries.length - 1];
      const lastDate = new Date(lastEntry.date);
      switch (interval) {
        case 'every-week':
          lastDate.setDate(lastDate.getDate() + 7);
          break;
        case 'every-2-weeks':
          lastDate.setDate(lastDate.getDate() + 14);
          break;
        case 'every-3-weeks':
          lastDate.setDate(lastDate.getDate() + 21);
          break;
        case 'every-month':
          lastDate.setMonth(lastDate.getMonth() + 1);
          break;
        case 'every-1.5-months':
          lastDate.setDate(lastDate.getDate() + 45);
          break;
        case 'every-2-months':
          lastDate.setMonth(lastDate.getMonth() + 2);
          break;
        case 'every-3-months':
          lastDate.setMonth(lastDate.getMonth() + 3);
          break;
        case 'every-year':
          lastDate.setFullYear(lastDate.getFullYear() + 1);
          break;
      }
      return lastDate.toISOString().slice(0, 10);
    })();

    setEntries((prev) => [
      ...prev,
      {
        date: nextDate,
        amount: perPeriodInterest,
        originalAmount: perPeriodInterest,
      },
    ]);
  };

  const totalAdditionalInterest = entries.reduce((sum, e) => sum + e.amount, 0);

  const handleApply = async () => {
    if (entries.length === 0) {
      toast.error('No interest entries to apply');
      return;
    }

    setIsApplying(true);
    try {
      const sortedEntries = [...entries].sort(
        (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime(),
      );

      const response = await fetch(`/api/loans/${loan.id}/extend-interest`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          entries: sortedEntries.map((e) => ({
            dueDate: e.date,
            totalAmount: e.amount,
            originalAmount: e.originalAmount,
          })),
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to apply interest');
      }

      toast.success('Additional interest applied successfully');
      setIsApplied(true);
      onApply();
    } catch (error) {
      console.error('Error applying interest:', error);
      toast.error(
        error instanceof Error ? error.message : 'Failed to apply interest',
      );
    } finally {
      setIsApplying(false);
    }
  };

  if (isApplied) return null;

  return (
    <Card className="border-orange-200 bg-orange-50/50">
      <CardHeader>
        <CardTitle className="text-lg sm:text-xl flex items-center gap-2">
          <Calculator className="h-5 w-5 text-orange-600" />
          Additional Interest Computation
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          This loan is overdue. Compute additional interest based on the
          existing rates.
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label>Interval</Label>
          <Select value={interval} onValueChange={handleIntervalChange}>
            <SelectTrigger className="w-full sm:w-[200px]">
              <SelectValue placeholder="Select interval..." />
            </SelectTrigger>
            <SelectContent>
              {INTERVAL_OPTIONS.map((opt) => (
                <SelectItem key={opt.value} value={opt.value}>
                  {opt.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {entries.length > 0 && (
          <div className="space-y-3">
            <div className="grid grid-cols-[1fr_1fr_auto] gap-2 text-xs font-medium text-muted-foreground px-1">
              <span>Due Date</span>
              <span>Interest Amount</span>
              <span className="w-8" />
            </div>
            {entries.map((entry, index) => (
              <div
                key={`${entry.date}-${index}`}
                className="grid grid-cols-[1fr_1fr_auto] gap-2 items-center"
              >
                <DatePicker
                  value={entry.date}
                  onChange={(newDate) => handleDateChange(index, newDate)}
                  className="h-9"
                />
                <Input
                  type="number"
                  value={entry.amount}
                  onChange={(e) => handleAmountChange(index, e.target.value)}
                  className="h-9"
                  step="0.01"
                  min="0"
                />
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-muted-foreground hover:text-destructive"
                  onClick={() => handleRemoveEntry(index)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>
        )}

        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={handleAddEntry}
          className="w-full"
        >
          <Plus className="mr-2 h-4 w-4" />
          Add More
        </Button>

        {entries.length === 0 && (
          <p className="text-center py-2 text-muted-foreground text-sm">
            No interest entries yet. Use the interval selector or add rows
            manually.
          </p>
        )}

        {entries.length > 0 && (
          <div className="flex items-center justify-between pt-3 border-t">
            <span className="text-sm font-medium">
              Total Additional Interest
            </span>
            <span className="text-base font-semibold text-orange-700">
              {formatCurrency(totalAdditionalInterest)}
            </span>
          </div>
        )}

        <div className="flex justify-end pt-2">
          <Button
            onClick={handleApply}
            disabled={isApplying || entries.length === 0}
            className="bg-orange-600 hover:bg-orange-700"
          >
            {isApplying ? 'Applying...' : 'Apply'}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

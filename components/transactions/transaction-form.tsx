'use client';

import { useState, useId, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from '@/lib/toast';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { DatePicker } from '@/components/ui/date-picker';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useRegisterDialogFormState } from '@/components/ui/dialog';
import { FormHeader } from '@/components/common';
import { toLocalDateString } from '@/lib/date-utils';
import { Plus, Trash2, UserPlus, Calendar, X } from 'lucide-react';
import type { Investor } from '@/lib/types';
import { InvestorFormModal } from '@/components/investors/investor-form-modal';
import { MultiSelectFilter } from '@/components/common/multi-select-filter';

interface TransactionEntry {
  id: string;
  name: string;
  direction: 'In' | 'Out';
  amount: string;
  transactionDate: string;
  isRecurring: boolean;
  duration: string;
  interval: string;
  notes: string;
}

interface RecurringDate {
  date: Date;
  label: string;
}

interface TransactionFormProps {
  investors: Investor[];
  preselectedInvestorId?: number;
  onSuccess?: () => void;
  onCancel?: () => void;
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

function makeEntry(id: string): TransactionEntry {
  return {
    id,
    name: '',
    direction: 'In',
    amount: '',
    transactionDate: toLocalDateString(new Date()),
    isRecurring: false,
    duration: '',
    interval: '',
    notes: '',
  };
}

function calculateRecurringDates(
  entry: TransactionEntry,
): RecurringDate[] {
  const { transactionDate, duration, interval, name } = entry;
  if (!transactionDate || !duration || !interval) return [];

  const count = parseInt(duration);
  if (isNaN(count) || count <= 0) return [];

  const start = new Date(transactionDate);
  const transactionName = name || 'Transaction';
  const dates: RecurringDate[] = [];

  for (let i = 0; i < count; i++) {
    const currentDate = new Date(start);
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
        currentDate.setDate(currentDate.getDate() + (i % 2 === 1 ? 15 : 0));
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
    dates.push({
      date: currentDate,
      label: `${transactionName} - ${i + 1}/${count}`,
    });
  }

  return dates;
}

const formatPHP = (amount: number) =>
  new Intl.NumberFormat('en-PH', { style: 'currency', currency: 'PHP' }).format(amount);

// ─── Single entry card ──────────────────────────────────────────────────────

interface EntryCardProps {
  entry: TransactionEntry;
  index: number;
  total: number;
  errors: Record<string, string>;
  onChange: (id: string, field: keyof TransactionEntry, value: any) => void;
  onRemove: (id: string) => void;
}

function TransactionEntryCard({
  entry,
  index,
  total,
  errors,
  onChange,
  onRemove,
}: EntryCardProps) {
  const recurringDates =
    entry.isRecurring ? calculateRecurringDates(entry) : [];

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg sm:text-xl">
            Transaction Details
            {total > 1 && (
              <span className="ml-2 text-sm font-normal text-muted-foreground">
                #{index + 1}
              </span>
            )}
          </CardTitle>
          {total > 1 && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => onRemove(entry.id)}
              className="h-8 w-8 p-0 text-muted-foreground hover:text-destructive"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Name */}
        <div className="space-y-2">
          <Label>Name / Label *</Label>
          <Input
            value={entry.name}
            onChange={(e) => onChange(entry.id, 'name', e.target.value)}
            placeholder="e.g., Payment, Salary, Expenses"
          />
          {errors.name && (
            <p className="text-sm text-red-600">{errors.name}</p>
          )}
        </div>

        {/* Direction / Amount / Date */}
        <div className="grid gap-4 sm:grid-cols-3">
          <div className="space-y-2">
            <Label>Direction *</Label>
            <Select
              value={entry.direction}
              onValueChange={(v) => onChange(entry.id, 'direction', v as 'In' | 'Out')}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="In">In</SelectItem>
                <SelectItem value="Out">Out</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Amount *</Label>
            <Input
              type="number"
              step="0.01"
              value={entry.amount}
              onChange={(e) => onChange(entry.id, 'amount', e.target.value)}
              placeholder="0.00"
            />
            {errors.amount && (
              <p className="text-sm text-red-600">{errors.amount}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label>Transaction Date *</Label>
            <DatePicker
              value={entry.transactionDate}
              onChange={(date) => onChange(entry.id, 'transactionDate', date)}
            />
            <p className="text-xs text-muted-foreground">
              Used as start date for recurring.
            </p>
            {errors.transactionDate && (
              <p className="text-sm text-red-600">{errors.transactionDate}</p>
            )}
          </div>
        </div>

        {/* Recurring */}
        <div className="space-y-4 p-4 border rounded-lg bg-muted/30">
          <div className="flex items-center space-x-2">
            <input
              type="checkbox"
              id={`isRecurring-${entry.id}`}
              checked={entry.isRecurring}
              onChange={(e) => onChange(entry.id, 'isRecurring', e.target.checked)}
              className="h-4 w-4"
            />
            <Label htmlFor={`isRecurring-${entry.id}`} className="cursor-pointer">
              Is Recurring?
            </Label>
          </div>

          {entry.isRecurring && (
            <div className="space-y-4 pt-4 border-t">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label>Number of Transactions *</Label>
                  <Input
                    type="number"
                    value={entry.duration}
                    onChange={(e) => onChange(entry.id, 'duration', e.target.value)}
                    placeholder="e.g., 12"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Interval *</Label>
                  <Select
                    value={entry.interval}
                    onValueChange={(v) => onChange(entry.id, 'interval', v)}
                  >
                    <SelectTrigger>
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
              </div>

              {/* Recurring preview */}
              {recurringDates.length > 0 && (
                <div className="space-y-2">
                  <p className="text-xs font-semibold text-muted-foreground flex items-center gap-1">
                    <Calendar className="h-3 w-3" />
                    Preview — {recurringDates.length} transaction
                    {recurringDates.length !== 1 ? 's' : ''}
                  </p>
                  <div className="max-h-48 overflow-y-auto space-y-1.5 pr-1">
                    {recurringDates.map((item, i) => (
                      <div
                        key={i}
                        className="flex items-center justify-between p-2 border rounded bg-background text-xs"
                      >
                        <span className="text-muted-foreground">
                          {item.date.toLocaleDateString('en-US', {
                            month: 'short',
                            day: 'numeric',
                            year: 'numeric',
                          })}
                        </span>
                        <span
                          className={
                            entry.direction === 'In'
                              ? 'text-emerald-600 font-medium'
                              : 'text-rose-600 font-medium'
                          }
                        >
                          {entry.direction === 'In' ? '+' : '-'}
                          {formatPHP(parseFloat(entry.amount) || 0)}
                        </span>
                      </div>
                    ))}
                  </div>
                  <div className="flex items-center justify-between text-xs pt-1 border-t">
                    <span className="text-muted-foreground">Total</span>
                    <span className="font-semibold">
                      {formatPHP((parseFloat(entry.amount) || 0) * recurringDates.length)}
                    </span>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Notes */}
        <div className="space-y-2">
          <Label>Notes (optional)</Label>
          <textarea
            value={entry.notes}
            onChange={(e) => onChange(entry.id, 'notes', e.target.value)}
            placeholder="Add any additional notes..."
            className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
          />
        </div>
      </CardContent>
    </Card>
  );
}

// ─── Main form ──────────────────────────────────────────────────────────────

export function TransactionForm({
  investors: initialInvestors,
  preselectedInvestorId,
  onSuccess,
  onCancel,
}: TransactionFormProps) {
  const router = useRouter();
  const baseId = useId();
  const entryCounterRef = useRef(1);

  const makeEmptyEntry = (): TransactionEntry =>
    makeEntry(`${baseId}-${entryCounterRef.current++}`);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [investors, setInvestors] = useState<Investor[]>(initialInvestors);
  const [selectedInvestorIds, setSelectedInvestorIds] = useState<string[]>(
    preselectedInvestorId ? [preselectedInvestorId.toString()] : [],
  );
  const [showInvestorModal, setShowInvestorModal] = useState(false);
  // Initial entry uses a stable SSR-safe id derived from useId()
  const [entries, setEntries] = useState<TransactionEntry[]>([makeEntry(`${baseId}-0`)]);
  const [entryErrors, setEntryErrors] = useState<Record<string, Record<string, string>>>({});

  const hasChanges =
    selectedInvestorIds.length > 0 ||
    entries.some((e) => e.name || e.amount || e.notes);

  useRegisterDialogFormState(hasChanges, isSubmitting);

  const handleEntryChange = (id: string, field: keyof TransactionEntry, value: any) => {
    setEntries((prev) =>
      prev.map((e) => (e.id === id ? { ...e, [field]: value } : e)),
    );
    // Clear error for this field on change
    if (entryErrors[id]?.[field]) {
      setEntryErrors((prev) => {
        const next = { ...prev };
        if (next[id]) {
          next[id] = { ...next[id] };
          delete next[id][field];
        }
        return next;
      });
    }
  };

  const handleAddEntry = () => {
    setEntries((prev) => [...prev, makeEmptyEntry()]);
  };


  const handleRemoveEntry = (id: string) => {
    setEntries((prev) => prev.filter((e) => e.id !== id));
    setEntryErrors((prev) => {
      const next = { ...prev };
      delete next[id];
      return next;
    });
  };

  const handleNewInvestorSuccess = (newInvestor: {
    id: number;
    name: string;
    email: string;
  }) => {
    const fullInvestor: Investor = {
      ...newInvestor,
      contactNumber: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    setInvestors((prev) => [...prev, fullInvestor]);
    setSelectedInvestorIds((prev) => [...prev, fullInvestor.id.toString()]);
  };

  const handleRemoveInvestor = (id: string) => {
    setSelectedInvestorIds((prev) => prev.filter((v) => v !== id));
  };

  const validate = (): boolean => {
    const errors: Record<string, Record<string, string>> = {};
    let valid = true;

    entries.forEach((entry) => {
      const e: Record<string, string> = {};
      if (!entry.name.trim()) { e.name = 'Name / Label is required'; valid = false; }
      if (!entry.amount || parseFloat(entry.amount) <= 0) { e.amount = 'A valid amount is required'; valid = false; }
      if (!entry.transactionDate) { e.transactionDate = 'Date is required'; valid = false; }
      if (Object.keys(e).length) errors[entry.id] = e;
    });

    setEntryErrors(errors);
    return valid;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (selectedInvestorIds.length === 0) {
      toast.error('Please select at least one investor');
      return;
    }

    if (!validate()) {
      toast.error('Please fill in all required fields');
      return;
    }

    setIsSubmitting(true);

    try {
      const transactionsToCreate: any[] = [];

      for (const investorIdStr of selectedInvestorIds) {
        const investorId = parseInt(investorIdStr);

        for (const entry of entries) {
          const amount = parseFloat(entry.amount);

          if (entry.isRecurring) {
            const dates = calculateRecurringDates(entry);
            if (dates.length === 0) {
              toast.error(`Entry "${entry.name}": Please configure recurring settings`);
              setIsSubmitting(false);
              return;
            }
            let runningBalance = 0;
            dates.forEach((dateInfo, index) => {
              runningBalance += entry.direction === 'In' ? amount : -amount;
              transactionsToCreate.push({
                investorId,
                date: dateInfo.date.toISOString(),
                type: 'Investment',
                direction: entry.direction,
                name: `${entry.name} - ${index + 1}/${dates.length}`,
                amount: amount.toFixed(2),
                balance: runningBalance.toFixed(2),
                notes: entry.notes || '',
              });
            });
          } else {
            const balance = entry.direction === 'In' ? amount : -amount;
            transactionsToCreate.push({
              investorId,
              date: new Date(entry.transactionDate).toISOString(),
              type: 'Investment',
              direction: entry.direction,
              name: entry.name,
              amount: amount.toFixed(2),
              balance: balance.toFixed(2),
              notes: entry.notes || '',
            });
          }
        }
      }

      await Promise.all(
        transactionsToCreate.map((t) =>
          fetch('/api/transactions', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(t),
          }),
        ),
      );

      toast.success(
        `Successfully created ${transactionsToCreate.length} transaction${transactionsToCreate.length !== 1 ? 's' : ''}!`,
      );

      if (onSuccess) {
        onSuccess();
      } else {
        router.push('/transactions');
        router.refresh();
      }
    } catch (error) {
      console.error('Error creating transactions:', error);
      toast.error('Failed to create transactions. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancelClick = () => {
    if (onCancel) {
      onCancel();
    } else {
      router.back();
    }
  };

  const transactionsPerInvestor = entries.reduce((sum, entry) => {
    if (entry.isRecurring) {
      const dates = calculateRecurringDates(entry);
      return sum + (dates.length || 1);
    }
    return sum + 1;
  }, 0);

  const totalTransactionCount = transactionsPerInvestor * Math.max(selectedInvestorIds.length, 1);

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <FormHeader
        title="Create Transaction"
        description="Add a new investment transaction"
        onCancel={handleCancelClick}
        onSubmit={() => {}}
        isSubmitting={isSubmitting}
        isEditMode={false}
        submitLabel={isSubmitting ? 'Creating...' : `Create Transaction${entries.length > 1 ? 's' : ''}`}
      />

      {/* Investor Selection */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg sm:text-xl">Select Investors</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center gap-2">
            <div className="flex-1">
              <MultiSelectFilter
                options={investors.map((inv) => ({
                  value: inv.id.toString(),
                  label: inv.name,
                }))}
                selected={selectedInvestorIds}
                onChange={setSelectedInvestorIds}
                placeholder="Select investors"
                allLabel="Select investors..."
                triggerClassName="w-full h-10"
              />
            </div>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setShowInvestorModal(true)}
              className="h-10 px-3 shrink-0"
            >
              <UserPlus className="h-4 w-4 mr-1.5" />
              New
            </Button>
          </div>

          {/* Selected investor pills */}
          {selectedInvestorIds.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {selectedInvestorIds.map((id) => {
                const inv = investors.find((i) => i.id.toString() === id);
                if (!inv) return null;
                return (
                  <span
                    key={id}
                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-primary/10 text-primary border border-primary/20"
                  >
                    {inv.name}
                    <button
                      type="button"
                      onClick={() => handleRemoveInvestor(id)}
                      className="ml-0.5 hover:text-destructive transition-colors"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </span>
                );
              })}
            </div>
          )}

          {selectedInvestorIds.length > 1 && (
            <p className="text-xs text-muted-foreground">
              All transaction entries below will be created for each of the {selectedInvestorIds.length} selected investors.
            </p>
          )}
        </CardContent>
      </Card>

      {/* Transaction Entry Cards */}
      {entries.map((entry, index) => (
        <TransactionEntryCard
          key={entry.id}
          entry={entry}
          index={index}
          total={entries.length}
          errors={entryErrors[entry.id] || {}}
          onChange={handleEntryChange}
          onRemove={handleRemoveEntry}
        />
      ))}

      {/* Add more button */}
      <Button
        type="button"
        variant="outline"
        onClick={handleAddEntry}
        className="w-full border-dashed"
      >
        <Plus className="h-4 w-4 mr-2" />
        Add more transactions
      </Button>

      {/* Submit Buttons */}
      <div className="flex flex-col sm:flex-row gap-4">
        <Button
          type="button"
          variant="outline"
          onClick={handleCancelClick}
          className="flex-1 w-full"
        >
          Cancel
        </Button>
        <Button type="submit" disabled={isSubmitting} className="flex-1 w-full">
          {isSubmitting
            ? 'Creating...'
            : `Create ${totalTransactionCount > 1 ? `${totalTransactionCount} ` : ''}Transaction${totalTransactionCount !== 1 ? 's' : ''}`}
        </Button>
      </div>

      <InvestorFormModal
        open={showInvestorModal}
        onOpenChange={setShowInvestorModal}
        onSuccess={handleNewInvestorSuccess}
      />
    </form>
  );
}

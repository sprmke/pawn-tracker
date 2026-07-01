'use client';

import { useState, useId, useRef, useEffect, useCallback } from 'react';
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
import { normalizeDebtFees, normalizeInterestRate } from '@/lib/debt-calculations';
import { Plus, Trash2, UserPlus, X } from 'lucide-react';
import type {
  DebtInterestInterval,
  DebtInterestPeriodWithPayments,
  DebtWithInvestor,
  Investor,
} from '@/lib/types';
import { InvestorFormModal } from '@/components/investors/investor-form-modal';
import { MultiSelectFilter } from '@/components/common/multi-select-filter';
import { DebtSummaryPreview } from './debt-summary-preview';

interface AdditionalFeeEntry {
  id: string;
  label: string;
  amount: string;
}

interface DebtEntry {
  id: string;
  name: string;
  amount: string;
  debtDate: string;
  interestRate: string;
  interestInterval: DebtInterestInterval;
  durationMonths: string;
  additionalFees: AdditionalFeeEntry[];
  notes: string;
}

interface DebtFormProps {
  investors: Investor[];
  preselectedInvestorId?: number;
  existingDebt?: DebtWithInvestor;
  initialInterestPeriods?: DebtInterestPeriodWithPayments[];
  onSuccess?: () => void;
  onCancel?: () => void;
  onPaymentsChange?: () => void;
}

function debtToEntry(debt: DebtWithInvestor, id: string): DebtEntry {
  const dateValue =
    debt.date instanceof Date ? debt.date : new Date(String(debt.date));

  return {
    id,
    name: debt.name,
    amount: String(debt.amount),
    debtDate: toLocalDateString(dateValue),
    interestRate: normalizeInterestRate(debt.interestRate),
    interestInterval: debt.interestInterval,
    durationMonths: String(debt.durationMonths ?? 12),
    additionalFees: (debt.additionalFees ?? []).map((fee, index) => ({
      id: `${id}-fee-${index}`,
      label: fee.label,
      amount: String(fee.amount),
    })),
    notes: debt.notes ?? '',
  };
}

const INTEREST_INTERVAL_OPTIONS: { value: DebtInterestInterval; label: string }[] = [
  { value: 'Daily', label: 'Daily' },
  { value: 'Weekly', label: 'Weekly' },
  { value: 'Monthly', label: 'Monthly' },
  { value: 'Annually', label: 'Annually' },
];

function makeFee(id: string): AdditionalFeeEntry {
  return { id, label: '', amount: '' };
}

function makeEntry(id: string): DebtEntry {
  return {
    id,
    name: '',
    amount: '',
    debtDate: toLocalDateString(new Date()),
    interestRate: '',
    interestInterval: 'Monthly',
    durationMonths: '12',
    additionalFees: [],
    notes: '',
  };
}

interface EntryCardProps {
  entry: DebtEntry;
  index: number;
  total: number;
  errors: Record<string, string>;
  onChange: (id: string, field: keyof DebtEntry, value: unknown) => void;
  onRemove: (id: string) => void;
  onFeeChange: (
    entryId: string,
    feeId: string,
    field: keyof AdditionalFeeEntry,
    value: string,
  ) => void;
  onAddFee: (entryId: string) => void;
  onRemoveFee: (entryId: string, feeId: string) => void;
  interestPeriods?: DebtInterestPeriodWithPayments[];
  onPaymentsChange?: () => void;
}

function DebtEntryCard({
  entry,
  index,
  total,
  errors,
  onChange,
  onRemove,
  onFeeChange,
  onAddFee,
  onRemoveFee,
  interestPeriods,
  onPaymentsChange,
}: EntryCardProps) {
  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg sm:text-xl">
              Borrowing Details
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
          <div className="space-y-2">
            <Label>Borrowing Name *</Label>
            <Input
              value={entry.name}
              onChange={(e) => onChange(entry.id, 'name', e.target.value)}
              placeholder="e.g., Personal loan to Juan, Equipment financing"
            />
            {errors.name && (
              <p className="text-sm text-red-600">{errors.name}</p>
            )}
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>Principal Amount *</Label>
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
              <Label>Start Date *</Label>
              <DatePicker
                value={entry.debtDate}
                onChange={(date) => onChange(entry.id, 'debtDate', date)}
              />
              <p className="text-xs text-muted-foreground">
                Date the borrowing begins accruing interest.
              </p>
              {errors.debtDate && (
                <p className="text-sm text-red-600">{errors.debtDate}</p>
              )}
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>Interest Rate (%) *</Label>
              <Input
                type="number"
                step="0.000001"
                value={entry.interestRate}
                onChange={(e) =>
                  onChange(entry.id, 'interestRate', e.target.value)
                }
                placeholder="e.g., 1.8612"
              />
              <p className="text-xs text-muted-foreground">
                Percentage applied each accrual period. Up to 6 decimal places.
              </p>
              {errors.interestRate && (
                <p className="text-sm text-red-600">{errors.interestRate}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label>Interest Accrual Period *</Label>
              <Select
                value={entry.interestInterval}
                onValueChange={(v) =>
                  onChange(entry.id, 'interestInterval', v as DebtInterestInterval)
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {INTEREST_INTERVAL_OPTIONS.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                How often interest is calculated on the principal.
              </p>
            </div>
          </div>

          <div className="space-y-2 sm:max-w-xs">
            <Label>Loan Duration (months) *</Label>
            <Input
              type="number"
              min="1"
              step="1"
              value={entry.durationMonths}
              onChange={(e) =>
                onChange(entry.id, 'durationMonths', e.target.value)
              }
              placeholder="e.g., 12"
            />
            <p className="text-xs text-muted-foreground">
              Total term of the loan.
            </p>
            {errors.durationMonths && (
              <p className="text-sm text-red-600">{errors.durationMonths}</p>
            )}
          </div>

          {/* Additional Fees */}
          <div className="space-y-3 p-4 border rounded-lg bg-muted/30">
            <div className="flex items-center justify-between">
              <Label>Additional Fees (optional)</Label>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => onAddFee(entry.id)}
                className="h-8"
              >
                <Plus className="h-3.5 w-3.5 mr-1" />
                Add Fee
              </Button>
            </div>
            {entry.additionalFees.length === 0 ? (
              <p className="text-xs text-muted-foreground">
                One-time fees such as processing or service charges. Counted in
                total cost but not added to installment payments.
              </p>
            ) : (
              <div className="space-y-2">
                {entry.additionalFees.map((fee) => (
                  <div key={fee.id} className="flex items-start gap-2">
                    <div className="flex-1 space-y-2">
                      <Input
                        value={fee.label}
                        onChange={(e) =>
                          onFeeChange(entry.id, fee.id, 'label', e.target.value)
                        }
                        placeholder="Fee label (e.g., Processing fee)"
                      />
                    </div>
                    <div className="w-32 space-y-2">
                      <Input
                        type="number"
                        step="0.01"
                        value={fee.amount}
                        onChange={(e) =>
                          onFeeChange(entry.id, fee.id, 'amount', e.target.value)
                        }
                        placeholder="0.00"
                      />
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => onRemoveFee(entry.id, fee.id)}
                      className="h-10 w-10 p-0 text-muted-foreground hover:text-destructive shrink-0"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="space-y-2">
            <Label>Notes (optional)</Label>
            <textarea
              value={entry.notes}
              onChange={(e) => onChange(entry.id, 'notes', e.target.value)}
              placeholder="Terms, collateral, or other details..."
              className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
            />
          </div>
        </CardContent>
      </Card>

      <DebtSummaryPreview
        principal={entry.amount}
        interestRate={entry.interestRate}
        interestInterval={entry.interestInterval}
        debtDate={entry.debtDate}
        durationMonths={parseInt(entry.durationMonths) || 12}
        additionalFees={entry.additionalFees}
        interestPeriods={interestPeriods}
        onPaymentsChange={onPaymentsChange}
      />
    </div>
  );
}

export function DebtForm({
  investors: initialInvestors,
  preselectedInvestorId,
  existingDebt,
  initialInterestPeriods,
  onSuccess,
  onCancel,
  onPaymentsChange,
}: DebtFormProps) {
  const router = useRouter();
  const formRef = useRef<HTMLFormElement>(null);
  const baseId = useId();
  const entryCounterRef = useRef(1);
  const feeCounterRef = useRef(0);
  const isEditMode = !!existingDebt;

  const makeEmptyEntry = (): DebtEntry =>
    makeEntry(`${baseId}-${entryCounterRef.current++}`);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [investors, setInvestors] = useState<Investor[]>(initialInvestors);
  const [selectedInvestorIds, setSelectedInvestorIds] = useState<string[]>(
    existingDebt
      ? [existingDebt.investorId.toString()]
      : preselectedInvestorId
        ? [preselectedInvestorId.toString()]
        : [],
  );
  const [showInvestorModal, setShowInvestorModal] = useState(false);
  const [entries, setEntries] = useState<DebtEntry[]>(() =>
    existingDebt
      ? [debtToEntry(existingDebt, `${baseId}-0`)]
      : [makeEntry(`${baseId}-0`)],
  );
  const [entryErrors, setEntryErrors] = useState<
    Record<string, Record<string, string>>
  >({});
  const [interestPeriods, setInterestPeriods] = useState<
    DebtInterestPeriodWithPayments[] | undefined
  >(initialInterestPeriods);

  useEffect(() => {
    setInterestPeriods(initialInterestPeriods);
  }, [initialInterestPeriods]);

  const refreshInterestPeriods = useCallback(async () => {
    if (!existingDebt?.id) return;
    try {
      const response = await fetch(`/api/debts/${existingDebt.id}`);
      if (!response.ok) return;
      const data = await response.json();
      setInterestPeriods(data.interestPeriods);
      onPaymentsChange?.();
    } catch (error) {
      console.error('Error refreshing debt periods:', error);
    }
  }, [existingDebt?.id, onPaymentsChange]);

  const hasChanges =
    selectedInvestorIds.length > 0 ||
    entries.some((e) => e.name || e.amount || e.notes);

  useRegisterDialogFormState(hasChanges, isSubmitting);

  const handleEntryChange = (
    id: string,
    field: keyof DebtEntry,
    value: unknown,
  ) => {
    setEntries((prev) =>
      prev.map((e) => (e.id === id ? { ...e, [field]: value } : e)),
    );
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

  const handleAddFee = (entryId: string) => {
    const feeId = `${baseId}-fee-${feeCounterRef.current++}`;
    setEntries((prev) =>
      prev.map((e) =>
        e.id === entryId
          ? { ...e, additionalFees: [...e.additionalFees, makeFee(feeId)] }
          : e,
      ),
    );
  };

  const handleFeeChange = (
    entryId: string,
    feeId: string,
    field: keyof AdditionalFeeEntry,
    value: string,
  ) => {
    setEntries((prev) =>
      prev.map((e) =>
        e.id === entryId
          ? {
              ...e,
              additionalFees: e.additionalFees.map((f) =>
                f.id === feeId ? { ...f, [field]: value } : f,
              ),
            }
          : e,
      ),
    );
  };

  const handleRemoveFee = (entryId: string, feeId: string) => {
    setEntries((prev) =>
      prev.map((e) =>
        e.id === entryId
          ? {
              ...e,
              additionalFees: e.additionalFees.filter((f) => f.id !== feeId),
            }
          : e,
      ),
    );
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
      if (!entry.name.trim()) {
        e.name = 'Borrowing name is required';
        valid = false;
      }
      if (!entry.amount || parseFloat(entry.amount) <= 0) {
        e.amount = 'A valid principal amount is required';
        valid = false;
      }
      if (!entry.debtDate) {
        e.debtDate = 'Start date is required';
        valid = false;
      }
      if (!entry.interestRate || parseFloat(entry.interestRate) < 0) {
        e.interestRate = 'A valid interest rate is required';
        valid = false;
      }
      const duration = parseInt(entry.durationMonths);
      if (!entry.durationMonths || isNaN(duration) || duration < 1) {
        e.durationMonths = 'Duration must be at least 1 month';
        valid = false;
      }
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
      const entry = entries[0];
      const validFees = normalizeDebtFees(entry.additionalFees);
      const payload = {
        investorId: parseInt(selectedInvestorIds[0]),
        name: entry.name.trim(),
        amount: parseFloat(entry.amount).toFixed(2),
        date: new Date(entry.debtDate).toISOString(),
        interestRate: normalizeInterestRate(entry.interestRate),
        interestInterval: entry.interestInterval,
        durationMonths: parseInt(entry.durationMonths),
        additionalFees: validFees,
        notes: entry.notes.trim() || null,
      };

      if (isEditMode && existingDebt) {
        const response = await fetch(`/api/debts/${existingDebt.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });

        if (!response.ok) {
          let message = 'Failed to update borrowing';
          try {
            const data = await response.json();
            if (data?.error) message = data.error;
          } catch {
            // ignore parse errors
          }
          throw new Error(message);
        }

        toast.success('Borrowing updated successfully');
      } else {
        const debtsToCreate: Record<string, unknown>[] = [];

        for (const investorIdStr of selectedInvestorIds) {
          const investorId = parseInt(investorIdStr);

          for (const debtEntry of entries) {
            const fees = normalizeDebtFees(debtEntry.additionalFees);

            debtsToCreate.push({
              investorId,
              name: debtEntry.name.trim(),
              amount: parseFloat(debtEntry.amount).toFixed(2),
              date: new Date(debtEntry.debtDate).toISOString(),
              interestRate: normalizeInterestRate(debtEntry.interestRate),
              interestInterval: debtEntry.interestInterval,
              durationMonths: parseInt(debtEntry.durationMonths),
              additionalFees: fees,
              notes: debtEntry.notes.trim() || null,
            });
          }
        }

        const results = await Promise.all(
          debtsToCreate.map((d) =>
            fetch('/api/debts', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(d),
            }),
          ),
        );

        const failedResponse = results.find((r) => !r.ok);
        if (failedResponse) {
          let message = 'One or more borrowings failed to create';
          try {
            const data = await failedResponse.json();
            if (data?.error) message = data.error;
          } catch {
            // ignore parse errors
          }
          throw new Error(message);
        }

        toast.success(
          `Successfully created ${debtsToCreate.length} borrowing${debtsToCreate.length !== 1 ? 's' : ''}!`,
        );
      }

      if (onSuccess) {
        onSuccess();
      } else {
        router.push('/debts');
        router.refresh();
      }
    } catch (error) {
      console.error(
        isEditMode ? 'Error updating borrowing:' : 'Error creating borrowings:',
        error,
      );
      toast.error(
        error instanceof Error
          ? error.message
          : isEditMode
            ? 'Failed to update borrowing. Please try again.'
            : 'Failed to create borrowings. Please try again.',
      );
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

  const handleFormSubmit = () => {
    formRef.current?.requestSubmit();
  };

  const totalDebtCount = entries.length * Math.max(selectedInvestorIds.length, 1);

  return (
    <form ref={formRef} onSubmit={handleSubmit} className="space-y-6">
      <FormHeader
        title={isEditMode ? 'Edit Borrowing' : 'Create Borrowing'}
        description={
          isEditMode
            ? 'Update borrowing details and preview expected interest costs'
            : 'Record a borrowing and preview expected interest costs'
        }
        onCancel={handleCancelClick}
        onSubmit={handleFormSubmit}
        isSubmitting={isSubmitting}
        isEditMode={isEditMode}
        submitLabel={
          isSubmitting
            ? isEditMode
              ? 'Saving...'
              : 'Creating...'
            : isEditMode
              ? 'Save Changes'
              : `Create Borrowing${entries.length > 1 ? 's' : ''}`
        }
      />

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

          {!isEditMode && selectedInvestorIds.length > 1 && (
            <p className="text-xs text-muted-foreground">
              Each borrowing entry below will be created for all{' '}
              {selectedInvestorIds.length} selected investors.
            </p>
          )}
        </CardContent>
      </Card>

      {entries.map((entry, index) => (
        <DebtEntryCard
          key={entry.id}
          entry={entry}
          index={index}
          total={entries.length}
          errors={entryErrors[entry.id] || {}}
          onChange={handleEntryChange}
          onRemove={handleRemoveEntry}
          onFeeChange={handleFeeChange}
          onAddFee={handleAddFee}
          onRemoveFee={handleRemoveFee}
          interestPeriods={isEditMode ? interestPeriods : undefined}
          onPaymentsChange={isEditMode ? refreshInterestPeriods : undefined}
        />
      ))}

      {!isEditMode && (
        <Button
          type="button"
          variant="outline"
          onClick={handleAddEntry}
          className="w-full border-dashed"
        >
          <Plus className="h-4 w-4 mr-2" />
          Add another borrowing
        </Button>
      )}

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
            ? isEditMode
              ? 'Saving...'
              : 'Creating...'
            : isEditMode
              ? 'Save Changes'
              : `Create ${totalDebtCount > 1 ? `${totalDebtCount} ` : ''}Borrowing${totalDebtCount !== 1 ? 's' : ''}`}
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

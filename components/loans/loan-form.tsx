'use client';

import { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { X, Plus, Eye, UserPlus } from 'lucide-react';
import type { Investor, LoanWithInvestors } from '@/lib/types';
import { toLocalDateString, isMoreThanOneMonth } from '@/lib/date-utils';
import { InvestorFormModal } from '@/components/investors/investor-form-modal';
import { LoanSummarySection } from './loan-summary-section';
import { LoanInvestorsSection } from './loan-investors-section';
import { FormHeader } from '@/components/common';
import {
  MultipleInterestManager,
  InterestPeriodData,
} from './multiple-interest-manager';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle } from 'lucide-react';

const loanSchema = z.object({
  loanName: z.string().min(1, 'Loan name is required'),
  type: z.enum(['Lot Title', 'OR/CR', 'Agent']),
  dueDate: z.string().min(1, 'Due date is required'),
  freeLotSqm: z.string().optional(),
  notes: z.string().optional(),
});

interface Transaction {
  id: string; // unique ID for each transaction
  amount: string;
  interestRate: string;
  interestAmount: string;
  interestType: 'rate' | 'fixed';
  sentDate: string;
}

interface InvestorAllocation {
  investor: Investor;
  transactions: Transaction[];
  hasMultipleInterest: boolean;
  interestPeriods: InterestPeriodData[];
}

interface LoanFormProps {
  investors: Investor[];
  existingLoan?: LoanWithInvestors;
  onSuccess?: () => void;
  onCancel?: () => void;
  preselectedInvestorId?: number;
}

export function LoanForm({
  investors: initialInvestors,
  existingLoan,
  onSuccess,
  onCancel,
  preselectedInvestorId,
}: LoanFormProps) {
  const router = useRouter();
  const isEditMode = !!existingLoan;
  const formRef = useRef<HTMLFormElement>(null);

  // State for investors list (can be updated when new investor is added)
  const [investors, setInvestors] = useState<Investor[]>(initialInvestors);
  const [showInvestorModal, setShowInvestorModal] = useState(false);

  // Initialize selected investors from existing loan if in edit mode
  const [selectedInvestors, setSelectedInvestors] = useState<
    InvestorAllocation[]
  >(() => {
    if (existingLoan) {
      // Group loan investors by investor ID
      const investorMap = new Map<number, Transaction[]>();

      existingLoan.loanInvestors.forEach((li) => {
        const transactions = investorMap.get(li.investor.id) || [];

        // If type is 'fixed', interestRate contains the fixed amount
        // If type is 'rate', interestRate contains the percentage
        const interestAmount =
          li.interestType === 'fixed' ? li.interestRate : '';
        const interestRate = li.interestType === 'rate' ? li.interestRate : '';

        transactions.push({
          id: li.id.toString(),
          amount: li.amount,
          interestRate: interestRate,
          interestAmount: interestAmount,
          interestType: li.interestType,
          sentDate: toLocalDateString(li.sentDate),
        });
        investorMap.set(li.investor.id, transactions);
      });

      // Convert map to array of InvestorAllocation
      const result: InvestorAllocation[] = [];
      investorMap.forEach((transactions, investorId) => {
        const investor = existingLoan.loanInvestors.find(
          (li) => li.investor.id === investorId
        )?.investor;

        // Get the first loan investor record for this investor to check hasMultipleInterest
        const firstLoanInvestor = existingLoan.loanInvestors.find(
          (li) => li.investor.id === investorId
        );

        // Convert interest periods if they exist (from the first transaction)
        const interestPeriods: InterestPeriodData[] =
          firstLoanInvestor?.interestPeriods
            ? firstLoanInvestor.interestPeriods.map((ip) => ({
                id: ip.id.toString(),
                dueDate: toLocalDateString(ip.dueDate),
                interestRate: ip.interestType === 'rate' ? ip.interestRate : '',
                interestAmount:
                  ip.interestType === 'fixed' ? ip.interestRate : '',
                interestType: ip.interestType,
              }))
            : [];

        if (investor) {
          result.push({
            investor,
            transactions,
            hasMultipleInterest:
              firstLoanInvestor?.hasMultipleInterest || false,
            interestPeriods: interestPeriods,
          });
        }
      });

      return result;
    }

    // If preselectedInvestorId is provided, add that investor
    if (preselectedInvestorId) {
      const preselectedInvestor = initialInvestors.find(
        (inv) => inv.id === preselectedInvestorId
      );
      if (preselectedInvestor) {
        return [
          {
            investor: preselectedInvestor,
            transactions: [
              {
                id: `temp-${Date.now()}`,
                amount: '',
                interestRate: '10',
                interestAmount: '',
                interestType: 'rate',
                sentDate: toLocalDateString(new Date()),
              },
            ],
            hasMultipleInterest: false,
            interestPeriods: [],
          },
        ];
      }
    }

    return [];
  });
  const [showPreview, setShowPreview] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [investorSelectValue, setInvestorSelectValue] = useState<string>('');

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(loanSchema),
    defaultValues: existingLoan
      ? {
          loanName: existingLoan.loanName,
          type: existingLoan.type,
          dueDate: toLocalDateString(existingLoan.dueDate),
          freeLotSqm: existingLoan.freeLotSqm?.toString() || '',
          notes: existingLoan.notes || '',
        }
      : {
          type: 'Lot Title' as const,
        },
  });

  const watchType = watch('type');
  const watchDueDate = watch('dueDate');

  // Helper function to calculate loan status automatically
  const calculateLoanStatus = ():
    | 'Fully Funded'
    | 'Partially Funded'
    | 'Overdue' => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Check if any transaction has a future sent date
    const hasFutureSentDate = selectedInvestors.some((si) =>
      si.transactions.some((t) => {
        if (!t.sentDate) return false;
        const sentDate = new Date(t.sentDate);
        sentDate.setHours(0, 0, 0, 0);
        return sentDate > today;
      })
    );

    // Check if loan is overdue
    if (watchDueDate) {
      const dueDate = new Date(watchDueDate);
      dueDate.setHours(0, 0, 0, 0);
      if (today >= dueDate) {
        return 'Overdue';
      }
    }

    // If there's a future sent date, mark as Partially Funded
    if (hasFutureSentDate) {
      return 'Partially Funded';
    }

    // Default is Fully Funded
    return 'Fully Funded';
  };

  // Check if there's a future sent date for displaying warning
  const hasFutureSentDate = selectedInvestors.some((si) =>
    si.transactions.some((t) => {
      if (!t.sentDate) return false;
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const sentDate = new Date(t.sentDate);
      sentDate.setHours(0, 0, 0, 0);
      return sentDate > today;
    })
  );

  const addInvestor = (investorId: string) => {
    // Check if user wants to create new investor
    if (investorId === 'new') {
      setShowInvestorModal(true);
      setInvestorSelectValue('');
      return;
    }

    const investor = investors.find((inv) => inv.id.toString() === investorId);
    if (
      investor &&
      !selectedInvestors.find((si) => si.investor.id === investor.id)
    ) {
      setSelectedInvestors([
        ...selectedInvestors,
        {
          investor,
          transactions: [
            {
              id: `temp-${Date.now()}`,
              amount: '',
              interestRate: '10',
              interestAmount: '',
              interestType: 'rate',
              sentDate: toLocalDateString(new Date()),
            },
          ],
          hasMultipleInterest: false,
          interestPeriods: [],
        },
      ]);
    }
    // Reset the select value to empty so it shows placeholder again
    setInvestorSelectValue('');
  };

  const handleNewInvestorSuccess = (newInvestor: {
    id: number;
    name: string;
    email: string;
  }) => {
    // Convert to full Investor type with dates
    const fullInvestor: Investor = {
      ...newInvestor,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    // Add the new investor to the list
    setInvestors([...investors, fullInvestor]);

    // Automatically add the new investor to selected investors
    setSelectedInvestors([
      ...selectedInvestors,
      {
        investor: fullInvestor,
        transactions: [
          {
            id: `temp-${Date.now()}`,
            amount: '',
            interestRate: '10',
            interestAmount: '',
            interestType: 'rate',
            sentDate: toLocalDateString(new Date()),
          },
        ],
        hasMultipleInterest: false,
        interestPeriods: [],
      },
    ]);
  };

  const removeInvestor = (investorId: number) => {
    setSelectedInvestors(
      selectedInvestors.filter((si) => si.investor.id !== investorId)
    );
  };

  const addTransaction = (investorId: number) => {
    setSelectedInvestors(
      selectedInvestors.map((si) =>
        si.investor.id === investorId
          ? {
              ...si,
              transactions: [
                ...si.transactions,
                {
                  id: `temp-${Date.now()}`,
                  amount: '',
                  interestRate: '10',
                  interestAmount: '',
                  interestType: 'rate',
                  sentDate: toLocalDateString(new Date()),
                },
              ],
            }
          : si
      )
    );
  };

  const removeTransaction = (investorId: number, transactionId: string) => {
    setSelectedInvestors(
      selectedInvestors.map((si) =>
        si.investor.id === investorId
          ? {
              ...si,
              transactions: si.transactions.filter(
                (t) => t.id !== transactionId
              ),
            }
          : si
      )
    );
  };

  const updateTransaction = (
    investorId: number,
    transactionId: string,
    field: keyof Omit<Transaction, 'id'>,
    value: string
  ) => {
    setSelectedInvestors(
      selectedInvestors.map((si) =>
        si.investor.id === investorId
          ? {
              ...si,
              transactions: si.transactions.map((t) => {
                if (t.id !== transactionId) return t;

                const updatedTransaction = { ...t, [field]: value };

                // When amount, interestRate, or interestAmount changes, update the corresponding field
                const amount =
                  parseFloat(field === 'amount' ? value : t.amount) || 0;

                if (field === 'interestRate' && amount > 0) {
                  // When rate changes, calculate and update fixed amount
                  const rate = parseFloat(value) || 0;
                  const fixedAmount = amount * (rate / 100);
                  updatedTransaction.interestAmount = fixedAmount.toFixed(2);
                } else if (field === 'interestAmount' && amount > 0) {
                  // When fixed amount changes, calculate and update rate
                  const fixedAmount = parseFloat(value) || 0;
                  const rate = (fixedAmount / amount) * 100;
                  updatedTransaction.interestRate = rate.toFixed(2);
                } else if (field === 'amount') {
                  // When amount changes, recalculate based on current interest type
                  if (t.interestType === 'rate') {
                    const rate = parseFloat(t.interestRate) || 0;
                    const fixedAmount = amount * (rate / 100);
                    updatedTransaction.interestAmount = fixedAmount.toFixed(2);
                  } else {
                    const fixedAmount = parseFloat(t.interestAmount) || 0;
                    const rate = amount > 0 ? (fixedAmount / amount) * 100 : 0;
                    updatedTransaction.interestRate = rate.toFixed(2);
                  }
                }

                return updatedTransaction;
              }),
            }
          : si
      )
    );
  };

  const calculatePreview = () => {
    const result: Array<{
      investor: Investor;
      sentDate: string;
      capital: number;
      interest: number;
      interestRate: number;
      total: number;
    }> = [];

    selectedInvestors.forEach((si) => {
      si.transactions.forEach((transaction) => {
        const capital = parseFloat(transaction.amount) || 0;
        let interest = 0;
        let interestRate = 0;

        // Calculate interest based on investor's mode (not per transaction)
        if (si.hasMultipleInterest && si.interestPeriods.length > 0) {
          // Calculate total interest from all periods for this transaction
          si.interestPeriods.forEach((period) => {
            if (period.interestType === 'rate') {
              const rate = parseFloat(period.interestRate) || 0;
              interest += capital * (rate / 100);
            } else {
              interest += parseFloat(period.interestAmount) || 0;
            }
          });

          // Calculate average rate
          if (capital > 0) {
            interestRate = (interest / capital) * 100;
          }
        } else {
          // Single interest calculation
          if (transaction.interestType === 'rate') {
            interestRate = parseFloat(transaction.interestRate) || 0;
            interest = capital * (interestRate / 100);
          } else {
            interest = parseFloat(transaction.interestAmount) || 0;
            // Calculate the equivalent rate from fixed amount
            if (capital > 0) {
              interestRate = (interest / capital) * 100;
            }
          }
        }

        const total = capital + interest;

        result.push({
          investor: si.investor,
          sentDate: transaction.sentDate,
          capital,
          interest,
          interestRate,
          total,
        });
      });
    });

    return result;
  };

  const calculateSummary = () => {
    const preview = calculatePreview();
    const totalCapital = preview.reduce((sum, p) => sum + p.capital, 0);
    const totalInterest = preview.reduce((sum, p) => sum + p.interest, 0);
    const totalAmount = totalCapital + totalInterest;

    // Calculate weighted average interest rate
    const averageRate =
      totalCapital > 0 ? (totalInterest / totalCapital) * 100 : 0;

    // Count unique investors
    const uniqueInvestors = selectedInvestors.length;
    console.log({ selectedInvestors, uniqueInvestors });

    // Calculate loan status
    const status = calculateLoanStatus();

    // Calculate funded amount (only count transactions with sent date <= today)
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const fundedCapital = preview.reduce((sum, p) => {
      const sentDate = new Date(p.sentDate);
      sentDate.setHours(0, 0, 0, 0);
      return sentDate <= today ? sum + p.capital : sum;
    }, 0);

    const balance = totalCapital - fundedCapital;

    return {
      totalCapital,
      totalInterest,
      totalAmount,
      averageRate,
      uniqueInvestors,
      status,
      fundedCapital,
      balance,
    };
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-PH', {
      style: 'currency',
      currency: 'PHP',
    }).format(amount);
  };

  const onSubmit = async (data: z.infer<typeof loanSchema>) => {
    if (selectedInvestors.length === 0) {
      alert('Please add at least one investor');
      return;
    }

    // Validate that all transactions have amounts
    const hasInvalidTransactions = selectedInvestors.some((si) =>
      si.transactions.some((t) => !t.amount || parseFloat(t.amount) <= 0)
    );

    if (hasInvalidTransactions) {
      alert('Please enter valid amounts for all transactions');
      return;
    }

    setIsSubmitting(true);

    try {
      // Calculate the loan status automatically
      const calculatedStatus = calculateLoanStatus();

      const loanData = {
        loanName: data.loanName,
        type: data.type,
        status: calculatedStatus,
        dueDate: new Date(data.dueDate),
        freeLotSqm: data.freeLotSqm ? parseInt(data.freeLotSqm) : null,
        notes: data.notes || null,
      };

      // Flatten all transactions from all investors
      const investorData: Array<{
        investorId: number;
        amount: string;
        interestRate: string;
        interestType: 'rate' | 'fixed';
        sentDate: Date;
        hasMultipleInterest: boolean;
        interestPeriods?: Array<{
          dueDate: Date;
          interestRate: string;
          interestType: 'rate' | 'fixed';
        }>;
      }> = [];

      selectedInvestors.forEach((si) => {
        // Prepare interest periods if multiple interest is enabled (at investor level)
        const interestPeriods = si.hasMultipleInterest
          ? si.interestPeriods.map((period) => ({
              dueDate: new Date(period.dueDate),
              interestRate:
                period.interestType === 'fixed'
                  ? period.interestAmount
                  : period.interestRate,
              interestType: period.interestType,
            }))
          : undefined;

        si.transactions.forEach((transaction) => {
          let interestRate = transaction.interestRate;
          let interestType: 'rate' | 'fixed' = 'rate';

          // If user chose fixed amount, store the fixed amount directly in interestRate
          if (transaction.interestType === 'fixed') {
            interestRate = transaction.interestAmount;
            interestType = 'fixed';
          }

          investorData.push({
            investorId: si.investor.id,
            amount: transaction.amount,
            interestRate: interestRate,
            interestType: interestType,
            sentDate: new Date(transaction.sentDate),
            hasMultipleInterest: si.hasMultipleInterest,
            interestPeriods: interestPeriods,
          });
        });
      });

      const url = isEditMode ? `/api/loans/${existingLoan.id}` : '/api/loans';
      const method = isEditMode ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ loanData, investorData }),
      });

      if (!response.ok)
        throw new Error(`Failed to ${isEditMode ? 'update' : 'create'} loan`);

      if (onSuccess) {
        onSuccess();
      } else {
        router.push('/transactions/loans');
        router.refresh();
      }
    } catch (error) {
      console.error(
        `Error ${isEditMode ? 'updating' : 'creating'} loan:`,
        error
      );
      alert(
        `Failed to ${isEditMode ? 'update' : 'create'} loan. Please try again.`
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const availableInvestors = investors.filter(
    (inv) => !selectedInvestors.find((si) => si.investor.id === inv.id)
  );

  const preview = showPreview ? calculatePreview() : [];
  const summary = showPreview ? calculateSummary() : null;

  const handleFormSubmit = () => {
    formRef.current?.requestSubmit();
  };

  const handleCancelClick = () => {
    if (onCancel) {
      onCancel();
    } else {
      router.back();
    }
  };

  return (
    <form ref={formRef} onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <FormHeader
        title={isEditMode ? existingLoan.loanName : 'Create Loan'}
        description={
          isEditMode
            ? 'Update loan details and investor allocations'
            : 'Add a new loan with investor allocations'
        }
        onCancel={handleCancelClick}
        onSubmit={handleFormSubmit}
        isSubmitting={isSubmitting}
        isEditMode={isEditMode}
        submitLabel={
          isSubmitting
            ? isEditMode
              ? 'Updating...'
              : 'Creating...'
            : isEditMode
            ? 'Update Loan'
            : 'Create Loan'
        }
      />

      <Card>
        <CardHeader>
          <CardTitle className="text-lg sm:text-xl">Loan Details</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="loanName">Loan Name / Label *</Label>
              <Input
                id="loanName"
                {...register('loanName')}
                placeholder="e.g., Title 1 - Mexico"
              />
              {errors.loanName && (
                <p className="text-sm text-red-600">
                  {errors.loanName.message}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="type">Type *</Label>
              <Select
                value={watchType}
                onValueChange={(value) => setValue('type', value as any)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Lot Title">Lot Title</SelectItem>
                  <SelectItem value="OR/CR">OR/CR</SelectItem>
                  <SelectItem value="Agent">Agent</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="dueDate">Due Date *</Label>
              <Input id="dueDate" type="date" {...register('dueDate')} />
              {errors.dueDate && (
                <p className="text-sm text-red-600">{errors.dueDate.message}</p>
              )}
            </div>

            {watchType === 'Lot Title' && (
              <div className="space-y-2">
                <Label htmlFor="freeLotSqm">Free Lot (sqm)</Label>
                <Input
                  id="freeLotSqm"
                  type="number"
                  {...register('freeLotSqm')}
                  placeholder="Optional"
                />
              </div>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Notes</Label>
            <Textarea
              id="notes"
              {...register('notes')}
              placeholder="Additional notes..."
              rows={3}
            />
          </div>
        </CardContent>
      </Card>

      <Card id="investors-section">
        <CardHeader>
          <CardTitle className="text-lg sm:text-xl">Investors</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Add Investor</Label>
            <Select value={investorSelectValue} onValueChange={addInvestor}>
              <SelectTrigger>
                <SelectValue placeholder="Select an investor..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="new" className="text-primary font-medium">
                  <div className="flex items-center gap-2">
                    <UserPlus className="h-4 w-4" />
                    <span>Add New Investor</span>
                  </div>
                </SelectItem>
                {availableInvestors.length > 0 && (
                  <div className="h-px bg-border my-1" />
                )}
                {availableInvestors.map((investor) => (
                  <SelectItem key={investor.id} value={investor.id.toString()}>
                    {investor.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {selectedInvestors.length === 0 ? (
            <p className="text-center text-muted-foreground py-4">
              No investors added yet
            </p>
          ) : (
            <div className="space-y-4">
              {selectedInvestors.map((si) => (
                <Card key={si.investor.id}>
                  <CardContent className="pt-6">
                    <div className="space-y-4">
                      <div className="flex items-center justify-between gap-2">
                        <h4 className="font-semibold text-sm sm:text-base truncate">
                          {si.investor.name}
                        </h4>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          onClick={() => removeInvestor(si.investor.id)}
                          className="flex-shrink-0"
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>

                      {/* Multiple Interest Manager - at investor level */}
                      {watchDueDate &&
                        si.transactions.some(
                          (t) =>
                            t.sentDate &&
                            isMoreThanOneMonth(t.sentDate, watchDueDate)
                        ) && (
                          <div className="space-y-3 p-4 border rounded-lg bg-muted/30">
                            <Label className="text-sm font-semibold inline-flex">
                              Interest Configuration
                            </Label>
                            <Alert className="bg-blue-50 border-blue-200">
                              <AlertCircle className="h-4 w-4 text-blue-600" />
                              <AlertDescription className="text-xs text-blue-800">
                                <strong>Notice:</strong> We detected that this
                                investor has a transaction spanning multiple
                                months. You can manage interest for each month
                                separately using the "Multiple Interest" option
                                below.
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
                              onPeriodsChange={(periods) => {
                                setSelectedInvestors(
                                  selectedInvestors.map((inv) =>
                                    inv.investor.id === si.investor.id
                                      ? { ...inv, interestPeriods: periods }
                                      : inv
                                  )
                                );
                              }}
                              onModeChange={(mode) => {
                                setSelectedInvestors(
                                  selectedInvestors.map((inv) =>
                                    inv.investor.id === si.investor.id
                                      ? {
                                          ...inv,
                                          hasMultipleInterest:
                                            mode === 'multiple',
                                        }
                                      : inv
                                  )
                                );
                              }}
                            />
                          </div>
                        )}

                      {/* Transactions */}
                      <div className="space-y-3">
                        {si.transactions.map((transaction, index) => {
                          // Check if this transaction's sent date is in the future
                          const today = new Date();
                          today.setHours(0, 0, 0, 0);
                          const sentDate = new Date(transaction.sentDate);
                          sentDate.setHours(0, 0, 0, 0);
                          const isFutureSentDate = sentDate > today;

                          return (
                            <div
                              key={transaction.id}
                              className={`p-3 border rounded-lg space-y-3 ${
                                isFutureSentDate
                                  ? 'bg-yellow-50'
                                  : 'bg-muted/30'
                              }`}
                            >
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                  <span className="text-sm font-medium text-muted-foreground">
                                    Transaction {index + 1}
                                  </span>
                                  {isFutureSentDate && (
                                    <Badge
                                      variant="warning"
                                      className="text-[10px] h-3.5 px-1 py-0 leading-none"
                                    >
                                      To be paid
                                    </Badge>
                                  )}
                                </div>
                                {si.transactions.length > 1 && (
                                  <Button
                                    type="button"
                                    variant="ghost"
                                    size="sm"
                                    onClick={() =>
                                      removeTransaction(
                                        si.investor.id,
                                        transaction.id
                                      )
                                    }
                                  >
                                    <X className="h-3 w-3" />
                                  </Button>
                                )}
                              </div>

                              <div className="grid gap-3 sm:grid-cols-2">
                                <div className="space-y-2">
                                  <Label className="text-xs">Amount *</Label>
                                  <Input
                                    type="number"
                                    step="0.01"
                                    value={transaction.amount}
                                    onChange={(e) =>
                                      updateTransaction(
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
                                        alert(
                                          'This date is already used by another transaction for this investor. Please select a different date.'
                                        );
                                        return;
                                      }

                                      updateTransaction(
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
                                      updateTransaction(
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
                                          updateTransaction(
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
                                          updateTransaction(
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

                              {isFutureSentDate && (
                                <div className="p-2 bg-yellow-50 border border-yellow-200 rounded text-xs text-yellow-800">
                                  <strong>Note:</strong> This transaction has a
                                  future sent date. This loan will be marked as{' '}
                                  <strong>Partially Funded</strong> until all
                                  funds are received.
                                </div>
                              )}
                            </div>
                          );
                        })}

                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => addTransaction(si.investor.id)}
                          className="w-full"
                        >
                          <Plus className="mr-2 h-4 w-4" />
                          Add Transaction
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {selectedInvestors.length > 0 && (
        <>
          <Button
            type="button"
            variant="outline"
            onClick={() => setShowPreview(!showPreview)}
            className="w-full"
          >
            <Eye className="mr-2 h-4 w-4" />
            {showPreview ? 'Hide' : 'Show'} Preview
          </Button>

          {showPreview && (
            <div className="space-y-6">
              <LoanInvestorsSection
                investorsWithTransactions={(() => {
                  // Group preview by investor and transform to match component format
                  const investorMap = new Map<
                    number,
                    Array<(typeof preview)[0]>
                  >();

                  preview.forEach((p) => {
                    const existing = investorMap.get(p.investor.id) || [];
                    existing.push(p);
                    investorMap.set(p.investor.id, existing);
                  });

                  return Array.from(investorMap.values()).map(
                    (transactions) => {
                      const investorId = transactions[0].investor.id;
                      const investorData = selectedInvestors.find(
                        (si) => si.investor.id === investorId
                      );

                      return {
                        investor: transactions[0].investor,
                        transactions: transactions.map((t, index) => ({
                          id: `preview-${t.investor.id}-${index}`,
                          amount: t.capital.toString(),
                          interestRate: t.interestRate.toString(),
                          interestType: 'rate' as const,
                          sentDate: t.sentDate,
                        })),
                        hasMultipleInterest:
                          investorData?.hasMultipleInterest || false,
                        interestPeriods: investorData?.interestPeriods
                          ? investorData.interestPeriods.map((period) => ({
                              id: period.id,
                              dueDate: period.dueDate,
                              // For fixed type, use interestAmount; for rate type, use interestRate
                              interestRate:
                                period.interestType === 'fixed'
                                  ? period.interestAmount
                                  : period.interestRate,
                              interestType: period.interestType,
                            }))
                          : [],
                      };
                    }
                  );
                })()}
                title="Loan Preview"
                showEmail={false}
              />

              {summary && (
                <LoanSummarySection
                  totalPrincipal={summary.totalCapital}
                  averageRate={summary.averageRate}
                  totalInterest={summary.totalInterest}
                  totalAmount={summary.totalAmount}
                  uniqueInvestors={summary.uniqueInvestors}
                  status={summary.status}
                  balance={summary.balance}
                  showStatus={true}
                />
              )}
            </div>
          )}
        </>
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
              ? 'Updating...'
              : 'Creating...'
            : isEditMode
            ? 'Update Loan'
            : 'Create Loan'}
        </Button>
      </div>

      {/* Investor Creation Modal */}
      <InvestorFormModal
        open={showInvestorModal}
        onOpenChange={setShowInvestorModal}
        onSuccess={handleNewInvestorSuccess}
      />
    </form>
  );
}

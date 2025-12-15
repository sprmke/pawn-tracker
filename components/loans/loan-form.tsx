'use client';

import { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
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
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { X, Plus, Eye, UserPlus } from 'lucide-react';
import type { Investor, LoanWithInvestors } from '@/lib/types';
import {
  toLocalDateString,
  isMoreThanOneMonth,
  getTodayAtMidnight,
  normalizeToMidnight,
} from '@/lib/date-utils';
import { InvestorFormModal } from '@/components/investors/investor-form-modal';
import { LoanSummarySection } from './loan-summary-section';
import { LoanInvestorsSection } from './loan-investors-section';
import { FormHeader } from '@/components/common';
import {
  MultipleInterestManager,
  InterestPeriodData,
} from './multiple-interest-manager';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle, ChevronDown } from 'lucide-react';
import { LoanInvestorCard } from './loan-investor-card';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import { CopyInvestorModal } from './copy-investor-modal';

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
  isPaid: boolean;
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
  isLoadingInvestors?: boolean;
}

export function LoanForm({
  investors: initialInvestors,
  existingLoan,
  onSuccess,
  onCancel,
  preselectedInvestorId,
  isLoadingInvestors = false,
}: LoanFormProps) {
  const router = useRouter();
  const isEditMode = !!existingLoan;
  const formRef = useRef<HTMLFormElement>(null);

  // State for investors list (can be updated when new investor is added)
  const [investors, setInvestors] = useState<Investor[]>(initialInvestors);
  const [showInvestorModal, setShowInvestorModal] = useState(false);
  const [copySourceInvestorId, setCopySourceInvestorId] = useState<
    number | null
  >(null);

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
          isPaid: li.isPaid,
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
                status: ip.status,
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
                isPaid: true,
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
    const today = getTodayAtMidnight();

    // Check if any transaction is unpaid
    const hasUnpaidTransactions = selectedInvestors.some((si) =>
      si.transactions.some((t) => !t.isPaid)
    );

    // Check if loan is overdue
    if (watchDueDate) {
      const dueDate = normalizeToMidnight(watchDueDate);
      if (today >= dueDate) {
        return 'Overdue';
      }
    }

    // If there are unpaid transactions, mark as Partially Funded
    if (hasUnpaidTransactions) {
      return 'Partially Funded';
    }

    // Default is Fully Funded
    return 'Fully Funded';
  };

  // Check if there are unpaid transactions for displaying warning
  const hasUnpaidTransactions = selectedInvestors.some((si) =>
    si.transactions.some((t) => !t.isPaid)
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
              isPaid: true,
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
      contactNumber: null,
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
            isPaid: true,
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
                  isPaid: true,
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

                // When sentDate changes, update isPaid automatically
                if (field === 'sentDate') {
                  const today = getTodayAtMidnight();
                  const sentDate = normalizeToMidnight(value);
                  updatedTransaction.isPaid = sentDate <= today;
                }

                // When amount, interestRate, or interestAmount changes, update the corresponding field
                const amount =
                  parseFloat(field === 'amount' ? value : t.amount) || 0;

                if (field === 'interestRate') {
                  // When rate changes, calculate and update fixed amount
                  const rate = parseFloat(value) || 0;
                  const fixedAmount = amount * (rate / 100);
                  updatedTransaction.interestAmount = fixedAmount.toFixed(2);
                } else if (field === 'interestAmount') {
                  // When fixed amount changes, calculate and update rate
                  const fixedAmount = parseFloat(value) || 0;
                  const rate = amount > 0 ? (fixedAmount / amount) * 100 : 0;
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
      isPaid: boolean;
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
          isPaid: transaction.isPaid,
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

    // Calculate loan status
    const status = calculateLoanStatus();

    // Calculate funded amount (only count paid transactions)
    const fundedCapital = preview.reduce((sum, p) => {
      return p.isPaid ? sum + p.capital : sum;
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
      toast.error('Please add at least one investor');
      return;
    }

    // Validate that all transactions have valid amounts
    // Allow 0 principal if there's a fixed interest amount (single or multiple interest)
    const hasInvalidTransactions = selectedInvestors.some((si) =>
      si.transactions.some((t) => {
        const amount = parseFloat(t.amount);
        const isValidAmount = !isNaN(amount) && amount >= 0;

        // If amount is 0, must have interest configured
        if (amount === 0) {
          // Check if using multiple interest periods
          if (si.hasMultipleInterest) {
            // Must have at least one interest period with a valid amount
            const hasValidInterestPeriod = si.interestPeriods.some((period) => {
              if (period.interestType === 'fixed') {
                const fixedAmount = parseFloat(period.interestAmount);
                return !isNaN(fixedAmount) && fixedAmount > 0;
              } else {
                const rate = parseFloat(period.interestRate);
                return !isNaN(rate) && rate > 0;
              }
            });
            return !hasValidInterestPeriod;
          } else {
            // Single interest - must be fixed type with a value
            return (
              t.interestType !== 'fixed' ||
              !t.interestAmount ||
              parseFloat(t.interestAmount) <= 0
            );
          }
        }

        // For non-zero amounts, just check if valid
        return !isValidAmount || amount < 0;
      })
    );

    if (hasInvalidTransactions) {
      toast.error(
        'Please enter valid amounts for all transactions. Transactions with 0 principal must have a fixed interest amount or multiple interest periods configured.'
      );
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
        isPaid: boolean;
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
              status: period.status,
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
            isPaid: transaction.isPaid,
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
        router.push('/loans');
        router.refresh();
      }
    } catch (error) {
      console.error(
        `Error ${isEditMode ? 'updating' : 'creating'} loan:`,
        error
      );
      toast.error(
        `Failed to ${isEditMode ? 'update' : 'create'} loan. Please try again.`
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const availableInvestors = investors.filter(
    (inv) => !selectedInvestors.find((si) => si.investor.id === inv.id)
  );

  const preview = calculatePreview();
  const summary = calculateSummary();

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

  const handleCopy = (sourceInvestorId: number) => {
    setCopySourceInvestorId(sourceInvestorId);
  };

  const handleCopyConfirm = (targetInvestorIds: number[]) => {
    const sourceInvestor = selectedInvestors.find(
      (si) => si.investor.id === copySourceInvestorId
    );

    if (!sourceInvestor) {
      return;
    }

    const newInvestorsToAdd: InvestorAllocation[] = [];
    const existingInvestorsToUpdate: number[] = [];

    // Separate target investors into new and existing
    targetInvestorIds.forEach((targetId) => {
      const isAlreadySelected = selectedInvestors.some(
        (si) => si.investor.id === targetId
      );
      const investor = investors.find((inv) => inv.id === targetId);
      if (isAlreadySelected) {
        existingInvestorsToUpdate.push(targetId);
      } else {
        if (investor) {
          newInvestorsToAdd.push({
            investor,
            transactions: [],
            hasMultipleInterest: false,
            interestPeriods: [],
          });
        }
      }
    });

    // Deep clone the source investor's configuration
    setSelectedInvestors((prev) => {
      // Update existing investors
      const updated = prev.map((si) => {
        if (targetInvestorIds.includes(si.investor.id)) {
          // Deep clone transactions with new IDs
          const clonedTransactions: Transaction[] =
            sourceInvestor.transactions.map((t) => ({
              id: `temp-${Date.now()}-${Math.random()}`,
              amount: t.amount,
              interestRate: t.interestRate,
              interestAmount: t.interestAmount,
              interestType: t.interestType,
              sentDate: t.sentDate,
              isPaid: t.isPaid,
            }));

          // Deep clone interest periods with new IDs
          const clonedInterestPeriods: InterestPeriodData[] =
            sourceInvestor.interestPeriods.map((ip) => ({
              id: `temp-${Date.now()}-${Math.random()}`,
              dueDate: ip.dueDate,
              interestRate: ip.interestRate,
              interestAmount: ip.interestAmount,
              interestType: ip.interestType,
              status: ip.status,
            }));

          return {
            ...si,
            transactions: clonedTransactions,
            hasMultipleInterest: sourceInvestor.hasMultipleInterest,
            interestPeriods: clonedInterestPeriods,
          };
        }
        return si;
      });

      // Add new investors with cloned configuration
      const newInvestorsWithConfig = newInvestorsToAdd.map((newInvestor) => {
        const clonedTransactions: Transaction[] =
          sourceInvestor.transactions.map((t) => ({
            id: `temp-${Date.now()}-${Math.random()}`,
            amount: t.amount,
            interestRate: t.interestRate,
            interestAmount: t.interestAmount,
            interestType: t.interestType,
            sentDate: t.sentDate,
            isPaid: t.isPaid,
          }));

        const clonedInterestPeriods: InterestPeriodData[] =
          sourceInvestor.interestPeriods.map((ip) => ({
            id: `temp-${Date.now()}-${Math.random()}`,
            dueDate: ip.dueDate,
            interestRate: ip.interestRate,
            interestAmount: ip.interestAmount,
            interestType: ip.interestType,
            status: ip.status,
          }));

        return {
          ...newInvestor,
          transactions: clonedTransactions,
          hasMultipleInterest: sourceInvestor.hasMultipleInterest,
          interestPeriods: clonedInterestPeriods,
        };
      });

      return [...updated, ...newInvestorsWithConfig];
    });

    toast.success(
      `Configuration copied to ${targetInvestorIds.length} investor${
        targetInvestorIds.length !== 1 ? 's' : ''
      }`
    );
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
                placeholder="e.g., Mexico, Pampanga"
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
              <DatePicker
                id="dueDate"
                value={watchDueDate}
                onChange={(date) => setValue('dueDate', date)}
              />
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
          <div className="space-y-3">
            <Label>Add Investor</Label>
            <Select
              value={investorSelectValue}
              onValueChange={addInvestor}
              disabled={isLoadingInvestors}
            >
              <SelectTrigger>
                <SelectValue
                  placeholder={
                    isLoadingInvestors
                      ? 'Loading investors...'
                      : 'Select an investor...'
                  }
                />
              </SelectTrigger>
              <SelectContent>
                {isLoadingInvestors ? (
                  <div className="px-2 py-6 text-center text-sm text-muted-foreground">
                    Loading investors...
                  </div>
                ) : (
                  <>
                    <SelectItem
                      value="new"
                      className="text-primary font-medium"
                    >
                      <div className="flex items-center gap-2">
                        <UserPlus className="h-4 w-4" />
                        <span>Add New Investor</span>
                      </div>
                    </SelectItem>
                    {availableInvestors.length > 0 && (
                      <div className="h-px bg-border my-1" />
                    )}
                    {availableInvestors.map((investor) => (
                      <SelectItem
                        key={investor.id}
                        value={investor.id.toString()}
                      >
                        {investor.name}
                      </SelectItem>
                    ))}
                  </>
                )}
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
                <LoanInvestorCard
                  key={si.investor.id}
                  selectedInvestor={si}
                  watchDueDate={watchDueDate}
                  onRemoveInvestor={removeInvestor}
                  onAddTransaction={addTransaction}
                  onRemoveTransaction={removeTransaction}
                  onUpdateTransaction={updateTransaction}
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
                              hasMultipleInterest: mode === 'multiple',
                            }
                          : inv
                      )
                    );
                  }}
                  onCopy={handleCopy}
                />
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {selectedInvestors.length > 0 && (
        <Collapsible defaultOpen={true}>
          <Card>
            <CardContent className="p-6">
              <CollapsibleTrigger asChild>
                <Button
                  type="button"
                  variant="ghost"
                  className="group w-full justify-between p-0 hover:bg-transparent"
                >
                  <div className="flex items-center gap-3">
                    <h4 className="font-bold tracking-tight text-lg sm:text-xl">
                      Loan Preview
                    </h4>
                  </div>
                  <ChevronDown className="h-4 w-4 transition-transform duration-200 group-data-[state=open]:rotate-180" />
                </Button>
              </CollapsibleTrigger>

              <CollapsibleContent className="mt-2">
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
                          transactions: transactions.map((t, index) => {
                            // Find the original transaction to get the actual interestType
                            const originalTransaction =
                              investorData?.transactions.find(
                                (ot) => ot.sentDate === t.sentDate
                              );

                            return {
                              id: `preview-${t.investor.id}-${index}`,
                              amount: t.capital.toString(),
                              interestRate:
                                originalTransaction?.interestType === 'fixed'
                                  ? originalTransaction.interestAmount
                                  : t.interestRate.toString(),
                              interestType:
                                originalTransaction?.interestType || 'rate',
                              sentDate: t.sentDate,
                              isPaid: t.isPaid,
                            };
                          }),
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
                  showEmail={false}
                  showPeriodStatus={false}
                />
              </CollapsibleContent>
            </CardContent>
          </Card>
        </Collapsible>
      )}

      {summary && (
        <LoanSummarySection
          totalPrincipal={summary.totalCapital}
          averageRate={summary.averageRate}
          totalInterest={summary.totalInterest}
          totalAmount={summary.totalAmount}
          uniqueInvestors={summary.uniqueInvestors}
          status={summary.status}
          balance={summary.balance}
          showStatus={false}
        />
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

      {/* Copy Investor Modal */}
      {copySourceInvestorId &&
        (() => {
          const sourceInvestorData = selectedInvestors.find(
            (si) => si.investor.id === copySourceInvestorId
          )!;
          const configsMap = new Map(
            selectedInvestors.map((si) => [
              si.investor.id,
              {
                transactions: si.transactions,
                hasMultipleInterest: si.hasMultipleInterest,
                interestPeriods: si.interestPeriods,
              },
            ])
          );
          return (
            <CopyInvestorModal
              open={copySourceInvestorId !== null}
              onOpenChange={(open) => {
                if (!open) setCopySourceInvestorId(null);
              }}
              sourceInvestor={sourceInvestorData.investor}
              sourceInvestorConfig={{
                transactions: sourceInvestorData.transactions,
                hasMultipleInterest: sourceInvestorData.hasMultipleInterest,
                interestPeriods: sourceInvestorData.interestPeriods,
              }}
              availableInvestors={investors.filter(
                (inv) => inv.id !== copySourceInvestorId
              )}
              selectedInvestorIds={selectedInvestors.map(
                (si) => si.investor.id
              )}
              selectedInvestorsConfigs={configsMap}
              onCopy={handleCopyConfirm}
            />
          );
        })()}
    </form>
  );
}

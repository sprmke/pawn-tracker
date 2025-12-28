'use client';

import { useState, useRef, useEffect } from 'react';
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
import { useRegisterDialogFormState } from '@/components/ui/dialog';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { FormHeader } from '@/components/common';
import { toLocalDateString } from '@/lib/date-utils';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle, Calendar, UserPlus } from 'lucide-react';
import type { Investor } from '@/lib/types';
import { InvestorFormModal } from '@/components/investors/investor-form-modal';

// Schema for form validation
const baseSchema = z.object({
  name: z.string().min(1, 'Name/Label is required'),
  template: z.enum(['None', 'Credit Card']),
});

// Extended schema for None template (standard transaction)
const standardTransactionSchema = baseSchema.extend({
  direction: z.enum(['In', 'Out']),
  amount: z.string().min(1, 'Amount is required'),
  transactionDate: z.string().min(1, 'Transaction date is required'),
  isRecurring: z.boolean(),
  duration: z.string().optional(),
  interval: z.string().optional(),
  notes: z.string().optional(),
});

// Extended schema for Credit Card
const creditCardSchema = baseSchema.extend({
  loanAmount: z.string().min(1, 'Loan amount is required'),
  loanDate: z.string().min(1, 'Loan date is required'),
  dueDates: z.string().min(1, 'Due dates is required'),
  duration: z.string().min(1, 'Duration is required'),
  interestType: z.enum(['fixed', 'rate']),
  interestValue: z.string().min(1, 'Interest value is required'),
  otherFees: z.string().optional(),
  notes: z.string().optional(),
});

// Union schema that validates based on template
const transactionSchema = z.discriminatedUnion('template', [
  standardTransactionSchema.extend({
    template: z.literal('None'),
  }),
  creditCardSchema.extend({
    template: z.literal('Credit Card'),
  }),
]);

type TransactionFormData = z.infer<typeof transactionSchema>;

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

export function TransactionForm({
  investors: initialInvestors,
  preselectedInvestorId,
  onSuccess,
  onCancel,
}: TransactionFormProps) {
  const router = useRouter();
  const formRef = useRef<HTMLFormElement>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isRecurring, setIsRecurring] = useState(false);
  const [recurringDates, setRecurringDates] = useState<RecurringDate[]>([]);

  // State for investors list (can be updated when new investor is added)
  const [investors, setInvestors] = useState<Investor[]>(initialInvestors);
  const [selectedInvestorId, setSelectedInvestorId] = useState<number | null>(
    preselectedInvestorId || null
  );
  const [investorSelectValue, setInvestorSelectValue] = useState<string>(
    preselectedInvestorId ? preselectedInvestorId.toString() : ''
  );
  const [showInvestorModal, setShowInvestorModal] = useState(false);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors, isDirty },
  } = useForm<any>({
    resolver: zodResolver(transactionSchema),
    defaultValues: {
      template: 'None',
      direction: 'In',
      isRecurring: false,
      interestType: 'fixed',
      transactionDate: toLocalDateString(new Date()),
      loanDate: toLocalDateString(new Date()),
    },
  });

  // Track if form has changes (including investor selection)
  const hasChanges = isDirty || selectedInvestorId !== null;
  
  // Register form state with dialog to prevent accidental close
  useRegisterDialogFormState(hasChanges, isSubmitting);

  const watchTemplate = watch('template');
  const watchName = watch('name');
  const watchDirection = watch('direction');
  const watchDuration = watch('duration');
  const watchInterval = watch('interval');
  const watchTransactionDate = watch('transactionDate');
  const watchLoanDate = watch('loanDate');
  const watchDueDates = watch('dueDates');
  const watchCreditCardDuration = watch('duration');
  const watchInterestType = watch('interestType');
  const watchAmount = watch('amount');
  const watchOtherFees = watch('otherFees');

  // Calculate recurring dates for None template (standard transactions)
  const calculateRecurringDates = (
    startDate: string,
    numTransactions: string,
    interval: string,
    name: string = ''
  ): RecurringDate[] => {
    if (!startDate || !numTransactions || !interval) return [];

    const dates: RecurringDate[] = [];
    const start = new Date(startDate);
    const count = parseInt(numTransactions);

    if (isNaN(count) || count <= 0) return [];

    const transactionName = name || 'Transaction';

    for (let i = 0; i < count; i++) {
      let currentDate = new Date(start);

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
          // Add 1.5 months = 1 month + 15 days
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
  };

  // Calculate recurring dates for Credit Card
  const calculateCreditCardDates = (
    loanDate: string,
    dueDate: string,
    duration: string,
    name: string = ''
  ): RecurringDate[] => {
    if (!loanDate || !dueDate || !duration) return [];

    const dates: RecurringDate[] = [];
    const start = new Date(dueDate);
    const months = parseInt(duration);

    if (isNaN(months) || months <= 0) return [];

    const transactionName = name || 'Transaction';

    // Add the loan date as the first transaction (IN)
    dates.push({
      date: new Date(loanDate),
      label: `${transactionName} - Loan`,
    });

    // Add monthly payments (OUT)
    for (let i = 0; i < months; i++) {
      const currentDate = new Date(start);
      currentDate.setMonth(currentDate.getMonth() + i);
      dates.push({
        date: currentDate,
        label: `${transactionName} - Payment ${i + 1}/${months}`,
      });
    }

    return dates;
  };

  // Update recurring dates when relevant fields change
  const updateRecurringPreview = () => {
    if (watchTemplate === 'Credit Card') {
      const dates = calculateCreditCardDates(
        watchLoanDate,
        watchDueDates,
        watchCreditCardDuration,
        watchName
      );
      setRecurringDates(dates);
    } else if (isRecurring) {
      const dates = calculateRecurringDates(
        watchTransactionDate,
        watchDuration,
        watchInterval,
        watchName
      );
      setRecurringDates(dates);
    } else {
      setRecurringDates([]);
    }
  };

  // Effect to update preview when fields change
  useEffect(() => {
    updateRecurringPreview();
  }, [
    watchTemplate,
    watchName,
    watchTransactionDate,
    watchDuration,
    watchInterval,
    isRecurring,
    watchLoanDate,
    watchDueDates,
    watchCreditCardDuration,
  ]);

  const handleInvestorSelect = (investorId: string) => {
    // Check if user wants to create new investor
    if (investorId === 'new') {
      setShowInvestorModal(true);
      setInvestorSelectValue('');
      return;
    }

    setSelectedInvestorId(parseInt(investorId));
    setInvestorSelectValue(investorId);
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

    // Automatically select the new investor
    setSelectedInvestorId(fullInvestor.id);
    setInvestorSelectValue(fullInvestor.id.toString());
  };

  const onSubmit = async (data: any) => {
    // Validate investor is selected
    if (!selectedInvestorId) {
      toast.error('Please select an investor');
      return;
    }

    setIsSubmitting(true);

    try {
      const isCreditCard = data.template === 'Credit Card';

      // Prepare transactions array
      const transactions: any[] = [];

      if (isCreditCard) {
        // Credit Card: Create IN transaction for loan + OUT transactions for payments
        const loanAmount = parseFloat(data.loanAmount);
        const duration = parseInt(data.duration);
        const interestValue = parseFloat(data.interestValue);
        const otherFees = parseFloat(data.otherFees || '0');
        const monthlyInterest =
          data.interestType === 'rate'
            ? loanAmount * (interestValue / 100)
            : interestValue;
        const monthlyPayment = loanAmount / duration + monthlyInterest;

        // Calculate balance progression
        let currentBalance = 0;

        // Add loan transaction (IN)
        currentBalance += loanAmount;
        transactions.push({
          investorId: selectedInvestorId,
          date: new Date(data.loanDate).toISOString(),
          type: 'Loan',
          direction: 'In',
          name: data.name + ' - Loan',
          amount: loanAmount.toFixed(2),
          balance: currentBalance.toFixed(2),
          notes: data.notes || '',
        });

        // Add payment transactions (OUT)
        const dueDate = new Date(data.dueDates);
        for (let i = 0; i < duration; i++) {
          const currentDueDate = new Date(dueDate);
          currentDueDate.setMonth(currentDueDate.getMonth() + i);

          // Add other fees to first payment only
          const paymentAmount =
            i === 0 ? monthlyPayment + otherFees : monthlyPayment;
          currentBalance -= paymentAmount;

          transactions.push({
            investorId: selectedInvestorId,
            date: currentDueDate.toISOString(),
            type: 'Loan',
            direction: 'Out',
            name: data.name + ` - Payment ${i + 1}/${duration}`,
            amount: paymentAmount.toFixed(2),
            balance: currentBalance.toFixed(2),
            notes: data.notes || '',
          });
        }
      } else if (data.isRecurring && recurringDates.length > 0) {
        // Recurring transactions
        const amount = parseFloat(data.amount);
        let currentBalance = 0;

        recurringDates.forEach((dateInfo, index) => {
          if (data.direction === 'In') {
            currentBalance += amount;
          } else {
            currentBalance -= amount;
          }

          transactions.push({
            investorId: selectedInvestorId,
            date: dateInfo.date.toISOString(),
            type: 'Investment',
            direction: data.direction,
            name: `${data.name} - ${index + 1}/${recurringDates.length}`,
            amount: amount.toFixed(2),
            balance: currentBalance.toFixed(2),
            notes: data.notes || '',
          });
        });
      } else {
        // Single transaction
        const amount = parseFloat(data.amount);
        const balance = data.direction === 'In' ? amount : -amount;

        transactions.push({
          investorId: selectedInvestorId,
          date: new Date(data.transactionDate).toISOString(),
          type: 'Investment',
          direction: data.direction,
          name: data.name,
          amount: amount.toFixed(2),
          balance: balance.toFixed(2),
          notes: data.notes || '',
        });
      }

      // Create all transactions via API
      const createPromises = transactions.map((transaction) =>
        fetch('/api/transactions', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(transaction),
        })
      );

      await Promise.all(createPromises);

      toast.success(
        `Successfully created ${transactions.length} transaction${
          transactions.length > 1 ? 's' : ''
        }!`
      );

      if (onSuccess) {
        onSuccess();
      } else {
        router.push('/transactions');
        router.refresh();
      }
    } catch (error) {
      console.error('Error creating transaction:', error);
      toast.error('Failed to create transaction. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

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

  const isCreditCard = watchTemplate === 'Credit Card';

  return (
    <form ref={formRef} onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <FormHeader
        title="Create Transaction"
        description="Add a new transaction"
        onCancel={handleCancelClick}
        onSubmit={handleFormSubmit}
        isSubmitting={isSubmitting}
        isEditMode={false}
        submitLabel={isSubmitting ? 'Creating...' : 'Create Transaction'}
      />

      {/* Investor Selection */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg sm:text-xl">Select Investor</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <Label>Investor *</Label>
            <Select
              value={investorSelectValue}
              onValueChange={handleInvestorSelect}
            >
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
                {investors.length > 0 && (
                  <div className="h-px bg-border my-1" />
                )}
                {investors.map((investor) => (
                  <SelectItem key={investor.id} value={investor.id.toString()}>
                    {investor.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg sm:text-xl">
            Transaction Details
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Common Fields */}
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="name">Name / Label *</Label>
              <Input
                id="name"
                {...register('name')}
                placeholder="e.g., Salary, Expenses, Credit Card"
              />
              {errors.name && (
                <p className="text-sm text-red-600">
                  {String(errors.name.message)}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="template">Template *</Label>
              <Select
                value={watchTemplate}
                onValueChange={(value) => setValue('template', value as any)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="None">None</SelectItem>
                  <SelectItem value="Credit Card">Credit Card</SelectItem>
                </SelectContent>
              </Select>
              {errors.template && (
                <p className="text-sm text-red-600">
                  {String(errors.template.message)}
                </p>
              )}
            </div>
          </div>

          {/* Fields for None template */}
          {!isCreditCard && (
            <>
              <div className="grid gap-4 sm:grid-cols-3">
                {/* Direction - Hide for Credit Card */}
                {!isCreditCard && (
                  <div className="space-y-2">
                    <Label htmlFor="direction">Direction *</Label>
                    <Select
                      value={watchDirection}
                      onValueChange={(value) => setValue('direction', value)}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="In">In</SelectItem>
                        <SelectItem value="Out">Out</SelectItem>
                      </SelectContent>
                    </Select>
                    {errors.direction && (
                      <p className="text-sm text-red-600">
                        {String(errors.direction.message)}
                      </p>
                    )}
                  </div>
                )}
                <div className="space-y-2">
                  <Label htmlFor="amount">Amount *</Label>
                  <Input
                    id="amount"
                    type="number"
                    step="0.01"
                    {...register('amount')}
                    placeholder="0.00"
                  />
                  {errors.amount && (
                    <p className="text-sm text-red-600">
                      {String(errors.amount.message)}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="transactionDate">Transaction Date *</Label>
                  <DatePicker
                    id="transactionDate"
                    value={watchTransactionDate}
                    onChange={(date) => setValue('transactionDate', date)}
                  />
                  <p className="text-xs text-muted-foreground">
                    This will be used for succeeding dates.
                  </p>
                  {errors.transactionDate && (
                    <p className="text-sm text-red-600">
                      {String(errors.transactionDate.message)}
                    </p>
                  )}
                </div>
              </div>

              {/* Recurring Section */}
              <div className="space-y-4 p-4 border rounded-lg bg-muted/30">
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="isRecurring"
                    checked={isRecurring}
                    onChange={(e) => {
                      setIsRecurring(e.target.checked);
                      setValue('isRecurring', e.target.checked);
                    }}
                    className="h-4 w-4"
                  />
                  <Label htmlFor="isRecurring" className="cursor-pointer">
                    Is Recurring?
                  </Label>
                </div>

                {isRecurring && (
                  <div className="space-y-4 pt-4 border-t">
                    <div className="grid gap-4 sm:grid-cols-2">
                      <div className="space-y-2">
                        <Label htmlFor="duration">
                          Number of Transactions *
                        </Label>
                        <Input
                          id="duration"
                          type="number"
                          {...register('duration')}
                          placeholder="e.g., 12"
                        />
                        {errors.duration && (
                          <p className="text-sm text-red-600">
                            {String(errors.duration.message)}
                          </p>
                        )}
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="interval">Interval *</Label>
                        <Select
                          value={watchInterval}
                          onValueChange={(value) => setValue('interval', value)}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select interval..." />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="every-week">
                              Every week
                            </SelectItem>
                            <SelectItem value="every-2-weeks">
                              Every 2 weeks
                            </SelectItem>
                            <SelectItem value="every-3-weeks">
                              Every 3 weeks
                            </SelectItem>
                            <SelectItem value="every-month">
                              Every month
                            </SelectItem>
                            <SelectItem value="every-1.5-months">
                              Every 1½ month
                            </SelectItem>
                            <SelectItem value="every-2-months">
                              Every 2 months
                            </SelectItem>
                            <SelectItem value="every-3-months">
                              Every 3 months
                            </SelectItem>
                            <SelectItem value="every-year">
                              Every year
                            </SelectItem>
                          </SelectContent>
                        </Select>
                        {errors.interval && (
                          <p className="text-sm text-red-600">
                            {String(errors.interval.message)}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </>
          )}

          {/* Fields for Credit Card */}
          {isCreditCard && (
            <>
              <Alert className="bg-blue-50 border-blue-200 [&>svg+div]:translate-y-[0] [&>svg]:text-blue-600">
                <AlertCircle className="h-4 w-4 text-blue-600" />
                <AlertDescription className="text-xs text-blue-800">
                  <strong>Note:</strong> Credit card transactions automatically
                  create an <strong>IN</strong> transaction for the loan amount
                  and <strong>OUT</strong> transactions for each payment period.
                </AlertDescription>
              </Alert>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="loanAmount">Loan Amount *</Label>
                  <Input
                    id="loanAmount"
                    type="number"
                    step="0.01"
                    {...register('loanAmount')}
                    placeholder="0.00"
                  />
                  {errors.loanAmount && (
                    <p className="text-sm text-red-600">
                      {String(errors.loanAmount.message)}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="loanDate">Loan Date *</Label>
                  <DatePicker
                    id="loanDate"
                    value={watchLoanDate}
                    onChange={(date) => setValue('loanDate', date)}
                  />
                  {errors.loanDate && (
                    <p className="text-sm text-red-600">
                      {String(errors.loanDate.message)}
                    </p>
                  )}
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="dueDates">Due Dates *</Label>
                  <DatePicker
                    id="dueDates"
                    value={watchDueDates}
                    onChange={(date) => setValue('dueDates', date)}
                  />
                  <p className="text-xs text-muted-foreground">
                    These will be used for succeeding due dates.
                  </p>
                  {errors.dueDates && (
                    <p className="text-sm text-red-600">
                      {String(errors.dueDates.message)}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="duration">Duration (months) *</Label>
                  <Input
                    id="duration"
                    type="number"
                    {...register('duration')}
                    placeholder="e.g., 12"
                  />
                  {errors.duration && (
                    <p className="text-sm text-red-600">
                      {String(errors.duration.message)}
                    </p>
                  )}
                </div>
              </div>

              <div className="space-y-2">
                <Label>Interest per Month *</Label>
                <Tabs
                  value={watchInterestType}
                  onValueChange={(value) =>
                    setValue('interestType', value as 'fixed' | 'rate')
                  }
                >
                  <TabsList className="grid w-full grid-cols-2 h-8">
                    <TabsTrigger value="fixed" className="text-xs">
                      Fixed Amount (₱)
                    </TabsTrigger>
                    <TabsTrigger value="rate" className="text-xs">
                      Interest Rate (%)
                    </TabsTrigger>
                  </TabsList>
                  <TabsContent value="fixed" className="mt-2">
                    <Input
                      type="number"
                      step="0.01"
                      {...register('interestValue')}
                      placeholder="e.g., 5000.00"
                    />
                  </TabsContent>
                  <TabsContent value="rate" className="mt-2">
                    <Input
                      type="number"
                      step="0.01"
                      {...register('interestValue')}
                      placeholder="e.g., 10"
                    />
                  </TabsContent>
                </Tabs>
                {errors.interestValue && (
                  <p className="text-sm text-red-600">
                    {String(errors.interestValue.message)}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="otherFees">Other Fees (one-time)</Label>
                <Input
                  id="otherFees"
                  type="number"
                  step="0.01"
                  {...register('otherFees')}
                  placeholder="0.00"
                />
                <p className="text-xs text-muted-foreground">
                  One-time processing or service fees (optional)
                </p>
              </div>
            </>
          )}

          {/* Notes Field - Common for all templates */}
          <div className="space-y-2">
            <Label htmlFor="notes">Notes (optional)</Label>
            <textarea
              id="notes"
              {...register('notes')}
              placeholder="Add any additional notes..."
              className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
            />
          </div>
        </CardContent>
      </Card>

      {/* Preview Section */}
      {recurringDates.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg sm:text-xl flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Preview - Projected Dates
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="max-h-96 overflow-y-auto space-y-2">
              {recurringDates.map((item, index) => {
                // Determine if this is IN or OUT
                const isIncoming = isCreditCard
                  ? index === 0 // First transaction is the loan (IN)
                  : watchDirection === 'In';

                // Calculate amount
                const amount = isCreditCard
                  ? index === 0
                    ? parseFloat(watch('loanAmount') || '0')
                    : (() => {
                        const loanAmount = parseFloat(
                          watch('loanAmount') || '0'
                        );
                        const duration = parseInt(
                          watchCreditCardDuration || '1'
                        );
                        const interestValue = parseFloat(
                          watch('interestValue') || '0'
                        );
                        const otherFees = parseFloat(watchOtherFees || '0');
                        const monthlyInterest =
                          watchInterestType === 'rate'
                            ? loanAmount * (interestValue / 100)
                            : interestValue;
                        // Add other fees only to the first payment (index 1)
                        const oneTimeFees = index === 1 ? otherFees : 0;
                        return (
                          loanAmount / duration + monthlyInterest + oneTimeFees
                        );
                      })()
                  : parseFloat(watchAmount || '0');

                const sign = isIncoming ? '+' : '-';

                return (
                  <div
                    key={index}
                    className="flex items-center justify-between p-3 border rounded-lg bg-muted/30"
                  >
                    <div className="flex flex-col">
                      <span className="text-sm font-medium">{item.label}</span>
                      <span className="text-xs text-muted-foreground">
                        {item.date.toLocaleDateString('en-US', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric',
                        })}
                      </span>
                    </div>
                    <div className="text-right">
                      <span
                        className={`text-sm font-semibold ${
                          isIncoming ? 'text-emerald-600' : 'text-rose-600'
                        }`}
                      >
                        {sign}{' '}
                        {new Intl.NumberFormat('en-PH', {
                          style: 'currency',
                          currency: 'PHP',
                        }).format(amount)}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
            <div className="mt-4 p-4 bg-gray-100 border border-gray-200 rounded-lg space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-900">No. of Transactions:</span>
                <span className="text-gray-900">{recurringDates.length}</span>
              </div>
              {!isCreditCard && (
                <>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-900">
                      Amount per Transaction:
                    </span>
                    <span className="text-gray-900 font-medium">
                      {new Intl.NumberFormat('en-PH', {
                        style: 'currency',
                        currency: 'PHP',
                      }).format(parseFloat(watchAmount || '0'))}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-sm pt-2 border-t border-gray-300">
                    <span className="text-gray-900 font-bold">
                      Total Amount:
                    </span>
                    <span className="text-gray-900 font-bold">
                      {new Intl.NumberFormat('en-PH', {
                        style: 'currency',
                        currency: 'PHP',
                      }).format(
                        parseFloat(watchAmount || '0') * recurringDates.length
                      )}
                    </span>
                  </div>
                </>
              )}
              {isCreditCard &&
                (() => {
                  const loanAmount = parseFloat(watch('loanAmount') || '0');
                  const duration = parseInt(watchCreditCardDuration || '1');
                  const interestValue = parseFloat(
                    watch('interestValue') || '0'
                  );
                  const otherFees = parseFloat(watchOtherFees || '0');
                  const monthlyInterest =
                    watchInterestType === 'rate'
                      ? loanAmount * (interestValue / 100)
                      : interestValue;
                  const totalInterest = monthlyInterest * duration;
                  const totalAmount = loanAmount + totalInterest + otherFees;

                  return (
                    <>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-900">Loan Amount:</span>
                        <span className="text-gray-900 font-medium">
                          {new Intl.NumberFormat('en-PH', {
                            style: 'currency',
                            currency: 'PHP',
                          }).format(loanAmount)}
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-900">Monthly Interest:</span>
                        <span className="text-gray-900 font-medium">
                          {new Intl.NumberFormat('en-PH', {
                            style: 'currency',
                            currency: 'PHP',
                          }).format(monthlyInterest)}
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-900">Total Interest:</span>
                        <span className="text-gray-900 font-medium">
                          {new Intl.NumberFormat('en-PH', {
                            style: 'currency',
                            currency: 'PHP',
                          }).format(totalInterest)}
                        </span>
                      </div>
                      {otherFees > 0 && (
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-gray-900">
                            Other Fees (one-time):
                          </span>
                          <span className="text-gray-900 font-medium">
                            {new Intl.NumberFormat('en-PH', {
                              style: 'currency',
                              currency: 'PHP',
                            }).format(otherFees)}
                          </span>
                        </div>
                      )}
                      <div className="flex items-center justify-between text-sm pt-2 border-t border-gray-300">
                        <span className="text-gray-900 font-bold">
                          Total Amount to Pay:
                        </span>
                        <span className="text-gray-900 font-bold">
                          {new Intl.NumberFormat('en-PH', {
                            style: 'currency',
                            currency: 'PHP',
                          }).format(totalAmount)}
                        </span>
                      </div>
                    </>
                  );
                })()}
            </div>
          </CardContent>
        </Card>
      )}

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
          {isSubmitting ? 'Creating...' : 'Create Transaction'}
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

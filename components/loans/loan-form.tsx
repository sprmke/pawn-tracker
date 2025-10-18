'use client';

import { useState } from 'react';
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
import { InvestorFormModal } from '@/components/investors/investor-form-modal';

const loanSchema = z.object({
  loanName: z.string().min(1, 'Loan name is required'),
  type: z.enum(['Lot Title', 'OR/CR', 'Agent']),
  status: z
    .enum(['Partially Funded', 'Fully Funded', 'Overdue', 'Completed'])
    .default('Fully Funded'),
  dueDate: z.string().min(1, 'Due date is required'),
  isMonthlyInterest: z.boolean().default(false),
  freeLotSqm: z.string().optional(),
  notes: z.string().optional(),
});

interface Transaction {
  id: string; // unique ID for each transaction
  amount: string;
  interestRate: string;
  interestAmount: string;
  interestType: 'rate' | 'amount';
  sentDate: string;
}

interface InvestorAllocation {
  investor: Investor;
  transactions: Transaction[];
}

interface LoanFormProps {
  investors: Investor[];
  existingLoan?: LoanWithInvestors;
  onSuccess?: () => void;
}

export function LoanForm({
  investors: initialInvestors,
  existingLoan,
  onSuccess,
}: LoanFormProps) {
  const router = useRouter();
  const isEditMode = !!existingLoan;

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
        transactions.push({
          id: li.id.toString(),
          amount: li.amount,
          interestRate: li.interestRate,
          interestAmount: '',
          interestType: 'rate' as const,
          sentDate: new Date(li.sentDate).toISOString().split('T')[0],
        });
        investorMap.set(li.investor.id, transactions);
      });

      // Convert map to array of InvestorAllocation
      const result: InvestorAllocation[] = [];
      investorMap.forEach((transactions, investorId) => {
        const investor = existingLoan.loanInvestors.find(
          (li) => li.investor.id === investorId
        )?.investor;
        if (investor) {
          result.push({ investor, transactions });
        }
      });

      return result;
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
          status: existingLoan.status,
          dueDate: new Date(existingLoan.dueDate).toISOString().split('T')[0],
          isMonthlyInterest: existingLoan.isMonthlyInterest,
          freeLotSqm: existingLoan.freeLotSqm?.toString() || '',
          notes: existingLoan.notes || '',
        }
      : {
          type: 'Lot Title' as const,
          status: 'Fully Funded' as const,
          isMonthlyInterest: false,
        },
  });

  const watchType = watch('type');
  const watchStatus = watch('status');

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
              sentDate: new Date().toISOString().split('T')[0],
            },
          ],
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
            sentDate: new Date().toISOString().split('T')[0],
          },
        ],
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
                  sentDate: new Date().toISOString().split('T')[0],
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
              transactions: si.transactions.map((t) =>
                t.id === transactionId ? { ...t, [field]: value } : t
              ),
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

    return {
      totalCapital,
      totalInterest,
      totalAmount,
      averageRate,
      uniqueInvestors,
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
      const loanData = {
        loanName: data.loanName,
        type: data.type,
        status: data.status,
        dueDate: new Date(data.dueDate),
        isMonthlyInterest: data.isMonthlyInterest,
        freeLotSqm: data.freeLotSqm ? parseInt(data.freeLotSqm) : null,
        notes: data.notes || null,
      };

      // Flatten all transactions from all investors
      const investorData: Array<{
        investorId: number;
        amount: string;
        interestRate: string;
        sentDate: Date;
      }> = [];

      selectedInvestors.forEach((si) => {
        si.transactions.forEach((transaction) => {
          let interestRate = transaction.interestRate;

          // If user chose fixed amount, calculate the equivalent rate
          if (transaction.interestType === 'amount') {
            const capital = parseFloat(transaction.amount) || 0;
            const interest = parseFloat(transaction.interestAmount) || 0;
            if (capital > 0) {
              interestRate = ((interest / capital) * 100).toFixed(2);
            }
          }

          investorData.push({
            investorId: si.investor.id,
            amount: transaction.amount,
            interestRate: interestRate,
            sentDate: new Date(transaction.sentDate),
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

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
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

            <div className="space-y-2">
              <Label htmlFor="status">Status</Label>
              <Select
                value={watchStatus}
                onValueChange={(value) => setValue('status', value as any)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Fully Funded">Fully Funded</SelectItem>
                  <SelectItem value="Partially Funded">
                    Partially Funded
                  </SelectItem>
                  <SelectItem value="Overdue">Overdue</SelectItem>
                  <SelectItem value="Completed">Completed</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="freeLotSqm">Free Lot (sqm)</Label>
              <Input
                id="freeLotSqm"
                type="number"
                {...register('freeLotSqm')}
                placeholder="Optional"
              />
            </div>
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

      <Card>
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

                      {/* Transactions */}
                      <div className="space-y-3">
                        {si.transactions.map((transaction, index) => (
                          <div
                            key={transaction.id}
                            className="p-3 border rounded-lg space-y-3 bg-muted/30"
                          >
                            <div className="flex items-center justify-between">
                              <span className="text-sm font-medium text-muted-foreground">
                                Transaction {index + 1}
                              </span>
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
                                  onChange={(e) =>
                                    updateTransaction(
                                      si.investor.id,
                                      transaction.id,
                                      'sentDate',
                                      e.target.value
                                    )
                                  }
                                />
                              </div>
                            </div>

                            <div className="space-y-2">
                              <Label className="text-xs">Interest</Label>
                              <Tabs
                                value={transaction.interestType}
                                onValueChange={(value) =>
                                  updateTransaction(
                                    si.investor.id,
                                    transaction.id,
                                    'interestType',
                                    value as 'rate' | 'amount'
                                  )
                                }
                              >
                                <TabsList className="grid w-full grid-cols-2 h-8">
                                  <TabsTrigger value="rate" className="text-xs">
                                    Rate (%)
                                  </TabsTrigger>
                                  <TabsTrigger
                                    value="amount"
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
                                <TabsContent value="amount" className="mt-2">
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
                          </div>
                        ))}

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
            <Card>
              <CardHeader>
                <CardTitle className="text-lg sm:text-xl">
                  Loan Preview
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  {(() => {
                    // Group preview by investor
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
                        const investor = transactions[0].investor;
                        const totalCapital = transactions.reduce(
                          (sum, t) => sum + t.capital,
                          0
                        );
                        const totalInterest = transactions.reduce(
                          (sum, t) => sum + t.interest,
                          0
                        );
                        const grandTotal = totalCapital + totalInterest;
                        const averageRate =
                          totalCapital > 0
                            ? (totalInterest / totalCapital) * 100
                            : 0;

                        return (
                          <div
                            key={investor.id}
                            className="p-4 border rounded-lg space-y-3"
                          >
                            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                              <h4 className="font-semibold text-sm sm:text-base">
                                {investor.name}
                              </h4>
                              {transactions.length > 1 && (
                                <Badge
                                  variant="secondary"
                                  className="w-fit text-xs"
                                >
                                  {transactions.length} Transactions
                                </Badge>
                              )}
                            </div>

                            {/* Individual Transactions */}
                            <div className="space-y-2">
                              {transactions.map((p, index) => (
                                <div
                                  key={`${p.investor.id}-${index}`}
                                  className="p-3 bg-muted/30 rounded-lg space-y-2"
                                >
                                  {transactions.length > 1 && (
                                    <div className="mb-2">
                                      <span className="text-sm font-medium text-muted-foreground">
                                        Transaction {index + 1}
                                      </span>
                                    </div>
                                  )}
                                  <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 text-sm">
                                    <div>
                                      <p className="text-muted-foreground">
                                        Capital
                                      </p>
                                      <p className="font-medium">
                                        {formatCurrency(p.capital)}
                                      </p>
                                    </div>
                                    <div>
                                      <p className="text-muted-foreground">
                                        Rate
                                      </p>
                                      <p className="font-medium">
                                        {p.interestRate.toFixed(2)}%
                                      </p>
                                    </div>
                                    <div>
                                      <p className="text-muted-foreground">
                                        Interest
                                      </p>
                                      <p className="font-medium">
                                        {formatCurrency(p.interest)}
                                      </p>
                                    </div>
                                    <div>
                                      <p className="text-muted-foreground">
                                        Total
                                      </p>
                                      <p className="font-semibold">
                                        {formatCurrency(p.total)}
                                      </p>
                                    </div>
                                    <div>
                                      <p className="text-muted-foreground">
                                        Sent Date
                                      </p>
                                      <p className="font-medium">
                                        {p.sentDate}
                                      </p>
                                    </div>
                                  </div>
                                </div>
                              ))}
                            </div>

                            {/* Grand Total for this investor */}
                            {transactions.length > 1 && (
                              <div className="pt-2 px-3 border-t">
                                <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 text-xs sm:text-sm">
                                  <div>
                                    <p className="text-muted-foreground font-semibold">
                                      Total Capital
                                    </p>
                                    <p className="font-bold">
                                      {formatCurrency(totalCapital)}
                                    </p>
                                  </div>
                                  <div>
                                    <p className="text-muted-foreground font-semibold">
                                      Avg. Rate
                                    </p>
                                    <p className="font-bold">
                                      {averageRate.toFixed(2)}%
                                    </p>
                                  </div>
                                  <div>
                                    <p className="text-muted-foreground font-semibold">
                                      Total Interest
                                    </p>
                                    <p className="font-bold">
                                      {formatCurrency(totalInterest)}
                                    </p>
                                  </div>
                                  <div>
                                    <p className="text-muted-foreground font-semibold">
                                      Grand Total
                                    </p>
                                    <p className="font-bold text-base">
                                      {formatCurrency(grandTotal)}
                                    </p>
                                  </div>
                                  <div></div>
                                </div>
                              </div>
                            )}
                          </div>
                        );
                      }
                    );
                  })()}
                </div>

                {summary && (
                  <div className="border-t pt-4">
                    <h4 className="font-semibold mb-4 text-sm sm:text-base">
                      Summary
                    </h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
                      <div className="p-4 bg-muted rounded-lg">
                        <p className="text-xs sm:text-sm text-muted-foreground">
                          Total Principal
                        </p>
                        <p className="text-lg sm:text-xl font-bold break-words">
                          {formatCurrency(summary.totalCapital)}
                        </p>
                      </div>
                      <div className="p-4 bg-muted rounded-lg">
                        <p className="text-xs sm:text-sm text-muted-foreground">
                          Avg. Rate
                        </p>
                        <p className="text-lg sm:text-xl font-bold break-words">
                          {summary.averageRate.toFixed(2)}%
                        </p>
                      </div>
                      <div className="p-4 bg-muted rounded-lg">
                        <p className="text-xs sm:text-sm text-muted-foreground">
                          Total Interest
                        </p>
                        <p className="text-lg sm:text-xl font-bold break-words">
                          {formatCurrency(summary.totalInterest)}
                        </p>
                      </div>
                      <div className="p-4 bg-muted rounded-lg">
                        <p className="text-xs sm:text-sm text-muted-foreground">
                          Total Amount
                        </p>
                        <p className="text-lg sm:text-xl font-bold break-words">
                          {formatCurrency(summary.totalAmount)}
                        </p>
                      </div>
                      <div className="p-4 bg-muted rounded-lg">
                        <p className="text-xs sm:text-sm text-muted-foreground">
                          Investors
                        </p>
                        <p className="text-lg sm:text-xl font-bold break-words">
                          {summary.uniqueInvestors}
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </>
      )}

      <div className="flex flex-col sm:flex-row gap-4">
        <Button
          type="button"
          variant="outline"
          onClick={() => router.back()}
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

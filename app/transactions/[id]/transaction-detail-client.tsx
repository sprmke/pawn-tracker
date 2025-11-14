'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from '@/lib/toast';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import { TransactionWithInvestor, Investor } from '@/lib/types';
import { TransactionDetailContent } from '@/components/transactions/transaction-detail-content';
import { DetailHeader } from '@/components/common';
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
import { toLocalDateString } from '@/lib/date-utils';

interface TransactionDetailClientProps {
  transaction: TransactionWithInvestor;
  investors: Investor[];
}

export function TransactionDetailClient({
  transaction,
  investors,
}: TransactionDetailClientProps) {
  const router = useRouter();
  const [isEditing, setIsEditing] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form state
  const [formData, setFormData] = useState({
    name: transaction.name,
    type: transaction.type,
    direction: transaction.direction,
    amount: transaction.amount,
    date: toLocalDateString(new Date(transaction.date)),
    investorId: transaction.investorId,
    notes: transaction.notes || '',
  });

  const handleDelete = async () => {
    const response = await fetch(`/api/transactions/${transaction.id}`, {
      method: 'DELETE',
    });

    if (!response.ok) throw new Error('Failed to delete transaction');

    router.push('/transactions');
    router.refresh();
  };

  const handleViewLoan = () => {
    if (!transaction.loanId) {
      toast.error('This transaction is not linked to a loan.');
      return;
    }

    router.push(`/loans/${transaction.loanId}`);
  };

  const isLoanTransaction = transaction.type === 'Loan';

  const handleUpdate = async () => {
    setIsSubmitting(true);
    try {
      const response = await fetch(`/api/transactions/${transaction.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: formData.name,
          type: formData.type,
          direction: formData.direction,
          amount: formData.amount,
          date: new Date(formData.date).toISOString(),
          investorId: formData.investorId,
          notes: formData.notes,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to update transaction');
      }

      setIsEditing(false);
      router.refresh();
    } catch (error) {
      console.error('Error updating transaction:', error);
      toast.error(
        error instanceof Error
          ? error.message
          : 'Failed to update transaction. Please try again.'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isEditing) {
    return (
      <div className="max-w-4xl mx-auto space-y-6">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => router.push('/transactions')}
          className="-ml-2 w-fit mb-4"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Transactions
        </Button>

        <div className="flex items-center justify-between">
          <h1 className="text-xl font-semibold tracking-tight">
            Edit Transaction
          </h1>
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => setIsEditing(false)}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button onClick={handleUpdate} disabled={isSubmitting}>
              {isSubmitting ? 'Saving...' : 'Save Changes'}
            </Button>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg sm:text-xl">
              Transaction Details
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="name">Name *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  placeholder="Transaction name"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="date">Date *</Label>
                <Input
                  id="date"
                  type="date"
                  value={formData.date}
                  onChange={(e) =>
                    setFormData({ ...formData, date: e.target.value })
                  }
                />
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="type">Type *</Label>
                <Select
                  value={formData.type}
                  onValueChange={(value) =>
                    setFormData({ ...formData, type: value as any })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Loan">Loan</SelectItem>
                    <SelectItem value="Investment">Investment</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="direction">Direction *</Label>
                <Select
                  value={formData.direction}
                  onValueChange={(value) =>
                    setFormData({ ...formData, direction: value as any })
                  }
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
            </div>

            <div className="space-y-2">
              <Label htmlFor="amount">Amount *</Label>
              <Input
                id="amount"
                type="number"
                step="0.01"
                value={formData.amount}
                onChange={(e) =>
                  setFormData({ ...formData, amount: e.target.value })
                }
                placeholder="0.00"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="investor">Investor *</Label>
              <Select
                value={formData.investorId.toString()}
                onValueChange={(value) =>
                  setFormData({ ...formData, investorId: parseInt(value) })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {investors.map((investor) => (
                    <SelectItem
                      key={investor.id}
                      value={investor.id.toString()}
                    >
                      {investor.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="notes">Notes</Label>
              <textarea
                id="notes"
                value={formData.notes}
                onChange={(e) =>
                  setFormData({ ...formData, notes: e.target.value })
                }
                placeholder="Add any additional notes..."
                className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              />
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <DetailHeader
        title={transaction.name}
        description="View and manage transaction details"
        backLabel="Back to Transactions"
        onBack={() => router.push('/transactions')}
        onEdit={() => setIsEditing(true)}
        onDelete={handleDelete}
        deleteTitle="Delete Transaction"
        deleteDescription="Are you sure you want to delete this transaction? This action cannot be undone."
        canEdit={!isLoanTransaction}
        editDisabledReason="Loan transactions cannot be edited directly. Please edit the loan instead."
        onViewLoan={handleViewLoan}
        showViewLoan={isLoanTransaction}
      />

      <TransactionDetailContent transaction={transaction} showHeader={false} />
    </div>
  );
}

'use client';

import { useState, useEffect } from 'react';
import { toast } from '@/lib/toast';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { VisuallyHidden } from '@/components/ui/visually-hidden';
import {
  TransactionWithInvestor,
  Investor,
  LoanWithInvestors,
} from '@/lib/types';
import { TransactionDetailContent } from './transaction-detail-content';
import { DetailModalHeader } from '@/components/common';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
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
import { Button } from '@/components/ui/button';
import { toLocalDateString } from '@/lib/date-utils';
import { LoanDetailModal } from '@/components/loans/loan-detail-modal';

interface TransactionDetailModalProps {
  transaction: TransactionWithInvestor | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onUpdate?: () => void;
}

export function TransactionDetailModal({
  transaction: initialTransaction,
  open,
  onOpenChange,
  onUpdate,
}: TransactionDetailModalProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [investors, setInvestors] = useState<Investor[]>([]);
  const [showLoanModal, setShowLoanModal] = useState(false);
  const [selectedLoan, setSelectedLoan] = useState<LoanWithInvestors | null>(
    null
  );
  const [transaction, setTransaction] = useState<TransactionWithInvestor | null>(
    initialTransaction
  );

  // Update local transaction state when prop changes
  useEffect(() => {
    setTransaction(initialTransaction);
  }, [initialTransaction]);

  // Fetch fresh transaction data
  const fetchTransaction = async () => {
    if (!transaction?.id) return;
    
    try {
      const response = await fetch(`/api/transactions/${transaction.id}`);
      if (!response.ok) throw new Error('Failed to fetch transaction');
      const data = await response.json();
      setTransaction(data);
      onUpdate?.(); // Notify parent to refresh as well
    } catch (error) {
      console.error('Error fetching transaction:', error);
    }
  };

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    type: 'Investment' as 'Loan' | 'Investment',
    direction: 'In' as 'In' | 'Out',
    amount: '',
    date: '',
    investorId: 0,
    notes: '',
  });

  useEffect(() => {
    if (open && isEditing) {
      fetchInvestors();
    }
    // Reset editing state when modal closes
    if (!open) {
      setIsEditing(false);
    }
    // Initialize form data when transaction changes
    if (transaction) {
      setFormData({
        name: transaction.name,
        type: transaction.type,
        direction: transaction.direction,
        amount: transaction.amount,
        date: toLocalDateString(new Date(transaction.date)),
        investorId: transaction.investorId,
        notes: transaction.notes || '',
      });
    }
  }, [open, isEditing, transaction]);

  const fetchInvestors = async () => {
    try {
      const response = await fetch('/api/investors');
      const data = await response.json();
      setInvestors(data);
    } catch (error) {
      console.error('Error fetching investors:', error);
    }
  };

  if (!transaction) return null;

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      const response = await fetch(`/api/transactions/${transaction.id}`, {
        method: 'DELETE',
      });

      if (!response.ok) throw new Error('Failed to delete transaction');

      setShowDeleteDialog(false);
      onOpenChange(false);
      onUpdate?.();
    } catch (error) {
      console.error('Error deleting transaction:', error);
      toast.error('Failed to delete transaction');
    } finally {
      setIsDeleting(false);
    }
  };

  const handleViewLoan = async () => {
    if (!transaction.loanId) {
      toast.error('This transaction is not linked to a loan.');
      return;
    }

    try {
      // Fetch loan data
      const response = await fetch(`/api/loans/${transaction.loanId}`);
      if (!response.ok) throw new Error('Failed to fetch loan');

      const loan = await response.json();
      setSelectedLoan(loan);
      setShowLoanModal(true);
    } catch (error) {
      console.error('Error fetching loan:', error);
      toast.error('Failed to load loan details');
    }
  };

  const handleLoanModalUpdate = async () => {
    // Refresh transaction data if needed
    await fetchTransaction();
  };

  const isLoanTransaction = transaction?.type === 'Loan';

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
      await fetchTransaction(); // Refetch transaction data
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

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent
          className="max-w-4xl max-h-[90vh] overflow-y-auto"
          hideClose
        >
          {isEditing ? (
            <VisuallyHidden>
              <DialogTitle>Edit Transaction - {transaction.name}</DialogTitle>
            </VisuallyHidden>
          ) : (
            <DialogHeader>
              <div className="flex sm:flex-row flex-col items-start justify-between gap-4">
                <DialogTitle className="text-xl font-semibold">
                  {transaction.name}
                </DialogTitle>
                <DetailModalHeader
                  onEdit={() => setIsEditing(true)}
                  onDelete={() => setShowDeleteDialog(true)}
                  canEdit={!isLoanTransaction}
                  editDisabledReason="Loan transactions cannot be edited directly. Please edit the loan instead."
                  onViewLoan={handleViewLoan}
                  showViewLoan={isLoanTransaction}
                />
              </div>
            </DialogHeader>
          )}

          <div className={isEditing ? '' : 'mt-4'}>
            {isEditing ? (
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <h2 className="text-xl font-bold">Edit Transaction</h2>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      onClick={() => setIsEditing(false)}
                      disabled={isSubmitting}
                      size="sm"
                    >
                      Cancel
                    </Button>
                    <Button
                      onClick={handleUpdate}
                      disabled={isSubmitting}
                      size="sm"
                    >
                      {isSubmitting ? 'Saving...' : 'Save'}
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
                            <SelectItem value="Investment">
                              Investment
                            </SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="direction">Direction *</Label>
                        <Select
                          value={formData.direction}
                          onValueChange={(value) =>
                            setFormData({
                              ...formData,
                              direction: value as any,
                            })
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
                          setFormData({
                            ...formData,
                            investorId: parseInt(value),
                          })
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
            ) : (
              <TransactionDetailContent
                transaction={transaction}
                showHeader={false}
              />
            )}
          </div>
        </DialogContent>
      </Dialog>

      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Transaction</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this transaction? This action
              cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={isDeleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDeleting ? 'Deleting...' : 'Delete'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <LoanDetailModal
        loan={selectedLoan}
        open={showLoanModal}
        onOpenChange={setShowLoanModal}
        onUpdate={handleLoanModalUpdate}
      />
    </>
  );
}

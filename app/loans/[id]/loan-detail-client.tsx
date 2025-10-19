'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Edit, Trash2, AlertCircle } from 'lucide-react';
import { LoanWithInvestors, Investor } from '@/lib/types';
import { LoanForm } from '@/components/loans/loan-form';
import { LoanDetailContent } from '@/components/loans/loan-detail-content';

interface LoanDetailClientProps {
  loan: LoanWithInvestors;
  investors: Investor[];
}

export function LoanDetailClient({ loan, investors }: LoanDetailClientProps) {
  const router = useRouter();
  const [isEditing, setIsEditing] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      const response = await fetch(`/api/loans/${loan.id}`, {
        method: 'DELETE',
      });

      if (!response.ok) throw new Error('Failed to delete loan');

      router.push('/loans');
      router.refresh();
    } catch (error) {
      console.error('Error deleting loan:', error);
      alert('Failed to delete loan. Please try again.');
    } finally {
      setIsDeleting(false);
      setShowDeleteConfirm(false);
    }
  };

  if (isEditing) {
    return (
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">
              Edit Loan
            </h1>
            <p className="text-sm sm:text-base text-muted-foreground">
              Update loan details and investor allocations
            </p>
          </div>
          <Button variant="outline" onClick={() => setIsEditing(false)}>
            Cancel
          </Button>
        </div>

        <LoanForm
          investors={investors}
          existingLoan={loan}
          onSuccess={() => {
            setIsEditing(false);
            router.refresh();
          }}
        />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => router.back()}
          className="-ml-2 w-fit"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Loans
        </Button>
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-3 flex-wrap">
              <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">
                {loan.loanName}
              </h1>
            </div>
            <p className="text-sm sm:text-base text-muted-foreground">
              View and manage loan details
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => setIsEditing(true)}>
              <Edit className="mr-2 h-4 w-4" />
              Edit
            </Button>
            <Button
              variant="destructive"
              onClick={() => setShowDeleteConfirm(true)}
            >
              <Trash2 className="mr-2 h-4 w-4" />
              Delete
            </Button>
          </div>
        </div>
      </div>

      {/* Delete Confirmation Dialog */}
      {showDeleteConfirm && (
        <Card className="border-destructive">
          <CardContent className="pt-6">
            <div className="flex items-start gap-4">
              <AlertCircle className="h-5 w-5 text-destructive flex-shrink-0 mt-0.5" />
              <div className="flex-1 space-y-4">
                <div>
                  <h3 className="font-semibold text-lg">Delete Loan</h3>
                  <p className="text-sm text-muted-foreground mt-1">
                    Are you sure you want to delete this loan? This action
                    cannot be undone and will remove all associated investor
                    allocations.
                  </p>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="destructive"
                    onClick={handleDelete}
                    disabled={isDeleting}
                  >
                    {isDeleting ? 'Deleting...' : 'Yes, Delete'}
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => setShowDeleteConfirm(false)}
                    disabled={isDeleting}
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Loan Detail Content */}
      <LoanDetailContent loan={loan} showHeader={false} />
    </div>
  );
}

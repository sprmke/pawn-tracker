'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  ArrowLeft,
  Edit,
  Trash2,
  DollarSign,
  Users,
  Calendar,
  MapPin,
  FileText,
  AlertCircle,
} from 'lucide-react';
import { LoanWithInvestors, Investor } from '@/lib/types';
import { LoanForm } from '@/components/loans/loan-form';
import { getLoanStatusBadge, getLoanTypeBadge } from '@/lib/badge-config';

interface LoanDetailClientProps {
  loan: LoanWithInvestors;
  investors: Investor[];
}

export function LoanDetailClient({ loan, investors }: LoanDetailClientProps) {
  const router = useRouter();
  const [isEditing, setIsEditing] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const formatCurrency = (amount: string | number) => {
    const numAmount = typeof amount === 'string' ? parseFloat(amount) : amount;
    return new Intl.NumberFormat('en-PH', {
      style: 'currency',
      currency: 'PHP',
    }).format(numAmount);
  };

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString('en-PH', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const getTotalPrincipal = () => {
    return loan.loanInvestors.reduce(
      (sum, li) => sum + parseFloat(li.amount),
      0
    );
  };

  const getTotalInterest = () => {
    return loan.loanInvestors.reduce((sum, li) => {
      const capital = parseFloat(li.amount);
      const rate = parseFloat(li.interestRate) / 100;
      return sum + capital * rate;
    }, 0);
  };

  const getTotalAmount = () => {
    return getTotalPrincipal() + getTotalInterest();
  };

  const getAverageInterestRate = () => {
    const totalPrincipal = getTotalPrincipal();
    if (totalPrincipal === 0) return 0;
    const totalInterest = getTotalInterest();
    return (totalInterest / totalPrincipal) * 100;
  };

  const getLoanDuration = () => {
    const today = new Date();
    const dueDate = new Date(loan.dueDate);
    const diffTime = Math.abs(dueDate.getTime() - today.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    const months = Math.floor(diffDays / 30);
    const remainingAfterMonths = diffDays % 30;
    const weeks = Math.floor(remainingAfterMonths / 7);
    const days = remainingAfterMonths % 7;

    const parts = [];
    if (months > 0) {
      parts.push(`${months} ${months === 1 ? 'Month' : 'Months'}`);
    }
    if (weeks > 0) {
      parts.push(`${weeks} ${weeks === 1 ? 'Week' : 'Weeks'}`);
    }
    if (days > 0) {
      parts.push(`${days} ${days === 1 ? 'Day' : 'Days'}`);
    }

    return parts.length > 0 ? parts.join(', ') : '0 Days';
  };

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

      {/* Summary Cards */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg sm:text-xl">Summary</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 grid-cols-2 lg:grid-cols-5">
            <div className="p-4 bg-muted rounded-lg">
              <p className="text-xs sm:text-sm text-muted-foreground mb-1">
                Total Principal
              </p>
              <p className="text-lg sm:text-xl font-bold">
                {formatCurrency(getTotalPrincipal())}
              </p>
            </div>
            <div className="p-4 bg-muted rounded-lg">
              <p className="text-xs sm:text-sm text-muted-foreground mb-1">
                Avg. Rate
              </p>
              <p className="text-lg sm:text-xl font-bold">
                {getAverageInterestRate().toFixed(2)}%
              </p>
            </div>
            <div className="p-4 bg-muted rounded-lg">
              <p className="text-xs sm:text-sm text-muted-foreground mb-1">
                Total Interest
              </p>
              <p className="text-lg sm:text-xl font-bold">
                {formatCurrency(getTotalInterest())}
              </p>
            </div>
            <div className="p-4 bg-muted rounded-lg">
              <p className="text-xs sm:text-sm text-muted-foreground mb-1">
                Total Amount
              </p>
              <p className="text-lg sm:text-xl font-bold">
                {formatCurrency(getTotalAmount())}
              </p>
            </div>
            <div className="p-4 bg-muted rounded-lg">
              <p className="text-xs sm:text-sm text-muted-foreground mb-1">
                Investors
              </p>
              <p className="text-lg sm:text-xl font-bold">
                {new Set(loan.loanInvestors.map((li) => li.investor.id)).size}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Loan Details */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg sm:text-xl">Loan Details</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">Loan Name</p>
              <p className="font-medium">{loan.loanName}</p>
            </div>

            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">Type</p>
              <Badge
                variant={getLoanTypeBadge(loan.type).variant}
                className={getLoanTypeBadge(loan.type).className}
              >
                {loan.type}
              </Badge>
            </div>

            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">Due Date</p>
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <span className="font-medium">{formatDate(loan.dueDate)}</span>
              </div>
            </div>

            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">Status</p>
              <Badge
                variant={getLoanStatusBadge(loan.status).variant}
                className={getLoanStatusBadge(loan.status).className}
              >
                {loan.status}
              </Badge>
            </div>

            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">Free Lot (sqm)</p>
              <div className="flex items-center gap-2">
                <MapPin className="h-4 w-4 text-muted-foreground" />
                <span className="font-medium">
                  {loan.freeLotSqm ? `${loan.freeLotSqm} sqm` : '-'}
                </span>
              </div>
            </div>

            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">Duration</p>
              <span className="font-medium">{getLoanDuration()}</span>
            </div>
          </div>

          <div className="space-y-1">
            <p className="text-sm text-muted-foreground">Notes</p>
            <p className="text-sm whitespace-pre-wrap">{loan.notes || '-'}</p>
          </div>
        </CardContent>
      </Card>

      {/* Investors Section */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg sm:text-xl">Investors</CardTitle>
        </CardHeader>
        <CardContent>
          {loan.loanInvestors.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8">
              <Users className="h-12 w-12 text-muted-foreground mb-4" />
              <p className="text-muted-foreground mb-4">
                No investors allocated
              </p>
              <Button onClick={() => setIsEditing(true)}>
                <Edit className="mr-2 h-4 w-4" />
                Add Investors
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              {(() => {
                // Group loan investors by investor ID
                const investorMap = new Map<
                  number,
                  Array<(typeof loan.loanInvestors)[0]>
                >();

                loan.loanInvestors.forEach((li) => {
                  const existing = investorMap.get(li.investor.id) || [];
                  existing.push(li);
                  investorMap.set(li.investor.id, existing);
                });

                return Array.from(investorMap.values()).map((transactions) => {
                  const investor = transactions[0].investor;
                  const totalCapital = transactions.reduce(
                    (sum, t) => sum + parseFloat(t.amount),
                    0
                  );
                  const totalInterest = transactions.reduce((sum, t) => {
                    const capital = parseFloat(t.amount);
                    const rate = parseFloat(t.interestRate) / 100;
                    return sum + capital * rate;
                  }, 0);
                  const grandTotal = totalCapital + totalInterest;
                  const averageRate =
                    totalCapital > 0 ? (totalInterest / totalCapital) * 100 : 0;

                  return (
                    <div
                      key={investor.id}
                      className="p-4 border rounded-lg space-y-3"
                    >
                      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2">
                        <div>
                          <h4 className="font-semibold text-sm sm:text-base">
                            {investor.name}
                          </h4>
                          <p className="text-xs sm:text-sm text-muted-foreground">
                            {investor.email}
                          </p>
                        </div>
                        {transactions.length > 1 && (
                          <Badge variant="secondary" className="text-xs">
                            {transactions.length} Transactions
                          </Badge>
                        )}
                      </div>

                      {/* Individual Transactions */}
                      <div className="space-y-2">
                        {transactions.map((li, index) => {
                          const capital = parseFloat(li.amount);
                          const rate = parseFloat(li.interestRate);
                          const interest = capital * (rate / 100);
                          const total = capital + interest;

                          return (
                            <div
                              key={li.id}
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
                                    Principal
                                  </p>
                                  <p className="font-medium">
                                    {formatCurrency(capital)}
                                  </p>
                                </div>
                                <div>
                                  <p className="text-muted-foreground">Rate</p>
                                  <p className="font-medium">{rate}%</p>
                                </div>
                                <div>
                                  <p className="text-muted-foreground">
                                    Interest
                                  </p>
                                  <p className="font-medium">
                                    {formatCurrency(interest)}
                                  </p>
                                </div>
                                <div>
                                  <p className="text-muted-foreground">Total</p>
                                  <p className="font-semibold">
                                    {formatCurrency(total)}
                                  </p>
                                </div>
                                <div>
                                  <p className="text-muted-foreground">
                                    Sent Date
                                  </p>
                                  <p className="font-medium">
                                    {formatDate(li.sentDate)}
                                  </p>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>

                      {/* Grand Total for this investor */}
                      {transactions.length > 1 && (
                        <div className="pt-2 px-3 border-t">
                          <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 text-xs sm:text-sm">
                            <div>
                              <p className="text-muted-foreground font-semibold">
                                Principal
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
                                Interest
                              </p>
                              <p className="font-bold">
                                {formatCurrency(totalInterest)}
                              </p>
                            </div>
                            <div>
                              <p className="text-muted-foreground font-semibold">
                                Total
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
                });
              })()}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

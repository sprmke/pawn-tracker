'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  ArrowLeft,
  TrendingUp,
  DollarSign,
  Activity,
  Edit,
  Trash2,
  AlertCircle,
  Mail,
  User,
  Calendar,
  Phone,
} from 'lucide-react';
import Link from 'next/link';
import { InvestorWithLoans } from '@/lib/types';
import {
  getLoanStatusBadge,
  getLoanTypeBadge,
  getTransactionTypeBadge,
  getTransactionDirectionBadge,
} from '@/lib/badge-config';
import { InvestorForm } from '@/components/investors/investor-form';

interface InvestorDetailClientProps {
  investor: InvestorWithLoans;
}

export function InvestorDetailClient({ investor }: InvestorDetailClientProps) {
  const router = useRouter();
  const [isEditing, setIsEditing] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  const formatCurrency = (amount: string | number) => {
    const value = typeof amount === 'string' ? parseFloat(amount) : amount;
    return new Intl.NumberFormat('en-PH', {
      style: 'currency',
      currency: 'PHP',
    }).format(value);
  };

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString('en-PH', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  // Calculate stats
  const totalCapital = investor.loanInvestors.reduce(
    (sum, li) => sum + parseFloat(li.amount),
    0
  );

  const totalInterest = investor.loanInvestors.reduce((sum, li) => {
    const amount = parseFloat(li.amount);
    const rate = parseFloat(li.interestRate) / 100;
    return sum + amount * rate;
  }, 0);

  const totalGains = totalCapital + totalInterest;

  const latestTransaction = investor.transactions[0];
  const currentBalance = latestTransaction
    ? parseFloat(latestTransaction.balance)
    : 0;

  const getBalanceStatus = (balance: number) => {
    if (balance > 100000)
      return { status: 'Can invest', variant: 'default' as const };
    if (balance > 50000)
      return { status: 'Low funds', variant: 'secondary' as const };
    return { status: 'No funds', variant: 'destructive' as const };
  };

  const balanceStatus = getBalanceStatus(currentBalance);

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      const response = await fetch(`/api/investors/${investor.id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to delete investor');
      }

      router.push('/investors');
      router.refresh();
    } catch (error) {
      console.error('Error deleting investor:', error);
      alert(
        error instanceof Error
          ? error.message
          : 'Failed to delete investor. Please try again.'
      );
    } finally {
      setIsDeleting(false);
      setShowDeleteModal(false);
    }
  };

  const canDelete =
    investor.loanInvestors.length === 0 && investor.transactions.length === 0;

  if (isEditing) {
    return (
      <div className="max-w-2xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">
              Edit Investor
            </h1>
            <p className="text-sm sm:text-base text-muted-foreground">
              Update investor information
            </p>
          </div>
          <Button variant="outline" onClick={() => setIsEditing(false)}>
            Cancel
          </Button>
        </div>

        <InvestorForm
          existingInvestor={investor}
          onSuccess={() => {
            setIsEditing(false);
            router.refresh();
          }}
        />
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
        <div className="space-y-1">
          <Link href="/investors">
            <Button variant="ghost" size="sm" className="mb-2 -ml-2">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Investors
            </Button>
          </Link>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">
            {investor.name}
          </h1>
          <p className="text-sm sm:text-base text-muted-foreground">
            Investor portfolio and activity
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setIsEditing(true)}>
            <Edit className="mr-2 h-4 w-4" />
            Edit
          </Button>
          <Button
            variant="destructive"
            onClick={() => setShowDeleteModal(true)}
          >
            <Trash2 className="mr-2 h-4 w-4" />
            Delete
          </Button>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      <Dialog open={showDeleteModal} onOpenChange={setShowDeleteModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-destructive" />
              Delete Investor
            </DialogTitle>
            <DialogDescription>
              {canDelete ? (
                <>
                  Are you sure you want to delete{' '}
                  <strong>{investor.name}</strong>? This action cannot be
                  undone.
                </>
              ) : (
                <>
                  Cannot delete this investor because they have{' '}
                  <strong>{investor.loanInvestors.length}</strong> active
                  loan(s) and <strong>{investor.transactions.length}</strong>{' '}
                  transaction(s). Please remove all loans and transactions
                  first.
                </>
              )}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowDeleteModal(false)}
              disabled={isDeleting}
            >
              {canDelete ? 'Cancel' : 'Close'}
            </Button>
            {canDelete && (
              <Button
                variant="destructive"
                onClick={handleDelete}
                disabled={isDeleting}
              >
                {isDeleting ? 'Deleting...' : 'Yes, Delete'}
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Contact Info Card */}
      <Card>
        <CardContent className="space-y-4 p-6">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <div className="space-y-1">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <User className="h-4 w-4" />
                <span>Full Name</span>
              </div>
              <p className="font-medium">{investor.name}</p>
            </div>

            <div className="space-y-1">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Mail className="h-4 w-4" />
                <span>Email Address</span>
              </div>
              <p className="font-medium">{investor.email}</p>
            </div>

            <div className="space-y-1">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Phone className="h-4 w-4" />
                <span>Contact Number</span>
              </div>
              <p className="font-medium">{investor.contactNumber || '-'}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Summary Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">Total Capital</p>
                <p className="text-xl sm:text-2xl font-bold">
                  {formatCurrency(totalCapital)}
                </p>
              </div>
              <DollarSign className="h-8 w-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">Total Interest</p>
                <p className="text-xl sm:text-2xl font-bold">
                  {formatCurrency(totalInterest)}
                </p>
              </div>
              <TrendingUp className="h-8 w-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">Total Gains</p>
                <p className="text-xl sm:text-2xl font-bold">
                  {formatCurrency(totalGains)}
                </p>
              </div>
              <TrendingUp className="h-8 w-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">Current Balance</p>
                <p className="text-xl sm:text-2xl font-bold">
                  {formatCurrency(currentBalance)}
                </p>
                <Badge variant={balanceStatus.variant} className="text-xs">
                  {balanceStatus.status}
                </Badge>
              </div>
              <Activity className="h-8 w-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="loans" className="w-full">
        <TabsList>
          <TabsTrigger value="loans">
            Loans ({investor.loanInvestors.length})
          </TabsTrigger>
          <TabsTrigger value="transactions">
            Transactions ({investor.transactions.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="loans" className="mt-6">
          {investor.loanInvestors.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <p className="text-muted-foreground">No loans yet</p>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Loan Name</TableHead>
                        <TableHead>Type</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Amount</TableHead>
                        <TableHead>Interest Rate</TableHead>
                        <TableHead>Interest</TableHead>
                        <TableHead>Total</TableHead>
                        <TableHead>Sent Date</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {investor.loanInvestors.map((li) => {
                        const amount = parseFloat(li.amount);
                        const rate = parseFloat(li.interestRate);
                        const interest = amount * (rate / 100);
                        const total = amount + interest;

                        // Check if sent date is in the future
                        const today = new Date();
                        today.setHours(0, 0, 0, 0);
                        const sentDate = new Date(li.sentDate);
                        sentDate.setHours(0, 0, 0, 0);
                        const isFutureSentDate = sentDate > today;

                        return (
                          <TableRow
                            key={li.id}
                            className={isFutureSentDate ? 'bg-yellow-50' : ''}
                          >
                            <TableCell className="font-medium">
                              <Link
                                href={`/loans/${li.loan.id}`}
                                className="hover:underline"
                              >
                                {li.loan.loanName}
                              </Link>
                            </TableCell>
                            <TableCell>
                              <Badge
                                variant={getLoanTypeBadge(li.loan.type).variant}
                                className={
                                  getLoanTypeBadge(li.loan.type).className
                                }
                              >
                                {li.loan.type}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <Badge
                                variant={
                                  getLoanStatusBadge(li.loan.status).variant
                                }
                                className={
                                  getLoanStatusBadge(li.loan.status).className
                                }
                              >
                                {li.loan.status}
                              </Badge>
                            </TableCell>
                            <TableCell>{formatCurrency(amount)}</TableCell>
                            <TableCell>{rate}%</TableCell>
                            <TableCell>{formatCurrency(interest)}</TableCell>
                            <TableCell className="font-semibold">
                              {formatCurrency(total)}
                            </TableCell>
                            <TableCell>{formatDate(li.sentDate)}</TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="transactions" className="mt-6">
          {investor.transactions.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <p className="text-muted-foreground">No transactions yet</p>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Date</TableHead>
                        <TableHead>Type</TableHead>
                        <TableHead>Direction</TableHead>
                        <TableHead>Name</TableHead>
                        <TableHead>Amount</TableHead>
                        <TableHead>Balance</TableHead>
                        <TableHead>Notes</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {investor.transactions.map((transaction) => (
                        <TableRow key={transaction.id}>
                          <TableCell>{formatDate(transaction.date)}</TableCell>
                          <TableCell>
                            <Badge
                              variant={
                                getTransactionTypeBadge(transaction.type)
                                  .variant
                              }
                              className={
                                getTransactionTypeBadge(transaction.type)
                                  .className
                              }
                            >
                              {transaction.type}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <Badge
                              variant={
                                getTransactionDirectionBadge(
                                  transaction.direction
                                ).variant
                              }
                              className={
                                getTransactionDirectionBadge(
                                  transaction.direction
                                ).className
                              }
                            >
                              {transaction.direction}
                            </Badge>
                          </TableCell>
                          <TableCell className="font-medium">
                            {transaction.name}
                          </TableCell>
                          <TableCell
                            className={
                              transaction.direction === 'In'
                                ? 'text-green-600 font-semibold'
                                : 'text-red-600 font-semibold'
                            }
                          >
                            {transaction.direction === 'In' ? '+' : '-'}
                            {formatCurrency(transaction.amount)}
                          </TableCell>
                          <TableCell className="font-semibold">
                            {formatCurrency(transaction.balance)}
                          </TableCell>
                          <TableCell className="text-sm text-muted-foreground">
                            {transaction.notes || '-'}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}

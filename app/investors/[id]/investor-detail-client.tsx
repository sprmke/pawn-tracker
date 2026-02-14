'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useResponsiveViewMode } from '@/hooks';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  TrendingUp,
  DollarSign,
  ArrowLeft,
  Mail,
  User,
  Phone,
  Plus,
  Filter,
  MapPin,
  X,
  Users,
} from 'lucide-react';
import { InvestorWithLoans, LoanWithInvestors, LoanType } from '@/lib/types';
import { getLoanStatusBadge, getLoanTypeBadge } from '@/lib/badge-config';
import { InvestorForm } from '@/components/investors/investor-form';
import { formatCurrency, formatDate } from '@/lib/format';
import {
  calculateTotalPrincipal,
  calculateTotalInterest,
  calculateAverageRate,
} from '@/lib/calculations';
import {
  StatCard,
  SummaryCard,
  DetailHeader,
  LoansTable,
  SearchFilter,
  RangeFilter,
  MultiSelectFilter,
  CollapsibleSection,
  CollapsibleContent,
  InlineLoader,
  CompletedLoansCard,
  PastDueLoansCard,
  PendingDisbursementsCard,
  MaturingLoansCard,
  CardPagination,
  ExportButton,
} from '@/components/common';
import {
  TransactionsTable,
  TransactionCreateModal,
  TransactionDetailModal,
  TransactionCard,
} from '@/components/transactions';
import { LoanCreateModal, LoanDetailModal } from '@/components/loans';
import type { TransactionWithInvestor } from '@/lib/types';
import { addDays, isAfter, isBefore, isPast } from 'date-fns';
import { loansCSVColumns, transactionsCSVColumns } from '@/lib/csv-columns';

interface InvestorDetailClientProps {
  investor: InvestorWithLoans;
}

export function InvestorDetailClient({ investor }: InvestorDetailClientProps) {
  const router = useRouter();
  const [isEditing, setIsEditing] = useState(false);
  const [expandedLoans, setExpandedLoans] = useState<Set<number>>(new Set());
  const [loans, setLoans] = useState<LoanWithInvestors[]>([]);
  const [loansLoading, setLoansLoading] = useState(true);
  const [showTransactionModal, setShowTransactionModal] = useState(false);
  const [showLoanModal, setShowLoanModal] = useState(false);
  const [selectedTransaction, setSelectedTransaction] =
    useState<TransactionWithInvestor | null>(null);
  const [showTransactionDetailModal, setShowTransactionDetailModal] =
    useState(false);
  const [selectedLoan, setSelectedLoan] = useState<LoanWithInvestors | null>(
    null,
  );
  const [showLoanDetailModal, setShowLoanDetailModal] = useState(false);

  // View modes - using responsive hook for SSR-safe view mode detection
  const {
    viewMode: loansViewMode,
    setViewMode: setLoansViewMode,
    isReady: isLoansViewModeReady,
  } = useResponsiveViewMode<'cards' | 'table'>();

  const {
    viewMode: transactionsViewMode,
    setViewMode: setTransactionsViewMode,
    isReady: isTransactionsViewModeReady,
  } = useResponsiveViewMode<'cards' | 'table'>();

  // Combined ready state for view modes
  const isViewModeReady = isLoansViewModeReady && isTransactionsViewModeReady;

  // Transaction filters
  const [transactionSearchQuery, setTransactionSearchQuery] = useState('');
  const [showPastTransactions, setShowPastTransactions] = useState(false);
  const [transactionTypeFilter, setTransactionTypeFilter] = useState<string[]>(
    [],
  );
  const [transactionDirectionFilter, setTransactionDirectionFilter] = useState<
    string[]
  >([]);
  const [minAmount, setMinAmount] = useState<string>('');
  const [maxAmount, setMaxAmount] = useState<string>('');
  const [minBalance, setMinBalance] = useState<string>('');
  const [maxBalance, setMaxBalance] = useState<string>('');
  const [showMoreFilters, setShowMoreFilters] = useState(false);

  // Loan filters
  const [loanSearchQuery, setLoanSearchQuery] = useState('');
  const [loanTypeFilter, setLoanTypeFilter] = useState<string[]>([]);
  const [loanStatusFilter, setLoanStatusFilter] = useState<string[]>([]);
  const [freeLotFilter, setFreeLotFilter] = useState<string>('all');
  const [minPrincipal, setMinPrincipal] = useState<string>('');
  const [maxPrincipal, setMaxPrincipal] = useState<string>('');
  const [minAvgRate, setMinAvgRate] = useState<string>('');
  const [maxAvgRate, setMaxAvgRate] = useState<string>('');
  const [minInterest, setMinInterest] = useState<string>('');
  const [maxInterest, setMaxInterest] = useState<string>('');
  const [minTotalAmount, setMinTotalAmount] = useState<string>('');
  const [maxTotalAmount, setMaxTotalAmount] = useState<string>('');
  const [showMoreLoanFilters, setShowMoreLoanFilters] = useState(false);

  // Ref for scrolling to loans section
  const loansSectionRef = useRef<HTMLDivElement>(null);

  // Handle type filter click from activity cards - filters loans table and scrolls to it
  const handleActivityTypeFilterClick = useCallback(
    (type: LoanType, status: string | string[]) => {
      // Set filters
      setLoanTypeFilter([type]);
      setLoanStatusFilter(Array.isArray(status) ? status : [status]);
      // Switch to table view
      setLoansViewMode('table');
      // Scroll to loans section after a brief delay to allow state updates
      setTimeout(() => {
        loansSectionRef.current?.scrollIntoView({
          behavior: 'smooth',
          block: 'start',
        });
      }, 100);
    },
    [setLoansViewMode],
  );

  // Handle view all click from activity cards - filters by status only (no type filter)
  const handleActivityViewAllClick = useCallback(
    (status: string | string[]) => {
      // Clear type filter and set status filter only
      setLoanTypeFilter([]);
      setLoanStatusFilter(Array.isArray(status) ? status : [status]);
      // Switch to table view
      setLoansViewMode('table');
      // Scroll to loans section after a brief delay to allow state updates
      setTimeout(() => {
        loansSectionRef.current?.scrollIntoView({
          behavior: 'smooth',
          block: 'start',
        });
      }, 100);
    },
    [setLoansViewMode],
  );

  // Fetch complete loan data with all investors
  const fetchLoansData = async () => {
    try {
      setLoansLoading(true);
      // Get unique loan IDs from investor's loan investors
      const loanIds = Array.from(
        new Set(investor.loanInvestors.map((li) => li.loan.id)),
      );

      // Fetch all loans data
      const response = await fetch('/api/loans');
      const allLoans: LoanWithInvestors[] = await response.json();

      // Filter to only loans that this investor is part of
      const investorLoans = allLoans.filter((loan) =>
        loanIds.includes(loan.id),
      );

      setLoans(investorLoans);
    } catch (error) {
      console.error('Error fetching loans:', error);
    } finally {
      setLoansLoading(false);
    }
  };

  useEffect(() => {
    fetchLoansData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [investor.id]);

  // Calculate unique loan count
  const uniqueLoanCount = Array.from(
    new Set(investor.loanInvestors.map((li) => li.loan.id)),
  ).length;

  // Calculate stats
  const totalCapital = calculateTotalPrincipal(investor.loanInvestors);
  const totalInterest = calculateTotalInterest(investor.loanInvestors);
  const avgRate = calculateAverageRate(investor.loanInvestors);
  const totalGains = totalCapital + totalInterest;

  // Calculate completed loans stats (only from loans with status 'Completed')
  const completedLoanInvestors = investor.loanInvestors.filter(
    (li) => li.loan.status === 'Completed',
  );
  const completedCapital = calculateTotalPrincipal(completedLoanInvestors);
  const completedInterest = calculateTotalInterest(completedLoanInvestors);
  const totalEarnings = completedCapital + completedInterest;
  const activeCapital = totalCapital - completedCapital;

  // Count active and completed loans
  const activeLoanIds = new Set(
    investor.loanInvestors
      .filter(
        (li) =>
          li.loan.status === 'Fully Funded' ||
          li.loan.status === 'Partially Funded',
      )
      .map((li) => li.loan.id),
  );
  const completedLoanIds = new Set(
    completedLoanInvestors.map((li) => li.loan.id),
  );
  const activeLoansCount = activeLoanIds.size;
  const completedLoansCount = completedLoanIds.size;

  // Helper function to extract depacto value from notes
  const extractDepactoFromNotes = (
    notes: string | null | undefined,
  ): number => {
    if (!notes) return 0;

    // Look for patterns like "100 sqm", "100sqm", "100.5 sqm", etc.
    const match = notes.match(/(\d+(?:\.\d+)?)\s*sqm/i);
    return match ? parseFloat(match[1]) : 0;
  };

  // Calculate total lot and total lot with depacto
  const totalLot = loans.reduce((sum, loan) => {
    return sum + (loan.freeLotSqm || 0);
  }, 0);

  const totalLotWithDepacto = loans.reduce((sum, loan) => {
    const lotValue = loan.freeLotSqm || 0;
    const depactoValue = extractDepactoFromNotes(loan.notes);
    return sum + lotValue + depactoValue;
  }, 0);

  const handleDelete = async () => {
    const response = await fetch(`/api/investors/${investor.id}`, {
      method: 'DELETE',
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to delete investor');
    }

    router.push('/investors');
    router.refresh();
  };

  const canDelete =
    investor.loanInvestors.length === 0 && investor.transactions.length === 0;

  // Clear transaction filters
  const clearTransactionFilters = () => {
    setTransactionSearchQuery('');
    setShowPastTransactions(false);
    setTransactionTypeFilter([]);
    setTransactionDirectionFilter([]);
    setMinAmount('');
    setMaxAmount('');
    setMinBalance('');
    setMaxBalance('');
  };

  // Clear loan filters
  const clearLoanFilters = () => {
    setLoanSearchQuery('');
    setLoanTypeFilter([]);
    setLoanStatusFilter([]);
    setFreeLotFilter('all');
    setMinPrincipal('');
    setMaxPrincipal('');
    setMinAvgRate('');
    setMaxAvgRate('');
    setMinInterest('');
    setMaxInterest('');
    setMinTotalAmount('');
    setMaxTotalAmount('');
  };

  // Check if there are active filters
  const hasActiveAmountFilters =
    minAmount !== '' ||
    maxAmount !== '' ||
    minBalance !== '' ||
    maxBalance !== '';

  const hasActiveTransactionFilters =
    transactionSearchQuery !== '' ||
    transactionTypeFilter.length > 0 ||
    transactionDirectionFilter.length > 0 ||
    showPastTransactions !== false ||
    hasActiveAmountFilters;

  const hasActiveLoanAmountFilters =
    minPrincipal !== '' ||
    maxPrincipal !== '' ||
    minAvgRate !== '' ||
    maxAvgRate !== '' ||
    minInterest !== '' ||
    maxInterest !== '' ||
    minTotalAmount !== '' ||
    maxTotalAmount !== '' ||
    freeLotFilter !== 'all';

  const hasActiveLoanFilters =
    loanSearchQuery !== '' ||
    loanTypeFilter.length > 0 ||
    loanStatusFilter.length > 0 ||
    hasActiveLoanAmountFilters;

  // Transform transactions to include investor data
  const transactionsWithInvestor = investor.transactions.map((transaction) => ({
    ...transaction,
    investor: {
      id: investor.id,
      name: investor.name,
      email: investor.email,
      contactNumber: investor.contactNumber,
      createdAt: investor.createdAt,
      updatedAt: investor.updatedAt,
    },
  }));

  // Filter transactions
  const filteredTransactions = transactionsWithInvestor.filter(
    (transaction) => {
      // Search filter
      if (transactionSearchQuery) {
        const query = transactionSearchQuery.toLowerCase();
        const matchesName = transaction.name.toLowerCase().includes(query);
        const matchesNotes = transaction.notes?.toLowerCase().includes(query);
        if (!matchesName && !matchesNotes) return false;
      }

      // Past transactions filter
      if (!showPastTransactions) {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const transactionDate = new Date(transaction.date);
        transactionDate.setHours(0, 0, 0, 0);

        // Hide past transactions (date < today)
        if (transactionDate < today) {
          return false;
        }
      }

      // Type filter (multi-select)
      if (
        transactionTypeFilter.length > 0 &&
        !transactionTypeFilter.includes(transaction.type)
      ) {
        return false;
      }

      // Direction filter (multi-select)
      if (
        transactionDirectionFilter.length > 0 &&
        !transactionDirectionFilter.includes(transaction.direction)
      ) {
        return false;
      }

      // Amount range filter
      const amount = parseFloat(transaction.amount);
      if (minAmount !== '' && amount < parseFloat(minAmount)) {
        return false;
      }
      if (maxAmount !== '' && amount > parseFloat(maxAmount)) {
        return false;
      }

      // Balance range filter
      const balance = parseFloat(transaction.balance);
      if (minBalance !== '' && balance < parseFloat(minBalance)) {
        return false;
      }
      if (maxBalance !== '' && balance > parseFloat(maxBalance)) {
        return false;
      }

      return true;
    },
  );

  // Filter loans
  const filteredLoans = loans.filter((loan) => {
    // Search filter
    if (loanSearchQuery) {
      const query = loanSearchQuery.toLowerCase();
      const matchesName = loan.loanName.toLowerCase().includes(query);
      const matchesNotes = loan.notes?.toLowerCase().includes(query);
      if (!matchesName && !matchesNotes) return false;
    }

    // Type filter (multi-select)
    if (loanTypeFilter.length > 0 && !loanTypeFilter.includes(loan.type)) {
      return false;
    }

    // Status filter (multi-select)
    if (
      loanStatusFilter.length > 0 &&
      !loanStatusFilter.includes(loan.status)
    ) {
      return false;
    }

    // Free lot filter
    if (freeLotFilter !== 'all') {
      if (freeLotFilter === 'with' && !loan.freeLotSqm) return false;
      if (freeLotFilter === 'without' && loan.freeLotSqm) return false;
    }

    // Calculate investor-specific amounts for filtering
    const investorLoanInvestors = loan.loanInvestors.filter(
      (li) => li.investor.id === investor.id,
    );
    const totalPrincipal = investorLoanInvestors.reduce(
      (sum, li) => sum + parseFloat(li.amount),
      0,
    );
    const totalInterest = calculateTotalInterest(investorLoanInvestors);
    const avgRate = calculateAverageRate(investorLoanInvestors);
    const totalAmount = totalPrincipal + totalInterest;

    // Principal range filter
    if (minPrincipal !== '' && totalPrincipal < parseFloat(minPrincipal)) {
      return false;
    }
    if (maxPrincipal !== '' && totalPrincipal > parseFloat(maxPrincipal)) {
      return false;
    }

    // Average rate range filter
    if (minAvgRate !== '' && avgRate < parseFloat(minAvgRate)) {
      return false;
    }
    if (maxAvgRate !== '' && avgRate > parseFloat(maxAvgRate)) {
      return false;
    }

    // Interest range filter
    if (minInterest !== '' && totalInterest < parseFloat(minInterest)) {
      return false;
    }
    if (maxInterest !== '' && totalInterest > parseFloat(maxInterest)) {
      return false;
    }

    // Total amount range filter
    if (minTotalAmount !== '' && totalAmount < parseFloat(minTotalAmount)) {
      return false;
    }
    if (maxTotalAmount !== '' && totalAmount > parseFloat(maxTotalAmount)) {
      return false;
    }

    return true;
  });

  // Calculate data for activity cards
  const now = new Date();
  const fourteenDaysFromNow = addDays(now, 14);

  // Completed loans (recently completed for this investor)
  const completedLoans = loans
    .filter((loan) => loan.status === 'Completed')
    .sort(
      (a, b) => new Date(b.dueDate).getTime() - new Date(a.dueDate).getTime(),
    );

  // Overdue loans (status overdue or past due date for this investor's loans)
  const overdueLoans = loans
    .filter(
      (loan) =>
        loan.status === 'Overdue' ||
        (loan.status !== 'Completed' && isPast(new Date(loan.dueDate))),
    )
    .sort(
      (a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime(),
    );

  // Pending disbursements (unpaid loan investor transactions for this investor)
  const unpaidLoanTransactions: Array<{
    id: number;
    loanId: number;
    loanName: string;
    loanType: LoanType;
    investorName: string;
    amount: string;
    sentDate: Date;
  }> = [];

  loans.forEach((loan) => {
    loan.loanInvestors
      .filter((li) => !li.isPaid && li.investor.id === investor.id)
      .forEach((li) => {
        unpaidLoanTransactions.push({
          id: li.id,
          loanId: loan.id,
          loanName: loan.loanName,
          loanType: loan.type,
          investorName: li.investor.name,
          amount: li.amount,
          sentDate: li.sentDate,
        });
      });
  });

  const pendingDisbursements = unpaidLoanTransactions.sort(
    (a, b) => new Date(a.sentDate).getTime() - new Date(b.sentDate).getTime(),
  );

  // Maturing loans (loans due within next 14 days for this investor)
  const maturingLoans = loans
    .filter((loan) => {
      const dueDate = new Date(loan.dueDate);
      return (
        (loan.status === 'Fully Funded' ||
          loan.status === 'Partially Funded') &&
        isAfter(dueDate, now) &&
        isBefore(dueDate, fourteenDaysFromNow)
      );
    })
    .sort(
      (a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime(),
    );

  if (isEditing) {
    return (
      <div className="max-w-2xl mx-auto space-y-6">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => router.push('/investors')}
          className="-ml-2 w-fit mb-4"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Investors
        </Button>
        <InvestorForm
          existingInvestor={investor}
          onSuccess={() => {
            setIsEditing(false);
            router.refresh();
          }}
          onCancel={() => setIsEditing(false)}
        />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <DetailHeader
        title={investor.name}
        description="Investor portfolio and activity"
        backLabel="Back to Investors"
        onBack={() => router.push('/investors')}
        onEdit={() => setIsEditing(true)}
        onDelete={handleDelete}
        deleteTitle="Delete Investor"
        deleteDescription={`Are you sure you want to delete ${investor.name}? This action cannot be undone.`}
        canDelete={canDelete}
        deleteWarning={`Cannot delete this investor because they have ${investor.loanInvestors.length} active loan(s) and ${investor.transactions.length} transaction(s). Please remove all loans and transactions first.`}
      />

      {/* Contact Info Card */}
      <Card>
        <CardContent className="space-y-4 p-6">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <div className="space-y-1">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <User className="h-3 w-3" />
                <span className="text-xs">Full Name</span>
              </div>
              <p className="font-medium">{investor.name}</p>
            </div>

            <div className="space-y-1">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Mail className="h-3 w-3" />
                <span className="text-xs">Email Address</span>
              </div>
              <p className="font-medium">{investor.email}</p>
            </div>

            <div className="space-y-1">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Phone className="h-3 w-3" />
                <span className="text-xs">Contact Number</span>
              </div>
              <p className="font-medium">{investor.contactNumber || '-'}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Summary Card - Compact horizontal layout */}
      <SummaryCard
        metrics={[
          {
            label: 'Total Capital',
            value: formatCurrency(totalCapital),
            subValue: `${uniqueLoanCount} loans`,
          },
          {
            label: 'Active',
            value: formatCurrency(activeCapital),
            subValue: `${activeLoansCount} loans`,
          },
          {
            label: 'Completed',
            value: formatCurrency(completedCapital),
            subValue: `${completedLoansCount} loans`,
          },
          {
            label: 'Interest Earned',
            value: formatCurrency(completedInterest),
            subValue: `of ${formatCurrency(totalInterest)}`,
          },
          {
            label: 'Total Earnings',
            value: formatCurrency(totalEarnings),
            subValue: 'Capital + Interest Earned',
            valueClassName: 'text-emerald-600 dark:text-emerald-500',
          },
          ...(totalLot > 0 || totalLotWithDepacto > 0
            ? [
                {
                  label: 'Total Lot',
                  value:
                    totalLotWithDepacto > totalLot
                      ? `${totalLot.toLocaleString()} + ${(totalLotWithDepacto - totalLot).toLocaleString()}`
                      : `${totalLot.toLocaleString()} sqm`,
                  subValue:
                    totalLotWithDepacto > totalLot
                      ? `= ${totalLotWithDepacto.toLocaleString()} sqm`
                      : undefined,
                },
              ]
            : []),
        ]}
      />

      {/* Activity Cards */}
      <div className="grid gap-4 lg:grid-cols-2 xl:grid-cols-4">
        <MaturingLoansCard
          loans={maturingLoans}
          loading={loansLoading}
          investorId={investor.id}
          onLoanClick={(loan) => {
            setSelectedLoan(loan);
            setShowLoanDetailModal(true);
          }}
          onTypeFilterClick={(type) =>
            handleActivityTypeFilterClick(type, [
              'Fully Funded',
              'Partially Funded',
            ])
          }
          onViewAllClick={() =>
            handleActivityViewAllClick(['Fully Funded', 'Partially Funded'])
          }
        />
        <PastDueLoansCard
          loans={overdueLoans}
          loading={loansLoading}
          investorId={investor.id}
          onLoanClick={(loan) => {
            setSelectedLoan(loan);
            setShowLoanDetailModal(true);
          }}
          onTypeFilterClick={(type) =>
            handleActivityTypeFilterClick(type, 'Overdue')
          }
          onViewAllClick={() => handleActivityViewAllClick('Overdue')}
        />
        <PendingDisbursementsCard
          disbursements={pendingDisbursements}
          loading={loansLoading}
          onDisbursementClick={async (loanId) => {
            // Find the loan in the already loaded loans array
            const loan = loans.find((l) => l.id === loanId);
            if (loan) {
              setSelectedLoan(loan);
              setShowLoanDetailModal(true);
            }
          }}
          onTypeFilterClick={(type) =>
            handleActivityTypeFilterClick(type, [
              'Fully Funded',
              'Partially Funded',
            ])
          }
          onViewAllClick={() =>
            handleActivityViewAllClick(['Fully Funded', 'Partially Funded'])
          }
        />
        <CompletedLoansCard
          loans={completedLoans}
          loading={loansLoading}
          investorId={investor.id}
          onLoanClick={(loan) => {
            setSelectedLoan(loan);
            setShowLoanDetailModal(true);
          }}
          onTypeFilterClick={(type) =>
            handleActivityTypeFilterClick(type, 'Completed')
          }
          onViewAllClick={() => handleActivityViewAllClick('Completed')}
        />
      </div>

      {/* Tabs */}
      <Tabs defaultValue="loans" className="w-full" ref={loansSectionRef}>
        <TabsList>
          <TabsTrigger value="loans">Loans ({uniqueLoanCount})</TabsTrigger>
          <TabsTrigger value="transactions">
            Transactions ({investor.transactions.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="loans" className="mt-6 space-y-4">
          {/* Search and Filters Section */}
          {!loansLoading && (
            <div className="flex flex-col gap-4">
              <div className="flex flex-col gap-3">
                {/* Search and Basic Filters Row */}
                <div className="flex flex-col sm:flex-row sm:flex-wrap gap-3">
                  {/* Search Input */}
                  <SearchFilter
                    value={loanSearchQuery}
                    onChange={setLoanSearchQuery}
                    placeholder="Search loans by name or notes..."
                  />

                  {/* Type Filter - Hidden on Mobile */}
                  <MultiSelectFilter
                    options={[
                      { value: 'Lot Title', label: 'Lot Title' },
                      { value: 'OR/CR', label: 'OR/CR' },
                      { value: 'Agent', label: 'Agent' },
                    ]}
                    selected={loanTypeFilter}
                    onChange={setLoanTypeFilter}
                    placeholder="Select Type"
                    allLabel="All Types"
                    triggerClassName="hidden xl:flex w-full xl:w-[180px]"
                  />

                  {/* Status Filter - Hidden on Mobile */}
                  <MultiSelectFilter
                    options={[
                      { value: 'Fully Funded', label: 'Fully Funded' },
                      { value: 'Partially Funded', label: 'Partially Funded' },
                      { value: 'Completed', label: 'Completed' },
                      { value: 'Overdue', label: 'Overdue' },
                    ]}
                    selected={loanStatusFilter}
                    onChange={setLoanStatusFilter}
                    placeholder="Select Status"
                    allLabel="All Status"
                    triggerClassName="hidden xl:flex w-full xl:w-[180px]"
                  />

                  {/* More Filters Button */}
                  <CollapsibleSection
                    inline
                    isOpen={showMoreLoanFilters}
                    onToggle={() =>
                      setShowMoreLoanFilters(!showMoreLoanFilters)
                    }
                    trigger={{
                      label: `${showMoreLoanFilters ? 'Less' : 'More'} Filters`,
                      icon: Filter,
                      showIndicator: hasActiveLoanAmountFilters,
                    }}
                  />

                  {/* Clear Filters Button */}
                  {hasActiveLoanFilters && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={clearLoanFilters}
                      className="whitespace-nowrap"
                    >
                      <X className="h-4 w-4 xl:mr-2" />
                      <span className="hidden xl:inline">Clear All</span>
                    </Button>
                  )}

                  <ExportButton
                    data={loans}
                    filteredData={filteredLoans}
                    columns={loansCSVColumns}
                    filename={`loans_${investor.name.replace(/\s+/g, '_')}`}
                    variant="outline"
                    size="sm"
                  />

                  <Button
                    size="sm"
                    onClick={() => setShowLoanModal(true)}
                    className="h-9 px-3"
                  >
                    <Plus className="h-3 w-3 xl:mr-1" />
                    <span className="hidden xl:inline">Add Loan</span>
                  </Button>
                </div>

                {/* Amount Range Filters - Collapsible Content */}
                <CollapsibleContent isOpen={showMoreLoanFilters}>
                  <div className="space-y-3">
                    {/* Basic Filters - visible on smaller screens */}
                    <div className="grid grid-cols-2 gap-3 pb-3 border-b xl:hidden">
                      {/* Type Filter - Mobile */}
                      <div>
                        <label className="text-xs font-semibold mb-2 block">
                          Type
                        </label>
                        <MultiSelectFilter
                          options={[
                            { value: 'Lot Title', label: 'Lot Title' },
                            { value: 'OR/CR', label: 'OR/CR' },
                            { value: 'Agent', label: 'Agent' },
                          ]}
                          selected={loanTypeFilter}
                          onChange={setLoanTypeFilter}
                          placeholder="Select Type"
                          allLabel="All Types"
                          triggerClassName="w-full"
                        />
                      </div>

                      {/* Status Filter - Mobile */}
                      <div>
                        <label className="text-xs font-semibold mb-2 block">
                          Status
                        </label>
                        <MultiSelectFilter
                          options={[
                            { value: 'Fully Funded', label: 'Fully Funded' },
                            {
                              value: 'Partially Funded',
                              label: 'Partially Funded',
                            },
                            { value: 'Completed', label: 'Completed' },
                            { value: 'Overdue', label: 'Overdue' },
                          ]}
                          selected={loanStatusFilter}
                          onChange={setLoanStatusFilter}
                          placeholder="Select Status"
                          allLabel="All Status"
                          triggerClassName="w-full"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                      {/* Total Principal Range */}
                      <RangeFilter
                        label="Total Principal"
                        icon={DollarSign}
                        minValue={minPrincipal}
                        maxValue={maxPrincipal}
                        onMinChange={setMinPrincipal}
                        onMaxChange={setMaxPrincipal}
                        minPlaceholder="Min (₱)"
                        maxPlaceholder="Max (₱)"
                      />

                      {/* Average Rate Range */}
                      <RangeFilter
                        label="Avg. Rate"
                        icon={TrendingUp}
                        minValue={minAvgRate}
                        maxValue={maxAvgRate}
                        onMinChange={setMinAvgRate}
                        onMaxChange={setMaxAvgRate}
                        minPlaceholder="Min (%)"
                        maxPlaceholder="Max (%)"
                      />

                      {/* Total Interest Range */}
                      <RangeFilter
                        label="Total Interest"
                        icon={TrendingUp}
                        minValue={minInterest}
                        maxValue={maxInterest}
                        onMinChange={setMinInterest}
                        onMaxChange={setMaxInterest}
                        minPlaceholder="Min (₱)"
                        maxPlaceholder="Max (₱)"
                      />

                      {/* Total Amount Range */}
                      <RangeFilter
                        label="Total Amount"
                        icon={DollarSign}
                        minValue={minTotalAmount}
                        maxValue={maxTotalAmount}
                        onMinChange={setMinTotalAmount}
                        onMaxChange={setMaxTotalAmount}
                        minPlaceholder="Min (₱)"
                        maxPlaceholder="Max (₱)"
                      />
                    </div>

                    {/* Free Lot Filter */}
                    <div className="pt-3 border-t">
                      <div className="w-full sm:w-[240px]">
                        <label className="text-xs font-semibold flex items-center gap-1 mb-2">
                          <MapPin className="h-3.5 w-3.5" />
                          Free Lot
                        </label>
                        <Select
                          value={freeLotFilter}
                          onValueChange={setFreeLotFilter}
                        >
                          <SelectTrigger className="w-full h-9">
                            <SelectValue placeholder="All Lots" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="all">All Lots</SelectItem>
                            <SelectItem value="with">With Free Lot</SelectItem>
                            <SelectItem value="without">
                              Without Free Lot
                            </SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </div>
                </CollapsibleContent>
              </div>

              {/* Results Count */}
              {hasActiveLoanFilters && (
                <div className="text-sm text-muted-foreground">
                  Showing {filteredLoans.length} of {loans.length} loans
                </div>
              )}
            </div>
          )}

          {/* Loans List */}
          {loansLoading || !isViewModeReady ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12 gap-4">
                <InlineLoader size="md" />
              </CardContent>
            </Card>
          ) : loans.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <p className="text-muted-foreground">No loans yet</p>
              </CardContent>
            </Card>
          ) : filteredLoans.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <p className="text-muted-foreground mb-4">
                  No loans match your filters
                </p>
                <Button variant="outline" onClick={clearLoanFilters}>
                  <X className="mr-2 h-4 w-4" />
                  Clear filters
                </Button>
              </CardContent>
            </Card>
          ) : (
            <>
              {loansViewMode === 'cards' && (
                <CardPagination
                  items={filteredLoans}
                  itemsPerPage={10}
                  itemName="loans"
                  scrollToTop={false}
                  renderItems={(paginatedLoans) => (
                    <div className="grid gap-4 sm:gap-6 grid-cols-1 lg:grid-cols-2 2xl:grid-cols-3">
                      {paginatedLoans.map((loan) => {
                        // Filter to only this investor's entries
                        const investorLoanInvestors = loan.loanInvestors.filter(
                          (li) => li.investor.id === investor.id,
                        );
                        const investorPrincipal = investorLoanInvestors.reduce(
                          (sum, li) => sum + parseFloat(li.amount),
                          0,
                        );
                        const investorInterest = calculateTotalInterest(
                          investorLoanInvestors,
                        );
                        const investorRate = calculateAverageRate(
                          investorLoanInvestors,
                        );
                        const investorTotal =
                          investorPrincipal + investorInterest;

                        return (
                          <Card
                            key={loan.id}
                            className="hover:shadow-lg transition-shadow h-full cursor-pointer"
                            onClick={() => {
                              setSelectedLoan(loan);
                              setShowLoanDetailModal(true);
                            }}
                          >
                            <CardHeader className="pb-1">
                              <div className="flex items-start justify-between gap-2">
                                <div className="space-y-1 flex-1 min-w-0">
                                  <CardTitle className="text-sm sm:text-base truncate">
                                    {loan.loanName}
                                  </CardTitle>
                                </div>
                                <Badge
                                  variant={getLoanTypeBadge(loan.type).variant}
                                  className={`text-[10px] ${
                                    getLoanTypeBadge(loan.type).className || ''
                                  }`}
                                >
                                  {loan.type}
                                </Badge>
                                <Badge
                                  variant={
                                    getLoanStatusBadge(loan.status).variant
                                  }
                                  className={`text-[10px] ${
                                    getLoanStatusBadge(loan.status).className ||
                                    ''
                                  }`}
                                >
                                  {loan.status}
                                </Badge>
                              </div>
                            </CardHeader>
                            <CardContent className="space-y-3 px-4">
                              {/* Summary Section */}
                              <div className="grid grid-cols-2 gap-2">
                                <div className="p-2 bg-muted/50 rounded-lg">
                                  <p className="text-[10px] text-muted-foreground mb-1">
                                    Inv. Principal
                                  </p>
                                  <p className="text-sm font-medium break-words">
                                    {formatCurrency(
                                      investorPrincipal.toString(),
                                    )}
                                  </p>
                                </div>
                                <div className="p-2 bg-muted/50 rounded-lg">
                                  <p className="text-[10px] text-muted-foreground mb-1">
                                    Inv. Rate
                                  </p>
                                  <p className="text-sm font-medium">
                                    {investorRate.toFixed(2)}%
                                  </p>
                                </div>
                                <div className="p-2 bg-muted/50 rounded-lg">
                                  <p className="text-[10px] text-muted-foreground mb-1">
                                    Inv. Interest
                                  </p>
                                  <p className="text-sm font-medium break-words">
                                    {formatCurrency(
                                      investorInterest.toString(),
                                    )}
                                  </p>
                                </div>
                                <div className="p-2 bg-muted/50 rounded-lg">
                                  <p className="text-[10px] text-muted-foreground mb-1">
                                    Inv. Total
                                  </p>
                                  <p className="text-sm font-medium break-words">
                                    {formatCurrency(investorTotal.toString())}
                                  </p>
                                </div>
                              </div>

                              {/* Investors Count */}
                              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                <Users className="h-4 w-4" />
                                <span>
                                  {loan.loanInvestors.length} investor
                                  {loan.loanInvestors.length !== 1 ? 's' : ''}
                                </span>
                              </div>
                            </CardContent>
                          </Card>
                        );
                      })}
                    </div>
                  )}
                />
              )}

              {loansViewMode === 'table' && (
                <LoansTable
                  loans={filteredLoans}
                  itemsPerPage={10}
                  expandedRows={expandedLoans}
                  hideFields={['sentDates', 'dueDate', 'freeLotSqm']}
                  investorId={investor.id}
                  onToggleExpand={(loanId) => {
                    setExpandedLoans((prev) => {
                      const newSet = new Set(prev);
                      if (newSet.has(loanId as number)) {
                        newSet.delete(loanId as number);
                      } else {
                        newSet.add(loanId as number);
                      }
                      return newSet;
                    });
                  }}
                  onQuickView={(loan) => {
                    setSelectedLoan(loan);
                    setShowLoanDetailModal(true);
                  }}
                />
              )}
            </>
          )}
        </TabsContent>

        <TabsContent value="transactions" className="mt-6 space-y-4">
          {/* Search and Filters Section */}
          {investor.transactions.length > 0 && (
            <div className="flex flex-col gap-4">
              <div className="flex flex-col gap-3">
                {/* Search and Basic Filters Row */}
                <div className="flex flex-col sm:flex-row sm:flex-wrap gap-3">
                  {/* Search Input */}
                  <SearchFilter
                    value={transactionSearchQuery}
                    onChange={setTransactionSearchQuery}
                    placeholder="Search transactions by name or notes..."
                  />

                  {/* Show/Hide Past Transactions Filter - Hidden on Mobile */}
                  <Select
                    value={showPastTransactions ? 'show' : 'hide'}
                    onValueChange={(value) =>
                      setShowPastTransactions(value === 'show')
                    }
                  >
                    <SelectTrigger className="hidden xl:flex w-full xl:w-[200px]">
                      <SelectValue placeholder="Past Transactions" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="hide">Hide Past</SelectItem>
                      <SelectItem value="show">Show Past</SelectItem>
                    </SelectContent>
                  </Select>

                  {/* Type Filter - Hidden on Mobile */}
                  <MultiSelectFilter
                    options={[
                      { value: 'Investment', label: 'Investment' },
                      { value: 'Loan', label: 'Loan' },
                    ]}
                    selected={transactionTypeFilter}
                    onChange={setTransactionTypeFilter}
                    placeholder="Select Type"
                    allLabel="All Types"
                    triggerClassName="hidden xl:flex w-full xl:w-[180px]"
                  />

                  {/* Direction Filter - Hidden on Mobile */}
                  <MultiSelectFilter
                    options={[
                      { value: 'In', label: 'In' },
                      { value: 'Out', label: 'Out' },
                    ]}
                    selected={transactionDirectionFilter}
                    onChange={setTransactionDirectionFilter}
                    placeholder="Select Direction"
                    allLabel="All Directions"
                    triggerClassName="hidden xl:flex w-full xl:w-[180px]"
                  />

                  {/* More Filters Button */}
                  <CollapsibleSection
                    inline
                    isOpen={showMoreFilters}
                    onToggle={() => setShowMoreFilters(!showMoreFilters)}
                    trigger={{
                      label: `${showMoreFilters ? 'Less' : 'More'} Filters`,
                      icon: Filter,
                      showIndicator: hasActiveAmountFilters,
                    }}
                  />

                  {/* Clear Filters Button */}
                  {hasActiveTransactionFilters && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={clearTransactionFilters}
                      className="whitespace-nowrap"
                    >
                      <X className="h-4 w-4 xl:mr-2" />
                      <span className="hidden xl:inline">Clear All</span>
                    </Button>
                  )}

                  <ExportButton
                    data={transactionsWithInvestor}
                    filteredData={filteredTransactions}
                    columns={transactionsCSVColumns}
                    filename={`transactions_${investor.name.replace(/\s+/g, '_')}`}
                    variant="outline"
                    size="sm"
                  />

                  <Button
                    size="sm"
                    onClick={() => setShowTransactionModal(true)}
                    className="h-9 px-3"
                  >
                    <Plus className="h-3 w-3 xl:mr-1" />
                    <span className="hidden xl:inline">Add Transaction</span>
                  </Button>
                </div>

                {/* Amount Range Filters - Collapsible Content */}
                <CollapsibleContent isOpen={showMoreFilters}>
                  <div className="space-y-3">
                    {/* Basic Filters - visible on smaller screens */}
                    <div className="grid grid-cols-2 gap-3 pb-3 border-b xl:hidden">
                      {/* Past Transactions Filter - Mobile */}
                      <div>
                        <label className="text-xs font-semibold mb-2 block">
                          Past Transactions
                        </label>
                        <Select
                          value={showPastTransactions ? 'show' : 'hide'}
                          onValueChange={(value) =>
                            setShowPastTransactions(value === 'show')
                          }
                        >
                          <SelectTrigger className="w-full">
                            <SelectValue placeholder="Past Transactions" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="hide">Hide Past</SelectItem>
                            <SelectItem value="show">Show Past</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      {/* Type Filter - Mobile */}
                      <div>
                        <label className="text-xs font-semibold mb-2 block">
                          Type
                        </label>
                        <MultiSelectFilter
                          options={[
                            { value: 'Investment', label: 'Investment' },
                            { value: 'Loan', label: 'Loan' },
                          ]}
                          selected={transactionTypeFilter}
                          onChange={setTransactionTypeFilter}
                          placeholder="Select Type"
                          allLabel="All Types"
                          triggerClassName="w-full"
                        />
                      </div>

                      {/* Direction Filter - Mobile */}
                      <div className="col-span-2">
                        <label className="text-xs font-semibold mb-2 block">
                          Direction
                        </label>
                        <MultiSelectFilter
                          options={[
                            { value: 'In', label: 'In' },
                            { value: 'Out', label: 'Out' },
                          ]}
                          selected={transactionDirectionFilter}
                          onChange={setTransactionDirectionFilter}
                          placeholder="Select Direction"
                          allLabel="All Directions"
                          triggerClassName="w-full"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {/* Amount Range */}
                      <RangeFilter
                        label="Amount"
                        icon={DollarSign}
                        minValue={minAmount}
                        maxValue={maxAmount}
                        onMinChange={setMinAmount}
                        onMaxChange={setMaxAmount}
                        minPlaceholder="Min (₱)"
                        maxPlaceholder="Max (₱)"
                      />

                      {/* Balance Range */}
                      <RangeFilter
                        label="Balance"
                        icon={TrendingUp}
                        minValue={minBalance}
                        maxValue={maxBalance}
                        onMinChange={setMinBalance}
                        onMaxChange={setMaxBalance}
                        minPlaceholder="Min (₱)"
                        maxPlaceholder="Max (₱)"
                      />
                    </div>
                  </div>
                </CollapsibleContent>
              </div>

              {/* Results Count */}
              {hasActiveTransactionFilters && (
                <div className="text-sm text-muted-foreground">
                  Showing {filteredTransactions.length} of{' '}
                  {investor.transactions.length} transactions
                </div>
              )}
            </div>
          )}

          {/* Transactions Table */}
          {!isViewModeReady ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12 gap-4">
                <InlineLoader size="md" />
              </CardContent>
            </Card>
          ) : investor.transactions.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <p className="text-muted-foreground">No transactions yet</p>
              </CardContent>
            </Card>
          ) : filteredTransactions.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <p className="text-muted-foreground mb-4">
                  No transactions match your filters
                </p>
                <Button variant="outline" onClick={clearTransactionFilters}>
                  <X className="mr-2 h-4 w-4" />
                  Clear filters
                </Button>
              </CardContent>
            </Card>
          ) : (
            <>
              {transactionsViewMode === 'cards' && (
                <CardPagination
                  items={filteredTransactions}
                  itemsPerPage={10}
                  itemName="transactions"
                  scrollToTop={false}
                  renderItems={(paginatedTransactions) => (
                    <div className="grid gap-4 sm:gap-6 grid-cols-1 lg:grid-cols-2 2xl:grid-cols-3">
                      {paginatedTransactions.map((transaction) => (
                        <TransactionCard
                          key={transaction.id}
                          transaction={transaction}
                          onQuickView={(transaction) => {
                            setSelectedTransaction(transaction);
                            setShowTransactionDetailModal(true);
                          }}
                          viewHref={`/transactions/${transaction.id}`}
                        />
                      ))}
                    </div>
                  )}
                />
              )}

              {transactionsViewMode === 'table' && (
                <TransactionsTable
                  transactions={filteredTransactions}
                  itemsPerPage={10}
                  onQuickView={(transaction) => {
                    setSelectedTransaction(transaction);
                    setShowTransactionDetailModal(true);
                  }}
                />
              )}
            </>
          )}
        </TabsContent>
      </Tabs>

      {/* Transaction Create Modal */}
      <TransactionCreateModal
        open={showTransactionModal}
        onOpenChange={setShowTransactionModal}
        preselectedInvestorId={investor.id}
        onSuccess={() => {
          router.refresh();
        }}
      />

      {/* Loan Create Modal */}
      <LoanCreateModal
        open={showLoanModal}
        onOpenChange={setShowLoanModal}
        preselectedInvestorId={investor.id}
        onSuccess={() => {
          fetchLoansData();
          router.refresh();
        }}
      />

      {/* Transaction Detail Modal */}
      <TransactionDetailModal
        transaction={selectedTransaction}
        open={showTransactionDetailModal}
        onOpenChange={setShowTransactionDetailModal}
        onUpdate={() => {
          router.refresh();
        }}
      />

      {/* Loan Detail Modal */}
      <LoanDetailModal
        loan={selectedLoan}
        open={showLoanDetailModal}
        onOpenChange={setShowLoanDetailModal}
        onUpdate={() => {
          fetchLoansData();
          router.refresh();
        }}
      />
    </div>
  );
}

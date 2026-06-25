'use client';

import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
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
import {
  formatCurrency,
  formatDate,
  formatText,
  formatPercentage,
} from '@/lib/format';
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
  InvestorLoansFiltersSkeleton,
  LoansTableSkeleton,
  TransactionsTableSkeleton,
  CompletedLoansCard,
  PastDueLoansCard,
  PendingDisbursementsCard,
  MaturingLoansCard,
  ActivityCardSlot,
  CardPagination,
  ExportButton,
} from '@/components/common';
import {
  TransactionsTable,
  TransactionCreateModal,
  TransactionDetailModal,
  TransactionCard,
} from '@/components/transactions';
import {
  DebtsTable,
  DebtCard,
  DebtCreateModal,
  DebtDetailModal,
} from '@/components/debts';
import { LoanCreateModal, LoanDetailModal } from '@/components/loans';
import { useLoanDuplicateStore } from '@/stores/loan-duplicate-store';
import type { DebtWithInvestor, TransactionWithInvestor } from '@/lib/types';
import { computeTotalLot, buildTotalLotMetric } from '@/lib/lot-utils';
import { calculateInvestorDebtStats, isFullyPaidDebt } from '@/lib/debt-calculations';
import { INVESTOR_DETAIL_SUMMARY_GRID } from '@/lib/summary-grid';
import { SHOW_TRANSACTIONS_UI } from '@/lib/feature-flags';
import { addDays, isAfter, isBefore, isPast } from 'date-fns';
import { loanPDFSections, transactionPDFSections } from '@/lib/pdf-sections';
import { renderLoansPDF } from '@/components/pdf/loans-pdf-document';
import { renderTransactionsPDF } from '@/components/pdf/transactions-pdf-document';
import { cn } from '@/lib/utils';

const LOAN_TYPE_FILTER_OPTIONS = [
  { value: 'Lot Title', label: 'Lot Title' },
  { value: 'OR/CR', label: 'OR/CR' },
  { value: 'Agent', label: 'Agent' },
];

const LOAN_STATUS_FILTER_OPTIONS = [
  { value: 'Fully Funded', label: 'Fully Funded' },
  { value: 'Partially Funded', label: 'Partially Funded' },
  { value: 'Completed', label: 'Completed' },
  { value: 'Overdue', label: 'Overdue' },
];

interface InvestorDetailClientProps {
  investor: InvestorWithLoans;
}

export function InvestorDetailClient({ investor }: InvestorDetailClientProps) {
  const router = useRouter();
  const [isEditing, setIsEditing] = useState(false);
  const [loans, setLoans] = useState<LoanWithInvestors[]>([]);
  const [loansLoading, setLoansLoading] = useState(true);
  const [showTransactionModal, setShowTransactionModal] = useState(false);
  const [showDebtModal, setShowDebtModal] = useState(false);
  const [showLoanModal, setShowLoanModal] = useState(false);
  const [selectedTransaction, setSelectedTransaction] =
    useState<TransactionWithInvestor | null>(null);
  const [showTransactionDetailModal, setShowTransactionDetailModal] =
    useState(false);
  const [selectedDebt, setSelectedDebt] = useState<DebtWithInvestor | null>(
    null,
  );
  const [showDebtDetailModal, setShowDebtDetailModal] = useState(false);
  const [selectedLoan, setSelectedLoan] = useState<LoanWithInvestors | null>(
    null,
  );
  const [showLoanDetailModal, setShowLoanDetailModal] = useState(false);

  // Create modal can open from "Add loan" button (showLoanModal) or "Duplicate" in loan detail (store)
  const isCreateModalOpenFromStore = useLoanDuplicateStore(
    (state) => state.isCreateModalOpen,
  );
  const closeCreateModal = useLoanDuplicateStore(
    (state) => state.closeCreateModal,
  );

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

  const {
    viewMode: debtsViewMode,
    setViewMode: setDebtsViewMode,
    isReady: isDebtsViewModeReady,
  } = useResponsiveViewMode<'cards' | 'table'>();

  // Combined ready state for view modes
  const isViewModeReady =
    isLoansViewModeReady &&
    isTransactionsViewModeReady &&
    isDebtsViewModeReady;

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

  // Debt filters
  const [debtSearchQuery, setDebtSearchQuery] = useState('');
  const [showPastDebts, setShowPastDebts] = useState(false);
  const [debtIntervalFilter, setDebtIntervalFilter] = useState<string[]>([]);
  const [minDebtAmount, setMinDebtAmount] = useState<string>('');
  const [maxDebtAmount, setMaxDebtAmount] = useState<string>('');
  const [showMoreDebtFilters, setShowMoreDebtFilters] = useState(false);

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

  const [overviewTypeFilter, setOverviewTypeFilter] = useState<string[]>([]);
  const [overviewStatusFilter, setOverviewStatusFilter] = useState<string[]>(
    [],
  );

  const [pageTab, setPageTab] = useState<'overview' | 'loans' | 'debts'>(
    'overview',
  );

  // Ref for scrolling to loans section
  const loansSectionRef = useRef<HTMLDivElement>(null);

  // Handle type filter click from activity cards - filters loans table and scrolls to it
  const handleActivityTypeFilterClick = useCallback(
    (type: LoanType, status: string | string[]) => {
      setLoanTypeFilter([type]);
      setLoanStatusFilter(Array.isArray(status) ? status : [status]);
      setLoansViewMode('table');
      setPageTab('loans');
      setTimeout(() => {
        loansSectionRef.current?.scrollIntoView({
          behavior: 'smooth',
          block: 'start',
        });
      }, 100);
    },
    [setLoansViewMode],
  );

  const handleActivityViewAllClick = useCallback(
    (status: string | string[]) => {
      setLoanTypeFilter([]);
      setLoanStatusFilter(Array.isArray(status) ? status : [status]);
      setLoansViewMode('table');
      setPageTab('loans');
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

  // Lot totals from investor's loans (available on first paint — do not wait for /api/loans)
  const uniqueInvestorLoans = useMemo(() => {
    const byId = new Map<number, (typeof investor.loanInvestors)[0]['loan']>();
    for (const li of investor.loanInvestors) {
      if (!byId.has(li.loan.id)) {
        byId.set(li.loan.id, li.loan);
      }
    }
    return Array.from(byId.values());
  }, [investor.loanInvestors]);

  const debtStats = useMemo(
    () => calculateInvestorDebtStats(investor.debts ?? []),
    [investor.debts],
  );

  const overviewStats = useMemo(() => {
    const filteredLoanInvestors = investor.loanInvestors.filter((li) => {
      if (
        overviewTypeFilter.length > 0 &&
        !overviewTypeFilter.includes(li.loan.type)
      ) {
        return false;
      }
      if (
        overviewStatusFilter.length > 0 &&
        !overviewStatusFilter.includes(li.loan.status)
      ) {
        return false;
      }
      return true;
    });

    const filteredLoanIds = new Set(
      filteredLoanInvestors.map((li) => li.loan.id),
    );
    const filteredLoanCount = filteredLoanIds.size;

    const totalCapital = calculateTotalPrincipal(filteredLoanInvestors);

    const completedLoanInvestors = filteredLoanInvestors.filter(
      (li) => li.loan.status === 'Completed',
    );
    const completedCapital = calculateTotalPrincipal(completedLoanInvestors);
    const completedLoanInterest = calculateTotalInterest(completedLoanInvestors);
    const loanEarnings = completedCapital + completedLoanInterest;
    const activeCapital = totalCapital - completedCapital;

    const activeLoanIds = new Set(
      filteredLoanInvestors
        .filter((li) => li.loan.status !== 'Completed')
        .map((li) => li.loan.id),
    );
    const completedLoanIds = new Set(
      completedLoanInvestors.map((li) => li.loan.id),
    );

    const filteredUniqueLoans = uniqueInvestorLoans.filter((loan) =>
      filteredLoanIds.has(loan.id),
    );
    const { totalLot, totalLotWithDepacto } =
      computeTotalLot(filteredUniqueLoans);

    const netInterestEarned =
      completedLoanInterest - debtStats.totalExpectedInterest;
    const netTotalEarnings = loanEarnings - debtStats.totalRepayment;

    return {
      totalCapital,
      activeCapital,
      completedCapital,
      loanCount: filteredLoanCount,
      activeLoansCount: activeLoanIds.size,
      completedLoansCount: completedLoanIds.size,
      completedLoanInterest,
      loanEarnings,
      netInterestEarned,
      netTotalEarnings,
      totalLot,
      totalLotWithDepacto,
    };
  }, [
    investor.loanInvestors,
    overviewTypeFilter,
    overviewStatusFilter,
    uniqueInvestorLoans,
    debtStats.totalExpectedInterest,
    debtStats.totalRepayment,
  ]);

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
    investor.loanInvestors.length === 0 &&
    investor.transactions.length === 0 &&
    (investor.debts?.length ?? 0) === 0;

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

  const clearDebtFilters = () => {
    setDebtSearchQuery('');
    setShowPastDebts(false);
    setDebtIntervalFilter([]);
    setMinDebtAmount('');
    setMaxDebtAmount('');
  };

  // Clear loan filters
  const clearOverviewFilters = () => {
    setOverviewTypeFilter([]);
    setOverviewStatusFilter([]);
  };

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

  const hasActiveDebtAmountFilters =
    minDebtAmount !== '' || maxDebtAmount !== '';

  const hasActiveDebtFilters =
    debtSearchQuery !== '' ||
    showPastDebts ||
    debtIntervalFilter.length > 0 ||
    hasActiveDebtAmountFilters;

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

  const hasActiveOverviewFilters =
    overviewTypeFilter.length > 0 || overviewStatusFilter.length > 0;

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

  const investorDebts = investor.debts ?? [];

  const debtsWithInvestor: DebtWithInvestor[] = investorDebts.map((debt) => ({
    ...debt,
    additionalFees: debt.additionalFees ?? [],
    investor: {
      id: investor.id,
      name: investor.name,
      email: investor.email,
      contactNumber: investor.contactNumber,
      createdAt: investor.createdAt,
      updatedAt: investor.updatedAt,
    },
  }));

  const filteredDebts = debtsWithInvestor.filter((debt) => {
    if (debtSearchQuery) {
      const query = debtSearchQuery.toLowerCase();
      const matchesName = debt.name.toLowerCase().includes(query);
      const matchesNotes = debt.notes?.toLowerCase().includes(query);
      if (!matchesName && !matchesNotes) return false;
    }

    if (!showPastDebts && isFullyPaidDebt(debt)) {
      return false;
    }

    if (
      debtIntervalFilter.length > 0 &&
      !debtIntervalFilter.includes(debt.interestInterval)
    ) {
      return false;
    }

    const amount = parseFloat(debt.amount);
    if (minDebtAmount !== '' && amount < parseFloat(minDebtAmount)) return false;
    if (maxDebtAmount !== '' && amount > parseFloat(maxDebtAmount)) return false;

    return true;
  });

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

  const hasAnyActivityCard =
    loansLoading ||
    maturingLoans.length > 0 ||
    overdueLoans.length > 0 ||
    pendingDisbursements.length > 0 ||
    completedLoans.length > 0;

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
        deleteWarning={`Cannot delete this investor because they have ${investor.loanInvestors.length} active loan(s), ${investor.transactions.length} transaction(s), and ${investorDebts.length} borrowing(s). Please remove all loans, transactions, and borrowings first.`}
      />

      <Tabs
        value={pageTab}
        onValueChange={(value) =>
          setPageTab(value as 'overview' | 'loans' | 'debts')
        }
        className="w-full"
      >
        <TabsList
          className={cn(
            'grid w-full max-w-lg',
            SHOW_TRANSACTIONS_UI ? 'grid-cols-4' : 'grid-cols-3',
          )}
        >
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="loans">Loans ({uniqueLoanCount})</TabsTrigger>
          <TabsTrigger value="debts">Borrowings ({investorDebts.length})</TabsTrigger>
          {SHOW_TRANSACTIONS_UI && (
            <TabsTrigger value="transactions">
              Transactions ({investor.transactions.length})
            </TabsTrigger>
          )}
        </TabsList>

        <TabsContent value="overview" className="mt-6 space-y-6">
          {/* Contact Info Card */}
          <Card>
            <CardContent className="space-y-4 p-6">
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                <div className="space-y-1">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <User className="h-3 w-3" />
                    <span className="text-xs">Full Name</span>
                  </div>
                  <p className="font-medium">{formatText(investor.name)}</p>
                </div>

                <div className="space-y-1">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Mail className="h-3 w-3" />
                    <span className="text-xs">Email Address</span>
                  </div>
                  <p className="font-medium">{formatText(investor.email)}</p>
                </div>

                <div className="space-y-1">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Phone className="h-3 w-3" />
                    <span className="text-xs">Contact Number</span>
                  </div>
                  <p className="font-medium">
                    {investor.contactNumber
                      ? formatText(investor.contactNumber)
                      : '-'}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="flex flex-col gap-3">
            <div className="flex flex-col sm:flex-row sm:flex-wrap gap-3">
              <MultiSelectFilter
                options={LOAN_TYPE_FILTER_OPTIONS}
                selected={overviewTypeFilter}
                onChange={setOverviewTypeFilter}
                placeholder="Type"
                allLabel="All Types"
                triggerClassName="w-full sm:w-[180px]"
              />
              <MultiSelectFilter
                options={LOAN_STATUS_FILTER_OPTIONS}
                selected={overviewStatusFilter}
                onChange={setOverviewStatusFilter}
                placeholder="Status"
                allLabel="All Status"
                triggerClassName="w-full sm:w-[180px]"
              />
              {hasActiveOverviewFilters && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={clearOverviewFilters}
                  className="whitespace-nowrap h-9"
                >
                  <X className="h-4 w-4 sm:mr-2" />
                  <span className="hidden sm:inline">Clear Filters</span>
                </Button>
              )}
            </div>
            {hasActiveOverviewFilters && (
              <p className="text-sm text-muted-foreground">
                Summary reflects filtered loans
              </p>
            )}
          </div>

          <SummaryCard
            className={INVESTOR_DETAIL_SUMMARY_GRID}
            metrics={[
              {
                label: 'Total Capital',
                amount: overviewStats.totalCapital,
                subCount: overviewStats.loanCount,
                subCountSuffix: ' loans',
              },
              {
                label: 'Active',
                amount: overviewStats.activeCapital,
                subCount: overviewStats.activeLoansCount,
                subCountSuffix: ' loans',
              },
              {
                label: 'Completed',
                amount: overviewStats.completedCapital,
                subCount: overviewStats.completedLoansCount,
                subCountSuffix: ' loans',
              },
              {
                label: 'Total Borrowings',
                amount: debtStats.totalPrincipal,
                subCount: debtStats.totalCount,
                subCountSuffix: ' borrowings',
              },
              {
                label: 'Active Borrowings',
                amount: debtStats.activePrincipal,
                subCount: debtStats.activeCount,
                subCountSuffix: ' borrowings',
              },
              {
                label: 'Repaid Borrowings',
                amount: debtStats.completedPrincipal,
                subCount: debtStats.completedCount,
                subCountSuffix: ' borrowings',
              },
              {
                label: 'Interest Earned',
                amount: overviewStats.netInterestEarned,
                subValue: `Loans +${formatCurrency(overviewStats.completedLoanInterest)} · Borrowings -${formatCurrency(debtStats.totalExpectedInterest)}`,
                valueClassName:
                  overviewStats.netInterestEarned >= 0
                    ? 'text-emerald-600 dark:text-emerald-500'
                    : 'text-red-600 dark:text-red-500',
              },
              {
                label: 'Total Earnings',
                amount: overviewStats.netTotalEarnings,
                subValue: `Loans +${formatCurrency(overviewStats.loanEarnings)} · Borrowings -${formatCurrency(debtStats.totalRepayment)}`,
                valueClassName:
                  overviewStats.netTotalEarnings >= 0
                    ? undefined
                    : 'text-red-600 dark:text-red-500',
              },
              buildTotalLotMetric(
                overviewStats.totalLot,
                overviewStats.totalLotWithDepacto,
              ),
            ]}
          />

          <div
            className={cn(
              'grid gap-4 md:grid-cols-2 2xl:grid-cols-4',
              !hasAnyActivityCard && 'hidden 2xl:grid',
            )}
          >
            <ActivityCardSlot
              visibleBelowLarge={loansLoading || maturingLoans.length > 0}
            >
              <MaturingLoansCard
                loans={maturingLoans}
                loading={loansLoading}
                loadingVariant="empty"
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
                  handleActivityViewAllClick([
                    'Fully Funded',
                    'Partially Funded',
                  ])
                }
              />
            </ActivityCardSlot>
            <ActivityCardSlot
              visibleBelowLarge={loansLoading || overdueLoans.length > 0}
            >
              <PastDueLoansCard
                loans={overdueLoans}
                loading={loansLoading}
                loadingVariant="list"
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
            </ActivityCardSlot>
            <ActivityCardSlot
              visibleBelowLarge={
                loansLoading || pendingDisbursements.length > 0
              }
            >
              <PendingDisbursementsCard
                disbursements={pendingDisbursements}
                loading={loansLoading}
                loadingVariant="empty"
                onDisbursementClick={async (loanId) => {
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
                  handleActivityViewAllClick([
                    'Fully Funded',
                    'Partially Funded',
                  ])
                }
              />
            </ActivityCardSlot>
            <ActivityCardSlot
              visibleBelowLarge={loansLoading || completedLoans.length > 0}
            >
              <CompletedLoansCard
                loans={completedLoans}
                loading={loansLoading}
                loadingVariant="list"
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
            </ActivityCardSlot>
          </div>
        </TabsContent>

        <TabsContent value="loans" className="mt-6 space-y-4">
          <div ref={loansSectionRef}>
          {/* Search and Filters Section */}
          {loansLoading ? (
            <InvestorLoansFiltersSkeleton />
          ) : (
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
                    options={LOAN_TYPE_FILTER_OPTIONS}
                    selected={loanTypeFilter}
                    onChange={setLoanTypeFilter}
                    placeholder="Select Type"
                    allLabel="All Types"
                    triggerClassName="hidden xl:flex w-full xl:w-[180px]"
                  />

                  {/* Status Filter - Hidden on Mobile */}
                  <MultiSelectFilter
                    options={LOAN_STATUS_FILTER_OPTIONS}
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
                    sections={loanPDFSections}
                    onGeneratePDF={(data, keys) =>
                      renderLoansPDF(data, keys, investor.id)
                    }
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
                          options={LOAN_TYPE_FILTER_OPTIONS}
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
                          options={LOAN_STATUS_FILTER_OPTIONS}
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
            <LoansTableSkeleton rows={6} />
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
                                    {formatText(loan.loanName)}
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
                            <CardContent className="space-y-3 px-4 pb-2.5 pt-0">
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
                                    {formatPercentage(investorRate)}
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
                  hideFields={['sentDates', 'dueDate', 'freeLotSqm']}
                  investorId={investor.id}
                  onQuickView={(loan) => {
                    setSelectedLoan(loan);
                    setShowLoanDetailModal(true);
                  }}
                />
              )}
            </>
          )}
          </div>
        </TabsContent>

        {SHOW_TRANSACTIONS_UI && (
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
                    sections={transactionPDFSections}
                    onGeneratePDF={renderTransactionsPDF}
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
            <TransactionsTableSkeleton rows={6} />
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
        )}

        <TabsContent value="debts" className="mt-6 space-y-4">
          {investorDebts.length > 0 && (
            <div className="flex flex-col gap-4">
              <div className="flex flex-col gap-3">
                <div className="flex flex-col sm:flex-row sm:flex-wrap gap-3">
                  <SearchFilter
                    value={debtSearchQuery}
                    onChange={setDebtSearchQuery}
                    placeholder="Search borrowings by name or notes..."
                  />

                  <Select
                    value={showPastDebts ? 'show' : 'hide'}
                    onValueChange={(value) =>
                      setShowPastDebts(value === 'show')
                    }
                  >
                    <SelectTrigger className="hidden xl:flex w-full xl:w-[200px]">
                      <SelectValue placeholder="Repaid Borrowings" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="hide">Hide Repaid</SelectItem>
                      <SelectItem value="show">Show Repaid</SelectItem>
                    </SelectContent>
                  </Select>

                  <MultiSelectFilter
                    options={[
                      { value: 'Daily', label: 'Daily' },
                      { value: 'Weekly', label: 'Weekly' },
                      { value: 'Monthly', label: 'Monthly' },
                      { value: 'Annually', label: 'Annually' },
                    ]}
                    selected={debtIntervalFilter}
                    onChange={setDebtIntervalFilter}
                    placeholder="Accrual Period"
                    allLabel="All Periods"
                    triggerClassName="hidden xl:flex w-full xl:w-[180px]"
                  />

                  <CollapsibleSection
                    inline
                    isOpen={showMoreDebtFilters}
                    onToggle={() =>
                      setShowMoreDebtFilters(!showMoreDebtFilters)
                    }
                    trigger={{
                      label: `${showMoreDebtFilters ? 'Less' : 'More'} Filters`,
                      icon: Filter,
                      showIndicator: hasActiveDebtAmountFilters,
                    }}
                  />

                  {hasActiveDebtFilters && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={clearDebtFilters}
                      className="whitespace-nowrap"
                    >
                      <X className="h-4 w-4 xl:mr-2" />
                      <span className="hidden xl:inline">Clear All</span>
                    </Button>
                  )}

                  <Button
                    size="sm"
                    onClick={() => setShowDebtModal(true)}
                    className="h-9 px-3"
                  >
                    <Plus className="h-3 w-3 xl:mr-1" />
                    <span className="hidden xl:inline">Add Borrowing</span>
                  </Button>
                </div>

                <CollapsibleContent isOpen={showMoreDebtFilters}>
                  <div className="space-y-3">
                    <div className="grid grid-cols-2 gap-3 pb-3 border-b xl:hidden">
                      <div>
                        <label className="text-xs font-semibold mb-2 block">
                          Repaid Borrowings
                        </label>
                        <Select
                          value={showPastDebts ? 'show' : 'hide'}
                          onValueChange={(value) =>
                            setShowPastDebts(value === 'show')
                          }
                        >
                          <SelectTrigger className="w-full">
                            <SelectValue placeholder="Repaid Borrowings" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="hide">Hide Repaid</SelectItem>
                            <SelectItem value="show">Show Repaid</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <label className="text-xs font-semibold mb-2 block">
                          Accrual Period
                        </label>
                        <MultiSelectFilter
                          options={[
                            { value: 'Daily', label: 'Daily' },
                            { value: 'Weekly', label: 'Weekly' },
                            { value: 'Monthly', label: 'Monthly' },
                            { value: 'Annually', label: 'Annually' },
                          ]}
                          selected={debtIntervalFilter}
                          onChange={setDebtIntervalFilter}
                          placeholder="Accrual Period"
                          allLabel="All Periods"
                          triggerClassName="w-full"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <RangeFilter
                        label="Principal Amount"
                        icon={DollarSign}
                        minValue={minDebtAmount}
                        maxValue={maxDebtAmount}
                        onMinChange={setMinDebtAmount}
                        onMaxChange={setMaxDebtAmount}
                        minPlaceholder="Min (₱)"
                        maxPlaceholder="Max (₱)"
                      />
                    </div>
                  </div>
                </CollapsibleContent>
              </div>

              {hasActiveDebtFilters && (
                <div className="text-sm text-muted-foreground">
                  Showing {filteredDebts.length} of {investorDebts.length} borrowings
                </div>
              )}
            </div>
          )}

          {!isViewModeReady ? (
            <TransactionsTableSkeleton rows={6} />
          ) : investorDebts.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12 gap-4">
                <p className="text-muted-foreground">No borrowings yet</p>
                <Button size="sm" onClick={() => setShowDebtModal(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Borrowing
                </Button>
              </CardContent>
            </Card>
          ) : filteredDebts.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <p className="text-muted-foreground mb-4">
                  No borrowings match your filters
                </p>
                <Button variant="outline" onClick={clearDebtFilters}>
                  <X className="mr-2 h-4 w-4" />
                  Clear filters
                </Button>
              </CardContent>
            </Card>
          ) : (
            <>
              {debtsViewMode === 'cards' && (
                <CardPagination
                  items={filteredDebts}
                  itemsPerPage={10}
                  itemName="borrowings"
                  scrollToTop={false}
                  renderItems={(paginatedDebts) => (
                    <div className="grid gap-4 sm:gap-6 grid-cols-1 lg:grid-cols-2 2xl:grid-cols-3">
                      {paginatedDebts.map((debt) => (
                        <DebtCard
                          key={debt.id}
                          debt={debt}
                          onQuickView={(debt) => {
                            setSelectedDebt(debt);
                            setShowDebtDetailModal(true);
                          }}
                          viewHref={`/debts/${debt.id}`}
                        />
                      ))}
                    </div>
                  )}
                />
              )}

              {debtsViewMode === 'table' && (
                <DebtsTable
                  debts={filteredDebts}
                  itemsPerPage={10}
                  onQuickView={(debt) => {
                    setSelectedDebt(debt);
                    setShowDebtDetailModal(true);
                  }}
                />
              )}
            </>
          )}
        </TabsContent>
      </Tabs>

      {/* Transaction Create Modal */}
      {SHOW_TRANSACTIONS_UI && (
        <TransactionCreateModal
          open={showTransactionModal}
          onOpenChange={setShowTransactionModal}
          preselectedInvestorId={investor.id}
          onSuccess={() => {
            router.refresh();
          }}
        />
      )}

      <DebtCreateModal
        open={showDebtModal}
        onOpenChange={setShowDebtModal}
        preselectedInvestorId={investor.id}
        onSuccess={() => {
          router.refresh();
        }}
      />

      {/* Loan Create Modal - open from "Add loan" button or "Duplicate" in loan detail */}
      <LoanCreateModal
        open={showLoanModal || isCreateModalOpenFromStore}
        onOpenChange={(open) => {
          if (!open) {
            setShowLoanModal(false);
            closeCreateModal();
          }
        }}
        preselectedInvestorId={investor.id}
        onSuccess={() => {
          fetchLoansData();
          router.refresh();
        }}
      />

      {/* Transaction Detail Modal */}
      {SHOW_TRANSACTIONS_UI && (
        <TransactionDetailModal
          transaction={selectedTransaction}
          open={showTransactionDetailModal}
          onOpenChange={setShowTransactionDetailModal}
          onUpdate={() => {
            router.refresh();
          }}
        />
      )}

      <DebtDetailModal
        debt={selectedDebt}
        open={showDebtDetailModal}
        onOpenChange={setShowDebtDetailModal}
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

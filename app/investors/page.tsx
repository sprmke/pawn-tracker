'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { useOverdueCheck, useResponsiveViewMode } from '@/hooks';
import {
  TrendingUp,
  DollarSign,
  LayoutGrid,
  Table as TableIcon,
  UserPlus,
  X,
  Filter,
} from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { InvestorWithLoans } from '@/lib/types';
import {
  CollapsibleSection,
  CollapsibleContent,
  InvestorsTable,
  ActionButtonsGroup,
  SearchFilter,
  RangeFilter,
  CardPagination,
  InlineLoader,
  PastDueLoansCard,
  PendingDisbursementsCard,
  MaturingLoansCard,
  PageHeader,
  ExportButton,
} from '@/components/common';
import { formatCurrency } from '@/lib/format';
import { getTodayAtMidnight, normalizeToMidnight } from '@/lib/date-utils';
import {
  calculateInvestorStats,
  calculateAverageRate,
} from '@/lib/calculations';
import { investorsCSVColumns } from '@/lib/csv-columns';
import { addDays, isAfter, isBefore, isPast } from 'date-fns';
import type { LoanWithInvestors } from '@/lib/types';

const getBalanceStatus = (balance: number) => {
  if (balance > 100000)
    return { status: 'Can invest', variant: 'default' as const };
  if (balance > 50000)
    return { status: 'Low funds', variant: 'secondary' as const };
  return { status: 'No funds', variant: 'destructive' as const };
};

// Helper function to calculate activity card data for an investor
const getInvestorActivityData = (
  investor: InvestorWithLoans,
  allLoans: LoanWithInvestors[]
) => {
  const now = new Date();
  const fourteenDaysFromNow = addDays(now, 14);

  // Get investor's loan IDs
  const investorLoanIds = new Set(
    investor.loanInvestors.map((li) => li.loan.id)
  );

  // Filter loans to only those this investor is part of
  const investorLoans = allLoans.filter((loan) => investorLoanIds.has(loan.id));

  // Overdue loans
  const overdueLoans = investorLoans
    .filter(
      (loan) =>
        loan.status === 'Overdue' ||
        (loan.status !== 'Completed' && isPast(new Date(loan.dueDate)))
    )
    .sort(
      (a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime()
    );

  // Pending disbursements
  const unpaidLoanTransactions: Array<{
    id: number;
    loanId: number;
    loanName: string;
    investorName: string;
    amount: string;
    sentDate: Date;
  }> = [];

  investorLoans.forEach((loan) => {
    loan.loanInvestors
      .filter((li) => !li.isPaid && li.investor.id === investor.id)
      .forEach((li) => {
        unpaidLoanTransactions.push({
          id: li.id,
          loanId: loan.id,
          loanName: loan.loanName,
          investorName: li.investor.name,
          amount: li.amount,
          sentDate: li.sentDate,
        });
      });
  });

  const pendingDisbursements = unpaidLoanTransactions.sort(
    (a, b) => new Date(a.sentDate).getTime() - new Date(b.sentDate).getTime()
  );

  // Maturing loans
  const maturingLoans = investorLoans
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
      (a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime()
    );

  return {
    overdueLoans,
    pendingDisbursements,
    maturingLoans,
  };
};

export default function InvestorsPage() {
  const router = useRouter();
  const [investors, setInvestors] = useState<InvestorWithLoans[]>([]);
  const [allLoans, setAllLoans] = useState<LoanWithInvestors[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Use responsive view mode hook for SSR-safe view mode detection
  const { viewMode, setViewMode, isReady: isViewModeReady } = useResponsiveViewMode<
    'cards' | 'table'
  >();
  const itemsPerPage = 10;
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedInvestors, setExpandedInvestors] = useState<Set<number>>(
    new Set()
  );
  const [expandedTableRows, setExpandedTableRows] = useState<Set<number>>(
    new Set()
  );

  // Automatically check for overdue loans and periods
  useOverdueCheck();

  // Filter states
  const [loanStatusFilter, setLoanStatusFilter] = useState<string>('all');
  const [minBalance, setMinBalance] = useState<string>('');
  const [maxBalance, setMaxBalance] = useState<string>('');
  const [minCapital, setMinCapital] = useState<string>('');
  const [maxCapital, setMaxCapital] = useState<string>('');
  const [minInterest, setMinInterest] = useState<string>('');
  const [maxInterest, setMaxInterest] = useState<string>('');
  const [minGain, setMinGain] = useState<string>('');
  const [maxGain, setMaxGain] = useState<string>('');
  const [showMoreFilters, setShowMoreFilters] = useState(false);

  useEffect(() => {
    fetchInvestors();
  }, []);

  const fetchInvestors = async () => {
    try {
      const [investorsResponse, loansResponse] = await Promise.all([
        fetch('/api/investors'),
        fetch('/api/loans'),
      ]);
      const investorsData = await investorsResponse.json();
      const loansData = await loansResponse.json();
      setInvestors(investorsData);
      setAllLoans(loansData);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const toggleInvestor = (investorId: number, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setExpandedInvestors((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(investorId)) {
        newSet.delete(investorId);
      } else {
        newSet.add(investorId);
      }
      return newSet;
    });
  };

  const toggleTableRow = (investorId: string | number) => {
    setExpandedTableRows((prev) => {
      const newSet = new Set(prev);
      const id =
        typeof investorId === 'string' ? parseInt(investorId) : investorId;
      if (newSet.has(id)) {
        newSet.delete(id);
      } else {
        newSet.add(id);
      }
      return newSet;
    });
  };

  const clearFilters = () => {
    setSearchQuery('');
    setLoanStatusFilter('all');
    setMinBalance('');
    setMaxBalance('');
    setMinCapital('');
    setMaxCapital('');
    setMinInterest('');
    setMaxInterest('');
    setMinGain('');
    setMaxGain('');
  };

  const hasActiveAmountFilters =
    minBalance !== '' ||
    maxBalance !== '' ||
    minCapital !== '' ||
    maxCapital !== '' ||
    minInterest !== '' ||
    maxInterest !== '' ||
    minGain !== '' ||
    maxGain !== '';

  const hasActiveFilters =
    searchQuery !== '' || loanStatusFilter !== 'all' || hasActiveAmountFilters;

  // Filter investors based on search and filters
  const filteredInvestors = investors.filter((investor) => {
    const stats = calculateInvestorStats(investor);

    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      const matchesName = investor.name.toLowerCase().includes(query);
      const matchesEmail = investor.email.toLowerCase().includes(query);
      if (!matchesName && !matchesEmail) return false;
    }

    // Loan status filter
    if (loanStatusFilter !== 'all') {
      switch (loanStatusFilter) {
        case 'active':
          if (stats.activeLoans === 0) return false;
          break;
        case 'completed':
          if (stats.completedLoans === 0) return false;
          break;
        case 'overdue':
          if (stats.overdueLoans === 0) return false;
          break;
        case 'no-loans':
          if (stats.totalLoans > 0) return false;
          break;
      }
    }

    // Balance range filter
    if (minBalance !== '' && stats.currentBalance < parseFloat(minBalance)) {
      return false;
    }
    if (maxBalance !== '' && stats.currentBalance > parseFloat(maxBalance)) {
      return false;
    }

    // Capital range filter
    if (minCapital !== '' && stats.totalCapital < parseFloat(minCapital)) {
      return false;
    }
    if (maxCapital !== '' && stats.totalCapital > parseFloat(maxCapital)) {
      return false;
    }

    // Interest range filter
    if (minInterest !== '' && stats.totalInterest < parseFloat(minInterest)) {
      return false;
    }
    if (maxInterest !== '' && stats.totalInterest > parseFloat(maxInterest)) {
      return false;
    }

    // Gain range filter
    if (minGain !== '' && stats.totalGain < parseFloat(minGain)) {
      return false;
    }
    if (maxGain !== '' && stats.totalGain > parseFloat(maxGain)) {
      return false;
    }

    return true;
  });

  if (loading || !isViewModeReady) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Investors</h1>
          <p className="text-muted-foreground">
            Track investor portfolios and balances
          </p>
        </div>
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12 gap-4">
            <InlineLoader size="md" />
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Investors"
        description="Track investor portfolios and balances"
        actions={
          <>
            <div className="flex items-center border-2 rounded-lg p-1">
              {/* Table view button - hidden on mobile, visible from tablet (md) and up */}
              <Button
                variant={viewMode === 'table' ? 'secondary' : 'ghost'}
                size="sm"
                onClick={() => setViewMode('table')}
                className="h-8 px-3 hidden md:flex"
              >
                <TableIcon className="h-4 w-4" />
              </Button>
              <Button
                variant={viewMode === 'cards' ? 'secondary' : 'ghost'}
                size="sm"
                onClick={() => setViewMode('cards')}
                className="h-8 px-3"
              >
                <LayoutGrid className="h-4 w-4" />
              </Button>
            </div>
            <ExportButton
              data={investors}
              filteredData={filteredInvestors}
              columns={investorsCSVColumns}
              filename="investors"
              variant="outline"
              size="default"
            />
            <Link href="/investors/new">
              <Button className="w-full sm:w-auto">
                <UserPlus className="mr-2 h-4 w-4" />
                New Investor
              </Button>
            </Link>
          </>
        }
      />

      {/* Search and Filter Section */}
      <div className="flex flex-col gap-4">
        <div className="flex flex-col gap-3">
          {/* Search and Loan Status Row */}
          <div className="flex flex-col sm:flex-row gap-3">
            {/* Search Input */}
            <SearchFilter
              value={searchQuery}
              onChange={setSearchQuery}
              placeholder="Search investors by name or email..."
            />

            {/* Loan Status Filter - Hidden on Mobile */}
            <Select
              value={loanStatusFilter}
              onValueChange={(value) => setLoanStatusFilter(value)}
            >
              <SelectTrigger className="hidden sm:flex w-full sm:w-[200px]">
                <SelectValue placeholder="Loan Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Loan Status</SelectItem>
                <SelectItem value="active">Has Active Loans</SelectItem>
                <SelectItem value="completed">Has Completed Loans</SelectItem>
                <SelectItem value="overdue">Has Overdue Loans</SelectItem>
                <SelectItem value="no-loans">No Loans</SelectItem>
              </SelectContent>
            </Select>

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
            {hasActiveFilters && (
              <Button
                variant="outline"
                size="sm"
                onClick={clearFilters}
                className="whitespace-nowrap"
              >
                <X className="h-4 w-4 mr-2" />
                Clear All
              </Button>
            )}
          </div>

          {/* Amount Range Filters - Collapsible Content */}
          <CollapsibleContent isOpen={showMoreFilters}>
            {/* Mobile-only Loan Status Filter */}
            <div className="mb-3 pb-3 border-b sm:hidden">
              <label className="text-xs font-semibold mb-2 block">
                Loan Status
              </label>
              <Select
                value={loanStatusFilter}
                onValueChange={(value) => setLoanStatusFilter(value)}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Loan Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Loan Status</SelectItem>
                  <SelectItem value="active">Has Active Loans</SelectItem>
                  <SelectItem value="completed">Has Completed Loans</SelectItem>
                  <SelectItem value="overdue">Has Overdue Loans</SelectItem>
                  <SelectItem value="no-loans">No Loans</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3">
              {/* Total Capital Range */}
              <RangeFilter
                label="Total Capital"
                icon={DollarSign}
                minValue={minCapital}
                maxValue={maxCapital}
                onMinChange={setMinCapital}
                onMaxChange={setMaxCapital}
                minPlaceholder="Min (₱)"
                maxPlaceholder="Max (₱)"
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

              {/* Total Gain Range */}
              <RangeFilter
                label="Total Gain"
                icon={TrendingUp}
                minValue={minGain}
                maxValue={maxGain}
                onMinChange={setMinGain}
                onMaxChange={setMaxGain}
                minPlaceholder="Min (₱)"
                maxPlaceholder="Max (₱)"
              />
            </div>
          </CollapsibleContent>
        </div>

        {/* Results Count */}
        {hasActiveFilters && (
          <div className="text-sm text-muted-foreground">
            Showing {filteredInvestors.length} of {investors.length} investors
          </div>
        )}
      </div>

      {investors.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <p className="text-muted-foreground mb-4">No investors found</p>
            <Link href="/investors/new">
              <Button>
                <UserPlus className="mr-2 h-4 w-4" />
                Add your first investor
              </Button>
            </Link>
          </CardContent>
        </Card>
      ) : filteredInvestors.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <p className="text-muted-foreground mb-4">
              No investors match your filters
            </p>
            <Button variant="outline" onClick={clearFilters}>
              <X className="mr-2 h-4 w-4" />
              Clear filters
            </Button>
          </CardContent>
        </Card>
      ) : (
        <>
          {viewMode === 'cards' && (
            <CardPagination
              items={filteredInvestors}
              itemsPerPage={itemsPerPage}
              itemName="investors"
              renderItems={(paginatedInvestors) => (
                <div className="grid gap-4 sm:gap-6 grid-cols-1 lg:grid-cols-2 2xl:grid-cols-3">
                  {paginatedInvestors.map((investor) => {
                    const stats = calculateInvestorStats(investor);
                    const avgRate = calculateAverageRate(
                      investor.loanInvestors
                    );

                    // Get today's date at midnight for comparison
                    const today = getTodayAtMidnight();

                    // Get unique sent dates (only today and future)
                    const uniqueSentDates = Array.from(
                      new Set(
                        investor.loanInvestors.map(
                          (li) =>
                            new Date(li.sentDate).toISOString().split('T')[0]
                        )
                      )
                    )
                      .map((dateStr) => new Date(dateStr))
                      .filter((date) => {
                        const checkDate = normalizeToMidnight(date);
                        return checkDate >= today;
                      })
                      .sort((a, b) => a.getTime() - b.getTime());

                    // Get unique due dates from all loans (only today and future)
                    const dueDateSet = new Set<string>();
                    investor.loanInvestors.forEach((li) => {
                      dueDateSet.add(
                        new Date(li.loan.dueDate).toISOString().split('T')[0]
                      );
                      if (li.hasMultipleInterest && li.interestPeriods) {
                        li.interestPeriods.forEach((period) => {
                          dueDateSet.add(
                            new Date(period.dueDate).toISOString().split('T')[0]
                          );
                        });
                      }
                    });

                    const uniqueDueDates = Array.from(dueDateSet)
                      .map((dateStr) => new Date(dateStr))
                      .filter((date) => {
                        const checkDate = normalizeToMidnight(date);
                        return checkDate >= today;
                      })
                      .sort((a, b) => a.getTime() - b.getTime());

                    return (
                      <Card
                        key={investor.id}
                        className="hover:shadow-lg transition-shadow h-full cursor-pointer lg:cursor-default"
                        onClick={(e) => {
                          // Only navigate on mobile (below lg breakpoint)
                          // Check if click is on the card itself, not on buttons
                          const target = e.target as HTMLElement;
                          const isButton = target.closest('button');
                          if (!isButton && window.innerWidth < 1024) {
                            router.push(`/investors/${investor.id}`);
                          }
                        }}
                      >
                        <CardHeader className="pb-3">
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex-1 min-w-0">
                              <CardTitle className="text-sm sm:text-base truncate">
                                {investor.name}
                              </CardTitle>
                              <p className="text-xs text-muted-foreground truncate">
                                {investor.email}
                              </p>
                            </div>
                          </div>
                        </CardHeader>
                        <CardContent className="space-y-4 px-4">
                          {/* Summary Section */}
                          <div className="grid grid-cols-2 gap-2">
                            <div className="p-3 bg-muted/50 rounded-lg">
                              <p className="text-[10px] text-muted-foreground mb-1">
                                Total Capital
                              </p>
                              <p className="text-sm font-medium break-words">
                                {formatCurrency(stats.totalCapital)}
                              </p>
                            </div>
                            <div className="p-3 bg-muted/50 rounded-lg">
                              <p className="text-[10px] text-muted-foreground mb-1">
                                Avg. Rate
                              </p>
                              <p className="text-sm font-medium">
                                {avgRate.toFixed(2)}%
                              </p>
                            </div>
                            <div className="p-3 bg-muted/50 rounded-lg">
                              <p className="text-[10px] text-muted-foreground mb-1">
                                Total Interest
                              </p>
                              <p className="text-sm font-medium break-words">
                                {formatCurrency(stats.totalInterest)}
                              </p>
                            </div>
                            <div className="p-3 bg-muted/50 rounded-lg">
                              <p className="text-[10px] text-muted-foreground mb-1">
                                Total Amount
                              </p>
                              <p className="text-sm font-medium break-words">
                                {formatCurrency(
                                  stats.totalCapital + stats.totalInterest
                                )}
                              </p>
                            </div>
                          </div>

                          {/* Action Buttons */}
                          <div className="pt-2 border-t">
                            <ActionButtonsGroup
                              isExpanded={expandedInvestors.has(investor.id)}
                              onToggle={(e) => toggleInvestor(investor.id, e)}
                              viewHref={`/investors/${investor.id}`}
                              showToggle={true}
                              hideViewOnMobile={false}
                              size="md"
                            />
                          </div>

                          {/* Activity Cards - Only shown when expanded */}
                          {expandedInvestors.has(investor.id) && (
                            <div className="pt-2 border-t">
                              {(() => {
                                const activityData =
                                  allLoans.length === 0
                                    ? {
                                        overdueLoans: [],
                                        pendingDisbursements: [],
                                        maturingLoans: [],
                                      }
                                    : getInvestorActivityData(
                                        investor,
                                        allLoans
                                      );

                                return (
                                  <div className="grid gap-2 grid-cols-1">
                                    <PastDueLoansCard
                                      loans={activityData.overdueLoans}
                                      loading={loading}
                                      investorId={investor.id}
                                    />
                                    <PendingDisbursementsCard
                                      disbursements={
                                        activityData.pendingDisbursements
                                      }
                                      loading={loading}
                                    />
                                    <MaturingLoansCard
                                      loans={activityData.maturingLoans}
                                      loading={loading}
                                      investorId={investor.id}
                                    />
                                  </div>
                                );
                              })()}
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              )}
            />
          )}

          {viewMode === 'table' && (
            <InvestorsTable
              investors={filteredInvestors}
              allLoans={allLoans}
              itemsPerPage={10}
              expandedRows={expandedTableRows}
              onToggleExpand={toggleTableRow}
            />
          )}
        </>
      )}
    </div>
  );
}

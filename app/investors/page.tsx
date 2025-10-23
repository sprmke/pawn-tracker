'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
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
} from '@/components/common';
import { formatCurrency, isFutureDate } from '@/lib/format';
import { getLoanStatusBadge, getLoanTypeBadge } from '@/lib/badge-config';
import {
  calculateInvestorStats,
  calculateAverageRate,
  calculateInterest,
  calculateInvestmentTotal,
  calculateLoanBalance,
} from '@/lib/calculations';

const getBalanceStatus = (balance: number) => {
  if (balance > 100000)
    return { status: 'Can invest', variant: 'default' as const };
  if (balance > 50000)
    return { status: 'Low funds', variant: 'secondary' as const };
  return { status: 'No funds', variant: 'destructive' as const };
};

export default function InvestorsPage() {
  const router = useRouter();
  const [investors, setInvestors] = useState<InvestorWithLoans[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<'cards' | 'table'>('cards');
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedInvestors, setExpandedInvestors] = useState<Set<number>>(
    new Set()
  );
  const [expandedTableRows, setExpandedTableRows] = useState<Set<number>>(
    new Set()
  );

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
      const response = await fetch('/api/investors');
      const data = await response.json();
      setInvestors(data);
    } catch (error) {
      console.error('Error fetching investors:', error);
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

  if (loading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Investors</h1>
          <p className="text-muted-foreground">
            Track investor portfolios and balances
          </p>
        </div>
        <Card>
          <CardContent className="flex items-center justify-center py-12">
            <p className="text-muted-foreground">Loading investors...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">
            Investors
          </h1>
          <p className="text-sm sm:text-base text-muted-foreground">
            Track investor portfolios and balances
          </p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center border rounded-lg p-1">
            <Button
              variant={viewMode === 'cards' ? 'secondary' : 'ghost'}
              size="sm"
              onClick={() => setViewMode('cards')}
              className="h-8 px-3"
            >
              <LayoutGrid className="h-4 w-4" />
            </Button>
            <Button
              variant={viewMode === 'table' ? 'secondary' : 'ghost'}
              size="sm"
              onClick={() => setViewMode('table')}
              className="h-8 px-3"
            >
              <TableIcon className="h-4 w-4" />
            </Button>
          </div>
          <Link href="/investors/new">
            <Button className="w-full sm:w-auto">
              <UserPlus className="mr-2 h-4 w-4" />
              New Investor
            </Button>
          </Link>
        </div>
      </div>

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

            {/* Loan Status Filter */}
            <Select
              value={loanStatusFilter}
              onValueChange={(value) => setLoanStatusFilter(value)}
            >
              <SelectTrigger className="w-full sm:w-[200px]">
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
            <div className="grid gap-4 sm:gap-6 grid-cols-1 lg:grid-cols-2 2xl:grid-cols-3">
              {filteredInvestors.map((investor) => {
                const stats = calculateInvestorStats(investor);
                const avgRate = calculateAverageRate(investor.loanInvestors);

                // Get today's date at midnight for comparison
                const today = new Date();
                today.setHours(0, 0, 0, 0);

                // Get unique sent dates (only today and future)
                const uniqueSentDates = Array.from(
                  new Set(
                    investor.loanInvestors.map(
                      (li) => new Date(li.sentDate).toISOString().split('T')[0]
                    )
                  )
                )
                  .map((dateStr) => new Date(dateStr))
                  .filter((date) => {
                    const checkDate = new Date(date);
                    checkDate.setHours(0, 0, 0, 0);
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
                    const checkDate = new Date(date);
                    checkDate.setHours(0, 0, 0, 0);
                    return checkDate >= today;
                  })
                  .sort((a, b) => a.getTime() - b.getTime());

                // Group loan investors by loan ID to get unique loans
                const loanMap = new Map<
                  number,
                  {
                    loan: (typeof investor.loanInvestors)[0]['loan'];
                    transactions: Array<(typeof investor.loanInvestors)[0]>;
                  }
                >();

                investor.loanInvestors.forEach((li) => {
                  const loanId = li.loan.id;
                  if (!loanMap.has(loanId)) {
                    loanMap.set(loanId, {
                      loan: li.loan,
                      transactions: [],
                    });
                  }
                  loanMap.get(loanId)!.transactions.push(li);
                });

                const uniqueLoans = Array.from(loanMap.values());

                return (
                  <Card
                    key={investor.id}
                    className="hover:shadow-lg transition-shadow h-full"
                  >
                    <CardHeader className="pb-3">
                      <div className="flex items-start justify-between gap-2">
                        <div className="space-y-1 flex-1 min-w-0">
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
                      <div className="grid grid-cols-2 sm:grid-cols-3">
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
                        <div className="p-3 bg-muted/50 rounded-lg">
                          <p className="text-[10px] text-muted-foreground mb-1">
                            Upcoming Out Dates
                          </p>
                          <div className="flex flex-col gap-0.5 items-start">
                            {uniqueSentDates.length > 0 ? (
                              uniqueSentDates.map((date, index) => {
                                const checkDate = new Date(date);
                                checkDate.setHours(0, 0, 0, 0);
                                const isFuture = checkDate > today;

                                return (
                                  <span
                                    key={index}
                                    className={`${
                                      uniqueSentDates.length > 1
                                        ? 'text-[10px]'
                                        : 'text-xs'
                                    } px-2 py-0.5 rounded inline-block font-medium ${
                                      isFuture ? 'bg-yellow-200' : ''
                                    }`}
                                  >
                                    {date.toLocaleDateString('en-US', {
                                      month: 'short',
                                      day: 'numeric',
                                      year: 'numeric',
                                    })}
                                  </span>
                                );
                              })
                            ) : (
                              <span className="text-xs text-muted-foreground">
                                -
                              </span>
                            )}
                          </div>
                        </div>
                        <div className="p-3 bg-muted/50 rounded-lg">
                          <p className="text-[10px] text-muted-foreground mb-1">
                            Upcoming In Dates
                          </p>
                          <div className="flex flex-col gap-0.5 items-start">
                            {uniqueDueDates.length > 0 ? (
                              uniqueDueDates.map((date, index) => (
                                <span
                                  key={index}
                                  className={`${
                                    uniqueDueDates.length > 1
                                      ? 'text-[10px]'
                                      : 'text-xs'
                                  } px-2 py-0.5 rounded inline-block font-medium`}
                                >
                                  {date.toLocaleDateString('en-US', {
                                    month: 'short',
                                    day: 'numeric',
                                    year: 'numeric',
                                  })}
                                </span>
                              ))
                            ) : (
                              <span className="text-xs text-muted-foreground">
                                -
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Action Buttons */}
                      <div className="pt-2 border-t">
                        <ActionButtonsGroup
                          isExpanded={expandedInvestors.has(investor.id)}
                          onToggle={(e) => toggleInvestor(investor.id, e)}
                          viewHref={`/investors/${investor.id}`}
                          showToggle={true}
                          size="md"
                        />
                      </div>

                      {/* Loans Section - Only shown when expanded */}
                      {expandedInvestors.has(investor.id) && (
                        <div className="space-y-3">
                          {(() => {
                            // Filter to only show active loans (not completed)
                            const activeLoans = uniqueLoans.filter(
                              ({ loan }) => loan.status !== 'Completed'
                            );

                            if (activeLoans.length === 0) {
                              return (
                                <div className="pt-2 border-t">
                                  <p className="text-xs text-muted-foreground text-center py-3">
                                    No active loans
                                  </p>
                                </div>
                              );
                            }

                            return (
                              <div className="pt-2 border-t">
                                <div className="px-3 mb-2">
                                  <p className="text-xs font-medium text-xs text-muted-foreground">
                                    Active Loans{' '}
                                    <span className="text-[10px] text-muted-foreground">
                                      (Not marked as completed)
                                    </span>
                                  </p>
                                </div>
                                <div>
                                  {activeLoans.map(({ loan, transactions }) => {
                                    // Calculate totals for this loan
                                    const totalPrincipal = transactions.reduce(
                                      (sum, t) => sum + parseFloat(t.amount),
                                      0
                                    );
                                    const totalInterest = transactions.reduce(
                                      (sum, t) =>
                                        sum +
                                        calculateInterest(
                                          t.amount,
                                          t.interestRate,
                                          t.interestType
                                        ),
                                      0
                                    );
                                    const avgRate =
                                      calculateAverageRate(transactions);
                                    const total =
                                      totalPrincipal + totalInterest;

                                    // Get sent dates for this loan
                                    const sentDates = Array.from(
                                      new Set(
                                        transactions.map(
                                          (t) =>
                                            new Date(t.sentDate)
                                              .toISOString()
                                              .split('T')[0]
                                        )
                                      )
                                    )
                                      .map((dateStr) => new Date(dateStr))
                                      .sort(
                                        (a, b) => a.getTime() - b.getTime()
                                      );

                                    // Get due dates for this loan
                                    const dueDateSet = new Set<string>();
                                    dueDateSet.add(
                                      new Date(loan.dueDate)
                                        .toISOString()
                                        .split('T')[0]
                                    );

                                    // Add interest period due dates
                                    transactions.forEach((t) => {
                                      if (
                                        t.hasMultipleInterest &&
                                        t.interestPeriods
                                      ) {
                                        t.interestPeriods.forEach((period) => {
                                          dueDateSet.add(
                                            new Date(period.dueDate)
                                              .toISOString()
                                              .split('T')[0]
                                          );
                                        });
                                      }
                                    });

                                    const dueDates = Array.from(dueDateSet)
                                      .map((dateStr) => new Date(dateStr))
                                      .sort(
                                        (a, b) => a.getTime() - b.getTime()
                                      );

                                    return (
                                      <div
                                        key={loan.id}
                                        className="p-3 bg-muted/30 rounded-lg space-y-2 border-t"
                                      >
                                        <div className="flex items-start justify-between gap-2">
                                          <Link
                                            href={`/transactions/loans/${loan.id}`}
                                            className="font-medium text-sm hover:underline"
                                          >
                                            {loan.loanName}
                                          </Link>
                                          <div className="flex items-center gap-1 flex-shrink-0">
                                            <Badge
                                              variant={
                                                getLoanTypeBadge(loan.type)
                                                  .variant
                                              }
                                              className={`text-[10px] py-0.5 ${
                                                getLoanTypeBadge(loan.type)
                                                  .className
                                              }`}
                                            >
                                              {loan.type}
                                            </Badge>
                                            <Badge
                                              variant={
                                                getLoanStatusBadge(loan.status)
                                                  .variant
                                              }
                                              className={`text-[10px] py-0.5 ${
                                                getLoanStatusBadge(loan.status)
                                                  .className
                                              }`}
                                            >
                                              {loan.status}
                                            </Badge>
                                          </div>
                                        </div>
                                        <div className="grid grid-cols-4 gap-2 text-xs">
                                          <div>
                                            <p className="text-muted-foreground text-[9px]">
                                              Principal
                                            </p>
                                            <p className="font-medium text-xs">
                                              {formatCurrency(totalPrincipal)}
                                            </p>
                                          </div>
                                          <div>
                                            <p className="text-muted-foreground text-[9px]">
                                              Avg. Rate
                                            </p>
                                            <p className="font-medium text-xs">
                                              {avgRate.toFixed(2)}%
                                            </p>
                                          </div>
                                          <div>
                                            <p className="text-muted-foreground text-[9px]">
                                              Interest
                                            </p>
                                            <p className="font-medium text-xs">
                                              {formatCurrency(totalInterest)}
                                            </p>
                                          </div>
                                          <div>
                                            <p className="text-muted-foreground text-[9px]">
                                              Total
                                            </p>
                                            <p className="font-medium text-xs">
                                              {formatCurrency(total)}
                                            </p>
                                          </div>
                                        </div>
                                        <div className="grid grid-cols-4 gap-2 pt-2 text-xs">
                                          <div>
                                            <p className="text-muted-foreground text-[9px] mb-1">
                                              Pending Balance
                                            </p>
                                            <div className="flex flex-wrap gap-1">
                                              <p
                                                className={`text-xs ${
                                                  calculateLoanBalance(
                                                    transactions
                                                  ) > 0
                                                    ? 'bg-yellow-200 p-1 rounded-md'
                                                    : ''
                                                }`}
                                              >
                                                {(() => {
                                                  const balance =
                                                    calculateLoanBalance(
                                                      transactions
                                                    );
                                                  return balance > 0
                                                    ? formatCurrency(balance)
                                                    : '-';
                                                })()}
                                              </p>
                                            </div>
                                          </div>
                                          <div>
                                            <p className="text-muted-foreground text-[9px] mb-1">
                                              Sent Dates
                                            </p>
                                            <div className="flex flex-col items-start gap-1">
                                              {sentDates.map((date, idx) => {
                                                const checkDate = new Date(
                                                  date
                                                );
                                                checkDate.setHours(0, 0, 0, 0);
                                                const isFuture =
                                                  checkDate > today;

                                                return (
                                                  <span
                                                    key={idx}
                                                    className={`text-[10px] px-1.5 py-0.5 rounded ${
                                                      isFuture
                                                        ? 'bg-yellow-200'
                                                        : 'bg-muted'
                                                    }`}
                                                  >
                                                    {date.toLocaleDateString(
                                                      'en-US',
                                                      {
                                                        month: 'short',
                                                        day: 'numeric',
                                                        year: 'numeric',
                                                      }
                                                    )}
                                                  </span>
                                                );
                                              })}
                                            </div>
                                          </div>
                                          <div>
                                            <p className="text-muted-foreground text-[9px] mb-1">
                                              Due Dates
                                            </p>
                                            <div className="flex flex-wrap gap-1">
                                              {dueDates.map((date, idx) => (
                                                <span
                                                  key={idx}
                                                  className="text-[10px] px-1.5 py-0.5 rounded bg-muted"
                                                >
                                                  {date.toLocaleDateString(
                                                    'en-US',
                                                    {
                                                      month: 'short',
                                                      day: 'numeric',
                                                      year: 'numeric',
                                                    }
                                                  )}
                                                </span>
                                              ))}
                                            </div>
                                          </div>
                                          <div>
                                            <p className="text-muted-foreground text-[9px] mb-1">
                                              Free Lot
                                            </p>
                                            <div className="flex flex-wrap gap-1">
                                              <p className="text-xs">
                                                {loan.freeLotSqm
                                                  ? `${loan.freeLotSqm} sqm`
                                                  : '-'}
                                              </p>
                                            </div>
                                          </div>
                                        </div>
                                      </div>
                                    );
                                  })}
                                </div>
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

          {viewMode === 'table' && (
            <InvestorsTable
              investors={filteredInvestors}
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

'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { DropdownMenu } from '@/components/ui/dropdown-menu';
import {
  PlusCircle,
  LayoutGrid,
  Table as TableIcon,
  X,
  Filter,
  CalendarDays,
  ChevronDown,
  ArrowLeftRight,
  Coins,
} from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import type { TransactionWithInvestor } from '@/lib/types';
import {
  TransactionCard,
  TransactionsTable,
  TransactionCalendarView,
  TransactionDetailModal,
} from '@/components/transactions';
import {
  SearchFilter,
  RangeFilter,
  EmptyState,
  CardPagination,
  InlineLoader,
} from '@/components/common';
import { DollarSign, TrendingUp, Users } from 'lucide-react';

export default function TransactionsPage() {
  const router = useRouter();
  const [transactions, setTransactions] = useState<TransactionWithInvestor[]>(
    []
  );
  const [investors, setInvestors] = useState<{ id: number; name: string }[]>(
    []
  );
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<'cards' | 'table' | 'calendar'>(
    'table'
  );
  const itemsPerPage = 10;

  // Store the previous showPastTransactions state when switching to calendar view
  const [previousShowPastState, setPreviousShowPastState] = useState(false);
  const [wasCalendarView, setWasCalendarView] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [showPastTransactions, setShowPastTransactions] = useState(false);
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [directionFilter, setDirectionFilter] = useState<string>('all');
  const [selectedInvestors, setSelectedInvestors] = useState<number[]>([]);
  const [selectedTransaction, setSelectedTransaction] =
    useState<TransactionWithInvestor | null>(null);
  const [showTransactionModal, setShowTransactionModal] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);

  // Amount range filters
  const [minAmount, setMinAmount] = useState<string>('');
  const [maxAmount, setMaxAmount] = useState<string>('');
  const [minBalance, setMinBalance] = useState<string>('');
  const [maxBalance, setMaxBalance] = useState<string>('');
  const [showMoreFilters, setShowMoreFilters] = useState(false);

  useEffect(() => {
    fetchTransactions();
    fetchInvestors();
  }, []);

  // Handle view mode changes for calendar view
  useEffect(() => {
    if (viewMode === 'calendar' && !wasCalendarView) {
      // Entering calendar view: save current state and show all past transactions
      setPreviousShowPastState(showPastTransactions);
      setShowPastTransactions(true);
      setWasCalendarView(true);
    } else if (viewMode !== 'calendar' && wasCalendarView) {
      // Leaving calendar view: restore the previous state
      setShowPastTransactions(previousShowPastState);
      setWasCalendarView(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [viewMode, wasCalendarView]);

  const fetchTransactions = async () => {
    try {
      const response = await fetch('/api/transactions');
      const data = await response.json();
      setTransactions(data);
    } catch (error) {
      console.error('Error fetching transactions:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchInvestors = async () => {
    try {
      const response = await fetch('/api/investors');
      const data = await response.json();
      const uniqueInvestors = data
        .map((inv: any) => ({ id: inv.id, name: inv.name }))
        .sort((a: any, b: any) => a.name.localeCompare(b.name));
      setInvestors(uniqueInvestors);
    } catch (error) {
      console.error('Error fetching investors:', error);
    }
  };

  const handleQuickView = (transaction: TransactionWithInvestor) => {
    setSelectedTransaction(transaction);
    setShowTransactionModal(true);
  };

  const clearFilters = () => {
    setSearchQuery('');
    // Don't reset showPastTransactions if in calendar view (it should always be true)
    if (viewMode !== 'calendar') {
      setShowPastTransactions(false);
    }
    setTypeFilter('all');
    setDirectionFilter('all');
    setSelectedInvestors([]);
    setMinAmount('');
    setMaxAmount('');
    setMinBalance('');
    setMaxBalance('');
    setCurrentPage(1);
  };

  const hasActiveAmountFilters =
    minAmount !== '' ||
    maxAmount !== '' ||
    minBalance !== '' ||
    maxBalance !== '' ||
    selectedInvestors.length > 0;

  const hasActiveFilters =
    searchQuery !== '' ||
    // Don't count showPastTransactions as active filter in calendar view (it's always true)
    (viewMode !== 'calendar' && showPastTransactions !== false) ||
    typeFilter !== 'all' ||
    directionFilter !== 'all' ||
    hasActiveAmountFilters;

  // Filter transactions based on search and filters
  const filteredTransactions = transactions.filter((transaction) => {
    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      const matchesName = transaction.name.toLowerCase().includes(query);
      const matchesInvestor = transaction.investor.name
        .toLowerCase()
        .includes(query);
      const matchesNotes = transaction.notes?.toLowerCase().includes(query);
      if (!matchesName && !matchesInvestor && !matchesNotes) return false;
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

    // Type filter
    if (typeFilter !== 'all' && transaction.type !== typeFilter) {
      return false;
    }

    // Direction filter
    if (
      directionFilter !== 'all' &&
      transaction.direction !== directionFilter
    ) {
      return false;
    }

    // Investor filter (multiple selection)
    if (selectedInvestors.length > 0) {
      if (!selectedInvestors.includes(transaction.investor.id)) return false;
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
  });

  // Always sort by date ascending (earliest to latest)
  const sortedTransactions = [...filteredTransactions].sort((a, b) => {
    const aTime = new Date(a.date).getTime();
    const bTime = new Date(b.date).getTime();
    return aTime - bTime; // Ascending order (earliest first)
  });

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Transactions</h1>
            <p className="text-muted-foreground">
              View and manage all transactions
            </p>
          </div>
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
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight">
            Transactions
          </h1>
          <p className="text-sm sm:text-base text-muted-foreground">
            View and manage all transactions
          </p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center border rounded-lg p-1">
            <Button
              variant={viewMode === 'table' ? 'secondary' : 'ghost'}
              size="sm"
              onClick={() => setViewMode('table')}
              className="h-8 px-3"
              title="Table View"
            >
              <TableIcon className="h-4 w-4" />
            </Button>
            <Button
              variant={viewMode === 'cards' ? 'secondary' : 'ghost'}
              size="sm"
              onClick={() => setViewMode('cards')}
              className="h-8 px-3"
              title="Card View"
            >
              <LayoutGrid className="h-4 w-4" />
            </Button>
            <Button
              variant={viewMode === 'calendar' ? 'secondary' : 'ghost'}
              size="sm"
              onClick={() => setViewMode('calendar')}
              className="h-8 px-3"
              title="Calendar View"
            >
              <CalendarDays className="h-4 w-4" />
            </Button>
          </div>
          <DropdownMenu
            trigger={
              <Button className="w-full sm:w-auto">
                <PlusCircle className="mr-2 h-4 w-4" />
                New Transaction
                <ChevronDown className="ml-2 h-4 w-4" />
              </Button>
            }
            items={[
              {
                label: 'Investment',
                icon: <ArrowLeftRight className="h-4 w-4" />,
                onClick: () => router.push('/transactions/new'),
              },
              {
                label: 'Loan',
                icon: <Coins className="h-4 w-4" />,
                onClick: () => router.push('/loans/new'),
              },
            ]}
            align="end"
          />
        </div>
      </div>

      {/* Search and Filter Section */}
      <div className="flex flex-col gap-4">
        <div className="flex flex-col gap-3">
          {/* Search and Basic Filters Row */}
          <div className="flex flex-col sm:flex-row gap-3">
            {/* Search Input */}
            <SearchFilter
              value={searchQuery}
              onChange={(value) => {
                setSearchQuery(value);
                setCurrentPage(1);
              }}
              placeholder="Search by name, investor, or notes..."
            />

            {/* Show/Hide Past Transactions Filter - Hidden in calendar view */}
            {viewMode !== 'calendar' && (
              <Select
                value={showPastTransactions ? 'show' : 'hide'}
                onValueChange={(value) => {
                  setShowPastTransactions(value === 'show');
                  setCurrentPage(1);
                }}
              >
                <SelectTrigger className="w-full sm:w-[200px]">
                  <SelectValue placeholder="Past Transactions" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="hide">Hide Past</SelectItem>
                  <SelectItem value="show">Show Past</SelectItem>
                </SelectContent>
              </Select>
            )}

            {/* Type Filter */}
            <Select
              value={typeFilter}
              onValueChange={(value) => {
                setTypeFilter(value);
                setCurrentPage(1);
              }}
            >
              <SelectTrigger className="w-full sm:w-[180px]">
                <SelectValue placeholder="Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="Investment">Investment</SelectItem>
                <SelectItem value="Loan">Loan</SelectItem>
              </SelectContent>
            </Select>

            {/* Direction Filter */}
            <Select
              value={directionFilter}
              onValueChange={(value) => {
                setDirectionFilter(value);
                setCurrentPage(1);
              }}
            >
              <SelectTrigger className="w-full sm:w-[180px]">
                <SelectValue placeholder="Direction" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Directions</SelectItem>
                <SelectItem value="In">In</SelectItem>
                <SelectItem value="Out">Out</SelectItem>
              </SelectContent>
            </Select>

            {/* More Filters Button */}
            <Button
              variant={showMoreFilters ? 'secondary' : 'outline'}
              size="sm"
              onClick={() => setShowMoreFilters(!showMoreFilters)}
              className="whitespace-nowrap relative"
            >
              <Filter className="h-4 w-4 mr-2" />
              {showMoreFilters ? 'Less' : 'More'} Filters
              {hasActiveAmountFilters && (
                <span className="ml-2 flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-2 w-2 rounded-full bg-primary opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-primary"></span>
                </span>
              )}
            </Button>

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

          {/* Amount Range Filters - Collapsible */}
          {showMoreFilters && (
            <div className="space-y-3 p-4 border rounded-lg bg-muted/30 animate-in slide-in-from-top-2 duration-200">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* Amount Range */}
                <RangeFilter
                  label="Amount"
                  icon={DollarSign}
                  minValue={minAmount}
                  maxValue={maxAmount}
                  onMinChange={(value) => {
                    setMinAmount(value);
                    setCurrentPage(1);
                  }}
                  onMaxChange={(value) => {
                    setMaxAmount(value);
                    setCurrentPage(1);
                  }}
                  minPlaceholder="Min (₱)"
                  maxPlaceholder="Max (₱)"
                />

                {/* Balance Range */}
                <RangeFilter
                  label="Balance"
                  icon={TrendingUp}
                  minValue={minBalance}
                  maxValue={maxBalance}
                  onMinChange={(value) => {
                    setMinBalance(value);
                    setCurrentPage(1);
                  }}
                  onMaxChange={(value) => {
                    setMaxBalance(value);
                    setCurrentPage(1);
                  }}
                  minPlaceholder="Min (₱)"
                  maxPlaceholder="Max (₱)"
                />
              </div>

              {/* Investor Filter */}
              <div className="pt-3 border-t">
                <div>
                  <label className="text-xs font-semibold flex items-center gap-1 mb-2">
                    <Users className="h-3.5 w-3.5" />
                    Investors{' '}
                    {selectedInvestors.length > 0 &&
                      `(${selectedInvestors.length})`}
                  </label>
                  <Select value="placeholder">
                    <SelectTrigger className="w-full h-9">
                      <span className="text-sm">
                        {selectedInvestors.length === 0
                          ? 'All Investors'
                          : selectedInvestors.length === 1
                          ? investors.find((i) => i.id === selectedInvestors[0])
                              ?.name
                          : `${selectedInvestors.length} investors selected`}
                      </span>
                    </SelectTrigger>
                    <SelectContent>
                      <div className="p-2">
                        <div className="flex items-center justify-between mb-2 pb-2 border-b">
                          <span className="text-xs font-semibold">
                            Select Investors
                          </span>
                          {selectedInvestors.length > 0 && (
                            <button
                              onClick={(e) => {
                                e.preventDefault();
                                setSelectedInvestors([]);
                                setCurrentPage(1);
                              }}
                              className="text-xs text-muted-foreground hover:text-foreground"
                            >
                              Clear
                            </button>
                          )}
                        </div>
                        <div className="max-h-[200px] overflow-y-auto space-y-1">
                          {investors.map((investor) => (
                            <div
                              key={investor.id}
                              className="flex items-center gap-2 p-2 hover:bg-accent rounded cursor-pointer"
                              onClick={(e) => {
                                e.preventDefault();
                                setSelectedInvestors((prev) => {
                                  if (prev.includes(investor.id)) {
                                    return prev.filter(
                                      (id) => id !== investor.id
                                    );
                                  } else {
                                    return [...prev, investor.id];
                                  }
                                });
                                setCurrentPage(1);
                              }}
                            >
                              <div
                                className={`w-4 h-4 border rounded flex items-center justify-center ${
                                  selectedInvestors.includes(investor.id)
                                    ? 'bg-primary border-primary'
                                    : 'border-input'
                                }`}
                              >
                                {selectedInvestors.includes(investor.id) && (
                                  <svg
                                    className="w-3 h-3 text-primary-foreground"
                                    fill="none"
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth="2"
                                    viewBox="0 0 24 24"
                                    stroke="currentColor"
                                  >
                                    <path d="M5 13l4 4L19 7"></path>
                                  </svg>
                                )}
                              </div>
                              <span className="text-sm">{investor.name}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Results Count */}
        {hasActiveFilters && (
          <div className="text-sm text-muted-foreground">
            Showing {filteredTransactions.length} of {transactions.length}{' '}
            transactions
          </div>
        )}
      </div>

      {transactions.length === 0 ? (
        <EmptyState
          title="No transactions found"
          description="Create your first transaction"
          action={{
            label: 'New Transaction',
            onClick: () => router.push('/transactions/new'),
          }}
        />
      ) : filteredTransactions.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <p className="text-muted-foreground mb-4">
              No transactions match your filters
            </p>
            <Button variant="outline" onClick={clearFilters}>
              <X className="mr-2 h-4 w-4" />
              Clear filters
            </Button>
          </CardContent>
        </Card>
      ) : (
        <>
          {viewMode === 'calendar' && (
            <TransactionCalendarView
              transactions={filteredTransactions}
              onTransactionClick={(transaction) => {
                setSelectedTransaction(transaction);
                setShowTransactionModal(true);
              }}
            />
          )}

          {viewMode === 'cards' && (
            <CardPagination
              items={sortedTransactions}
              itemsPerPage={itemsPerPage}
              itemName="transactions"
              renderItems={(paginatedTransactions) => (
                <div className="grid gap-4 sm:gap-6 grid-cols-1 lg:grid-cols-2 2xl:grid-cols-3">
                  {paginatedTransactions.map((transaction) => (
                    <TransactionCard
                      key={transaction.id}
                      transaction={transaction}
                      onQuickView={handleQuickView}
                      viewHref={`/transactions/${transaction.id}`}
                    />
                  ))}
                </div>
              )}
            />
          )}

          {viewMode === 'table' && (
            <TransactionsTable
              transactions={sortedTransactions}
              itemsPerPage={itemsPerPage}
              onQuickView={handleQuickView}
            />
          )}
        </>
      )}

      {/* Transaction Detail Modal */}
      <TransactionDetailModal
        transaction={selectedTransaction}
        open={showTransactionModal}
        onOpenChange={setShowTransactionModal}
        onUpdate={fetchTransactions}
      />
    </div>
  );
}

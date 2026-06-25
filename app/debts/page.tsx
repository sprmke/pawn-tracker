'use client';

import React, { useEffect, useState } from 'react';
import { useResponsiveViewMode } from '@/hooks';
import { useRouter } from 'next/navigation';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { PlusCircle, X, Filter } from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { DebtsPageSkeleton } from '@/components/common/page-skeletons';
import type { DebtWithInvestor } from '@/lib/types';
import { DebtCard, DebtsTable, DebtDetailModal } from '@/components/debts';
import {
  SearchFilter,
  RangeFilter,
  MultiSelectFilter,
  EmptyState,
  CardPagination,
  ViewModeToggle,
  PageHeader,
} from '@/components/common';
import { DollarSign, Users } from 'lucide-react';
import { isCompletedDebt } from '@/lib/debt-calculations';
import { formatText } from '@/lib/format';

const INTERVAL_OPTIONS = [
  { value: 'Daily', label: 'Daily' },
  { value: 'Weekly', label: 'Weekly' },
  { value: 'Monthly', label: 'Monthly' },
  { value: 'Annually', label: 'Annually' },
];

export default function DebtsPage() {
  const router = useRouter();
  const [debts, setDebts] = useState<DebtWithInvestor[]>([]);
  const [investors, setInvestors] = useState<{ id: number; name: string }[]>(
    [],
  );
  const [loading, setLoading] = useState(true);

  const { viewMode, setViewMode, isReady: isViewModeReady } =
    useResponsiveViewMode<'cards' | 'table'>({
      defaultDesktopMode: 'table',
      defaultMobileMode: 'cards',
    });
  const itemsPerPage = 10;

  const [searchQuery, setSearchQuery] = useState('');
  const [showPastDebts, setShowPastDebts] = useState(false);
  const [intervalFilter, setIntervalFilter] = useState<string[]>([]);
  const [selectedInvestors, setSelectedInvestors] = useState<number[]>([]);
  const [selectedDebt, setSelectedDebt] = useState<DebtWithInvestor | null>(
    null,
  );
  const [showDebtModal, setShowDebtModal] = useState(false);
  const [minAmount, setMinAmount] = useState<string>('');
  const [maxAmount, setMaxAmount] = useState<string>('');
  const [showMoreFilters, setShowMoreFilters] = useState(false);

  useEffect(() => {
    fetchDebts();
    fetchInvestors();
  }, []);

  useEffect(() => {
    if (!loading && debts.length === 0 && viewMode === 'cards') {
      setViewMode('table');
    }
  }, [loading, debts.length, viewMode, setViewMode]);

  const fetchDebts = async () => {
    try {
      const response = await fetch('/api/debts');
      const data = await response.json();
      setDebts(data);
    } catch (error) {
      console.error('Error fetching debts:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchInvestors = async () => {
    try {
      const response = await fetch('/api/investors?simple=true');
      const data = await response.json();
      const uniqueInvestors = data
        .map((inv: { id: number; name: string }) => ({
          id: inv.id,
          name: inv.name,
        }))
        .sort((a: { name: string }, b: { name: string }) =>
          a.name.localeCompare(b.name),
        );
      setInvestors(uniqueInvestors);
    } catch (error) {
      console.error('Error fetching investors:', error);
    }
  };

  const handleQuickView = (debt: DebtWithInvestor) => {
    setSelectedDebt(debt);
    setShowDebtModal(true);
  };

  const clearFilters = () => {
    setSearchQuery('');
    setShowPastDebts(false);
    setIntervalFilter([]);
    setSelectedInvestors([]);
    setMinAmount('');
    setMaxAmount('');
  };

  const hasActiveAmountFilters =
    minAmount !== '' || maxAmount !== '' || selectedInvestors.length > 0;

  const hasActiveFilters =
    searchQuery !== '' ||
    showPastDebts ||
    intervalFilter.length > 0 ||
    hasActiveAmountFilters;

  const filteredDebts = debts.filter((debt) => {
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      const matchesName = debt.name.toLowerCase().includes(query);
      const matchesInvestor = debt.investor.name
        .toLowerCase()
        .includes(query);
      const matchesNotes = debt.notes?.toLowerCase().includes(query);
      if (!matchesName && !matchesInvestor && !matchesNotes) return false;
    }

    if (!showPastDebts && isCompletedDebt(debt)) {
      return false;
    }

    if (
      intervalFilter.length > 0 &&
      !intervalFilter.includes(debt.interestInterval)
    ) {
      return false;
    }

    if (
      selectedInvestors.length > 0 &&
      !selectedInvestors.includes(debt.investor.id)
    ) {
      return false;
    }

    const amount = parseFloat(debt.amount);
    if (minAmount !== '' && amount < parseFloat(minAmount)) return false;
    if (maxAmount !== '' && amount > parseFloat(maxAmount)) return false;

    return true;
  });

  const sortedDebts = [...filteredDebts].sort((a, b) => {
    return new Date(a.date).getTime() - new Date(b.date).getTime();
  });

  if (loading || !isViewModeReady) {
    return <DebtsPageSkeleton showTitle />;
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Borrowings"
        description="Track borrowings and projected interest costs"
        actions={
          <>
            <ViewModeToggle
              viewMode={viewMode}
              onViewModeChange={(mode) => {
                if (mode === 'table' || mode === 'cards') setViewMode(mode);
              }}
              hasData={debts.length > 0}
            />
            <Button
              className="w-full sm:w-auto h-9 px-3"
              onClick={() => router.push('/debts/new')}
            >
              <PlusCircle className="h-4 w-4 xl:mr-2" />
              <span className="hidden xl:inline">New Borrowing</span>
            </Button>
          </>
        }
      />

      <div className="flex flex-col gap-4">
        <div className="flex flex-col gap-3">
          <div className="flex flex-col sm:flex-row gap-3">
            <SearchFilter
              value={searchQuery}
              onChange={setSearchQuery}
              placeholder="Search by name, investor, or notes..."
            />

            <Select
              value={showPastDebts ? 'show' : 'hide'}
              onValueChange={(value) => setShowPastDebts(value === 'show')}
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
              options={INTERVAL_OPTIONS}
              selected={intervalFilter}
              onChange={setIntervalFilter}
              placeholder="Accrual Period"
              allLabel="All Periods"
              triggerClassName="hidden xl:flex w-full xl:w-[180px]"
            />

            <Button
              variant={showMoreFilters ? 'secondary' : 'outline'}
              size="sm"
              onClick={() => setShowMoreFilters(!showMoreFilters)}
              className="whitespace-nowrap relative h-9 px-3"
            >
              <Filter className="h-4 w-4 xl:mr-2" />
              <span className="hidden xl:inline">
                {showMoreFilters ? 'Less' : 'More'} Filters
              </span>
              {hasActiveAmountFilters && (
                <span className="ml-1 xl:ml-2 flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-2 w-2 rounded-full bg-primary opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-primary"></span>
                </span>
              )}
            </Button>

            {hasActiveFilters && (
              <Button
                variant="outline"
                size="sm"
                onClick={clearFilters}
                className="whitespace-nowrap h-9 px-3"
              >
                <X className="h-4 w-4 xl:mr-2" />
                <span className="hidden xl:inline">Clear All</span>
              </Button>
            )}
          </div>

          {showMoreFilters && (
            <div className="space-y-3 p-4 border rounded-lg bg-muted/30 animate-in slide-in-from-top-2 duration-200">
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
                      <SelectValue />
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
                    options={INTERVAL_OPTIONS}
                    selected={intervalFilter}
                    onChange={setIntervalFilter}
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
                  minValue={minAmount}
                  maxValue={maxAmount}
                  onMinChange={setMinAmount}
                  onMaxChange={setMaxAmount}
                  minPlaceholder="Min (₱)"
                  maxPlaceholder="Max (₱)"
                />
              </div>

              <div className="pt-3 border-t">
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
                          ? investors.find(
                              (i) => i.id === selectedInvestors[0],
                            )?.name
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
                              setSelectedInvestors((prev) =>
                                prev.includes(investor.id)
                                  ? prev.filter((id) => id !== investor.id)
                                  : [...prev, investor.id],
                              );
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
                            <span className="text-sm">
                              {formatText(investor.name)}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}
        </div>

        {hasActiveFilters && (
          <div className="text-sm text-muted-foreground">
            Showing {filteredDebts.length} of {debts.length} borrowings
          </div>
        )}
      </div>

      {debts.length === 0 ? (
        <EmptyState
          title="No borrowings found"
          action={{
            label: 'Create your first borrowing',
            icon: PlusCircle,
            onClick: () => router.push('/debts/new'),
          }}
        />
      ) : filteredDebts.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <p className="text-muted-foreground mb-4">
              No borrowings match your filters
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
              items={sortedDebts}
              itemsPerPage={itemsPerPage}
              itemName="borrowings"
              renderItems={(paginatedDebts) => (
                <div className="grid gap-4 sm:gap-6 grid-cols-1 lg:grid-cols-2 2xl:grid-cols-3">
                  {paginatedDebts.map((debt) => (
                    <DebtCard
                      key={debt.id}
                      debt={debt}
                      onQuickView={handleQuickView}
                      viewHref={`/debts/${debt.id}`}
                    />
                  ))}
                </div>
              )}
            />
          )}

          {viewMode === 'table' && (
            <DebtsTable
              debts={sortedDebts}
              itemsPerPage={itemsPerPage}
              onQuickView={handleQuickView}
            />
          )}
        </>
      )}

      <DebtDetailModal
        debt={selectedDebt}
        open={showDebtModal}
        onOpenChange={setShowDebtModal}
        onUpdate={fetchDebts}
      />
    </div>
  );
}

'use client';

import React from 'react';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useOverdueCheck } from '@/hooks';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import Link from 'next/link';
import {
  PlusCircle,
  ArrowUpDown,
  ChevronLeft,
  ChevronRight,
  DollarSign,
  Users,
  Calendar,
  MapPin,
  X,
  Filter,
  TrendingUp,
} from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { LoanWithInvestors } from '@/lib/types';
import { getLoanStatusBadge, getLoanTypeBadge } from '@/lib/badge-config';
import { LoanCalendarView } from '@/components/loans/loan-calendar-view';
import { LoanDetailModal } from '@/components/loans/loan-detail-modal';
import {
  calculateTotalInterest,
  calculateAverageRate,
  calculateTransactionStats,
} from '@/lib/calculations';
import { loansCSVColumns } from '@/lib/csv-columns';
import {
  InvestorTransactionCard,
  LoansTable,
  ActionButtonsGroup,
  SearchFilter,
  RangeFilter,
  CardPagination,
  InlineLoader,
  ViewModeToggle,
  PageHeader,
  DateListWithViewMore,
  ExportButton,
  SyncCalendarButton,
} from '@/components/common';

type SortField =
  | 'loanName'
  | 'type'
  | 'status'
  | 'dueDate'
  | 'totalPrincipal'
  | 'avgRate'
  | 'totalInterest'
  | 'totalAmount'
  | 'investors'
  | 'freeLot';
type SortDirection = 'asc' | 'desc';

export default function LoansPage() {
  const router = useRouter();
  const [loans, setLoans] = useState<LoanWithInvestors[]>([]);
  const [investors, setInvestors] = useState<{ id: number; name: string }[]>(
    []
  );
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<'cards' | 'table' | 'calendar'>(
    'table'
  );
  const [sortField, setSortField] = useState<SortField>('dueDate');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');
  const itemsPerPage = 10;
  const [expandedInvestors, setExpandedInvestors] = useState<Set<number>>(
    new Set()
  );
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [freeLotFilter, setFreeLotFilter] = useState<string>('all');
  const [selectedInvestors, setSelectedInvestors] = useState<number[]>([]);
  const [selectedLoan, setSelectedLoan] = useState<LoanWithInvestors | null>(
    null
  );
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Automatically check for overdue loans and periods
  useOverdueCheck();

  // Amount range filters
  const [minPrincipal, setMinPrincipal] = useState<string>('');
  const [maxPrincipal, setMaxPrincipal] = useState<string>('');
  const [minAvgRate, setMinAvgRate] = useState<string>('');
  const [maxAvgRate, setMaxAvgRate] = useState<string>('');
  const [minInterest, setMinInterest] = useState<string>('');
  const [maxInterest, setMaxInterest] = useState<string>('');
  const [minTotalAmount, setMinTotalAmount] = useState<string>('');
  const [maxTotalAmount, setMaxTotalAmount] = useState<string>('');
  const [showMoreFilters, setShowMoreFilters] = useState(false);

  // Force cards view on mobile screens
  useEffect(() => {
    const handleResize = () => {
      const isMobile = window.innerWidth < 768; // md breakpoint
      if (isMobile) {
        setViewMode((current) => (current === 'table' ? 'cards' : current));
      }
    };

    // Check on mount
    handleResize();

    // Listen for window resize
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    fetchLoans();
    fetchInvestors();
  }, []);

  // Reset to table view if no data and currently on cards/calendar view
  useEffect(() => {
    if (
      loans.length === 0 &&
      (viewMode === 'cards' || viewMode === 'calendar')
    ) {
      setViewMode('table');
    }
  }, [loans.length, viewMode]);

  const fetchLoans = async () => {
    try {
      const response = await fetch('/api/loans');
      const data = await response.json();
      setLoans(data);
    } catch (error) {
      console.error('Error fetching loans:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchInvestors = async () => {
    try {
      const response = await fetch('/api/investors');
      const data = await response.json();

      // Check if response is an error
      if (!response.ok || !Array.isArray(data)) {
        console.error('Error fetching investors:', data);
        setInvestors([]);
        return;
      }

      // Extract unique investors and sort by name
      const uniqueInvestors = data
        .map((inv: any) => ({ id: inv.id, name: inv.name }))
        .sort((a: any, b: any) => a.name.localeCompare(b.name));
      setInvestors(uniqueInvestors);
    } catch (error) {
      console.error('Error fetching investors:', error);
      setInvestors([]);
    }
  };

  const formatCurrency = (amount: string) => {
    return new Intl.NumberFormat('en-PH', {
      style: 'currency',
      currency: 'PHP',
    }).format(parseFloat(amount));
  };

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString('en-PH', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const toggleInvestors = (loanId: number, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setExpandedInvestors((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(loanId)) {
        newSet.delete(loanId);
      } else {
        newSet.add(loanId);
      }
      return newSet;
    });
  };

  const getTotalPrincipal = (loan: LoanWithInvestors) => {
    return loan.loanInvestors.reduce(
      (sum, li) => sum + parseFloat(li.amount),
      0
    );
  };

  const getAverageRate = (loan: LoanWithInvestors) => {
    return calculateAverageRate(loan.loanInvestors);
  };

  const getTotalInterest = (loan: LoanWithInvestors) => {
    return calculateTotalInterest(loan.loanInvestors);
  };

  const getTotalAmount = (loan: LoanWithInvestors) => {
    const principal = getTotalPrincipal(loan);
    const interest = getTotalInterest(loan);
    return principal + interest;
  };

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const clearFilters = () => {
    setSearchQuery('');
    setStatusFilter('all');
    setTypeFilter('all');
    setFreeLotFilter('all');
    setSelectedInvestors([]);
    setMinPrincipal('');
    setMaxPrincipal('');
    setMinAvgRate('');
    setMaxAvgRate('');
    setMinInterest('');
    setMaxInterest('');
    setMinTotalAmount('');
    setMaxTotalAmount('');
  };

  const hasActiveAmountFilters =
    minPrincipal !== '' ||
    maxPrincipal !== '' ||
    minAvgRate !== '' ||
    maxAvgRate !== '' ||
    minInterest !== '' ||
    maxInterest !== '' ||
    minTotalAmount !== '' ||
    maxTotalAmount !== '' ||
    freeLotFilter !== 'all' ||
    selectedInvestors.length > 0;

  const hasActiveFilters =
    searchQuery !== '' ||
    statusFilter !== 'all' ||
    typeFilter !== 'all' ||
    hasActiveAmountFilters;

  // Filter loans based on search and filters
  const filteredLoans = loans.filter((loan) => {
    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      const matchesName = loan.loanName.toLowerCase().includes(query);
      const matchesNotes = loan.notes?.toLowerCase().includes(query);
      if (!matchesName && !matchesNotes) return false;
    }

    // Status filter
    if (statusFilter !== 'all' && loan.status !== statusFilter) {
      return false;
    }

    // Type filter
    if (typeFilter !== 'all' && loan.type !== typeFilter) {
      return false;
    }

    // Free lot filter
    if (freeLotFilter !== 'all') {
      if (freeLotFilter === 'with' && !loan.freeLotSqm) return false;
      if (freeLotFilter === 'without' && loan.freeLotSqm) return false;
    }

    // Investor filter (multiple selection)
    if (selectedInvestors.length > 0) {
      const hasSelectedInvestor = loan.loanInvestors.some((li) =>
        selectedInvestors.includes(li.investor.id)
      );
      if (!hasSelectedInvestor) return false;
    }

    // Calculate loan amounts for filtering
    const totalPrincipal = getTotalPrincipal(loan);
    const totalInterest = getTotalInterest(loan);
    const avgRate = getAverageRate(loan);
    const totalAmount = getTotalAmount(loan);

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

  const sortedLoans = [...filteredLoans].sort((a, b) => {
    let aValue: any;
    let bValue: any;

    switch (sortField) {
      case 'loanName':
        aValue = a.loanName.toLowerCase();
        bValue = b.loanName.toLowerCase();
        break;
      case 'type':
        aValue = a.type;
        bValue = b.type;
        break;
      case 'status':
        aValue = a.status;
        bValue = b.status;
        break;
      case 'dueDate':
        aValue = new Date(a.dueDate).getTime();
        bValue = new Date(b.dueDate).getTime();
        break;
      case 'totalPrincipal':
        aValue = getTotalPrincipal(a);
        bValue = getTotalPrincipal(b);
        break;
      case 'avgRate':
        const aTotalPrincipal = getTotalPrincipal(a);
        const aTotalInterest = a.loanInvestors.reduce((sum, li) => {
          const capital = parseFloat(li.amount);
          const rate = parseFloat(li.interestRate) / 100;
          return sum + capital * rate;
        }, 0);
        aValue =
          aTotalPrincipal > 0 ? (aTotalInterest / aTotalPrincipal) * 100 : 0;

        const bTotalPrincipal = getTotalPrincipal(b);
        const bTotalInterest = b.loanInvestors.reduce((sum, li) => {
          const capital = parseFloat(li.amount);
          const rate = parseFloat(li.interestRate) / 100;
          return sum + capital * rate;
        }, 0);
        bValue =
          bTotalPrincipal > 0 ? (bTotalInterest / bTotalPrincipal) * 100 : 0;
        break;
      case 'totalInterest':
        aValue = a.loanInvestors.reduce((sum, li) => {
          const capital = parseFloat(li.amount);
          const rate = parseFloat(li.interestRate) / 100;
          return sum + capital * rate;
        }, 0);
        bValue = b.loanInvestors.reduce((sum, li) => {
          const capital = parseFloat(li.amount);
          const rate = parseFloat(li.interestRate) / 100;
          return sum + capital * rate;
        }, 0);
        break;
      case 'totalAmount':
        const aPrincipal = getTotalPrincipal(a);
        const aInterest = a.loanInvestors.reduce((sum, li) => {
          const capital = parseFloat(li.amount);
          const rate = parseFloat(li.interestRate) / 100;
          return sum + capital * rate;
        }, 0);
        aValue = aPrincipal + aInterest;

        const bPrincipal = getTotalPrincipal(b);
        const bInterest = b.loanInvestors.reduce((sum, li) => {
          const capital = parseFloat(li.amount);
          const rate = parseFloat(li.interestRate) / 100;
          return sum + capital * rate;
        }, 0);
        bValue = bPrincipal + bInterest;
        break;
      case 'investors':
        aValue = new Set(a.loanInvestors.map((li) => li.investor.id)).size;
        bValue = new Set(b.loanInvestors.map((li) => li.investor.id)).size;
        break;
      case 'freeLot':
        aValue = a.freeLotSqm || 0;
        bValue = b.freeLotSqm || 0;
        break;
      default:
        return 0;
    }

    if (aValue < bValue) return sortDirection === 'asc' ? -1 : 1;
    if (aValue > bValue) return sortDirection === 'asc' ? 1 : -1;
    return 0;
  });

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">Loans</h1>
            <p className="text-muted-foreground">Manage all your pawn loans</p>
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
      <PageHeader
        title="Loans"
        description="Manage all your pawn loans"
        actions={
          <>
            <ViewModeToggle
              viewMode={viewMode}
              onViewModeChange={setViewMode}
              showCalendar={true}
              hasData={loans.length > 0}
            />
            <SyncCalendarButton variant="outline" size="default" />
            <ExportButton
              data={loans}
              filteredData={sortedLoans}
              columns={loansCSVColumns}
              filename="loans"
              variant="outline"
              size="default"
            />
            <Link href="/loans/new">
              <Button className="w-full sm:w-auto">
                <PlusCircle className="mr-2 h-4 w-4" />
                New Loan
              </Button>
            </Link>
          </>
        }
      />

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
              }}
              placeholder="Search loans by name or notes..."
            />

            {/* Status Filter - Hidden on Mobile */}
            <Select
              value={statusFilter}
              onValueChange={(value) => {
                setStatusFilter(value);
              }}
            >
              <SelectTrigger className="hidden sm:flex w-full sm:w-[180px]">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="Fully Funded">Fully Funded</SelectItem>
                <SelectItem value="Partially Funded">
                  Partially Funded
                </SelectItem>
                <SelectItem value="Completed">Completed</SelectItem>
                <SelectItem value="Overdue">Overdue</SelectItem>
              </SelectContent>
            </Select>

            {/* Type Filter - Hidden on Mobile */}
            <Select
              value={typeFilter}
              onValueChange={(value) => {
                setTypeFilter(value);
              }}
            >
              <SelectTrigger className="hidden sm:flex w-full sm:w-[180px]">
                <SelectValue placeholder="Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="Lot Title">Lot Title</SelectItem>
                <SelectItem value="OR/CR">OR/CR</SelectItem>
                <SelectItem value="Agent">Agent</SelectItem>
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
              {/* Mobile-only Basic Filters */}
              <div className="grid grid-cols-2 gap-3 pb-3 border-b sm:hidden">
                {/* Status Filter - Mobile */}
                <div>
                  <label className="text-xs font-semibold mb-2 block">
                    Status
                  </label>
                  <Select
                    value={statusFilter}
                    onValueChange={(value) => {
                      setStatusFilter(value);
                    }}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Status</SelectItem>
                      <SelectItem value="Fully Funded">Fully Funded</SelectItem>
                      <SelectItem value="Partially Funded">
                        Partially Funded
                      </SelectItem>
                      <SelectItem value="Completed">Completed</SelectItem>
                      <SelectItem value="Overdue">Overdue</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Type Filter - Mobile */}
                <div>
                  <label className="text-xs font-semibold mb-2 block">
                    Type
                  </label>
                  <Select
                    value={typeFilter}
                    onValueChange={(value) => {
                      setTypeFilter(value);
                    }}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Types</SelectItem>
                      <SelectItem value="Lot Title">Lot Title</SelectItem>
                      <SelectItem value="OR/CR">OR/CR</SelectItem>
                      <SelectItem value="Agent">Agent</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                {/* Total Principal Range */}
                <RangeFilter
                  label="Total Principal"
                  icon={DollarSign}
                  minValue={minPrincipal}
                  maxValue={maxPrincipal}
                  onMinChange={(value) => {
                    setMinPrincipal(value);
                  }}
                  onMaxChange={(value) => {
                    setMaxPrincipal(value);
                  }}
                  minPlaceholder="Min (₱)"
                  maxPlaceholder="Max (₱)"
                />

                {/* Average Rate Range */}
                <RangeFilter
                  label="Avg. Rate"
                  icon={TrendingUp}
                  minValue={minAvgRate}
                  maxValue={maxAvgRate}
                  onMinChange={(value) => {
                    setMinAvgRate(value);
                  }}
                  onMaxChange={(value) => {
                    setMaxAvgRate(value);
                  }}
                  minPlaceholder="Min (%)"
                  maxPlaceholder="Max (%)"
                />

                {/* Total Interest Range */}
                <RangeFilter
                  label="Total Interest"
                  icon={TrendingUp}
                  minValue={minInterest}
                  maxValue={maxInterest}
                  onMinChange={(value) => {
                    setMinInterest(value);
                  }}
                  onMaxChange={(value) => {
                    setMaxInterest(value);
                  }}
                  minPlaceholder="Min (₱)"
                  maxPlaceholder="Max (₱)"
                />

                {/* Total Amount Range */}
                <RangeFilter
                  label="Total Amount"
                  icon={DollarSign}
                  minValue={minTotalAmount}
                  maxValue={maxTotalAmount}
                  onMinChange={(value) => {
                    setMinTotalAmount(value);
                  }}
                  onMaxChange={(value) => {
                    setMaxTotalAmount(value);
                  }}
                  minPlaceholder="Min (₱)"
                  maxPlaceholder="Max (₱)"
                />
              </div>

              {/* Free Lot and Investor Filters */}
              <div className="pt-3 border-t grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
                {/* Free Lot Filter */}
                <div>
                  <label className="text-xs font-semibold flex items-center gap-1 mb-2">
                    <MapPin className="h-3.5 w-3.5" />
                    Free Lot
                  </label>
                  <Select
                    value={freeLotFilter}
                    onValueChange={(value) => {
                      setFreeLotFilter(value);
                    }}
                  >
                    <SelectTrigger className="w-full h-9">
                      <SelectValue placeholder="All Lots" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Lots</SelectItem>
                      <SelectItem value="with">With Free Lot</SelectItem>
                      <SelectItem value="without">Without Free Lot</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Investor Filter - Multi-select */}
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
            Showing {filteredLoans.length} of {loans.length} loans
          </div>
        )}
      </div>

      {loans.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <p className="text-muted-foreground mb-4">No loans found</p>
            <Link href="/loans/new">
              <Button>
                <PlusCircle className="mr-2 h-4 w-4" />
                Create your first loan
              </Button>
            </Link>
          </CardContent>
        </Card>
      ) : filteredLoans.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <p className="text-muted-foreground mb-4">
              No loans match your filters
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
            <>
              <LoanCalendarView
                loans={filteredLoans}
                onLoanClick={(loan) => {
                  setSelectedLoan(loan);
                  setIsModalOpen(true);
                }}
              />
              <LoanDetailModal
                loan={selectedLoan}
                open={isModalOpen}
                onOpenChange={setIsModalOpen}
              />
            </>
          )}

          {viewMode === 'cards' && (
            <CardPagination
              items={sortedLoans}
              itemsPerPage={itemsPerPage}
              itemName="loans"
              renderItems={(paginatedLoans) => (
                <div className="grid gap-4 sm:gap-6 grid-cols-1 lg:grid-cols-2 2xl:grid-cols-3">
                  {paginatedLoans.map((loan) => (
                    <Card
                      key={loan.id}
                      className="hover:shadow-lg transition-shadow h-full"
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
                            variant={getLoanStatusBadge(loan.status).variant}
                            className={`text-[10px] ${
                              getLoanStatusBadge(loan.status).className || ''
                            }`}
                          >
                            {loan.status}
                          </Badge>
                        </div>
                      </CardHeader>
                      <CardContent className="space-y-4 px-4">
                        {/* Summary Section */}
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                          <div className="p-2 bg-muted/50 rounded-lg">
                            <p className="text-[10px] text-muted-foreground mb-1">
                              Total Principal
                            </p>
                            <p className="text-sm font-medium break-words">
                              {formatCurrency(
                                getTotalPrincipal(loan).toString()
                              )}
                            </p>
                          </div>
                          <div className="p-2 bg-muted/50 rounded-lg">
                            <p className="text-[10px] text-muted-foreground mb-1">
                              Avg. Rate
                            </p>
                            <p className="text-sm font-medium">
                              {getAverageRate(loan).toFixed(2)}%
                            </p>
                          </div>
                          <div className="p-2 bg-muted/50 rounded-lg">
                            <p className="text-[10px] text-muted-foreground mb-1">
                              Total Interest
                            </p>
                            <p className="text-sm font-medium break-words">
                              {formatCurrency(
                                getTotalInterest(loan).toString()
                              )}
                            </p>
                          </div>
                          <div className="p-2 bg-muted/50 rounded-lg">
                            <p className="text-[10px] text-muted-foreground mb-1">
                              Total Amount
                            </p>
                            <p className="text-sm font-medium break-words">
                              {formatCurrency(getTotalAmount(loan).toString())}
                            </p>
                          </div>
                          <div className="p-2 bg-muted/50 rounded-lg">
                            <p className="text-[10px] text-muted-foreground mb-1">
                              Sent Date
                            </p>
                            {(() => {
                              // Get unique sent dates
                              const uniqueDates = Array.from(
                                new Set(
                                  loan.loanInvestors.map(
                                    (li) =>
                                      new Date(li.sentDate)
                                        .toISOString()
                                        .split('T')[0]
                                  )
                                )
                              )
                                .map((dateStr) => new Date(dateStr))
                                .sort((a, b) => a.getTime() - b.getTime());

                              return (
                                <DateListWithViewMore
                                  dates={uniqueDates}
                                  limit={3}
                                  dialogTitle="All Sent Dates"
                                  title={loan.loanName}
                                  getItemClassName={(date, hasUnpaid) =>
                                    `${
                                      uniqueDates.length > 1
                                        ? 'text-[10px]'
                                        : 'text-xs'
                                    } px-2 py-0.5 rounded inline-block font-medium ${
                                      hasUnpaid ? 'bg-yellow-200' : ''
                                    }`
                                  }
                                  checkUnpaid={(date) => {
                                    const dateStr = date
                                      .toISOString()
                                      .split('T')[0];
                                    return loan.loanInvestors.some(
                                      (li) =>
                                        new Date(li.sentDate)
                                          .toISOString()
                                          .split('T')[0] === dateStr &&
                                        !li.isPaid
                                    );
                                  }}
                                />
                              );
                            })()}
                          </div>
                          <div className="p-2 bg-muted/50 rounded-lg">
                            <p className="text-[10px] text-muted-foreground mb-1">
                              Due Date
                            </p>
                            {(() => {
                              // Collect all unique due dates
                              const dueDateSet = new Set<string>();

                              // Add main loan due date
                              dueDateSet.add(
                                new Date(loan.dueDate)
                                  .toISOString()
                                  .split('T')[0]
                              );

                              // Add interest period due dates
                              loan.loanInvestors.forEach((li) => {
                                if (
                                  li.hasMultipleInterest &&
                                  li.interestPeriods
                                ) {
                                  li.interestPeriods.forEach((period) => {
                                    dueDateSet.add(
                                      new Date(period.dueDate)
                                        .toISOString()
                                        .split('T')[0]
                                    );
                                  });
                                }
                              });

                              const uniqueDates = Array.from(dueDateSet)
                                .map((dateStr) => new Date(dateStr))
                                .sort((a, b) => a.getTime() - b.getTime());

                              return (
                                <DateListWithViewMore
                                  dates={uniqueDates}
                                  limit={3}
                                  dialogTitle="All Due Dates"
                                  title={loan.loanName}
                                  getItemClassName={(date) =>
                                    `${
                                      uniqueDates.length > 1
                                        ? 'text-[10px]'
                                        : 'text-xs'
                                    } px-2 py-0.5 rounded inline-block font-medium`
                                  }
                                />
                              );
                            })()}
                          </div>
                        </div>

                        {/* Action Buttons */}
                        <div className="pt-2 border-t">
                          <ActionButtonsGroup
                            isExpanded={expandedInvestors.has(loan.id)}
                            onToggle={(e) => toggleInvestors(loan.id, e)}
                            viewHref={`/loans/${loan.id}`}
                            onQuickView={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              setSelectedLoan(loan);
                              setIsModalOpen(true);
                            }}
                            showToggle={true}
                            showView={false}
                            size="md"
                          />
                        </div>

                        {/* Notes & Investors Section - Only shown when expanded */}
                        {expandedInvestors.has(loan.id) && (
                          <div className="space-y-3">
                            {/* Investors Section */}
                            {loan.loanInvestors.length > 0 && (
                              <div className="pt-2 border-t">
                                <div className="space-y-3">
                                  {(() => {
                                    // Group by investor
                                    const investorMap = new Map<
                                      number,
                                      Array<(typeof loan.loanInvestors)[0]>
                                    >();
                                    loan.loanInvestors.forEach((li) => {
                                      const existing =
                                        investorMap.get(li.investor.id) || [];
                                      existing.push(li);
                                      investorMap.set(li.investor.id, existing);
                                    });

                                    return Array.from(investorMap.values()).map(
                                      (transactions) => {
                                        const investor =
                                          transactions[0].investor;

                                        // Calculate totals
                                        const stats =
                                          calculateTransactionStats(
                                            transactions
                                          );
                                        const totalPrincipal =
                                          stats.totalPrincipal;
                                        const totalInterest =
                                          stats.totalInterest;
                                        const avgRate = stats.averageRate;
                                        const total = stats.total;

                                        return (
                                          <InvestorTransactionCard
                                            key={investor.id}
                                            investorName={investor.name}
                                            transactions={transactions}
                                            totalPrincipal={totalPrincipal}
                                            avgRate={avgRate}
                                            totalInterest={totalInterest}
                                            total={total}
                                          />
                                        );
                                      }
                                    );
                                  })()}
                                </div>
                              </div>
                            )}
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            />
          )}

          {viewMode === 'table' && (
            <LoansTable
              loans={sortedLoans}
              itemsPerPage={itemsPerPage}
              expandedRows={expandedInvestors}
              onToggleExpand={(loanId) => {
                setExpandedInvestors((prev) => {
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
                setIsModalOpen(true);
              }}
            />
          )}
        </>
      )}

      {/* Quick View Modal for Cards and Table */}
      {(viewMode === 'cards' || viewMode === 'table') && (
        <LoanDetailModal
          loan={selectedLoan}
          open={isModalOpen}
          onOpenChange={setIsModalOpen}
          onUpdate={fetchLoans}
        />
      )}
    </div>
  );
}

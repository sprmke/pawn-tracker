'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
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
  LayoutGrid,
  Table as TableIcon,
  ArrowUpDown,
  ChevronLeft,
  ChevronRight,
  DollarSign,
  Users,
  Calendar,
  MapPin,
  ChevronDown,
  ChevronUp,
  Eye,
  Search,
  X,
  Filter,
  TrendingUp,
  CalendarDays,
} from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { LoanWithInvestors } from '@/lib/types';
import { getLoanStatusBadge, getLoanTypeBadge } from '@/lib/badge-config';
import { LoanCalendarView } from '@/components/loans/loan-calendar-view';
import { LoanDetailModal } from '@/components/loans/loan-detail-modal';

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
    'cards'
  );
  const [sortField, setSortField] = useState<SortField>('dueDate');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');
  const [currentPage, setCurrentPage] = useState(1);
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

  useEffect(() => {
    fetchLoans();
    fetchInvestors();
  }, []);

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
      // Extract unique investors and sort by name
      const uniqueInvestors = data
        .map((inv: any) => ({ id: inv.id, name: inv.name }))
        .sort((a: any, b: any) => a.name.localeCompare(b.name));
      setInvestors(uniqueInvestors);
    } catch (error) {
      console.error('Error fetching investors:', error);
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

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
    setCurrentPage(1); // Reset to first page when sorting
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
    setCurrentPage(1);
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
    const totalInterest = loan.loanInvestors.reduce((sum, li) => {
      const capital = parseFloat(li.amount);
      const rate = parseFloat(li.interestRate) / 100;
      return sum + capital * rate;
    }, 0);
    const avgRate =
      totalPrincipal > 0 ? (totalInterest / totalPrincipal) * 100 : 0;
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

  // Pagination
  const totalPages = Math.ceil(sortedLoans.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedLoans = sortedLoans.slice(startIndex, endIndex);

  const SortButton = ({
    field,
    children,
  }: {
    field: SortField;
    children: React.ReactNode;
  }) => (
    <button
      onClick={() => handleSort(field)}
      className="flex items-center gap-1 hover:text-foreground transition-colors"
    >
      {children}
      <ArrowUpDown className="h-3 w-3" />
    </button>
  );

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Loans</h1>
            <p className="text-muted-foreground">Manage all your pawn loans</p>
          </div>
        </div>
        <Card>
          <CardContent className="flex items-center justify-center py-12">
            <p className="text-muted-foreground">Loading loans...</p>
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
            Loans
          </h1>
          <p className="text-sm sm:text-base text-muted-foreground">
            Manage all your pawn loans
          </p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center border rounded-lg p-1">
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
              variant={viewMode === 'table' ? 'secondary' : 'ghost'}
              size="sm"
              onClick={() => setViewMode('table')}
              className="h-8 px-3"
              title="Table View"
            >
              <TableIcon className="h-4 w-4" />
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
          <Link href="/loans/new">
            <Button className="w-full sm:w-auto">
              <PlusCircle className="mr-2 h-4 w-4" />
              New Loan
            </Button>
          </Link>
        </div>
      </div>

      {/* Search and Filter Section */}
      <div className="flex flex-col gap-4">
        <div className="flex flex-col gap-3">
          {/* Search and Basic Filters Row */}
          <div className="flex flex-col sm:flex-row gap-3">
            {/* Search Input */}
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search loans by name or notes..."
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setCurrentPage(1);
                }}
                className="pl-9 pr-9"
              />
              {searchQuery && (
                <button
                  onClick={() => {
                    setSearchQuery('');
                    setCurrentPage(1);
                  }}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>

            {/* Status Filter */}
            <Select
              value={statusFilter}
              onValueChange={(value) => {
                setStatusFilter(value);
                setCurrentPage(1);
              }}
            >
              <SelectTrigger className="w-full sm:w-[180px]">
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
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                {/* Total Principal Range */}
                <div className="space-y-2">
                  <label className="text-xs font-semibold flex items-center gap-1">
                    <DollarSign className="h-3.5 w-3.5" />
                    Total Principal
                  </label>
                  <div className="flex items-center gap-2">
                    <Input
                      type="number"
                      placeholder="Min (₱)"
                      value={minPrincipal}
                      onChange={(e) => {
                        setMinPrincipal(e.target.value);
                        setCurrentPage(1);
                      }}
                      className="h-9 text-sm"
                    />
                    <span className="text-muted-foreground">-</span>
                    <Input
                      type="number"
                      placeholder="Max (₱)"
                      value={maxPrincipal}
                      onChange={(e) => {
                        setMaxPrincipal(e.target.value);
                        setCurrentPage(1);
                      }}
                      className="h-9 text-sm"
                    />
                  </div>
                </div>

                {/* Average Rate Range */}
                <div className="space-y-2">
                  <label className="text-xs font-semibold flex items-center gap-1">
                    <TrendingUp className="h-3.5 w-3.5" />
                    Avg. Rate
                  </label>
                  <div className="flex items-center gap-2">
                    <Input
                      type="number"
                      placeholder="Min (%)"
                      value={minAvgRate}
                      onChange={(e) => {
                        setMinAvgRate(e.target.value);
                        setCurrentPage(1);
                      }}
                      className="h-9 text-sm"
                    />
                    <span className="text-muted-foreground">-</span>
                    <Input
                      type="number"
                      placeholder="Max (%)"
                      value={maxAvgRate}
                      onChange={(e) => {
                        setMaxAvgRate(e.target.value);
                        setCurrentPage(1);
                      }}
                      className="h-9 text-sm"
                    />
                  </div>
                </div>

                {/* Total Interest Range */}
                <div className="space-y-2">
                  <label className="text-xs font-semibold flex items-center gap-1">
                    <TrendingUp className="h-3.5 w-3.5" />
                    Total Interest
                  </label>
                  <div className="flex items-center gap-2">
                    <Input
                      type="number"
                      placeholder="Min (₱)"
                      value={minInterest}
                      onChange={(e) => {
                        setMinInterest(e.target.value);
                        setCurrentPage(1);
                      }}
                      className="h-9 text-sm"
                    />
                    <span className="text-muted-foreground">-</span>
                    <Input
                      type="number"
                      placeholder="Max (₱)"
                      value={maxInterest}
                      onChange={(e) => {
                        setMaxInterest(e.target.value);
                        setCurrentPage(1);
                      }}
                      className="h-9 text-sm"
                    />
                  </div>
                </div>

                {/* Total Amount Range */}
                <div className="space-y-2">
                  <label className="text-xs font-semibold flex items-center gap-1">
                    <DollarSign className="h-3.5 w-3.5" />
                    Total Amount
                  </label>
                  <div className="flex items-center gap-2">
                    <Input
                      type="number"
                      placeholder="Min (₱)"
                      value={minTotalAmount}
                      onChange={(e) => {
                        setMinTotalAmount(e.target.value);
                        setCurrentPage(1);
                      }}
                      className="h-9 text-sm"
                    />
                    <span className="text-muted-foreground">-</span>
                    <Input
                      type="number"
                      placeholder="Max (₱)"
                      value={maxTotalAmount}
                      onChange={(e) => {
                        setMaxTotalAmount(e.target.value);
                        setCurrentPage(1);
                      }}
                      className="h-9 text-sm"
                    />
                  </div>
                </div>
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
                      setCurrentPage(1);
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
            <div className="grid gap-4 sm:gap-6 grid-cols-1 lg:grid-cols-2 2xl:grid-cols-3">
              {sortedLoans.map((loan) => (
                <Card
                  key={loan.id}
                  className="hover:shadow-lg transition-shadow h-full"
                >
                  <CardHeader>
                    <div className="flex items-start justify-between gap-2">
                      <div className="space-y-1 flex-1 min-w-0">
                        <CardTitle className="text-lg sm:text-xl truncate">
                          {loan.loanName}
                        </CardTitle>
                      </div>
                      <Badge
                        variant={getLoanTypeBadge(loan.type).variant}
                        className={`text-xs ${
                          getLoanTypeBadge(loan.type).className || ''
                        }`}
                      >
                        {loan.type}
                      </Badge>
                      <Badge
                        variant={getLoanStatusBadge(loan.status).variant}
                        className={getLoanStatusBadge(loan.status).className}
                      >
                        {loan.status}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {/* Summary Section */}
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                      <div className="p-3 bg-muted/50 rounded-lg">
                        <p className="text-[10px] text-muted-foreground mb-1">
                          Total Principal
                        </p>
                        <p className="text-sm font-bold break-words">
                          {formatCurrency(getTotalPrincipal(loan).toString())}
                        </p>
                      </div>
                      <div className="p-3 bg-muted/50 rounded-lg">
                        <p className="text-[10px] text-muted-foreground mb-1">
                          Avg. Rate
                        </p>
                        <p className="text-sm font-bold">
                          {(() => {
                            const totalPrincipal = getTotalPrincipal(loan);
                            const totalInterest = loan.loanInvestors.reduce(
                              (sum, li) => {
                                const capital = parseFloat(li.amount);
                                const rate = parseFloat(li.interestRate) / 100;
                                return sum + capital * rate;
                              },
                              0
                            );
                            const avgRate =
                              totalPrincipal > 0
                                ? (totalInterest / totalPrincipal) * 100
                                : 0;
                            return `${avgRate.toFixed(2)}%`;
                          })()}
                        </p>
                      </div>
                      <div className="p-3 bg-muted/50 rounded-lg">
                        <p className="text-[10px] text-muted-foreground mb-1">
                          Total Interest
                        </p>
                        <p className="text-sm font-bold break-words">
                          {formatCurrency(
                            loan.loanInvestors
                              .reduce((sum, li) => {
                                const capital = parseFloat(li.amount);
                                const rate = parseFloat(li.interestRate) / 100;
                                return sum + capital * rate;
                              }, 0)
                              .toString()
                          )}
                        </p>
                      </div>
                      <div className="p-3 bg-muted/50 rounded-lg">
                        <p className="text-[10px] text-muted-foreground mb-1">
                          Total Amount
                        </p>
                        <p className="text-sm font-bold break-words">
                          {(() => {
                            const totalPrincipal = getTotalPrincipal(loan);
                            const totalInterest = loan.loanInvestors.reduce(
                              (sum, li) => {
                                const capital = parseFloat(li.amount);
                                const rate = parseFloat(li.interestRate) / 100;
                                return sum + capital * rate;
                              },
                              0
                            );
                            return formatCurrency(
                              (totalPrincipal + totalInterest).toString()
                            );
                          })()}
                        </p>
                      </div>
                      <div className="p-3 bg-muted/50 rounded-lg">
                        <p className="text-[10px] text-muted-foreground mb-1">
                          Due Date
                        </p>
                        <p className="text-sm font-bold">
                          {new Date(loan.dueDate).toLocaleDateString('en-US', {
                            month: 'short',
                            day: 'numeric',
                            year: 'numeric',
                          })}
                        </p>
                      </div>
                      <div className="p-3 bg-muted/50 rounded-lg">
                        <p className="text-[10px] text-muted-foreground mb-1">
                          Free Lot
                        </p>
                        <p className="text-sm font-bold">
                          {loan.freeLotSqm ? `${loan.freeLotSqm} sqm` : '-'}
                        </p>
                      </div>
                    </div>

                    {/* Toggle Buttons */}
                    <div className="pt-2 border-t flex gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="flex-1 h-8 text-xs"
                        onClick={(e) => toggleInvestors(loan.id, e)}
                      >
                        {expandedInvestors.has(loan.id) ? (
                          <>
                            <ChevronUp className="h-3 w-3 mr-1" />
                            Hide
                          </>
                        ) : (
                          <>
                            <ChevronDown className="h-3 w-3 mr-1" />
                            More
                          </>
                        )}
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="flex-1 h-8 text-xs"
                        onClick={() => router.push(`/loans/${loan.id}`)}
                      >
                        <Eye className="h-3 w-3 mr-1" />
                        View
                      </Button>
                    </div>

                    {/* Notes & Investors Section - Only shown when expanded */}
                    {expandedInvestors.has(loan.id) && (
                      <div className="space-y-3">
                        {/* Investors Section */}
                        {loan.loanInvestors.length > 0 && (
                          <div className="pt-2 border-t">
                            <p className="text-xs text-muted-foreground mb-3">
                              Investors:
                            </p>
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
                                    const investor = transactions[0].investor;

                                    // Calculate totals
                                    const totalPrincipal = transactions.reduce(
                                      (sum, t) => sum + parseFloat(t.amount),
                                      0
                                    );
                                    const totalInterest = transactions.reduce(
                                      (sum, t) => {
                                        const capital = parseFloat(t.amount);
                                        const rate =
                                          parseFloat(t.interestRate) / 100;
                                        return sum + capital * rate;
                                      },
                                      0
                                    );
                                    const avgRate =
                                      totalPrincipal > 0
                                        ? (totalInterest / totalPrincipal) * 100
                                        : 0;
                                    const total =
                                      totalPrincipal + totalInterest;

                                    // Get comma-separated dates
                                    const dates = transactions
                                      .map((t) =>
                                        new Date(t.sentDate).toLocaleDateString(
                                          'en-US',
                                          {
                                            month: 'short',
                                            day: 'numeric',
                                          }
                                        )
                                      )
                                      .join(', ');

                                    // Check if any transaction has a future sent date
                                    const today = new Date();
                                    today.setHours(0, 0, 0, 0);
                                    const hasFutureSentDate = transactions.some(
                                      (t) => {
                                        const sentDate = new Date(t.sentDate);
                                        sentDate.setHours(0, 0, 0, 0);
                                        return sentDate > today;
                                      }
                                    );

                                    return (
                                      <div
                                        key={investor.id}
                                        className="space-y-1.5"
                                      >
                                        <div className="flex items-center justify-between gap-2">
                                          <span className="text-xs font-semibold">
                                            {investor.name}
                                          </span>
                                          <span className="text-[10px] text-muted-foreground">
                                            {dates}
                                          </span>
                                        </div>
                                        <div
                                          className={`pl-3 py-2 rounded text-[11px] ${
                                            hasFutureSentDate
                                              ? 'bg-yellow-50'
                                              : 'bg-muted/30'
                                          }`}
                                        >
                                          <div className="grid grid-cols-4 gap-2">
                                            <div>
                                              <span className="text-muted-foreground block text-[10px]">
                                                Principal
                                              </span>
                                              <span className="font-medium text-foreground">
                                                {formatCurrency(
                                                  totalPrincipal.toString()
                                                )}
                                              </span>
                                            </div>
                                            <div>
                                              <span className="text-muted-foreground block text-[10px]">
                                                Avg. Rate
                                              </span>
                                              <span className="text-foreground">
                                                {avgRate.toFixed(2)}%
                                              </span>
                                            </div>
                                            <div>
                                              <span className="text-muted-foreground block text-[10px]">
                                                Interest
                                              </span>
                                              <span className="text-foreground">
                                                {formatCurrency(
                                                  totalInterest.toString()
                                                )}
                                              </span>
                                            </div>
                                            <div>
                                              <span className="text-muted-foreground block text-[10px]">
                                                Total
                                              </span>
                                              <span className="font-semibold text-foreground">
                                                {formatCurrency(
                                                  total.toString()
                                                )}
                                              </span>
                                            </div>
                                          </div>
                                        </div>
                                      </div>
                                    );
                                  }
                                );
                              })()}
                            </div>
                          </div>
                        )}
                        {/* Notes Section */}
                        <div className="pt-2 border-t">
                          <p className="text-xs text-muted-foreground mb-2">
                            Notes:
                          </p>
                          <p className="text-xs">{loan.notes ?? '-'}</p>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          {viewMode === 'table' && (
            <Card>
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>
                          <SortButton field="loanName">Loan Name</SortButton>
                        </TableHead>
                        <TableHead>
                          <SortButton field="type">Type</SortButton>
                        </TableHead>
                        <TableHead>
                          <SortButton field="status">Status</SortButton>
                        </TableHead>
                        <TableHead>
                          <SortButton field="dueDate">Due Date</SortButton>
                        </TableHead>
                        <TableHead>
                          <SortButton field="totalPrincipal">
                            Total Principal
                          </SortButton>
                        </TableHead>
                        <TableHead>
                          <SortButton field="avgRate">Avg. Rate</SortButton>
                        </TableHead>
                        <TableHead>
                          <SortButton field="totalInterest">
                            Total Interest
                          </SortButton>
                        </TableHead>
                        <TableHead>
                          <SortButton field="totalAmount">
                            Total Amount
                          </SortButton>
                        </TableHead>
                        <TableHead>
                          <SortButton field="investors">Investors</SortButton>
                        </TableHead>
                        <TableHead>
                          <SortButton field="freeLot">Free Lot</SortButton>
                        </TableHead>
                        <TableHead className="text-center">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {paginatedLoans.map((loan) => {
                        const totalPrincipal = getTotalPrincipal(loan);
                        const totalInterest = loan.loanInvestors.reduce(
                          (sum, li) => {
                            const capital = parseFloat(li.amount);
                            const rate = parseFloat(li.interestRate) / 100;
                            return sum + capital * rate;
                          },
                          0
                        );
                        const avgRate =
                          totalPrincipal > 0
                            ? (totalInterest / totalPrincipal) * 100
                            : 0;
                        const totalAmount = totalPrincipal + totalInterest;
                        const uniqueInvestors = new Set(
                          loan.loanInvestors.map((li) => li.investor.id)
                        ).size;

                        // Check if any transaction has a future sent date
                        const today = new Date();
                        today.setHours(0, 0, 0, 0);
                        const hasFutureSentDate = loan.loanInvestors.some(
                          (li) => {
                            const sentDate = new Date(li.sentDate);
                            sentDate.setHours(0, 0, 0, 0);
                            return sentDate > today;
                          }
                        );

                        return (
                          <>
                            <TableRow
                              key={loan.id}
                              className={
                                hasFutureSentDate
                                  ? 'bg-yellow-50 hover:bg-yellow-100'
                                  : 'hover:bg-muted/50'
                              }
                            >
                              <TableCell className="font-medium">
                                {loan.loanName}
                              </TableCell>
                              <TableCell>
                                <Badge
                                  variant={getLoanTypeBadge(loan.type).variant}
                                  className={
                                    getLoanTypeBadge(loan.type).className
                                  }
                                >
                                  {loan.type}
                                </Badge>
                              </TableCell>
                              <TableCell>
                                <Badge
                                  variant={
                                    getLoanStatusBadge(loan.status).variant
                                  }
                                  className={
                                    getLoanStatusBadge(loan.status).className
                                  }
                                >
                                  {loan.status}
                                </Badge>
                              </TableCell>
                              <TableCell className="text-sm">
                                {new Date(loan.dueDate).toLocaleDateString(
                                  'en-US',
                                  {
                                    month: 'short',
                                    day: 'numeric',
                                    year: 'numeric',
                                  }
                                )}
                              </TableCell>
                              <TableCell className="font-semibold">
                                {formatCurrency(totalPrincipal.toString())}
                              </TableCell>
                              <TableCell className="text-sm">
                                {avgRate.toFixed(2)}%
                              </TableCell>
                              <TableCell className="font-medium">
                                {formatCurrency(totalInterest.toString())}
                              </TableCell>
                              <TableCell className="font-bold">
                                {formatCurrency(totalAmount.toString())}
                              </TableCell>
                              <TableCell>
                                <span className="text-sm font-medium">
                                  {uniqueInvestors}
                                </span>
                              </TableCell>
                              <TableCell className="text-sm">
                                {loan.freeLotSqm
                                  ? `${loan.freeLotSqm} sqm`
                                  : '-'}
                              </TableCell>
                              <TableCell>
                                <div className="flex items-center justify-end gap-1">
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    className="h-7 text-xs"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      toggleInvestors(loan.id, e);
                                    }}
                                  >
                                    {expandedInvestors.has(loan.id) ? (
                                      <>
                                        <ChevronUp className="h-3 w-3 mr-1" />
                                        Hide
                                      </>
                                    ) : (
                                      <>
                                        <ChevronDown className="h-3 w-3 mr-1" />
                                        More
                                      </>
                                    )}
                                  </Button>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    className="h-7 text-xs"
                                    onClick={() =>
                                      router.push(`/loans/${loan.id}`)
                                    }
                                  >
                                    <Eye className="h-3 w-3 mr-1" />
                                    View
                                  </Button>
                                </div>
                              </TableCell>
                            </TableRow>

                            {/* Expanded Row - Notes & Investors */}
                            {expandedInvestors.has(loan.id) && (
                              <TableRow key={`${loan.id}-expanded`}>
                                <TableCell
                                  colSpan={11}
                                  className="bg-muted/30 p-4"
                                >
                                  <div className="space-y-4">
                                    {/* Investors Section */}
                                    {loan.loanInvestors.length > 0 && (
                                      <div>
                                        <p className="text-xs font-semibold text-muted-foreground mb-3">
                                          Investors:
                                        </p>
                                        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                                          {(() => {
                                            // Group by investor
                                            const investorMap = new Map<
                                              number,
                                              Array<
                                                (typeof loan.loanInvestors)[0]
                                              >
                                            >();
                                            loan.loanInvestors.forEach((li) => {
                                              const existing =
                                                investorMap.get(
                                                  li.investor.id
                                                ) || [];
                                              existing.push(li);
                                              investorMap.set(
                                                li.investor.id,
                                                existing
                                              );
                                            });

                                            return Array.from(
                                              investorMap.values()
                                            ).map((transactions) => {
                                              const investor =
                                                transactions[0].investor;

                                              // Calculate totals
                                              const totalPrincipal =
                                                transactions.reduce(
                                                  (sum, t) =>
                                                    sum + parseFloat(t.amount),
                                                  0
                                                );
                                              const totalInterest =
                                                transactions.reduce(
                                                  (sum, t) => {
                                                    const capital = parseFloat(
                                                      t.amount
                                                    );
                                                    const rate =
                                                      parseFloat(
                                                        t.interestRate
                                                      ) / 100;
                                                    return sum + capital * rate;
                                                  },
                                                  0
                                                );
                                              const avgRate =
                                                totalPrincipal > 0
                                                  ? (totalInterest /
                                                      totalPrincipal) *
                                                    100
                                                  : 0;
                                              const total =
                                                totalPrincipal + totalInterest;

                                              // Get comma-separated dates
                                              const dates = transactions
                                                .map((t) =>
                                                  new Date(
                                                    t.sentDate
                                                  ).toLocaleDateString(
                                                    'en-US',
                                                    {
                                                      month: 'short',
                                                      day: 'numeric',
                                                    }
                                                  )
                                                )
                                                .join(', ');

                                              // Check if any transaction has a future sent date
                                              const today = new Date();
                                              today.setHours(0, 0, 0, 0);
                                              const hasFutureSentDate =
                                                transactions.some((t) => {
                                                  const sentDate = new Date(
                                                    t.sentDate
                                                  );
                                                  sentDate.setHours(0, 0, 0, 0);
                                                  return sentDate > today;
                                                });

                                              return (
                                                <div
                                                  key={investor.id}
                                                  className={`space-y-1.5 p-3 rounded-lg border ${
                                                    hasFutureSentDate
                                                      ? 'bg-yellow-50'
                                                      : 'bg-background'
                                                  }`}
                                                >
                                                  <div className="flex items-center justify-between gap-2">
                                                    <span className="text-sm font-semibold">
                                                      {investor.name}
                                                    </span>
                                                    <span className="text-[10px] text-muted-foreground">
                                                      {dates}
                                                    </span>
                                                  </div>
                                                  <div className="grid grid-cols-2 gap-2 text-xs">
                                                    <div>
                                                      <span className="text-muted-foreground block text-[10px]">
                                                        Principal
                                                      </span>
                                                      <span className="font-medium">
                                                        {formatCurrency(
                                                          totalPrincipal.toString()
                                                        )}
                                                      </span>
                                                    </div>
                                                    <div>
                                                      <span className="text-muted-foreground block text-[10px]">
                                                        Avg. Rate
                                                      </span>
                                                      <span>
                                                        {avgRate.toFixed(2)}%
                                                      </span>
                                                    </div>
                                                    <div>
                                                      <span className="text-muted-foreground block text-[10px]">
                                                        Interest
                                                      </span>
                                                      <span>
                                                        {formatCurrency(
                                                          totalInterest.toString()
                                                        )}
                                                      </span>
                                                    </div>
                                                    <div>
                                                      <span className="text-muted-foreground block text-[10px]">
                                                        Total
                                                      </span>
                                                      <span className="font-semibold">
                                                        {formatCurrency(
                                                          total.toString()
                                                        )}
                                                      </span>
                                                    </div>
                                                  </div>
                                                </div>
                                              );
                                            });
                                          })()}
                                        </div>
                                      </div>
                                    )}
                                    {/* Notes Section */}
                                    <div>
                                      <p className="text-xs font-semibold text-muted-foreground mb-2">
                                        Notes:
                                      </p>
                                      <p className="text-sm">
                                        {loan.notes ?? '-'}
                                      </p>
                                    </div>
                                  </div>
                                </TableCell>
                              </TableRow>
                            )}
                          </>
                        );
                      })}
                    </TableBody>
                  </Table>
                </div>

                {/* Pagination Controls */}
                {totalPages > 1 && (
                  <div className="flex items-center justify-between px-4 py-4 border-t">
                    <div className="text-sm text-muted-foreground">
                      Showing {startIndex + 1} to{' '}
                      {Math.min(endIndex, sortedLoans.length)} of{' '}
                      {sortedLoans.length} loans
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setCurrentPage(currentPage - 1)}
                        disabled={currentPage === 1}
                      >
                        <ChevronLeft className="h-4 w-4" />
                        Previous
                      </Button>
                      <div className="flex items-center gap-1">
                        {Array.from(
                          { length: totalPages },
                          (_, i) => i + 1
                        ).map((page) => (
                          <Button
                            key={page}
                            variant={
                              currentPage === page ? 'default' : 'outline'
                            }
                            size="sm"
                            onClick={() => setCurrentPage(page)}
                            className="w-8 h-8 p-0"
                          >
                            {page}
                          </Button>
                        ))}
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setCurrentPage(currentPage + 1)}
                        disabled={currentPage === totalPages}
                      >
                        Next
                        <ChevronRight className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </>
      )}
    </div>
  );
}

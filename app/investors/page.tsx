'use client';

import { useEffect, useState } from 'react';
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
  ArrowRight,
  TrendingUp,
  DollarSign,
  LayoutGrid,
  Table as TableIcon,
  ArrowUpDown,
  ChevronLeft,
  ChevronRight,
  UserPlus,
  Search,
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
import { Input } from '@/components/ui/input';
import { InvestorWithLoans } from '@/lib/types';

type SortField =
  | 'name'
  | 'email'
  | 'totalCapital'
  | 'totalInterest'
  | 'totalLoans'
  | 'currentBalance';
type SortDirection = 'asc' | 'desc';

interface InvestorStats {
  totalCapital: number;
  totalInterest: number;
  activeLoans: number;
  currentBalance: number;
  totalLoans: number;
  completedLoans: number;
  overdueLoans: number;
  totalGain: number;
}

export default function InvestorsPage() {
  const [investors, setInvestors] = useState<InvestorWithLoans[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<'cards' | 'table'>('cards');
  const [sortField, setSortField] = useState<SortField>('name');
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  const [searchQuery, setSearchQuery] = useState('');

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

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-PH', {
      style: 'currency',
      currency: 'PHP',
    }).format(amount);
  };

  const getInvestorStats = (investor: InvestorWithLoans): InvestorStats => {
    const totalCapital = investor.loanInvestors.reduce(
      (sum, li) => sum + parseFloat(li.amount),
      0
    );

    const totalInterest = investor.loanInvestors.reduce((sum, li) => {
      const amount = parseFloat(li.amount);
      const rate = parseFloat(li.interestRate) / 100;
      return sum + amount * rate;
    }, 0);

    const activeLoans = investor.loanInvestors.filter(
      (li) =>
        li.loan.status === 'Fully Funded' ||
        li.loan.status === 'Partially Funded'
    ).length;

    const completedLoans = investor.loanInvestors.filter(
      (li) => li.loan.status === 'Completed'
    ).length;

    const overdueLoans = investor.loanInvestors.filter(
      (li) => li.loan.status === 'Overdue'
    ).length;

    // Get latest balance from transactions
    const latestTransaction =
      investor.transactions.length > 0
        ? investor.transactions.sort(
            (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
          )[0]
        : null;

    const currentBalance = latestTransaction
      ? parseFloat(latestTransaction.balance)
      : 0;

    const totalGain = totalCapital + totalInterest;

    return {
      totalCapital,
      totalInterest,
      activeLoans,
      currentBalance,
      totalLoans: investor.loanInvestors.length,
      completedLoans,
      overdueLoans,
      totalGain,
    };
  };

  const getBalanceStatus = (balance: number) => {
    if (balance > 100000)
      return { status: 'Can invest', variant: 'default' as const };
    if (balance > 50000)
      return { status: 'Low funds', variant: 'secondary' as const };
    return { status: 'No funds', variant: 'destructive' as const };
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
    setLoanStatusFilter('all');
    setMinBalance('');
    setMaxBalance('');
    setMinCapital('');
    setMaxCapital('');
    setMinInterest('');
    setMaxInterest('');
    setMinGain('');
    setMaxGain('');
    setCurrentPage(1);
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
    const stats = getInvestorStats(investor);

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

  const sortedInvestors = [...filteredInvestors].sort((a, b) => {
    const aStats = getInvestorStats(a);
    const bStats = getInvestorStats(b);
    let aValue: any;
    let bValue: any;

    switch (sortField) {
      case 'name':
        aValue = a.name.toLowerCase();
        bValue = b.name.toLowerCase();
        break;
      case 'email':
        aValue = a.email.toLowerCase();
        bValue = b.email.toLowerCase();
        break;
      case 'totalCapital':
        aValue = aStats.totalCapital;
        bValue = bStats.totalCapital;
        break;
      case 'totalInterest':
        aValue = aStats.totalInterest;
        bValue = bStats.totalInterest;
        break;
      case 'totalLoans':
        aValue = aStats.totalLoans;
        bValue = bStats.totalLoans;
        break;
      case 'currentBalance':
        aValue = aStats.currentBalance;
        bValue = bStats.currentBalance;
        break;
      default:
        return 0;
    }

    if (aValue < bValue) return sortDirection === 'asc' ? -1 : 1;
    if (aValue > bValue) return sortDirection === 'asc' ? 1 : -1;
    return 0;
  });

  // Pagination
  const totalPages = Math.ceil(sortedInvestors.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedInvestors = sortedInvestors.slice(startIndex, endIndex);

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
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search investors by name or email..."
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

            {/* Loan Status Filter */}
            <Select
              value={loanStatusFilter}
              onValueChange={(value) => {
                setLoanStatusFilter(value);
                setCurrentPage(1);
              }}
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
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 p-4 border rounded-lg bg-muted/30 animate-in slide-in-from-top-2 duration-200">
              {/* Current Balance Range */}
              <div className="space-y-2">
                <label className="text-xs font-semibold flex items-center gap-1">
                  <DollarSign className="h-3.5 w-3.5" />
                  Current Balance
                </label>
                <div className="flex items-center gap-2">
                  <Input
                    type="number"
                    placeholder="Min (₱)"
                    value={minBalance}
                    onChange={(e) => {
                      setMinBalance(e.target.value);
                      setCurrentPage(1);
                    }}
                    className="h-9 text-sm"
                  />
                  <span className="text-muted-foreground">-</span>
                  <Input
                    type="number"
                    placeholder="Max (₱)"
                    value={maxBalance}
                    onChange={(e) => {
                      setMaxBalance(e.target.value);
                      setCurrentPage(1);
                    }}
                    className="h-9 text-sm"
                  />
                </div>
              </div>

              {/* Total Capital Range */}
              <div className="space-y-2">
                <label className="text-xs font-semibold flex items-center gap-1">
                  <DollarSign className="h-3.5 w-3.5" />
                  Total Capital
                </label>
                <div className="flex items-center gap-2">
                  <Input
                    type="number"
                    placeholder="Min (₱)"
                    value={minCapital}
                    onChange={(e) => {
                      setMinCapital(e.target.value);
                      setCurrentPage(1);
                    }}
                    className="h-9 text-sm"
                  />
                  <span className="text-muted-foreground">-</span>
                  <Input
                    type="number"
                    placeholder="Max (₱)"
                    value={maxCapital}
                    onChange={(e) => {
                      setMaxCapital(e.target.value);
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

              {/* Total Gain Range */}
              <div className="space-y-2">
                <label className="text-xs font-semibold flex items-center gap-1">
                  <TrendingUp className="h-3.5 w-3.5" />
                  Total Gain
                </label>
                <div className="flex items-center gap-2">
                  <Input
                    type="number"
                    placeholder="Min (₱)"
                    value={minGain}
                    onChange={(e) => {
                      setMinGain(e.target.value);
                      setCurrentPage(1);
                    }}
                    className="h-9 text-sm"
                  />
                  <span className="text-muted-foreground">-</span>
                  <Input
                    type="number"
                    placeholder="Max (₱)"
                    value={maxGain}
                    onChange={(e) => {
                      setMaxGain(e.target.value);
                      setCurrentPage(1);
                    }}
                    className="h-9 text-sm"
                  />
                </div>
              </div>
            </div>
          )}
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
              {sortedInvestors.map((investor) => {
                const stats = getInvestorStats(investor);
                const balanceStatus = getBalanceStatus(stats.currentBalance);

                return (
                  <Link key={investor.id} href={`/investors/${investor.id}`}>
                    <Card className="hover:shadow-lg transition-shadow h-full">
                      <CardHeader>
                        <div className="flex items-start justify-between gap-2">
                          <div className="space-y-1 flex-1 min-w-0">
                            <CardTitle className="text-lg sm:text-xl truncate">
                              {investor.name}
                            </CardTitle>
                            <p className="text-xs sm:text-sm text-muted-foreground truncate">
                              {investor.email}
                            </p>
                          </div>
                          <ArrowRight className="h-5 w-5 text-muted-foreground flex-shrink-0" />
                        </div>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div className="grid grid-cols-2 gap-3 sm:gap-4">
                          <div className="space-y-1">
                            <div className="flex items-center gap-1 text-muted-foreground">
                              <DollarSign className="h-3 w-3 flex-shrink-0" />
                              <p className="text-xs">Total Capital</p>
                            </div>
                            <p className="text-base sm:text-lg font-semibold break-words">
                              {formatCurrency(stats.totalCapital)}
                            </p>
                          </div>
                          <div className="space-y-1">
                            <div className="flex items-center gap-1 text-muted-foreground">
                              <TrendingUp className="h-3 w-3 flex-shrink-0" />
                              <p className="text-xs">Total Interest</p>
                            </div>
                            <p className="text-base sm:text-lg font-semibold break-words">
                              {formatCurrency(stats.totalInterest)}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center justify-between pt-2 border-t">
                          <div className="text-sm">
                            <span className="text-muted-foreground">
                              Loans:
                            </span>{' '}
                            <span className="font-medium">
                              {stats.totalLoans}
                            </span>
                            {stats.activeLoans > 0 && (
                              <span className="text-muted-foreground">
                                {' '}
                                ({stats.activeLoans} active)
                              </span>
                            )}
                          </div>
                          <Badge variant={balanceStatus.variant}>
                            {balanceStatus.status}
                          </Badge>
                        </div>

                        <div className="pt-2 border-t">
                          <div className="flex items-center justify-between gap-2">
                            <span className="text-xs sm:text-sm text-muted-foreground">
                              Current Balance
                            </span>
                            <span className="text-base sm:text-lg font-semibold break-words text-right">
                              {formatCurrency(stats.currentBalance)}
                            </span>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </Link>
                );
              })}
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
                          <SortButton field="name">Name</SortButton>
                        </TableHead>
                        <TableHead>
                          <SortButton field="email">Email</SortButton>
                        </TableHead>
                        <TableHead className="text-right">
                          <SortButton field="totalCapital">
                            Total Capital
                          </SortButton>
                        </TableHead>
                        <TableHead className="text-right">
                          <SortButton field="totalInterest">
                            Total Interest
                          </SortButton>
                        </TableHead>
                        <TableHead>
                          <SortButton field="totalLoans">Loans</SortButton>
                        </TableHead>
                        <TableHead className="text-right">
                          <SortButton field="currentBalance">
                            Current Balance
                          </SortButton>
                        </TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="w-[50px]"></TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {paginatedInvestors.map((investor) => {
                        const stats = getInvestorStats(investor);
                        const balanceStatus = getBalanceStatus(
                          stats.currentBalance
                        );

                        return (
                          <TableRow
                            key={investor.id}
                            className="cursor-pointer"
                          >
                            <TableCell className="font-medium">
                              <Link
                                href={`/investors/${investor.id}`}
                                className="hover:underline"
                              >
                                {investor.name}
                              </Link>
                            </TableCell>
                            <TableCell className="text-muted-foreground">
                              {investor.email}
                            </TableCell>
                            <TableCell className="font-semibold">
                              {formatCurrency(stats.totalCapital)}
                            </TableCell>
                            <TableCell className="font-semibold">
                              {formatCurrency(stats.totalInterest)}
                            </TableCell>
                            <TableCell>
                              <div className="flex flex-col gap-1">
                                <span className="font-semibold">
                                  {stats.totalLoans}
                                </span>
                                {stats.activeLoans > 0 && (
                                  <span className="text-xs text-muted-foreground">
                                    ({stats.activeLoans} active)
                                  </span>
                                )}
                              </div>
                            </TableCell>
                            <TableCell className="font-semibold">
                              {formatCurrency(stats.currentBalance)}
                            </TableCell>
                            <TableCell>
                              <Badge variant={balanceStatus.variant}>
                                {balanceStatus.status}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <Link href={`/investors/${investor.id}`}>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="h-8 w-8 p-0"
                                >
                                  <ArrowRight className="h-4 w-4" />
                                </Button>
                              </Link>
                            </TableCell>
                          </TableRow>
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
                      {Math.min(endIndex, sortedInvestors.length)} of{' '}
                      {sortedInvestors.length} investors
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

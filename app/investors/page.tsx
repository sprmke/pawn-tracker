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
} from 'lucide-react';
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
}

export default function InvestorsPage() {
  const [investors, setInvestors] = useState<InvestorWithLoans[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<'cards' | 'table'>('cards');
  const [sortField, setSortField] = useState<SortField>('name');
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

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

    return {
      totalCapital,
      totalInterest,
      activeLoans,
      currentBalance,
      totalLoans: investor.loanInvestors.length,
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

  const sortedInvestors = [...investors].sort((a, b) => {
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
      ) : (
        <>
          {viewMode === 'cards' && (
            <div className="grid gap-4 sm:gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {investors.map((investor) => {
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

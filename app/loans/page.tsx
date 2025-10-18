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
} from 'lucide-react';
import { LoanWithInvestors } from '@/lib/types';
import { getLoanStatusBadge, getLoanTypeBadge } from '@/lib/badge-config';

type SortField =
  | 'loanName'
  | 'type'
  | 'status'
  | 'dueDate'
  | 'totalPrincipal'
  | 'investors';
type SortDirection = 'asc' | 'desc';

export default function LoansPage() {
  const router = useRouter();
  const [loans, setLoans] = useState<LoanWithInvestors[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<'cards' | 'table'>('cards');
  const [sortField, setSortField] = useState<SortField>('dueDate');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  useEffect(() => {
    fetchLoans();
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

  const sortedLoans = [...loans].sort((a, b) => {
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
      case 'investors':
        aValue = a.loanInvestors.length;
        bValue = b.loanInvestors.length;
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
          <Link href="/loans/new">
            <Button className="w-full sm:w-auto">
              <PlusCircle className="mr-2 h-4 w-4" />
              New Loan
            </Button>
          </Link>
        </div>
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
      ) : (
        <>
          {viewMode === 'cards' && (
            <div className="grid gap-4 sm:gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {loans.map((loan) => (
                <Link href={`/loans/${loan.id}`} key={loan.id}>
                  <Card className="hover:shadow-lg transition-shadow h-full cursor-pointer">
                    <CardHeader>
                      <div className="flex items-start justify-between gap-2">
                        <div className="space-y-1 flex-1 min-w-0">
                          <CardTitle className="text-lg sm:text-xl truncate">
                            {loan.loanName}
                          </CardTitle>
                          <div className="flex items-center gap-1.5 text-xs sm:text-sm text-muted-foreground">
                            <Badge
                              variant={getLoanTypeBadge(loan.type).variant}
                              className={`text-xs ${
                                getLoanTypeBadge(loan.type).className || ''
                              }`}
                            >
                              {loan.type}
                            </Badge>
                          </div>
                        </div>
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
                                  const rate =
                                    parseFloat(li.interestRate) / 100;
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
                                  const rate =
                                    parseFloat(li.interestRate) / 100;
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
                                  const rate =
                                    parseFloat(li.interestRate) / 100;
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
                            {new Date(loan.dueDate).toLocaleDateString(
                              'en-US',
                              {
                                month: 'short',
                                day: 'numeric',
                                year: 'numeric',
                              }
                            )}
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
                                  const total = totalPrincipal + totalInterest;

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
                                      <div className="pl-3 py-2 bg-muted/30 rounded text-[11px]">
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
                                              {formatCurrency(total.toString())}
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
                    </CardContent>
                  </Card>
                </Link>
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
                          <SortButton field="investors">Investors</SortButton>
                        </TableHead>
                        <TableHead>Free Lot</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {paginatedLoans.map((loan) => (
                        <TableRow
                          key={loan.id}
                          className="cursor-pointer hover:bg-muted/50"
                          onClick={() => router.push(`/loans/${loan.id}`)}
                        >
                          <TableCell className="font-medium">
                            {loan.loanName}
                          </TableCell>
                          <TableCell>
                            <Badge
                              variant={getLoanTypeBadge(loan.type).variant}
                              className={getLoanTypeBadge(loan.type).className}
                            >
                              {loan.type}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <Badge
                              variant={getLoanStatusBadge(loan.status).variant}
                              className={
                                getLoanStatusBadge(loan.status).className
                              }
                            >
                              {loan.status}
                            </Badge>
                          </TableCell>
                          <TableCell>{formatDate(loan.dueDate)}</TableCell>
                          <TableCell className="font-semibold">
                            {formatCurrency(getTotalPrincipal(loan).toString())}
                          </TableCell>
                          <TableCell>
                            <div className="flex flex-col gap-1">
                              {loan.loanInvestors.length > 0 && (
                                <div className="flex flex-col gap-1 items-start">
                                  {loan.loanInvestors.map((li) => (
                                    <Badge
                                      key={li.id}
                                      variant="secondary"
                                      className="text-xs"
                                    >
                                      {li.investor.name}
                                    </Badge>
                                  ))}
                                </div>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>
                            {loan.freeLotSqm ? `${loan.freeLotSqm} sqm` : '-'}
                          </TableCell>
                        </TableRow>
                      ))}
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

'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
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
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">
            Loans
          </h1>
          <p className="text-sm sm:text-base text-muted-foreground">
            Manage all your pawn loans
          </p>
        </div>
        <Link href="/loans/new">
          <Button className="w-full sm:w-auto">
            <PlusCircle className="mr-2 h-4 w-4" />
            New Loan
          </Button>
        </Link>
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
        <Tabs defaultValue="cards" className="w-full">
          <TabsList className="grid w-full max-w-[400px] grid-cols-2">
            <TabsTrigger value="cards" className="flex items-center gap-2">
              <LayoutGrid className="h-4 w-4" />
              Cards
            </TabsTrigger>
            <TabsTrigger value="table" className="flex items-center gap-2">
              <TableIcon className="h-4 w-4" />
              Table
            </TabsTrigger>
          </TabsList>

          <TabsContent value="cards" className="mt-6">
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
                            <Badge variant="outline" className="text-xs">
                              {loan.type}
                            </Badge>
                          </div>
                        </div>
                        <Badge
                          variant={
                            loan.status === 'Fully Funded'
                              ? 'default'
                              : loan.status === 'Partially Funded'
                              ? 'secondary'
                              : loan.status === 'Completed'
                              ? 'default'
                              : 'destructive'
                          }
                        >
                          {loan.status}
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="grid grid-cols-2 gap-3 sm:gap-4">
                        <div className="space-y-1">
                          <div className="flex items-center gap-1 text-muted-foreground">
                            <DollarSign className="h-3 w-3 flex-shrink-0" />
                            <p className="text-xs">Total Principal</p>
                          </div>
                          <p className="text-base sm:text-lg font-semibold break-words">
                            {formatCurrency(getTotalPrincipal(loan).toString())}
                          </p>
                        </div>
                        <div className="space-y-1">
                          <div className="flex items-center gap-1 text-muted-foreground">
                            <Users className="h-3 w-3 flex-shrink-0" />
                            <p className="text-xs">Investors</p>
                          </div>
                          <p className="text-base sm:text-lg font-semibold">
                            {loan.loanInvestors.length}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center justify-between pt-2 border-t">
                        <div className="flex items-center gap-1.5 text-sm">
                          <Calendar className="h-3.5 w-3.5 text-muted-foreground flex-shrink-0" />
                          <span className="text-muted-foreground">Due:</span>
                          <span className="font-medium">
                            {formatDate(loan.dueDate)}
                          </span>
                        </div>
                        {loan.freeLotSqm && (
                          <div className="flex items-center gap-1.5 text-sm">
                            <MapPin className="h-3.5 w-3.5 text-muted-foreground flex-shrink-0" />
                            <span className="font-medium">
                              {loan.freeLotSqm} sqm
                            </span>
                          </div>
                        )}
                      </div>

                      {loan.loanInvestors.length > 0 && (
                        <div className="pt-2 border-t">
                          <p className="text-xs text-muted-foreground mb-2">
                            Investors:
                          </p>
                          <div className="flex flex-wrap gap-1.5">
                            {loan.loanInvestors.map((li) => (
                              <Badge
                                key={li.id}
                                variant="secondary"
                                className="text-xs"
                              >
                                {li.investor.name}: {formatCurrency(li.amount)}{' '}
                                @ {li.interestRate}%
                              </Badge>
                            ))}
                          </div>
                        </div>
                      )}

                      {loan.notes && (
                        <div className="pt-2 border-t">
                          <p className="text-xs text-muted-foreground mb-1">
                            Notes:
                          </p>
                          <p className="text-sm line-clamp-2">{loan.notes}</p>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="table" className="mt-6">
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
                            <Badge variant="outline">{loan.type}</Badge>
                          </TableCell>
                          <TableCell>
                            <Badge
                              variant={
                                loan.status === 'Fully Funded'
                                  ? 'default'
                                  : loan.status === 'Partially Funded'
                                  ? 'secondary'
                                  : loan.status === 'Completed'
                                  ? 'default'
                                  : 'destructive'
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
          </TabsContent>
        </Tabs>
      )}
    </div>
  );
}

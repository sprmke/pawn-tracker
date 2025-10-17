import { db } from '@/db';
import { investors } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ArrowLeft, TrendingUp, DollarSign, Activity } from 'lucide-react';
import Link from 'next/link';
import { notFound } from 'next/navigation';

async function getInvestor(id: number) {
  try {
    const investor = await db.query.investors.findFirst({
      where: eq(investors.id, id),
      with: {
        loanInvestors: {
          with: {
            loan: true,
          },
        },
        transactions: {
          orderBy: (transactions, { desc }) => [desc(transactions.date)],
        },
      },
    });
    return investor;
  } catch (error) {
    console.error('Error fetching investor:', error);
    return null;
  }
}

export default async function InvestorDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const resolvedParams = await params;
  const investorId = parseInt(resolvedParams.id);
  const investor = await getInvestor(investorId);

  if (!investor) {
    notFound();
  }

  const formatCurrency = (amount: string | number) => {
    const value = typeof amount === 'string' ? parseFloat(amount) : amount;
    return new Intl.NumberFormat('en-PH', {
      style: 'currency',
      currency: 'PHP',
    }).format(value);
  };

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString('en-PH', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  // Calculate loans & gains
  const totalCapital = investor.loanInvestors.reduce(
    (sum, li) => sum + parseFloat(li.amount),
    0
  );

  const totalInterest = investor.loanInvestors.reduce((sum, li) => {
    const amount = parseFloat(li.amount);
    const rate = parseFloat(li.interestRate) / 100;
    return sum + amount * rate;
  }, 0);

  const totalGains = totalCapital + totalInterest;

  // Get balance status
  const latestTransaction = investor.transactions[0];
  const currentBalance = latestTransaction ? parseFloat(latestTransaction.balance) : 0;

  const getBalanceStatus = (balance: number) => {
    if (balance > 100000) return { status: 'Can invest', variant: 'success' as const, color: 'text-green-600' };
    if (balance > 50000) return { status: 'Low funds', variant: 'warning' as const, color: 'text-yellow-600' };
    return { status: 'No funds', variant: 'destructive' as const, color: 'text-red-600' };
  };

  const balanceStatus = getBalanceStatus(currentBalance);

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/investors">
          <Badge variant="outline" className="cursor-pointer hover:bg-muted">
            <ArrowLeft className="mr-1 h-3 w-3" />
            Back
          </Badge>
        </Link>
      </div>

      <div>
        <h1 className="text-3xl font-bold tracking-tight">{investor.name}</h1>
        <p className="text-muted-foreground">{investor.email}</p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Capital</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(totalCapital)}</div>
            <p className="text-xs text-muted-foreground">
              Invested in {investor.loanInvestors.length} loan(s)
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Interest</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(totalInterest)}</div>
            <p className="text-xs text-muted-foreground">Expected earnings</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Current Balance</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${balanceStatus.color}`}>
              {formatCurrency(currentBalance)}
            </div>
            <Badge variant={balanceStatus.variant} className="mt-1">
              {balanceStatus.status}
            </Badge>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="loans" className="space-y-4">
        <TabsList>
          <TabsTrigger value="loans">Loans & Gains</TabsTrigger>
          <TabsTrigger value="transactions">Transactions & Balance</TabsTrigger>
        </TabsList>

        <TabsContent value="loans" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Loan Investments</CardTitle>
            </CardHeader>
            <CardContent>
              {investor.loanInvestors.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">
                  No loan investments yet
                </p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Loan Name</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Sent Date</TableHead>
                      <TableHead className="text-right">Capital</TableHead>
                      <TableHead className="text-right">Interest Rate</TableHead>
                      <TableHead className="text-right">Interest</TableHead>
                      <TableHead className="text-right">Total</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {investor.loanInvestors.map((li) => {
                      const capital = parseFloat(li.amount);
                      const rate = parseFloat(li.interestRate) / 100;
                      const interest = capital * rate;
                      const total = capital + interest;

                      return (
                        <TableRow key={li.id}>
                          <TableCell className="font-medium">
                            {li.loan.loanName}
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline">{li.loan.type}</Badge>
                          </TableCell>
                          <TableCell>
                            <Badge
                              variant={
                                li.loan.status === 'Active'
                                  ? 'default'
                                  : li.loan.status === 'Done'
                                  ? 'success'
                                  : 'destructive'
                              }
                            >
                              {li.loan.status}
                            </Badge>
                          </TableCell>
                          <TableCell>{formatDate(li.sentDate)}</TableCell>
                          <TableCell className="text-right">
                            {formatCurrency(capital)}
                          </TableCell>
                          <TableCell className="text-right">
                            {li.interestRate}%
                          </TableCell>
                          <TableCell className="text-right">
                            {formatCurrency(interest)}
                          </TableCell>
                          <TableCell className="text-right font-semibold">
                            {formatCurrency(total)}
                          </TableCell>
                        </TableRow>
                      );
                    })}
                    <TableRow className="bg-muted/50 font-semibold">
                      <TableCell colSpan={4}>Total</TableCell>
                      <TableCell className="text-right">
                        {formatCurrency(totalCapital)}
                      </TableCell>
                      <TableCell></TableCell>
                      <TableCell className="text-right">
                        {formatCurrency(totalInterest)}
                      </TableCell>
                      <TableCell className="text-right">
                        {formatCurrency(totalGains)}
                      </TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="transactions" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Transaction History</CardTitle>
            </CardHeader>
            <CardContent>
              {investor.transactions.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">
                  No transactions yet
                </p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Description</TableHead>
                      <TableHead className="text-right">Amount</TableHead>
                      <TableHead className="text-right">Balance</TableHead>
                      <TableHead>Notes</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {investor.transactions.map((transaction) => {
                      const amount = parseFloat(transaction.amount);
                      const isInflow = transaction.direction === 'In';

                      return (
                        <TableRow key={transaction.id}>
                          <TableCell>{formatDate(transaction.date)}</TableCell>
                          <TableCell>
                            <Badge variant="outline">{transaction.type}</Badge>
                          </TableCell>
                          <TableCell>{transaction.name}</TableCell>
                          <TableCell
                            className={`text-right font-medium ${
                              isInflow ? 'text-green-600' : 'text-red-600'
                            }`}
                          >
                            {isInflow ? '+' : '-'}
                            {formatCurrency(Math.abs(amount))}
                          </TableCell>
                          <TableCell className="text-right font-semibold">
                            {formatCurrency(transaction.balance)}
                          </TableCell>
                          <TableCell className="text-sm text-muted-foreground">
                            {transaction.notes || '-'}
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}


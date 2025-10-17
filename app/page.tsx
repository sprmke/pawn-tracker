import { db } from '@/db';
import { loans, loanInvestors } from '@/db/schema';
import { eq, sql } from 'drizzle-orm';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { DollarSign, TrendingUp, FileText, AlertCircle } from 'lucide-react';
import Link from 'next/link';

async function getDashboardData() {
  try {
    // Get all loans with investors
    const allLoans = await db.query.loans.findMany({
      with: {
        loanInvestors: {
          with: {
            investor: true,
          },
        },
      },
    });

    // Calculate statistics
    const totalPrincipal = allLoans.reduce(
      (sum, loan) => sum + parseFloat(loan.principalAmount),
      0
    );

    const activeLoans = allLoans.filter(loan => loan.status === 'Active').length;
    const overdueLoans = allLoans.filter(loan => loan.status === 'Overdue').length;
    
    // Calculate total interest earned
    const doneLoans = allLoans.filter(loan => loan.status === 'Done');
    const totalInterestEarned = doneLoans.reduce((sum, loan) => {
      const loanInterest = loan.loanInvestors.reduce((loanSum, li) => {
        const amount = parseFloat(li.amount);
        const rate = parseFloat(li.interestRate) / 100;
        return loanSum + (amount * rate);
      }, 0);
      return sum + loanInterest;
    }, 0);

    // Get recent loans
    const recentLoans = allLoans.slice(0, 5);

    return {
      totalPrincipal,
      activeLoans,
      overdueLoans,
      totalInterestEarned,
      recentLoans,
      totalLoans: allLoans.length,
    };
  } catch (error) {
    console.error('Error fetching dashboard data:', error);
    return {
      totalPrincipal: 0,
      activeLoans: 0,
      overdueLoans: 0,
      totalInterestEarned: 0,
      recentLoans: [],
      totalLoans: 0,
    };
  }
}

export default async function DashboardPage() {
  const data = await getDashboardData();

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-PH', {
      style: 'currency',
      currency: 'PHP',
    }).format(amount);
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground">
          Overview of your pawn business
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Total Principal
            </CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(data.totalPrincipal)}
            </div>
            <p className="text-xs text-muted-foreground">
              {data.totalLoans} total loans
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Interest Earned
            </CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(data.totalInterestEarned)}
            </div>
            <p className="text-xs text-muted-foreground">
              From completed loans
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Active Loans
            </CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.activeLoans}</div>
            <p className="text-xs text-muted-foreground">
              Currently in progress
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Overdue Loans
            </CardTitle>
            <AlertCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {data.overdueLoans}
            </div>
            <p className="text-xs text-muted-foreground">
              Needs attention
            </p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Recent Loans</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {data.recentLoans.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">
                No loans yet. <Link href="/loans/new" className="text-primary hover:underline">Create your first loan</Link>
              </p>
            ) : (
              data.recentLoans.map((loan) => (
                <Link
                  key={loan.id}
                  href={`/loans/${loan.id}`}
                  className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                >
                  <div className="space-y-1">
                    <p className="font-medium">{loan.loanName}</p>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <span>{loan.type}</span>
                      <span>•</span>
                      <span>{formatCurrency(parseFloat(loan.principalAmount))}</span>
                      <span>•</span>
                      <span>{loan.loanInvestors.length} investor(s)</span>
                    </div>
                  </div>
                  <Badge
                    variant={
                      loan.status === 'Active'
                        ? 'default'
                        : loan.status === 'Done'
                        ? 'success'
                        : 'destructive'
                    }
                  >
                    {loan.status}
                  </Badge>
                </Link>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

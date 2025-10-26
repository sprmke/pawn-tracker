import { db } from '@/db';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { DollarSign, TrendingUp, FileText, AlertCircle } from 'lucide-react';
import Link from 'next/link';
import { getLoanStatusBadge } from '@/lib/badge-config';
import { formatCurrency } from '@/lib/format';
import {
  calculateTotalPrincipal,
  calculateTotalInterest,
} from '@/lib/calculations';
import { StatCard } from '@/components/common';

async function getDashboardData() {
  try {
    // Get all loans with investors and transactions
    const allLoans = await db.query.loans.findMany({
      with: {
        loanInvestors: {
          with: {
            investor: true,
            interestPeriods: true,
          },
        },
        transactions: {
          orderBy: (transactions, { asc }) => [asc(transactions.date)],
        },
      },
    });

    // Calculate statistics
    const totalPrincipal = allLoans.reduce(
      (sum, loan) => sum + calculateTotalPrincipal(loan.loanInvestors),
      0
    );

    const activeLoans = allLoans.filter(
      (loan) =>
        loan.status === 'Fully Funded' || loan.status === 'Partially Funded'
    ).length;
    const overdueLoans = allLoans.filter(
      (loan) => loan.status === 'Overdue'
    ).length;

    // Calculate total interest earned
    const completedLoans = allLoans.filter(
      (loan) => loan.status === 'Completed'
    );
    const totalInterestEarned = completedLoans.reduce(
      (sum, loan) => sum + calculateTotalInterest(loan.loanInvestors),
      0
    );

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

  return (
    <div className="space-y-6 sm:space-y-8">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">
          Dashboard
        </h1>
        <p className="text-sm sm:text-base text-muted-foreground">
          Overview of your pawn business
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Total Principal"
          value={formatCurrency(data.totalPrincipal)}
          icon={DollarSign}
          subtitle={`${data.totalLoans} total loans`}
        />

        <StatCard
          title="Interest Earned"
          value={formatCurrency(data.totalInterestEarned)}
          icon={TrendingUp}
          subtitle="From completed loans"
        />

        <StatCard
          title="Active Loans"
          value={data.activeLoans}
          icon={FileText}
          subtitle="Currently in progress"
        />

        <StatCard
          title="Overdue Loans"
          value={<span className="text-red-600">{data.overdueLoans}</span>}
          icon={AlertCircle}
          subtitle="Needs attention"
        />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Recent Loans</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {data.recentLoans.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">
                No loans yet.{' '}
                <Link
                  href="/transactions/loans/new"
                  className="text-primary hover:underline"
                >
                  Create your first loan
                </Link>
              </p>
            ) : (
              data.recentLoans.map((loan) => (
                <Link
                  key={loan.id}
                  href={`/transactions/loans/${loan.id}`}
                  className="flex flex-col sm:flex-row sm:items-center sm:justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors gap-3"
                >
                  <div className="space-y-1 flex-1">
                    <p className="font-medium">{loan.loanName}</p>
                    <div className="flex flex-wrap items-center gap-2 text-xs sm:text-sm text-muted-foreground">
                      <span>{loan.type}</span>
                      <span>•</span>
                      <span>
                        {formatCurrency(
                          calculateTotalPrincipal(loan.loanInvestors)
                        )}
                      </span>
                      <span>•</span>
                      <span>{loan.loanInvestors.length} investor(s)</span>
                    </div>
                  </div>
                  <Badge
                    variant={getLoanStatusBadge(loan.status).variant}
                    className={getLoanStatusBadge(loan.status).className}
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

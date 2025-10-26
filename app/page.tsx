import { db } from '@/db';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  DollarSign,
  TrendingUp,
  FileText,
  AlertCircle,
  Users,
  Activity,
  ArrowUpRight,
  ArrowDownRight,
  Wallet,
} from 'lucide-react';
import Link from 'next/link';
import { getLoanStatusBadge } from '@/lib/badge-config';
import { formatCurrency } from '@/lib/format';
import {
  calculateTotalPrincipal,
  calculateTotalInterest,
  calculateInvestorStats,
} from '@/lib/calculations';
import { StatCard } from '@/components/common';
import {
  CurrencyLineChart,
  CurrencyBarChart,
  LoanTypePieChart,
} from '@/components/common/charts';
import { format, subMonths, startOfMonth, endOfMonth } from 'date-fns';

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
          orderBy: (transactions, { desc }) => [desc(transactions.date)],
        },
      },
      orderBy: (loans, { desc }) => [desc(loans.createdAt)],
    });

    // Get all investors with their data
    const allInvestors = await db.query.investors.findMany({
      with: {
        loanInvestors: {
          with: {
            loan: true,
            interestPeriods: true,
          },
        },
        transactions: {
          orderBy: (transactions, { desc }) => [desc(transactions.date)],
        },
      },
    });

    // Get all transactions
    const allTransactions = await db.query.transactions.findMany({
      with: {
        investor: true,
        loan: true,
      },
      orderBy: (transactions, { desc }) => [desc(transactions.date)],
    });

    // Calculate loan statistics
    const totalPrincipal = allLoans.reduce(
      (sum, loan) => sum + calculateTotalPrincipal(loan.loanInvestors),
      0
    );

    const totalInterestEarned = allLoans.reduce(
      (sum, loan) => sum + calculateTotalInterest(loan.loanInvestors),
      0
    );

    const activeLoans = allLoans.filter(
      (loan) =>
        loan.status === 'Fully Funded' || loan.status === 'Partially Funded'
    ).length;

    const completedLoans = allLoans.filter(
      (loan) => loan.status === 'Completed'
    ).length;

    const overdueLoans = allLoans.filter(
      (loan) => loan.status === 'Overdue'
    ).length;

    // Calculate investor statistics
    const totalInvestors = allInvestors.length;
    const activeInvestors = allInvestors.filter((inv) =>
      inv.loanInvestors.some(
        (li) =>
          li.loan.status === 'Fully Funded' ||
          li.loan.status === 'Partially Funded'
      )
    ).length;

    // Calculate transaction statistics
    const totalInflow = allTransactions
      .filter((t) => t.direction === 'In')
      .reduce((sum, t) => sum + parseFloat(t.amount), 0);

    const totalOutflow = allTransactions
      .filter((t) => t.direction === 'Out')
      .reduce((sum, t) => sum + parseFloat(t.amount), 0);

    const loanTransactions = allTransactions.filter((t) => t.type === 'Loan');
    const investmentTransactions = allTransactions.filter(
      (t) => t.type === 'Investment'
    );

    // Calculate monthly trend data (last 6 months)
    const monthlyData = [];
    for (let i = 5; i >= 0; i--) {
      const monthDate = subMonths(new Date(), i);
      const monthStart = startOfMonth(monthDate);
      const monthEnd = endOfMonth(monthDate);

      const monthTransactions = allTransactions.filter((t) => {
        const tDate = new Date(t.date);
        return tDate >= monthStart && tDate <= monthEnd;
      });

      const monthInflow = monthTransactions
        .filter((t) => t.direction === 'In')
        .reduce((sum, t) => sum + parseFloat(t.amount), 0);

      const monthOutflow = monthTransactions
        .filter((t) => t.direction === 'Out')
        .reduce((sum, t) => sum + parseFloat(t.amount), 0);

      monthlyData.push({
        month: format(monthDate, 'MMM yyyy'),
        inflow: monthInflow,
        outflow: monthOutflow,
        net: monthInflow - monthOutflow,
      });
    }

    // Loan type distribution
    const loanTypeData = [
      {
        name: 'Lot Title',
        value: allLoans.filter((l) => l.type === 'Lot Title').length,
        color: '#8b5cf6', // Purple
      },
      {
        name: 'OR/CR',
        value: allLoans.filter((l) => l.type === 'OR/CR').length,
        color: '#3b82f6', // Blue
      },
      {
        name: 'Agent',
        value: allLoans.filter((l) => l.type === 'Agent').length,
        color: '#f59e0b', // Orange
      },
    ].filter((item) => item.value > 0);

    // Loan status distribution
    const loanStatusData = [
      {
        name: 'Active',
        value: activeLoans,
        color: '#10b981', // Green
      },
      {
        name: 'Completed',
        value: completedLoans,
        color: '#6b7280', // Gray
      },
      {
        name: 'Overdue',
        value: overdueLoans,
        color: '#ef4444', // Red
      },
    ].filter((item) => item.value > 0);

    // Top investors by capital
    const investorCapitalData = allInvestors
      .map((inv) => {
        const stats = calculateInvestorStats(inv);
        return {
          name: inv.name,
          capital: stats.totalCapital,
          interest: stats.totalInterest,
        };
      })
      .sort((a, b) => b.capital - a.capital)
      .slice(0, 5);

    // Recent loans
    const recentLoans = allLoans.slice(0, 5);

    // Recent transactions
    const recentTransactions = allTransactions.slice(0, 10);

    return {
      // Overview stats
      totalPrincipal,
      activeLoans,
      overdueLoans,
      totalInterestEarned,
      totalLoans: allLoans.length,
      completedLoans,
      totalInvestors,
      activeInvestors,
      totalInflow,
      totalOutflow,
      loanTransactions: loanTransactions.length,
      investmentTransactions: investmentTransactions.length,
      // Chart data
      monthlyData,
      loanTypeData,
      loanStatusData,
      investorCapitalData,
      // Recent data
      recentLoans,
      recentTransactions,
    };
  } catch (error) {
    console.error('Error fetching dashboard data:', error);
    return {
      totalPrincipal: 0,
      activeLoans: 0,
      overdueLoans: 0,
      totalInterestEarned: 0,
      totalLoans: 0,
      completedLoans: 0,
      totalInvestors: 0,
      activeInvestors: 0,
      totalInflow: 0,
      totalOutflow: 0,
      loanTransactions: 0,
      investmentTransactions: 0,
      monthlyData: [],
      loanTypeData: [],
      loanStatusData: [],
      investorCapitalData: [],
      recentLoans: [],
      recentTransactions: [],
    };
  }
}

export default async function DashboardPage() {
  const data = await getDashboardData();
  const netCashflow = data.totalInflow - data.totalOutflow;

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

      {/* Overview Stats */}
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
          subtitle={`${data.completedLoans} completed loans`}
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

      {/* Transaction Stats */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Total Inflow"
          value={formatCurrency(data.totalInflow)}
          icon={ArrowDownRight}
          subtitle={`${data.investmentTransactions} transactions`}
          className="border-green-200 dark:border-green-900"
        />

        <StatCard
          title="Total Outflow"
          value={formatCurrency(data.totalOutflow)}
          icon={ArrowUpRight}
          subtitle={`${data.loanTransactions} transactions`}
          className="border-orange-200 dark:border-orange-900"
        />

        <StatCard
          title="Net Cashflow"
          value={
            <span
              className={netCashflow >= 0 ? 'text-green-600' : 'text-red-600'}
            >
              {formatCurrency(netCashflow)}
            </span>
          }
          icon={Wallet}
          subtitle="Total balance"
        />

        <StatCard
          title="Active Investors"
          value={`${data.activeInvestors} / ${data.totalInvestors}`}
          icon={Users}
          subtitle="Currently investing"
        />
      </div>

      {/* Charts Section */}
      <div className="grid gap-4 lg:grid-cols-2">
        {/* Monthly Cashflow Trend */}
        <CurrencyLineChart
          data={data.monthlyData}
          title="Monthly Cashflow Trend"
          xAxisKey="month"
          dataKeys={[
            { key: 'inflow', label: 'Inflow', color: '#10b981' }, // Green
            { key: 'outflow', label: 'Outflow', color: '#f59e0b' }, // Orange
            { key: 'net', label: 'Net', color: '#3b82f6' }, // Blue
          ]}
        />

        {/* Top Investors by Capital */}
        {data.investorCapitalData.length > 0 && (
          <CurrencyBarChart
            data={data.investorCapitalData}
            title="Top Investors by Capital"
            xAxisKey="name"
            dataKeys={[
              {
                key: 'capital',
                label: 'Capital',
                color: '#2563eb', // Dark Blue
              },
              {
                key: 'interest',
                label: 'Interest',
                color: '#10b981', // Green
              },
            ]}
          />
        )}
      </div>

      {/* Distribution Charts */}
      <div className="grid gap-4 lg:grid-cols-2">
        {/* Loan Type Distribution */}
        {data.loanTypeData.length > 0 && (
          <LoanTypePieChart
            data={data.loanTypeData}
            title="Loan Type Distribution"
          />
        )}

        {/* Loan Status Distribution */}
        {data.loanStatusData.length > 0 && (
          <LoanTypePieChart
            data={data.loanStatusData}
            title="Loan Status Distribution"
          />
        )}
      </div>

      {/* Recent Activity */}
      <div className="grid gap-4 lg:grid-cols-2">
        {/* Recent Loans */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Recent Loans</CardTitle>
              <Link
                href="/transactions/loans"
                className="text-sm text-primary hover:underline"
              >
                View all
              </Link>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {data.recentLoans.length === 0 ? (
                <p className="text-center text-muted-foreground py-4 text-sm">
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
                    className="flex flex-col sm:flex-row sm:items-center sm:justify-between p-3 border rounded-lg hover:bg-muted/50 transition-colors gap-2"
                  >
                    <div className="space-y-1 flex-1 min-w-0">
                      <p className="font-medium text-sm truncate">
                        {loan.loanName}
                      </p>
                      <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                        <span>{loan.type}</span>
                        <span>•</span>
                        <span>
                          {formatCurrency(
                            calculateTotalPrincipal(loan.loanInvestors)
                          )}
                        </span>
                        <span>•</span>
                        <span>
                          {
                            new Set(
                              loan.loanInvestors.map((li) => li.investor.id)
                            ).size
                          }{' '}
                          investor(s)
                        </span>
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

        {/* Recent Transactions */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Recent Transactions</CardTitle>
              <Link
                href="/transactions"
                className="text-sm text-primary hover:underline"
              >
                View all
              </Link>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {data.recentTransactions.length === 0 ? (
                <p className="text-center text-muted-foreground py-4 text-sm">
                  No transactions yet.
                </p>
              ) : (
                data.recentTransactions.map((transaction) => (
                  <Link
                    key={transaction.id}
                    href={`/transactions/${transaction.id}`}
                    className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      <div
                        className={`w-2 h-2 rounded-full flex-shrink-0 ${
                          transaction.direction === 'In'
                            ? 'bg-green-500'
                            : 'bg-orange-500'
                        }`}
                      />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">
                          {transaction.name}
                        </p>
                        <p className="text-xs text-muted-foreground truncate">
                          {transaction.investor.name}
                        </p>
                      </div>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <p
                        className={`text-sm font-semibold ${
                          transaction.direction === 'In'
                            ? 'text-green-600'
                            : 'text-orange-600'
                        }`}
                      >
                        {transaction.direction === 'In' ? '+' : '-'}
                        {formatCurrency(parseFloat(transaction.amount))}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {format(new Date(transaction.date), 'MMM dd')}
                      </p>
                    </div>
                  </Link>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

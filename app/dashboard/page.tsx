import { db } from '@/db';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  FileText,
  Users,
  ArrowUpRight,
  ArrowDownRight,
  Wallet,
  HandCoins,
  TriangleAlert,
  PiggyBank,
} from 'lucide-react';
import { formatCurrency } from '@/lib/format';
import {
  calculateTotalPrincipal,
  calculateTotalInterest,
  calculateInvestorStats,
} from '@/lib/calculations';
import {
  StatCard,
  PastDueLoansCard,
  PendingDisbursementsCard,
  MaturingLoansCard,
  PageHeader,
} from '@/components/common';
import {
  CurrencyLineChart,
  CurrencyBarChart,
  LoanTypePieChart,
} from '@/components/common/charts';
import {
  format,
  subWeeks,
  startOfWeek,
  endOfWeek,
  addDays,
  isBefore,
  isAfter,
  isFuture,
  isPast,
} from 'date-fns';
import { auth } from '@/auth';
import { eq } from 'drizzle-orm';
import { loans, investors, transactions } from '@/db/schema';

async function getDashboardData(userId: string) {
  try {
    // Get all loans with investors and transactions
    const allLoans = await db.query.loans.findMany({
      where: eq(loans.userId, userId),
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
      where: eq(investors.userId, userId),
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
      where: eq(transactions.userId, userId),
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

    // Calculate weekly trend data (last 8 weeks)
    const weeklyData = [];
    for (let i = 7; i >= 0; i--) {
      const weekDate = subWeeks(new Date(), i);
      const weekStart = startOfWeek(weekDate, { weekStartsOn: 0 }); // Sunday
      const weekEnd = endOfWeek(weekDate, { weekStartsOn: 0 });

      const weekTransactions = allTransactions.filter((t) => {
        const tDate = new Date(t.date);
        return tDate >= weekStart && tDate <= weekEnd;
      });

      const weekInflow = weekTransactions
        .filter((t) => t.direction === 'In')
        .reduce((sum, t) => sum + parseFloat(t.amount), 0);

      const weekOutflow = weekTransactions
        .filter((t) => t.direction === 'Out')
        .reduce((sum, t) => sum + parseFloat(t.amount), 0);

      weeklyData.push({
        week: format(weekStart, 'MMM dd'),
        inflow: weekInflow,
        outflow: weekOutflow,
        net: weekInflow - weekOutflow,
      });
    }

    // Loan type distribution (Pastel Colors)
    const loanTypeData = [
      {
        name: 'Lot Title',
        value: allLoans.filter((l) => l.type === 'Lot Title').length,
        color: '#fb923c', // Orange-400
      },
      {
        name: 'OR/CR',
        value: allLoans.filter((l) => l.type === 'OR/CR').length,
        color: '#818cf8', // Indigo-400
      },
      {
        name: 'Agent',
        value: allLoans.filter((l) => l.type === 'Agent').length,
        color: '#e879f9', // Fuchsia-400
      },
    ].filter((item) => item.value > 0);

    // Loan status distribution
    const fullyFundedLoans = allLoans.filter(
      (loan) => loan.status === 'Fully Funded'
    ).length;

    const partiallyFundedLoans = allLoans.filter(
      (loan) => loan.status === 'Partially Funded'
    ).length;

    const loanStatusData = [
      {
        name: 'Fully Funded',
        value: fullyFundedLoans,
        color: '#34d399', // Emerald-400
      },
      {
        name: 'Partially Funded',
        value: partiallyFundedLoans,
        color: '#fcd34d', // Amber-300
      },
      {
        name: 'Completed',
        value: completedLoans,
        color: '#38bdf8', // Sky-400
      },
      {
        name: 'Overdue',
        value: overdueLoans,
        color: '#fb7185', // Rose-400
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

    // Upcoming payments to send (unpaid loan investor transactions)
    const now = new Date();
    const unpaidLoanTransactions: Array<{
      id: number;
      loanId: number;
      loanName: string;
      investorName: string;
      amount: string;
      sentDate: Date;
    }> = [];

    allLoans.forEach((loan) => {
      loan.loanInvestors
        .filter((li) => !li.isPaid)
        .forEach((li) => {
          unpaidLoanTransactions.push({
            id: li.id,
            loanId: loan.id,
            loanName: loan.loanName,
            investorName: li.investor.name,
            amount: li.amount,
            sentDate: li.sentDate,
          });
        });
    });

    const upcomingPaymentsToSend = unpaidLoanTransactions
      .sort(
        (a, b) =>
          new Date(a.sentDate).getTime() - new Date(b.sentDate).getTime()
      )
      .slice(0, 5);

    // Upcoming payments due (loans due within next 14 days, excluding completed/overdue)
    const fourteenDaysFromNow = addDays(now, 14);
    const upcomingPaymentsDue = allLoans
      .filter((loan) => {
        const dueDate = new Date(loan.dueDate);
        return (
          (loan.status === 'Fully Funded' ||
            loan.status === 'Partially Funded') &&
          isAfter(dueDate, now) &&
          isBefore(dueDate, fourteenDaysFromNow)
        );
      })
      .sort(
        (a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime()
      )
      .slice(0, 5);

    // Overdue loans (status overdue or past due date)
    const overdueLoansData = allLoans
      .filter(
        (loan) =>
          loan.status === 'Overdue' ||
          (loan.status !== 'Completed' && isPast(new Date(loan.dueDate)))
      )
      .sort(
        (a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime()
      )
      .slice(0, 5);

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
      weeklyData,
      loanTypeData,
      loanStatusData,
      investorCapitalData,
      // Upcoming data
      upcomingPaymentsToSend,
      upcomingPaymentsDue,
      overdueLoansData,
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
      weeklyData: [],
      loanTypeData: [],
      loanStatusData: [],
      investorCapitalData: [],
      upcomingPaymentsToSend: [],
      upcomingPaymentsDue: [],
      overdueLoansData: [],
    };
  }
}

export default async function DashboardPage() {
  const session = await auth();
  if (!session?.user?.id) {
    return null; // This should never happen due to middleware protection
  }

  const data = await getDashboardData(session.user.id);
  const netCashflow = data.totalInflow - data.totalOutflow;

  return (
    <div className="space-y-6 sm:space-y-8">
      <PageHeader
        title="Dashboard"
        description="Overview of your pawn business"
      />

      <Card>
        <CardHeader>
          <CardTitle>Overview</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
            <StatCard
              title="Total Principal"
              value={formatCurrency(data.totalPrincipal)}
              icon={PiggyBank}
              subtitle={`${data.totalLoans} total loans`}
              variant="primary"
            />

            <StatCard
              title="Interest Earned"
              value={formatCurrency(data.totalInterestEarned)}
              icon={HandCoins}
              subtitle={`${data.completedLoans} completed loans`}
              variant="primary"
            />

            <StatCard
              title="Active Loans"
              value={data.activeLoans}
              icon={FileText}
              subtitle="Currently in progress"
              variant="primary"
            />

            <StatCard
              title="Overdue Loans"
              value={data.overdueLoans}
              icon={TriangleAlert}
              subtitle="Needs attention"
              variant="primary"
            />
          </div>

          <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
            <StatCard
              title="Total Inflow"
              value={formatCurrency(data.totalInflow)}
              icon={ArrowDownRight}
              subtitle={`${data.investmentTransactions} transactions`}
              variant="primary"
            />

            <StatCard
              title="Total Outflow"
              value={formatCurrency(data.totalOutflow)}
              icon={ArrowUpRight}
              subtitle={`${data.loanTransactions} transactions`}
              variant="primary"
            />

            <StatCard
              title="Net Cashflow"
              value={
                <span
                  className={
                    netCashflow >= 0
                      ? 'text-emerald-600 dark:text-emerald-500'
                      : 'text-rose-600 dark:text-rose-500'
                  }
                >
                  {formatCurrency(netCashflow)}
                </span>
              }
              icon={Wallet}
              subtitle="Total balance"
              variant="primary"
            />

            <StatCard
              title="Active Investors"
              value={`${data.activeInvestors} / ${data.totalInvestors}`}
              icon={Users}
              subtitle="Currently investing"
              variant="primary"
            />
          </div>
        </CardContent>
      </Card>

      {/* Upcoming Activity */}
      <div className="grid gap-4 lg:grid-cols-3">
        <PastDueLoansCard loans={data.overdueLoansData} />
        <PendingDisbursementsCard disbursements={data.upcomingPaymentsToSend} />
        <MaturingLoansCard loans={data.upcomingPaymentsDue} />
      </div>

      {/* Charts Section */}
      <div className="grid gap-4 lg:grid-cols-2">
        {/* Weekly Cashflow Trend */}
        <CurrencyLineChart
          data={data.weeklyData}
          title="Weekly Cashflow Trend"
          xAxisKey="week"
          dataKeys={[
            { key: 'inflow', label: 'Inflow', color: '#34d399' }, // Pastel Emerald
            { key: 'outflow', label: 'Outflow', color: '#fcd34d' }, // Pastel Amber
            { key: 'net', label: 'Net', color: '#5986f9' }, // Pastel Blue
          ]}
          emptyMessage="No weekly cashflow data"
        />

        {/* Top Investors by Capital */}
        <CurrencyBarChart
          data={data.investorCapitalData}
          title="Top Investors by Capital"
          xAxisKey="name"
          dataKeys={[
            {
              key: 'capital',
              label: 'Capital',
              color: '#5986f9', // Pastel Blue
            },
            {
              key: 'interest',
              label: 'Interest',
              color: '#34d399', // Pastel Emerald
            },
          ]}
          emptyMessage="No investors found"
        />
      </div>

      {/* Distribution Charts */}
      <div className="grid gap-4 lg:grid-cols-2">
        {/* Loan Type Distribution */}
        <LoanTypePieChart
          data={data.loanTypeData}
          title="Loan Type Distribution"
          emptyMessage="No loans found"
        />

        {/* Loan Status Distribution */}
        <LoanTypePieChart
          data={data.loanStatusData}
          title="Loan Status Distribution"
          emptyMessage="No loans found"
        />
      </div>
    </div>
  );
}

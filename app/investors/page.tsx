import { db } from '@/db';
import { investors } from '@/db/schema';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import Link from 'next/link';
import { ArrowRight, TrendingUp, DollarSign } from 'lucide-react';

async function getInvestors() {
  try {
    const allInvestors = await db.query.investors.findMany({
      with: {
        loanInvestors: {
          with: {
            loan: true,
          },
        },
        transactions: true,
      },
    });
    return allInvestors;
  } catch (error) {
    console.error('Error fetching investors:', error);
    return [];
  }
}

export default async function InvestorsPage() {
  const allInvestors = await getInvestors();

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-PH', {
      style: 'currency',
      currency: 'PHP',
    }).format(amount);
  };

  const getInvestorStats = (investor: any) => {
    const totalCapital = investor.loanInvestors.reduce(
      (sum: number, li: any) => sum + parseFloat(li.amount),
      0
    );

    const totalInterest = investor.loanInvestors.reduce(
      (sum: number, li: any) => {
        const amount = parseFloat(li.amount);
        const rate = parseFloat(li.interestRate) / 100;
        return sum + amount * rate;
      },
      0
    );

    const activeLoans = investor.loanInvestors.filter(
      (li: any) => li.loan.status === 'Active'
    ).length;

    // Get latest balance from transactions
    const latestTransaction = investor.transactions.length > 0
      ? investor.transactions.sort((a: any, b: any) => 
          new Date(b.date).getTime() - new Date(a.date).getTime()
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
    if (balance > 100000) return { status: 'Can invest', variant: 'success' as const };
    if (balance > 50000) return { status: 'Low funds', variant: 'warning' as const };
    return { status: 'No funds', variant: 'destructive' as const };
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Investors</h1>
        <p className="text-muted-foreground">
          Track investor portfolios and balances
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {allInvestors.map((investor) => {
          const stats = getInvestorStats(investor);
          const balanceStatus = getBalanceStatus(stats.currentBalance);

          return (
            <Link key={investor.id} href={`/investors/${investor.id}`}>
              <Card className="hover:shadow-lg transition-shadow h-full">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="space-y-1">
                      <CardTitle>{investor.name}</CardTitle>
                      <p className="text-sm text-muted-foreground">
                        {investor.email}
                      </p>
                    </div>
                    <ArrowRight className="h-5 w-5 text-muted-foreground" />
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <div className="flex items-center gap-1 text-muted-foreground">
                        <DollarSign className="h-3 w-3" />
                        <p className="text-xs">Total Capital</p>
                      </div>
                      <p className="text-lg font-semibold">
                        {formatCurrency(stats.totalCapital)}
                      </p>
                    </div>
                    <div className="space-y-1">
                      <div className="flex items-center gap-1 text-muted-foreground">
                        <TrendingUp className="h-3 w-3" />
                        <p className="text-xs">Total Interest</p>
                      </div>
                      <p className="text-lg font-semibold">
                        {formatCurrency(stats.totalInterest)}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-2 border-t">
                    <div className="text-sm">
                      <span className="text-muted-foreground">Loans:</span>{' '}
                      <span className="font-medium">{stats.totalLoans}</span>
                      {stats.activeLoans > 0 && (
                        <span className="text-muted-foreground">
                          {' '}({stats.activeLoans} active)
                        </span>
                      )}
                    </div>
                    <Badge variant={balanceStatus.variant}>
                      {balanceStatus.status}
                    </Badge>
                  </div>

                  <div className="pt-2 border-t">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">
                        Current Balance
                      </span>
                      <span className="text-lg font-semibold">
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
    </div>
  );
}


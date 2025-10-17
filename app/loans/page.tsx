import { db } from '@/db';
import { loans } from '@/db/schema';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { PlusCircle } from 'lucide-react';

async function getLoans() {
  try {
    const allLoans = await db.query.loans.findMany({
      with: {
        loanInvestors: {
          with: {
            investor: true,
          },
        },
      },
      orderBy: (loans, { desc }) => [desc(loans.createdAt)],
    });
    return allLoans;
  } catch (error) {
    console.error('Error fetching loans:', error);
    return [];
  }
}

export default async function LoansPage() {
  const allLoans = await getLoans();

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

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Loans</h1>
          <p className="text-muted-foreground">
            Manage all your pawn loans
          </p>
        </div>
        <Link href="/loans/new">
          <Button>
            <PlusCircle className="mr-2 h-4 w-4" />
            New Loan
          </Button>
        </Link>
      </div>

      {allLoans.length === 0 ? (
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
        <div className="grid gap-4">
          {allLoans.map((loan) => (
            <Card key={loan.id} className="hover:shadow-md transition-shadow">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <CardTitle>{loan.loanName}</CardTitle>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Badge variant="outline">{loan.type}</Badge>
                      <span>•</span>
                      <span>Due: {formatDate(loan.dueDate)}</span>
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
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div>
                      <p className="text-sm text-muted-foreground">Principal</p>
                      <p className="text-lg font-semibold">
                        {formatCurrency(loan.principalAmount)}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Interest Rate</p>
                      <p className="text-lg font-semibold">
                        {loan.defaultInterestRate}%
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Investors</p>
                      <p className="text-lg font-semibold">
                        {loan.loanInvestors.length}
                      </p>
                    </div>
                    {loan.freeLotSqm && (
                      <div>
                        <p className="text-sm text-muted-foreground">Free Lot</p>
                        <p className="text-lg font-semibold">
                          {loan.freeLotSqm} sqm
                        </p>
                      </div>
                    )}
                  </div>

                  {loan.loanInvestors.length > 0 && (
                    <div>
                      <p className="text-sm text-muted-foreground mb-2">Investors:</p>
                      <div className="flex flex-wrap gap-2">
                        {loan.loanInvestors.map((li) => (
                          <Badge key={li.id} variant="secondary">
                            {li.investor.name}: {formatCurrency(li.amount)} @ {li.interestRate}%
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}

                  {loan.notes && (
                    <div>
                      <p className="text-sm text-muted-foreground mb-1">Notes:</p>
                      <p className="text-sm">{loan.notes}</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

